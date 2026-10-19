# Design

## Context

Siehe `proposal.md` für Motivation und Umfang. `src/main.ts` ruft derzeit per `setInterval` die reine `step`-Funktion auf und zeichnet sofort das Ergebnis. `src/render.ts` konstruiert drei feste radiale Spitzen pro Tier. `src/simulation.ts` besitzt stabile Tier-IDs und klar getrennte Phasen, verliert im Endzustand aber gefressene Tiere, Jagdzuordnungen und Zwischenenergien. Ein einfacher Vergleich zweier Endzustände kann deshalb den gewünschten Ablauf nicht rekonstruieren. Die vorhandenen Tests sichern Regeln und statische Geometrie ab; der Browsercheck erwartet bisher einen sofort sichtbaren Einzelschritt.

Die bestehenden Hauptspezifikationen gestatten bereits bewegte Karnivoren. Zusätzlich zur Darstellung gilt die vom Nutzer ergänzte Platzregel für Teilungen: Eine freie Zelle genügt; bei zwei freien Zellen verlassen beide Hälften den Teilungsursprung. Normale Bewegung und teilungsbedingte Verteilung sind getrennte Ereignisse, Nachwuchs führt danach noch keinen eigenen Zug aus.

## Goals / Non-Goals

**Goals:** Deterministische, browserunabhängig prüfbare Animationsgeometrie; eindeutige Zuordnung von Jagdkontakt und Beute; eine Zeitquelle für Wiedergabe und Bedienung; weiterhin dieselben Regelresultate bei derselben Zufallsfolge.

**Non-Goals:** Neue Jagdentscheidungen, zusätzliche Bewegungskosten, Animationen für Graswachstum, Audio, Partikel, Einstellungen für Animationskurven oder eine zusätzliche Zeichenbibliothek.

## Decisions

### 1. Einen Schritt einmal berechnen und seinen Ablauf mitliefern

Eine ergänzende Transition-Funktion liefert Endzustand und eine chronologische Beschreibung der bestehenden Phasen. `step` bleibt als kompatible Schnittstelle für reine Regelaufrufe erhalten; beide verwenden dieselbe Berechnung. Ereignisse entstehen unmittelbar bei aufgelösten Bewegungen, Geburten, Toden und erfolgreichen Jagden und enthalten IDs, Quell-/Zielzellen, bei Jagd die Beute-ID sowie benötigte Form-/Energiewerte. Snapshots an Gras-, Grasfresser- und Karnivorengrenzen liefern Hintergrund und ruhende Bewohner. Jagdbeute bleibt als Kopie bis zum Kontakt im Darstellungsplan erhalten, auch wenn sie im Endzustand fehlt. Keine erneuten Zufallsaufrufe durch Renderer oder Wiedergabe.

Alternative: Endzustände differenzieren. Verworfen, da gefressene bewegte Tiere und im selben Schritt geborene Beute darin fehlen. Der Browser soll auch keine zweite Simulation ausführen, um Ereignisse zu erraten.

### 2. Reine Spitzengeometrie in Wabenkoordinaten

Ein neues Modul `src/animation.ts` übersetzt Übergang und normierte Zeit in darstellbare Formen. Drei Spitzen behalten während eines Zellwechsels ihre Identität. Führend ist die geometrisch dem Zielzentrum nächste aktuelle Spitze; Gleichstände werden über den Spitzenindex aufgelöst, die zweite und dritte folgen in zyklischer Reihenfolge. Der endgültige Stern wird so ausgerichtet, dass die erste Spitze in Bewegungsrichtung vom Zielzentrum wegweist; die anderen liegen um jeweils 120 Grad versetzt. Diese Ausrichtung bleibt als rein visueller Zustand pro Tier-ID für spätere Schritte erhalten. Beim folgenden Zug wird die nächste Spitze aus der dann tatsächlichen Form bestimmt. Initiale Tiere erhalten die bisherige Standardausrichtung; neue Hälften gehen aus der Ausrichtung ihrer gemeinsamen Ausgangsform hervor und behalten ihre jeweilige Endausrichtung.

Zuerst wird nur die führende Spitze kontinuierlich zum Zielzentrum interpoliert. Danach zieht die zweite Spitze, dann die dritte zu ihrer Endposition. Gleichzeitig wandert die erste Spitze vom Zielzentrum an die vordere Endposition. Nachziehende Spitzen bleiben bis zum Beginn ihres jeweiligen Abschnitts an ihrer Ausgangsposition. Ein kontinuierlicher innerer Bezugspunkt, beispielsweise der Schwerpunkt der drei Spitzen, trägt die drei Arme und gefüllten Keile. Die bestehende Energieabbildung bleibt auch in verformten Zuständen erhalten. Interpolation mit stetiger Kurve, etwa smoothstep; Endpunkte werden exakt getroffen.

Alternative: den ganzen Stern verschieben oder beliebig zur Bewegungsrichtung drehen. Beides würde die einzeln nachziehenden Spitzen beziehungsweise die Auswahl der wirklich nächsten Spitze nicht abbilden. Dauerhafte Pixelkoordinaten werden vermieden, damit Resize nur die Projektion verändert.

### 3. Gemeinsame Zeitachse mit Jagdkontakt bei halbem Takt

Ein Takt hat die normierte Zeit `t = 0..1`, reale Dauer `1000 / stepsPerSecond` Millisekunden. Als konkrete Ausgangsabstimmung gelten:

| Teilbewegung | Zeit im Takt |
| --- | --- |
| Grasfresser: erste Spitze bis Zielzentrum | 0 bis 0,20 |
| Grasfresser: zweite Spitze nachziehen | 0,20 bis 0,35 |
| Grasfresser: dritte Spitze nachziehen | 0,35 bis 0,50 |
| Grasfresser: erste Spitze zur vorderen Endposition | 0,20 bis 0,50 |
| Karnivor: erste Spitze bis Beutezentrum | 0,30 bis 0,50 |
| Karnivor: zweite Spitze nachziehen | 0,50 bis 0,75 |
| Karnivor: dritte Spitze nachziehen | 0,75 bis 1,00 |
| Karnivor: erste Spitze zur vorderen Endposition | 0,50 bis 1,00 |

Bei `t=0,50` ist die Grasfresserform vollständig angekommen und die Karnivorenspitze trifft genau das Beutezentrum. Die Beute wird erst an diesem Kontakt entfernt. Alle unabhängigen Bewegungen laufen parallel. Für stehende Beute gilt derselbe Kontaktzeitpunkt; erfolglose Jäger erhalten keine Bewegung. Die erste Karnivorenspitze darf beim Kontakt im Zentrum der Zielzelle liegen, obwohl ihr Körper noch an der Ausgangsseite ist: Die logische Belegung wird allein durch das Regelwerk bestimmt.

Graswachstum wird zu Beginn dargestellt. Nichtteilende Grasfresser erreichen ihr Ziel bei 0,50; teilende Grasfresser beenden ihren normalen Zug bereits bei 0,30 und teilen anschließend bis 0,50. So treffen alle Karnivorenspitzen ihre Beute bei deren endgültiger Ankunft. Teilende Karnivoren beenden ihre Jagdbewegung bei 0,80 und teilen anschließend bis 1,00; andere Karnivoren ziehen bis 1,00 nach. Karnivorenenergie steigt beim Kontakt. Schrittzahl und Populationen zeigen während des Übergangs den letzten abgeschlossenen Schritt und werden erst am Ende gemeinsam aktualisiert.

Alternative: Jagd erst nach vollständiger Grasfresseranimation starten. Verworfen, da die Spitze dann erst verspätet aufpieksen würde. Die Abschnittslängen sind eine dokumentierte Feineinstellung, während Reihenfolge und gemeinsamer Kontaktzeitpunkt verpflichtend bleiben.

### 4. Eine Wiedergabesteuerung mit explizitem laufendem Übergang

`src/main.ts` erhält eine kleine Steuerung mit letztem abgeschlossenem Zustand, optional vorbereitetem Übergang, verstrichener aktiver Zeit und Spielmodus. `requestAnimationFrame` zeichnet aus dieser Zeit; die Regelberechnung erfolgt genau einmal pro gestarteten Übergang. Pause hält den Fortschritt fest, Weiter setzt ihn fort. Einzelschritt spielt genau einen Übergang ab und hält anschließend an; währenddessen ist die Taste gesperrt. Neustart verwirft Plan, Restzeit und visuelle Ausrichtungen. Resize berechnet die Projektion aus derselben normierten Zeit neu; HMR entsorgt den Frame-Callback.

Verspätete Frames können Abschnittsgrenzen überspringen, müssen aber die daraus folgenden sichtbaren Zustände in ihrer definierten Reihenfolge auswerten und den Endzustand genau einmal übernehmen. Keine unbeschränkte Nachholschleife nach einem Hintergrundaufenthalt: Eine lange Zeitlücke beendet höchstens den aktiven Übergang, der nächste erhält einen neuen Zeitursprung. Bei regulären Frames passen alle Abschnitte in das konfigurierte Intervall. Dadurch ändern langsame Geräte gegebenenfalls den effektiven Durchsatz, aber niemals die Regeln pro Schritt.

Alternative: `setInterval` parallel zur Animation weiterlaufen lassen. Verworfen, da daraus konkurrierende Übergänge und vorzeitig verschwundene Beute entstehen könnten.

### 5. Teilung als gemeinsame Verteilung und sichtbares Auseinandergehen

Alle teilungsfähigen Tiere wählen anhand der Belegung vor der Teilungsrunde einen freien Nachbarn für die neue Hälfte und, falls vorhanden, einen zweiten unterschiedlichen freien Nachbarn für die bisherige ID. Bei nur einem Nachbarn bleibt die bisherige ID am Ursprung. Die Vorschläge werden in zufälliger Reihenfolge atomar angenommen, sofern beide beanspruchten Ziele noch frei sind. Ein Konflikt verwirft die gesamte Teilung ohne Energiehalbierung oder erneuten Zielversuch. In dieser Runde verlassene Ursprungszellen bleiben für die Zielwahl gesperrt. Erfolgreiche Hälften erhalten zunächst je die halbe Energie. Eine in eine neue Zelle ziehende Grasfresserhälfte nimmt bei Ankunft deren Gras mit Wirkungsgrad und Energiekappung auf. Die Geburtsereignisse halten die Energie vor dieser Aufnahme fest; die anschließenden Phasensnapshots enthalten die erhöhte Energie. Verbrauch und Teilungsentscheidung werden nicht wiederholt.

Geburtsereignisse enthalten zusätzlich eine Kopie der vollen Ausgangsform und der bisherigen Hälfte nach der Teilung. Snapshots nach Grasfresseraufnahme sowie nach Karnivorenverbrauch halten die Formen vor der Teilung fest. Die Darstellung lässt den vollen Stern kurz anschwellen und erzeugt danach zwei zunächst überlagerte Formen, die mit jeweils eigener Spitzenbewegung auseinandergehen. Ihre Energieform geht dabei kontinuierlich zum halben Energiewert über. Die stehenbleibende Hälfte führt keine Spitzenbewegung aus. Beide Zielausrichtungen bleiben erhalten.

Die Teilungsfenster liegen für Grasfresser bei 0,30–0,50 und für Karnivoren bei 0,80–1,00. Innerhalb eines Fensters gehört der erste kurze Abschnitt dem Anschwellen, danach folgen Vorstrecken und zweimaliges Nachziehen. Das ist eine Geburtsbewegung, keine zusätzliche eigene Aktivierung des Nachwuchses. Gefressene Hälften bleiben bis zum Jagdkontakt sichtbar. Ein normaler Zug zur Nahrung und anschließendes Auseinandergehen können die bisherige Hälfte im selben Schritt zweimal versetzen; die geänderte Regelspezifikation macht diese Ausnahme ausdrücklich.

## Risks / Trade-offs

- [Eine Spitze ist für zwei Nachbarrichtungen gleich nah] → Feste Indexregel sowie Tests aller sechs Richtungen und beider Reihenparitäten.
- [Energiegefüllte Formen überkreuzen sich während der Verformung] → Spitzenidentität und zyklische Reihenfolge erhalten; niedrige, mittlere und hohe Energie in Zwischenbildern prüfen.
- [Ereignisse verändern versehentlich Zufallsfolge oder Regeln] → Gleichheit von `step` und Übergangsfunktion mit identischen Seeds sowie vorhandene Langzeittests prüfen.
- [Verschwindende, sterbende oder neugeborene Tiere fehlen im Endzustandvergleich] → Phasendaten und Ereignisse beim Regelablauf aufzeichnen; explizite Szenarien für diese Fälle.
- [Hohe Wiedergabegeschwindigkeit verkürzt die erkennbare Schrittbewegung] → Dauer proportional skalieren; Reihenfolge und Endpunkte bleiben verbindlich. Keine künstliche Zeitdehnung, die den konfigurierten Takt im Normalbetrieb ändert.
- [Pause oder Resize verliert den Kontaktzeitpunkt] → Geometrie und Sichtbarkeit rein aus normierter Zeit berechnen, Ereignisse nicht von einzelnen gezeichneten Frames abhängig machen.

## Migration Plan

Keine Persistenzmigration und keine neue Abhängigkeit. Zuerst die kompatible Ereignisschnittstelle ergänzen, anschließend Geometrie und Wiedergabesteuerung integrieren und den Browsercheck auf das Ende eines animierten Einzelschritts warten lassen. Für Rücknahme die neue Wiedergabe durch den bisherigen `step`-Aufruf mit statischem Rendern ersetzen; Regelzustände bleiben kompatibel.

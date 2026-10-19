# Design

## Context

Siehe `proposal.md` für Motivation und Umfang. `src/simulation.ts` berechnet aktuell über `evolve` eine komplette Weltrunde mit Graswachstum, allen Grasfressern und allen Karnivoren. `Transition` enthält sieben Phasensnapshots und aufgezeichnete Aktionen. `Playback` besitzt genau einen solchen Weltübergang; `src/animation.ts` presst Bewegung, Teilung und Transfer in dessen normierte Zeit `0..1`. Diese Kopplung erzwingt gemeinsame Grenzen unabhängig von der tatsächlichen Mahlzeit.

Die vorhandenen Haltephasen und Spitzengeometrien sind wiederverwendbar. Hexnachbarn, Zeichencode, Startbelegung und Energieformen bleiben verwendbar. Die heutigen Tests prüfen dagegen teilweise ausdrücklich gemeinsame Kontakte bei `0,5`, abgeschlossene Weltrunden und vollständige Vernichtung überschüssiger Nahrung; diese Verträge werden bewusst ersetzt. Aus dem Quelltext folgt keine grundsätzliche Verlängerung der konfigurierten Rundendauer durch Teilungen; der Vorschlag adressiert die beobachtete ungleichmäßige Wirkung durch unabhängige Abläufe und überprüft zusätzlich Laufzeitkosten.

Nutzerentscheidungen: **60 Ticks je Simulationssekunde**, Energieverbrauch nach Simulationszeit und **überschüssige Nahrung erhalten**. Die übrigen nachstehenden Zahlen und Konfliktregeln sind konkrete Entwurfsentscheidungen für diesen Vorschlag.

## Goals / Non-Goals

**Goals:** Ein deterministischer Tickkern mit lokalem Aktionszustand je Tier, Zeitkosten proportional zum echten Transfer, richtige Reservierungslebensdauer und eine einzige Uhr für Regeln und Darstellung. Lange Mahlzeiten dürfen keine unbeteiligten Tiere oder das Graswachstum anhalten.

**Non-Goals:** Mehrere Threads, Timer pro Tier, Netzwerk oder Speicherung laufender Welten; neue Arten, Wegsuche oder Fluchtverhalten; identische Populationen beziehungsweise Zufallsresultate zum alten Rundenmodell. „Asynchron“ beschreibt unabhängige Bewohneraktionen innerhalb eines festen Tickkerns.

## Decisions

### 1. Feste Simulationszeit und eindeutige Einheiten

`ticksPerSecond = 60` ist eine feste Konstante. Weltzeit ist eine ganzzahlige Tickzahl. Regeln integrieren ausschließlich `dt = 1/60`, unabhängig von Realzeit und Bildrate. Ein reiner Tickaufruf liefert den nächsten Weltzustand; Aufruf mit demselben Zustand, derselben Konfiguration und derselben Zufallsquelle bleibt reproduzierbar. Wiederholte Frameabfragen verändern nichts.

| Parameter | Vorgeschlagener Startwert | Bedeutung |
| --- | --- | --- |
| `grassGrowthPerSecond` | 1 | Gras pro Zelle und Simulationssekunde |
| `energyDrainPerSecond` je Art | 2 | Energieverbrauch pro lebendem Tier und Simulationssekunde |
| `energyTransferPerSecond` | 8 | Bruttoenergie, die Nahrung pro Simulationssekunde an den Empfänger abgibt |
| `speedMultiplier` | 2 | Simulationssekunden pro Realzeitsekunde |
| Vorstoß / zweites / drittes Nachziehen | 12 / 6 / 6 Ticks | Feste Bewegungszeiten ohne Mahlzeit |
| Lokale Wartezeit / Startstaffelung | 12 / zufällig 0–11 Ticks | Abstand erfolgloser Versuche und initiale Verteilung |
| Anschwellen / Teilungsvorstoß / Nachziehen | 6 / 8 / 4 + 4 Ticks | Lokale Teilung ohne variable Mahlzeiten |

Die bisherigen Wachstums- und Verbrauchszahlen werden numerisch als Raten pro Simulationssekunde übernommen; pro Tick fallen nur je `1/60` an. Bei gleichem Standardzeitfaktor bleiben damit die früheren realzeitlichen Grundraten ungefähr erhalten. Neue Feldnamen ersetzen `grassGrowth`, `energyDrain` und `stepsPerSecond` in Anwendung und Tests; es gibt keine stillschweigende doppelte Einheiteninterpretation. Ungültige Werte, nicht ganzzahlige Bewegungszeiten und die bestehende Bedingung `growth * grassEfficiency < herbivoreDrain` werden mit gemeinsamen Zeiteinheiten geprüft.

Ein variabler Zeitschritt direkt aus `requestAnimationFrame` wäre kürzer zu implementieren, würde aber Konfliktauflösung und kurze Transfers von der Bildrate abhängig machen. Ein vollständiger Event-Queue-Kern erschwert gleichzeitig kontinuierliches Wachstum und Stoffwechsel; für das vorhandene Feld ist ein einfacher Tickkern angemessen.

### 2. Lokale Aktionen statt vorab berechneter Weltübergänge

Der neue Weltzustand enthält Bewohner, Gras, Tick, nächste ID und Reservierungen. Pro Bewohner werden Ausrichtung, nächste Bereitschaft und höchstens eine lokale Aktion geführt. Eine diskriminierte Aktion beschreibt Warten, Vorstoß, Kontakttransfer, Nachziehen, Rückziehen oder die eigene Teilungsbewegung mit absoluten Startticks, Herkunft, Ziel und gegebenenfalls Partner-ID. Der Aktionszustand gehört zum Regelmodell, nicht nur zum Renderer: Erst tatsächlicher Transfer verändert Nahrung und Energie.

Startbereitschaften werden beim Initialisieren über 0–11 Ticks verteilt. Nach einer Aktion gilt die lokale Wartezeit; ein blockiertes Tier versucht nicht innerhalb desselben Ticks beliebig oft erneut zu handeln. Geteilte Hälften können nach ihrer jeweils eigenen Ankunft und Wartezeit unabhängig beginnen, auch wenn die andere Hälfte noch Nahrung aufnimmt. Lange Transfers erzeugen weitere zeitliche Verschiebung ohne künstliche neue globale Runde.

Die bisherigen `Transition`-Phasensnapshots, `activeFrom` als Rundennummer und `AnimationPlan` einer ganzen Runde entfallen aus dem produktiven Pfad. Falls kurze Aktionsereignisse für Diagnosebilder nützlich sind, tragen sie Tick und Bewohner-ID; sie berechnen keine Zukunft vorweg. Keine zweite alte Simulationsengine als dauerhafter Kompatibilitätsmodus.

### 3. Tickreihenfolge, Belegung und Abbrüche

Ein Tick hat eine deterministische interne Reihenfolge, jedoch keine Artphasen, auf die Bewohner warten:

1. Gras um `growth/60` erhöhen und alle vor Tickbeginn lebenden Bewohner um ihre jeweilige Verbrauchsrate `/60` belasten. Tiere bei null entfernen und Reservierungen beziehungsweise Partnerbeziehungen bereinigen.
2. Bereits laufende Transfers einmal begrenzt verbuchen; danach verbrauchte Quellen entfernen und lokale Aktionen weiterschalten.
3. Fällige Bewegungs- und Teilungsgrenzen abschließen, Belegung übernehmen und nicht mehr benötigte Reservierungen freigeben.
4. Vor diesem Tick begonnene oder bereits bereite Bewohner betrachten; neue Vorschläge aus demselben Belegungsbild bilden, Konflikte über den injizierten Zufallsstrom auflösen und neue Aktionen beginnen. In diesem Tick freigegebene Zellen sind über einen Freigabetick bis zum folgenden Tick von neuen Vorschlägen ausgeschlossen. Neu entstandene Hälften werden nicht in derselben Schleife erneut ausgewertet.

Normale Züge halten die Herkunft belegt und reservieren das Ziel bis zur vollständigen Ankunft. Nach Freigabe ist die Herkunft ab dem nächsten Tick wieder verfügbar. Eine erfolgreiche Teilung reserviert ihr gesamtes Zielpaar atomar; nur dann wird am Ende des Anschwellens die dann verbleibende Energie exakt halbiert. Die Hälften erhalten eigene Identitäten und logische Zielbelegungen mit Kennzeichen für laufende Teilungsbewegung. Die Ursprungszelle bleibt, soweit erforderlich, reserviert, bis die hinausziehenden Formen sie verlassen haben. Sichtbare Überlagerung während der Geburt bedeutet keine doppelte logische Zellbelegung.

Nur der lokale Besitzer darf eine Reservierung freigeben. Tod, Abbruch und Neustart bereinigen Herkunft, Ziele und Partner. Eine fehlschlagende Teilung halbiert keine Energie. Bei jeder lebenden Hälfte läuft der Stoffwechsel ab ihrer tatsächlichen Entstehung weiter; es gibt keinen zusätzlichen pauschalen Aktionsverbrauch.

Ein Jäger reserviert genau eine Beute zusätzlich zu seiner eigenen Herkunft. Er darf bereits angekommene oder in eine erreichbare Nachbarzelle unterwegs befindliche Beute wählen. Eine beanspruchte Beute vollendet ihre laufende lokale Aktion, beginnt danach aber bis zur Auflösung der Jagd keine neue. Der Jägervorstoß wird mit ihrer tatsächlichen bevorstehenden Ankunft synchronisiert; bei bereits stehender Beute benötigt er seine normalen 12 Ticks. Laufende Aktionen werden nicht verkürzt, und unbeteiligte Tiere warten nicht mit. Unerreichbare Ziele werden nicht gewählt. Stirbt das Ziel vor Kontakt, wird ohne Transfer zurückgezogen. Stirbt es während der Entnahme, darf der überlebende Jäger anschließend in die freigewordene Zielzelle nachziehen. Stirbt der Jäger, wird eine überlebende Restbeute freigegeben und kann nach ihrer lokalen Wartezeit weiterhandeln.

### 4. Mahlzeitbudget und proportionaler Transfer

Bei Kontakt werden `sourceAtContact`, Empfängerenergie und Wirkungsgrad `η` erfasst. Das feste Bruttoaufnahmebudget ist `Q = min(sourceAtContact * η, maxEnergy - recipientEnergyAtContact)`. Bei `η=0` oder `Q<=0` gibt es keinen Transfer und keine Nahrungsentnahme. Ein Versuch beendet dennoch seine nötige Bewegung oder seinen Rückzug, bevor die nächste lokale Bereitschaft erreicht wird.

Pro Tick ist `q = min(rate/60, remainingBudget, availableSource * η, currentFreeCapacity)`. Der Empfänger erhält `q`, die Quelle verliert `q/η`. Das ist Bruttotransfer: Der zeitabhängige Verbrauch wird getrennt verbucht. Zum Beispiel bedeuten 4 Energie bei Rate 8 eine halbe Simulationssekunde beziehungsweise 30 Ticks; 8 Energie benötigen 60 Ticks. Letzte Teilmengen werden exakt begrenzt. Bei vorzeitigem Quellenverlust endet die Mahlzeit mit der tatsächlich übertragenen Menge. Der Zusammenhang `Dauer = ceil(60 * übertragene Energie / Rate)` gilt für eine ununterbrochene Mahlzeit ohne externe Beendigung, mit höchstens einem letzten Teilmengentick.

Durch Stoffwechsel neu frei werdende Empfängerkapazität erhöht `Q` nicht. Gras wächst während des Saugens weiter, aber die Mahlzeit erweitert ihr ursprüngliches Budget ebenfalls nicht: neu gewachsenes und wegen Sättigung nicht aufgenommenes Gras bleibt stehen. Ein vollständiges Verschwinden des Grassymbols ist deshalb nur bei tatsächlich null vorhandenem Gras richtig.

Bei Beute setzt sich die Quellenenergie zusätzlich durch ihren eigenen Stoffwechsel fort. Erreicht sie null, wird sie entfernt; der Jäger erhält ausschließlich bereits übertragenes `q`, keinen pauschalen Restbonus. Bleibt Beute am Budgetende lebendig, wird sie entsperrt und der Jäger zieht die führende Spitze in fester Vorstoßdauer zurück. Seine anderen Spitzen bleiben am Ausgang. Er nimmt die belegte Beutezelle nicht ein. Restbeute wird nicht als Leiche oder zusätzliche Ressource eingeführt: Sie ist weiterhin derselbe lebende Grasfresser mit ihrer verbleibenden Energie.

### 5. Darstellung mit individuellen Zeitachsen

`src/animation.ts` sampelt jede laufende Aktion anhand absoluter Tickzeit; die bestehenden Spitzenkoordinaten und gespeicherten Ausrichtungen bleiben verwendbar. Ein Vorstoß, Nachziehen oder Rückziehen hat feste Dauer. Kontakttransfer hat eine durch `Q` und Rate bestimmte Dauer und wird nicht auf ein gemeinsames Intervall gestaucht. Teilungen fügen eigene lokale Bewegung hinzu, ohne andere Bewegungen zu beschleunigen, zu verlängern oder anzuhalten.

Der Renderer erhält eine Projektion des aktuellen Weltzustands mit den lokalen Spitzenformen. Gras und Energie stammen aus tatsächlicher tickweiser Bilanzierung. Die gejagte Form skaliert mit ihrer Restenergie relativ zur Kontaktenergie; überlebende Restbeute nimmt nach dem Rückzug wieder ihre gewöhnliche Radiusform mit reduziertem Energieinhalt an, kontinuierlich während des Rückzugs. Dies hält den Energieverlust sichtbar, ohne eine dauerhafte zusätzliche Körpergrößenregel einzuführen. Bei null bleiben weder Striche noch Punkte übrig. Zwischen zwei Ticks darf ausschließlich die Darstellung interpolieren; sie darf keine Energie entnehmen, Aktion auswählen oder Zufallszahl ziehen.

### 6. Wiedergabe, Einzeltick und begrenztes Nachholen

`Playback` besitzt die Simulationsuhr und einen Akkumulator in Simulationsticks. Aktive Realzeit wird mit `speedMultiplier * 60` umgerechnet. Während normaler Wiedergabe werden alle fälligen Ticks verarbeitet; Bruchteile bleiben erhalten. Als Schutz vor Tabpausen werden höchstens 250 ms eines Realzeitdeltas angerechnet, höchstens 30 Ticks pro Frame gerechnet und der offene Rückstand auf 120 Ticks begrenzt. Überschüssige inaktive Realzeit entfällt, niemals werden Simulationsticks übersprungen oder zweimal verbucht. Bei Überlast darf Realzeittempo sinken; Ergebnisse nach gleicher Tickzahl bleiben gleich.

Pause friert Welt und Darstellung ein, Fortsetzen beginnt mit einem neuen Realzeitanker. Ein Tempowechsel rechnet verstrichene aktive Zeit zum alten Faktor ab und verändert danach nur den Faktor. Neustart verwirft die gesamte Welt samt Reservierungen, behält aber den Faktor. Einzelschritt führt aus der Pause exakt einen Tick aus und zeigt dessen fertigen Zustand, auch mitten in mehreren Aktionen. Die Statuszeile zeigt Tick, `tick/60` als Simulationszeit und aktuelle Populationen. Tempooptionen bleiben numerisch 0,25 bis 8, die Einheit wird ausdrücklich `×`. HMR entsorgt weiterhin den einzigen Framecallback und alle Listener.

### 7. Prüfstrategie und Migration der vorhandenen Tests

Reine Tests prüfen Tickraten über exakt 60 und 600 Ticks, konstante Energieübertragung mit letztem Teilmengentick, Wirkungsgrade einschließlich null, Sättigung samt Restnahrung und Tod während jeder Aktionsphase. Separate Schedulerfälle decken gleiche Ziele, sich überschneidende Teilungen, partielle Jagd samt Rückzug, Neubeginn nach Freigabe und unabhängigen Fortschritt ab. Gleicher Seed und gleiche Tickzahl müssen bei verschiedenen Framefolgen und Zeitfaktoren denselben vollständigen Weltzustand ergeben.

Geometrieprüfungen behalten alle sechs Richtungen und Ausrichtungen bei, verwenden aber lokale Startticks und Dauern. Bestehende Behauptungen über `t=0,5`, `step` als globale Runde und vollständiges Aufbrauchen jeder Quelle werden durch die neuen Verträge ersetzt. Hex- und allgemeine Rendertests bleiben bestehen. Browserfixtures zeigen nebeneinander kurze und lange Mahlzeiten, eine parallele Teilung und gleichmäßiges Graswachstum. Mindestens 36.000 Ticks testen Reservierungs- und Energieinvarianten; Laufzeitmessungen dokumentieren die Kosten bei großer Population und 8×. Die Zeitlupenseite verwendet denselben Tickkern.

## Risks / Trade-offs

- [Geänderte Populationsdynamik] → Als bewusste Regeländerung dokumentieren; Grundraten explizit konvertieren und keine Gleichheit zu alten Rundenergebnissen versprechen.
- [Partielle Jagd blockiert Zellen oder Beute dauerhaft] → Beute exklusiv beanspruchen, Rückzug als echten Zustand modellieren und jede Todes-/Abbruchgrenze mit Reservierungsinvarianten testen.
- [Sättigung führt zu endlosem Saugen wegen Stoffwechsel oder Nachwachsen] → Festes Kontaktbudget und lokale positive Wartezeit; kein laufendes Aufstocken der Mahlzeit.
- [Dauerhafte Bevorzugung kleiner IDs] → Vorschläge aus demselben Tickbild bilden und Konflikte reproduzierbar zufällig auflösen; keine zufälligen Aufrufe beim Rendern.
- [Kosten durch 60-fache Weltaktualisierung] → Keine sieben Ganzweltsnapshots pro Aktion mehr; kompakte Tickzustände, explizite Belegungs-/Reservierungsindizes und begrenzte Nachholarbeit. Erst messen, keine zusätzliche Threadarchitektur.
- [Zeitfaktor wird als Aktionsrate missverstanden] → `×`, Tickstatus, Simulationszeit und verständliche README-Beispiele verwenden; alle alten Schritte/s-Beschriftungen entfernen.

## Migration Plan

Zuerst Einheiten und Tickmodell mit Tests einführen, danach lokale Aktionen und Ressourcentransfer, dann individuelle Darstellung und Playback integrieren. Alte Weltrunden-APIs aus dem produktiven Pfad entfernen und ihre Tests gezielt ersetzen; Diagnoseansichten gemeinsam migrieren. Es existieren keine gespeicherten Welten oder veröffentlichten Verbraucher, die konvertiert werden müssen. Tests, Build, strikte Change-Validierung und Browserprüfungen bilden den Abschluss. Rollback erfolgt als gemeinsames Zurücksetzen dieser Änderung; Runden- und Tickmodelle werden nicht gemischt.

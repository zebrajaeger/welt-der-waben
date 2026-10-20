# Design

## Context

Siehe `proposal.md` zur Motivation. Die Anwendung verwendet TypeScript, Vite und Canvas 2D ohne UI-Framework. `State` in `src/simulation.ts` enthält Tick, Tiere mit Art und Energie sowie Grasmengen je Zelle. `Playback` in `src/playback.ts` verarbeitet bis zu 30 Ticks pro Browserbild; auch `toggle()` und `setSpeedMultiplier()` können Ticks nachholen. Nur im Zeichenpfad von `src/main.ts` zu messen würde deshalb Zwischenzustände verlieren.

`index.html` enthält eine native `details`-Box für Einstellungen. Das Flexlayout in `src/style.css` erhält eine mindestens 160 Pixel hohe Spielfeldfläche; `ResizeObserver` passt diese auch bei Pause an. Vitest prüft Modell und Wiedergabe, Playwright prüft den Produktionsbuild unter `/welt-der-waben/`.

## Goals / Non-Goals

**Goals:** Deterministische Messung an abgeschlossenen Ticks, begrenzter Speicher, DOM-unabhängige Berechnung und Projektion sowie klare Trennung von Simulationstempo und Diagrammzeitspanne.

**Non-Goals:** Änderungen der Ökosystemregeln, neue Konfigurationsfelder oder Formate für Einstellungsimport/-export, dauerhafte Historie, Rückwärtsnavigation und Diagrammbibliotheken.

## Decisions

### 1. Eigene Historie mit Tick-Beobachtung

Ein neues Modul `src/history.ts` berechnet aus `State` einen numerischen Datensatz aus Tick und fünf Messwerten. Es hält einen Ringpuffer für 18.001 Datensätze (300 Sekunden bei 60 Hz einschließlich Anfangsrand). Gespeichert werden ausschließlich Zahlen, keine Weltzustände. Ein Durchlauf durch Tiere und Gras summiert die aktuellen Werte; vorhandene gefangene Beute zählt mit ihrer Restenergie, grafische Teilungsformen zählen nicht zusätzlich.

`Playback` erhält einen optionalen Beobachter für abgeschlossene Zustände, ohne die bestehenden vier Konstruktorargumente umzudeuten. Ein gemeinsamer interner Fortschrittspfad für normale Ticks und Einzelschritt ruft ihn genau einmal nach jedem `compute()` auf. Dadurch werden auch Ticks erfasst, die beim Pausieren oder Tempowechsel abgearbeitet werden. Der Beobachter liest nur; Zufallsfolge und Modellzustand bleiben unberührt. `main.ts` legt die Historie an und erfasst den Anfangszustand ausdrücklich; Reset und Austausch von Playback bei Einstellungsübernahme initialisieren dieselbe laufbezogene Historie neu.

Alternative: Ein Messpunkt pro Bild wäre günstiger, aber abhängig von Tempo und Bildrate. Das Speichern vollständiger Weltzustände wäre für fünf skalare Reihen unnötig teuer. Aufnahme auch bei geschlossener Box ermöglicht spätes Öffnen; Zeichnen bleibt dann ausgesetzt.

### 2. Bewegung über Simulationssekunden pro Diagrammbreite

Die native Auswahl „Zeitspanne“ bietet 10, 30, 60, 120 und 300 Sekunden; Standard 60. Die relative Bewegung beträgt `1 / Zeitspanne` Diagrammbreiten je Simulationssekunde. Bei gleichem Simulationstempo verdoppelt 60 → 30 die Bewegung. Das bestehende Tempo beeinflusst weiterhin, wie schnell Simulationszeit in Realzeit vergeht; das Diagramm verändert dieses Tempo nicht. Diese Interpretation der gewünschten Cursorgeschwindigkeit ist als Planungsannahme festgehalten. Eine frei laufende Realzeituhr wäre bei Pause und Einzelschritt irreführend.

UI-Zustand liegt getrennt von `Config`: zwei standardmäßig gewählte Anzahlreihen, Modus „Wandernde Kurven“, Zeitspanne 60 und zunächst geschlossenes Panel. Auswahl, Modus und Zeitspanne überleben einen neuen Lauf innerhalb der Seite; Reload setzt sie zurück. Einstellungen speichern und JSON-Dateien enthalten weiterhin nur bestehende Simulationsparameter.

### 3. Reine Projektion für beide Modi

Ein neues Modul `src/history-chart.ts` trennt Zeitprojektion, Kurvensegmente, Skalen und Canvas-Zeichnen. Die Projektion verwendet ausschließlich gemessene Ticks und die gewählte Zeitspanne `W`.

- Wandernde Kurven: sichtbares Fenster `[t-W, t]`; `x=(sampleTime-(t-W))/W`. Aktuelle Werte stehen rechts, Zeit vor null bleibt leer.
- Umlaufender Cursor: `cycle=floor(t/W)`, `phase=t-cycle*W`, Cursor bei `phase/W`. Links bis zum Cursor liegen Werte des aktuellen Umlaufs, rechts davon noch nicht überschriebene Werte des vorherigen Umlaufs. Bei Start existiert dort noch keine Kurve. Die Achse zeigt absolute Simulationszeiten in beiden Abschnitten, getrennt durch den sichtbaren Cursor; ein Umlaufhinweis erläutert das Überschreiben. Am exakten Vielfachen von `W` steht der Cursor links. Kein Liniensegment verbindet verschiedene Umläufe oder überbrückt die Cursorgrenze.

Modus- und Zeitspannenwechsel bauen die Projektion aus dem erhaltenen Puffer neu auf, auch während Pause. Canvas wird vollständig aus Daten neu gezeichnet; ein persistentes Bild mit schrittweisem Löschen wäre bei Resize und Moduswechsel fehleranfälliger.

### 4. Gemeinsamer Plot mit zwei Skalen und lesbarer Legende

Anzahl links, Energie rechts, jeweils ab null und mit einem positiven Ersatzmaximum bei ausschließlich nullwertigen Reihen. Das Maximum stammt aus den sichtbaren Werten gewählter Reihen derselben Einheit. Ohne gewählte Reihe einer Einheit entfällt deren Achse. Farben orientieren sich am Feld (Karnivoren rot, Grasfresser gelb, Gras grün); durchgezogen für Anzahl und gestrichelt für Energie erlauben Unterscheidung desselben Tiertyps. Legende und aktuelle Werte sind zusätzlich beschrifteter DOM-Text und bedienen auch Benutzer ohne visuelle Canvas-Auswertung. Keine zusätzliche Live-Region mit Tickfrequenz.

Viele Rohpunkte werden erst beim Zeichnen je Pixelspalte auf erstes/letztes Datum und Min/Max reduziert, wobei Zeitreihenfolge, Umlaufgrenzen und Peaks erhalten bleiben. Rohdaten werden dadurch nicht verändert. Eine gemeinsame unbeschriftete Skala oder pro Reihe normierte Prozentwerte würde die absoluten Größen verschleiern.

### 5. Panel und Lebenszyklus

`src/history-panel.ts` kapselt DOM-Ereignisse, Auswahl und die Zeichenfläche. `index.html` erhält eine separate `details`-Box „Verlauf“ nach den Einstellungen. Native Checkboxen und Selects besitzen deutsche Labels und sichtbaren Fokus. Das Panel erhält eine begrenzte, intern scrollbar bleibende Inhaltshöhe; Chartbreite folgt dem Container, Höhe bleibt positiv und begrenzt. Der Gesamtinhalt darf bei wenig Fensterhöhe vertikal scrollen.

`main.ts` verbindet Historie und Panel mit Wiedergabe, Reset und erfolgreicher Konfigurationsübernahme. Zeichnen erfolgt bei neuen Daten nur im geöffneten Panel sowie bei Auswahl, Modus, Zeitspanne, Öffnen und Resize. Ein eigener `ResizeObserver` reagiert auf verfügbare Chartgröße; Canvas-Bitmap berücksichtigt `devicePixelRatio`. Abbruchcontroller und HMR-Aufräumen entfernen Beobachter und Listener. Die bestehende Spielfeldgrößenbeobachtung reagiert auf die zusätzliche Box; Regeln für proportionale Darstellung werden nicht geändert.

## Risks / Trade-offs

- Aggregation pro Tick kostet zusätzliche Arbeit → Ein Durchlauf je Zustandsliste, begrenzter Puffer, keine Weltkopien; Zeichnen nur offen und verdichtet. Einen langen Lauf bei 8× mit Standardwelt prüfen.
- Unterschiedliche Umläufe könnten wie gleichzeitige Werte aussehen → Getrennte Segmente, absolute Zeitlabels je Abschnitt und sichtbarer Cursor; exakte Umlaufgrenzen automatisiert prüfen.
- Zwei Skalen können missverstanden werden → Einheiten ausdrücklich benennen, Legende und aktuelle absolute Zahlen anzeigen; nur gewählte Einheiten darstellen.
- Neue Box beansprucht Platz → Beide Panels bei 1440 × 900, 360 × 740 und 360 × 480 prüfen, einschließlich Pause und beider offener Boxen.
- 300 Sekunden begrenzen die sichtbare Vergangenheit → Größte angebotene Spanne ebenfalls 300 Sekunden; keine Vollhistorie versprechen.

## Migration Plan

Keine Datenmigration: Bestehende gespeicherte Einstellungen und JSON-Dateien bleiben kompatibel. Umsetzung mit vorhandenen Build- und Pages-Prozessen ausliefern. Rücknahme durch Entfernen der neuen UI- und Historienanbindung erfordert keine Änderung gespeicherter Benutzerdaten.

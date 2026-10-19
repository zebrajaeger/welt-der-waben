# Design

## Context

Siehe `proposal.md` zur Motivation. Die aktuelle deutsche README erklärt Installation, Bedienung und Konfiguration, hat aber nur eine Zwischenüberschrift und keine Bilder. `docs/animation.md` enthält weiterführende technische Details; sein Hinweis auf halbe Startenergien ist seit dem Parameter `initialEnergy` veraltet. Die Oberfläche bleibt deutsch. Vorhandene Browserprüfungen erzeugen aktuelle Screenshots in `.browser-check/`, das absichtlich nicht versioniert wird.

## Goals / Non-Goals

**Goals:** Zwei gut lesbare Einstiegsseiten mit gleicher fachlicher Aussage, funktionierender Sprachnavigation und langlebigen relativen Bildpfaden. Screenshot-Auswahl und Erneuerung sind nachvollziehbar dokumentiert.

**Non-Goals:** UI-Lokalisierung, Übersetzung sämtlicher Entwicklerdokumente, geänderte Simulationsregeln, neue Abhängigkeiten oder eine Screenshot-Pipeline in CI.

## Decisions

### Zwei Dateien mit gleicher Gliederung

`README.md` enthält Englisch, `README.de.md` Deutsch. Direkt unter dem Projekttitel stehen relative Sprachlinks. Beide verwenden dieselbe Reihenfolge: Überblick, Screenshots, Schnellstart, Bedienung, Simulationsregeln, Einstellungen und Einheiten, Entwicklung und weitere Dokumentation. Kurze Inhaltsverzeichnisse erleichtern den Sprung zu längeren Abschnitten. Zwei vollständige Sprachblöcke in einer Datei wurden verworfen, weil dadurch der GitHub-Einstieg unnötig lang würde.

Als sichtbarer Projektname dient „Welt der Waben“ mit einer englischen Beschreibung. Die UI-Beschriftungen bleiben in beiden Bedienungstabellen wortgetreu deutsch; die englische Spalte erklärt ihre Bedeutung. Dadurch verspricht die englische README keine englische Oberfläche.

### Inhalte nach Benutzeraufgabe ordnen

Der Schnellstart nennt Node.js ab 22.12 und zeigt Installation und Entwicklungsstart als kopierbare Befehle. Bedienung und Einstellungsaktionen erhalten Tabellen. Die Unterscheidung von Übernehmen, Speichern, Standardwerte, Neustart und sofortigem Tempo wird ausdrücklich erhalten. Die Einheiten erklären 60 Ticks/s, Wachstums-/Verbrauchsraten und energieabhängige Transferdauer.

Die Konfigurationstabelle gruppiert die tatsächlich vorhandenen Felder statt 24 Einzelwerte mehrfach ausführlich zu beschreiben. Startenergie je Art, Grenzregeln, Standardwerte, lokale Speicherung und die alte Speicherkompatibilität bleiben auffindbar. Technische Implementierungsdetails verweisen auf `docs/animation.md`, dessen veraltete Startenergiebeschreibung korrigiert wird. Die lokale Zeitlupenansicht wird als Pfad unter dem laufenden Vite-Server bezeichnet; keine öffentliche Demo wird behauptet.

### Echte aktuelle Screenshots als gemeinsame Assets

Mindestens zwei PNGs unter `docs/images/` werden in beiden Sprachen verwendet: `simulation.png` zeigt eine repräsentative Desktopübersicht; `settings.png` zeigt die geöffnete Einstellungsbox mit sichtbaren Parametern beziehungsweise Aktionen. Aufnahmen stammen aus der aktuellen laufenden Anwendung in einem isolierten Browserkontext ohne persönliche gespeicherte Einstellungen. Die Simulation wird für die Aufnahme pausiert. Keine generierten Illustrationen und keine nachträgliche Veränderung der UI.

Vorhandene Browserprüfungen können aktuelle Ausgangsaufnahmen liefern; bei ungeeignetem Ausschnitt werden die passenden Zustände über die reale Oberfläche aufgenommen. Die Dokumentation nutzt relative Bildpfade und passende Alt-Texte und Bildunterschriften je Sprache. Nur ausgewählte Bilder werden aus dem ignorierten Arbeitsverzeichnis übernommen; die Ignore-Regel bleibt bestehen. Extern gehostete Bilder wurden wegen ihrer zusätzlichen Abhängigkeit verworfen.

`docs/screenshots.md` beschreibt lokale Voraussetzungen, Fenstergröße, UI-Schritte und Zielpfade zur Erneuerung. Diese kurze Anleitung dient der Bildpflege und benötigt keine Produktionscodeänderung.

### Prüfung proportional zur Dokumentationsänderung

Markdown-Dateien werden gerendert oder in einer Markdown-Vorschau auf Überschriften, Tabellen und Bilddarstellung geprüft; beide Sprachlinks und alle lokalen Datei-/Bildziele werden kontrolliert. Inhalt und Parameter werden mit `package.json`, `src/config.ts` und den vorhandenen UI-Beschriftungen abgeglichen. Screenshots werden visuell auf Lesbarkeit und den aktuellen Layoutstand geprüft. Es gibt keine zusätzlichen Unit-Tests für Textstruktur und keinen erneuten Simulations-Langlauf allein wegen Prosaänderungen.

## Risks / Trade-offs

- [Sprachfassungen entwickeln sich auseinander] → Gleiche Gliederung und abschließender direkter Vergleich von Befehlen, Bedienung und Einheiten.
- [Screenshots veralten] → Gemeinsame Assets und kurze Anleitung zur Erneuerung; aktuelle Aufnahme bei der Umsetzung prüfen.
- [Große Bilder erschweren GitHub-Lektüre] → Zwei gezielte Desktopaufnahmen in angemessener Auflösung statt einer vollständigen Browser-Testgalerie.
- [Lange Einstellungen passen nicht vollständig in ein Bild] → Gezielter Ausschnitt mit verständlicher Bildunterschrift; alle Werte bleiben in der Textdokumentation beschrieben.

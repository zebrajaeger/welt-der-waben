# Proposal

## Why

Die bisherige README besteht überwiegend aus langen deutschen Absätzen und bietet keine Bilder. Ein klar gegliederter Einstieg auf Englisch und Deutsch soll das Projekt auf GitHub verständlich vorstellen und Installation, Bedienung und Einstellungen schnell auffindbar machen.

## What Changes

- `README.md` wird die englische Einstiegsseite; `README.de.md` bietet den inhaltlich gleichwertigen deutschen Einstieg. Beide beginnen mit einem gegenseitigen Sprachlink.
- Beide Fassungen erhalten dieselbe Struktur: Projektüberblick, Screenshots, Schnellstart, Bedienung, Simulationsregeln, Einstellungen und Einheiten sowie Entwicklung und weiterführende Dokumentation.
- Mindestens zwei aktuelle echte Screenshots zeigen das Spielfeld und die geöffnete Einstellungsbox. Sie werden unter `docs/images/` versioniert und mit relativen Links, sprachgerechten Bildbeschreibungen und Bildunterschriften eingebunden.
- Bedienung und Einstellungsaktionen werden übersichtlich tabellarisch erklärt. Die englische Fassung nennt die tatsächlichen deutschen UI-Beschriftungen neben ihren Erläuterungen, damit Nutzer die Schaltflächen finden.
- Bestehende Informationen zu 60 Ticks/s, asynchronen Aktionen, Energieübertragung, Teilung, Startenergie, lokalem Speichern und proportionaler Flächennutzung bleiben fachlich korrekt erhalten.
- Schnellstart und Entwicklerbefehle werden als kopierbare Codeblöcke dargestellt. Lokale Demo-Adressen werden als lokale Entwicklungsansicht erklärt. Der veraltete Hinweis auf grundsätzlich halbe Startenergien in `docs/animation.md` wird korrigiert.

## Capabilities

### New Capabilities

Keine. Dies ist eine reine Dokumentationsänderung; `.openspec.yaml` setzt `skip_specs: true`.

### Modified Capabilities

Keine Änderungen an Laufzeitverhalten, Simulation oder Verhaltensspezifikationen.

## Impact

Betroffen sind `README.md`, die neue `README.de.md`, versionierte Screenshot-Dateien unter `docs/images/` und eine fachliche Korrektur in `docs/animation.md`. Vorhandene Browserprüfungen erzeugen bereits Bilder unter dem ignorierten Verzeichnis `.browser-check/`; für die Dokumentation werden nur bewusst ausgewählte, aktuelle Aufnahmen übernommen. Screenshot-Erzeugung und Prüfvorgehen werden kurz dokumentiert. Keine UI-Übersetzung, neuen Simulationsfunktionen, externen Bilddienste, neuen Laufzeitabhängigkeiten oder automatische Veröffentlichung.

# Proposal

## Why

Die Oberfläche ist derzeit vollständig deutsch; Texte und deutsche Zahlenformate sind über HTML, UI-Module und Fehlerbehandlung verteilt. Englisch als Standardsprache mit automatischer Browserauswahl und separaten Sprachdateien macht die Anwendung international nutzbar und weitere Übersetzungen leichter ergänzbar.

## What Changes

- Englisch wird Standard- und Rückfallsprache; Deutsch bleibt vollständig verfügbar.
- Eine abgesetzte Sprachwahl ganz oben rechts zeigt ein Globus-Symbol, Flaggen und Eigennamen der Sprachen. Die Wiedergabesteuerung bleibt rechtsbündig neben der Überschrift und rückt nur um den Platz für die Sprachwahl nach links. Manuelle Auswahl wirkt sofort ohne Neustart und wird getrennt von den Simulationsparametern im Browser gespeichert; sie hat Vorrang vor Browserpräferenzen.
- Beim Seitenstart wird die erste unterstützte Sprache aus den Browserpräferenzen gewählt, einschließlich regionaler Varianten wie `de-CH` und `en-GB`; ohne passenden Eintrag wird Englisch verwendet.
- `i18next` erhält separate JSON-Dateien pro Sprache. Übersetzungsdateien werden beim Build lokal eingebunden, ohne Übersetzungsserver oder CDN.
- Alle Anwendungstexte werden übersetzbar: statische Oberfläche, dynamische Status-/Fehlertexte, Einstellungen, Diagramm, Tooltip, Titel, Hilfetexte und zugängliche Beschriftungen.
- Zahlenformatierung folgt der gewählten Sprache. Präzision, feste Zahlenfelder, kompakte Diagrammansicht und Σ vor den Energiesummen bleiben erhalten.
- Eine Anleitung und Katalogprüfungen beschreiben das Ergänzen weiterer Sprachen ohne Änderungen an Simulation oder UI-Logik.

## Capabilities

### New Capabilities

- `localization`: Sprachkataloge, Englisch-Fallback, automatische Browserauswahl und vollständige Lokalisierung der Anwendung.

### Modified Capabilities

- `simulation-presentation`: Lokalisierte Tempoauswahl und Quellcode-Link-Beschriftung statt ausschließlich deutscher Beschriftungen.
- `simulation-settings`: Lokalisierte Parameterbeschriftungen, Zustände und Fehlermeldungen bei unverändertem Datenformat.
- `simulation-history`: Sprachabhängige Zahlenformate und Tooltip-Beschriftungen statt fest vorgeschriebener deutscher Schreibweise.

## Impact

Betroffen sind `index.html`, `vite.config.ts`, UI-Module, Zahlenformatierung, Parameter-/Fehlerbeschreibungen und zugehörige Tests. Hinzu kommen `src/i18n.ts`, `src/locales/en.json`, `src/locales/de.json`, die Laufzeitabhängigkeit `i18next`, eine Sprachwahl mit lokal eingebundenen Flaggen und eine Übersetzungsanleitung. README-Sprachfassungen, Screenshot-Anleitung und vorhandene Browserchecks werden angepasst. Gespeicherte Einstellungen, JSON-Versionen, Parameterpfade und Simulationsregeln bleiben kompatibel. Zunächst werden nur Englisch und Deutsch geliefert; bei blockiertem Speicher bleibt die manuelle Auswahl für den aktuellen Besuch nutzbar.

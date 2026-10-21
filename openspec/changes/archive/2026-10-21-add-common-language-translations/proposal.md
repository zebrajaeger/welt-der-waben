# Proposal

## Why

Die vorhandene i18next-Oberfläche unterstützt bislang nur Englisch und Deutsch. Ein weltweit nutzbares Sprachpaket soll die gesamte Anwendung für mehr Besucher zugänglich machen und auch unterschiedliche Schriftsysteme zuverlässig darstellen.

## What Changes

- Das bestätigte Paket umfasst insgesamt 30 Katalogsprachen: `en`, `de`, `fr`, `es`, `it`, `pt`, `nl`, `pl`, `cs`, `uk`, `ru`, `tr`, `el`, `ro`, `hu`, `sv`, `da`, `fi`, `nb`, `ar`, `he`, `hi`, `bn`, `zh-Hans`, `zh-Hant`, `ja`, `ko`, `id`, `vi`, `th`.
- 28 neue vollständige JSON-Sprachdateien übersetzen sämtliche Anwendungs-, Status-, Fehler-, Diagramm- und zugänglichen Texte. Sprach-Eigennamen und lokal eingebundene Flaggen machen die Auswahl erkennbar.
- Browserpräferenzen werden auch Schriftvarianten zugeordnet: insbesondere vereinfachtes und traditionelles Chinesisch sowie norwegisches Bokmål. Gespeicherte manuelle Wahl hat weiterhin Vorrang; Englisch bleibt Standard und Fallback.
- Die Sprachliste wird bei vielen Einträgen begrenzt und scrollbar. Alle Sprachen bleiben per Maus, Touch und Tastatur erreichbar; der aktive Eintrag wird beim Öffnen sichtbar.
- Arabisch und Hebräisch erhalten passende Schreibrichtung und gemischte Text-/Zahlendarstellung. Der Sprachbutton bleibt physisch rechts; Steuerelemente bleiben daneben auf gleicher Höhe. Diagrammzeit, Achsenseiten und Simulation werden nicht gespiegelt.
- Zahlenpräzision, kompakte Darstellung, sofortiger Sprachwechsel und Zustandserhalt gelten für alle Sprachen. Prüfungen und Dokumentation werden auf das größere Paket erweitert.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `localization`: Festes weltweites Paket, Schriftvarianten, vollständige Kataloge, lange Sprachliste und Rechts-nach-links-Darstellung bei unverändertem Sprachwechsel- und Speicherverhalten.

## Impact

Betroffen sind `src/locales/`, `src/flags/`, Sprachauflösung und Dokumentübersetzung in `src/i18n.ts`, die Auswahl in `src/language-control.ts`, HTML/CSS sowie bei Bedarf Zahlenausgabe und Canvas-/Tooltip-Beschriftungen. Katalog-, Zahlenformat- und Browserprüfungen sowie `docs/i18n.md` und beide READMEs werden erweitert. Die bestehende Bibliothek und lokale statische Auslieferung bleiben erhalten; zusätzliche Übersetzungsdienste, automatisch nachgeladene Webfonts, README-Übersetzungen in 30 Sprachen und weitere regionale Kataloge gehören nicht zum Umfang. Einstellungen, JSON-Dateiformat und Simulationsmodell ändern sich nicht.

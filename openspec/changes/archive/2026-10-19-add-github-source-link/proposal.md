# Proposal

## Why

Von der Simulation aus fehlt ein direkter Weg zum Quellcode. Der Link soll auffindbar sein, ohne die für das Spielfeld verfügbare Höhe zu verkleinern.

## What Changes

- Ein kleines GitHub-Symbol neben der vorhandenen Kopfzeile „Ein kleines Ökosystem“ verlinkt auf `https://github.com/zebrajaeger/welt-der-waben`.
- Der Link öffnet das Repository in einem neuen Tab und erhält eine verständliche zugängliche Beschriftung sowie einen sichtbaren Tastaturfokus.
- Die Einbindung benötigt keine zusätzliche Zeile, erhöht den Kopfbereich nicht und überdeckt weder Text noch Bedienelemente oder Spielfeld; dies gilt auch bei 360 Pixel Fensterbreite.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `simulation-presentation`: Direkt erreichbarer Quellcode-Link ohne zusätzlichen vertikalen Platzbedarf.

## Impact

- `index.html` und `src/style.css`: semantischer Link mit lokal eingebettetem Symbol und kompakter Platzierung im vorhandenen Titelbereich.
- Produktions-Browserprüfung: Linkziel, Tastaturbedienung und unveränderte Layoutmaße bei breiten und schmalen Fenstern prüfen.
- `README.md` und `README.de.md`: kurzen Bedienhinweis ergänzen.
- Keine zusätzlichen Pakete, extern geladenen Symbole oder Änderungen an Simulation, Einstellungen und Deployment.

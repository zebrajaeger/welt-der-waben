# Spec Delta

## ADDED Requirements

### Requirement: Direkt erreichbarer GitHub-Quellcode
Die Oberfläche SHALL einen sichtbaren kompakten Link auf `https://github.com/zebrajaeger/welt-der-waben` anbieten. Er SHALL das Repository in einem neuen Tab öffnen und die Simulationsseite erhalten. Der Link SHALL ohne zusätzliche externe Ressourcen erkennbar, per Tastatur aktivierbar und mit sichtbarem Fokus sowie dem zugänglichen Namen „Quellcode auf GitHub (neuer Tab)“ versehen sein.

#### Scenario: Quellcode öffnen
- **WHEN** Benutzer den GitHub-Link mit Zeigegerät oder per Tastatur aktivieren
- **THEN** öffnet sich das Repository in einem neuen Tab und die Simulationsseite bleibt geöffnet
- **AND** werden weder Einstellungen übernommen oder gespeichert noch ein Neustart oder ein Wechsel des Pausenmodus ausgelöst
- **AND** weist die zugängliche Beschriftung auf GitHub und den neuen Tab hin

### Requirement: Quellcode-Link ohne zusätzlichen vertikalen Platzbedarf
Der Quellcode-Link SHALL in den vorhandenen Kopfbereich passen, ohne dessen Höhe zu erhöhen, eine zusätzliche Zeile zu erzeugen oder die Zeichenfläche zu verkleinern. Er SHALL Text, Bedienelemente und Spielfeld nicht überdecken. Bei breiten Fenstern und ab 360 CSS-Pixel Fensterbreite SHALL er sichtbar und erreichbar bleiben, ohne horizontales Seitenscrolling zu verursachen. Dies SHALL auch mit geöffneten Einstellungen gelten.

#### Scenario: Gleichbleibende Spielfeldhöhe
- **WHEN** die Oberfläche bei 1440 × 900, 360 × 740 oder 360 × 480 CSS-Pixel mit jeweils gleichem Einstellungszustand angezeigt wird
- **THEN** sind Kopfhöhe und Höhe der Zeichenfläche mit sichtbarem Link gegenüber dem bisherigen Layout ohne Link bis auf höchstens einen CSS-Pixel gleich
- **AND** bleibt der Link innerhalb des Fensters, ohne sichtbaren Text oder andere Bedienelemente zu überdecken
- **AND** gelten die bestehenden Regeln für proportionale Spielfelddarstellung und erreichbare Bedienung weiterhin

#### Scenario: Fokus und geöffnete Einstellungen
- **WHEN** Benutzer bei geöffneten oder geschlossenen Einstellungen den Link per Tab fokussieren
- **THEN** bleiben Symbol und Fokusmarkierung sichtbar und der Link lässt sich ohne horizontales Scrollen aktivieren
- **AND** werden durch den Fokus keine neue Zeile und keine Größenänderung des Kopfbereichs ausgelöst

# Design

## Context

Siehe `proposal.md` für Motivation und Umfang. In `index.html` existiert bislang kein `rel="icon"`; auch ein `public/`-Verzeichnis ist nicht vorhanden. Vite verwendet produktiv `/welt-der-waben/`, während `npm run dev` den Wurzelpfad nutzt. `e2e/production.pw.ts` prüft bereits den echten Build unter dem Pages-Unterpfad.

Die Darstellung in `src/render.ts` nutzt für Carnivoren `#ff7b87` und eine aus drei Spitzen aufgebaute Form. `drawShape` berechnet bei Energieanteil 0,5 die Keilfüllung als `(0,5 − 0,1) / 0,75 = 8/15`; dies ist keine Halbierung einer voll gefüllten Dreiecksfläche. `starPoints` in `src/animation.ts` richtet die erste Spitze nach oben aus. Die vorhandenen Waben sind ebenfalls mit einer Spitze nach oben orientiert.

## Goals / Non-Goals

**Goals:** Ein kleines, scharfes Tab-Icon, dessen feste Geometrie den bestehenden 50-%-Carnivoren wiedergibt und dessen Ressource beide vorhandenen Basisadressen unterstützt.

**Non-Goals:** Keine dynamische Energieanzeige im Tab, keine neuen Installations-/Touch-Icons, kein Manifest, keine Änderung der Canvas-Zeichenfunktionen oder Simulationsregeln.

## Decisions

### Statisches SVG als lokales Quellasset

Ein neues `src/favicon.svg` erhält eine quadratische `viewBox`, beispielsweise 64 × 64, mit einer mittigen spitzenorientierten Wabe. Der Hintergrund innerhalb der Wabe folgt der dunklen Spielfeldfläche (`#14251f`), der Rand erhält ausreichend Kontrast aus der bestehenden UI-Palette. Außerhalb der Wabe bleibt das SVG transparent. Randstärke und Innenabstände werden bei 16, 32 und 48 Pixeln visuell kontrolliert.

Der Carnivore übernimmt `#ff7b87`, die drei ruhenden Spitzen und die Keilfüllung 8/15 aus dem bestehenden Renderer; die Tiergröße orientiert sich am bisherigen Verhältnis 0,73 zum Wabenradius. Die deterministischen Pfade werden einmalig als SVG hinterlegt, mit einem kurzen Herkunfts-/Energiekommentar im Asset. Eine ausreichend große Ansicht dient dem Vergleich mit `drawAnimal(..., 0.5, colors.carnivore)`; keine neue Rendering-Abstraktion ist für dieses einzelne Asset nötig.

Ein Rasterbild wäre bei kleinen und hochauflösenden Darstellungen weniger flexibel. Eine Laufzeitgenerierung per Canvas würde unnötig JavaScript und Initialisierung voraussetzen. Ein zusätzlicher Bildgenerierungsdienst ist für diese vorhandene geometrische Form nicht erforderlich.

### HTML-Verknüpfung über Vites Asset-Verarbeitung

`index.html` verknüpft das Quellasset mit `rel="icon"`, `type="image/svg+xml"` und `sizes="any"`. Die Referenz wird von Vite als lokales Asset verarbeitet, sodass der Produktionspfad die konfigurierte Basis enthält und Änderungen eine neue Asset-URL erhalten können. Ein hart codierter Ursprungspfad `/favicon.svg` wäre unter dem Repository-Unterpfad fehleranfällig.

### Gezielte Prüfung der tatsächlichen Ressource

Eine Produktionsprüfung in `e2e/production.pw.ts` liest die Icon-Verknüpfung aus dem ausgelieferten HTML und ruft genau diese URL ab. Sie prüft Ursprung und Unterpfad, erfolgreichen Status, SVG-Bildtyp und die Dekodierbarkeit als Bild. Dadurch fällt auch eine falsche URL auf, die vom Server lediglich mit der HTML-Startseite beantwortet wird. Für die Sichtprüfung wird das tatsächliche Asset auf hellen und dunklen Flächen in den vorgesehenen kleinen Größen dargestellt; Browserchrome muss dafür nicht automatisiert fotografiert werden. Ein kurzer Entwicklungs-Smoke prüft zusätzlich die Verknüpfung am Wurzelpfad.

## Risks / Trade-offs

- Dünne Wabenkanten oder verschmelzende Sternkeile bei 16 Pixeln → Rand und Innenabstände anhand echter kleiner Renderings abstimmen; den Energieanteil 0,5 beibehalten.
- Statische Pfade können bei späteren Änderungen am Tierstil abweichen → Herkunft und verwendeten Energieanteil im Asset festhalten; bei Stiländerungen erneut mit dem Renderer vergleichen.
- Browser cachen Favicons teils lange → die von Vite verarbeitete Asset-URL nutzen und die Prüfung mit frischem Browserkontext ausführen.
- SVG-Favicons setzen die bereits angesprochene moderne Browserumgebung voraus → kein zusätzliches Legacy-ICO-Paket für diesen Change.

## Migration Plan

Asset und HTML-Verknüpfung werden zusammen mit dem normalen Produktionsbuild ausgeliefert. Es gibt keine Datenmigration. Ein Rückbau entfernt die Verknüpfung und das Asset; gespeicherte Einstellungen und Sprachpräferenzen sind davon unabhängig.

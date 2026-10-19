# Proposal

## Why

Bewohner wechseln ihre Zelle derzeit ohne sichtbaren Übergang. Eine Bewegung über die drei Spitzen soll das Fortbewegen nachvollziehbar machen und die Jagd als gezieltes Aufpieksen des gerade angekommenen Grasfressers zeigen.

## What Changes

- Beide Arten erhalten eine verformende Bewegung: Die dem Ziel nächste Spitze streckt sich bis zum Zentrum der Nachbarzelle; anschließend ziehen die beiden anderen Spitzen nacheinander nach. Dabei wandert die erste Spitze weiter auf ihre endgültige, vom Ausgangsfeld am weitesten entfernte Position.
- Erfolgreiche Karnivoren stimmen ihren ersten Spitzenkontakt auf die vollständige Ankunft des Grasfressers ab. Die Beute bleibt bis zum Kontakt sichtbar; danach folgt der Karnivorenkörper in derselben Bewegungsform.
- Darstellung erhält zeitlich zugeordnete Bewegungen, Jagdereignisse und Zwischenzustände einschließlich gefressener oder im selben Schritt geborener Bewohner.
- Teilung wird sichtbar: Aus dem energiereichen Tier entstehen zwei gleich energiereiche Hälften. Bei zwei oder mehr freien Nachbarn ziehen beide in verschiedene Nachbarzellen; bei genau einem bleibt eine Hälfte am Ursprung. Ohne freie Zelle findet keine Teilung statt.
- Hinausziehende Grasfresserhälften nehmen bei Ankunft das Gras ihrer Teilungszelle auf, gewinnen dessen Energie und leeren die Zelle sichtbar. Es gibt keinen zweiten Verbrauch und keine Kaskadenteilung im selben Schritt.
- Animationen passen in einen logischen Wiedergabetakt und unterstützen Pause, Weiter, Einzelschritt, Neustart und Größenänderungen ohne Sprünge oder zusätzliche Regelberechnungen.
- Ziele, Jagderfolg und Energie bleiben maßgeblich; die Teilung erweitert die Belegungsregel um die gemeinsam aufgelöste Verteilung beider Hälften. Visuelle Zwischenformen ändern keine Zellbelegung.

## Capabilities

### New Capabilities

Keine; die Erweiterung gehört zur bestehenden Browserdarstellung.

### Modified Capabilities

- `simulation-presentation`: Bewegung über drei Spitzen, zeitlich synchronisierte Jagddarstellung und animierte Wiedergabe mit bestehenden Bedienelementen.
- `ecosystem-rules`: Zwei freie Zellen führen zu zwei auseinanderziehenden Hälften; eine freie Zelle genügt weiterhin für Teilung mit einer stehenbleibenden Hälfte.

## Impact

- `src/simulation.ts`: ergänzende, deterministische Phasen- und Jagdereignisse; die bestehende `step`-Schnittstelle und Regelresultate bleiben kompatibel.
- `src/render.ts`: parametrisierte Spitzengeometrie und Darstellung von Zwischenzuständen; neue browserunabhängige Animationslogik.
- `src/main.ts`: Wiedergabe mit Frame-Zeit statt sofortigem Zeichnen nach `setInterval`; Verwaltung eines laufenden Übergangs.
- Regel-, Geometrie-, Zeitablauf- und Browsertests, insbesondere `tests/render.test.ts`, `tests/simulation.test.ts` und `scripts/browser-check.mjs`; Bedienhinweise in `README.md`.
- Keine zusätzliche Laufzeitbibliothek erforderlich.

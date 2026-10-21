# Spec Delta

## ADDED Requirements

### Requirement: Wiedererkennbares Browser-Favicon
Die Anwendung SHALL ein eigenes Browser-Favicon mit einer einzelnen Wabe und einem mittigen Carnivoren bei 50 % seiner Maximalenergie bereitstellen. Farbe und dreizackige Zwischenform SHALL der Simulationsdarstellung entsprechen. Das Motiv SHALL bei 16 × 16 und 32 × 32 Pixeln auf hellen und dunklen Browserflächen erkennbar bleiben und unabhängig von Sprache, Schreibrichtung und aktuellem Simulationszustand gleich aussehen.

#### Scenario: Motiv mit halber Energie
- **WHEN** das Browser-Icon dargestellt wird
- **THEN** zeigt es eine einzelne sechseckige Wabe mit einem rosa Carnivoren in der 50-%-Energieform
- **AND** ist der Carnivore als teilweise gefüllter dreizackiger Stern erkennbar
- **AND** bleiben Wabenrand und Tier innerhalb der Iconfläche ohne abgeschnittene Spitzen sichtbar

#### Scenario: Kleine Darstellung und Sprachwechsel
- **WHEN** das Icon mit 16 × 16 oder 32 × 32 Pixeln auf heller oder dunkler Fläche angezeigt und die Anwendungssprache umgeschaltet wird
- **THEN** bleibt das Waben-/Carnivorenmotiv erkennbar und unverändert

### Requirement: Lokale Auslieferung des Browser-Icons
Das Browser-Favicon SHALL im Dokumentkopf verknüpft und als lokale statische Ressource ausgeliefert werden. Es SHALL bei direktem Aufruf und Neuladen sowohl im Entwicklungsbetrieb am Wurzelpfad als auch im Produktionsbetrieb unter `/welt-der-waben/` erreichbar sein und ohne externe Dienste oder Laufzeitgenerierung auskommen.

#### Scenario: Produktionsbuild unter Repository-Pfad
- **WHEN** die gebaute Anwendung unter `/welt-der-waben/` geöffnet oder neu geladen wird
- **THEN** verweist der Dokumentkopf auf das eigene Icon innerhalb dieses Unterpfads
- **AND** wird das Icon erfolgreich als Bild statt als HTML-Fallback geladen

#### Scenario: Lokale Entwicklung
- **WHEN** die Anwendung mit dem vorhandenen Entwicklungsbefehl am Wurzelpfad geöffnet wird
- **THEN** lässt sich dasselbe Icon über seine Dokumentverknüpfung laden

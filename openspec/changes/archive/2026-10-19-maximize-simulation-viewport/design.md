# Design

## Context

Siehe `proposal.md` zur Motivation. `src/style.css` begrenzt `main` auf 1500 Pixel und zentriert den Inhalt. `src/main.ts` übergibt an `layout` die Containerbreite und `max(220, innerHeight - 270)`. Diese Höhenreserve berücksichtigt weder die neue Einstellungsbox noch tatsächliche Umbrüche und Meldungen. Der Feldcontainer erhält seine Höhe bisher vom Canvas.

`src/render.ts` passt das Raster bereits mit einem gemeinsamen Radius in Breite und Höhe ein. Ein umlaufender Abstand von sechs Pixeln ist in den Rückgabemaßen enthalten. Das Canvas wird passend zum Gerätepixelfaktor gerastert. `ResizeObserver` beobachtet den Feldcontainer; Pause beendet die Animationsschleife, Größenänderungen zeichnen separat neu. Bestehende Geometrietests prüfen vollständige Sichtbarkeit, jedoch keine maximale Flächennutzung. Browserprüfungen decken Pause, Resize, Einstellungen und HMR ab.

## Goals / Non-Goals

**Goals:** Eine vom Canvas unabhängige, aus dem Seitenlayout bestimmte verfügbare Fläche; mathematisch maximale proportionale Einpassung; stabile Größenbeobachtung auch in Pause und bei Meldungen.

**Non-Goals:** Neue Kamerasteuerung, automatisches Verändern der Kartengeometrie, Eingriff in Simulationszeit oder gespeicherte Konfiguration. Es gibt keinen neuen Einstellungsparameter für die Darstellungsgröße.

## Decisions

### CSS bestimmt die verfügbare Fläche

Die feste Maximalbreite entfällt. `main` erhält ein Layout aus automatisch hohen Bereichen für Kopf, Einstellungen, Meldungen, Status und Legende sowie einem flexiblen Bereich für das Spielfeld. Ein CSS-Grid mit einer Mindesthöhe von einer dynamischen Viewporthöhe (`100dvh`, mit `100vh` als Fallback) und einem Feldbereich `minmax(160px, 1fr)` ist dafür geeignet; die Umsetzung muss sicherstellen, dass der flexible Bereich die freie Höhe tatsächlich zugewiesen bekommt. Kompakte Außenabstände bleiben bestehen. Der Feldcontainer wächst unabhängig vom Canvas und zentriert dieses in beiden Achsen.

Die offene Einstellungsbox erhält für ihren Inhalt eine auf höchstens 40dvh begrenzte, intern scrollbare Höhe. Die Zusammenfassung bleibt zugänglich. Bei sehr kleinen Fenstern dürfen die automatischen Bereiche plus Mindestfeldhöhe die Fensterhöhe übersteigen; die Seite scrollt dann vertikal. Dokumentweites `overflow: hidden` scheidet aus, da es Eingaben und Fehlermeldungen unzugänglich machen könnte.

Alternative: Die Höhen aller Nachbarelemente in JavaScript aufsummieren. Das wäre empfindlicher gegen Margins, Umbrüche und neue Meldungen. CSS soll die Flächenzuweisung übernehmen; JavaScript liest nur das Ergebnis.

### Canvas wird in den gemessenen Container eingepasst

`src/main.ts` nutzt die tatsächliche innere Breite und Höhe des Feldcontainers. Die pauschale Reserve von 270 Pixeln und das unabhängige 220-Pixel-Minimum entfallen. Containerrahmen werden nicht als Zeichenfläche mitgezählt. `layout` behält den gemeinsamen Radius:

`r = min((W - 12) / unitsWide, (H - 12) / unitsHigh)`

Für reguläre Flächen ist damit mindestens eine Grenze exakt erreicht. Die bisherige Rastergeometrie einschließlich Sonderfällen bleibt erhalten. Bei temporär nicht messbaren Flächen wird das Zeichnen übersprungen und beim nächsten Größenereignis nachgeholt; es darf kein negativer Radius an Canvas gelangen. Die CSS-Feldfläche bleibt mindestens 160 Pixel hoch, ihre Breite folgt dem verfügbaren Fenster.

Canvas-CSS-Maße stammen aus demselben Layout wie die Zeichenkoordinaten. Der Gerätepixelfaktor beeinflusst nur den Backing Store. Ein nachträgliches unabhängiges Strecken per CSS wird vermieden. Kleine Differenzen durch physische Pixelrundung sind zulässig.

Alternativen: Nur die Breitenbegrenzung entfernen lässt die falsche Höhenreserve bestehen. Ein `cover`-Verhalten würde Randzellen abschneiden; ein Strecken auf beide Containermaße würde Sechsecke verzerren. Beide erfüllen die geforderte vollständige proportionale Darstellung nicht.

### Größenereignisse zeichnen nur neu

Der bestehende `ResizeObserver` liest die zugewiesene Containerfläche und zeichnet ohne `Playback.tick` neu. Öffnen der Einstellungen, Textumbruch und Meldungen müssen dessen Fläche ändern und damit auch in Pause ein Neuzeichnen auslösen. Die Canvasgröße darf die Grid-Zeilenhöhe nicht zurückbeeinflussen; gegebenenfalls wird das Canvas innerhalb des Feldcontainers aus dem Größenfluss genommen. Unveränderte Backing-Store-Maße werden nicht erneut gesetzt.

Das bestehende Resize-Ereignis bleibt für Fenster-/Pixelfaktoränderungen nutzbar. Alle zusätzlichen Beobachter und Listener werden im HMR-Dispose entfernt. Es werden keine zweite Animationsschleife und keine impliziten Neustarts eingeführt.

## Risks / Trade-offs

- [Breites Fenster hat ein anderes Seitenverhältnis als die Karte] → Unvermeidbare Restfläche wird zentriert verteilt; maximale Einpassung wird rechnerisch geprüft.
- [Offene Einstellungen beanspruchen viel Platz] → Inhaltshöhe begrenzen und intern scrollen; bei sehr geringer Fensterhöhe bleibt vertikales Seitenscrolling möglich.
- [Canvasgröße beeinflusst beobachtete Fläche] → Die Fläche vom CSS-Layout vorgeben und Canvas-Intrinsik davon entkoppeln; Größenänderungen in Pause und schnelle Resize-Folgen testen.
- [Größeres Canvas benötigt mehr Zeichenarbeit] → Keine zusätzlichen Simulationsschritte oder Zeichenschleifen; bestehende begrenzte Tickverarbeitung bleibt erhalten.

## Migration Plan

Die Änderung benötigt keine Datenmigration. Einstellungen und Kartengröße bleiben unverändert. Bei Rücknahme der Layoutänderung gelten wieder die bisherigen Seitenmaße. README und Browserprüfungen dokumentieren die neue Einpassung und das Verhalten offener Einstellungen.

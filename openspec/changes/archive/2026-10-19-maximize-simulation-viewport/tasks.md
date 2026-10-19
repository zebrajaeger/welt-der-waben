# Tasks

## 1. Verfügbare Fläche und proportionale Darstellung

- [x] 1.1 Die gemeinsame Einpassung in Breite und Höhe sowie den Umgang mit vorübergehend nicht messbaren Flächen absichern; `tests/render.test.ts` um maximale Einpassung bis auf zwei CSS-Pixel, gleichen Maßstab, vollständige Randzellen und Karten mit einer Zelle/Reihe/Spalte erweitern und gezielt ausführen.
- [x] 1.2 In `src/style.css` die 1500-Pixel-Grenze durch das viewportbezogene Seitenlayout mit unabhängig dimensioniertem Feldcontainer, Zentrierung und mindestens 160 Pixel Feldhöhe ersetzen; offene Einstellungen auf höchstens 40dvh Inhaltshöhe mit internem Scrollen begrenzen. Browserprüfungen für 1440 × 1000, 2560 × 1440, 3440 × 1440, 360 × 740 und 360 × 480 sowie alle erreichbaren Formularaktionen ergänzen; README um Einpassung, Restflächen und Scrollverhalten aktualisieren.
- [x] 1.3 In `src/main.ts` die tatsächliche innere Containerbreite und -höhe an die Layoutfunktion übergeben, die pauschale Höhenreserve entfernen und Canvas-Maße mit Gerätepixelfaktor konsistent setzen; Browserprüfungen für rechnerisch optimale Feldgröße, Zentrierung, unverzerrte Geometrie und Backing Store bei Pixelfaktor 1 und 2 ausführen.
- [x] 1.4 Größenbeobachtung für offene/geschlossene Einstellungen, mehrzeilige Meldungen und umgebrochene Bedienelemente auch in Pause sicherstellen und Beobachter bei HMR bereinigen; Browserprüfungen müssen nach Resize unveränderte Tickzahl, Einstellungen und pausierte Kontaktpose sowie ausbleibende Beobachterschleifen und doppelte Listener bestätigen.

## 2. Integrierte Abnahme

- [x] 2.1 Tests und Produktionsbuild erfolgreich ausführen und `openspec validate maximize-simulation-viewport --strict` bestehen; bestehende Einstellungs-, Wiedergabe- und Browserprüfungen einschließlich Resize und HMR müssen weiterhin erfolgreich sein.
- [x] 2.2 Desktop-, Ultrawide- und Mobilansichten mit offenen und geschlossenen Einstellungen visuell prüfen; Screenshots und gemessene Container-/Canvasgrößen müssen maximale proportionale Einpassung, vollständige Sichtbarkeit und die Bedienbarkeit bei 360 × 480 bestätigen.

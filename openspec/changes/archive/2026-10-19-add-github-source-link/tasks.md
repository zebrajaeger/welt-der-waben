# Tasks

## 1. Platzsparender Quellcode-Link

- [x] 1.1 In `index.html` und `src/style.css` den Repository-Link mit eingebettetem GitHub-Symbol in die vorhandene kleine Kopfzeile einfügen; zugänglichen Namen, Tooltip, neuen Tab, mindestens 24 × 24 Pixel Klickfläche und sichtbaren Fokus ergänzen. In der Produktions-Browserprüfung Linkziel, Aktivierung mit Maus und Tastatur sowie Erhalt der pausierten Simulation prüfen; die Repository-Anfrage im Test abfangen. In beiden READMEs einen kurzen Bedienhinweis auf den Link ergänzen und mit der Oberfläche abgleichen.
- [x] 1.2 Die Produktions-Browserprüfung um Layoutmessungen bei 1440 × 900, 360 × 740 und 360 × 480 Pixel mit offenen und geschlossenen Einstellungen erweitern. Gegen das bisherige Layout ohne Link und dessen Platzreserve höchstens einen CSS-Pixel Abweichung bei Kopf- und Zeichenflächenhöhe nachweisen; Überlappungen, horizontales Scrollen und Fokuszustand prüfen. Screenshots zur Sichtprüfung von Symbol und Fokus erstellen.

## 2. Integration prüfen

- [x] 2.1 `npm run build` und `npm run test:production` erfolgreich ausführen; bestehende Bedien-, Persistenz- und Dateiübertragungsprüfungen müssen zusammen mit den neuen Linkprüfungen bestehen. `openspec validate add-github-source-link --strict` und `git diff --check` ohne Fehler abschließen.

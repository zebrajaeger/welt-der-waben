# Tasks

## 1. Icon und Einbindung

- [x] 1.1 `src/favicon.svg` als einzelne spitzenorientierte Wabe mit dunkler Innenfläche und mittigem Carnivoren in `#ff7b87` erstellen. Die Sterngeometrie bei Energieanteil 0,5 aus `drawAnimal`/`drawShape` übernehmen und Herkunft im SVG kommentieren; eine große Vergleichsansicht muss die Übereinstimmung der Zwischenform und freie Spitzenränder bestätigen.
- [x] 1.2 Das Asset im Kopf von `index.html` als SVG-Favicon über Vites Asset-Verarbeitung verknüpfen. `npm run build` und ein Entwicklungs-Smoke mit `npm run dev` müssen die erfolgreiche Bildauslieferung über die jeweilige HTML-Verknüpfung unter Pages-Unterpfad beziehungsweise Wurzelpfad bestätigen.
- [x] 1.3 Eine gezielte Produktionsprüfung in `e2e/production.pw.ts` ergänzen, die die ausgelieferte Icon-URL auf lokalen Ursprung und `/welt-der-waben/` prüft, erfolgreich als SVG abruft und als Bild dekodiert; Prüfung nach Neuladen und Sprachwechsel muss dieselbe Icon-Verknüpfung bestätigen. Der gezielte Playwright-Lauf muss bestehen.

## 2. Sichtprüfung und Abnahme

- [x] 2.1 Das tatsächlich eingebundene SVG bei 16, 32 und 48 Pixeln auf heller und dunkler Fläche rendern, Screenshots ansehen und nötigenfalls Kontrast oder Abstände korrigieren. Wabe, rosa dreizackige Zwischenform und unbeschnittene Spitzen müssen insbesondere bei 16 Pixeln erkennbar sein; Screenshots als lokale Prüfarbeitsprodukte ablegen.
- [x] 2.2 Abschließenden Build samt Typprüfung und Produktions-Browsertests ausführen sowie `openspec validate add-carnivore-favicon --strict` prüfen. Alle Prüfungen müssen bestehen und der Änderungsumfang muss auf Favicon, HTML-Verknüpfung und zugehörige Prüfung beschränkt bleiben.

# Tasks

## 1. Gemeinsames JSON-Format

- [x] 1.1 In `src/settings-format.ts` einen browserunabhängigen Codec für `{ version: 2, config }` mit lesbarer Ausgabe, vollständiger Validierung, unbekannten Zusatzfeldern und Version-1-Migration ergänzen. Mit Unit-Tests Rundlauf aller Parameter einschließlich beider Startenergien, unabhängige Kopien, Versionsfehler, ungültiges JSON, fehlende beziehungsweise falsch typisierte Werte und Domänenfehler nachweisen.
- [x] 1.2 `src/settings-storage.ts` auf den gemeinsamen Codec umstellen und die vorhandenen Speicherhinweise, Standardrückfall, Fehlerbehandlung und ausbleibende automatische Umschreibung erhalten. Mit `tests/settings-storage.test.ts` insbesondere Legacy-Migration, gesperrten Speicher und Erhalt der letzten erfolgreichen Speicherung verifizieren.

## 2. Export des Formularentwurfs

- [x] 2.1 „Als JSON exportieren“ in `index.html` und `src/settings-panel.ts` ergänzen: sichtbaren Entwurf prüfen, JSON-Download mit aussagekräftigem Dateinamen starten, Objekt-URL freigeben und verständliche Rückmeldung geben. In der Produktions-Browserprüfung einen vom aktiven und gespeicherten Stand abweichenden Entwurf herunterladen, vollständigen Dateinhalt prüfen und unveränderten pausierten Lauf sowie unveränderten Speicher nachweisen; ungültigen Export ohne Download prüfen.
- [x] 2.2 In `README.md` und `README.de.md` Export und das versionierte Dateiformat anhand eines vollständigen gültigen JSON-Beispiels dokumentieren. Beispiel mit dem Codec prüfen und erklären, dass Formularwerte einschließlich Starttempo, aber keine laufende Welt exportiert werden.

## 3. Import und Bedienung

- [x] 3.1 „JSON importieren“ mit beschrifteter Dateiauswahl, atomarer Entwurfsübernahme, Fehlerhinweisen und Schutz vor veralteten asynchronen Leseabschlüssen in das Panel integrieren. Mit Browserprüfungen Dateiabbruch, erneute Auswahl derselben Datei, Lese-/Formatfehler und Erhalt des bisherigen Entwurfs, der aktiven Konfiguration und gespeicherter Werte nachweisen; bei verzögertem Lesen neuere Änderungen und Abbruch des Panels respektieren.
- [x] 3.2 Die heruntergeladene Exportdatei in einem unabhängigen Browserkontext importieren und mit der Produktions-Browserprüfung nachweisen: Formularwerte vollständig übertragen, aktives Tempo und pausierten Lauf zunächst erhalten, anschließend bewusst bei Tick null übernehmen sowie ausdrücklich speichern und nach Neuladen wiederherstellen. Version-1-Import und Betrieb mit gesperrtem Browserspeicher ebenfalls prüfen.
- [x] 3.3 Hilfetexte und gegebenenfalls `src/style.css` für die Dateiaktionen ergänzen; in beiden READMEs Import, Fehlerverhalten und die separaten Aktionen Übernehmen und Speichern erklären. Per Tastatur und bei 360 Pixel Breite prüfen, dass die Dateiaktionen ohne horizontales Seitenscrolling bedienbar und Rückmeldungen zugänglich sind; beim Dateitransfer dürfen keine Dateiinhalte als Netzwerkanfragen gesendet werden.

## 4. Integration prüfen

- [x] 4.1 `npm test`, `npm run build` und `npm run test:production` erfolgreich ausführen; unter dem Pages-Unterpfad müssen die bisherigen Bedien- und Persistenzprüfungen sowie die neuen Dateiprüfungen bestehen. Abschließend `openspec validate import-export-settings-json --strict` und `git diff --check` ohne Fehler abschließen.

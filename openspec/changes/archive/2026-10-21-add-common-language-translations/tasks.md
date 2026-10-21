# Tasks

## 1. Sprachauflösung und skalierbare Auswahl

- [x] 1.1 `language.direction` als gemeinsame Katalogmetadaten ergänzen und kanonische Auswahl um explizite/abgeleitete Schrift sowie `no` → `nb` erweitern. Unit-Tests mit Katalog-Fixtures müssen chinesische Regions-/Schriftfälle, Vorrang innerhalb der Browserliste, `no`/`nb`, unverändert unterstützte Präferenzen und Englisch-Fallback prüfen; Zuordnung in `docs/i18n.md` dokumentieren.
- [x] 1.2 Die vorhandene Sprachliste auf sichtbaren Fensterraum begrenzen, internes Scrollen, deterministische Reihenfolge und Sichtbarkeit des aktiven/fokussierten Eintrags ergänzen. Alte Home/End-Annahmen aus `e2e/language-control.pw.ts` ersetzen; ein Browserfall mit großer Testliste muss alle Einträge bei 360 × 480 per Tastatur und Pointer erreichen, ohne die Seite zu verschieben. Bedienung in `docs/i18n.md` aktualisieren.
- [x] 1.3 Katalogprüfungen um gültige Richtung, Eigennamen und lokale Flaggenreferenzen erweitern; fehlende Metadaten, Schlüssel und abweichende Platzhalter mit fehlschlagenden Test-Fixtures prüfen. Eine Prüfausgabe für verdächtig unveränderte englische Meldungen und zulässige identische Fachnamen dokumentieren und an Testkatalogen verifizieren.

## 2. Vollständige Übersetzungskataloge

- [x] 2.1 `fr`, `es`, `it`, `pt` und `nl` vollständig aus dem englischen Referenzkatalog übersetzen und ihre Metadaten setzen. Katalog-/Platzhaltertests und ein gezielter Browser-Smoke je Sprache müssen bestehen; bestehende Französisch-ist-unsupported-Fälle durch echte unbekannte Kennungen beziehungsweise französische Treffer ersetzen.
- [x] 2.2 `sv`, `da`, `fi` und `nb` vollständig übersetzen; Metadaten und alle vorhandenen Schlüssel/Platzhalter prüfen sowie jede Sprache im Browser wählen und eine dynamische Meldung kontrollieren.
- [x] 2.3 `pl`, `cs`, `el`, `ro` und `hu` vollständig übersetzen; Katalogtests und Browser-Smokes einschließlich Sonderzeichen und Einstellungen müssen bestehen.
- [x] 2.4 `uk`, `ru` und `tr` vollständig übersetzen; Katalogtests und Browser-Smokes müssen kyrillische Texte beziehungsweise türkische Sonderzeichen sowie eine Validierungsmeldung korrekt zeigen.
- [x] 2.5 `hi`, `bn`, `zh-Hans`, `zh-Hant`, `ja`, `ko`, `id`, `vi` und `th` vollständig übersetzen. Katalog-/Platzhaltertests und Browser-Smokes müssen alle neun Dateien und beide tatsächlich unterschiedlichen chinesischen Fassungen prüfen.
- [x] 2.6 `ar` und `he` vollständig in nativer Schrift mit `rtl`-Metadaten übersetzen; Katalogtests und Browser-Smokes müssen auch Fehlervorlagen, Diagrammtexte und Σ-Energiesummen enthalten. Die vollständige Richtungsdarstellung wird zusätzlich in Gruppe 3 geprüft.
- [x] 2.7 Die in der Design-Tabelle benannten lokalen Flaggen ergänzen und alle 30 Kataloge vollständig registrierungsfrei verfügbar machen. Tests müssen exakt den vorgesehenen Katalogsatz, vorhandene Flaggen, korrekte Eigennamen und fehlerfreie Auswahl aller 30 Sprachen bestätigen.
- [x] 2.8 Alle neuen Kataloge in einem zweiten inhaltlichen Durchgang auf Anzahl/Summe, Zeit/Tempo, Anwenden/Speichern und natürlich vollständige Meldungen prüfen; Kopierkandidaten sichten und Fehler korrigieren. Sprachpaket, Metadaten und Pflegeverfahren in `docs/i18n.md` und beiden READMEs festhalten; Vollständigkeit mit der Design-Tabelle und Katalogtests abgleichen.

## 3. Schreibrichtung, Zahlen und Layout

- [x] 3.1 Dokumentrichtung aus Metadaten setzen und Texte, Eigennamen sowie technische Fragmente bidirektional isolieren. Headerpositionen, gleiche Buttonhöhe, Spielfeld und Diagrammkoordinaten explizit stabil halten. Browserprüfungen für `fr` → `he` → `fr` und `en` → `ar` müssen Richtung und vorhandene Fehlermeldungen ändern sowie Tick, Entwurf und Historie erhalten; Richtungsregeln in `docs/i18n.md` erläutern.
- [x] 3.2 Canvas-/Tooltip-Texte und Zahl-/Einheitenslots auf die neuen Schriftsysteme abstimmen; die bestehenden Zahlenformat-Tests auf alle 30 Kataloge erweitern. Ganze Anzahlen, zwei beziehungsweise eine Nachkommastelle, Gruppierung, große Zahlen und Feldkapazitäten müssen ohne Rückwirkung auf Modellwerte bestehen; insbesondere arabische Ziffern und indische Gruppierung prüfen.
- [x] 3.3 Repräsentative Layoutprüfungen für `fr`, `ru`, `ar`, `he`, `hi`, `bn`, `zh-Hans`, `zh-Hant`, `ja` und `th` bei 1440 × 900, 360 × 740 und 360 × 480 ergänzen. Screenshots müssen lesbare Schrift, erreichbare lange Liste, rechtsbündige gleich hohe Kopfsteuerung, stabile Achsenseiten/-anker und kompakte Panels zeigen; ein RTL-Tooltip muss bei stillstehender Maus weiter korrekt aktualisieren.

## 4. Übergreifende Abnahme

- [x] 4.1 Gesamte Unit-Suite, Typprüfung, Build und Produktions-Browsertests einschließlich Auswahl aller 30 Sprachen ausführen. Unter `/welt-der-waben/` dürfen keine externen Übersetzungs-/Schriftanfragen entstehen; gespeicherte Präferenzen, blockierter Speicher und ein sprachübergreifender JSON-Roundtrip müssen weiterhin funktionieren. Buildgrößen vor/nach Erweiterung nachvollziehbar dokumentieren.
- [x] 4.2 Übersetzungsabdeckung und Screenshots mit der Spezifikation abgleichen, verbleibende Platzhalter/Kopierfehler oder Richtungs-/Zahlenprobleme beseitigen und den Change strikt validieren. Abschluss setzt vollständige Kataloge und bestandene Prüfungen voraus; fachliche Übersetzungsprüfung und technische Tests im Ergebnis unterscheiden.

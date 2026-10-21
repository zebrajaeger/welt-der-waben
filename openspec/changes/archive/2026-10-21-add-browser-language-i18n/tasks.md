# Tasks

## 1. Lokalisierung und Sprachkataloge

- [x] 1.1 `i18next` als Laufzeitabhängigkeit mit Lockfile ergänzen und `src/i18n.ts` mit separater Instanz, lokalem Katalog-Glob, Englisch-Fallback und wiederverwendbaren Zahlenformatierern anlegen; durch Installation, Typprüfung und Tests für fehlende/leere Übersetzungen verifizieren.
- [x] 1.2 Browserauswahl für geordnete Präferenzen, exakten Treffer, Basissprache und Englisch-Rückfall implementieren; Unit-Tests für `de-CH`, `en-GB`, `fr-FR/de-DE/en-US`, ungültige Kennungen, leere Liste und fehlende Angaben ergänzen und ausführen.
- [x] 1.3 Vollständige `src/locales/en.json` und `de.json` mit stabilen Schlüsseln, vollständigen Meldungsvorlagen und allen statischen/dynamischen UI-Texten anlegen; Katalogtests für englische Referenzschlüssel, Vollständigkeit, leere Texte und passende Interpolationsparameter ergänzen. Eine zusätzliche Test-Katalogdatei muss ohne Änderung einer Sprachliste erkannt werden.
- [x] 1.4 `docs/i18n.md` mit Dateinamenskonvention, Browserauswahl, Fallback, Platzhaltern und Testbefehlen schreiben; die Anleitung anhand eines zusätzlichen Testkatalogs prüfen, ohne eine dritte Sprache auszuliefern.

## 2. Start und allgemeine Oberfläche

- [x] 2.1 `index.html` mit Übersetzungsmarkierungen und englischem `lang` versehen, Vite-HTML-Transform für escaped englische Katalogtexte ergänzen und ausgewählte Texte/Attribute früh beim Start setzen; Entwicklung und Produktions-HTML auf englische Initialtexte, korrekte Attribute und fehlende Platzhalter prüfen.
- [x] 2.2 Lokalisierung in `main.ts` vor Speicherhinweisen und Panelaufbau initialisieren; Wiedergabebedienung, Tempooptionen, Status, Titel und zugängliche Namen übersetzen. Gezielte Browsertests müssen Englisch/Deutsch, nachrangige unterstützte Präferenz und unbekannte Sprache mit Englisch-Fallback einschließlich `html.lang` prüfen.
- [x] 2.3 Vorhandene deutsche E2E-Prüfungen und Browser-Skripte auf ausdrücklich gesetzte Locale `de-DE` umstellen; beide READMEs und Screenshot-Anleitung an Browserauswahl und reproduzierbare Screenshot-Sprache anpassen. Bestehende Bedienungschecks müssen mit unveränderten Simulationswerten bestehen.

## 3. Einstellungen und strukturierte Rückmeldungen

- [x] 3.1 Bekannte Fehler in `config.ts`, `playback.ts`, `settings.ts`, `settings-format.ts` und `settings-storage.ts` als stabile Codes mit Parametern und optionalem Feldpfad ausdrücken; Meldungspräfix-Erkennung entfernen. Unit-Tests auf Codes/Pfade umstellen und gültige Konfigurationen, Dateiversionen, Speicherfehler und unveränderte Zustände bei Fehlern prüfen.
- [x] 3.2 Feld-/Gruppenmetadaten und `settings-panel.ts` auf Übersetzungsschlüssel und stabile Gruppen-IDs umstellen; Aktionen, Hilfen, Erfolge, bekannte Fehler und unbekannte allgemeine Fehlermeldung lokalisieren. Englische/deutsche Browsertests müssen Feldname, Fokus, Fehlermarkierung, Speicherhinweise und asynchrone Importabsicherung prüfen.
- [x] 3.3 Sprachübergreifenden Export/Import und gespeicherte Einstellungen prüfen; einen englischen Export auf Deutsch einlesen und umgekehrt identische Parameter/Formatversion bestätigen. Einstellungsdokumentation bei Bedarf um sprachunabhängiges Dateiformat ergänzen; kein neuer Sprachwert darf in Konfiguration oder Export erscheinen.

## 4. Verlauf und Zahlenlayout

- [x] 4.1 `history-format.ts` und `history-chart.ts` auf den Lokalisierungskontext umstellen; ganze Anzahlen, zwei Nachkommastellen für aktuelle Messwerte, eine für die X-Achse und Breitenbegrenzung erhalten. Formatierungstests müssen Punkt/Komma, Stellenwechsel und große Werte in beiden Sprachen prüfen.
- [x] 4.2 `history-panel.ts`, Legende, Canvas-Texte, Details und Tooltip vollständig über Kataloge beschriften; vollständige Tooltip-Bezeichnungen statt deutscher String-Manipulation verwenden. Browsertests müssen alle fünf Werte einschließlich ausgeblendeter Reihen, „Σ Energy“/„Σ Energie“, beide Bewegungsmodi und aktualisierte Werte bei stillstehender Maus prüfen.
- [x] 4.3 Vorhandene Layoutchecks um Englisch ergänzen und Achsenprüfungen sprachabhängig machen; bei 1440 × 900, 360 × 740 und 360 × 480 feste Zahlenanker, kompakte Panelhöhe und fehlenden horizontalen Seitenüberlauf prüfen. Diagrammhinweise in beiden READMEs mit den lokalisierten Bezeichnungen abgleichen.

## 5. Übergreifende Abnahme

- [x] 5.1 Vollständige Unit-Tests, Typprüfung, Produktionsbuild und bestehende Browserchecks ausführen; ergänzende Locale-Fälle müssen unter `/welt-der-waben/` auch ohne verfügbaren lokalen Speicher funktionieren und ohne Übersetzungsdienst oder externe Sprachdateianfragen auskommen.
- [x] 5.2 Englische und deutsche Oberfläche in den wesentlichen Zuständen kontrollieren: laufend/pausiert, offene Einstellungen, fehlerhafter Import, Verlauf und Tooltip. Mit den vier Spec-Deltas abgleichen und verbleibende deutsche Anwendungstexte auf Englisch, sichtbare Übersetzungsschlüssel oder nicht übersetzte zugängliche Namen beseitigen; technische Pfade und Projektnamen ausnehmen.

## 6. Manuelle Sprachwahl

- [x] 6.1 Sprachpräferenz getrennt speichern und vor Browserpräferenzen laden; Lokalisierung im laufenden Besuch umschaltbar machen. Unit-Tests prüfen Vorrang, ungültige Werte, blockierten Speicher und aktualisierte Zahlenformate.
- [x] 6.2 Globus-Button oben rechts mit Abstand, lokal gebündelten Flaggen und Sprach-Eigennamen ergänzen, Wiedergabesteuerungen rechtsbündig neben der Überschrift mit Abstand zur Sprachwahl ausrichten. Browserchecks prüfen aktive Auswahl, Tastatur, Escape/Außenklick und überlappungsfreies Layout bei 1440 × 900, 360 × 740 und 360 × 480.
- [x] 6.3 Sofortigen Wechsel aller Texte, Meldungen und Diagrammformate ohne Zustandsverlust anbinden und READMEs/Übersetzungsanleitung aktualisieren. Browsertests prüfen unfertigen Entwurf, Fehler, Pause/Tick, Historie, Tooltip und Wiederherstellung nach Reload sowie blockierten Speicher.
- [x] 6.4 Unit-Tests, Build, Produktions-Browsertests und deutsche/englische Layoutchecks ausführen, Screenshots der Sprachwahl kontrollieren und Change strikt validieren.

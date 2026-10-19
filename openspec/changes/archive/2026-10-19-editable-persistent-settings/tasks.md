# Tasks

## 1. Konfigurationsentwurf und Speichergrenze

- [x] 1.1 Typisierte Felddefinitionen für sämtliche 24 Config-Blattwerte, unabhängige tiefe Kopien und vollständiges Einlesen von Zahleneingaben ergänzen; mit Tests leere Eingaben, Datentypen, alle Felder, unveränderte Defaults und bestehende gekoppelte Validierungsregeln prüfen.
- [x] 1.2 Versioniertes Laden und Speichern über eine injizierbare lokale Speicherschnittstelle ergänzen; Tests für Roundtrip, fehlende Daten, defektes JSON, unbekannte Version, unvollständige Struktur, ungültige Kombinationen und werfenden Speicherzugriff ausführen. Nur den eigenen Schlüssel schreiben und Speichererfolg erst nach erfolgreichem Schreiben melden.

## 2. Bearbeitbare Oberfläche und aktive Konfiguration

- [x] 2.1 Native einklappbare Einstellungen mit gruppierten Eingaben, deutschen Labels, Einheiten, Übernehmen, Im Browser speichern, Standardwerte und zugänglichen Meldungen ergänzen; Browserprüfung für vollständige Felder, erhaltene Entwürfe beim Einklappen, Tastaturbedienung und 360-Pixel-Layout ohne horizontales Seitenscrolling hinzufügen.
- [x] 2.2 Startkonfiguration vor Initialisierung laden und main.ts auf eine gemeinsame aktive Konfiguration umstellen; Übernehmen validiert atomar, erzeugt eine neue Playback-Instanz und erhält den Pausenmodus. Browserprüfung für Feldgröße, Startpopulationen, Tick null, verworfene Aktionen, ungültige Entwürfe und Neustart ohne Übernahme offener Entwürfe ergänzen.
- [x] 2.3 Speicher- und Standardwertaktionen sowie Hinweise für aktiv, geändert und gespeichert anbinden; Browserprüfungen für Speichern ohne Neustart, Übernehmen ohne Speichern, erneutes Laden, temporäre und dauerhaft gespeicherte Standards und weiter nutzbare Simulation bei Speicherfehlern ergänzen.
- [x] 2.4 Bestehende Soforttempoauswahl mit aktiver Konfiguration und ausschließlich dem Tempoentwurf synchronisieren; zusätzliche gültige Tempooptionen erhalten und Tests für unberührte andere Entwurfswerte, Formular-Tempo ohne Sofortwirkung, Pause, Einzeltick, Neustart, Neuladen und ausbleibende automatische Speicherung ergänzen.
- [x] 2.5 README.md um die Aktionen, Neustartfolgen, Einheiten und die an Browseradresse gebundene Speicherung aktualisieren; dokumentierte Abläufe im Browser nachvollziehen und neue Listener in die bestehende HMR-Bereinigung einbinden, sodass nach HMR ein Klick genau eine Aktion ausführt.

## 3. Integrierte Abnahme

- [x] 3.1 npm test und npm run build erfolgreich ausführen sowie den Change mit openspec validate editable-persistent-settings --strict prüfen; fehlschlagende bestehende Regel- und Wiedergabetests beheben.
- [x] 3.2 Gesamte Browserprüfung mit isoliertem Speicher ausführen und Desktop sowie Mobilansicht offen und eingeklappt visuell prüfen; gespeicherten Start, korrupten Speicher, blockiertes Lesen/Schreiben, laufende Animationen, Pause, Einzeltick, Tempo und HMR ohne doppelte Listener oder Animationsschleifen bestätigen.

## 4. Ergänzung Startenergie

- [x] 4.1 Separate Startenergie je Art in Konfiguration, Initialisierung, Formular und Speicherung ergänzen; positive endliche Werte bis zum Maximum prüfen und bestehende Speicherungen mit bisheriger halber Maximalenergie laden. Tests und Browserprüfung müssen individuelle Startwerte, Fehler, Neustart, Speicherung, Standards und Migration abdecken; README und Delta-Spezifikationen aktualisieren.

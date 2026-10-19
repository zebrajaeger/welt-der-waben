# static-site-delivery Specification

## Purpose

Ermöglicht den öffentlichen statischen Betrieb der Simulation unter einem Repository-Unterpfad und die nachvollziehbare Veröffentlichung geprüfter Hauptbranch-Stände über GitHub Pages.

## Requirements

### Requirement: Statische öffentliche Auslieferung unter Repository-Pfad
Die gebaute Anwendung SHALL unter `https://zebrajaeger.github.io/welt-der-waben/` ohne lokalen Entwicklungsserver benutzbar sein. Benötigte Anwendungsdateien SHALL unter diesem Repository-Unterpfad korrekt geladen werden. Die Auslieferung SHALL ausschließlich statische Produktionsdateien enthalten. Jeder Besucher SHALL seine eigene Simulation und die bestehende lokale Einstellungsspeicherung verwenden.

#### Scenario: Direkter Aufruf und Neuladen
- **WHEN** ein Besucher die veröffentlichte Adresse direkt öffnet oder neu lädt
- **THEN** werden Oberfläche, Styles und Skripte ohne fehlende Ressourcen geladen und die Simulation kann laufen, pausieren und einzelne Ticks ausführen
- **AND** werden keine Quellmodule oder lokalen Entwicklungsadressen für den Betrieb benötigt

#### Scenario: Gespeicherte Einstellungen am öffentlichen Ursprung
- **WHEN** ein Besucher gültige Einstellungen speichert und die Anwendung unter derselben öffentlichen Adresse neu lädt
- **THEN** startet seine neue Welt mit diesen Einstellungen; andere Besucher und deren Simulationen bleiben unabhängig

### Requirement: Geprüfte Veröffentlichung aus dem Hauptbranch
Pushes auf `main` und manuelle Workflow-Aufrufe für `main` SHALL nach erfolgreichen Tests, Produktionsbuild und Produktions-Browserprüfung eine Veröffentlichung auslösen. Fehler SHALL das Deployment verhindern. Andere Branches SHALL nicht veröffentlichen. Gleichzeitige Läufe SHALL so koordiniert werden, dass ein überholter Lauf keinen später erfolgreich veröffentlichten Stand überschreibt.

#### Scenario: Erfolgreicher Hauptbranch-Lauf
- **WHEN** ein Push auf `main` alle vorgeschalteten Prüfungen besteht
- **THEN** wird genau der geprüfte Produktionsbuild veröffentlicht und die Deployment-URL im Workflow-Ergebnis ausgewiesen

#### Scenario: Fehler oder anderer Branch
- **WHEN** Tests, Build oder Browserprüfung fehlschlagen oder ein manueller Aufruf einen anderen Branch auswählt
- **THEN** wird kein neuer Stand über diesen Lauf veröffentlicht und die bestehende Veröffentlichung bleibt bestehen

#### Scenario: Mehrere Änderungen kurz nacheinander
- **WHEN** mehrere Hauptbranch-Läufe zeitlich überlappen
- **THEN** werden Veröffentlichungen serialisiert beziehungsweise überholte Läufe verworfen, ohne einen neueren erfolgreich veröffentlichten Stand durch einen älteren zu ersetzen

### Requirement: Produktionsprüfung vor Auslieferung
Vor Veröffentlichung SHALL der tatsächlich gebaute Stand unter `/welt-der-waben/` im Browser geprüft werden. Die Prüfung SHALL erfolgreiche Skript- und Style-Anfragen, eine sichtbare Simulation, Pause, Einzeltick, Neustart, Tempo sowie Übernehmen und Speichern von Einstellungen samt Neuladen nachweisen. Sie SHALL ohne Import der Anwendungsquellmodule auskommen und bei Lade- oder Laufzeitfehlern fehlschlagen.

#### Scenario: Fehlerhafte Ressourcenpfade
- **WHEN** der Produktionsbuild Skripte oder Styles vom falschen Pfad lädt oder zur Laufzeit einen Fehler auslöst
- **THEN** schlägt die vorgeschaltete Browserprüfung fehl und verhindert die Veröffentlichung

#### Scenario: Funktionsfähiger Produktionsbuild
- **WHEN** die Anwendung unter dem Repository-Unterpfad erfolgreich geprüft wird
- **THEN** entsprechen die überprüften Bedienaktionen den bestehenden Regeln einschließlich genau eines Ticks im pausierten Einzelschritt und erhaltener Einstellungen nach Neuladen

### Requirement: Nachvollziehbarer lokaler und öffentlicher Betrieb
Die vorhandene lokale Entwicklung SHALL weiterhin am Wurzelpfad mit automatischer Aktualisierung funktionieren. Beide Sprachfassungen der README SHALL den vorgesehenen öffentlichen Link und die Deployment-Anleitung auffindbar machen. Die Anleitung SHALL Pages-Aktivierung, Prüf- und Veröffentlichungsablauf sowie lokale Produktionsvorschau erklären. Ein noch nicht erfolgtes Deployment SHALL nicht als erfolgreich dargestellt werden.

#### Scenario: Lokaler Entwicklungsstart
- **WHEN** Entwickler den bestehenden Entwicklungsbefehl starten
- **THEN** bleibt die Anwendung unter der angezeigten lokalen Wurzeladresse bedienbar und Quelltextaktualisierung funktioniert weiter

#### Scenario: Erste Veröffentlichung vorbereiten
- **WHEN** die Workflow-Datei erstmals bereitgestellt wird
- **THEN** beschreibt die Dokumentation die notwendige Pages-Quelle „GitHub Actions“ und wie der erste erfolgreiche Workflow sowie die veröffentlichte Adresse überprüft werden

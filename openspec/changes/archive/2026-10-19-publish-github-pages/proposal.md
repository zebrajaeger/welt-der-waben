# Proposal

## Why

Die Simulation ist bereits als statische Browseranwendung gebaut, bisher aber nur lokal nutzbar. Über GitHub Pages soll sie ohne Installation unter einem öffentlichen Link erreichbar sein und nach erfolgreichen Änderungen auf `main` automatisch aktualisiert werden.

## What Changes

- Die gebaute Anwendung wird für `https://zebrajaeger.github.io/welt-der-waben/` vorbereitet; ihre JavaScript- und CSS-Dateien laden unter dem Repository-Unterpfad.
- Ein GitHub-Actions-Workflow prüft Tests, erstellt den Produktionsbuild und veröffentlicht ausschließlich dessen `dist/`-Inhalt über GitHub Pages. Er startet bei Push auf `main` und manuell; Veröffentlichungen anderer Branches werden ausgeschlossen.
- Fehlgeschlagene Prüfungen verhindern das Deployment. Gleichzeitige Workflow-Läufe werden koordiniert, damit ältere Stände neuere Veröffentlichungen nicht überschreiben.
- Ein automatisierter Browsercheck prüft den tatsächlichen Produktionsbuild unter `/welt-der-waben/`, einschließlich Laden, Simulation, Bedienung und lokal gespeicherten Einstellungen.
- Die lokale Entwicklung bleibt unter ihrem bisherigen Wurzelpfad nutzbar. Beide READMEs erhalten den vorgesehenen Link; eine Deployment-Anleitung erklärt Pages-Aktivierung, Workflow und Verifikation.

## Capabilities

### New Capabilities

- `static-site-delivery`: Öffentlicher statischer Betrieb unter dem Repository-Pfad sowie geprüfte automatische Veröffentlichung aus dem Hauptbranch.

### Modified Capabilities

Keine Änderung der bestehenden Simulations-, Darstellungs- oder Einstellungsregeln.

## Impact

Betroffen sind eine neue Vite-Konfiguration, `.github/workflows/pages.yml`, lokale Preview-/Prüfbefehle in `package.json`, gegebenenfalls die Lockdatei durch eine deklarierte Browser-Testabhängigkeit, ein eigenständiger Produktions-Browsercheck sowie `README.md`, `README.de.md` und `docs/deployment.md`. Die vorhandene Browserprüfung nutzt den Entwicklungsserver und importiert Quellmodule; sie kann den veröffentlichten Build deshalb nicht direkt prüfen. GitHub Pages muss im Repository als Quelle „GitHub Actions“ aktiviert sein. Diese Planung ändert keine Repository-Einstellungen und veröffentlicht noch nichts. Custom Domain, Backend, gemeinsamer Simulationszustand und Veröffentlichung der internen Zeitlupen-Testseite sind nicht im Umfang.

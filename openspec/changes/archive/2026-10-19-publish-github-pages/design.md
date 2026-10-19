# Design

## Context

Siehe `proposal.md` zur Motivation. Das Repository `zebrajaeger/welt-der-waben` enthält eine Vite-/TypeScript-Anwendung ohne Backend. `npm run build` prüft TypeScript und erzeugt `dist/`; weder Vite-Konfiguration noch GitHub-Workflow sind bisher vorhanden. `dist/` bleibt ignoriert. Der Hauptbranch heißt `main`.

Die bestehende Browserprüfung importiert `/src/`-Module und prüft HMR sowie eine interne HTML-Testseite. Sie ist für den Entwicklungsserver gedacht. Ihre extern übergebenen Playwright-/Chromium-Pfade sind zudem keine portable CI-Installation. Die bestehenden Vitest-Tests einschließlich Langläufen werden unverändert weiterverwendet.

## Goals / Non-Goals

**Goals:** Ein geprüfter Produktionsbuild am korrekten Unterpfad, ein einfacher automatischer Veröffentlichungsweg und portable Prüfkommandos. Genau das geprüfte Verzeichnis wird hochgeladen.

**Non-Goals:** Custom Domain, Backend, Benutzerkonten, gemeinsame Welt, Speicherung auf GitHub, separate Vorschau-Deployments für Pull Requests oder Veröffentlichung der internen Zeitlupen-Testseite. Die erste externe Aktivierung und Veröffentlichung ist ein anschließender Betriebsschritt; das Erstellen des Changes veröffentlicht nichts.

## Decisions

### Stabiler Basis-Pfad für Build und Preview

Eine neue `vite.config.ts` setzt `base: '/welt-der-waben/'`. Der bestehende Entwicklungsbefehl überschreibt die Basis ausdrücklich mit `--base /`, damit bisherige lokale URLs und Browserchecks erhalten bleiben. Ein neuer Preview-Befehl nutzt die konfigurierte Produktionsbasis und dient nur der lokalen Prüfung von `dist/`.

Eine feste Produktionsbasis mit expliziter Dev-Überschreibung hält Build und Preview konsistent. Eine Ableitung allein aus `command === 'build'` wäre fehleranfällig, weil Preview nicht derselbe Kommandozweig ist. Relative Basis `./` wurde zugunsten des explizit adressierten Repository-Pfads verworfen. Ein späterer Repository- oder Domainwechsel muss Basis und dokumentierte URL gemeinsam ändern.

### Getrennter Produktions-Browsercheck

`@playwright/test` wird als Entwicklungsabhängigkeit mit Lockdatei aufgenommen. Eine eigene `playwright.config.ts` startet Vite Preview unter einem festen lokalen Port mit `--strictPort` und prüft die URL `/welt-der-waben/`. Ein isolierter Kontext vermeidet fremde gespeicherte Einstellungen. Testdateien etwa unter `e2e/` verwenden die Endung `.pw.ts` mit explizitem Playwright-Testmuster, damit Vitest sie nicht ebenfalls entdeckt. Der npm-Befehl `test:production` startet diese Prüfung; der Build erfolgt zuvor ausdrücklich.

Der Check beobachtet JavaScript-/CSS-Anfragen und Browserfehler und bedient ausschließlich die reale Oberfläche. Er bestätigt steigende Tickzahl, Pause, einen Einzeltick, Neustart, Tempo und das Anwenden/Speichern/Neuladen einer kleinen gültigen Konfiguration. Ressourcen müssen erfolgreich mit passendem Inhaltstyp vom Unterpfad kommen; ein HTML-Fallback für fehlende Assets darf keinen falschen Erfolg erzeugen. Keine `/src/`-Imports, keine HMR-Manipulationen und keine Veröffentlichung der Testseiten.

Der Testserver wird durch die Testkonfiguration gestartet und beendet; bestehende unbekannte Prozesse auf demselben Port werden nicht wiederverwendet. Playwright-Testberichte und Testartefakte werden ignoriert. CI installiert den Chromium-Browser samt Linux-Abhängigkeiten mit dem zur Lockdatei gehörenden Playwright-CLI. Dies ersetzt die bisherigen lokalen Entwicklerchecks nicht.

### Zweistufiger Pages-Workflow

`.github/workflows/pages.yml` erhält `push` auf `main` und `workflow_dispatch`. Ein zusätzlicher Branch-Guard schließt manuelle Veröffentlichungen anderer Branches aus. Die Node-Version wird ausdrücklich auf die unterstützte Hauptversion 22 gesetzt; der Lockfile-basierte Build verwendet `npm ci`.

Der Build-Job führt Installation, `npm test`, `npm run build` und `npm run test:production` mit installiertem Chromium aus. Erst nach Erfolg wird ausschließlich `dist/` mit `actions/upload-pages-artifact` hochgeladen. Der Deploy-Job hängt über `needs` vom erfolgreichen Build ab, nutzt `actions/deploy-pages` und die Umgebung `github-pages` mit ausgegebener `page_url`. Es gibt keinen separaten `gh-pages`-Branch und keinen Commit generierter Dateien.

Berechtigungen werden nach Job getrennt: Lesen des Repositorys für den Build, `pages: write` und `id-token: write` für das Deployment. Das eingebaute GitHub-Token genügt; kein persönlicher Zugriffstoken ist geplant. Die offiziellen Actions-Versionen werden bei Umsetzung anhand ihrer offiziellen Quellen verifiziert und auf vollständige Commit-SHAs mit lesbarem Versionskommentar festgelegt.

Eine gemeinsame Workflow-Concurrency-Gruppe für Pages mit Abbruch überholter Läufe verhindert parallele unkoordinierte Veröffentlichungen. Nur erfolgreich geprüfte Builds erreichen den Deploy-Job; fehlgeschlagene neue Builds löschen keine bisherige Seite. Laufzeitgrenzen müssen die vorhandenen mehrminütigen Langzeittests zulassen.

### Einrichtung und Kommunikation

`docs/deployment.md` beschreibt die einmalige Repository-Einstellung `Settings → Pages → Source: GitHub Actions`, erforderliche Repository-Berechtigung, Workflow-Auslösung, lokale Preview-Prüfung und die Bestätigung des öffentlichen Links. Solange Repository-Einstellungen beziehungsweise erster Deployment-Lauf nicht verifiziert sind, wird der Stand als „vorbereitet“ beschrieben. Die beiden READMEs nennen dieselbe Zieladresse mit entsprechendem Einrichtungshinweis.

Die Planung prüft keine privaten Kontoeinstellungen und verändert die Repository-Konfiguration nicht. Ob Pages bereits aktiviert ist und ob der aktuelle Zugriff diese Einstellung erlaubt, wird beim später autorisierten Veröffentlichungsschritt read-only geprüft; fehlender Zugriff verhindert nicht die Erstellung eines vollständigen lokalen Workflows.

## Risks / Trade-offs

- [Pages ist im Repository noch nicht eingerichtet] → Einrichtung dokumentieren und beim Veröffentlichungsschritt prüfen; lokale Implementierung und externe Live-Bestätigung getrennt ausweisen.
- [Unterpfad führt zu fehlenden Assets] → Build und Preview verwenden dieselbe Basis; Produktionscheck prüft echte Netzwerkantworten und Bedienbarkeit.
- [Browserabhängigkeit erhöht CI-Installationsumfang] → Nur Chromium installieren; kleiner Produktionstest statt der gesamten Entwicklungs-Browserprüfung.
- [Tests werden von zwei Runnern entdeckt] → Eigenes Dateimuster und Verzeichnis für Playwright; Vitest-Aufzählung bei Umsetzung prüfen.
- [Lokale Einstellungen werden nicht auf die öffentliche Adresse übertragen] → Browser-Origin-Bindung in der Deployment-Anleitung erklären; bestehende lokale Speicherung bleibt unverändert.

## Migration Plan

Zuerst Konfiguration, Produktionstest, Workflow und Dokumentation lokal umsetzen und prüfen. Danach folgt die autorisierte Veröffentlichung: committen/pushen, Pages-Quelle aktivieren oder bestätigen, Workflow beobachten und den öffentlichen Link im Browser prüfen. Diese Schritte sind als Workflow-Follow-up außerhalb der vor dem Archivieren abschließbaren Implementierungsaufgaben dokumentiert.

Für eine Rücknahme kann der vorherige geprüfte Stand auf `main` wiederhergestellt und erneut veröffentlicht oder der Workflow deaktiviert werden. Es gibt keine zu migrierenden Serverdaten oder Simulationszustände. Browsergespeicherte Einstellungen werden durch ein Deployment nicht absichtlich gelöscht.

## Sources

- [Vite: Static deploy / GitHub Pages](https://vite.dev/guide/static-deploy.html) — Repository-Basis, Produktionsausgabe und Pages-Workflow; geprüft am 19.10.2026.
- [GitHub: Custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — Build-Artefakt, Deployment-Job und erforderliche Berechtigungen; geprüft am 19.10.2026.

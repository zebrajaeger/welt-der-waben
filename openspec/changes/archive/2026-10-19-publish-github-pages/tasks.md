# Tasks

## 1. Produktionsbuild und Browserprüfung

- [x] 1.1 Vite-Basis `/welt-der-waben/`, explizite Wurzelbasis für den Entwicklungsbefehl und einen Preview-Befehl ergänzen; Build-Ausgabe auf korrekte Assetpfade prüfen und den bisherigen lokalen Start samt HMR bestätigen. Die lokalen Build-/Preview-Schritte in docs/deployment.md dokumentieren.
- [x] 1.2 Eine deklarierte Playwright-Testabhängigkeit samt Lockdatei, isolierter Preview-Konfiguration und eigenem `.pw.ts`-Testmuster ergänzen; `test:production` muss Laden und Netzwerkantworten unter dem Unterpfad, laufende Simulation, Pause, Einzeltick, Neustart, Tempo sowie Übernehmen/Speichern/Neuladen prüfen. Testartefakte ignorieren und Installation sowie Prüfkommando in docs/deployment.md aufnehmen; gezielten Produktionstest ausführen und bestätigen, dass Vitest diese Dateien nicht entdeckt.

## 2. Automatische Veröffentlichung und Dokumentation

- [x] 2.1 `.github/workflows/pages.yml` mit Hauptbranch-Trigger, manueller Auslösung samt Branch-Guard, Node 22, npm ci, bestehenden Tests, Build, Chromium-Produktionscheck, Upload nur von dist/ und abhängigem Deploy-Job erstellen. Offizielle Action-SHAs, jobbezogene Berechtigungen, github-pages-Umgebung und Concurrency prüfen; YAML mit geeignetem Workflow-Validator validieren und Ablauf sowie Fehlergrenzen in docs/deployment.md dokumentieren.
- [x] 2.2 In README.md und README.de.md denselben vorgesehenen öffentlichen Link und Verweis auf docs/deployment.md ergänzen; Pages-Aktivierung, Origin-getrennte Einstellungen, erster Workflow-Aufruf und Live-Verifikation beschreiben. Alle lokalen Links und die fachliche Gleichwertigkeit beider Sprachfassungen prüfen; einen nicht verifizierten Live-Stand ausdrücklich als vorbereitet kennzeichnen.

## 3. Integrierte Abnahme

- [x] 3.1 Lockfile-Installation, npm test, npm run build und npm run test:production erfolgreich ausführen; lokale Entwicklung unter `/` sowie Produktionsvorschau unter `/welt-der-waben/` im Browser bestätigen. Produktionsdateien dürfen weder Entwicklungsserver-Abhängigkeiten noch die interne Zeitlupen-Testseite enthalten.
- [x] 3.2 Den fertigen Workflow gegen die Spezifikationsszenarien prüfen: Kein Deployment vor erfolgreich abgeschlossenem Prüfjob, keine Veröffentlichung anderer Branches, koordinierte überlappende Läufe und genau der geprüfte Build als Artefakt. Workflow-Validierung, git diff --check und openspec validate publish-github-pages --strict müssen erfolgreich sein.

## Workflow follow-up

- Nach autorisiertem Commit und Push die Pages-Quelle des Repositorys prüfen und gegebenenfalls auf „GitHub Actions“ setzen; fehlende Berechtigung konkret melden.
- Den ersten GitHub-Actions-Lauf beobachten, anschließend https://zebrajaeger.github.io/welt-der-waben/ im Browser samt Assetpfaden und wesentlicher Bedienung prüfen und erst dann als veröffentlicht bestätigen.

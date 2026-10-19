# Tasks

## 1. Kontakt halten und Beuteenergie sichtbar übertragen

- [x] 1.1 In `src/animation.ts` eine explizite Haltephase von Kontakt `0,50` bis Aussaugende `0,65` ergänzen und Nachziehen bis `1` beziehungsweise vor Karnivorenteilung bis `0,80` verschieben. Tests in `tests/animation.test.ts` müssen unveränderten Kontakt bei Beuteankunft, drei während des Aussaugens ruhende Jägerspitzen, anschließendes geordnetes Nachziehen und stetige Geometrie an allen Phasengrenzen belegen; die Zeittabelle in `docs/animation.md` aktualisieren.
- [x] 1.2 In `sampleAnimation` gejagte Beute bis zum Aussaugende sichtbar halten, ihre Energie und Spitzen kontinuierlich auf null zum Kontaktzentrum reduzieren und Jägerenergie aus dem Jagdereignis interpolieren. Tests müssen Kontakt-, Halbzeit- und Endwerte, Ausrichtung, vollständige Entfernung ohne Restlinien, Effizienz, Kappung, Nullgewinn sowie unveränderte Snapshots und identisches wiederholtes Sampling prüfen; den Ablauf in `docs/animation.md` erklären und die Darstellung mit `src/render.ts` verifizieren.
- [x] 1.3 Animationsfälle für stehende, bewegte und gerade geteilte Beute, parallele Jagden, unterlegene Jäger sowie nachfolgende Karnivorenteilung anpassen und erweitern. Tests müssen nur die gejagte Hälfte schrumpfen lassen, deren Energie nach Grasaufnahme verwenden, doppelte Bewohner-IDs ausschließen und bei `t=1` exakt den bestehenden Endzustand samt Ausrichtungen liefern.

## 2. Wiedergabe und Browserdarstellung absichern

- [x] 2.1 In `tests/playback.test.ts` kontrollierte Zeitpunkte innerhalb der Aussaugphase ergänzen: Pause, Fortsetzen, Tempoänderung, Einzelschritt, Neustart und übersprungene Bilder müssen Fortschritt erhalten beziehungsweise verwerfen, genau einen Schritt abschließen und dieselben Regelresultate ohne zusätzliche Berechnung oder Zufallsziehung liefern; bestehende Wiedergabeverträge weiterhin erfolgreich prüfen.
- [x] 2.2 Die Kontaktprüfungen in `scripts/browser-check.mjs` und `scripts/check-speed.mjs` auf sichtbare Beute bei Kontakt und Entfernung erst nach Aussaugen umstellen. Reproduzierbare Browserbilder müssen Kontakt, halbes Aussaugen, Abschluss ohne Reste und anschließendes Nachziehen zeigen; Pause, Tempowechsel im Aussaugen und Resize bei 0,25 und 8 Schritten/s prüfen und den Browsercheck in `docs/animation.md` dokumentieren.

## 3. Abschließende Integration

- [x] 3.1 `npm test`, `npm run build`, `openspec validate animate-predation-energy-transfer --strict` und den vollständigen Browsercheck erfolgreich ausführen. Den bestehenden Langlauf über 600 Übergänge einschließlich Teilung, Jagd und HMR bestehen lassen und die erzeugten Zwischenbilder auf stetige Übertragung, ruhenden Kontakt und restloses Verschwinden prüfen.

## 4. Erweiterung auf Grasaufnahme

- [x] 4.1 Grasaufnahmen vor und nach Teilung mit exakten Ausgangs- und Zielenergien aufzeichnen, Gras während einer Kontakt-Haltephase kontinuierlich abbauen und erst danach Spitzen nachziehen lassen. Tests müssen normale und stationäre Grasfresser, beide Teilungsfälle, Effizienz, Sättigung, kahle Ziele, eingefrorene Wiedergabe und unveränderte Endzustände samt Zufallsfolge bestätigen; Zeitleiste und Ereignisschnittstelle dokumentieren.
- [x] 4.2 Zeitlupenansicht und Browserprüfungen auf Gras-Saugphasen erweitern, Zwischenbilder für Kontakt, halbe Aufnahme und Nachziehen visuell prüfen sowie Pause, Tempoänderung und Resize bei 0,25 und 8 Schritten/s absichern. Vollständige Testsuite, Build, strikte Change-Validierung und Browserlauf über 600 Übergänge müssen erfolgreich bleiben.

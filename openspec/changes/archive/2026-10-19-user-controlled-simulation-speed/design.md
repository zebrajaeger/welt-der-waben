# Design

## Context

Siehe `proposal.md` für Motivation und Umfang. `src/main.ts` erstellt einen `Playback` aus `defaultConfig`; die Oberfläche in `index.html` besitzt drei Wiedergabetasten. `src/playback.ts` speichert verstrichene Millisekunden und berechnet den Fortschritt bei jedem Zugriff als `elapsed * config.stepsPerSecond / 1000`. Eine direkte Änderung dieses Konfigurationsfelds würde deshalb auch den bereits erreichten Fortschritt nachträglich skalieren und sichtbare Sprünge auslösen.

Die bestehende Animation in `src/animation.ts` ist bereits über normierte Zeit abfragbar. Ihre Kontakte, Teilungen und Grasaufnahme brauchen keine eigenen Tempoeinstellungen. `tests/playback.test.ts` prüft feste Tempos, Pause und Einzelschritt mit kontrollierten Zeitstempeln. Der Browsercheck prüft die Oberfläche bisher ausschließlich mit der Startgeschwindigkeit. Die Hauptspezifikation erlaubt einstellbare Wiedergabe bereits, verlangt aber noch keine Auswahl im UI.

## Goals / Non-Goals

**Goals:** Erreichten Fortschritt bei jeder Tempoänderung erhalten; die gesamte Wiedergabe mit einer einzigen Geschwindigkeit steuern; Konfigurationsobjekt und Regelberechnung unabhängig von der UI halten; vorhandene Bedienung wiederverwenden.

**Non-Goals:** Weitere Simulationsparameter einstellen, Tempo automatisch an Populationen anpassen, Zielschrittzahlen anspringen, Tempo pro Art oder Ereignis wählen, Einstellungen dauerhaft speichern oder die separate Diagnose-Zeitlupe umbauen.

## Decisions

### 1. Beschriftete native Auswahl mit Schritten pro Sekunde

Neben den bisherigen Tasten wird ein natives `select` mit zugeordnetem `label` „Tempo“ ergänzt. Die Optionen heißen „0,25 Schritte/s“, „0,5 Schritte/s“, „1 Schritt/s“, „2 Schritte/s“, „4 Schritte/s“ und „8 Schritte/s“. Die Startgeschwindigkeit aus der Konfiguration wird gewählt und, falls sie fehlt, als zusätzlicher numerisch einsortierter Wert aufgenommen. Optionen entstehen einmal beim Start; die Zeichenschleife baut das Eingabeelement nicht neu auf. `change` übergibt den numerischen Wert und `performance.now()` an die Wiedergabesteuerung. Bei einem Konfigurations- oder Canvas-Startfehler wird die Wiedergabebedienung einschließlich Tempo wie bisher deaktiviert.

Die bestehende `.controls`-Anordnung wird um Umbruch und Platz für Label und Auswahl ergänzt; Fokusdarstellung und Kontrast orientieren sich an den vorhandenen Tasten. Das Element bleibt in jeder Wiedergabeart freigeschaltet. Der ausgewählte Optionstext ist bereits die lesbare Anzeige des aktuellen Tempos; eine zweite, möglicherweise abweichende Tempoanzeige entfällt.

Alternative: freies Zahlenfeld oder kontinuierlicher Regler. Die feste Auswahl liefert für diese kleine Erweiterung eindeutige, gut testbare Werte, einschließlich achtfach langsamerer Wiedergabe als beim bisherigen Starttempo. Die konkreten Abstufungen sind eine dokumentierte Produktannahme, da keine vorgegeben wurden.

### 2. Fortschritt akkumulieren statt vergangene Zeit nachträglich umrechnen

`Playback` bekommt eine eigene positive, endliche Laufzeitgeschwindigkeit, initialisiert aus `config.stepsPerSecond`, einen lesbaren Getter und eine Methode `setStepsPerSecond(value, now)`. Die Regelkonfiguration bleibt unverändert. Statt des bisherigen Millisekundenzählers wird normierter Fortschritt akkumuliert: `progress += deltaMs * currentRate / 1000`.

Vor einem gültigen Tempowechsel wird bei einem laufenden Übergang die bis `now` verstrichene Zeit mit dem alten Tempo abgerechnet. Anschließend wird das neue Tempo gesetzt und der Zeitursprung auf `now` aktualisiert. Die Methode startet selbst keinen neuen Übergang. Erreicht die alte Zeitabrechnung dabei regulär das Ende des Schritts, wird er einmal abgeschlossen, bevor die neue Geschwindigkeit für spätere Zeit gilt. Ein ungültiger Wert wird vor jeder Zeitabrechnung zurückgewiesen und verändert weder Tempo noch Fortschritt. Ein pausierter Übergang rechnet keine Zeit an. Die vorhandene Begrenzung auf höchstens einen abgeschlossenen Übergang pro verspätetem Frame bleibt erhalten.

Beispiel: Bei 2 Schritten/s ist nach 100 ms der Fortschritt 0,2. Wechsel zu 4 Schritten/s bei genau diesem Zeitpunkt lässt ihn bei 0,2. Nach weiteren 50 ms beträgt er 0,4. Das direkte Multiplizieren aller bisherigen Millisekunden mit dem neuen Wert würde dagegen schon beim Wechsel einen Sprung auf 0,4 verursachen.

Alternative: Ein neues `Playback` oder einen neuen Animationsplan erzeugen. Das würde einen begonnenen Übergang verwerfen oder eine erneute Zufallsentscheidung riskieren. Alle Zeitänderungen bleiben deshalb auf derselben Steuerungsinstanz.

### 3. Wiedergabemodus und Lebensdauer der Auswahl beibehalten

Tempowahl schaltet weder zwischen Pause und Weiter um noch zwischen kontinuierlicher Wiedergabe und Einzelschritt. Einzelschritt wird gegebenenfalls schneller oder langsamer fertig und pausiert weiterhin einmalig am Ende. `reset` erhält die Laufzeitgeschwindigkeit, verwirft aber wie bisher Zustand und laufenden Übergang. Erst das Neuladen konstruiert eine neue Steuerung mit dem Konfigurationswert. Eine im pausierten Zustand gewählte Geschwindigkeit gilt bei der nächsten Fortsetzung oder beim nächsten Einzelschritt.

Die Auswahl wird über denselben `AbortController` wie die bestehenden UI-Listener aufgeräumt. Der Frame-Callback bleibt eindeutig: Tempowahl verwendet den bestehenden Ablauf zum Zeichnen und Planen, erzeugt aber keine zusätzliche unabhängige Schleife. Renderer und Simulationsregeln erhalten keinen UI-Zustand.

Alternative: Browser-Speicherung. Für den angefragten Umfang wird nur die aktuelle Seite berücksichtigt; zusätzliche Lade- und Validierungsregeln für gespeicherte Einstellungen sind nicht nötig.

## Risks / Trade-offs

- [Sprung beim Umstellen] → Normierten Fortschritt mit dem bisherigen Tempo bis zum Änderungszeitpunkt abrechnen und anschließend nur neue Zeit anders gewichten; Richtungswechsel und mehrere Änderungen testen.
- [Einzelschritt startet versehentlich Dauerspiel oder einen zusätzlichen Schritt] → Modus beim Setzen erhalten und die Zahl der Regelberechnungen mit kontrollierter Zeit prüfen.
- [Tempoanzeige passt nicht zur Konfiguration] → Ein gültiger abweichender Startwert wird als eigene Option aufgenommen; Anzeige und tatsächliche Laufzeitgeschwindigkeit stammen aus derselben Steuerung.
- [Zusätzliche Auswahl verdrängt Tasten auf Mobilgeräten] → Umbrechbare Steuerungsgruppe sowie Browserprüfung mit Tastatur und schmalem Viewport.
- [Hohe Sollgeschwindigkeit überfordert einzelne Geräte] → Die vorhandene Begrenzung gegen überlappende Übergänge und unbegrenztes Nachholen bleibt bestehen. Die Auswahl zeigt das gewählte Solltempo.

## Migration Plan

Keine Datenmigration oder neue Abhängigkeit. Zuerst die Zeitrechnung und Setzmethode mit Regressionstests ergänzen, danach UI und Browserprüfungen anbinden. Bestehende `Playback`-Aufrufer und Konstruktorwerte bleiben kompatibel. Eine Rücknahme entfernt die Auswahl und die Laufzeitänderung und verwendet wieder nur das konfigurierte Starttempo.

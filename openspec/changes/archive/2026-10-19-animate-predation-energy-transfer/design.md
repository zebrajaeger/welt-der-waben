# Design

## Context

Siehe `proposal.md` für die Motivation. `src/animation.ts` sampelt absolute normierte Schrittzeit ohne Nebenwirkungen. Bei `t=0,5` schaltet die Darstellung aktuell direkt auf `transition.hunted`: Beute ist entfernt und Karnivoren haben ihre gesamte Jagdenergie. `sampleMotion` zieht unmittelbar danach die Spitzen nach. Die Hauptspezifikation verlangt noch das sofortige Verschwinden; der Delta ersetzt diese Vorgabe ausdrücklich.

`hunt` zeichnet bereits Beute samt Energie, Karnivor vor der Jagd und das gekappte `energyAfter` auf. Die Snapshots enthalten außerdem die vollständig angekommenen und gefütterten Grasfresserhälften. Diese Daten reichen für die neue Darstellung aus. Der Renderer zeichnet selbst bei Energie null noch drei Striche; nur die Füllung zu reduzieren würde deshalb einen sichtbaren Rest hinterlassen.

## Goals / Non-Goals

**Goals:** Deterministische Zwischenbilder aus vorhandenen Ereignissen, eine eigenständige Haltephase und exakte bestehende Endzustände. Kontakt, Aussaugen, Nachziehen und anschließende Teilung verwenden dieselbe Playback-Zeit.

**Non-Goals:** Änderungen an Regelresultaten von `step`/`transition`, Energieeffizienz, Verbrauch, Konfliktentscheidung oder Zufallsfolge; zusätzliche Timer, Partikelsysteme, Ton oder neue Tempooptionen. Zusätzliche Aufzeichnungen zur Grasaufnahme sind Teil der Erweiterung.

## Decisions

### 1. Haltephase in der bestehenden normierten Zeitleiste

Kontakt und Grasfresserankunft bleiben bei `t=0,50`. Aussaugen belegt `0,50–0,65`. Die gesamte Karnivorengeometrie hält in dieser Phase ihre Kontaktpose. Normales Nachziehen läuft anschließend bis `1`; bei danach teilenden Karnivoren bis `0,80`, gefolgt von der vorhandenen Teilung bis `1`.

| Vorgang | Normierte Zeit |
| --- | --- |
| Vorstoß zum Beutezentrum | 0,30–0,50 |
| Aussaugen, alle Karnivorenspitzen halten | 0,50–0,65 |
| Zweite Spitze nachziehen, ohne folgende Teilung | 0,65–0,825 |
| Dritte Spitze nachziehen, ohne folgende Teilung | 0,825–1 |
| Zweite / dritte Spitze bei folgender Teilung | 0,65–0,725 / 0,725–0,80 |
| Führende Spitze zur Endposition | parallel zum gesamten Nachziehen |
| Karnivorenteilung, wenn aufgelöst | 0,80–1 |

Die Zeitpunkte sind eine gestalterische Annahme dieses Vorschlags. Zentrale Phasengrenzen und eine explizite Freigabe des Nachziehens verhindern getrennte Zahlen in Plan und Sampler. Die Motion-Schnittstelle erhält einen expliziten Nachziehbeginn. Die ergänzte Grasaufnahme nutzt diese Haltephase auch für Grasfresser und ihre hinausziehenden Teilungshälften.

Eine Verlängerung des gesamten Schritts würde die Bedeutung der eingestellten Schritte/s ändern. Ein eigener Timer würde Pause und Tempoänderung erschweren. Beide Alternativen entfallen.

### 2. Sichtbare Energie aus Jagdereignissen interpolieren

Für jede erfolgreiche Jagd ist `u = clamp((t - 0,50) / 0,15, 0, 1)`. Während des Aussaugens zeigt die Beute `prey.energy * (1-u)` und der Karnivor `animal.energy + (energyAfter-animal.energy)*u`. Die gleiche lineare Fortschrittsgröße verbindet beide Formen. Effizienzverlust und Kappung sind bereits im Zielwert enthalten; das Bild behauptet deshalb keinen ungekappten Energiegewinn. Auch bei Gewinn null wird die Beute vollständig verbraucht.

Ab Kontakt bleibt die übrige Darstellung auf dem passenden bestehenden Phasensnapshot. Für `0,50 <= t < 0,65` werden nur die konkret gejagten Beute-IDs als sichtbare Kopien ergänzt und ihre jeweiligen Jägerenergien überschrieben. Alternativ kann der Sampler in diesem Fenster `herbivores` als Grundlage verwenden und erfolgreiche Jäger gezielt abgleichen. Entscheidend sind eindeutige IDs und nur eine Darstellung je Tier. Die endgültige Beuteform stammt aus ihrer abgeschlossenen Bewegung oder Teilung, mit der korrekten Ausrichtung und Energie nach Zielgrasaufnahme.

Die Darstellung darf keine Simulation mutieren: sichtbare Überlagerung und Energieinterpolation bleiben Frame-Daten. Bei `t=1` muss weiterhin exakt `restFrame(transition.after, endAngles)` entstehen. Verbrauch und Karnivorenteilung bleiben in ihren vorhandenen nachfolgenden Phasen. Pro Frame inkrementierte Übertragungen entfallen, damit wiederholte oder rückwärts abgefragte Zeitpunkte dasselbe Bild liefern.

### 3. Die gesamte Beuteform ins Kontaktzentrum zusammenziehen

Die drei endgültigen Beutespitzen werden relativ zum Beutezentrum mit `1-u` skaliert. Zusammen mit sinkender Energie wird die Beute sichtbar leerer und kleiner, bis sie vollständig auf den Kontaktpunkt schrumpft. Bei `u=1` wird sie nicht mehr gerendert; insbesondere dürfen keine Nullenergie-Striche oder Punktreste bleiben. Ihre Farbe bleibt die Grasfresserfarbe; der wachsende Energiegehalt ist am Karnivorenkörper erkennbar.

Die vorhandene `shapes`-Schnittstelle kann das ausdrücken. Zunächst ist kein neues Rendererformat erforderlich. Ein bloßes Ausblenden würde den Energieabbau weniger deutlich zeigen; ein Partikelstrom würde zusätzliche Mechanik und visuelle Unruhe einführen. Das kontinuierliche Zusammenziehen erfüllt den gewünschten Prozess mit der vorhandenen Formensprache.

### 4. Bestehende Prüfungen auf die neue Kontaktsemantik umstellen

`tests/animation.test.ts`, Kontaktprüfungen in `scripts/browser-check.mjs` und die Tempo-Fixtures in `scripts/check-speed.mjs` erwarten derzeit Beuteentfernung bei `0,5`. Sie müssen bei Kontakt stattdessen die vollständige Beute und Ausgangsenergie prüfen, in der Mitte teilweise Übertragung und am Ende die vollständige Entfernung. Jagdkonflikte, neugeborene Beute, Teilung und die Langlaufprüfung bleiben abgedeckt.

Playback-Tests verwenden kontrollierte Zeitstempel innerhalb der Aussaugphase. Browserbilder zeigen vor Kontakt, Kontakt, halbes Aussaugen, Abschluss und Nachziehen bei langsamem Tempo. Eine zusätzliche Prüfung bei 8 Schritten/s und ausgelassenen Bildern sichert den exakten Abschluss ab. Der bestehende Browserlauf prüft weiterhin 600 Übergänge und HMR.

### 5. Erweiterung: Grasaufnahme vor dem Nachziehen

`consumeGrass` zeichnet bei vorhandener Grasmenge ein `graze`-Ereignis mit Bewohnerkopie, Zellindex, Grasmenge, gekapptem `energyAfter` und Kennzeichen für Aufnahme nach Teilung auf. Der Rechenablauf und die Zufallsziehungen bleiben gleich. Diese Daten vermeiden Schätzungen von Wirkungsgrad, Kappung oder Verbrauch aus späteren Snapshots.

Normale Grasfresser erreichen das Graszentrum bei `0,20`, saugen bis `0,30` und ziehen von `0,30–0,40–0,50` nach. Vor einer anschließenden Teilung werden diese Werte auf das Bewegungsende `0,30` skaliert: Kontakt `0,12`, Aussaugende `0,18`, zweite Spitze `0,24`. Teilungen behalten das Fenster `0,30–0,50`. Nach kurzem Anschwellen und Überlagern halbiert sich die Energie bis zum Graskontakt der hinausziehenden Hälften; anschließend wird deren jeweiliger Energiegewinn separat interpoliert. Die Bewegung beginnt bei `0,33`, Kontakt ist bei `0,398`, Aussaugende bei `0,432`, zweite Spitze bei `0,466` und Ankunft bei `0,50`. Eine verbleibende Hälfte erhält keine erneute Mahlzeit.

Gras sinkt während der Haltephase linear auf null; sein vorhandenes Kreis-/Ovalsymbol schrumpft entsprechend. Bewohnerenergie wächst vom aufgezeichneten Ausgangswert zum gekappten Ziel. Danach bleibt das Gras weg und die Energie bis zum regulären Abrechnungszeitpunkt erhalten. Verbrauch und mögliche Teilung verwenden weiterhin die unveränderten Regelwerte. Ein stationärer Grasfresser nimmt Gras am eigenen Zellzentrum im Fenster `0,20–0,30` auf, ohne eine erfundene Zellbewegung. Kahle Ziele erzeugen keine Mahlzeit.

Die bisherige Aussage, Zielgras verschwinde erst bei vollständiger Ankunft einer Hälfte, wird durch diese Kontakt-Haltephase ersetzt. Prüfungen für Gras und Teilung sowie die Zeitlupenansicht müssen den Zustand vor, während und nach dem Aussaugen abdecken.

## Risks / Trade-offs

- [Kurze Phase bei 8 Schritten/s] → Alle Phasen skalieren gemeinsam; bei 0,25 Schritten/s ist der Prozess gut beobachtbar, bei hoher Geschwindigkeit sind übersprungene Zwischenbilder zulässig.
- [Beutereste durch die Mindeststrichdarstellung] → Spitzen bis auf null skalieren und am Ende die Beute aus dem sichtbaren Frame entfernen; Browserbilder prüfen auch die letzten Zwischenbilder.
- [Sprung bei gejagten Teilungshälften] → Die endgültige Pose und gefütterte Energie am Kontakt übernehmen; nur diese Hälfte schrumpfen lassen, die andere unverändert zeigen.
- [Energiegewinn durch Snapshotwechsel vorweggenommen oder doppelt angewandt] → Alle Jagdenergien während des Fensters aus dem Ereignis ableiten; Endpunkt, Kappung, Nullgewinn, Snapshot-Unveränderlichkeit und wiederholtes Sampling testen.
- [Zu wenig Platz für anschließende Karnivorenteilung] → Das bisherige Teilungsfenster ab `0,80` erhalten und ausschließlich die Nachziehbewegung davor komprimieren.

## Migration Plan

Keine Datenmigration. Animation und zugehörige Prüfungen gemeinsam ändern, Zeitleiste in `docs/animation.md` aktualisieren und Tests, Build, Browserlauf sowie strikte Change-Validierung ausführen. Ein Rücksetzen der Darstellungsänderung stellt den bisherigen visuellen Ablauf wieder her; Regelzustände und Konfiguration bleiben kompatibel.

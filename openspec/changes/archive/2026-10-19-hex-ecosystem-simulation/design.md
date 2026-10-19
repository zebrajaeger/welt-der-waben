# Design

## Context

Siehe `proposal.md` für das Ziel. Aktuell existiert nur `package.json` mit einem Platzhalter-Testskript, ohne Anwendungscode oder Tests. Die beiden Delta-Specs definieren beobachtbares Verhalten; es gibt keine vorhandene Laufzeitarchitektur oder zu migrierende Daten.

## Goals / Non-Goals

**Goals:**
- Regelwerk unabhängig von Browser-Zeichenlogik halten, damit feste Testzustände direkt schrittweise ausgeführt werden können.
- Konfiguration als Datenobjekt mit zentraler Validierung; spätere UI-Overrides können auf derselben Schnittstelle aufbauen.
- Wiederholbare Tests trotz zufälliger Initialisierung und Konfliktauflösung ermöglichen.

**Non-Goals:**
- Persistenz, Server-Simulation, Netzwerk-Multiplayer oder eine Einstellungsoberfläche.
- Gefahrenabschätzung der Grasfresser, umlaufende Ränder oder kontinuierliche Physik zwischen Simulationsschritten.

## Decisions

### 1. Kleiner clientseitiger Stack

TypeScript, Vite und Canvas 2D für ein browserseitiges Projekt verwenden; Vite liefert Entwicklungsserver mit Hot Reload. Die Simulation bleibt eine reine, browserunabhängige Zustandsübergangslogik. Gegenüber einem komponentenbasierten UI-Framework vermeidet das bei 600 Zellen unnötige DOM-Knoten und Abhängigkeiten; gegenüber WebGL ist Canvas für diese Feldgröße einfacher. Ein Node-Testläufer für die Regeltests wird ergänzt.

### 2. Geometrie und Zustandsmodell

Zellen werden über `(column,row)` adressiert; eine feste odd-r/even-r-Hex-Offset-Konvention wird einmalig in Geometrie und Rendering genutzt. Ein Nachbarschaftshelfer liefert ausschließlich gültige Positionen innerhalb des Rasters. Pro Zelle: Grasmenge; pro Tier: stabile ID, Art, Position, Energie und frühester aktiver Schritt. Occupancy als Positionsindex entsteht aus den Tieren. Gras bleibt von Belegung getrennt, damit es auch unter Karnivoren wächst. Alternativen wie Pixelkoordinaten als Simulationszustand oder periodische Randnachbarn koppeln Regeln unnötig an Darstellung bzw. verletzen die gewählten festen Ränder.

### 3. Konfigurationsdatei und deterministische Zufallsquelle

Eine importierbare Standardkonfiguration enthält Maße, Grasmaximum und Zuwachs pro Schritt, getrennte Startzahlen, Maximalenergie, Energieverlust und Teilungsanteile beider Arten, die beiden Wirkungsgrade sowie Schritte pro Sekunde. Beispielstartwerte für noch unbestimmte Zahlen (anpassbar beim Implementieren, solange die Invarianten gelten): Grasmaximum 10, Zuwachs 1, Graswirkungsgrad 1, Grasfresser-Verlust 2, Karnivoren-Verlust 2, Beutewirkungsgrad 0,5, Energiemaximum beider Arten 20, Teilungsanteil 0,75, Wiedergabe 2 Schritte/s. `validateConfig` prüft endliche Zahlen, ganzzahlige positive Abmessungen, nichtnegative ganzzahlige Populationen, positive Gras-/Energiemaxima, nichtnegative Zuwächse/Wirkungsgrade, positive Verluste und Geschwindigkeit, Teilungsanteile > 0 und < 1, sowie `growth * herbivoreEfficiency < herbivoreDrain`. Bei Nullzuwachs bleibt die Regel sinnvoll; bei einem eingeschlossenen Tier ist Nettoverlust garantiert. Initialpositionen werden ohne Zurücklegen gezogen; Zufall wird an Init/Step injiziert, sodass Tests eine feste Zahlenfolge nutzen können. Keine `Math.random`-Aufrufe tief im Regelwerk. Alternative: Laufzeitwerte direkt aus UI lesen; das erschwert spätere Overrides und Tests.

### 4. Phasen und Konflikte

Ein Step arbeitet mit drei Phasen. Gras wächst gekappt. Vor der Grasfresserphase wird ein Occupancy-Snapshot erstellt. Alle zu Phasenbeginn aktiven Grasfresser wählen gleichzeitig unter snapshot-freien Nachbarn den maximalen Graswert; bei Gleichstand entscheidet Zufall. Pro Ziel gewinnt ein zufällig ausgewählter Bewerber. Unterlegene bleiben stehen; Ausgangszellen gelten für diese Bewegungsrunde weiter als belegt. Danach essen alle verbliebenen Grasfresser in ihrer endgültigen Position das gesamte Gras; Energiegewinn wird gekappt, anschließend wird der Verlust abgezogen und bei <= 0 gestorben. Für Teilungen werden mögliche freie Zielzellen auf Basis der nun tatsächlich belegten Zellen ermittelt; Eltern wählen eine zufällige freie Nachbarzelle, Konflikte werden zufällig aufgelöst; nur erfolgreiche Eltern halbieren ihre Energie. Gerade verlassene Zellen dürfen somit für Geburt frei sein, aber nicht als Bewegungsziel im selben Schritt. Gras auf der Geburtszelle bleibt bis zur ersten aktiven Grasfresserphase erhalten: Neugeborene handeln erst im nächsten Schritt. Für den nächsten Schritt auf alle Bewohner der Geburtszelle gilt Essen erst in ihrer eigenen Phase.

In der Karnivorenphase werden Beutekandidaten unter den jetzt benachbarten Grasfressern betrachtet, einschließlich Neugeborener. Jeder zu Phasenbeginn aktive Karnivor zieht zufällig höchstens einen Kandidaten; wählen mehrere denselben, gewinnt einer zufällig; Karnivoren ohne erfolgreichen Zugriff jagen in diesem Schritt nicht erneut. Erfolgreiche Karnivoren ziehen nach der Konfliktauflösung auf die jeweilige Beutezelle; unterlegene Karnivoren bleiben stehen. Gefressene Beute wird vor der Karnivoren-Energieabrechnung entfernt. Das Gras auf der Beutezelle bleibt unverändert. Die anschließende Teilung berücksichtigt die Nachbarschaft der neuen Position einschließlich der verlassenen Ausgangszelle. Energiegewinn aus Beute wird auf das Maximum gekappt, dann erfolgt Verlust, Tod und analog die Teilung der Karnivoren. Während einer Phase geborene Karnivoren jagen erst im nächsten Schritt. Diese Snapshot- und Abrechnungsgrenzen verhindern Reihenfolgeeffekte, Kaskadengeburten und Mehrfachverzehr; Alternative wäre sequentielle Einzelverarbeitung, die von Array-Reihenfolge abhängt.

### 5. Wiedergabe und Rendern

Ein Timer ruft `step` in festen logischen Einheiten auf; die konfigurierten Schritte pro Sekunde betreffen nur die reale Aufrufhäufigkeit. Canvas wird nach jedem Schritt neu aus dem Simulationszustand gezeichnet. Waben haben feste mathematische Sechseckkonturen und skalieren mit dem Viewport; Grasoval wird durch `grass / grassMax` skaliert. Arten bekommen unterschiedliche Farben. Die Dreizackform wird aus drei radialen Armen konstruiert: nahe null dünne Linien, mit wachsendem Energieanteil breitere gefüllte Keile, bei hohem Anteil ein zusammenhängendes gefülltes Dreieck. Ein einfacher Statusbereich zeigt Schrittzahl und Populationen; keine Einstellungsregler in dieser Änderung.

## Risks / Trade-offs

- [Default-Zahlen können unerwünschte Populationsverläufe erzeugen] -> In variablen Simulationsläufen testen und dokumentiert justieren, ohne die vereinbarten Startanteile oder Invarianten zu verletzen.
- [Zufall erschwert Fehlersuche] -> Zufallsquelle injizierbar halten und mit festen Folgen Konfliktfälle testen.
- [Zielkonflikte können Tiere trotz attraktiven Alternativen stehen lassen] -> Absichtlich nur ein Zielversuch pro Runde; durch Szenariotests absichern.
- [Canvas-Symbole bei niedriger Auflösung schwer unterscheidbar] -> Abweichende Farben und Kontrast testen, Zellgröße responsiv begrenzen.

## Migration Plan

Keine Migration vorhandener Nutzerdaten. Das npm-Platzhalterskript wird im Implementierungsschritt durch Entwicklungs-, Build- und Testskripte ersetzt; zur Rücknahme reicht das Zurücknehmen dieser neu eingeführten Anwendungsteile.

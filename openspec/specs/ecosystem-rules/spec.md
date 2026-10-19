# ecosystem-rules Specification

## Purpose

Definiert die nachvollziehbaren Regeln und konfigurierbaren Anfangsbedingungen des Ökosystems auf einem begrenzten Sechseckraster.

## Requirements

### Requirement: Konfigurierbares Wabenfeld
Die Simulation SHALL ein Feld aus konfigurierbar vielen Spalten und Reihen erzeugen (Standard 30 x 20). Jede Zelle SHALL nur die innerhalb der festen Feldgrenzen liegenden, höchstens sechs geometrisch benachbarten Zellen kennen; gegenüberliegende Ränder SHALL nicht verbunden sein.

#### Scenario: Nachbarschaft am Rand
- **WHEN** eine Zelle am Außenrand betrachtet wird
- **THEN** gehören nur tatsächlich innerhalb des Felds liegende Zellen zu ihren Nachbarn

### Requirement: Konfigurierbares lineares Graswachstum
Jede Zelle SHALL pro Tick ein Sechzigstel der konfigurierten Wachstumsrate pro Simulationssekunde bis zum Grasmaximum erhalten, unabhängig von laufenden Aktionen. Beim Start SHALL jede Zelle 50 % des Maximums besitzen.

#### Scenario: Wachstumsgrenze
- **WHEN** die Summe aus vorhandenem Gras und Tickzuwachs das Maximum überschreitet
- **THEN** beträgt die Grasmenge nach diesem Tick genau das Maximum

### Requirement: Getrennte Startpopulationen
Die Simulation SHALL die konfigurierte Anzahl beider Arten (Standard jeweils zehn) zufällig auf unterschiedliche Zellen verteilen und jeder Art initial 50 % ihrer separat konfigurierten Maximalenergie zuweisen. Gras unter einem initialen Grasfresser SHALL auf null gesetzt werden, ohne dessen Startenergie zu erhöhen.

#### Scenario: Startzustand
- **WHEN** eine Simulation mit Standardanzahlen startet
- **THEN** existieren zehn Grasfresser und zehn Karnivoren auf 20 verschiedenen Zellen mit jeweils halber artspezifischer Maximalenergie
- **AND** auf jeder initial von einem Grasfresser besetzten Zelle ist das Gras null

### Requirement: Validierte Konfiguration
Die Simulation SHALL endliche Konfigurationswerte mit klaren Einheiten prüfen. Abmessungen, Zeitfaktor, Maxima, Verbrauchsraten und Transferrate SHALL positiv sein, Wachstum und Wirkungsgrade nicht negativ. Bewegungs- und Wartezeiten SHALL positive Tickzahlen sein. Populationen SHALL ganzzahlig und nicht negativ sein und ins Feld passen; Teilungsanteile SHALL strikt zwischen null und eins liegen.

#### Scenario: Eingesperrter Grasfresser könnte überleben
- **WHEN** Graswachstum pro Simulationssekunde mal Graswirkungsgrad mindestens dem Verbrauch pro Simulationssekunde entspricht
- **THEN** wird die Konfiguration mit einer Erklärung dieser Bedingung abgewiesen

#### Scenario: Zu viele Startlebewesen
- **WHEN** die Summe der Startpopulationen größer als die Zellenzahl ist
- **THEN** startet die Simulation nicht und meldet den Belegungsfehler

### Requirement: Eingeschlossene Grasfresser verhungern
Die Simulation SHALL nur Konfigurationen akzeptieren, in denen Graswachstum pro Simulationssekunde mal Graswirkungsgrad strikt kleiner als der Energieverbrauch eines Grasfressers pro Simulationssekunde ist. Verbrauch SHALL auch bei blockierten, wartenden und fressenden Bewohnern anfallen.

#### Scenario: Gleich großer Energiegewinn und Verbrauch
- **WHEN** Wachstum mal Graswirkungsgrad genau dem Verbrauch pro Simulationssekunde entspricht
- **THEN** wird die Konfiguration zurückgewiesen

### Requirement: Feste Phasen und Belegung
Die Simulation SHALL mit 60 Ticks pro Simulationssekunde und unabhängigen Bewohneraktionen laufen. Eine Zelle SHALL höchstens einen Bewohner besitzen; laufende Züge und Teilungen SHALL ihre Ziele exklusiv reservieren. Normale Züge SHALL höchstens eine Nachbarzelle weit führen. Neue Hälften SHALL erst nach Abschluss ihrer eigenen Teilungsbewegung und Wartezeit selbst handeln. Kein Bewohner SHALL auf unbeteiligte Aktionen warten müssen.

#### Scenario: Eintritt in Jagdreichweite
- **WHEN** ein Grasfresser bei seiner eigenen Ankunft in die Nachbarschaft eines bereiten Karnivoren gelangt
- **THEN** kann dessen nächste eigene Jagd ihn ohne globale Karnivorenphase erfassen

### Requirement: Grasfresser wählen Gras statt Sicherheit
Ein handlungsbereiter Grasfresser SHALL anhand der aktuellen Belegung und Reservierungen ein freies Nachbarfeld mit maximalem Graswert wählen, unabhängig von Karnivoren. Gleichstände und gleichzeitige Zielkonflikte SHALL reproduzierbar zufällig entschieden werden. Ist kein Ziel verfügbar, SHALL der Grasfresser lokal fressen oder bis zu seinem nächsten eigenen Versuch warten.

#### Scenario: Beste Zelle grenzt an Karnivor
- **WHEN** die freie Nachbarzelle mit dem höchsten Graswert neben einem Karnivoren liegt
- **THEN** bleibt sie ohne Gefahrenabschlag als Ziel wählbar

#### Scenario: Zielkonflikt
- **WHEN** mehrere gleichzeitig bereite Grasfresser dieselbe Zielzelle wählen
- **THEN** reserviert genau einer sie, zufällig ausgewählt; die anderen bleiben zunächst in ihren Ausgangszellen

#### Scenario: Verlassene Zelle
- **WHEN** ein Grasfresser seine Ausgangszelle bei vollständiger Ankunft freigibt
- **THEN** kann sie ab dem folgenden Tick neu reserviert werden, ohne auf eine Weltrunde zu warten

### Requirement: Grasfresser wandeln Gras in Energie um
Ab Kontakt SHALL ein Grasfresser Gras mit konstanter Energieübertragungsrate aufnehmen. Die Mahlzeit SHALL durch verfügbares Gras und freie Energiekapazität bei Kontakt begrenzt sein. Nur tatsächlich übertragene Energie geteilt durch Graswirkungsgrad SHALL entnommen werden; Überschuss und nachwachsendes Gras SHALL erhalten bleiben. Aufnahme SHALL auch am eigenen Standort und bei hinausziehenden Teilungshälften erfolgen.

#### Scenario: Dauerhaft eingeschlossen
- **WHEN** ein Grasfresser dauerhaft keine freie Nachbarzelle hat
- **THEN** kann er nur lokales Gras aufnehmen und verliert wegen des zeitabhängigen Verbrauchs langfristig netto Energie

#### Scenario: Grasaufnahme nach Teilung
- **WHEN** eine oder beide Hälften in reservierte Teilungszellen schreiten
- **THEN** nehmen sie dort ab Spitzenkontakt zeitlich begrenzt Gras auf und vollenden danach ihre Bewegung
- **AND** wird keine zweite Mahlzeit für eine stehenbleibende Hälfte oder sofortige Teilungskaskade im selben Tick ausgelöst

#### Scenario: Beuteenergie nach Teilung und Grasaufnahme
- **WHEN** ein Karnivor eine gerade in einer Teilungszelle angekommene Hälfte angreift
- **THEN** wird deren dann aktuelle Energie einschließlich bereits erfolgter Grasaufnahme und Verbrauch verwendet

### Requirement: Karnivoren jagen höchstens eine Beute
Ein bereiter Karnivor SHALL je eigener Jagd höchstens einen erreichbaren Grasfresser exklusiv beanspruchen und ab Kontakt Energie mit konstanter Rate entziehen. Die Aufnahme SHALL durch freie Kapazität und verfügbare Beuteenergie bei Kontakt begrenzt sein. Überschüssige Beuteenergie SHALL erhalten bleiben. Nur bei Tod der Beute SHALL der Jäger ihre Zelle einnehmen; andernfalls SHALL er zurückziehen. Ohne Ziel SHALL er lokal warten.

#### Scenario: Erfolgreiche Jagd mit Bewegung
- **WHEN** ein Karnivor einen Grasfresser vollständig aufzehrt
- **THEN** belegt er nach dem Nachziehen die bisherige Beutezelle und gibt seine Ausgangszelle frei
- **AND** bleibt das Gras der Beutezelle außer regulärem Wachstum unverändert

#### Scenario: Teilung nach erfolgreicher Jagd
- **WHEN** ein Karnivor nach vollständiger Jagd und Ankunft über seiner Teilungsschwelle liegt
- **THEN** werden aktuell freie Nachbarzellen seiner neuen Position einschließlich der verlassenen Ausgangszelle berücksichtigt

#### Scenario: Jagd ohne Erfolg
- **WHEN** ein Karnivor keine Beute findet oder einen Konflikt verliert
- **THEN** bleibt er stehen und versucht erst nach seiner eigenen Wartezeit erneut zu handeln

#### Scenario: Gemeinsame Beute
- **WHEN** zwei gleichzeitig bereite Karnivoren dieselbe Beute wählen
- **THEN** erhält genau einer die exklusive Jagdreservierung und entzieht Energie; der andere wartet lokal

### Requirement: Energieverlust, Tod und Teilung
Beide Arten SHALL in jedem Tick ihre Verbrauchsrate geteilt durch 60 verlieren und bei Energie <= 0 sterben. Ein bereiter Bewohner oberhalb seiner Teilungsschwelle SHALL bei Platz seine Energie gleich teilen. Bei einem freien Nachbarn SHALL eine Hälfte bleiben, bei mindestens zwei SHALL beide in unterschiedliche reservierte Nachbarn ziehen. Konflikte SHALL atomar ohne Doppelbelegung aufgelöst werden; nur erfolgreiche Teilungen SHALL Energie halbieren.

#### Scenario: Kein Platz für Nachwuchs
- **WHEN** ein zur Teilung bereiter Bewohner keinen freien Nachbarn hat
- **THEN** teilt er sich nicht und verbraucht bis zum nächsten lokalen Versuch weiterhin Energie

#### Scenario: Geburt nach Grasfresserphase
- **WHEN** ein Grasfresser zwei Hälften erzeugt
- **THEN** vollenden diese ihre eigenen Teilungsbewegungen und Wartezeiten, bevor sie eigene Aktionen beginnen
- **AND** können erreichbare Hälften nach ihrer Ankunft lokal gejagt werden, ohne dass andere Bewohner ihre Aktionen abschließen müssen

#### Scenario: Aufgebrauchte Energie
- **WHEN** die Energie eines Bewohners in einem Tick null oder geringer wird, auch während einer Aktion
- **THEN** wird er entfernt, führt keine weitere Aktion aus und gibt seine Reservierungen frei

#### Scenario: Nur eine freie Zelle
- **WHEN** genau eine Nachbarzelle frei ist
- **THEN** bleibt eine Hälfte am Teilungsursprung und die andere reserviert diese Nachbarzelle

#### Scenario: Zwei oder mehr freie Zellen
- **WHEN** mindestens zwei Nachbarzellen frei sind
- **THEN** werden zufällig zwei unterschiedliche freie Zellen für die Hälften reserviert; der Ursprung wird nach dem Hinausziehen frei

#### Scenario: Gemeinsame Teilungsziele
- **WHEN** mehrere gleichzeitige Teilungen dieselben Ziele beanspruchen
- **THEN** werden sie in reproduzierbar zufälliger Reihenfolge vollständig angenommen oder verworfen
- **AND** bleibt ein unterlegenes Tier ohne Energiehalbierung am Ursprung

### Requirement: Energieabhängige begrenzte Transferdauer
Eine Mahlzeit SHALL ab Kontakt höchstens die dort verfügbare nutzbare Nahrung und freie Kapazität binden. Pro Tick SHALL höchstens die Transferrate geteilt durch 60 übertragen werden. Die Dauer SHALL der tatsächlich übertragenen Energie geteilt durch die Rate entsprechen, auf Ticks aufgerundet. Verbrauch und Wachstum SHALL parallel weiterlaufen; sie SHALL eine Mahlzeit nicht unbegrenzt verlängern.

#### Scenario: Doppelte Energiemenge
- **WHEN** unter sonst gleichen Bedingungen eine Mahlzeit doppelt so viel Energie tatsächlich überträgt
- **THEN** dauert ihr Aussaugen doppelt so lange, bis auf höchstens einen Tick Rundungsabweichung

#### Scenario: Kapazitätsgrenze und Wirkungsgrad null
- **WHEN** die freie Kapazität bei Kontakt begrenzt ist oder der Wirkungsgrad null beträgt
- **THEN** wird nur die gebundene nutzbare Menge aufgenommen und überschüssige Nahrung nicht verworfen
- **AND** endet ein Versuch ohne nutzbare Energie ohne Aussaugschleife und ohne Nahrungsentnahme

#### Scenario: Teilweise ausgesaugte Beute
- **WHEN** der Jäger sein Aufnahmebudget erreicht, während die Beute positive Restenergie besitzt
- **THEN** bleibt die Beute in ihrer Zelle am Leben und setzt ihren eigenen Ablauf nach Freigabe fort
- **AND** zieht der Jäger zur Ausgangsform zurück, ohne die belegte Beutezelle einzunehmen

### Requirement: Reproduzierbare unabhängige Aktionsplanung
Die Simulation SHALL Aktionsbereitschaft je Bewohner führen und initiale Bereitschaften über mehrere Ticks verteilen. Gleicher Anfangszustand, Konfiguration und Zufallsstrom SHALL nach derselben Tickzahl denselben Zustand ergeben, unabhängig von Bildrate oder Tempo. Pro Bewohner SHALL höchstens eine eigene Aktion gleichzeitig laufen; Konflikte und Abbrüche SHALL keine verwaisten Reservierungen hinterlassen.

#### Scenario: Lokale Verzögerung
- **WHEN** ein Bewohner lange saugt oder sich teilt und ein unbeteiligter Bewohner seine Aktion beendet
- **THEN** beginnt der zweite seinen nächsten lokalen Ablauf ohne auf den ersten zu warten
- **AND** wachsen sämtliche Grasfelder mit jedem Tick weiter

#### Scenario: Abbruch durch Tod
- **WHEN** Jäger oder Ziel vor Kontakt sterben oder ein beteiligter Bewohner während des Aussaugens stirbt
- **THEN** endet die unmögliche Interaktion ohne weitere Energieübertragung und die zugehörigen Sperren werden freigegeben
- **AND** bleiben bereits übertragene Energie und Restnahrung korrekt verbucht

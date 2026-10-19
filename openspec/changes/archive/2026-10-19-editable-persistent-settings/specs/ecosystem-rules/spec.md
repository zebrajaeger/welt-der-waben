# Spec Delta

## MODIFIED Requirements

### Requirement: Getrennte Startpopulationen
Die Simulation SHALL die konfigurierte Anzahl beider Arten (Standard jeweils zehn) zufällig auf unterschiedliche Zellen verteilen und jeder Art ihre separat konfigurierte Startenergie zuweisen (Standard jeweils 10). Startenergie SHALL endlich, größer als null und höchstens gleich der jeweiligen Maximalenergie sein. Gras unter einem initialen Grasfresser SHALL auf null gesetzt werden, ohne dessen Startenergie zu erhöhen.

#### Scenario: Startzustand
- **WHEN** eine Simulation mit Standardwerten startet
- **THEN** existieren zehn Grasfresser und zehn Karnivoren auf 20 verschiedenen Zellen mit jeweils 10 Energie
- **AND** auf jeder initial von einem Grasfresser besetzten Zelle ist das Gras null

#### Scenario: Unabhängige Startenergien
- **WHEN** gültige unterschiedliche Startenergien für beide Arten übernommen und die Karte gestartet oder neu gestartet wird
- **THEN** besitzt jedes initiale Tier genau die konfigurierte Startenergie seiner Art, unabhängig vom Maximum
- **AND** verwendet eine spätere Teilung weiterhin die Hälfte der dann aktuellen Energie

#### Scenario: Ungültige Startenergie
- **WHEN** Startenergie nicht endlich, null, negativ oder größer als die Maximalenergie der Art ist
- **THEN** wird die Konfiguration mit einer verständlichen Meldung abgewiesen
# Spec Delta

## Purpose

Macht den Zustand und Ablauf des Wabenökosystems im Browser sichtbar und unterstützt eine schnelle Rückmeldung während der Entwicklung.

## ADDED Requirements

### Requirement: Visuelle Waben und Gras
Der Browser SHALL das gesamte Sechseckfeld mit unterscheidbaren Zellgrenzen zeichnen und das Gras jeder Zelle als mittigen Kreis beziehungsweise mittiges Oval darstellen, dessen Größe mit der vorhandenen Grasmenge skaliert.

#### Scenario: Unterschiedlicher Grasbestand
- **WHEN** zwei gleich große Zellen unterschiedliche Grasanteile besitzen
- **THEN** erscheint in der Zelle mit mehr Gras das größere mittige Grassymbol

### Requirement: Energieabhängige Lebewesensymbole
Der Browser SHALL Grasfresser und Karnivoren unterscheidbar als dreizackige Sterne darstellen. Bei geringer Energie SHALL die Form aus drei dünnen Strichen bestehen und bei hoher Energie zu einem ausgefüllten dreieckigen Symbol werden; dazwischen SHALL die Füllung mit dem Anteil an der jeweiligen Maximalenergie zunehmen.

#### Scenario: Energieunterschied
- **WHEN** ein fast verhungerndes und ein energiereiches Lebewesen angezeigt werden
- **THEN** ist das erste als drei Striche und das zweite als gefülltes Dreieck erkennbar

### Requirement: Feste Simulationstakte und einstellbare Wiedergabe
Der Browser SHALL die Simulation in gleich langen logischen Schritten wiedergeben. Eine konfigurierte Wiedergabegeschwindigkeit SHALL nur die Häufigkeit der angezeigten Simulationsschritte bestimmen und nicht Graswachstum oder Energieverbrauch pro Schritt verändern.

#### Scenario: Geschwindigkeitsänderung
- **WHEN** die Wiedergabegeschwindigkeit erhöht wird
- **THEN** erfolgen pro realer Zeit mehr Simulationsschritte, aber ein einzelner Schritt verwendet unveränderte Wachstums- und Verbrauchswerte

### Requirement: Entwicklungsaktualisierung
Die Entwicklungsumgebung SHALL beim Ändern von Anwendungscode im laufenden Entwicklungsprozess den Browser automatisch aktualisieren, sodass die aktuelle Darstellung ohne manuelles Neuladen sichtbar wird.

#### Scenario: Quelltextänderung im Entwicklungsmodus
- **WHEN** eine Anwendungsdatei bei laufendem Entwicklungsserver geändert wird
- **THEN** zeigt der Browser die aktualisierte Version ohne manuelles Neuladen an

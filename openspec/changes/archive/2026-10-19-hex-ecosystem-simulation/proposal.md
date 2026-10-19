# Proposal

## Why

Das Projekt hat bisher nur ein npm-Grundgerüst. Eine im Browser beobachtbare Wabensimulation soll das Zusammenspiel von Gras, beweglichen Grasfressern und bei erfolgreicher Jagd auf die Beutezelle ziehenden Karnivoren mit nachvollziehbaren, konfigurierbaren Regeln erlebbar machen.

## What Changes

- Ein begrenztes, konfigurierbares Sechseckraster (Standard: 30 Spalten, 20 Reihen) mit linearem Graswachstum und je einer Grasmenge pro Zelle.
- Eine schrittbasierte Ökosystemsimulation in der Reihenfolge Gras, Grasfresser, Karnivoren: Bewegung zur grasreichsten freien Nachbarzelle, Nahrungsaufnahme, Energieverlust, Tod und Teilung; Konflikte werden zufällig gelöst.
- Eine Startbelegung mit je zehn Lebewesen auf verschiedenen Zellen, halber Maximalenergie und halb gefüllten Graszellen sowie validierte, getrennt einstellbare Parameter für beide Arten.
- Browserdarstellung von Waben, Gras und energieabhängigen dreizackigen Lebewesen; feste Simulationsschritte mit separat einstellbarer Abspielgeschwindigkeit sowie Entwicklungsserver mit automatischer Browser-Aktualisierung bei Codeänderungen.
- Keine Einstellungsoberfläche in diesem Schritt: Die Konfigurationswerte sollen später durch solche Komponenten zur Laufzeit überschreibbar sein. Keine Risikovermeidungslogik für benachbarte Karnivoren und noch keine umlaufenden Feldränder.

## Capabilities

### New Capabilities

- `ecosystem-rules`: Raster, Initialisierung, Zeit- und Energiehaushalt, Bewegung, Jagd, Konflikte und Fortpflanzung.
- `simulation-presentation`: Browserdarstellung, Abspielverhalten und Entwicklungsaktualisierung.

### Modified Capabilities

Keine.

## Impact

- Neue Simulationslogik, Konfigurationsdatei und Validierung sowie Browseroberfläche mit Zeichenlogik und Tests.
- Anpassung des bisherigen npm-Grundgerüsts für Entwicklung, Tests und Browser-Build; keine bestehenden Anwendungs-APIs oder Datenmigrationen.

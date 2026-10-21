# Proposal

## Why

Die Anwendung hinterlegt bisher kein Favicon; der Browser zeigt daher sein Standardsymbol. Eine Wabe mit einem Carnivoren bei halber Energie macht die Simulation bereits im Browser-Tab wiedererkennbar.

## What Changes

- Ein eigenes Browser-Favicon zeigt eine einzelne Wabe mit einem mittigen Carnivoren bei 50 % seiner Maximalenergie.
- Farbe und dreizackige Form orientieren sich an der bestehenden Simulationsdarstellung; die halbe Energie wird durch die vorhandene Zwischenform ausgedrückt.
- Das Icon bleibt in kleinen Tabgrößen erkennbar und wird lokal sowohl in der Entwicklung als auch unter dem GitHub-Pages-Unterpfad ausgeliefert.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `static-site-delivery`: Eigenes, statisch ausgeliefertes Browser-Favicon mit dem Waben-/Carnivorenmotiv.

## Impact

Betroffen sind ein neues lokales SVG-Asset, die Icon-Verknüpfung im HTML-Kopf und eine gezielte Produktions-Browserprüfung. Es werden keine neuen Abhängigkeiten benötigt. Als Standardicon wird das Browser-Favicon verstanden; Betriebssystem-/Installationsicons und ein Web-App-Manifest gehören nicht zu diesem Change.

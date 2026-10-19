# Design

## Context

Siehe `proposal.md` für die Motivation. `index.html` enthält einen Titelblock mit `.eyebrow` und `h1`, daneben die umbrechenden Wiedergabebedienelemente. `main` verteilt die verfügbare Höhe über Flexbox; jede zusätzliche Höhe im Kopf verkleinert das Spielfeld. Die vorhandene `.eyebrow` hat bereits einen Abstand von sechs Pixeln zur Überschrift. Die Darstellungsspezifikation verlangt zudem bei 360 Pixel Breite erreichbare Bedienung ohne horizontales Scrollen.

## Goals / Non-Goals

**Goals:** Ein semantischer HTML-Link, der den vorhandenen Titelbereich nutzt und unabhängig von der Simulationslogik funktioniert. Keine zusätzliche Höhe bei normalem oder fokussiertem Zustand.

**Non-Goals:** Neue Navigation, eigene Fußzeile, GitHub-Widgets oder Änderungen am Canvas und dessen Größenberechnung.

## Decisions

### Symbol in der vorhandenen kleinen Kopfzeile

Die `.eyebrow` wird zum Positionierungsbezug. Der Link sitzt an ihrem rechten Rand neben dem Text; ein kleiner horizontaler Innenabstand reserviert seinen Platz. Absolute Positionierung und vertikale Zentrierung halten die bisherige Zeilenhöhe unverändert. Geplant sind etwa 16 Pixel Symbolgröße und eine mindestens 24 × 24 Pixel große Klickfläche. Sichtbare Fokusmarkierung, vorhandener Zeilenabstand und Außenabstand müssen zusammenpassen, ohne Titel oder übrige Inhalte zu überdecken.

Alternative: ein zusätzliches Element in `.controls` kann die Bedienelemente früher umbrechen lassen. Ein Footer-Link kann eine zusätzliche Footerzeile erzeugen. Ein schwebender Link über dem Spielfeld würde Zeicheninhalt überdecken. Der Titelbereich vermeidet diese Platzkonflikte.

### HTML-Link mit lokalem Symbol

Ein `a`-Element in `index.html` erhält die feste Repository-URL, `target="_blank"`, `rel="noopener noreferrer"` und die Beschriftung „Quellcode auf GitHub (neuer Tab)“ über `aria-label` sowie einen entsprechenden Tooltip. Ein eingebettetes dekoratives SVG nutzt `currentColor` und wird für assistive Technik ausgeblendet. Es gibt keine externe Bildanfrage und keinen JavaScript-Handler. Farbe, Hover und Fokus passen zu den vorhandenen Bedienelementen.

Alternative: Eine Symbolbibliothek oder ein externes GitHub-Badge wäre für diesen einzelnen Link unnötig. Eine reine Symbolbeschriftung ohne zugänglichen Namen würde das Ziel für Tastatur- und Screenreader-Nutzer nicht ausreichend erklären.

### Layout gegen den bisherigen Kopf vergleichen

Die Produktions-Browserprüfung misst Kopf und Zeichenfläche im pausierten Zustand bei 1440 × 900, 360 × 740 und 360 × 480 Pixel, jeweils mit geschlossenen und geöffneten Einstellungen. Als Vergleich wird in derselben Seite der hinzugefügte Link samt ausschließlich dafür reserviertem horizontalem Abstand vorübergehend entfernt; übrige Stile bleiben identisch. Unterschiede der Höhen dürfen höchstens einen CSS-Pixel betragen. Zusätzlich werden Überlappungen mit Kopftext und Bedienelementen, Seitenbreite, Tastaturfokus, Linkziel und Öffnen eines neuen Tabs geprüft. Ein abgefangener Repository-Aufruf bestätigt das Ziel ohne Abhängigkeit von GitHub-Verfügbarkeit.

## Risks / Trade-offs

- [Symbol oder Fokus überdeckt bei kleinen Fenstern Nachbartext] → Horizontalen Platz reservieren und tatsächliche Rechtecke sowie Screenshots in der vorgesehenen Größenmatrix prüfen.
- [Klickfläche erhöht unbemerkt den Kopf] → Link außerhalb des normalen Zeilenflusses platzieren und Höhen gegen das bisherige Layout vergleichen.
- [Symbol allein erklärt das Ziel nicht] → Erkennbares GitHub-Symbol, Tooltip und vollständiger zugänglicher Name einschließlich neuem Tab.

## Migration Plan

Es sind keine Datenmigration und keine Änderungen an Einstellungen nötig. Die bestehende Build- und Pages-Pipeline veröffentlicht HTML und CSS nach den Produktionsprüfungen. Eine Rücknahme entfernt nur Link und zugehörige Stile.

# Design

## Context

Siehe `proposal.md` für die Motivation. Das Projekt verwendet TypeScript, Vite und direkte DOM-/Canvas-Ausgabe ohne UI-Framework. Deutsche Texte stehen sowohl in `index.html` als auch in `main.ts`, den Einstellungsmodulen und der Verlaufsdarstellung. `history-format.ts` und `history-chart.ts` erzeugen deutsche `Intl.NumberFormat`-Instanzen. Browserchecks setzen deutsche Beschriftungen voraus, obwohl die Browser-Locale bislang nicht überall ausdrücklich festgelegt ist.

Die Fehlerbehandlung benötigt besondere Aufmerksamkeit: Konfigurationsprüfung und Dateiformatprüfung erzeugen deutsche Meldungen; `settings.ts` erkennt teilweise einen Parameterpfad am Meldungspräfix. Speicherhinweise werden schon vor dem Aufbau der Panels erzeugt. Parameterpfade und Fehlermarkierungen dürfen bei der Übersetzung nicht verloren gehen.

Die statische Bereitstellung unter `/welt-der-waben/`, Einstellungen einschließlich älterer Dateiversionen und die Layoutgarantien des Diagramms bleiben verbindlich. Bestehende Spezifikationen schreiben teilweise deutsche Beschriftungen oder Dezimalkommas ausdrücklich vor; die Spec-Deltas ersetzen diese Festlegung durch sprachabhängige Ausgabe.

## Goals / Non-Goals

**Goals:** Eine kleine gemeinsame Lokalisierungsschnittstelle trennt Darstellung von Simulation und Datenformat. Sprachdateien sind die zentrale Quelle für übersetzbare Meldungen; Fehler bleiben maschinenlesbar. Zusätzliche Sprachdateien werden ohne fallweise Sprachzweige in der UI erkannt.

**Non-Goals:** Kein UI-Framework, kein Übersetzungsdienst, keine Änderung der Simulationsregeln und keine Migration gespeicherter Einstellungen. Die separate Sprachpräferenz wird nicht Teil der Simulationskonfiguration.

## Decisions

### 1. i18next mit lokal eingebundenen JSON-Katalogen

`src/i18n.ts` kapselt eine eigene i18next-Instanz mit Übersetzung und zwischengespeicherten Zahlenformatierern. `src/locales/en.json` ist der vollständige Referenzkatalog, `de.json` enthält die vollständige deutsche Übersetzung. Ressourcen werden durch einen eager Vite-Glob eingebunden; unterstützte Sprachen ergeben sich aus den Dateinamen. Ein neuer Katalog benötigt einen Build, aber keine Änderung einer Sprachliste oder UI-Verzweigung.

Englisch wird ausdrücklich als Fallback gesetzt; fehlende oder leere übersetzte Einträge fallen auf Englisch zurück. Ein Katalogtest prüft Schlüssel und Interpolationsparameter gegen Englisch und meldet unvollständige Übersetzungen. Vollständige Sätze mit benannten Parametern ersetzen zusammengesetzte Satzfragmente. Sprachabhängige Pluralformen verwenden die Bibliothekskonventionen, falls ein Text sie benötigt.

Ein eigener Übersetzungsmechanismus würde Fallback und Interpolation erneut implementieren. Ein Browser-Detector-Plugin oder nachgeladene Ressourcen sind für die überschaubare Startauswahl unnötig. Referenzen: [i18next-Konfiguration](https://www.i18next.com/overview/configuration-options), [Fallback](https://www.i18next.com/principles/fallback), [Interpolation](https://www.i18next.com/translation-function/interpolation).

### 2. Explizite Browserauswahl beim Start

Eine unabhängig testbare Funktion verarbeitet `navigator.languages` in Präferenzreihenfolge, bei fehlender oder leerer Liste `navigator.language`. Für jede gültige Sprachkennung prüft sie zuerst einen genauen Katalogtreffer, dann dessen Basissprache. Nicht unterstützte oder ungültige Einträge werden übersprungen. Ohne Treffer gilt `en`. Damit wird beispielsweise `de-CH` zu `de`; bei `fr-FR, de-DE, en-US` gewinnt `de`.

Die gewählte Katalogsprache bestimmt `document.documentElement.lang` und die Zahlenformatierung. Ohne regionale Kataloge werden regionale Zahlenvarianten nicht separat abgebildet. Initialisierung erfolgt vor dem Laden darstellbarer Speicherhinweise und vor dem ersten regulären Zeichnen. Eine gültige manuell gespeicherte Sprache unter `carnivore-sim.language` hat Vorrang. Lesen und Schreiben sind gegen Speicherfehler abgesichert; ohne Speicher bleibt Browserauswahl und manueller Wechsel nutzbar. Globale Navigator-Zugriffe innerhalb des Simulationsmodells oder beim Import von Testmodulen entfallen durch Übergabe des Lokalisierungskontexts.

Eine ausschließliche Prüfung von `navigator.language` würde unterstützte nachrangige Präferenzen verlieren. Die Browserauswahl bleibt Standard, bis Benutzer ausdrücklich eine Sprache wählen.

### 3. Statische und dynamische Texte aus derselben Quelle

HTML erhält Übersetzungsschlüssel für Texte und Attribute wie `aria-label` und `title`. Ein kleiner Vite-HTML-Transform ersetzt ausdrücklich markierte Text-/Attributplatzhalter schon für Entwicklung und Build durch HTML-escaped Texte aus `en.json`; `lang` ist zunächst `en`. Die Laufzeit setzt anschließend die ausgewählte Sprache. Dadurch bleibt Englisch auch im initialen HTML verfügbar, ohne eine zweite Sammlung englischer Texte in HTML zu pflegen.

Die Laufzeit schreibt mit `textContent` und `setAttribute`, nicht mit übersetztem HTML. Markierungen auf Textknoten oder eigenen Textelementen vermeiden, dass SVGs, Eingaben oder Canvas-Knoten überschrieben werden. Dynamische Texte, Dokumenttitel, Canvas-Beschriftungen und zugängliche Zustandsmeldungen verwenden dieselben Schlüssel. Technische Pfade, URLs, JSON-Schlüssel und der Projektname werden nicht übersetzt.

Metadaten der Einstellungen und Messreihen erhalten stabile IDs und Übersetzungsschlüssel. Gruppierung darf nicht von übersetztem Text abhängen. Tooltip-Bezeichnungen werden als eigene vollständige Übersetzungen gepflegt, statt deutsche Präfixe mit String-Ersetzungen zu entfernen. Σ bleibt in den übersetzten Energiebezeichnungen erhalten.

### 4. Strukturierte Fehler statt Übersetzung fertiger Fehlersätze

Bekannte Fehler aus Konfigurationsprüfung, Wiedergabe, Einstellungen, Import/Export und Speicherzugriff erhalten stabile Codes, benannte Parameter und gegebenenfalls einen Feldpfad. Die UI übersetzt diese Beschreibungen einschließlich Feldnamen. `SettingError.path`, Fokusführung, `aria-invalid` und die bestehende Absicherung asynchroner Importe bleiben erhalten; das Erkennen von Pfaden anhand deutscher Satzpräfixe entfällt.

Unbekannte technische Fehler erhalten eine verständliche lokalisierte allgemeine UI-Meldung; die Ursache bleibt für Diagnosezwecke erhalten. Interne Invarianten müssen nicht als Katalog voller technischer Diagnosen modelliert werden. Tests der Validierungslogik prüfen Codes und Pfade; separate Darstellungstests prüfen englische und deutsche Meldungen. Das nachträgliche Ersetzen deutscher Satzteile wäre fragil und wird deshalb vermieden.

### 5. Locale beeinflusst Darstellung, nicht Messwerte

Lokalisierung wird an Panels, Diagramm und Formatierhilfen übergeben. `Intl.NumberFormat`-Instanzen werden pro Kontext wiederverwendet, nicht pro Messwert erzeugt. Ganze Anzahlen, zwei Nachkommastellen für aktuelle Energie-/Sekundenwerte und eine für die X-Achse bleiben erhalten. Monospace-Ziffern, feste rechte Anker und Kapazitätsgrenzen samt verkürzter Schreibweise werden für beide Sprachen geprüft.

Native numerische Eingabewerte bleiben über ihre numerischen DOM-Werte lesbar; übersetzte Ausgabe wird nicht als Eingabesyntax oder JSON-Zahl verwendet. Geschwindigkeit bleibt ein numerischer Faktor. Einstellungsschema, Versionen, Parameterpfade und Speicherschlüssel bleiben unverändert. Die Zuordnung des Tooltips bei stillstehender Maus und bewegten Kurven wird weiterhin bei jedem Zeichnen aktualisiert.

### 6. Prüfung und Dokumentation entlang der bestehenden Abläufe

Bestehende deutsche Browserprüfungen erhalten ausdrücklich `de-DE`, einschließlich der Skripte unter `scripts/`. Ergänzende gezielte Browserfälle prüfen Englisch, Deutsch, nicht unterstützte Sprachen und geordnete Präferenzen. Sie decken Titel, zugängliche Namen, Status, Einstellungen und Fehler, Diagrammtexte, Achsenformat und Tooltip ab. Ein Export auf Englisch wird auf Deutsch importiert. Lange Simulationstests müssen nicht in jeder Sprache dupliziert werden.

Layoutprüfungen nutzen die vorhandenen Größen 1440 × 900, 360 × 740 und 360 × 480. Insbesondere längere englische Texte dürfen keinen horizontalen Seitenüberlauf oder erneute Zahlenverschiebungen erzeugen. `docs/i18n.md` erklärt Dateien, Schlüssel, Parameter, Fallback und Prüfungen. Beide READMEs sowie die Screenshot-Anleitung beschreiben die Browserauswahl und legen die Sprache für reproduzierbare Screenshots ausdrücklich fest.

### 7. Manuelle Auswahl und Wechsel ohne Neustart

Der Header verwendet ein Raster: Titel links, Wiedergabesteuerungen rechtsbündig daneben und ein abgesetzter Globus-Button ganz rechts. Nur bei schmalen Fenstern bricht die weiterhin rechtsbündige Wiedergabesteuerung in die nächste Zeile um. Das aufklappbare Auswahlfeld verwendet native Buttons mit Flaggen als lokal gebündelte SVGs, Sprach-Eigennamen aus den jeweiligen Katalogen und sichtbarer aktiver Auswahl. Neue Kataloge erscheinen automatisch; fehlende Flaggen erhalten ein Globus-Symbol. Escape, Außenklick und Auswahl schließen das Feld; Öffnen fokussiert die aktive Sprache.

Der bestehende Lokalisierungskontext erhält eine wechselbare Locale und leert seinen Zahlenformatcache beim Wechsel. Die Anwendung übersetzt vorhandene Knoten und zeichnet Diagramm und Status neu. Einstellungsfelder werden nicht neu erzeugt; Texte und gespeicherte Meldungsbeschreibungen werden erneut übersetzt. Diagrammoptionen, Historie und Tooltip-Zuordnung bleiben erhalten. Ein Reload wäre einfacher, würde jedoch den laufenden Zustand verlieren.

## Risks / Trade-offs

- Übersehene dynamische Texte → Inventar aus HTML, UI-Modulen und bekannten Fehlerpfaden; gezielte Browserprüfungen in beiden Sprachen und Kontrolle auf sichtbare Schlüssel.
- Längere Übersetzungen verschieben Bedienelemente → bestehende schmale Viewports und Diagrammgeometrie für Englisch und Deutsch prüfen; keine zusätzliche permanente Messwertzeile.
- Fehlerumbau verliert Feldzuordnung → Codes, Parameter und Pfade getrennt testen; fehlgeschlagene Aktionen auf unveränderten Zustand prüfen.
- Zusätzliche Kataloge vergrößern das Bundle → bei den zunächst zwei Sprachen zugunsten zuverlässiger statischer Bereitstellung akzeptiert; Lazy Loading erst bei nachgewiesenem Bedarf.
- Englisches initiales HTML vor deutscher Laufzeitübersetzung → Übersetzung früh vor Panelaufbau ausführen und keine asynchronen Ressourcen laden.
- Fehlende neue Übersetzungen bleiben durch Fallback unauffällig → Katalogvollständigkeit und Interpolationsparameter verbindlich prüfen.

## Migration Plan

Die Umstellung erfolgt als gemeinsamer Build aus Bibliothek, Katalogen und allen UI-Verbrauchern. Bestehende gespeicherte Konfigurationen und exportierte Dateien benötigen keine Migration. Produktionstest unter dem bestehenden Vite-Basispfad nach dem Build; Rücknahme über den vorherigen Build ohne Datenänderung.

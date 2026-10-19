# Design

## Context

Siehe `proposal.md` für die Motivation. `src/settings-panel.ts` verwaltet bereits einen Formularentwurf, Rückmeldungen und den Vergleich mit aktiven beziehungsweise zuletzt gespeicherten Werten. Übernehmen ist ein Callback an `src/main.ts`; Speichern ist davon unabhängig. Diese Trennung wird für Dateiaktionen weitergenutzt.

`src/settings.ts` enthält vollständige numerische Prüfung und Domänenregeln. `src/settings-storage.ts` speichert `{ version: 2, config }` und liest Version 1 mit Migration der Startenergien. Unbekannte Einstellungsfelder werden durch `decodeSettings` entfernt. Speicherfehler führen beim Seitenstart zu Standards; ein Dateiimport darf diesen Rückfall nicht übernehmen, da er sonst den vorhandenen Entwurf unerwartet ersetzt.

Die Produktionsprüfung in `e2e/production.pw.ts` verwendet die gebaute Anwendung unter `/welt-der-waben/`. Es gibt keine Serverkomponente; Dateiaktionen müssen auch bei gesperrtem `localStorage` funktionieren.

## Goals / Non-Goals

**Goals:** Ein gemeinsamer, ohne Browserabhängigkeiten testbarer Formatvertrag für lokale Speicherung und Dateien; vollständige Validierung vor Änderung des Entwurfs; Browser-I/O bleibt auf das Einstellungs-UI begrenzt.

**Non-Goals:** Welt-Snapshots, Parameter-Teildateien mit Standardergänzung, Cloudspeicher, Zwischenablage, Konfigurationsverwaltung und Änderungen an Simulationsregeln. Der Import stellt keinen identischen Simulationsverlauf wieder her.

## Decisions

### Gemeinsamer versionierter Codec

Ein kleines `src/settings-format.ts` kapselt Serialisierung und Parsen der bisherigen Speicherhülle. Die Ausgabe enthält ausschließlich `version: 2` und eine mit `decodeSettings` bereinigte vollständige Konfiguration. JSON wird mit Einrückung und abschließendem Zeilenumbruch ausgegeben. Der Parser prüft Hülle und Version, migriert Version 1 wie bisher und delegiert Parameterprüfung an `decodeSettings`; er liefert eine unabhängige Konfiguration oder wirft einen verständlichen Fehler.

`settings-storage.ts` nutzt denselben Codec, behält aber seine bisherigen Speicherhinweise und den Standardrückfall beim Start. Dateifehler werden hingegen im Panel angezeigt und verändern nichts. Die reine JSON-Syntaxmeldung wird verständlich formuliert; Dateiinhalte werden nicht als HTML eingesetzt.

Alternative: eigenes Dateischema oder duplizierter Parser. Beides schafft unnötige Abweichungen bei Versionierung und Parameterregeln. Eine unversionierte reine `Config`-Datei wird deshalb nicht zusätzlich akzeptiert. Bestehende Speicherungen bleiben ohne Umschreiben lesbar; erst explizites Speichern schreibt Version 2.

### Export folgt dem sichtbaren Entwurf

„Als JSON exportieren“ liest denselben validierten Entwurf wie Übernehmen und Speichern. Der Download nutzt einen UTF-8-Blob mit `application/json` und den vorgeschlagenen Namen `welt-der-waben-settings.json`. Eine temporäre Objekt-URL wird nach Anstoßen des Downloads freigegeben. Es werden weder aktive Werte eingesetzt noch Browserdaten geschrieben. Die Rückmeldung sagt „Download gestartet“, da die Anwendung das tatsächliche Speichern im Dateidialog nicht bestätigen kann.

Alternative: aktive oder zuletzt gespeicherte Einstellungen exportieren. Das widerspräche dem bestehenden Formularablauf und würde sichtbare Änderungen überraschend auslassen.

### Import füllt atomar das vorhandene Formular

Eine beschriftete Dateiauswahl akzeptiert `.json` beziehungsweise `application/json`; die Dateiendung ist nur eine Auswahlhilfe, die Inhaltsprüfung entscheidet. Erst nach erfolgreichem Lesen, Parsen und Prüfen wird `fill(config)` aufgerufen. Erfolg erklärt die nächsten Aktionen; `saved` und der aktive Callback bleiben unberührt. Alle Formularwerte werden gemeinsam ersetzt, sodass kein Mischen von Dateien und alten Entwurfswerten entsteht.

Der Dateieingabewert wird nach jedem Versuch geleert, damit dieselbe Datei erneut gewählt werden kann. Keine Auswahl erzeugt keinen Erfolg. Asynchrones Lesen muss neuere Dateiauswahlen oder zwischenzeitliche Formularaktionen respektieren: Eine Anforderungs- und Entwurfsrevision verhindert, dass ein veralteter Leseabschluss spätere Änderungen überschreibt. Nach Abbruch des vorhandenen `AbortSignal` bei HMR wird kein Ergebnis mehr in das Panel geschrieben.

Alternative: sofortiges Übernehmen oder Speichern. Dies würde die bisherigen bewussten Aktionen umgehen. Eine separate Vorschau ist unnötig, da das Formular bereits alle importierten Werte zeigt.

### Vorhandene Bedienung und Produktionsprüfung erweitern

Die Dateiaktionen stehen neben den bisherigen Aktionen in der Einstellungsbox, mit passenden Hilfetexten und den vorhandenen zugänglichen Status- und Fehlerbereichen. Falls nötig werden Umbruchregeln in `style.css` angepasst. Es kommen keine neuen Pakete hinzu.

Codec-Tests sichern Rundlauf, Versionen, vollständige Prüfung und Bereinigung unbekannter Felder. Bestehende Storage-Tests schützen die Migration und Fehlersemantik nach dem Herauslösen des Codecs. Ein Browserablauf lädt eine echte Exportdatei herunter, prüft den Inhalt und lädt sie in einen anderen Browserkontext hoch. Er weist getrennt Entwurf, aktive Welt und gespeicherte Werte sowie Fehlerbehandlung, erneute Auswahl, schmale Ansicht und Bedienbarkeit ohne Storage nach. Für unveränderte Tickstände wird pausiert geprüft, damit normale Simulationsfortschritte nicht als Importwirkung erscheinen.

## Risks / Trade-offs

- [Gemeinsamer Codec verändert versehentlich bisherige Speichersemantik] → Bestehende Speicher- und Migrationstests beibehalten; Standardrückfall nur im Ladepfad der Speicherung.
- [Ungültige Datei überschreibt einen brauchbaren Entwurf] → Erst vollständig decodieren, danach genau einmal befüllen; Fehler erzeugen keine Standards.
- [Später Leseabschluss überschreibt neuere Arbeit] → Anforderung und Entwurfsrevision prüfen; nach HMR-Abbruch Ergebnis verwerfen.
- [Unbekannte Zusatzfelder gehen beim Rundlauf verloren] → Bewusst nur bekannte Parameter übernehmen und dieses Verhalten dokumentieren; unbekannte Versionen ablehnen.
- [Downloadverhalten unterscheidet sich zwischen Browsern] → Standardmäßige Datei- und Downloadmechanismen verwenden, tatsächlichen Download im Browser testen; keine Aussage über einen abgeschlossenen Speichervorgang.

## Migration Plan

Codec und Dateiaktionen gemeinsam ausliefern. Vorhandener Storage-Schlüssel und Formatversion bleiben bestehen; es ist keine automatische Datenumschreibung nötig. Tests, Build und Produktions-Browserprüfung laufen vor Veröffentlichung über den bestehenden Pages-Workflow. Rücknahme des Changes entfernt nur die Dateiaktionen; vorhandene Speicherungen und exportierte Version-2-Konfigurationen bleiben im bisherigen Format lesbar.

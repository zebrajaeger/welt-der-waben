# Design

## Context

Siehe `proposal.md` für Umfang und Motivation. Die Anwendung verwendet bereits i18next, flache JSON-Kataloge und eager Vite-Globs. Neue Kataloge werden automatisch erkannt; die Sprachwahl liest ihren Eigennamen und ein optionales lokales SVG aus den Metadaten. Manuelle Auswahl wirkt ohne Reload und wird unter `carnivore-sim.language` gespeichert.

Die vorhandene Erkennung prüft nur exakte Kennung und Basissprache. Damit würden reine `zh-Hans`-/`zh-Hant`-Kataloge bei Browserkennungen wie `zh-TW` nicht gefunden. Die Liste hat bisher zwei Einträge und keine Höhenbegrenzung. Dokumentübersetzung setzt `lang`, aber kein `dir`. CSS und Canvas verwenden physische Links-/Rechtspositionen; feste Zahlenfelder reservieren 12 beziehungsweise 16 Zeichen.

Tests behandeln Französisch derzeit teilweise als nicht unterstützt und setzen Home/End mit Deutsch/Englisch gleich. Diese Annahmen müssen zusammen mit den Katalogen geändert werden.

## Goals / Non-Goals

**Goals:** Vollständige Übersetzungen auf derselben Referenzbasis, verlässliche Auswahl aus 30 Katalogen und korrekte Schrift-/Richtungsbehandlung. Vorhandene Ereignisse, Knoten, Einstellungen und Historien bleiben beim Wechsel erhalten. Layoutkorrekturen berücksichtigen die zuletzt bestätigte rechtsbündige, gleich hohe Kopfleiste.

**Non-Goals:** Keine zweite Übersetzungsbibliothek, kein Übersetzungsdienst, keine Änderung der Simulationsregeln oder der Speicherung. Keine extern nachgeladenen Schriftarten. Separate portugiesische, spanische oder arabische Regionalkataloge und 30 README-Fassungen werden nicht eingeführt.

## Decisions

### 1. Festes Paket mit 30 vollständigen Katalogen

Englisch bleibt die Referenz. 28 neue Dateien übernehmen genau ihre Schlüssel und Platzhalter. Bestehende deutsche und englische Texte bleiben fachlich erhalten. Neue gemeinsame Metadaten `language.direction` besitzen ausschließlich `ltr` oder `rtl`; `language.nativeName` wird immer in der jeweiligen Sprache gepflegt. Die folgende Tabelle fixiert Kataloge, Eigennamen und Flaggenzuordnung; Regionen dienen als Erkennungsbild, die Textauswahl bleibt sprachbezogen.

| Katalog | Sprache / Eigenname | Flaggen-Datei | Richtung |
| --- | --- | --- | --- |
| en | English | gb.svg | ltr |
| de | Deutsch | de.svg | ltr |
| fr | Français | fr.svg | ltr |
| es | Español | es.svg | ltr |
| it | Italiano | it.svg | ltr |
| pt | Português | pt.svg | ltr |
| nl | Nederlands | nl.svg | ltr |
| pl | Polski | pl.svg | ltr |
| cs | Čeština | cz.svg | ltr |
| uk | Українська | ua.svg | ltr |
| ru | Русский | ru.svg | ltr |
| tr | Türkçe | tr.svg | ltr |
| el | Ελληνικά | gr.svg | ltr |
| ro | Română | ro.svg | ltr |
| hu | Magyar | hu.svg | ltr |
| sv | Svenska | se.svg | ltr |
| da | Dansk | dk.svg | ltr |
| fi | Suomi | fi.svg | ltr |
| nb | Norsk bokmål | no.svg | ltr |
| ar | العربية | eg.svg | rtl |
| he | עברית | il.svg | rtl |
| hi | हिन्दी | in.svg | ltr |
| bn | বাংলা | bd.svg | ltr |
| zh-Hans | 简体中文 | cn.svg | ltr |
| zh-Hant | 繁體中文 | tw.svg | ltr |
| ja | 日本語 | jp.svg | ltr |
| ko | 한국어 | kr.svg | ltr |
| id | Bahasa Indonesia | id.svg | ltr |
| vi | Tiếng Việt | vn.svg | ltr |
| th | ไทย | th.svg | ltr |

`pt` verwendet eine konsistente, allgemein verständliche portugiesische Fassung; `pt-BR` und `pt-PT` landen zunächst beide dort. `nb` bezeichnet Bokmål; Nynorsk wird nicht als mitübersetzt ausgegeben. Chinesisch erhält zwei tatsächlich getrennte Textfassungen, keine bloß umbenannte oder unverändert kopierte Datei.

Alternative: nur die häufigsten Menütexte übersetzen und den Rest über Englisch füllen. Das würde die zugesagte vollständige Lokalisierung verletzen. Stattdessen werden je Sprache auch Validierung, Speicher-/Dateihinweise, zugängliche Namen, Diagrammachsentexte und Tooltip übersetzt. Englische identische Werte werden als Prüfkandidaten ausgegeben, aber wegen legitimer Namen wie JSON oder identischer Wörter nicht pauschal abgewiesen. Ein zweiter inhaltlicher Durchgang prüft Fachbegriffe, Vollständigkeit und Satzvorlagen; technische Tests allein bestätigen keine Übersetzungsqualität.

### 2. Schriftbewusste Erkennung ohne Sprachlisten in der UI

Die Katalogmenge bleibt automatisch aus Dateien abgeleitet. Innerhalb jeder Browserpräferenz wird zuerst der kanonische exakte Katalog gesucht. Danach folgen Sprache plus explizite oder durch `Intl.Locale(...).maximize()` abgeleitete Schrift und zuletzt die Basissprache. Erst anschließend wird die nächste Browserpräferenz geprüft. Ungültige Kennungen werden weiterhin ignoriert; ohne Treffer gilt Englisch.

Für die gelieferten chinesischen Varianten gilt verbindlich: `zh`, `zh-CN`, `zh-SG` → `zh-Hans`; `zh-TW`, `zh-HK`, `zh-MO` → `zh-Hant`. Eine explizite Schrift gewinnt vor der Region. Die kleine fachliche Aliasregel `no` → `nb` gilt auch für regionale Browserkennungen, aber macht `nn` nicht zu Bokmål. Die gespeicherte unterstützte Katalogkennung bleibt vor dieser Browserauflösung maßgeblich. Kein neuer Regionskatalog wird erfunden.

Nur `zh.json` zu liefern würde die gewünschte Unterscheidung verlieren; ausschließlich exaktes Matching würde verbreitete Browserkennungen auf Englisch zurückfallen lassen. Die Schriftableitung nutzt die bestehende Plattform-API, keine zusätzliche Sprachdetektor-Abhängigkeit. Referenz: [ECMA-402: Intl.Locale.prototype.maximize](https://402.ecma-international.org/13.0/#sec-Intl.Locale.prototype.maximize).

### 3. Lange Liste als begrenztes Auswahlfeld

Die vorhandene Button-Gruppe bleibt bestehen. Ihre maximale Höhe orientiert sich am verbleibenden sichtbaren Viewport unter dem Sprachbutton; überschüssige Einträge scrollen intern. Breite bleibt innerhalb des Fensters, Eigennamen dürfen umbrechen. Die Reihenfolge wird deterministisch nach Katalogkennung festgelegt und beim Sprachwechsel nicht umsortiert. Jeder Eintrag trägt `lang` und eine eigene Richtung, der Eigenname wird bidirektional isoliert.

Beim Öffnen wird die aktive Sprache fokussiert und innerhalb der Liste sichtbar gemacht, ohne den Seitenausschnitt zu verschieben. Tab, Pfeile, Home/End, Escape und Außenklick bleiben erhalten; Tastaturnavigation macht neu fokussierte Einträge sichtbar. Es gibt kein Suchfeld und keine Untergruppen: 30 kurze Optionen sind mit Scrollen und Tastatur erreichbar. Bestehende Tests bestimmen Home/End aus der tatsächlichen sortierten Liste statt aus zwei fest angenommenen Namen.

### 4. RTL für Texte, stabile physische Bedienung und Projektion

Die Dokumentübersetzung setzt neben `lang` auch `dir` aus den Katalogmetadaten. Arabisch und Hebräisch erhalten `rtl`; ein Wechsel zurück setzt ausdrücklich `ltr`. Textcontainer, Meldungen, Formularbeschriftungen und Legenden folgen der Sprache. Fremdsprachige Eigennamen und technische Fragmente werden durch `bdi`, `dir="auto"` oder isolierte Spans abgegrenzt, nicht durch übersetztes HTML. Referenz: [W3C: Inline bidi markup](https://www.w3.org/International/articles/inline-bidi-markup/index.en).

Die Header-Geometrie bleibt ausdrücklich links nach rechts angeordnet, damit Überschrift, rechtsbündige Wiedergabe und Sprachbutton ihre physischen Plätze behalten. Die darin enthaltenen Texte haben ihre jeweilige Richtung. Auch Spielfeld, Diagrammprojektion und Zahl-/Zeitslots erhalten eine explizite stabile geometrische Richtung. Anzahlachse links, Energieachse rechts, Zeitverlauf und Cursorbewegung bleiben gleich. Canvas-Textausgabe setzt Richtung und Ausrichtung bewusst, statt die geerbte Dokumentrichtung auf Koordinaten wirken zu lassen.

Eine pauschale Spiegelung aller Container würde die bestätigte Kopfzeile und die bereits erklärten Achsenseiten verändern. Deshalb werden textliche Richtung und physische Projektion getrennt behandelt. Das ist eine Darstellungsänderung, keine zweite Diagrammimplementierung.

### 5. Locale-Zahlen und Schriften innerhalb vorhandener Grenzen

`Intl.NumberFormat` bleibt für Ziffern, Gruppierung, Dezimalzeichen und wissenschaftliche Schreibweise verantwortlich. Aktuelle Energie/Zeit behalten zwei Nachkommastellen, X-Achsenwerte eine und Anzahlen ganzzahlige Präzision. Arabische Ziffern, indische Gruppierung, Leerraum-Gruppentrenner und unsichtbare Richtungszeichen dürfen nicht mit deutsch/englischen Regexen verwechselt werden. Zahlen bleiben rein darstellend.

Reservierte Felder und rechtsbündige Achsenanker bleiben erhalten. In `history-format.ts` werden Kapazitätsentscheidung und gegebenenfalls verkürzte Darstellung auf die neuen Zeichenformen geprüft; vollständige Werte bleiben zugänglich. Zahlen-/Einheitskombinationen und Σ erhalten isolierte, eindeutige Reihenfolge. Systemschrift-Fallbacks decken die nativen Schriften ab; die Sichtprüfung kontrolliert unter anderem Arabisch, Devanagari, Bengalisch, CJK und Thai. Beschriftungen umbrechen, während Buttongeometrie und kompakte Diagrammgrenzen erhalten bleiben.

### 6. Gebündelte Auslieferung und Prüfmatrix

Alle 30 Kataloge und Flaggen bleiben lokal gebündelt. Für dieses Paket wird zugunsten synchroner Erstübersetzung und störungsfreiem Sprachwechsel die bestehende eager-Strategie beibehalten. Bundlegrößen werden vor/nach Erweiterung dokumentiert; es wird kein zusätzlicher Netzwerkdienst oder Lazy-Loading-Zustandsautomat eingeführt.

Katalogtests prüfen den vollständigen Satz aus 30 Kennungen, Schlüssel-/Platzhaltergleichheit, gültige Richtungsmetadaten, Eigennamen und vorhandene Flaggen. Erkennungstests verwenden für den echten Fallback eine weiterhin nicht unterstützte Testkennung statt Französisch. Zahlenformat-Tests laufen über alle Kataloge und behalten Präzision sowie Feldkapazitäten im Blick.

Gezielte Produktions-Smokes wählen jede Sprache, prüfen Titel, `lang`/`dir`, dynamische Beschriftungen und fehlende Schlüssel. Vertiefte Abläufe prüfen Französisch, Russisch, Arabisch, Hebräisch, Hindi/Bengalisch, beide chinesischen Varianten, Japanisch und Thai. Für diese repräsentativen Fälle werden die vorhandenen Viewports genutzt; Zustands-/JSON-Kompatibilität und Speicherfehler benötigen keine 30-fach duplizierten Langsimulationen. Die bestehende vollständige Regression läuft zusätzlich einmal. `docs/i18n.md` und READMEs listen das Paket und erläutern Skriptzuordnung, RTL und Katalogpflege.

## Risks / Trade-offs

- Viele syntaktisch korrekte, aber fachlich schlechte Übersetzungen → verbindliche Terminologie und zweiter inhaltlicher Durchgang; identische englische Texte gezielt prüfen, keine muttersprachliche Freigabe ohne tatsächliche Prüfung behaupten.
- Lange Liste oder lange Namen verdecken Bedienung → sichtbare Höhen-/Breitenbegrenzung, internes Scrollen und Tastaturprüfung bis zum letzten Eintrag.
- Dokumentrichtung spiegelt ungewollt Header oder Diagramm → explizite Geometrierichtung, eigene Textisolierung und Tests für Wechsel `ltr` ↔ `rtl`.
- Locale-Ziffern oder Richtungszeichen passen nicht in Reserven → formatabhängige Feld- und Screenshotprüfungen, zugänglicher vollständiger Wert bleibt erhalten.
- Mehr Ressourcen vergrößern den Erstdownload → Bundlevergleich dokumentieren; die statische Bereitstellung und fehlerfreie Sofortauswahl bleiben in diesem Change wichtiger als zusätzliche Ladestrategien.
- Sprachtests setzen zwei Einträge oder nicht unterstütztes Französisch voraus → solche Annahmen zusammen mit Katalogen aktualisieren und durch echte Fallback-/Listenfälle ersetzen.

## Migration Plan

Kataloge, Richtungsmetadaten und Verbraucher werden gemeinsam ausgeliefert. Bereits gespeicherte `en`-/`de`-Präferenzen und Einstellungen bleiben gültig. Ein Rückbau auf den vorherigen Build ignoriert unbekannte neue Sprachpräferenzen wie bisher und verwendet die Browserauswahl; Simulationsdaten benötigen keine Migration.

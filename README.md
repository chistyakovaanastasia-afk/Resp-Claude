# 汉语 Auto-Trainer

Ein reiner Sprach-Hör-und-Sprechtrainer für Chinesisch, gedacht zur
Nutzung im Auto (Handy per Bluetooth mit dem Auto verbunden, hands-free
per Sprache bedienbar). Es ist eine statische Web-App ohne Server und
ohne KI-Textgenerierung: Fragen und Antworten kommen **ausschließlich**
aus den geparsten Zeilen deiner Google-Tabelle "Alles" — es gibt keinen
Schritt, der Inhalte erfinden könnte.

## Einmalige Einrichtung

### 1. Tabelle freigeben

Die App liest die Tabelle per öffentlichem CSV-Export-Link, damit beim
Fahren kein Google-Login nötig ist:

1. Google Sheet öffnen → **Datei → Freigeben → Freigeben**.
2. Unter "Allgemeiner Zugriff": **"Jeder mit dem Link"** → Rolle
   **"Betrachter"** einstellen.
3. Den Link (oder direkt den Link zum Tab "Alles", inkl. `gid=...`)
   kopieren.

Der Link ist dann nur für Personen abrufbar, die die (nicht erratbare)
URL kennen — keine Suchmaschinen-Indexierung, aber technisch kein
Passwortschutz. Für eine Vokabeltabelle ist das ein sinnvoller
Kompromiss zwischen Bequemlichkeit im Auto und Datenschutz.

### 2. App öffnen und Link eintragen

1. Die Seite (`index.html`) im Handy-Browser öffnen (siehe
   "Hosting" unten für GitHub Pages).
2. Auf das Zahnrad ⚙ tippen → den kopierten Link einfügen → Speichern.
3. Die App lädt sofort die aktuelle Tabelle und zeigt die Anzahl der
   Einträge an.

Ohne eigenen Link nutzt die App standardmäßig genau die Tabelle "Alles"
aus dem Link, den du zuerst geschickt hast.

### 3. Für die Fahrt

- Handy per Bluetooth mit dem Auto verbinden (wie gewohnt für Anrufe/
  Musik) — Ausgabe läuft dann über die Auto-Lautsprecher, Mikrofon ist
  das Handy-Mikrofon.
- App öffnen, einmal auf **"▶ Start"** tippen (am besten vor
  Fahrtbeginn oder an der Ampel).
- Danach läuft der Trainer vollautomatisch: Frage (gesprochen) → du
  antwortest gesprochen → Bewertung (gesprochen) → nächste Frage.
- **"Pause"** sagen (statt einer Antwort) beendet die Abfrage sofort,
  genau wie der Pause-Button.
- **"Weiter"** sagen überspringt die aktuelle Frage sofort, ohne
  Korrekturschleife (z. B. wenn die Erkennung dich mehrfach nicht
  versteht). Die Zeile kommt später trotzdem nochmal dran.
- **Für die Nutzung ist ein Mikrofon-Zugriff nötig** — der Browser
  fragt das einmalig ab; bitte das erste Mal möglichst im Stand
  bestätigen.
- **Vor der ersten Fahrt einmal zuhause im WLAN öffnen**: Die App lädt
  beim ersten Start ein Spracherkennungsmodell herunter (siehe
  "Spracherkennung" unten). Das dauert je nach Verbindung eine Weile;
  danach ist es im Browser zwischengespeichert und funktioniert auch
  offline.

## Spracherkennung (Whisper, lokal im Browser)

Die App nutzt kein Server-basiertes Spracherkennungs-API und keine
sprachfeste Browser-Funktion, sondern ein kostenloses, mehrsprachiges
KI-Modell (**Whisper**, über [transformers.js](https://github.com/xenova/transformers.js)),
das komplett lokal im Handy-Browser läuft:

- **Erkennt automatisch, welche Sprache du sprichst** (Deutsch oder
  Chinesisch) — du musst dich nicht auf eine Richtung "festlegen".
  Zusätzlich probiert die App bei Bedarf auch erzwungene Interpretationen
  in beiden Sprachen und nimmt automatisch die, die zur erwarteten
  Antwort passt.
- **Kein Server, keine Kosten**: Das Modell wird einmalig von einem
  öffentlichen CDN geladen und läuft danach offline im Browser (WebAssembly).
  Es werden keine Audiodaten irgendwohin hochgeladen.
- **Funktioniert auf mehr Geräten** als die eingebaute Browser-
  Spracherkennung, die z. B. in Samsung Internet fehlt und auf iOS/iPadOS
  unzuverlässig ist — hier reicht Mikrofonzugriff + WebAssembly, was
  deutlich breiter unterstützt wird.
- **Dafür spürbar langsamer**: Nach jeder Antwort verarbeitet das Modell
  die Aufnahme (typischerweise ein paar Sekunden, abhängig vom Handy),
  bevor die Bewertung kommt — das ist der Preis für "versteht wirklich,
  egal in welcher Sprache" statt einer sofortigen, aber sprachfesten und
  auf manchen Geräten kaputten Erkennung.
- Die eigene Sprechpausen-Erkennung (nicht die Browser-API) entscheidet,
  wann du fertig gesprochen hast: sie hört zu, bis nach Sprechbeginn eine
  echte Pause kommt (nicht mehr nach der ersten kurzen Pause mitten im
  Satz).

Falls Mikrofonzugriff oder das Modell fehlschlagen, zeigt die App eine
Warnung und pausiert automatisch, statt endlos ohne Rückmeldung
weiterzulaufen.

### Bildschirm & Sperre

Die App hält den Bildschirm während des Trainings aktiv (Wake Lock), damit
das automatische Sperren nach kurzer Inaktivität nicht Mikrofon und
Sprachausgabe unterbricht — das ist beim bloßen Zuhören/Sprechen ohne
Bildschirmberührung sonst nach kurzer Zeit der Fall.

Das hat eine technische Grenze: Wenn du das Handy manuell per Power-Taste
sperrst oder zu einer anderen App wechselst (z. B. Navigation), pausiert
das Betriebssystem den Browser-Tab inklusive Mikrofonzugriff — das ist
eine Sicherheitsvorgabe von Android/iOS, die keine Browser-App umgehen
kann. Am besten das Handy einfach mit dunklem Bildschirm liegen lassen
(nicht sperren) oder eine Docking-Halterung ohne Sperrfunktion nutzen.

## Wie die Grundregeln technisch umgesetzt sind

- **Kein Erfinden von Inhalten**: Es gibt keine Sprachgenerierung. Jede
  Frage ist ein Objekt `{nr, zh, pinyin, de}`, das direkt beim Parsen
  der CSV-Datei entsteht. Auswahl passiert ausschließlich über einen
  Zufallsindex in dieses Array — inhaltlich kann nichts "daneben"
  sein.
- **Zufällige, gestreute Auswahl**: Ein rollierendes Fenster verhindert
  zu schnelle Wiederholung derselben Zeile, benachbarte Indizes werden
  direkt hintereinander ausgeschlossen, und die Auswahl wechselt aktiv
  zwischen erstem/mittlerem/letztem Drittel der Tabelle.
- **Zwei Fragetypen** (Deutsch → Chinesisch / Chinesisch → Deutsch)
  werden zufällig gemischt.
- **Fehler-Wiederholung**: Bei ❌/⚠️/"weiß nicht" wird die korrekte
  Antwort zweimal vorgesprochen und du wiederholst sie; danach kommt
  die Zeile automatisch nach einigen anderen Fragen wieder dran
  (garantiert, aber nicht sofort und nicht vorhersehbar platziert).
- **Sprachausgabe fürs Auto**: Chinesische Wörter/Sätze werden mit
  einer echten `zh-CN`-Stimme gesprochen (nicht als vorgelesene
  Pinyin-Buchstaben, was auf einer Roman-Stimme unnatürlich klingen
  würde). Pinyin wird zusätzlich nur **als Text auf dem Bildschirm**
  angezeigt, nicht noch einmal vorgelesen — es gibt also keine
  Doppel-Vorlesung von Zeichen und Pinyin in der Sprachausgabe.

  > Das ist eine bewusste Abweichung von der ursprünglichen Regel
  > "Pinyin statt Zeichen vorlesen": Jene Regel war für einen
  > Chat-Assistenten mit eingebauter Text-Vorlese-Funktion gedacht.
  > In dieser eigenständigen App steuern wir die Sprachausgabe direkt
  > und können echtes chinesisches Audio erzeugen, was für einen
  > *Hör*-Trainer eigentlich der Sinn der Übung ist. Wenn du
  > stattdessen lieber die rohen Pinyin-Buchstaben von einer
  > Nicht-Chinesisch-Stimme vorlesen lassen willst, sag Bescheid.

## Grenzen der automatischen Bewertung

Die **Bewertung** selbst nutzt kein KI-Modell — die App vergleicht den
von Whisper erkannten Text direkt und mit etwas Toleranz (Tippfehler/
Alternativschreibweisen/Umformulierungen) gegen den Text aus der
Tabelle. Das funktioniert gut bei einzelnen Wörtern und kurzen Sätzen,
ist aber bei langen Dialogsätzen weniger präzise als eine echte
Sprachverständnis-Bewertung. Bei Unsicherheit lieber "⚠️ Angenommen"
als fälschlich "❌ Falsch" – im Zweifel kannst du im Verlauf
(aufklappbare Liste unten in der App) nachsehen, was tatsächlich
erkannt wurde.

Die **Spracherkennung** selbst (Whisper) ist ein KI-Modell und macht
trotzdem gelegentlich Fehler, besonders bei kurzen Einzelwörtern, Namen
oder undeutlicher Aussprache — das lässt sich nie ganz auf null
reduzieren. Aktuell kommt die kompakte Modellgröße "base" zum Einsatz
(Kompromiss aus Genauigkeit und Ladezeit/Tempo auf dem Handy); falls dir
die Erkennung zu ungenau ist, kann in `whisper-stt.js` (`MODEL_ID`) auf
eine größere, genauere Modellgröße wie `Xenova/whisper-small` umgestellt
werden — größer und langsamer, aber treffsicherer.

Die Auswahl-Logik kann keine "thematischen Gruppen" (z. B. Länder vs.
Zahlen) erkennen, da die Tabelle keine Kategorie-Spalte hat — sie sorgt
aber durch Drittel-Streuung und Abstandsregeln dafür, dass benachbarte
Tabellenzeilen (die in dieser Tabelle oft thematisch zusammenhängen)
nicht direkt hintereinander drankommen.

## Hosting (GitHub Pages)

Dieses Repo enthält einen Workflow (`.github/workflows/deploy.yml`),
der die Seite automatisch auf GitHub Pages veröffentlicht.

Einmalig in den Repo-Einstellungen aktivieren:

1. **Settings → Pages → Build and deployment → Source**: auf
   **"GitHub Actions"** stellen.
2. Nach dem nächsten Push auf den Hauptbranch erscheint die URL unter
   **Settings → Pages** (z. B. `https://<user>.github.io/<repo>/`).
3. Diese URL auf dem Handy öffnen und zum Homescreen hinzufügen
   ("Zum Startbildschirm hinzufügen"), damit sie sich wie eine App
   verhält.

## Lokal testen

Da die App `fetch()` verwendet, sollte sie über `http(s)://` und nicht
über `file://` geöffnet werden, z. B.:

```bash
python3 -m http.server 8080
# dann im Browser: http://localhost:8080
```

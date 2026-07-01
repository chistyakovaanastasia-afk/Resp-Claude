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
- **Für die Nutzung ist ein Mikrofon-Zugriff nötig** — der Browser
  fragt das einmalig ab; bitte das erste Mal möglichst im Stand
  bestätigen.

Empfohlener Browser: **Chrome** (Android) — hat die zuverlässigste
Web-Spracherkennung für Deutsch und Chinesisch. iOS Safari unterstützt
Spracherkennung nur eingeschränkt.

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

Es gibt kein KI-Modell, das Antworten bewertet — die App vergleicht
deine gesprochene Antwort (Spracherkennung) direkt und mit etwas
Toleranz (Tippfehler/Alternativschreibweisen) gegen den Text aus der
Tabelle. Das funktioniert gut bei einzelnen Wörtern und kurzen Sätzen,
ist aber bei langen Dialogsätzen weniger präzise als eine echte
Sprachverständnis-Bewertung. Bei Unsicherheit lieber "⚠️ Fast richtig"
als fälschlich "❌ Falsch" – im Zweifel kannst du im Verlauf
(aufklappbare Liste unten in der App) nachsehen, was tatsächlich
erkannt wurde.

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

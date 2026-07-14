# 📈 Trend-Radar

Ein statisches Web-Dashboard, das globale und Schweizer Trends sammelt und
auf **schnell, günstig und ohne grossen Aufwand umsetzbare Geschäftsideen**
herunterbricht. Kein Server, keine Anmeldung — einmal per Link öffnen (auch
auf dem Handy) und filtern/sortieren.

## Für wen ist das

Für jeden, der alle zwei Wochen einen kurzen, kuratierten Überblick über
neue Trends und daraus ableitbare Nebenverdienst-/Business-Ideen will —
bewusst gefiltert auf Ideen mit **niedrigem bis mittlerem Aufwand, geringen
Kosten und kurzer Umsetzungszeit**. Aufwendige oder teure Ideen werden
nicht aufgenommen.

## Spalten pro Trend

| Feld | Bedeutung |
|---|---|
| Trend | Name des Trends |
| Beschreibung | Was ist es |
| Wie entstanden & warum | Ursache/Auslöser des Trends |
| Kunde | Wer ist die Zielgruppe |
| Beispiel | Belegtes reales Beispiel/Zahl (mit Quelle) |
| Business-Idee | Konkrete, kleine Geschäftsidee daraus |
| Umsetzung | Erste konkrete Schritte |
| Aufwand | niedrig / mittel (nie hoch) |
| Zeit / Dauer / Ressourcen | Was es zum Start braucht |
| Bewertung | 1–5 Sterne: Verhältnis Aufwand ↔ Geldverdienst-Potenzial |

## Daten & Update-Zyklus

Alle Einträge liegen in [`data.json`](./data.json) unter `entries[]`, plus
ein `meta`-Block mit letztem/nächstem Recherche-Datum und Runden-Zähler.
Alle 2 Wochen kommt automatisiert eine neue Recherche-Runde hinzu (siehe
unten) — bestehende Einträge werden **nicht** gelöscht, das Dashboard
wächst als Archiv. Die Reihenfolge in der Datei ist egal, da das UI
standardmässig nach `dateAdded` sortiert (**neueste Trends immer oben**).

### Wie eine automatisierte Update-Runde ablaufen soll

Eine Claude-Routine wird alle 14 Tage exakt zum nächsten Termin neu
ausgelöst (kein wöchentliches Polling mit Schwellenwert-Prüfung — die
Terminierung selbst sorgt für den 2-Wochen-Abstand, siehe unten). Ablauf
pro Runde:

1. `trends/data.json` lesen — sowohl `meta` als auch die **vollständige
   Liste bestehender `entries`** (insbesondere die Felder `trend` und
   `businessIdee`).
2. Aktuelle globale und Schweizer Trends recherchieren (Websuche), die zu
   kleinen, schnell realisierbaren Geld-Ideen passen — Mischung aus global
   und lokal (CH) beibehalten. Die Situation kann sich seit der letzten
   Runde verändert haben, es wird also frisch recherchiert, nicht aus dem
   Gedächtnis wiederholt.
3. **Keine Wiederholungen**: Vor dem Hinzufügen jeden neuen Kandidaten
   gegen alle vorhandenen `entries` abgleichen (Thema/Kernidee, nicht nur
   exakter Titel-Wortlaut). Ist ein Trend im Kern schon vorhanden:
   - Wenn es nur ein spürbares Update ist (neue Zahl, neues Beispiel),
     das bestehende Feld `beispiel`/`rating` in-place aktualisieren statt
     einen neuen Eintrag anzulegen.
   - Sonst überspringen und einen wirklich neuen Trend suchen.
4. 5–8 wirklich neue Einträge nach dem Schema ergänzen, mit fortlaufender
   `cycle`-Nummer, eindeutiger `id` (z. B. `c<cycle>-<lfd. Nr.>`) und
   realer Quelle je Eintrag. Nur `aufwand: "niedrig"` oder `"mittel"`
   aufnehmen.
5. `meta.lastRun`, `meta.nextRunApprox` und `meta.cycle` aktualisieren.
6. Änderungen committen und pushen.
7. Kurze Push-Benachrichtigung an die Nutzerin senden (Link zur Seite).
8. **Die nächste Routine-Ausführung selbst terminieren**: einen neuen
   One-Shot-Trigger für exakt 14 Tage später (gleiche Nachtzeit) anlegen,
   der wiederum eine frische Session mit dieser Anleitung startet. Ohne
   diesen Schritt bricht die Kette ab.

## Hosting (GitHub Pages)

Wird über denselben Workflow wie die anderen Tools in diesem Repo
veröffentlicht (`.github/workflows/deploy.yml`, deployt das ganze Repo).
Nach Aktivierung von GitHub Pages ist das Dashboard erreichbar unter:

```
https://<user>.github.io/<repo>/trends/
```

## Lokal testen

```bash
python3 -m http.server 8080
# dann im Browser: http://localhost:8080/trends/
```

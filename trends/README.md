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
wächst als Archiv.

### Wie eine automatisierte Update-Runde ablaufen soll

Das führt eine Claude-Session periodisch nachts aus (wenig Nutzungslast).
Ablauf pro Runde:

1. `trends/data.json` lesen, `meta.lastRun` prüfen. Nur weiterlaufen, wenn
   seit `lastRun` **mindestens 13 Tage** vergangen sind (Selbstkorrektur,
   falls ein Lauf ausfällt).
2. Aktuelle globale und Schweizer Trends recherchieren (Websuche), die zu
   kleinen, schnell realisierbaren Geld-Ideen passen — Mischung aus global
   und lokal (CH) beibehalten.
3. 5–8 neue Einträge nach obigem Schema ergänzen (nicht ersetzen), mit
   fortlaufender `cycle`-Nummer und realer Quelle je Eintrag. Nur
   `aufwand: "niedrig"` oder `"mittel"` aufnehmen.
4. `meta.lastRun`, `meta.nextRunApprox` und `meta.cycle` aktualisieren.
5. Änderungen committen und pushen.
6. Kurze Push-Benachrichtigung an die Nutzerin senden (Link zur Seite).
7. Sicherstellen, dass die nächste Routine-Ausführung weiterhin eingeplant
   ist (ggf. neu terminieren).

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

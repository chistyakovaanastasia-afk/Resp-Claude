# CH-Screening für japanische Supplements & Beauty-Boxen

Prüft eine Produkt-Zutatenliste (japanisch, deutsch oder englisch) gegen die
Schweizer Regeln und gibt einen Ampelbericht aus.

## Warum das existiert

Beim Direktversand Japan → Schweizer Kunde ist **der Kunde der Importeur**. Das
Schweizer Lebensmittelrecht gilt für die Ware formal nicht — Zoll und Swissmedic
können sie trotzdem zurückhalten und vernichten, und **die Kosten und ein
mögliches Verfahren treffen den Besteller, also deine Kundin**.

Ein Paket, das vernichtet wird und für das die Kundin noch zahlen soll, ist eine
Rückbuchung plus vernichtende Bewertung. Dieses Screening ist Risikomanagement
für dein Geschäft — **kein Compliance-Stempel und keine Rechtsberatung.**

## Benutzung

```bash
node screening/screen.mjs screening/beispiel-produkte.json
```

Exit-Code `2`, wenn mindestens ein Produkt rot ist — damit lässt es sich in
GitHub Actions als Gate vor die Set-Zusammenstellung hängen.

## Eingabeformat

```json
{
  "name": "Placenta Collagen Drink",
  "quelle": "https://shop.jp/item/123",
  "zutaten": ["豚プラセンタエキス", "ビタミンC"],
  "anpreisungen": "美白効果",
  "tagesdosis": "1 Flasche"
}
```

Eine einzelne Datei darf ein Objekt oder ein Array sein.

## Ampel

| | Bedeutung |
|---|---|
| 🔴 | Raus aus der Box. Belegt unzulässig oder klar Heilmittel. |
| 🟡 | Einzelprüfung nötig. Der Bericht nennt genau, was zu prüfen ist. |
| 🟢 | Kein Treffer — **aber Höchstmengen und chemische Verbindungen sind noch offen** (siehe unten). |

## Was das Skript NICHT kann

- **Höchstmengen pro Tagesdosis** (VNem Anhang 1) — die werden revidiert, sie
  stehen bewusst nicht hartcodiert hier drin. Vor jeder Freigabe aktuell abrufen.
- **Zulässige chemische Verbindungen** (VNem Anhang 2) — eine in Japan übliche
  Verbindungsform kann in der Schweiz nicht gelistet sein.
- **Ermessen der Behörde** bei der Abgrenzung Lebensmittel/Heilmittel.

Grün heisst also: „kein bekannter Stopper" — nicht „freigegeben".

## Regeldateien

- `rules/vnem-vitamine-mineralstoffe.json` — die **abschliessende** Liste der in
  CH-Nahrungsergänzungsmitteln zulässigen Vitamine und Mineralstoffe, mit
  japanischen Synonymen. Was nicht drauf steht, ist nicht zulässig.
- `rules/risikostoffe.json` — Stoffe, die in japanischen Beauty-Supplements
  häufig vorkommen und in der Schweiz stolpern, je mit Grund, Prüfschritt und
  Quelle. Plus Anpreisungs-Muster, die ein Produkt ins Heilmittelrecht kippen.

Neue Fälle gehören in `rules/risikostoffe.json`, nicht ins Skript.

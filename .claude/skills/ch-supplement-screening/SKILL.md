---
name: ch-supplement-screening
description: Prüft japanische Supplements und Kosmetik auf Schweizer Verkehrsfähigkeits-Risiken, bevor sie in eine Luxury-Box aufgenommen werden. Nutzen, wenn ein neues japanisches Produkt bewertet, eine Zutatenliste geprüft, ein Set zusammengestellt oder eine deutsche/englische Produktseite aus japanischen Herstellerangaben erzeugt wird.
---

# CH-Screening japanischer Produkte

## Kontext, der die Regeln bestimmt

Versand geht **direkt aus Japan an den Endkunden in der Schweiz**, konsolidiert
über einen Partner in Japan. Der Kunde ist damit rechtlich der Importeur
(Privatimport für den häuslichen Gebrauch). Produktinformationen werden nur
online auf Deutsch und Englisch bereitgestellt, nicht auf die Produkte geklebt —
das ist in dieser Konstruktion zulässig, aber **nur solange der Kunde Importeur
bleibt**.

Daraus folgt: Das Screening dient nicht der Verkehrsfähigkeit der Ware, sondern
dem Schutz der Kundin vor Zoll-Rückhaltung, Vernichtung und Swissmedic-Verfahren
— die Kosten davon trägt sie, nicht die Händlerin.

## Ablauf

1. Zutatenliste beschaffen (japanische Herstellerseite), als JSON gemäss
   `screening/README.md` ablegen.
2. `node screening/screen.mjs <datei>` laufen lassen.
3. Rote Treffer: Produkt ohne Diskussion aussortieren.
4. Gelbe Treffer: den im Bericht genannten Prüfschritt tatsächlich ausführen
   (BLV-Bewilligungsstatus, Swissmedic-Abgrenzungskriterien, Veterinärrecht).
   Ergebnis mit Datum und Quelle dokumentieren.
5. Danach immer noch von Hand: **Höchstmengen** pro Tagesdosis gegen den
   aktuellen Anhang 1 VNem, **chemische Verbindungen** gegen Anhang 2 VNem.
   Diese Werte nie aus dem Gedächtnis beantworten — immer live abrufen.
6. Neu gefundene Risikostoffe in `screening/rules/risikostoffe.json` nachtragen,
   mit Grund, Prüfschritt und Quelle.

## Beim Schreiben der Produkttexte

Japanische Packungsanpreisungen (美白, 効果, アンチエイジング, 免疫力) **nie**
in die deutschen oder englischen Texte übernehmen. Gesundheitsbezogene Angaben,
die nicht in Anhang 14 LIV stehen, sind bewilligungspflichtig.

Erlaubt: beschreibend und sensorisch ("mit Vitamin C", "leichte Textur").
Nicht erlaubt: Wirkversprechen ("gegen Falten", "stärkt das Immunsystem").

## Grenzen

Das Skript ersetzt keine Rechtsberatung. Grün heisst "kein bekannter Stopper",
nicht "freigegeben". Bei Supplements mit unklarer Einstufung im Zweifel
aussortieren — ein Swissmedic-Fall ist ein Strafverfahren, keine
Ordnungswidrigkeit.

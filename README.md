# 🛒 Japan Preis-Finder

Ein einfaches Online-Tool, um den günstigsten Preis für ein Produkt in
Japan zu finden. Du gibst einen Namen ein (in beliebiger Sprache), das Tool
sucht auf **Rakuten**, **Amazon.co.jp** und **Kakaku.com** — auf Wunsch mit
japanischer Übersetzung — und führt dich zum günstigsten Angebot.

Es ist eine **statische Web-App ohne Server**: einmal veröffentlicht,
öffnest du sie per Link auf iPad, iPhone oder jedem Browser.

## Was das Tool automatisch kann — und was nicht

| Shop | Was passiert |
|------|--------------|
| **Rakuten** | Über die offizielle Rakuten-Schnittstelle wird der **günstigste Preis automatisch** geholt und mit Direkt-Kauflink angezeigt (¥). Benötigt eine kostenlose Rakuten App-ID. |
| **Amazon.co.jp** | Ein Tipp öffnet die Amazon-Suche **nach Preis sortiert (günstigstes zuerst)**. |
| **Kakaku.com** | Ein Tipp öffnet die Kakaku-Suche (zeigt je Produkt den günstigsten Händlerpreis). |

**Warum nicht alles automatisch?** Amazon.co.jp und Kakaku.com blockieren
das direkte Auslesen aus einem Browser (kein Server). Deshalb bekommst du
dort mit einem Tipp die bereits nach Preis sortierten Ergebnisse — das ist
der schnellste zuverlässige Weg zum günstigsten Angebot.

## Rakuten App-ID einrichten (einmalig, kostenlos, ~1 Minute)

Damit oben automatisch der günstigste Rakuten-Preis erscheint:

1. Öffne <https://webservice.rakuten.co.jp/app/create>
2. Melde dich kostenlos an (Rakuten-Konto).
3. Lege eine App an (beliebiger Name, als App-URL genügt z. B. die Adresse
   dieses Tools oder `http://localhost`).
4. Kopiere die **„アプリID / applicationId“** (eine lange Zahl).
5. Im Tool auf **⚙ (oben rechts)** → App-ID einfügen → **Speichern**.

Die ID wird nur lokal in deinem Browser gespeichert (localStorage), nicht
an Dritte gesendet. Ohne ID funktionieren die Shop-Links trotzdem.

## Bedienung

1. Produktnamen eingeben (z. B. `Sony WH-1000XM5` oder `kabellose Kopfhörer`).
2. Auf **„Günstigsten Preis finden“** tippen.
3. Oben erscheint (mit App-ID) der günstigste Rakuten-Treffer mit
   **„Jetzt kaufen“**-Link. Darunter die Buttons für Amazon.co.jp und
   Kakaku.com, jeweils nach Preis sortiert.

Tipp: Für japanische Produkte liefert die japanische Suche oft mehr und
günstigere Treffer — das Tool übersetzt den Namen dafür automatisch.

## Veröffentlichen (GitHub Pages)

Die App besteht nur aus `index.html`, `style.css`, `app.js`. Über den
mitgelieferten Workflow `.github/workflows/deploy.yml` wird sie bei jedem
Push auf den konfigurierten Branch automatisch zu GitHub Pages
veröffentlicht. In den Repository-Einstellungen unter **Settings → Pages**
als Quelle **„GitHub Actions“** wählen.

## Technik

- Reines HTML/CSS/JavaScript, keine Abhängigkeiten, kein Build-Schritt.
- Rakuten Ichiba Item Search API (JSONP, umgeht CORS).
- Übersetzung über die kostenlose MyMemory-API (ohne Schlüssel); schlägt sie
  fehl, wird einfach mit dem Originalbegriff gesucht.

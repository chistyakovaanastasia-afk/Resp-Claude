# Hauswarte / Liegenschaftenservice im Kanton Aargau **ohne eigene Website**

Stand: 16.08.2026

## Quellen und Vorgehen

1. Verzeichnisabfrage über die öffentliche API von tel.search.ch: Kategorie/Stichwort
   `Hauswartung`, Gebiet `Aargau` (265 Treffer, API liefert ohne Schlüssel max. 200 Einträge).
2. Zu jedem Eintrag die vCard geladen (Adresse, Telefon, E-Mail, Branche) —
   152 der 200 Einträge haben eine hinterlegte E-Mail-Adresse.
3. Website-Prüfung in zwei Stufen:
   - technisch: DNS (Google/Cloudflare DoH) + HTTP-Abruf der Domain aus der
     E-Mail-Adresse sowie der auf search.ch verlinkten Webtreffer;
   - redaktionell: zusätzliche Websuche pro Firma, um Websites auf abweichenden
     Domains zu finden (so wurden z. B. Müller Reinigung Hauswartung, Vondruska,
     Alex Hausbetreuung, Fairy Clean, Telli/tellireinigung.ch, Schmid Gartenbau
     und RS Hauswartung Rheinfelden wieder aussortiert — sie haben eine Website).

## Liste: kein erreichbarer Webauftritt

| Firma | PLZ / Ort | Adresse | E-Mail | Telefon | Branche | Website-Status |
|---|---|---|---|---|---|---|
| AGI-Hauswartung GmbH | 5452 Oberrohrdorf | Im Feld 7C | info@ag-hauswartung.ch | 076 710 49 49 | Hauswartung / Liegenschaftenservice | Domain zeigt nur 'Webseite coming soon' |
| Hauswartung & Gartenservice Miki GmbH | 5453 Remetschwil | Dorfstrasse 1B | mikigmbh@gmx.ch | 079 860 37 96 | Hauswartung privat | keine Website |
| Hauswartung Ebner | 5116 Schinznach Bad | Bahnhofstrasse 35 | hauswartung-ebner@gmx.ch | 078 697 36 07 | Hauswartung / Liegenschaftenservice | keine Website |
| Hauswartung & Gartenpflege Andreas Ebner | 4332 Stein AG | Schaffhauserstrasse 16 | ebnerhauswartung@gmail.com | 062 534 75 16 / 078 406 16 76 | Hauswartung / Gartenpflege | keine Website |
| HOME Reinigung und Hauswartung B. Belic | 5426 Lengnau AG | Vogelsangstrasse 19 | home-reinigung@hotmail.com | 079 944 22 44 | Reinigung / Hauswartung | keine Website |
| Ahmetaj's Hauswartung & Reinigung | 5046 Walde AG | Dorfstrasse 279 | albanooo@hotmail.com | 078 610 15 05 | Reinigung / Hauswartung | keine Website |
| Reshani Hauswartung & Liegenschaftsbetreuung | 5210 Windisch | Pestalozzistrasse 9 | ymrireshani@hotmail.com | 076 244 56 52 | Hauswartung / Liegenschaftenservice | keine Website |
| Joni Reinigung & Hauswartung | 5430 Wettingen | Hardstrasse 70B | joni.reinigungen@hotmail.com | 079 952 96 16 | Reinigung / Hauswartung | keine Website |
| DRAPIC Hauswartung & Reinigung | 5430 Wettingen | Landstrasse 104 | adisdrapic3@gmail.com | 079 741 11 92 | Reinigung / Hauswartung | frühere Domain drapichauswartung.com inaktiv |
| ALEKSANDER GMBH | 4665 Oftringen | Parkweg 7 | aleksander.dedaj@outlook.com | 076 284 40 00 | Gartenbau / Hauswartung / Unterhalt | keine Website |
| Lanfranchi FM | 5400 Baden | Bruggerstrasse 164b | lanfranchi@gmx.ch | 076 563 11 94 | Facility Management | keine Website |
| PetracciaService (Multiservice) | 5420 Ehrendingen | Im First 4 | petracciaservice@gmail.com | 078 268 41 19 | Maler / Hauswartung / Multiservice | keine Website |
| Grmuša Facility Management | 5430 Wettingen | Etzelstrasse 25 | grmusa@bluewin.ch | 076 427 26 38 | Hauswartung / Liegenschaftenservice | keine Website |
| Ralf Multerer Hauswartungen | 4310 Rheinfelden | Magdenerstrasse 3 | hauswartungen.multerer@bluewin.ch | 079 136 50 78 (gem. local.ch) | Hauswartung / Liegenschaftenservice | keine Website |
| Ara (Inh. Pajkic) | 5034 Suhr | Grubenweg 9 | dp51284@gmail.com | 079 195 81 61 | Hauswartung / Liegenschaftenservice | keine Website |
| Cleanix Reinigungen Ibrahimi | 5737 Menziken | Pilatusstrasse 19 | info@cleanix-reinigung.ch | 076 239 43 91 | Reinigung / Hauswartung | Domain geparkt (Hostpoint), keine Website |
| Schenker & Romano GmbH Hauswartungen, Reinigungen, Gartenunterhalt | 4852 Rothrist | Froburgweg 1 / Kornweg 19 | info@schenker-romano.ch / schenker-romano@bluewin.ch | 062 295 70 60 / 062 794 60 68 | Hauswartung / Liegenschaftenservice | Website offline (Domain ohne A-Record) |
| Mulaj Hauswartung & Tatortreinigung | 4310 Rheinfelden | Waldhofstrasse 15 | info@mulajhauswartung.ch | 076 448 44 55 | Reinigung / Hauswartung | Domain inaktiv (NXDOMAIN) |
| Elmas Reinigungen | 5430 Wettingen | Aehrenweg 17 | info@elmas-reinigungen.ch | 076 348 73 78 | Reinigung / Hauswartung | Domain inaktiv (NXDOMAIN) |
| Fato Reinigungen GmbH | 5436 Würenlos | Bahnhofstrasse 10 | info@fato-reinigungen.ch | 056 426 50 59 | Gebäudereinigung / Hauswartung | Domain nicht mehr auflösbar |
| alanka gmbh | 5734 Reinach AG | Tödistrasse 16 | info@alanka.ch | 052 343 96 24 | Reinigung / Hauswartung | Domain inaktiv (NXDOMAIN) |
| HRG Service GmbH | 5642 Mühlau | Rüstenschwilerstrasse 2 | info@hrgservice.ch | 078 223 80 87 | Hauswartung / Liegenschaftenservice | Website offline (404) |
| Concept-Wilhelm | 5620 Bremgarten AG | Eggenwilerstrasse 62 | wilhelm@concept-wilhelm.ch | 056 641 30 35 | Facility Management / Liegenschaftsverwaltung | Server antwortet nur mit Fehler 503 |

## Grenzfälle: nur automatisch generierte Baukasten-Seite (localsearch «digitalone.site»)

Diese Firmen haben keine eigene Website, aber eine vom Verzeichnisanbieter
generierte Minimal-Seite — je nach Zielsetzung trotzdem interessante Adressen.

| Firma | PLZ / Ort | Adresse | E-Mail | Telefon | Branche | Website-Status |
|---|---|---|---|---|---|---|
| NSJ Hauswartung | 5415 Nussbaumen AG | Oberdorfstrasse 14 | nsjhauswartung@hotmail.com | 078 898 90 40 | Hauswartung / Liegenschaftenservice | nur automatische localsearch-Seite (nsj-hauswartung.digitalone.site) |
| BEX Generalunternehmen | 5507 Mellingen | Büblikerweg 2 | bex-generalunternehmen@outlook.com | 076 513 26 85 | Renovation / Hauswartung / Reinigung | nur automatische localsearch-Seite (bex-generalunternehmen.digitalone.site) |
| Brändli Gartenbau | 5225 Bözberg | Kirchbözberg 9 | gartenbau.braendli@bluewin.ch | 056 442 18 53 / 079 480 99 64 | Gartenbau / Gartenpflege | nur automatische localsearch-Seite (braendli-gartenbau.digitalone.site) |

## Bewusst nicht aufgenommen

- **Merseli Facility Service GmbH**, Mühlau — Konkurs eröffnet 10.02.2025.
- **Shasha GRM**, Schafisheim — im Handelsregister gelöscht.
- **Frei Naturstein-Reinigung**, Hägglingen — Konkurs 2021/2022, zudem Website
  frei-stein-reinigung.ch vorhanden.

## Einschränkungen

- Grundlage ist der search.ch-Datenbestand (Quelle: Swisscom Directories) für das
  Stichwort «Hauswartung»; die API begrenzt die Ausgabe auf 200 der 265 Treffer.
- Rund 48 der 200 Einträge haben im Verzeichnis gar keine E-Mail-Adresse hinterlegt
  und konnten deshalb nicht in eine Liste mit E-Mail-Spalte aufgenommen werden.
- «Keine Website» heisst: am 16.08.2026 war weder über die E-Mail-Domain noch über
  die Websuche ein eigener Webauftritt erreichbar. Rein soziale Präsenzen
  (Facebook/Instagram) und Verzeichniseinträge wurden nicht als Website gewertet.

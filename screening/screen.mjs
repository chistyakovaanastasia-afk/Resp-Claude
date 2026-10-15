#!/usr/bin/env node
// CH-Screening fuer japanische Supplements und Kosmetik-Boxen.
// Aufruf: node screening/screen.mjs produkt.json [weitere.json ...]
// Ergebnis: Markdown-Ampelbericht auf stdout.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const hier = dirname(fileURLToPath(import.meta.url));
const regeln = (name) => JSON.parse(readFileSync(join(hier, "rules", name), "utf8"));

const risiko = regeln("risikostoffe.json");
const vnem = regeln("vnem-vitamine-mineralstoffe.json");

const erlaubt = [...vnem.vitamine, ...vnem.mineralstoffe];
const normalisieren = (s) => s.toLowerCase().replace(/[\s　·・,，]/g, "");

// Findet ein Muster in einem Text. Lateinische Muster nur als ganzes Wort,
// damit "DNP" nicht in "DNPhosphat" und "鉄" nicht in beliebigem Kanji-Rauschen trifft.
function trifft(muster, text, textRoh) {
  if (/^[\x00-\x7F]+$/.test(muster)) {
    const wort = muster.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${wort}([^a-z0-9]|$)`, "i").test(textRoh);
  }
  return text.includes(normalisieren(muster));
}

function screeneProdukt(p) {
  const zutaten = p.zutaten ?? [];
  const roh = [p.name ?? "", p.anpreisungen ?? "", ...zutaten].join(" | ");
  const text = normalisieren(roh);
  const treffer = [];

  for (const stoff of risiko.stoffe) {
    const m = stoff.muster.filter((x) => trifft(x, text, roh));
    if (m.length) treffer.push({ ...stoff, gefunden: m });
  }

  // Vitamin/Mineralstoff genannt, aber nicht auf der abschliessenden VNem-Liste?
  const unbekannt = zutaten.filter((z) => {
    const zt = normalisieren(z);
    const zeigtVitamin = /vitamin|ビタミン|ミネラル|mineral/i.test(z);
    if (!zeigtVitamin) return false;
    return !erlaubt.some((e) =>
      [e.name, ...(e.jp ?? [])].some((n) => zt.includes(normalisieren(n)))
    );
  });

  const anpreisung = [...risiko.anpreisungen.muster_jp, ...risiko.anpreisungen.muster_de]
    .filter((x) => trifft(x, text, roh));

  const rot = treffer.filter((t) => t.ampel === "rot");
  const gelb = treffer.filter((t) => t.ampel === "gelb");
  const gesamt = rot.length ? "ROT" : (gelb.length || unbekannt.length || anpreisung.length) ? "GELB" : "GRUEN";

  return { produkt: p, rot, gelb, unbekannt, anpreisung, gesamt };
}

const symbol = { ROT: "🔴", GELB: "🟡", GRUEN: "🟢" };

function bericht(e) {
  const z = [];
  z.push(`## ${symbol[e.gesamt]} ${e.produkt.name ?? "(ohne Namen)"} — ${e.gesamt}`);
  if (e.produkt.quelle) z.push(`Quelle: ${e.produkt.quelle}`);
  z.push("");

  if (e.gesamt === "GRUEN") {
    z.push("Kein Treffer in der Risikoliste und keine unbekannten Vitamin-/Mineralstoffangaben.");
    z.push("");
    z.push("**Trotzdem offen und von Hand zu pruefen:** Hoechstmengen pro Tagesdosis gegen den aktuellen Anhang 1 VNem, und die chemischen Verbindungen gegen Anhang 2 VNem.");
  }

  for (const t of e.rot) {
    z.push(`- 🔴 **${t.id}** (gefunden: ${t.gefunden.join(", ")}) — ${t.grund}`);
    z.push(`  → Nicht in die Box. Quelle: ${t.quelle}`);
  }
  for (const t of e.gelb) {
    z.push(`- 🟡 **${t.id}** (gefunden: ${t.gefunden.join(", ")}) — ${t.grund}`);
    if (t.pruefen) z.push(`  → Zu pruefen: ${t.pruefen}`);
    z.push(`  → Quelle: ${t.quelle}`);
  }
  if (e.unbekannt.length) {
    z.push(`- 🟡 **Nicht gelistete Vitamin-/Mineralstoffangabe**: ${e.unbekannt.join(", ")}`);
    z.push("  → Die VNem-Liste ist abschliessend. Steht der Stoff nicht drauf, ist er in einem CH-Nahrungsergaenzungsmittel nicht zulaessig.");
  }
  if (e.anpreisung.length) {
    z.push(`- 🟡 **Anpreisung mit Heilwirkung**: ${e.anpreisung.join(", ")}`);
    z.push(`  → ${risiko.anpreisungen.regel}`);
  }
  z.push("");
  return z.join("\n");
}

const dateien = process.argv.slice(2);
if (!dateien.length) {
  console.error("Aufruf: node screening/screen.mjs produkt.json [...]");
  process.exit(1);
}

const produkte = dateien.flatMap((f) => {
  const d = JSON.parse(readFileSync(f, "utf8"));
  return Array.isArray(d) ? d : [d];
});

const ergebnisse = produkte.map(screeneProdukt);
const zaehler = { ROT: 0, GELB: 0, GRUEN: 0 };
ergebnisse.forEach((e) => zaehler[e.gesamt]++);

console.log(`# CH-Screening — ${new Date().toISOString().slice(0, 10)}`);
console.log("");
console.log(`${produkte.length} Produkt(e): 🔴 ${zaehler.ROT} · 🟡 ${zaehler.GELB} · 🟢 ${zaehler.GRUEN}`);
console.log("");
console.log(`> ${risiko.lesehilfe.hinweis}`);
console.log("");
ergebnisse.forEach((e) => console.log(bericht(e)));

process.exitCode = zaehler.ROT ? 2 : 0;

"use strict";

/* ---------------------------------------------------------------------
 * Konfiguration & Speicher
 * ------------------------------------------------------------------- */

const DEFAULT_SHEET_ID = "1dHGrrVySwxCA8yDc1zTi8zVZ-S1zCbAI7w4RvWb7iFA";
const DEFAULT_GID = "920984709"; // Tab "Alles"

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
};

function extractSheetIdAndGid(input) {
  if (!input) return null;
  const idMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = input.match(/[#&?]gid=(\d+)/);
  if (!idMatch) {
    // Maybe the user pasted a bare ID.
    if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) {
      return { id: input.trim(), gid: gidMatch ? gidMatch[1] : "0" };
    }
    return null;
  }
  return { id: idMatch[1], gid: gidMatch ? gidMatch[1] : "0" };
}

function currentSheetConfig() {
  const saved = store.get("sheetUrl", null);
  const parsed = saved ? extractSheetIdAndGid(saved) : null;
  return parsed || { id: DEFAULT_SHEET_ID, gid: DEFAULT_GID };
}

function exportCsvUrl({ id, gid }) {
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}&t=${Date.now()}`;
}

/* ---------------------------------------------------------------------
 * CSV Parsing (RFC4180-artig, damit Kommas/Anführungszeichen in Feldern
 * wie "jenes, das (dort)" korrekt behandelt werden)
 * ------------------------------------------------------------------- */

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = "";
      } else if (c === '\r') {
        // ignore, \n handles line breaks
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/* ---------------------------------------------------------------------
 * Datenmodell: nur echte Zeilen aus der Tabelle "Alles" werden geladen.
 * Es gibt keinen generativen Schritt - Fragen entstehen ausschliesslich
 * durch Auswahl eines Array-Index.
 * ------------------------------------------------------------------- */

function rowsToEntries(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idxNr = header.findIndex((h) => h.startsWith("nr"));
  const idxZh = header.findIndex((h) => h.startsWith("chin"));
  const idxPinyin = header.findIndex((h) => h.startsWith("pinyin"));
  const idxDe = header.findIndex((h) => h.startsWith("deutsch"));

  const useIdx = {
    nr: idxNr >= 0 ? idxNr : 0,
    zh: idxZh >= 0 ? idxZh : 1,
    pinyin: idxPinyin >= 0 ? idxPinyin : 2,
    de: idxDe >= 0 ? idxDe : 3
  };

  const entries = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const zh = (r[useIdx.zh] || "").trim();
    const pinyin = (r[useIdx.pinyin] || "").trim();
    const de = (r[useIdx.de] || "").trim();
    if (!zh && !de) continue; // leere Zeile ueberspringen
    entries.push({
      nr: (r[useIdx.nr] || "").trim() || String(i),
      zh,
      pinyin,
      de
    });
  }
  return entries;
}

async function fetchEntries(config) {
  const res = await fetch(exportCsvUrl(config), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? "Kein Zugriff. Bitte die Tabelle für 'Jeder mit Link' freigeben."
        : `Fehler beim Laden (HTTP ${res.status})`
    );
  }
  const text = await res.text();
  if (/^\s*<!DOCTYPE html/i.test(text) || /accounts\.google\.com/i.test(text)) {
    throw new Error("Kein Zugriff (Login-Seite erhalten). Bitte Freigabe prüfen.");
  }
  const rows = parseCsv(text);
  const entries = rowsToEntries(rows);
  if (!entries.length) throw new Error("Tabelle ist leer oder Format unerwartet.");
  return entries;
}

/* ---------------------------------------------------------------------
 * Text-Normalisierung & Grading
 * ------------------------------------------------------------------- */

function stripParens(s) {
  return s.replace(/\([^)]*\)/g, " ");
}

function normalizeDe(s) {
  return s
    .toLowerCase()
    .replace(/[„“"'.,;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingArticle(s) {
  return s.replace(/^(der|die|das|ein|eine|einen|einem|einer|zu|sich)\s+/i, "");
}

function deAlternatives(deField) {
  const withoutParens = stripParens(deField);
  return withoutParens
    .split(/[\/,;]/)
    .map((s) => stripLeadingArticle(normalizeDe(s)))
    .filter((s) => s.length > 0);
}

function normalizeZh(s) {
  return s
    .replace(/[，。？！：；、\s]/g, "")
    .replace(/[,.?!:;]/g, "")
    .trim();
}

function zhAlternatives(zhField) {
  return zhField
    .split("/")
    .map((s) => normalizeZh(s))
    .filter((s) => s.length > 0);
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function bestMatchScore(candidate, alternatives) {
  let bestRatio = Infinity;
  let bestDistance = Infinity;
  let bestAlt = "";
  for (const alt of alternatives) {
    if (!alt) continue;
    const d = levenshtein(candidate, alt);
    const ratio = d / Math.max(alt.length, 1);
    if (ratio < bestRatio) { bestRatio = ratio; bestDistance = d; bestAlt = alt; }
  }
  return {
    ratio: bestRatio === Infinity ? 1 : bestRatio,
    distance: bestDistance === Infinity ? Infinity : bestDistance,
    alt: bestAlt
  };
}

// Kurze Woerter: schon ein einzelner Zeichen-/Buchstabenunterschied
// zaehlt als "fast richtig", nicht erst ab einem festen Prozentsatz.
function isClose(distance, altLength, ratioThreshold) {
  if (altLength <= 4) return distance <= 1;
  return distance / altLength <= ratioThreshold;
}

const UNKNOWN_PHRASES = [
  "weiß nicht", "weiss nicht", "keine ahnung", "weiß ich nicht",
  "weiss ich nicht", "ich weiß es nicht", "ich weiss es nicht"
];

function gradeAnswer(heard, expectedField, kind) {
  const raw = (heard || "").trim();
  if (!raw) return { verdict: "unknown" };
  const lower = raw.toLowerCase();
  if (UNKNOWN_PHRASES.some((p) => lower.includes(p))) {
    return { verdict: "unknown" };
  }

  if (kind === "zh") {
    const candidate = normalizeZh(raw);
    const alts = zhAlternatives(expectedField);
    if (alts.includes(candidate)) return { verdict: "correct" };
    const { distance, alt } = bestMatchScore(candidate, alts);
    if (isClose(distance, alt.length, 0.3)) return { verdict: "close" };
    return { verdict: "wrong" };
  } else {
    const candidate = stripLeadingArticle(normalizeDe(raw));
    const alts = deAlternatives(expectedField);
    if (alts.includes(candidate)) return { verdict: "correct" };
    // Auch prüfen, ob eine Alternative als Teilstring in einer laengeren
    // gesprochenen Antwort enthalten ist (z.B. "ich glaube das heisst X").
    if (alts.some((a) => a.length > 2 && candidate.includes(a))) {
      return { verdict: "correct" };
    }
    const { distance, alt } = bestMatchScore(candidate, alts);
    if (isClose(distance, alt.length, 0.34)) return { verdict: "close" };
    return { verdict: "wrong" };
  }
}

/* ---------------------------------------------------------------------
 * Zufaellige, gestreute Auswahl ueber die GESAMTE aktuelle Tabelle.
 * - kein sequentielles Abfragen
 * - kein direkt benachbarter Index nach dem vorigen
 * - ein rollierendes Fenster verhindert zu schnelle Wiederholung
 * - Drittel-Ausgleich sorgt fuer Streuung ueber Anfang/Mitte/Ende
 * - falsch beantwortete Zeilen kommen ueber eine "faellig ab Frage N"
 *   Warteschlange spaeter garantiert wieder dran
 * ------------------------------------------------------------------- */

class Selector {
  constructor(size) {
    this.size = size;
    this.history = [];
    this.questionCount = 0;
    this.dueQueue = []; // { index, dueAt }
    this.tertileRecent = [0, 0, 0];
  }

  tertileOf(index) {
    const third = this.size / 3;
    if (index < third) return 0;
    if (index < 2 * third) return 1;
    return 2;
  }

  windowSize() {
    return Math.max(3, Math.min(15, Math.floor(this.size / 3)));
  }

  scheduleRetry(index) {
    const delay = 5 + Math.floor(Math.random() * 4); // 5..8 Fragen Abstand
    this.dueQueue.push({ index, dueAt: this.questionCount + delay });
  }

  pickNext() {
    this.questionCount++;
    const win = this.windowSize();
    const recentSet = new Set(this.history.slice(-win));
    const lastIndex = this.history[this.history.length - 1];

    const isEligible = (i) => {
      if (recentSet.has(i)) return false;
      if (lastIndex !== undefined && Math.abs(i - lastIndex) <= 2) return false;
      return true;
    };

    // Faellige Wiederholungen bevorzugen (mit steigender Prioritaet, je
    // laenger sie ueberfaellig sind), aber nicht garantiert jedes Mal -
    // so bleibt die Reihenfolge zufaellig, aber der Eintrag kommt
    // sicher irgendwann zurueck.
    const due = this.dueQueue.filter((d) => d.dueAt <= this.questionCount && isEligible(d.index));
    if (due.length) {
      due.sort((a, b) => a.dueAt - b.dueAt);
      const overdueBonus = Math.min(0.85, 0.35 + 0.1 * (this.questionCount - due[0].dueAt));
      if (Math.random() < overdueBonus) {
        const chosen = due[0];
        this.dueQueue = this.dueQueue.filter((d) => d !== chosen);
        this._commit(chosen.index);
        return chosen.index;
      }
    }

    let pool = [];
    for (let i = 0; i < this.size; i++) if (isEligible(i)) pool.push(i);
    if (!pool.length) {
      // Notfall: Fenster/Adjazenz lockern
      for (let i = 0; i < this.size; i++) {
        if (i !== lastIndex && !recentSet.has(i)) pool.push(i);
      }
    }
    if (!pool.length) pool = Array.from({ length: this.size }, (_, i) => i).filter((i) => i !== lastIndex);

    // Drittel bevorzugen, das zuletzt am wenigsten drankam.
    const byTertile = [[], [], []];
    for (const i of pool) byTertile[this.tertileOf(i)].push(i);
    const order = [0, 1, 2].sort((a, b) => this.tertileRecent[a] - this.tertileRecent[b]);
    let chosenTertile = order.find((t) => byTertile[t].length > 0);
    if (chosenTertile === undefined) chosenTertile = order[0];
    const candidates = byTertile[chosenTertile].length ? byTertile[chosenTertile] : pool;

    const index = candidates[Math.floor(Math.random() * candidates.length)];
    this._commit(index);
    return index;
  }

  _commit(index) {
    this.history.push(index);
    if (this.history.length > 200) this.history.shift();
    const t = this.tertileOf(index);
    this.tertileRecent = this.tertileRecent.map((v, i) => (i === t ? 0 : v + 1));
  }
}

/* ---------------------------------------------------------------------
 * Sprachausgabe (TTS) & Spracherkennung (STT)
 * ------------------------------------------------------------------- */

const synth = window.speechSynthesis;
let voicesCache = [];

function loadVoices() {
  voicesCache = synth ? synth.getVoices() : [];
}
if (synth) {
  loadVoices();
  synth.onvoiceschanged = loadVoices;
}

function pickVoice(lang) {
  const exact = voicesCache.find((v) => v.lang && v.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const prefix = lang.split("-")[0];
  return voicesCache.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
}

function getRate() {
  const el = document.getElementById("voiceRateInput");
  return el ? parseFloat(el.value) : 0.95;
}

function speak(text, lang) {
  return new Promise((resolve) => {
    if (!synth || !text) return resolve();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.rate = getRate();
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

function listenOnce(lang, timeoutMs = 7000) {
  return new Promise((resolve) => {
    if (!SpeechRecognitionImpl) return resolve("");
    const rec = new SpeechRecognitionImpl();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let done = false;
    const finish = (text) => {
      if (done) return;
      done = true;
      try { rec.stop(); } catch (e) {}
      resolve(text);
    };
    rec.onresult = (e) => {
      const text = e.results && e.results[0] && e.results[0][0]
        ? e.results[0][0].transcript
        : "";
      finish(text);
    };
    rec.onerror = () => finish("");
    rec.onend = () => finish("");
    const timer = setTimeout(() => finish(""), timeoutMs);
    rec.onresult = ((orig) => (e) => { clearTimeout(timer); orig(e); })(rec.onresult);
    try { rec.start(); } catch (e) { finish(""); }
  });
}

/* ---------------------------------------------------------------------
 * UI-Referenzen
 * ------------------------------------------------------------------- */

const ui = {
  compatWarning: document.getElementById("compatWarning"),
  status: document.getElementById("status"),
  phase: document.getElementById("phase"),
  cardType: document.getElementById("cardType"),
  cardPrompt: document.getElementById("cardPrompt"),
  cardPinyin: document.getElementById("cardPinyin"),
  cardHeard: document.getElementById("cardHeard"),
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  statLoaded: document.getElementById("statLoaded"),
  statCount: document.getElementById("statCount"),
  logList: document.getElementById("logList"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsPanel: document.getElementById("settingsPanel"),
  sheetUrlInput: document.getElementById("sheetUrlInput"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  reloadDataBtn: document.getElementById("reloadDataBtn"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  settingsMsg: document.getElementById("settingsMsg")
};

function setStatus(text) { ui.status.textContent = text; }
function setPhase(text) { ui.phase.textContent = text; }

function logEntry(kind, entry, verdict, heard) {
  const li = document.createElement("li");
  const badgeClass = verdict === "correct" ? "badge-ok" : verdict === "close" ? "badge-warn" : "badge-bad";
  const badgeSym = verdict === "correct" ? "✅" : verdict === "close" ? "⚠️" : "❌";

  const badge = document.createElement("span");
  badge.className = `badge ${badgeClass}`;
  badge.textContent = badgeSym + " ";
  li.appendChild(badge);

  const strong = document.createElement("strong");
  strong.textContent = entry.de;
  li.appendChild(strong);
  li.appendChild(document.createTextNode(` — ${entry.zh} (${entry.pinyin})`));

  if (heard) {
    li.appendChild(document.createElement("br"));
    const span = document.createElement("span");
    span.style.color = "var(--muted)";
    span.textContent = `gehört: „${heard}“`;
    li.appendChild(span);
  }
  ui.logList.prepend(li);
}

/* ---------------------------------------------------------------------
 * Trainer-Zustandsmaschine
 * ------------------------------------------------------------------- */

const trainer = {
  entries: [],
  selector: null,
  running: false,
  currentType: null, // "de2zh" | "zh2de"
  currentIndex: null,
  stopRequested: false
};

async function loadData(showStatus = true) {
  const config = currentSheetConfig();
  if (showStatus) setStatus("Lade Vokabeln …");
  try {
    const entries = await fetchEntries(config);
    trainer.entries = entries;
    trainer.selector = new Selector(entries.length);
    store.set("cachedEntries", entries);
    store.set("cachedAt", new Date().toISOString());
    ui.statLoaded.textContent = `Zuletzt geladen: ${new Date().toLocaleString("de-DE")}`;
    ui.statCount.textContent = `${entries.length} Einträge`;
    if (showStatus) setStatus("Bereit");
    return true;
  } catch (err) {
    const cached = store.get("cachedEntries", null);
    if (cached && cached.length) {
      trainer.entries = cached;
      trainer.selector = new Selector(cached.length);
      ui.statLoaded.textContent = `Offline-Kopie (${store.get("cachedAt", "")})`;
      ui.statCount.textContent = `${cached.length} Einträge`;
      setStatus("Konnte nicht aktualisieren – nutze gespeicherte Kopie. " + err.message);
      return true;
    }
    setStatus("Fehler: " + err.message);
    return false;
  }
}

function pauseWordDetected(text) {
  return /\bpause\b/i.test(text || "");
}

async function askQuestion() {
  const idx = trainer.selector.pickNext();
  trainer.currentIndex = idx;
  const entry = trainer.entries[idx];
  const type = Math.random() < 0.5 ? "de2zh" : "zh2de";
  trainer.currentType = type;

  ui.cardHeard.textContent = "";

  if (type === "de2zh") {
    ui.cardType.textContent = "Deutsch → Chinesisch";
    ui.cardPrompt.textContent = entry.de;
    ui.cardPinyin.textContent = "";
    setPhase("Frage");
    await speak(entry.de, "de-DE");
  } else {
    ui.cardType.textContent = "Chinesisch → Deutsch";
    ui.cardPrompt.textContent = entry.zh;
    ui.cardPinyin.textContent = entry.pinyin;
    setPhase("Frage");
    await speak(entry.zh, "zh-CN");
  }
  return entry;
}

async function listenForAnswer(lang) {
  setPhase("Höre zu …");
  setStatus("Bitte antworten");
  const heard = await listenOnce(lang);
  ui.cardHeard.textContent = heard ? `gehört: „${heard}“` : "(nichts verstanden)";
  return heard;
}

async function runCorrection(entry, type) {
  for (let round = 0; round < 2; round++) {
    if (trainer.stopRequested) return;
    setPhase("Korrektur");
    if (type === "de2zh") {
      await speak(entry.zh, "zh-CN");
      ui.cardPinyin.textContent = entry.pinyin;
      await speak("Bitte wiederhole es.", "de-DE");
      setStatus("Bitte wiederholen (Chinesisch)");
      const heard = await listenOnce("zh-CN", 6000);
      if (pauseWordDetected(heard)) { await speak("Pause.", "de-DE"); stopTraining(); return; }
    } else {
      await speak(entry.zh, "zh-CN");
      ui.cardPinyin.textContent = entry.pinyin;
      await speak(entry.de, "de-DE");
      await speak("Bitte wiederhole es.", "de-DE");
      setStatus("Bitte wiederholen (Chinesisch, dann Deutsch)");
      const heard1 = await listenOnce("zh-CN", 6000);
      if (pauseWordDetected(heard1)) { await speak("Pause.", "de-DE"); stopTraining(); return; }
      const heard2 = await listenOnce("de-DE", 6000);
      if (pauseWordDetected(heard2)) { await speak("Pause.", "de-DE"); stopTraining(); return; }
    }
  }
}

async function runLoop() {
  while (trainer.running && !trainer.stopRequested) {
    const entry = await askQuestion();
    if (trainer.stopRequested) break;

    const answerLang = trainer.currentType === "de2zh" ? "zh-CN" : "de-DE";
    const heard = await listenForAnswer(answerLang);

    if (trainer.stopRequested) break;

    if (pauseWordDetected(heard)) {
      await speak("Pause.", "de-DE");
      stopTraining();
      break;
    }

    const expectedField = trainer.currentType === "de2zh" ? entry.zh : entry.de;
    const kind = trainer.currentType === "de2zh" ? "zh" : "de";
    const result = gradeAnswer(heard, expectedField, kind);

    if (result.verdict === "correct") {
      setPhase("✅ Richtig");
      logEntry(trainer.currentType, entry, "correct", heard);
      await speak("Richtig.", "de-DE");
    } else {
      const verdictLabel = result.verdict === "close" ? "close" : "wrong";
      setPhase(result.verdict === "close" ? "⚠️ Fast richtig" : "❌ Falsch");
      logEntry(trainer.currentType, entry, verdictLabel === "close" ? "close" : "wrong", heard);
      await speak(result.verdict === "close" ? "Fast richtig." : "Falsch.", "de-DE");
      trainer.selector.scheduleRetry(trainer.currentIndex);
      await runCorrection(entry, trainer.currentType);
    }
  }
}

function startTraining() {
  if (!SpeechRecognitionImpl) {
    setStatus("Start nicht möglich: keine Spracherkennung verfügbar (siehe Hinweis oben).");
    return;
  }
  if (!trainer.entries.length) {
    setStatus("Keine Daten geladen. Bitte Einstellungen prüfen.");
    return;
  }
  trainer.running = true;
  trainer.stopRequested = false;
  ui.startBtn.disabled = true;
  ui.pauseBtn.disabled = false;
  runLoop();
}

function stopTraining() {
  trainer.running = false;
  trainer.stopRequested = true;
  synth && synth.cancel();
  ui.startBtn.disabled = false;
  ui.pauseBtn.disabled = true;
  setPhase("");
  setStatus("Pausiert");
}

/* ---------------------------------------------------------------------
 * Event-Wiring
 * ------------------------------------------------------------------- */

ui.startBtn.addEventListener("click", startTraining);
ui.pauseBtn.addEventListener("click", stopTraining);

ui.settingsBtn.addEventListener("click", () => {
  ui.sheetUrlInput.value = store.get("sheetUrl", "");
  ui.settingsPanel.classList.remove("hidden");
});
ui.closeSettingsBtn.addEventListener("click", () => {
  ui.settingsPanel.classList.add("hidden");
});
ui.saveSettingsBtn.addEventListener("click", async () => {
  const val = ui.sheetUrlInput.value.trim();
  if (val && !extractSheetIdAndGid(val)) {
    ui.settingsMsg.textContent = "Link nicht erkannt. Bitte den vollständigen Google-Sheets-Link einfügen.";
    return;
  }
  store.set("sheetUrl", val);
  ui.settingsMsg.textContent = "Gespeichert. Lade Daten …";
  const ok = await loadData();
  ui.settingsMsg.textContent = ok ? "Daten geladen." : "Fehler beim Laden.";
});
ui.reloadDataBtn.addEventListener("click", async () => {
  ui.settingsMsg.textContent = "Lade Daten …";
  const ok = await loadData();
  ui.settingsMsg.textContent = ok ? "Daten aktualisiert." : "Fehler beim Laden.";
});

/* ---------------------------------------------------------------------
 * Start
 * ------------------------------------------------------------------- */

(async function init() {
  if (!SpeechRecognitionImpl) {
    ui.compatWarning.textContent =
      "Dieser Browser unterstützt keine Spracherkennung (z.B. Samsung Internet oder iOS Safari). " +
      "Bitte die Seite in Google Chrome öffnen, damit „Start“ funktioniert.";
    ui.compatWarning.classList.remove("hidden");
    ui.startBtn.disabled = true;
  }
  await loadData(true);
})();

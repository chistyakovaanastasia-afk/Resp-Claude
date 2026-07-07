"use strict";

/*
 * Japan Preis-Finder — statische Web-App, kein Server.
 *
 * Ablauf:
 *  1. Nutzer gibt einen Produktnamen in beliebiger Sprache ein.
 *  2. Der Name wird (bei Bedarf) ins Japanische übersetzt -> wir suchen
 *     sowohl mit dem Originalbegriff als auch mit der japanischen Fassung.
 *  3. Rakuten: offizielle Ichiba-API (JSONP) liefert echte Preise. Wir
 *     nehmen über beide Suchbegriffe den global günstigsten Treffer und
 *     zeigen Preis (¥), Shop und Direkt-Kauflink.
 *  4. Amazon.co.jp & Kakaku.com lassen sich aus dem Browser nicht auslesen
 *     -> ein Tipp öffnet dort die nach Preis (aufsteigend) sortierte Suche.
 */

const $ = (id) => document.getElementById(id);

const els = {
  form: $("searchForm"),
  query: $("query"),
  searchBtn: $("searchBtn"),
  terms: $("terms"),
  status: $("status"),
  bestBox: $("bestBox"),
  bestLink: $("bestLink"),
  bestImg: $("bestImg"),
  bestName: $("bestName"),
  bestShop: $("bestShop"),
  bestPrice: $("bestPrice"),
  shopLinks: $("shopLinks"),
  linkRakuten: $("linkRakuten"),
  linkAmazon: $("linkAmazon"),
  linkKakaku: $("linkKakaku"),
  settingsBtn: $("settingsBtn"),
  settingsPanel: $("settingsPanel"),
  rakutenId: $("rakutenId"),
  saveSettings: $("saveSettings"),
  closeSettings: $("closeSettings"),
};

const LS_RAKUTEN = "jpf_rakuten_app_id";

// ---------- Hilfsfunktionen ----------

const yen = (n) => "¥" + Number(n).toLocaleString("ja-JP");

function setStatus(msg, isError) {
  if (!msg) {
    els.status.classList.add("hidden");
    return;
  }
  els.status.textContent = msg;
  els.status.classList.toggle("error", !!isError);
  els.status.classList.remove("hidden");
}

// Prüft grob, ob ein Text bereits japanische Zeichen enthält.
function hasJapanese(s) {
  return /[぀-ヿ㐀-鿿ｦ-ﾟ]/.test(s);
}

// JSONP-Aufruf (umgeht CORS). Gibt ein Promise mit den JSON-Daten zurück.
function jsonp(baseUrl, params, callbackParam = "callback", timeout = 12000) {
  return new Promise((resolve, reject) => {
    const cbName = "__jpf_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    let done = false;

    const cleanup = () => {
      delete window[cbName];
      script.remove();
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      if (!done) { done = true; cleanup(); reject(new Error("Zeitüberschreitung")); }
    }, timeout);

    window[cbName] = (data) => {
      if (done) return;
      done = true; cleanup(); resolve(data);
    };
    script.onerror = () => {
      if (done) return;
      done = true; cleanup(); reject(new Error("Netzwerkfehler"));
    };

    const usp = new URLSearchParams(params);
    usp.set(callbackParam, cbName);
    script.src = baseUrl + "?" + usp.toString();
    document.body.appendChild(script);
  });
}

// Übersetzt einen Begriff ins Japanische (keyless, CORS-offen).
// Fällt bei Fehler auf den Originalbegriff zurück.
async function translateToJapanese(text) {
  if (hasJapanese(text)) return text;
  try {
    const url = "https://api.mymemory.translated.net/get?" +
      new URLSearchParams({ q: text, langpair: "en|ja" }).toString();
    const res = await fetch(url);
    const data = await res.json();
    const t = data && data.responseData && data.responseData.translatedText;
    if (t && hasJapanese(t) && t.toLowerCase() !== text.toLowerCase()) {
      return t.trim();
    }
  } catch (_) { /* ignorieren */ }
  return null; // keine brauchbare Übersetzung
}

// ---------- Rakuten API ----------

async function rakutenCheapest(appId, keyword) {
  const data = await jsonp(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601",
    {
      applicationId: appId,
      keyword: keyword,
      sort: "+itemPrice", // aufsteigend nach Preis
      hits: 5,
      format: "json",
      availability: 1,
    }
  );
  if (data && data.error) throw new Error(data.error_description || data.error);
  const items = (data && data.Items) || [];
  if (!items.length) return null;
  const it = items[0].Item;
  return {
    name: it.itemName,
    price: it.itemPrice,
    shop: it.shopName,
    url: it.itemUrl,
    img: (it.mediumImageUrls && it.mediumImageUrls[0] &&
          it.mediumImageUrls[0].imageUrl) || "",
  };
}

// ---------- Shop-Suchlinks (immer verfügbar) ----------

function shopSearchUrls(term) {
  const q = encodeURIComponent(term);
  return {
    // Rakuten-Suche, s=11 = Preis aufsteigend (günstigstes zuerst)
    rakuten: `https://search.rakuten.co.jp/search/mall/${q}/?s=11`,
    // Amazon.co.jp, nach Preis aufsteigend sortiert
    amazon: `https://www.amazon.co.jp/s?k=${q}&s=price-asc-rank`,
    // Kakaku.com: search.kakaku.com ist die eigentliche Such-Domain
    kakaku: `https://search.kakaku.com/${q}/`,
  };
}

// ---------- Hauptsuche ----------

async function runSearch(rawTerm) {
  const term = rawTerm.trim();
  if (!term) return;

  els.searchBtn.disabled = true;
  els.bestBox.classList.add("hidden");
  els.shopLinks.classList.add("hidden");
  els.terms.classList.add("hidden");
  setStatus("Suche läuft …");

  // Suchbegriffe zusammenstellen: Original + japanische Fassung.
  const jp = await translateToJapanese(term);
  const searchTerms = [term];
  if (jp && jp !== term) searchTerms.push(jp);

  // Für die Shop-Links den japanischen Begriff bevorzugen (bessere Treffer).
  const linkTerm = jp || term;
  const urls = shopSearchUrls(linkTerm);
  els.linkRakuten.href = urls.rakuten;
  els.linkAmazon.href = urls.amazon;
  els.linkKakaku.href = urls.kakaku;
  els.shopLinks.classList.remove("hidden");

  els.terms.textContent = "Gesucht als: " + searchTerms.join("  ·  ");
  els.terms.classList.remove("hidden");

  // Automatischer Rakuten-Bestpreis (nur mit App-ID).
  const appId = (localStorage.getItem(LS_RAKUTEN) || "").trim();
  if (!appId) {
    setStatus("Tipp: Trage in den Einstellungen (⚙) deine kostenlose " +
      "Rakuten App-ID ein, dann zeige ich dir hier automatisch den " +
      "günstigsten Rakuten-Preis. Die Shop-Links unten funktionieren " +
      "schon jetzt.");
    els.searchBtn.disabled = false;
    return;
  }

  try {
    const results = [];
    for (const kw of searchTerms) {
      try {
        const r = await rakutenCheapest(appId, kw);
        if (r) results.push(r);
      } catch (e) {
        // Einzelne Anfrage fehlgeschlagen — andere Begriffe trotzdem versuchen.
        if (/wrong parameter|not found|invalid/i.test(e.message)) throw e;
      }
    }

    if (!results.length) {
      setStatus("Kein Rakuten-Treffer. Sieh über die Shop-Links unten nach.");
      els.searchBtn.disabled = false;
      return;
    }

    results.sort((a, b) => a.price - b.price);
    showBest(results[0]);
    setStatus("");
  } catch (e) {
    const msg = /parameter|invalid|application/i.test(e.message)
      ? "Rakuten App-ID scheint ungültig. Bitte in den Einstellungen (⚙) prüfen."
      : "Rakuten gerade nicht erreichbar (" + e.message + "). " +
        "Nutze die Shop-Links unten.";
    setStatus(msg, true);
  } finally {
    els.searchBtn.disabled = false;
  }
}

function showBest(item) {
  els.bestName.textContent = item.name;
  els.bestShop.textContent = item.shop;
  els.bestPrice.textContent = yen(item.price);
  els.bestLink.href = item.url;
  if (item.img) { els.bestImg.src = item.img; }
  else { els.bestImg.removeAttribute("src"); }
  els.bestBox.classList.remove("hidden");
}

// ---------- Einstellungen ----------

function openSettings() {
  els.rakutenId.value = localStorage.getItem(LS_RAKUTEN) || "";
  els.settingsPanel.classList.remove("hidden");
}
function closeSettings() { els.settingsPanel.classList.add("hidden"); }
function saveSettings() {
  const v = els.rakutenId.value.trim();
  if (v) localStorage.setItem(LS_RAKUTEN, v);
  else localStorage.removeItem(LS_RAKUTEN);
  closeSettings();
  setStatus(v ? "Rakuten App-ID gespeichert." : "Rakuten App-ID entfernt.");
}

// ---------- Events ----------

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  els.query.blur();
  runSearch(els.query.value);
});
els.settingsBtn.addEventListener("click", openSettings);
els.saveSettings.addEventListener("click", saveSettings);
els.closeSettings.addEventListener("click", closeSettings);
els.settingsPanel.addEventListener("click", (e) => {
  if (e.target === els.settingsPanel) closeSettings();
});

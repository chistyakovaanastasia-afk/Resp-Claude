"use strict";

// Lokales, mehrsprachiges Spracherkennungsmodell (Whisper) direkt im
// Browser - laeuft komplett offline nach dem ersten Download, braucht
// keinen Server und ist nicht auf die (unzuverlaessige, sprachfeste)
// eingebaute Browser-Spracherkennung angewiesen. Dadurch:
// - Kein Umschalten zwischen "erwartet Deutsch"/"erwartet Chinesisch"
//   noetig - Whisper erkennt die gesprochene Sprache pro Aeusserung.
// - Funktioniert auch dort, wo window.SpeechRecognition fehlt oder
//   kaputt ist (z.B. Samsung Internet, iOS Safari) - vorausgesetzt
//   Mikrofonzugriff (getUserMedia) und WebAssembly sind vorhanden,
//   was deutlich breiter unterstuetzt wird.
//
// Nachteil, ehrlich gesagt: eine lokale ASR-Anfrage dauert spuerbar
// laenger als die eingebaute Spracherkennung (mehrere Sekunden
// Verarbeitungszeit statt praktisch sofort), und das erste Laden laedt
// das Modell einmalig herunter (mehrere zehn MB, danach im Cache).

import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm";

env.allowLocalModels = false;

const MODEL_ID = "Xenova/whisper-base";

let transcriberPromise = null;

export function loadModel(onProgress) {
  if (!transcriberPromise) {
    transcriberPromise = pipeline("automatic-speech-recognition", MODEL_ID, {
      progress_callback: onProgress
    });
  }
  return transcriberPromise;
}

let micStream = null;

export async function ensureMic() {
  if (!micStream || micStream.getTracks().every((t) => t.readyState === "ended")) {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
    });
  }
  return micStream;
}

export function releaseMic() {
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
}

export function sttSupported() {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder &&
    (window.AudioContext || window.webkitAudioContext) &&
    window.OfflineAudioContext
  );
}

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const c of candidates) {
    if (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

// Eigene, lautstaerkebasierte Sprachaktivitaetserkennung (VAD): nimmt
// auf, bis nach begonnenem Sprechen eine echte Pause erkannt wird -
// unabhaengig von jeder Browser-Spracherkennungs-API.
export async function recordUntilSilence({
  maxWaitMs = 16000,
  maxRecordMs = 20000,
  silenceHangoverMs = 1100,
  volumeThreshold = 0.02,
  onLevel
} = {}) {
  const stream = await ensureMic();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const data = new Float32Array(analyser.fftSize);

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

  const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
  recorder.start(200);

  const started = Date.now();
  let speechStarted = false;

  await new Promise((resolve) => {
    let lastLoud = started;
    let rafId = null;
    const tick = () => {
      analyser.getFloatTimeDomainData(data);
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) sumSq += data[i] * data[i];
      const rms = Math.sqrt(sumSq / data.length);
      if (onLevel) onLevel(rms);

      const now = Date.now();
      if (rms > volumeThreshold) {
        speechStarted = true;
        lastLoud = now;
      }
      const elapsed = now - started;
      if (!speechStarted && elapsed > maxWaitMs) return resolve();
      if (speechStarted && now - lastLoud > silenceHangoverMs) return resolve();
      if (elapsed > maxRecordMs) return resolve();
      rafId = requestAnimationFrame(tick);
    };
    tick();
    // Aufraeumen, falls resolve() ueber einen anderen Pfad passiert.
    stopped.then(() => { if (rafId) cancelAnimationFrame(rafId); });
  });

  recorder.stop();
  await stopped;
  source.disconnect();
  await audioCtx.close();

  if (!speechStarted || !chunks.length) return null;
  return new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
}

async function decodeTo16kMono(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const probeCtx = new AudioCtx();
  const decoded = await probeCtx.decodeAudioData(arrayBuffer);
  await probeCtx.close();

  const targetRate = 16000;
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetRate), targetRate);

  let monoBuffer = decoded;
  if (decoded.numberOfChannels > 1) {
    monoBuffer = offline.createBuffer(1, decoded.length, decoded.sampleRate);
    const out = monoBuffer.getChannelData(0);
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      const chData = decoded.getChannelData(ch);
      for (let i = 0; i < chData.length; i++) out[i] = (out[i] || 0) + chData[i] / decoded.numberOfChannels;
    }
  }

  const src = offline.createBufferSource();
  src.buffer = monoBuffer;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

// Transkribiert eine Aufnahme. Liefert zunaechst die automatische
// Spracherkennung (Whisper erkennt die Sprache selbst - das ist der
// Kern der Mehrsprachigkeit). Whisper's Spracherkennung ist bei sehr
// kurzen Aeusserungen (einzelne Woerter) aber unzuverlaessiger, daher
// liefert diese Funktion bei Bedarf zusaetzlich erzwungene Versuche in
// den uebergebenen Kandidatensprachen mit - der Aufrufer waehlt dann
// aus, welche Interpretation am besten zur erwarteten Antwort passt.
export async function transcribe(blob, { candidateLangs = [], onProgress } = {}) {
  const transcriber = await loadModel(onProgress);
  const audio = await decodeTo16kMono(blob);

  const results = [];
  const auto = await transcriber(audio, { language: null, task: "transcribe" });
  results.push({ lang: "auto", text: (auto.text || "").trim() });

  for (const lang of candidateLangs) {
    try {
      const forced = await transcriber(audio, { language: lang, task: "transcribe" });
      const text = (forced.text || "").trim();
      if (text && text !== results[0].text) results.push({ lang, text });
    } catch (e) {
      // Manche Sprachbezeichner werden von der jeweiligen Modellversion
      // nicht akzeptiert - dann einfach ohne diesen Versuch weitermachen.
    }
  }
  return results;
}

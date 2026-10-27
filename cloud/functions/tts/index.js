"use strict";
/* 猫猫俄语通 · Russian text-to-speech (Tencent CloudBase cloud function)
   Used when the phone / browser has no Russian voice of its own (most Chinese Android browsers).
   Returns an mp3 as base64. Every sentence is synthesised once and then served from the tts_cache collection.
   Engine: Microsoft Azure Speech when AZURE_TTS_KEY + AZURE_TTS_REGION are set (recommended for the store release),
   otherwise the Edge read-aloud service. Voices: Svetlana (speaker A / default) and Dmitry (speaker B). */
const tcb = require("@cloudbase/node-sdk");
const crypto = require("crypto");
const https = require("https");
const WebSocket = require("ws");

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();
const CACHE = "tts_cache";
const VOICES = ["ru-RU-SvetlanaNeural", "ru-RU-DmitryNeural"];
const FORMAT = "audio-24khz-48kbitrate-mono-mp3";
let ready = null;
const ensure = () => ready || (ready = db.createCollection(CACHE).catch(() => null));

const xml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const ssml = (text, voice) => `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ru-RU'><voice name='${voice}'><prosody rate='+0%' pitch='+0Hz'>${xml(text)}</prosody></voice></speak>`;

/* ---- official Azure Speech REST ---- */
function azure(text, voice) {
  const key = process.env.AZURE_TTS_KEY, region = process.env.AZURE_TTS_REGION;
  return new Promise((res, rej) => {
    const body = Buffer.from(ssml(text, voice));
    const req = https.request({ host: `${region}.tts.speech.microsoft.com`, path: "/cognitiveservices/v1", method: "POST", timeout: 15000,
      headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": FORMAT, "User-Agent": "maomao", "Content-Length": body.length } }, r => {
      const parts = []; r.on("data", d => parts.push(d));
      r.on("end", () => r.statusCode === 200 ? res(Buffer.concat(parts)) : rej(new Error("azure " + r.statusCode)));
    });
    req.on("timeout", () => req.destroy(new Error("azure timeout"))); req.on("error", rej); req.end(body);
  });
}

/* ---- Edge read-aloud websocket ---- */
const TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM = "143.0.3650.75";
function gec() {
  let ticks = Math.floor(Date.now() / 1000) + 11644473600;
  ticks -= ticks % 300;
  return crypto.createHash("sha256").update(`${BigInt(ticks) * 10000000n}${TOKEN}`, "ascii").digest("hex").toUpperCase();
}
const uid = () => crypto.randomBytes(16).toString("hex");
const stamp = () => new Date().toUTCString().replace("GMT", "GMT+0000 (Coordinated Universal Time)");
function edge(text, voice) {
  return new Promise((resolve, reject) => {
    const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TOKEN}&Sec-MS-GEC=${gec()}&Sec-MS-GEC-Version=1-${CHROMIUM}&ConnectionId=${uid()}`;
    const ws = new WebSocket(url, { headers: {
      "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold", "Pragma": "no-cache", "Cache-Control": "no-cache",
      "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM.split(".")[0]}.0.0.0 Safari/537.36 Edg/${CHROMIUM.split(".")[0]}.0.0.0` } });
    const chunks = []; let done = false;
    const end = (err) => { if (done) return; done = true; clearTimeout(t); try { ws.close(); } catch (_) {} err ? reject(err) : resolve(Buffer.concat(chunks)); };
    const t = setTimeout(() => end(new Error("edge timeout")), 15000);
    ws.on("open", () => {
      ws.send(`X-Timestamp:${stamp()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: "false", wordBoundaryEnabled: "false" }, outputFormat: FORMAT } } } }));
      ws.send(`X-RequestId:${uid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${stamp()}Z\r\nPath:ssml\r\n\r\n` + ssml(text, voice));
    });
    ws.on("message", (data, isBinary) => {
      if (isBinary) {
        const n = data.readUInt16BE(0), head = data.slice(2, 2 + n).toString();
        if (head.includes("Path:audio")) chunks.push(data.slice(2 + n));
      } else if (String(data).includes("Path:turn.end")) end(chunks.length ? null : new Error("edge empty"));
    });
    ws.on("error", e => end(e));
    ws.on("unexpected-response", (req, res) => end(new Error("edge http " + res.statusCode)));
    ws.on("close", () => end(chunks.length ? null : new Error("edge closed")));
  });
}

exports.main = async (event) => {
  try {
    const text = String(event && event.text || "").replace(/́/g, "").replace(/[«»—]/g, " ").replace(/\s+/g, " ").trim().slice(0, 400);
    const v = event && +event.voice === 1 ? 1 : 0;
    if (!text || !/[А-Яа-яЁё]/.test(text)) return { ok: false, msg: "no russian text" };
    const key = crypto.createHash("sha1").update(v + "|" + text).digest("hex");
    await ensure();
    const hit = await db.collection(CACHE).doc(key).get().catch(() => null);
    if (hit && hit.data && hit.data[0] && hit.data[0].a) {
      db.collection(CACHE).doc(key).update({ n: db.command.inc(1), last: Date.now() }).catch(() => {});
      return { ok: true, a: hit.data[0].a, cached: true };
    }
    const useAzure = process.env.AZURE_TTS_KEY && process.env.AZURE_TTS_REGION;
    let mp3;
    try { mp3 = useAzure ? await azure(text, VOICES[v]) : await edge(text, VOICES[v]); }
    catch (e) { if (useAzure) throw e; mp3 = await edge(text, VOICES[v]); }      // one retry
    const a = mp3.toString("base64");
    await db.collection(CACHE).doc(key).set({ t: text, v, a, n: 1, created: Date.now(), last: Date.now() }).catch(() => {});
    return { ok: true, a };
  } catch (e) {
    return { ok: false, msg: String(e && e.message || e) };
  }
};

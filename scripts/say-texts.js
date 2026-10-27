// Collect every Russian text the app can read aloud → [[voice, text], ...] (for pre-recording the audio).
// Usage: node scripts/say-texts.js > texts.json      (keep the rules in sync with app.js / exam.js)
const fs = require("fs"), path = require("path");
const R = p => JSON.parse(fs.readFileSync(path.join(__dirname, "..", p), "utf8"));
const CYR = /[А-ЯЁа-яё́]+(?:[ \-][А-ЯЁа-яё́]+)*[?!]?/g;
const norm = s => String(s).replace(/́/g, "").replace(/[«»—]/g, " ").replace(/\s+/g, " ").trim();
const out = new Map();
const add = (v, s) => { const t = norm(s); if (t && /[А-Яа-яЁё]/.test(t) && t.length <= 400) out.set(v + "|" + t, [v, t]); };
const strings = (x, acc = []) => { if (typeof x === "string") acc.push(x); else if (Array.isArray(x)) x.forEach(i => strings(i, acc)); else if (x && typeof x === "object") Object.values(x).forEach(i => strings(i, acc)); return acc; };
const only = process.argv[2] || "all";
const LV = ["A1", "A2", "B1", "B2", "C1", "C2"];

if (only === "all" || only === "base") {
  // alphabet (app.js)
  const src = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const al = src.slice(src.indexOf("const ALPHABET = ["), src.indexOf("];", src.indexOf("const ALPHABET = [")) + 2);
  eval(al.replace("const ALPHABET", "global.ALPHABET"));
  ALPHABET.forEach(([, name, ex]) => { add(0, name); add(0, ex); });
  for (const lv of LV) {
    const c = R(`data/content_${lv}.json`);
    c.dialogues.forEach(d => d.lines.forEach(([who, ru]) => add(who === "B" ? 1 : 0, ru)));
    c.listening.forEach(l => { l.text.forEach(([ru]) => add(0, ru)); });
    c.news.forEach(n => n.sentences.forEach(([ru]) => add(0, ru)));
    // grammar pages: example lines + every Russian fragment in the text
    const g = R(`data/grammar_${lv}.json`);
    strings(g).forEach(s => { (s.match(CYR) || []).forEach(m => add(0, m)); if (/^[^一-鿿]*$/.test(s)) add(0, s); });
  }
  const t = R("data/trki_b2.json");
  t.sections.forEach(sec => (sec.texts || []).forEach(x => {
    (x.lines || []).forEach(([who, l]) => add(who === "A" ? 0 : 1, l));
    (x.replies || []).forEach(r => add(1, r));
  }));
}
if (only === "all" || only === "words") {
  for (const lv of LV) R(`data/words_${lv}.json`).forEach(r => add(0, r[0]));
}
if (only === "all" || only === "words") {
  // word panel: common collocations (f.ex) and aspect pairs (f.pa); the full form tables are too many to pre-record
  for (const f of fs.readdirSync(path.join(__dirname, "..", "data/gram"))) {
    R("data/gram/" + f).forEach(x => { if (!x) return;
      if (x.ex) x.ex.split(/\s*;\s*/).forEach(p => add(0, p.split(/\s*=\s*/)[0]));
      if (x.pa) x.pa.split(/\s*,\s*/).forEach(p => add(0, p));
    });
  }
}
process.stdout.write(JSON.stringify([...out.values()]));

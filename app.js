"use strict";
/* ========== 俄语阶梯 — single-page app ========== */

const LEVELS = {
  A1: { title: "入门级", desc: "问候、自我介绍、购物问路等最基本的交际", total: 1000 },
  A2: { title: "基础级", desc: "日常生活场景：看病、出行、住宿、天气", total: 2000 },
  B1: { title: "中级（ТРКИ-1）", desc: "工作、租房、旅行，能读懂简单新闻", total: 5000 },
  B2: { title: "中高级（ТРКИ-2）", desc: "讨论观点、处理事务，读懂一般报刊", total: 10000 },
  C1: { title: "高级（ТРКИ-3）", desc: "谈判、辩论、专业话题和复杂新闻", total: 15000 },
  C2: { title: "精通级（ТРКИ-4）", desc: "学术、法律、文学等接近母语的语言水平", total: 19815 },
};
const ORDER = Object.keys(LEVELS);
const POS = { n: "名词", v: "动词", adj: "形容词/代词", x: "其他" };
const ALPHABET = [
  ["А","а","арбуз"],["Б","бэ","банан"],["В","вэ","вода"],["Г","гэ","город"],["Д","дэ","дом"],["Е","е","ель"],
  ["Ё","ё","ёлка"],["Ж","жэ","жук"],["З","зэ","зима"],["И","и","игра"],["Й","и краткое","йогурт"],["К","ка","кот"],
  ["Л","эль","лампа"],["М","эм","мама"],["Н","эн","нос"],["О","о","окно"],["П","пэ","папа"],["Р","эр","рыба"],
  ["С","эс","сок"],["Т","тэ","торт"],["У","у","утро"],["Ф","эф","флаг"],["Х","ха","хлеб"],["Ц","цэ","цирк"],
  ["Ч","че","чай"],["Ш","ша","школа"],["Щ","ща","щука"],["Ъ","твёрдый знак","подъезд"],["Ы","ы","сыр"],
  ["Ь","мягкий знак","соль"],["Э","э","эхо"],["Ю","ю","юбка"],["Я","я","яблоко"],
];

/* ---------- storage (best effort) ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- speech ---------- */
const synth = window.speechSynthesis;
let ruVoices = [];
let rate = store.get("rate", 1);
let playToken = 0;

function loadVoices() {
  if (!synth) return;
  const all = synth.getVoices();
  ruVoices = all.filter(v => /^ru(-|_|$)/i.test(v.lang));
  // prefer higher-quality voices first
  ruVoices.sort((a, b) => score(b) - score(a));
  const warn = document.getElementById("voice-warning");
  if (all.length && !ruVoices.length) {
    warn.hidden = false;
    warn.textContent = "你的浏览器/系统里没有找到俄语语音，所以无法朗读。电脑上可用 Chrome 或 Edge；手机上请在系统设置里下载俄语（Русский）语音包后刷新页面。";
  } else warn.hidden = true;
}
function score(v) { return (/google|natural|neural|premium|enhanced|milena|yuri|katya|svetlana|dmitry/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1); }
if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
else {
  const warn = document.getElementById("voice-warning");
  warn.hidden = false; warn.textContent = "当前浏览器不支持语音朗读（Web Speech API）。请换用 Chrome、Edge 或 Safari。";
}

const clean = s => s.replace(/́/g, "").replace(/[«»—]/g, " ");

function speak(text, { voice = 0, rate: r = rate } = {}) {
  return new Promise(resolve => {
    if (!synth) return resolve();
    const u = new SpeechSynthesisUtterance(clean(text));
    u.lang = "ru-RU";
    u.rate = r;
    if (ruVoices.length) u.voice = ruVoices[voice % ruVoices.length];
    // with one voice only, shift pitch so two speakers sound different
    if (voice === 1 && ruVoices.length < 2) u.pitch = 0.7;
    u.onend = u.onerror = () => resolve();
    synth.speak(u);
  });
}
function stopAll() { playToken++; if (synth) synth.cancel(); document.querySelectorAll(".playing").forEach(e => e.classList.remove("playing")); }

async function playSequence(items) { // items: [{el, text, voice}]
  stopAll();
  const token = playToken;
  for (const it of items) {
    if (token !== playToken) return;
    it.el && it.el.classList.add("playing");
    it.el && it.el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    await speak(it.text, { voice: it.voice || 0 });
    it.el && it.el.classList.remove("playing");
    if (token === playToken && it.after) it.after();
    if (token !== playToken) return;
    await new Promise(r => setTimeout(r, 250 / rate));
  }
  return token === playToken;
}
async function playOne(el, text, voice = 0) {
  stopAll();
  el.classList.add("playing");
  await speak(text, { voice });
  el.classList.remove("playing");
}

/* speed buttons */
function syncRate() {
  document.querySelectorAll("[data-rate]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.rate === rate)));
}
function setRate(r) { rate = r; store.set("rate", rate); syncRate(); }
document.querySelectorAll(".speed button").forEach(b => b.addEventListener("click", () => setRate(+b.dataset.rate)));
syncRate();

/* ---------- data ---------- */
const cache = {};
async function getJSON(path) {
  if (!cache[path]) cache[path] = fetch(path).then(r => { if (!r.ok) throw new Error(path); return r.json(); });
  return cache[path];
}

/* ---------- helpers ---------- */
const app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const SPEAKER = '<svg class="speaker" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';


/* ---------- home ---------- */
function renderHome() {
  document.title = "俄语阶梯 · Русский шаг за шагом";
  app.innerHTML = "";
  const hero = h(`<section class="hero">
    <h1 class="ru">Русский<br>шаг за шагом</h1>
    <p class="lead">一步一个台阶学俄语。从 A1 到 C2，每个等级都有完整词汇表、情景对话、听力练习和逐句中文翻译的近期新闻，所有俄语都可以点击朗读。</p>
    <div class="alphabet" aria-label="俄语字母表"></div>
    <p class="hint">先从字母开始：点一个字母，听它的名称和一个例词。</p>
  </section>`);
  const grid = hero.querySelector(".alphabet");
  ALPHABET.forEach(([L, name, ex]) => {
    const b = h(`<button class="ru" title="${esc(L + L.toLowerCase())} — ${esc(ex)}" aria-label="字母 ${esc(L)}，例词 ${esc(ex)}">${esc(L)}${esc(L.toLowerCase())}</button>`);
    b.onclick = () => playSequence([{ el: b, text: name }, { el: b, text: ex }]);
    grid.append(b);
  });
  app.append(hero);
  const ladder = h(`<nav class="ladder" aria-label="选择等级"></nav>`);
  ORDER.forEach(lv => {
    const L = LEVELS[lv];
    ladder.append(h(`<a href="#/${lv}"><span class="lv">${lv}</span>
      <span><span class="lv-title">${L.title}</span><br><span class="lv-desc">${L.desc}</span></span>
      <span class="lv-count">${L.total.toLocaleString("zh-CN")}<small>累计词汇</small></span></a>`));
  });
  app.append(ladder);
}

/* ---------- level ---------- */
const TABS = [["words", "单词"], ["grammar", "语法"], ["dialogues", "对话"], ["listening", "听力"], ["news", "新闻"]];
function renderLevel(lv, tab) {
  if (!TABS.some(t => t[0] === tab)) tab = "words";
  const L = LEVELS[lv];
  document.title = `${lv} ${L.title} · 俄语阶梯`;
  app.innerHTML = "";
  app.append(h(`<nav class="lv-pills" aria-label="等级">${ORDER.map(x => `<a href="#/${x}/${tab}" ${x === lv ? 'aria-current="page"' : ""}>${x}</a>`).join("")}</nav>`));
  app.append(h(`<div class="level-head"><h1>${lv}</h1><div><strong>${L.title}</strong><p>${L.desc}</p></div>
    <div class="speed" role="group" aria-label="朗读速度"><button data-rate="0.7">慢速</button><button data-rate="1">正常</button><button data-rate="1.4">倍速</button></div></div>`));
  app.querySelectorAll(".level-head .speed button").forEach(b => b.onclick = () => setRate(+b.dataset.rate));
  syncRate();
  Pet.state.lastLevel = lv; Pet.state.lastPlace = { lv, tab, name: (TABS.find(t => t[0] === tab) || TABS[0])[1] }; Pet.save();
  const tabs = h(`<div class="tabs" role="tablist"></div>`);
  TABS.forEach(([id, name]) => {
    const b = h(`<button role="tab" aria-selected="${id === tab}">${name}</button>`);
    b.onclick = () => { location.hash = `#/${lv}/${id}`; };
    tabs.append(b);
  });
  app.append(tabs);
  const panel = h(`<section role="tabpanel"><p class="empty">加载中…</p></section>`);
  app.append(panel);
  const fn = { words: renderWords, grammar: renderGrammar, dialogues: renderDialogues, listening: renderListening, news: renderNews }[tab];
  fn(lv, panel).catch(e => { panel.innerHTML = `<p class="empty">内容加载失败，请刷新页面重试。（${esc(e.message)}）</p>`; });
}

/* ---------- words ---------- */
const PAGE = 120;
async function renderWords(lv, panel) {
  const rows = await getJSON(`data/words_${lv}.json`);
  const idx = ORDER.indexOf(lv);
  const start = idx === 0 ? 1 : LEVELS[ORDER[idx - 1]].total + 1;
  panel.innerHTML = "";
  const tools = h(`<div class="word-tools">
    <input type="search" placeholder="搜索俄语或中文…" aria-label="搜索单词">
    <select aria-label="词性"><option value="">全部词性</option>${Object.entries(POS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
  </div>`);
  const meta = h(`<p class="word-meta"></p>`);
  const list = h(`<ul class="words"></ul>`);
  const pager = h(`<div class="pager"></div>`);
  panel.append(tools, meta, list, pager);
  const [input, sel] = tools.querySelectorAll("input,select");
  let page = 0, filtered = rows.map((r, i) => [r, i]);

  const norm = s => s.toLowerCase().replace(/́/g, "").replace(/ё/g, "е");
  function apply() {
    const q = norm(input.value.trim()), p = sel.value;
    filtered = rows.map((r, i) => [r, i]).filter(([r]) => (!p || r[2] === p) && (!q || norm(r[0]).includes(q) || r[1].includes(q) || r[4].toLowerCase().includes(q)));
    page = 0; draw();
  }
  function draw() {
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
    meta.textContent = `本级新增 ${rows.length.toLocaleString("zh-CN")} 词（按词频第 ${start.toLocaleString("zh-CN")}–${(start + rows.length - 1).toLocaleString("zh-CN")} 位）。点击单词听发音，重音用 ́ 标出。` +
      (filtered.length !== rows.length ? ` 找到 ${filtered.length} 个。` : "");
    list.innerHTML = "";
    filtered.slice(page * PAGE, (page + 1) * PAGE).forEach(([r, i]) => {
      const [w, z, p, g] = r;
      const li = h(`<li class="wcard"><button class="word" title="${esc(r[4])}">${SPEAKER}<span><span class="w ru" lang="ru">${esc(w)}</span><span class="z">${esc(z)}</span><span class="p">#${start + i} · ${POS[p] || ""}${g ? "（" + esc(g) + (p === "n" && "阳阴中通".includes(g) ? "性" : "") + "）" : ""}</span></span></button></li>`);
      const btn = li.firstElementChild;
      btn.onclick = () => { playOne(btn, w); Pet.heardWord(lv, i); };
      const gb = h(`<button class="gbtn" aria-label="${esc(w)} 的语法信息">语法</button>`);
      gb.onclick = () => openWord(lv, i, r);
      li.append(gb);
      list.append(li);
    });
    if (!filtered.length) list.append(h(`<li class="empty">没有找到匹配的单词。换个关键词试试。</li>`));
    pager.innerHTML = "";
    if (pages > 1) {
      const prev = h(`<button ${page ? "" : "disabled"}>上一页</button>`), next = h(`<button ${page < pages - 1 ? "" : "disabled"}>下一页</button>`);
      const info = h(`<span>第 ${page + 1} / ${pages} 页</span>`);
      prev.onclick = () => { page--; draw(); list.scrollIntoView(); };
      next.onclick = () => { page++; draw(); list.scrollIntoView(); };
      const play = h(`<button>朗读本页</button>`);
      play.onclick = () => playSequence(filtered.slice(page * PAGE, (page + 1) * PAGE).map(([r, i]) => ({ el: null, text: r[0], idx: i })).map((it, k) => ({ el: list.querySelectorAll(".word")[k], text: it.text, after: () => Pet.heardWord(lv, it.idx) })));
      pager.append(prev, info, next, play);
    }
  }
  let t; input.oninput = () => { clearTimeout(t); t = setTimeout(apply, 200); };
  sel.onchange = apply;
  draw();
}

/* ---------- shared: reading block with lines ---------- */
function linesBlock(cls, title, sub, lines, opts = {}) {
  const block = h(`<article class="block ${cls}"><h2 lang="ru">${esc(title)}</h2><p class="sub">${esc(sub)}</p><div class="controls"></div><ol class="lines"></ol></article>`);
  const ol = block.querySelector(".lines");
  const items = lines.map(l => {
    const li = h(`<li class="line${l.who ? "" : " solo"}">${l.who ? `<span class="who ${l.who === "B" ? "b" : ""}" aria-hidden="true">${l.who === "A" ? "А" : "Б"}</span>` : ""}<span class="ru" lang="ru">${esc(l.ru)}</span><span class="zh">${esc(l.zh)}</span></li>`);
    const voice = l.who === "B" ? 1 : 0;
    li.onclick = () => playOne(li, l.ru, voice);
    if (opts.speak) {
      const mic = h(`<button class="mic" aria-label="跟读这一句">${MIC}</button>`);
      mic.onclick = e => { e.stopPropagation(); shadowLine(mic, li, l.ru, cls + "|" + title + "|" + lines.indexOf(l)); };
      li.append(mic);
    }
    ol.append(li);
    return { el: li, text: l.ru, voice };
  });
  const c = block.querySelector(".controls");
  const play = h(`<button class="btn">▶ 播放全部</button>`);
  play.onclick = async () => {
    Pet.talk(cls === "news" ? "一起听新闻～" : "我也在听哦");
    const done = await playSequence(items);
    if (done && opts.reward) Pet.reward(opts.reward);
  };
  const stop = h(`<button class="btn ghost">停止</button>`);
  stop.onclick = stopAll;
  const zh = h(`<button class="btn ghost" aria-pressed="true">隐藏中文</button>`);
  zh.onclick = () => { const on = block.classList.toggle("hide-zh"); zh.textContent = on ? "显示中文" : "隐藏中文"; };
  c.append(play, stop, zh);
  if (opts.speeds) {
    const g = h(`<span class="speed inline" role="group" aria-label="朗读速度"><button data-rate="0.7">慢速 0.7×</button><button data-rate="1">正常 1×</button><button data-rate="1.4">倍速 1.4×</button></span>`);
    g.querySelectorAll("button").forEach(b => b.onclick = () => setRate(+b.dataset.rate));
    c.append(g);
  }
  if (opts.read) {
    const rd = h(`<button class="btn ghost readdone">读完了 ✓</button>`);
    rd.onclick = () => { if (!Pet.once("read:" + title, "read")) Pet.toast("这篇已经领过阅读奖励啦"); rd.disabled = true; rd.textContent = "已读完"; };
    block.append(rd);
  }
  if (opts.hideRu) {
    block.classList.add("hide-ru", "hide-zh");
    zh.textContent = "显示中文";
    const ru = h(`<button class="btn ghost">显示原文</button>`);
    ru.onclick = () => { const on = block.classList.toggle("hide-ru"); ru.textContent = on ? "显示原文" : "隐藏原文"; };
    c.append(ru);
  }
  return block;
}

/* ---------- speaking practice: shadow a line ---------- */
const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3"/></svg>';
const normRu = s => s.toLowerCase().replace(/\u0301/g, "").replace(/ё/g, "е").replace(/[^а-яa-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
function scoreSpeech(target, heard) {
  const t = normRu(target), hset = new Set(normRu(heard));
  if (!t.length) return 0;
  return Math.round(t.filter(w => hset.has(w)).length / t.length * 100);
}
function shadowLine(btn, li, ru, key, onScore) {
  stopAll();
  let fb = li.querySelector(".say-fb");
  if (!fb) { fb = h(`<div class="say-fb" aria-live="polite"></div>`); li.append(fb); }
  fb.onclick = e => e.stopPropagation();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const good = score => {
    if (onScore) onScore(score);
    const r = Pet.scored("speak:" + key, score);
    if (r === 0) Pet.talk("这句今天已经拿过这个分数的奖励啦，换一句试试");
  };
  if (SR) {
    const r = new SR();
    r.lang = "ru-RU"; r.interimResults = false; r.maxAlternatives = 3;
    btn.classList.add("rec"); fb.textContent = "请跟读…";
    r.onresult = e => {
      const alts = [...e.results[0]].map(a => a.transcript);
      const best = alts.map(a => [a, scoreSpeech(ru, a)]).sort((a, b) => b[1] - a[1])[0];
      const sc = best[1];
      fb.innerHTML = `识别到：<span lang="ru">${esc(best[0])}</span> · <b class="score s${sc >= 90 ? 3 : sc >= 75 ? 2 : sc >= 60 ? 1 : 0}">${sc} 分</b> ${sc >= 90 ? "完美！+3 猫粮" : sc >= 75 ? "很棒！+2 猫粮" : sc >= 60 ? "不错 +1 猫粮，冲 90 分拿更多" : "再试一次？60 分以上有猫粮"}`;
      if (sc >= 60) good(sc); else { Pet.talk("慢一点，再读一遍～"); if (onScore) onScore(sc); if (Pet.state.settings.meow) meowFor("wrong"); }
    };
    r.onerror = e => { fb.textContent = e.error === "not-allowed" ? "没有麦克风权限，请在浏览器设置里允许" : "没听清，再试一次"; };
    r.onend = () => btn.classList.remove("rec");
    try { r.start(); } catch { btn.classList.remove("rec"); }
    return;
  }
  if (!navigator.mediaDevices || !window.MediaRecorder) { fb.textContent = "这个浏览器不支持录音，换 Chrome 或 Safari 试试"; return; }
  if (btn._rec) { btn._rec.stop(); return; }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const rec = new MediaRecorder(stream), chunks = [];
    btn._rec = rec; btn.classList.add("rec"); fb.textContent = "录音中…读完再点一次麦克风";
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach(t => t.stop()); btn._rec = null; btn.classList.remove("rec");
      const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
      fb.innerHTML = `<audio controls src="${url}"></audio><span>和原音比一比，给自己打分：</span><button class="btn small" data-s="92">很像</button><button class="btn small" data-s="78">还行</button><button class="btn small ghost" data-again>再录一次</button>`;
      fb.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { good(+b.dataset.s); fb.querySelectorAll("[data-s]").forEach(x => x.disabled = true); });
      fb.querySelector("[data-again]").onclick = () => shadowLine(btn, li, ru, key);
    };
    rec.start();
    setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 15000);
  }).catch(() => { fb.textContent = "没有麦克风权限，请在浏览器设置里允许"; });
}

async function renderDialogues(lv, panel) {
  const d = await getJSON(`data/content_${lv}.json`);
  panel.innerHTML = `<p class="sub">两种声音分别朗读 А、Б 两个角色。点击任意一句可单独播放。</p>`;
  d.dialogues.forEach(dl => panel.append(linesBlock("dialogue", dl.title, dl.titleZh, dl.lines.map(([who, ru, zh]) => ({ who, ru, zh })), { reward: "listen", speak: true })));
}

async function renderListening(lv, panel) {
  const d = await getJSON(`data/content_${lv}.json`);
  panel.innerHTML = `<p class="sub">先只听不看：点“播放全部”，然后回答问题。听完可以显示原文和翻译核对。</p>`;
  d.listening.forEach(ex => {
    const block = linesBlock("listen", ex.title, ex.titleZh, ex.text.map(([ru, zh]) => ({ ru, zh })), { hideRu: true, reward: "listen" });
    const quiz = h(`<ol class="quiz"></ol>`);
    let right = 0, done = 0;
    const score = h(`<p class="score" aria-live="polite"></p>`);
    ex.questions.forEach(q => {
      const li = h(`<li><div class="q" lang="ru">${esc(q.q)}</div><div class="qz">${esc(q.qz)}</div><div class="opts"></div></li>`);
      const box = li.querySelector(".opts");
      // shuffle option order each time so the right answer isn't always in the same spot
      const order = q.options.map((_, i) => i);
      for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
      order.forEach(i => {
        const o = q.options[i];
        const b = h(`<button lang="ru">${esc(o)}</button>`);
        b.dataset.ok = i === q.answer ? 1 : "";
        b.onclick = () => {
          if (box.dataset.done) return;
          box.dataset.done = 1; done++;
          b.classList.add(i === q.answer ? "right" : "wrong");
          box.querySelector("[data-ok='1']").classList.add("right");
          if (i === q.answer) { right++; Pet.reward("correct"); } else Pet.wrong();
          if (done === ex.questions.length) score.textContent = `答对 ${right} / ${ex.questions.length} 题`;
        };
        box.append(b);
      });
      quiz.append(li);
    });
    block.append(quiz, score);
    panel.append(block);
  });
}

async function renderNews(lv, panel) {
  const d = await getJSON(`data/content_${lv}.json`);
  panel.innerHTML = `<p class="sub">根据最近的真实新闻按 ${lv} 难度改写，逐句配中文翻译。用页面顶部的“慢速 / 正常 / 倍速”或每篇新闻里的速度按钮切换朗读速度。</p>`;
  d.news.forEach(n => {
    const block = linesBlock("news", n.title, `${n.titleZh} · ${n.date}`, n.sentences.map(([ru, zh]) => ({ ru, zh })), { speeds: true, reward: "news", speak: true, read: true });
    block.append(h(`<p class="source">信息来源：<a href="${esc(n.source[1])}" target="_blank" rel="noopener">${esc(n.source[0])}</a>（本站改写，非原文）</p>`));
    panel.append(block);
  });
  syncRate();
}

/* ---------- inline Russian: wrap Cyrillic runs so they can be tapped to hear ---------- */
const CYR = /[А-ЯЁа-яё́]+(?:[ \-][А-ЯЁа-яё́]+)*[?!]?/g;
function rich(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(CYR, m => `<span class="say" lang="ru">${m}</span>`);
}
// one delegated listener: any .say anywhere speaks itself
document.addEventListener("click", e => {
  const el = e.target.closest(".say");
  if (!el) return;
  e.stopPropagation();
  playOne(el, el.dataset.say || el.textContent.split(/[,/]/)[0]);
});

/* ---------- word grammar panel ---------- */
const CASES = [
  ["一格", "主格", "Именительный", "кто? что?"],
  ["二格", "属格", "Родительный", "кого? чего?"],
  ["三格", "与格", "Дательный", "кому? чему?"],
  ["四格", "宾格", "Винительный", "кого? что?"],
  ["五格", "工具格", "Творительный", "кем? чем?"],
  ["六格", "前置格", "Предложный", "о ком? о чём?"],
];
const GOV = {
  A: ["кого́? что?", "四格"], Aa: ["кого́?", "四格"], Ai: ["что?", "四格"],
  G: ["кого́? чего́?", "二格"], Gi: ["чего́?", "二格"], Ga: ["кого́?", "二格"],
  D: ["кому́? чему́?", "三格"], Da: ["кому́?", "三格"], Di: ["чему́?", "三格"],
  I: ["кем? чем?", "五格"], Ia: ["кем?", "五格"], Ii: ["чем?", "五格"],
  P: ["ком? чём?", "六格"], Pi: ["чём?", "六格"], Pa: ["ком?", "六格"],
  N: ["кто? что?", "一格"],
  inf: ["+ 不定式", ""], "что": ["+ что…", "从句"], "чтобы": ["+ чтобы…", "从句"], "ли": ["+ ли…", "从句"],
  "как": ["+ как…", "从句"], "где": ["+ где / куда…", "从句"],
};
const PREPQ = { A: "кого́/что", Aa: "кого́", Ai: "что", G: "кого́/чего́", Gi: "чего́", Ga: "кого́", D: "кому́/чему́", Da: "кому́", Di: "чему́", I: "кем/чем", Ia: "кем", Ii: "чем", P: "ком/чём", Pi: "чём", Pa: "ком" };
function govToken(t) {
  if (t.includes("/") && t.includes("+")) return t.split("/").map(govToken).join(" / ");
  const m = t.match(/^([а-яё\u0301\-]+)\+(\w+)$/i);
  if (m) {
    const c = GOV[m[2]];
    return `<span class="gv"><span class="say" lang="ru">${esc(m[1])} ${esc(PREPQ[m[2]] || m[2])}</span>${c && c[1] ? `<em>${c[1]}</em>` : ""}</span>`;
  }
  const c = GOV[t];
  if (!c) return `<span class="gv">${rich(t)}</span>`;
  return `<span class="gv">${/[а-яё]/i.test(c[0]) ? `<span class="say" lang="ru">${esc(c[0])}</span>` : esc(c[0])}${c[1] ? `<em>${c[1]}</em>` : ""}</span>`;
}
function govHTML(gov) {
  return gov.split(/\s*;\s*/).filter(Boolean).map(fr => `<li>${fr.split(/\s+/).map(govToken).join(" ")}</li>`).join("");
}
const cell = v => v ? v.split(/,\s*/).map(x => `<span class="say" lang="ru">${esc(x)}</span>`).join(" / ") : "—";

let wd;
function wordDialog() {
  if (wd) return wd;
  wd = h(`<dialog class="wd" aria-label="单词语法"><div class="wd-in"></div></dialog>`);
  wd.addEventListener("click", e => { if (e.target === wd) wd.close(); });
  wd.addEventListener("close", stopAll);
  document.body.append(wd);
  return wd;
}
async function openWord(lv, i, r) {
  const d = wordDialog(), box = d.querySelector(".wd-in");
  const [w, z, p, g, en] = r;
  box.innerHTML = `<header class="wd-head"><div><button class="wd-word say ru" lang="ru">${esc(w)}</button>
    <p class="wd-zh">${esc(z)}</p><p class="wd-pos">${POS[p] || ""}${g ? " · " + esc(g) + (p === "n" && "阳阴中通".includes(g) ? "性" : "") : ""} · <span class="en">${esc(en)}</span></p></div>
    <button class="wd-x" aria-label="关闭">×</button></header><div class="wd-body"><p class="empty">加载中…</p></div>`;
  box.querySelector(".wd-x").onclick = () => d.close();
  if (!d.open) d.showModal();
  let info;
  try { info = (await getJSON(`data/gram/${lv}_${Math.floor(i / 500)}.json`))[i % 500] || {}; }
  catch { box.querySelector(".wd-body").innerHTML = `<p class="empty">加载失败，请稍后再试。</p>`; return; }
  box.querySelector(".wd-body").innerHTML = wordBody(info, p, w);
}
function wordBody(f, p, w) {
  let o = "";
  if (f.gov === "—") { if (f.t === "v") o += `<section><h3>接格 · 支配关系</h3><p class="wd-sub">不及物：不直接带宾语。</p></section>`; }
  else if (f.gov) o += `<section><h3>接格 · 支配关系</h3><ul class="govs">${govHTML(f.gov)}</ul></section>`;
  if (f.ex) o += `<section><h3>常用搭配</h3><ul class="exs">${f.ex.split(/\s*;\s*/).map(x => { const [ru, zh] = x.split(/\s*=\s*/); return `<li><span class="say" lang="ru">${esc(ru)}</span>${zh ? `<span class="zh">${esc(zh)}</span>` : ""}</li>`; }).join("")}</ul></section>`;
  if (f.note) o += `<p class="wd-note">${rich(f.note)}</p>`;
  if (f.t === "n") {
    const notes = [];
    if (f.an) notes.push("动物名词：复数四格（阳性单数四格也是）= 二格");
    else notes.push("非动物名词：四格同一格（阳性、中性、复数）");
    if (f.ind) notes.push("不变格：所有格形式都一样");
    if (f.sg) notes.push("只用单数");
    if (f.pl) notes.push("只用复数");
    const cols = f.sg ? [0] : f.pl ? [1] : [0, 1];
    o += `<section><h3>变格</h3><p class="wd-sub">${notes.join("；")}。点击任意形式听发音。</p><div class="tw"><table class="ft"><thead><tr><th>格</th>${cols.map(c => `<th>${c ? "复数" : "单数"}</th>`).join("")}</tr></thead><tbody>` +
      CASES.map((c, k) => `<tr><th><b>${c[0]}</b> ${c[1]}<small class="ru">${f.an && k === 0 ? "кто?" : !f.an && k === 0 ? "что?" : c[3]}</small></th>${cols.map(n => `<td>${cell(f.f[n][k])}</td>`).join("")}</tr>`).join("") + `</tbody></table></div></section>`;
  } else if (f.t === "v") {
    const pf = f.asp === "pf";
    o = `<p class="wd-asp"><b>${pf ? "完成体" : "未完成体"}</b>${f.pa ? ` · 对应${pf ? "未完成体" : "完成体"}：${f.pa.split(/\s*,\s*/).map(x => `<span class="say" lang="ru">${esc(x)}</span>`).join("、")}` : ""}</p>` + o;
    const P = ["я", "ты", "он / она", "мы", "вы", "они"];
    const title = f.fut ? "将来时" : pf ? "简单将来时（完成体没有现在时）" : "现在时";
    o += `<section><h3>${title}</h3><div class="tw"><table class="ft"><tbody>${P.map((x, k) => `<tr><th class="ru">${x}</th><td>${cell(f.pr[k])}</td></tr>`).join("")}</tbody></table></div>`;
    if (!pf && !f.fut) o += `<p class="wd-sub">复合将来时：<span class="say" lang="ru">бу́ду ${esc(w)}</span>、<span class="say" lang="ru">бу́дешь ${esc(w)}</span>…（быть 的将来时 + 不定式）</p>`;
    o += `</section><section><h3>过去时</h3><div class="tw"><table class="ft"><tbody>${["он", "она", "оно", "они"].map((x, k) => `<tr><th class="ru">${x}</th><td>${cell(f.pa_[k])}</td></tr>`).join("")}</tbody></table></div></section>`;
    if (f.im && (f.im[0] || f.im[1])) o += `<section><h3>命令式</h3><div class="tw"><table class="ft"><tbody><tr><th>对 ты</th><td>${cell(f.im[0])}</td></tr><tr><th>对 вы</th><td>${cell(f.im[1])}</td></tr></tbody></table></div></section>`;
  } else if (f.t === "a") {
    const G = [["阳性", 0], ["中性", 2], ["阴性", 1], ["复数", 3]];
    o += `<section><h3>长尾形式变格</h3><p class="wd-sub">四格有两个形式时：前者用于非动物名词，后者用于动物名词。</p><div class="tw"><table class="ft wide"><thead><tr><th>格</th>${G.map(x => `<th>${x[0]}</th>`).join("")}</tr></thead><tbody>` +
      CASES.map((c, k) => `<tr><th><b>${c[0]}</b> ${c[1]}</th>${G.map(x => `<td>${cell(f.f[x[1]][k])}</td>`).join("")}</tr>`).join("") + `</tbody></table></div></section>`;
    if (f.sh) o += `<section><h3>短尾形式</h3><div class="tw"><table class="ft"><tbody>${["阳性", "阴性", "中性", "复数"].map((x, k) => `<tr><th>${x}</th><td>${cell(f.sh[k])}</td></tr>`).join("")}</tbody></table></div><p class="wd-sub">短尾只作谓语：<span class="say" lang="ru">Он ${esc((f.sh[0] || "").split(",")[0])}.</span></p></section>`;
    if (f.cmp || f.sup) o += `<section><h3>比较级 · 最高级</h3><div class="tw"><table class="ft"><tbody>${f.cmp ? `<tr><th>比较级</th><td>${cell(f.cmp)}</td></tr>` : ""}${f.sup ? `<tr><th>最高级</th><td>${cell(f.sup)}</td></tr>` : ""}</tbody></table></div></section>`;
  }
  if (!o) o = `<p class="empty">这个词不变化（副词、连接词、语气词等），没有变格或变位。</p>`;
  return o;
}

/* ---------- grammar tab ---------- */
async function renderGrammar(lv, panel) {
  let d;
  try { d = await getJSON(`data/grammar_${lv}.json`); }
  catch { panel.innerHTML = `<p class="empty">${lv} 的语法页面正在编写中，很快上线。可以先看 A1 的语法。</p>`; return; }
  panel.innerHTML = "";
  panel.append(h(`<p class="sub">${esc(d.intro)}</p>`));
  // mind map
  const map = h(`<nav class="mindmap" aria-label="${lv} 语法思维导图"><div class="mm-root"><span>${lv}</span><small>语法</small></div><ul class="mm-groups"></ul></nav>`);
  const ul = map.querySelector(".mm-groups");
  let n = 0;
  d.groups.forEach((g, gi) => {
    const li = h(`<li class="mm-group" style="--hue:${gi}"><span class="mm-gname">${esc(g.name)}</span><ul class="mm-leaves"></ul></li>`);
    g.topics.forEach(t => {
      n++;
      const b = h(`<li><button class="mm-leaf"><span class="mm-n">${n}</span>${esc(t.title)}</button></li>`);
      b.firstElementChild.onclick = () => { const el = document.getElementById(`g-${t.id}`); el.open = true; el.scrollIntoView({ behavior: "smooth", block: "start" }); };
      li.querySelector(".mm-leaves").append(b);
    });
    ul.append(li);
  });
  panel.append(map);
  const tools = h(`<div class="controls g-tools"><button class="btn ghost">全部展开</button><button class="btn ghost">全部收起</button></div>`);
  const [openAll, closeAll] = tools.children;
  openAll.onclick = () => panel.querySelectorAll("details.topic").forEach(x => x.open = true);
  closeAll.onclick = () => panel.querySelectorAll("details.topic").forEach(x => x.open = false);
  panel.append(tools);
  n = 0;
  d.groups.forEach(g => g.topics.forEach(t => {
    n++;
    const el = h(`<details class="topic block" id="g-${t.id}"><summary><span class="mm-n">${n}</span><span class="t-title"><span class="t-zh">${esc(t.title)}</span>${t.ru ? `<span class="t-ru ru" lang="ru">${esc(t.ru)}</span>` : ""}<span class="t-brief">${esc(g.name)} · ${esc(t.brief || "")}</span></span></summary><div class="t-body"></div></details>`);
    el.querySelector(".t-body").innerHTML = t.body.map(blockHTML).join("") + `<p class="t-top"><a href="#" class="totop">↑ 回到思维导图</a></p>`;
    el.querySelector(".totop").onclick = e => { e.preventDefault(); map.scrollIntoView({ behavior: "smooth" }); };
    let tmr;
    el.addEventListener("toggle", () => {
      clearTimeout(tmr);
      if (el.open) { Pet.talk("认真看完这个专题，有奖励哦"); tmr = setTimeout(() => { if (el.open && document.body.contains(el)) Pet.topicDone(lv, t.id); }, 20000); }
    });
    panel.append(el);
  }));
}
function blockHTML(b) {
  if (b.h) return `<h3>${rich(b.h)}</h3>`;
  if (b.p) return `<p>${rich(b.p)}</p>`;
  if (b.tip) return `<p class="tip">${rich(b.tip)}</p>`;
  if (b.list) return `<ul class="g-list">${b.list.map(x => `<li>${rich(x)}</li>`).join("")}</ul>`;
  if (b.t) { const [head, ...rows] = b.t; return `<div class="tw"><table class="gt"><thead><tr>${head.map(x => `<th>${rich(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((x, i) => i ? `<td>${rich(x)}</td>` : `<th>${rich(x)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
  if (b.ex) return `<ol class="lines g-ex">${b.ex.map(([ru, zh]) => `<li class="line solo say" lang="ru" data-say="${esc(ru)}"><span class="ru">${esc(ru)}</span><span class="zh" lang="zh">${esc(zh)}</span></li>`).join("")}</ol>`;
  return "";
}

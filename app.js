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
    if (token !== playToken) return;
    await new Promise(r => setTimeout(r, 250 / rate));
  }
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

/* ---------- router ---------- */
function route() {
  stopAll();
  const [, lv, tab] = location.hash.match(/^#\/([ABC][12])?(?:\/(\w+))?/) || [];
  document.querySelectorAll(".levels-nav a").forEach(a => a.toggleAttribute("aria-current", a.getAttribute("href") === `#/${lv}`));
  if (lv && LEVELS[lv]) renderLevel(lv, tab || "words"); else renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

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
const TABS = [["words", "单词"], ["dialogues", "对话"], ["listening", "听力"], ["news", "新闻"]];
function renderLevel(lv, tab) {
  if (!TABS.some(t => t[0] === tab)) tab = "words";
  const L = LEVELS[lv];
  document.title = `${lv} ${L.title} · 俄语阶梯`;
  app.innerHTML = "";
  app.append(h(`<div class="level-head"><h1>${lv}</h1><div><strong>${L.title}</strong><p>${L.desc}</p></div></div>`));
  const tabs = h(`<div class="tabs" role="tablist"></div>`);
  TABS.forEach(([id, name]) => {
    const b = h(`<button role="tab" aria-selected="${id === tab}">${name}</button>`);
    b.onclick = () => { location.hash = `#/${lv}/${id}`; };
    tabs.append(b);
  });
  app.append(tabs);
  const panel = h(`<section role="tabpanel"><p class="empty">加载中…</p></section>`);
  app.append(panel);
  const fn = { words: renderWords, dialogues: renderDialogues, listening: renderListening, news: renderNews }[tab];
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
      const li = h(`<li><button class="word" title="${esc(r[4])}">${SPEAKER}<span><span class="w ru" lang="ru">${esc(w)}</span><span class="z">${esc(z)}</span><span class="p">#${start + i} · ${POS[p] || ""}${g ? "（" + esc(g) + (p === "n" ? "性" : "") + "）" : ""}</span></span></button></li>`);
      const btn = li.firstElementChild;
      btn.onclick = () => playOne(btn, w);
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
      play.onclick = () => playSequence([...list.querySelectorAll(".word")].map(el => ({ el, text: el.querySelector(".w").textContent })));
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
    ol.append(li);
    return { el: li, text: l.ru, voice };
  });
  const c = block.querySelector(".controls");
  const play = h(`<button class="btn">▶ 播放全部</button>`);
  play.onclick = () => playSequence(items);
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
  if (opts.hideRu) {
    block.classList.add("hide-ru", "hide-zh");
    zh.textContent = "显示中文";
    const ru = h(`<button class="btn ghost">显示原文</button>`);
    ru.onclick = () => { const on = block.classList.toggle("hide-ru"); ru.textContent = on ? "显示原文" : "隐藏原文"; };
    c.append(ru);
  }
  return block;
}

async function renderDialogues(lv, panel) {
  const d = await getJSON(`data/content_${lv}.json`);
  panel.innerHTML = `<p class="sub">两种声音分别朗读 А、Б 两个角色。点击任意一句可单独播放。</p>`;
  d.dialogues.forEach(dl => panel.append(linesBlock("dialogue", dl.title, dl.titleZh, dl.lines.map(([who, ru, zh]) => ({ who, ru, zh })))));
}

async function renderListening(lv, panel) {
  const d = await getJSON(`data/content_${lv}.json`);
  panel.innerHTML = `<p class="sub">先只听不看：点“播放全部”，然后回答问题。听完可以显示原文和翻译核对。</p>`;
  d.listening.forEach(ex => {
    const block = linesBlock("listen", ex.title, ex.titleZh, ex.text.map(([ru, zh]) => ({ ru, zh })), { hideRu: true });
    const quiz = h(`<ol class="quiz"></ol>`);
    let right = 0, done = 0;
    const score = h(`<p class="score" aria-live="polite"></p>`);
    ex.questions.forEach(q => {
      const li = h(`<li><div class="q" lang="ru">${esc(q.q)}</div><div class="qz">${esc(q.qz)}</div><div class="opts"></div></li>`);
      const box = li.querySelector(".opts");
      q.options.forEach((o, i) => {
        const b = h(`<button lang="ru">${esc(o)}</button>`);
        b.onclick = () => {
          if (box.dataset.done) return;
          box.dataset.done = 1; done++;
          b.classList.add(i === q.answer ? "right" : "wrong");
          box.children[q.answer].classList.add("right");
          if (i === q.answer) right++;
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
    const block = linesBlock("news", n.title, `${n.titleZh} · ${n.date}`, n.sentences.map(([ru, zh]) => ({ ru, zh })), { speeds: true });
    block.append(h(`<p class="source">信息来源：<a href="${esc(n.source[1])}" target="_blank" rel="noopener">${esc(n.source[0])}</a>（本站改写，非原文）</p>`));
    panel.append(block);
  });
  syncRate();
}

route();

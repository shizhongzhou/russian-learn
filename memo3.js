"use strict";
/* ========== 宠物俄语通 — 背单词 v3 ==========
   Today = new words (N a day) + words due for review (spaced repetition: 1, 2, 4, 7, 15, 30 days).
   Three views of the same words: 卡片 (card stack), 掉落 (words fall and pile up — tilt / shake the phone;
   Matter.js physics), 词云 (word cloud). Tap any word → active recall: choose, spell or say the answer.
   Right → the word pops away and the pet gets 小鱼干; wrong → it goes to the 生词本 and comes back soon. */
const SRS_DAYS = [0, 1, 2, 4, 7, 15, 30];
const DAY_MS = 864e5;
const normWord = s => String(s || "").toLowerCase().replace(/́/g, "").replace(/ё/g, "е").replace(/[^а-яa-z\- ]/g, "").trim();
const plain = s => String(s || "").replace(/́/g, "");
const zhShort = z => String(z || "").split(/[；;]/)[0].replace(/（[^）]*）|\([^)]*\)/g, "").trim();
const memoKey = x => x.lv + ":" + x.i;
const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

function srsOf(k) { const S = Pet.state; S.srs = S.srs || {}; return S.srs[k]; }
function srsGrade(x, ok) {
  const S = Pet.state; S.srs = S.srs || {}; const k = memoKey(x);
  const r = S.srs[k] || { b: 0, d: 0, n: 0 };
  r.n++;
  if (ok) { r.b = Math.min(SRS_DAYS.length - 1, r.b + 1); r.d = Date.now() + SRS_DAYS[r.b] * DAY_MS - 3600e3; }
  else { r.b = 1; r.d = Date.now() + 10 * 60e3; }
  S.srs[k] = r;
  S.memoDays = S.memoDays || {}; S.memoDays[dayKey()] = (S.memoDays[dayKey()] || 0) + 1;
  Pet.save();
}

async function memoToday(src) {
  const S = Pet.state; S.srs = S.srs || {};
  const pool = await memoPool(src);
  const now = Date.now();
  const newPerDay = S.memoNew || 20;
  const learnedToday = Object.values(S.srs).filter(r => r.first && dayKey(r.first) === dayKey()).length;
  const review = [], fresh = [];
  for (const x of pool) {
    if (!x.r || !isZh(x.r[1])) continue;
    const r = S.srs[memoKey(x)];
    if (r) { if (r.d <= now) review.push(x); }
    else if (src === "mine" || !S.mastered[memoKey(x)]) fresh.push(x);
  }
  // words answered wrong elsewhere (quiz, exams) are always due
  if (src !== "mine") for (const k of Object.keys(S.wrongWords || {})) {
    const [lv, i] = k.split(":"); const x = pool.find(p => p.lv === lv && p.i === +i);
    if (x && !review.includes(x)) review.push(x);
  }
  const nNew = Math.max(0, newPerDay - learnedToday);
  return { pool, review: review.slice(0, 60), fresh: fresh.slice(0, nNew), learnedToday, newPerDay };
}

async function pageMemo3(src) {
  const S = Pet.state;
  src = src || S.memoSrc || S.lastLevel; S.memoSrc = src; Pet.save();
  let mode = store.get("memoMode", "card"), dir = store.get("memoDir", "zh");   // zh: see Chinese, recall Russian
  const box = h(`<div class="page memo3"><div class="m3head"></div><div class="m3week"></div>
    <div class="m3modes"><div class="seg" role="tablist">${[["card", "卡片"], ["fall", "掉落"], ["cloud", "词云"]].map(([k, l]) => `<button role="tab" data-m="${k}" aria-selected="${k === mode}">${l}</button>`).join("")}</div>
      <button class="aa" id="aa" aria-label="切换提示方向">${dir === "zh" ? "中→俄" : "俄→中"}</button></div>
    <div class="m3stage"><p class="empty3">加载词库…</p></div>
    <div class="m3foot"><button class="m3voice" id="say" aria-label="朗读">${ic3("M6 9v6M10 6v12M14 8v8M18 10v4")}</button><span class="m3tip"></span><a class="m3search" href="#/dict/word" aria-label="查词">${ic3(I3.search)}</a></div></div>`);
  app.append(box);
  const stage = box.querySelector(".m3stage"), tip = box.querySelector(".m3tip");
  let T, words = [], cleanup = null;
  const prompt = x => dir === "zh" ? zhShort(x.r[1]) : plain(x.r[0]);
  function head() {
    const d = new Date(), wk = "日一二三四五六";
    const left = words.filter(w => !w.done);
    const nNew = left.filter(w => w.isNew).length, nRev = left.length - nNew;
    const name = LEVELS[src] ? `${src} 词库` : src === "mine" ? "生词本" : "主题词典";
    box.querySelector(".m3head").innerHTML = `<div class="grow"><small>${d.getMonth() + 1}月${d.getDate()}日 星期${wk[d.getDay()]} · ${esc(name)}</small>
      <h1>今天还有 <span class="pin">📍</span><b>${nNew}</b> 个新词 和<br><span class="pin">🗂️</span><b>${nRev}</b> 个词待复习</h1></div>
      <a class="back" href="#/learn" aria-label="返回">${ic3(I3.x)}</a><button class="gear" id="gear" aria-label="设置">${ic3(I3.cog)}</button>`;
    box.querySelector("#gear").onclick = settings;
    const days = S.memoDays || {}, start = new Date(d); start.setDate(d.getDate() - d.getDay());
    box.querySelector(".m3week").innerHTML = [...Array(7)].map((_, i) => { const x = new Date(start); x.setDate(start.getDate() + i); const k = dayKey(x);
      return `<div class="${k === dayKey() ? "today" : ""}"><small>${wk[i]}</small><b>${x.getDate()}</b><i>${days[k] ? "•" : ""}</i></div>`; }).join("");
  }
  function settings() {
    const sh = h(`<div class="sheet3" role="dialog" aria-modal="true" aria-label="背单词设置"><div class="in" style="position:relative"><h2>背单词设置</h2><button class="x" aria-label="关闭">✕</button>
      <b>词库</b><div class="pills wrap">${ORDER.map(x => `<button data-s="${x}" aria-pressed="${x === src}">${x}</button>`).join("")}${Object.entries(DICTS || {}).map(([k, d]) => `<button data-s="t-${k}" aria-pressed="${"t-" + k === src}">${esc(d.name)}</button>`).join("")}<button data-s="mine" aria-pressed="${src === "mine"}">生词本 ${Object.keys(S.wrongWords || {}).length}</button></div>
      <b>每天新词</b><div class="pills">${[10, 20, 30, 50].map(n => `<button data-n="${n}" aria-pressed="${(S.memoNew || 20) === n}">${n} 个</button>`).join("")}</div>
      <p class="hint">背会一个新词 +1 小鱼干；复习答对也有奖励。答错的词会进入生词本，很快再出现。</p></div></div>`);
    document.body.append(sh);
    sh.querySelector(".x").onclick = () => sh.remove();
    sh.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { sh.remove(); location.hash = `#/memo/${b.dataset.s}`; });
    sh.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { S.memoNew = +b.dataset.n; Pet.save(); sh.remove(); route(); });
  }
  box.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = b.dataset.m; store.set("memoMode", mode); box.querySelectorAll("[data-m]").forEach(x => x.setAttribute("aria-selected", x === b)); draw(); });
  box.querySelector("#aa").onclick = e => { dir = dir === "zh" ? "ru" : "zh"; store.set("memoDir", dir); e.currentTarget.textContent = dir === "zh" ? "中→俄" : "俄→中"; draw(); };
  box.querySelector("#say").onclick = () => { const w = words.find(x => !x.done); if (w) playOne(box.querySelector("#say"), w.x.r[0]); };

  DICTS = DICTS || await getJSON("data/dicts.json").catch(() => ({}));
  T = await memoToday(src);
  words = [...T.review.map(x => ({ x, isNew: false })), ...T.fresh.map(x => ({ x, isNew: true }))];
  head();
  function draw() {
    if (cleanup) { cleanup(); cleanup = null; }
    stage.innerHTML = ""; stage.className = "m3stage v-" + mode;
    const left = words.filter(w => !w.done);
    if (!T.pool.length) { stage.innerHTML = `<div class="m3done"><b>${src === "mine" ? "生词本是空的" : "这个词库还没有词"}</b><p class="hint">答错的词会自动收进生词本。</p><a class="btn lime" href="#/memo/${S.lastLevel}">去背 ${S.lastLevel} 词库</a></div>`; return; }
    if (!left.length) { stage.innerHTML = `<div class="m3done">${petPic(140)}<b>今天的单词都完成啦！</b><p class="hint">明天会有新的单词和需要复习的词。也可以在右上角设置里多加一些新词。</p><a class="btn lime" href="#/quiz/${S.lastLevel}">去做每日小测</a></div>`; return; }
    tip.textContent = mode === "fall" ? "摇一摇手机，或者倾斜让单词滑动，点一个单词回答" : mode === "cloud" ? "点一个单词开始回忆" : "左右滑动换一张，点卡片开始回忆";
    cleanup = (mode === "fall" ? viewFall : mode === "cloud" ? viewCloud : viewCards)(stage, left);
  }
  /* ---- views ---- */
  const COLORS = ["#8FB4F0", "#9ED9AE", "#F07B6E", "#F5D36A", "#B9A7F2", "#F4A6C3"];
  function viewCards(el, left) {
    let i = 0;
    const render = () => {
      const show = [0, 1, 2].map(k => left[(i + k) % left.length]).filter((w, k, a) => a.indexOf(w) === k);
      el.innerHTML = `<div class="stack">${show.slice().reverse().map((w, k) => { const depth = show.length - 1 - k; return `<button class="mcard d${depth}" style="--c:${COLORS[(left.indexOf(w) + (w.isNew ? 2 : 0)) % COLORS.length]}" ${depth ? 'tabindex="-1" aria-hidden="true"' : ""}>
        <small>${w.isNew ? "新词" : "主动回忆"}</small><span class="${dir === "ru" ? "ru" : ""}" lang="${dir === "ru" ? "ru" : "zh"}">${esc(prompt(w.x))}</span><em>点击卡片开始回忆</em></button>`; }).join("")}</div>
        <p class="hint" style="text-align:center">${i % left.length + 1} / ${left.length}</p>`;
      const top = el.querySelector(".mcard.d0");
      let sx = null, dx = 0;
      top.onpointerdown = e => { sx = e.clientX; dx = 0; top.setPointerCapture(e.pointerId); };
      top.onpointermove = e => { if (sx == null) return; dx = e.clientX - sx; top.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; };
      top.onpointerup = () => { if (sx == null) return; const d = dx; sx = null; top.style.transform = "";
        if (Math.abs(d) > 70) { i = (i + 1) % left.length; render(); } else if (Math.abs(d) < 8) recall(show[0], () => { draw(); head(); }); };
    };
    render();
  }
  function viewCloud(el, left) {
    el.innerHTML = `<div class="cloud"></div>`;
    const c = el.querySelector(".cloud"), W = c.clientWidth || 340, H = c.clientHeight || 420;
    const placed = [];
    left.slice(0, 40).forEach((w, n) => {
      const s = n === 0 ? 30 : 13 + Math.round(Math.random() * 11), txt = prompt(w.x);
      const b = h(`<button class="cw ${dir === "ru" ? "ru" : ""}" style="font-size:${s}px">${esc(txt)}</button>`); c.append(b);
      const bw = b.offsetWidth, bh = b.offsetHeight;
      let a = 0, r = 0, x = W / 2 - bw / 2, y = H / 2 - bh / 2;
      for (let t = 0; t < 600; t++) { x = W / 2 + r * Math.cos(a) - bw / 2; y = H / 2 + r * Math.sin(a) * 0.8 - bh / 2;
        if (x >= 0 && y >= 0 && x + bw <= W && y + bh <= H && !placed.some(p => x < p.x + p.w && x + bw > p.x && y < p.y + p.h && y + bh > p.y)) break; a += 0.5; r += 1.6; }
      placed.push({ x, y, w: bw, h: bh });
      b.style.left = x + "px"; b.style.top = y + "px"; b.style.transform = `rotate(${(Math.random() - .5) * 10}deg)`;
      b.onclick = () => recall(w, ok => { if (ok) b.classList.add("pop"); setTimeout(() => { draw(); head(); }, ok ? 450 : 0); });
    });
  }
  function viewFall(el, left) {
    el.innerHTML = `<div class="fall"></div><button class="shakebtn" id="shake">${ic3("M8 3h8v18H8zM11 18h2M4 9c-1 2-1 4 0 6M20 9c1 2 1 4 0 6")} 摇一摇</button>`;
    const f = el.querySelector(".fall");
    let stop = false, engine, M, bodies = [], raf;
    const W = () => f.clientWidth, Hh = () => f.clientHeight;
    loadMatter().then(Matter => {
      if (stop) return;
      M = Matter; engine = M.Engine.create(); engine.gravity.y = 1;
      const wall = (x, y, w, hh) => M.Bodies.rectangle(x, y, w, hh, { isStatic: true });
      M.Composite.add(engine.world, [wall(W() / 2, Hh() + 25, W() * 2, 50), wall(-25, Hh() / 2, 50, Hh() * 3), wall(W() + 25, Hh() / 2, 50, Hh() * 3)]);
      left.slice(0, 32).forEach((w, n) => setTimeout(() => {
        if (stop) return;
        const s = 13 + Math.round(Math.random() * 12);
        const node = h(`<button class="fw ${dir === "ru" ? "ru" : ""}" style="font-size:${s}px">${esc(prompt(w.x))}</button>`); f.append(node);
        const bw = node.offsetWidth, bh = node.offsetHeight;
        const body = M.Bodies.rectangle(20 + Math.random() * (W() - 40), -40 - Math.random() * 60, bw, bh, { restitution: 0.25, friction: 0.4, angle: (Math.random() - .5) * 0.8, chamfer: { radius: 4 } });
        body.node = node; body.w = w; bodies.push(body); M.Composite.add(engine.world, body);
        let down = null;
        node.onpointerdown = e => { down = [e.clientX, e.clientY]; };
        node.onpointerup = e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10) return; down = null;
          recall(w, ok => { if (!ok) { M.Body.setVelocity(body, { x: (Math.random() - .5) * 6, y: -8 }); return; }
            node.classList.add("pop"); setTimeout(() => { M.Composite.remove(engine.world, body); node.remove(); bodies = bodies.filter(b => b !== body); head(); if (!words.some(x => !x.done)) draw(); }, 420); }); };
      }, n * 140));
      let last = performance.now();
      const loop = now => { if (stop) return; M.Engine.update(engine, Math.min(32, now - last)); last = now;
        for (const b of bodies) b.node.style.transform = `translate(${b.position.x - b.node.offsetWidth / 2}px, ${b.position.y - b.node.offsetHeight / 2}px) rotate(${b.angle}rad)`;
        raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }).catch(() => { f.innerHTML = `<p class="empty3">物理引擎加载失败，先用「词云」模式吧</p>`; });
    /* tilt → gravity follows the phone; shake → the words jump */
    const onOrient = e => { if (!engine || e.gamma == null) return; engine.gravity.x = Math.max(-1, Math.min(1, e.gamma / 45)); engine.gravity.y = Math.max(0.2, Math.min(1, (e.beta || 45) / 60)); };
    let lastShake = 0;
    const shake = (k = 1) => { if (!M) return; meowSafe && Math.random() < .3 && meowSafe("pet"); bodies.forEach(b => M.Body.setVelocity(b, { x: (Math.random() - .5) * 14 * k, y: -(6 + Math.random() * 10) * k })); };
    const onMotion = e => { const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return; const m = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0); if (m > 28 && Date.now() - lastShake > 600) { lastShake = Date.now(); shake(1); } };
    const enable = async () => {
      try { if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) await DeviceMotionEvent.requestPermission(); } catch (_) {}
      try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (_) {}
      addEventListener("devicemotion", onMotion); addEventListener("deviceorientation", onOrient);
    };
    el.querySelector("#shake").onclick = async () => { await enable(); shake(1.2); };
    if (!(window.DeviceMotionEvent && DeviceMotionEvent.requestPermission)) enable();   // Android / desktop: no permission prompt
    return () => { stop = true; cancelAnimationFrame(raf); removeEventListener("devicemotion", onMotion); removeEventListener("deviceorientation", onOrient); };
  }
  /* ---- active recall ---- */
  function recall(w, done) {
    const x = w.x, rows = T.pool.map(p => p.r);
    const nOpt = Math.min(4, new Set(rows.filter(r => isZh(r[1])).map(r => r[1])).size);
    const opts = nOpt >= 2 ? optionsFor(rows, { r: x.r, i: T.pool.indexOf(x) }, nOpt).map(o => o.r) : [x.r];
    const hint = [POS[x.r[2]] || "", x.r[3] ? x.r[3] + (x.r[2] === "n" && "阳阴中通".includes(x.r[3]) ? "性" : "") : "", x.r[4] ? "英：" + x.r[4] : ""].filter(Boolean).join(" · ");
        const sh = h(`<div class="sheet3 recall" role="dialog" aria-modal="true" aria-label="主动回忆"><div class="in" style="position:relative"><button class="x" aria-label="关闭">✕</button>
      <small class="lab">${w.isNew ? "新词" : "主动回忆"}</small>
      <div class="big ${dir === "ru" ? "ru" : ""}" lang="${dir === "ru" ? "ru" : "zh"}">${esc(prompt(x))}${dir === "ru" ? ` <button class="ib" id="hear" aria-label="朗读">${ic3(I3.sound)}</button>` : ""}</div>
      <p class="hint">${dir === "zh" ? `想一想俄语怎么说${x.r[1] !== zhShort(x.r[1]) ? "：" + esc(x.r[1]) : ""}${hint ? `（${esc(hint)}）` : ""}` : `这个词是什么意思？${hint ? "（" + esc(hint) + "）" : ""}`}</p>
      ${dir === "zh" ? `<div class="seg" role="tablist"><button data-h="pick" aria-selected="true">选择</button><button data-h="type" aria-selected="false">拼写</button><button data-h="say" aria-selected="false">说出来</button></div>` : ""}
      <div class="ans"></div><div class="fb"></div>
      <div class="two2"><button class="btn soft" id="idk">想不起来</button><button class="btn lime" id="sub" style="display:none">提交答案</button></div></div></div>`);
    document.body.append(sh);
    const ans = sh.querySelector(".ans"), fb = sh.querySelector(".fb"), sub = sh.querySelector("#sub");
    let finished = false;
    const close = res => { sh.remove(); done && done(res); };
    sh.querySelector(".x").onclick = () => close(null);
    const hear = sh.querySelector("#hear"); if (hear) { hear.onclick = () => playOne(hear, x.r[0]); setTimeout(() => speak(x.r[0]), 200); }
    function finish(ok, given) {
      if (finished) return; finished = true;
      srsGrade(x, ok); Pet.heardWord(x.lv, x.i);
      const k = memoKey(x), S = Pet.state;
      if (ok) {
        w.done = true; Pet.unmiss(x.lv, x.i);
        if (!S.srs[k].first) { S.srs[k].first = Date.now(); Pet.save(); }
        const got = w.isNew ? Pet.master(x.lv, x.i) : Pet.once(`rev|${dayKey()}|${k}`, "master");
        meowSafe("correct"); logEvent("play", `背会了 ${plain(x.r[0])}`);
        fb.innerHTML = `<div class="okbox"><b>答对了！${got ? "+1 小鱼干 🐟" : ""}</b><span class="ru" lang="ru">${esc(x.r[0])}</span> = ${esc(x.r[1])}</div>`;
      } else {
        Pet.missed(x.lv, x.i); Pet.wrong();
        fb.innerHTML = `<div class="nobox"><b>${given ? "不对哦" : "没关系"}，已收进生词本，过一会儿再考你</b><span class="ru" lang="ru">${esc(x.r[0])}</span> = ${esc(x.r[1])}</div>`;
      }
      speak(x.r[0]);
      sh.querySelector(".two2").style.gridTemplateColumns = "1fr"; sh.querySelector(".two2").innerHTML = `<button class="btn lime" id="nx">${ok ? "继续" : "知道了"}</button>`;
      sh.querySelector("#nx").onclick = () => close(ok);
    }
    function method(m) {
      sub.style.display = m === "type" ? "" : "none"; sh.querySelector(".two2").style.gridTemplateColumns = m === "type" ? "" : "1fr";
      sh.querySelectorAll("[data-h]").forEach(b => b.setAttribute("aria-selected", b.dataset.h === m));
      if (m === "pick") {
        ans.innerHTML = `<div class="opts">${opts.map((o, j) => `<button data-j="${j}" class="${dir === "zh" ? "ru" : ""}" lang="${dir === "zh" ? "ru" : "zh"}">${esc(dir === "zh" ? o[0] : zhShort(o[1]))}</button>`).join("")}</div>`;
        ans.querySelectorAll("[data-j]").forEach(b => b.onclick = () => { if (finished) return; const ok = opts[+b.dataset.j] === x.r; b.classList.add(ok ? "right" : "wrong"); if (!ok) ans.querySelectorAll("[data-j]").forEach(y => { if (opts[+y.dataset.j] === x.r) y.classList.add("right"); }); finish(ok, true); });
      } else if (m === "type") {
        ans.innerHTML = `<label class="input3 big"><input id="ty" lang="ru" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入俄语单词（首字母：${esc(plain(x.r[0])[0])}）"></label><div class="kb">${"абвгдеёжзийклмнопрстуфхцчшщъыьэюя".split("").map(c => `<button data-c="${c}">${c}</button>`).join("")}<button data-c="⌫" class="wide">⌫</button></div>`;
        const ty = ans.querySelector("#ty");
        ans.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { ty.value = b.dataset.c === "⌫" ? ty.value.slice(0, -1) : ty.value + b.dataset.c; });
        ty.onkeydown = e => { if (e.key === "Enter") sub.click(); };
        sub.onclick = () => { if (!ty.value.trim()) return; finish(normWord(ty.value) === normWord(x.r[0]), true); };
      } else {
        ans.innerHTML = `<button class="cam" id="mic" aria-label="按一下，说出这个单词">${ic3(I3.mic)}</button><p class="hint" style="text-align:center" id="heard">点麦克风，用俄语说出这个词</p>`;
        ans.querySelector("#mic").onclick = () => listenOnce(alts => {
          const heard = ans.querySelector("#heard");
          if (!alts) { heard.textContent = "这个设备不支持语音识别，换「选择」或「拼写」吧"; return; }
          const ok = alts.some(a => normWord(a).split(" ").includes(normWord(x.r[0])) || normWord(a) === normWord(x.r[0]));
          heard.innerHTML = `听到：<span lang="ru">${esc(alts[0] || "（没听清）")}</span>`;
          if (alts.length) finish(ok, true);
        });
      }
    }
    sh.querySelectorAll("[data-h]").forEach(b => b.onclick = () => method(b.dataset.h));
    sh.querySelector("#idk").onclick = () => finish(false, false);
    method("pick");
  }
  draw();
}
/* one-shot Russian speech recognition (native plugin in the app, Web Speech API in the browser) */
async function listenOnce(cb) {
  const NSR = capPlugin("SpeechRecognition");
  try {
    if (NSR) { await NSR.requestPermissions(); const r = await NSR.start({ language: "ru-RU", maxResults: 5, partialResults: false, popup: false }); cb((r && r.matches) || []); return; }
  } catch (_) { cb([]); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return cb(null);
  const r = new SR(); r.lang = "ru-RU"; r.maxAlternatives = 5; r.interimResults = false;
  r.onresult = e => cb([...e.results[0]].map(a => a.transcript)); r.onerror = () => cb([]);
  try { r.start(); } catch (_) { cb([]); }
}
let _matter;
function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  return _matter || (_matter = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/matter.min.js"; s.onload = () => window.Matter ? res(window.Matter) : rej(); s.onerror = rej; document.head.append(s); }));
}

"use strict";
/* ========== 猫猫俄语通 — memorize, writing, exam; boot ========== */

const SPK = "M4 9v6h4l5 4V5L8 9H4z";
const isZh = s => /[一-鿿]/.test(s || "");
const rndI = n => Math.floor(Math.random() * n);
function optionsFor(rows, t, n = 4) {
  const same = rows.map((r, i) => ({ r, i })).filter(o => o.i !== t.i && isZh(o.r[1]) && o.r[1] !== t.r[1] && o.r[2] === t.r[2]);
  const any = same.length >= n - 1 ? same : rows.map((r, i) => ({ r, i })).filter(o => o.i !== t.i && isZh(o.r[1]) && o.r[1] !== t.r[1]);
  const opts = [t], seen = new Set([t.i]);
  while (opts.length < n) { const d = any[rndI(any.length)]; if (!seen.has(d.i)) { seen.add(d.i); opts.push(d); } }
  return opts.sort(() => Math.random() - 0.5);
}
const lvNav = (base, lv) => `<nav class="lv-pills mini" aria-label="等级">${ORDER.map(x => `<a href="#/${base}/${x}" ${x === lv ? 'aria-current="page"' : ""}>${x}</a>`).join("")}</nav>`;
const backHead = (title, inner) => `<header class="subhead"><a class="iconbtn" href="#/learn" aria-label="返回学习">${svgI(ICON.back, "stroke")}</a><div class="grow"><small>${title}</small>${inner || ""}</div></header>`;

/* ---------- memorize: pick a dictionary, flashcard, then a check — passing it = 背下来 ---------- */
let DICTS = null;
async function memoPool(src) {
  const S = Pet.state;
  if (LEVELS[src]) return (await getJSON(`data/words_${src}.json`)).map((r, i) => ({ lv: src, i, r }));
  let items;
  if (src === "mine") items = Object.keys(S.wrongWords || {}).map(k => k.split(":")).map(([lv, i]) => [lv, +i]);
  else { DICTS = DICTS || await getJSON("data/dicts.json"); items = (DICTS[src.slice(2)] || { items: [] }).items; }
  const lvs = [...new Set(items.map(x => x[0]))], rows = {};
  await Promise.all(lvs.map(async lv => rows[lv] = await getJSON(`data/words_${lv}.json`)));
  return items.map(([lv, i]) => ({ lv, i, r: rows[lv][i] })).filter(x => x.r);
}
async function pageMemo(src) {
  const S = Pet.state;
  DICTS = DICTS || await getJSON("data/dicts.json").catch(() => ({}));
  const lv0 = LEVELS[src] ? src : S.lastLevel;
  const nMine = Object.keys(S.wrongWords || {}).length;
  const title = LEVELS[src] ? `${src} 等级词库` : src === "mine" ? "我的生词本" : `主题词典 · ${(DICTS[src.slice(2)] || {}).name || ""}`;
  const box = h(`<div class="page memo">${backHead("背单词 · " + title, `<nav class="dict-pick" aria-label="选择词库">
      ${ORDER.map(x => `<a href="#/memo/${x}" ${x === src ? 'aria-current="page"' : ""}>${x}</a>`).join("")}
      ${Object.entries(DICTS).map(([k, d]) => `<a href="#/memo/t-${k}" ${"t-" + k === src ? 'aria-current="page"' : ""}>${d.name}</a>`).join("")}
      <a href="#/memo/mine" class="mine" ${src === "mine" ? 'aria-current="page"' : ""}>生词本 ${nMine}</a></nav>`)}<div class="mbody"><p class="empty">加载词库…</p></div></div>`);
  app.append(box);
  const cur = box.querySelector('.dict-pick [aria-current]'); if (cur) cur.scrollIntoView({ inline: "center", block: "nearest" });
  const pool = await memoPool(src), mb = box.querySelector(".mbody");
  const rowsOf = {}; for (const x of pool) rowsOf[x.lv] = rowsOf[x.lv] || null;
  await Promise.all(Object.keys(rowsOf).map(async lv => rowsOf[lv] = await getJSON(`data/words_${lv}.json`)));
  const fresh = x => isZh(x.r[1]) && (src === "mine" || !S.mastered[x.lv + ":" + x.i]);
  const queue = pool.filter(fresh).sort(() => src === "mine" || !LEVELS[src] ? Math.random() - 0.5 : 0).slice(0, 60);
  const doneN = pool.filter(x => S.mastered[x.lv + ":" + x.i]).length;
  let session = 0;
  if (!pool.length) { mb.innerHTML = `<section class="card result"><h2>${src === "mine" ? "生词本是空的" : "这个词库还没有词"}</h2><p class="hint">${src === "mine" ? "测验和背单词里答错的词会自动收进来，方便以后集中复习。" : ""}</p><a class="btn" href="#/memo/${lv0}">去背 ${lv0} 词库</a></section>`; return; }
  function card() {
    if (!queue.length) { mb.innerHTML = `<section class="card result"><h2>这一组都背会啦！</h2><p>本次背会 ${session} 个词。</p><a class="btn" href="#/quiz/${lv0}">去做今天的测验</a></section>`; return; }
    const t = queue[0];
    mb.innerHTML = `<p class="hint">${src === "mine" ? `生词本 ${Object.keys(S.wrongWords || {}).length} 个 · 答对就移出生词本` : `已背会 ${fmt(doneN + session)} / ${fmt(pool.length)}`} · 本次 ${session} 个 · 背会一个得 1 猫粮</p>
      <section class="card flash"><small>${t.lv} #${t.i + 1} · ${POS[t.r[2]] || ""}${t.r[3] ? " · " + esc(t.r[3]) : ""}</small>
        <button class="qword ru" lang="ru" aria-label="朗读 ${esc(t.r[0])}">${esc(t.r[0])} ${svgI(SPK, "fill")}</button>
        <div class="flash-back" hidden><p class="qzh">${esc(t.r[1])}</p><p class="hint">${esc(t.r[4] || "")}</p></div></section>
      <div class="row2"><button class="btn ghost big" id="no">还不认识</button><button class="btn big" id="yes">我记住了</button></div>`;
    const say = () => { speak(t.r[0]); Pet.heardWord(t.lv, t.i); };
    mb.querySelector(".qword").onclick = say; setTimeout(say, 200);
    const no = mb.querySelector("#no"), yes = mb.querySelector("#yes");
    no.onclick = () => {
      mb.querySelector(".flash-back").hidden = false; yes.hidden = true;
      Pet.missed(t.lv, t.i);
      Pet.talk("收进生词本啦，等会儿还会再见到它");
      no.textContent = "下一个"; no.onclick = () => { queue.push(queue.shift()); card(); };
    };
    yes.onclick = () => check(t);
  }
  function check(t) {
    const opts = optionsFor(rowsOf[t.lv], t);
    mb.innerHTML = `<section class="card qcard"><small>检验一下：选出正确的意思</small><p class="qword ru" lang="ru">${esc(t.r[0])}</p></section>
      <div class="qopts">${opts.map((o, j) => `<button data-j="${j}">${esc(o.r[1])}</button>`).join("")}</div><div class="qfb"></div>`;
    let done = false;
    mb.querySelectorAll("[data-j]").forEach(b => b.onclick = () => {
      if (done) return; done = true;
      const ok = opts[+b.dataset.j] === t;
      mb.querySelectorAll("[data-j]").forEach(x => { if (opts[+x.dataset.j] === t) x.classList.add("right"); });
      let got = false;
      if (ok) { got = Pet.master(t.lv, t.i); Pet.unmiss(t.lv, t.i); session++; queue.shift(); if (S.settings.meow) meowFor("correct"); Pet.cheer("背下来啦！"); }
      else { b.classList.add("wrong"); Pet.wrong(); Pet.missed(t.lv, t.i); queue.push(queue.shift()); }
      mb.querySelector(".qfb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><b>${ok ? (got ? "背下来了！+1 猫粮" : "复习成功！已移出生词本") : "还没记牢，已收进生词本"}</b><span class="ru" lang="ru">${esc(t.r[0])}</span> = ${esc(t.r[1])}</div><button class="btn big" id="nx">下一个</button>`;
      const nx = mb.querySelector("#nx"); nx.onclick = card; nx.focus();
    });
  }
  card();
}

/* ---------- 复读跟读 (shadowing): listen → repeat → score → food by score ---------- */
async function pageShadow(lv) {
  const S = Pet.state;
  const box = h(`<div class="page shadow">${backHead("复读跟读 · 听一句，跟着读", lvNav("shadow", lv))}<div class="sbody"><p class="empty">加载材料…</p></div></div>`);
  app.append(box);
  const c = await getJSON(`data/content_${lv}.json`);
  const mats = [
    ...c.dialogues.map(d => ({ kind: "对话", title: d.title, zh: d.titleZh, lines: d.lines.map(l => [l[1], l[2]]) })),
    ...c.listening.map(d => ({ kind: "听力", title: d.title, zh: d.titleZh, lines: d.text })),
    ...c.news.map(d => ({ kind: "新闻", title: d.title, zh: d.titleZh, lines: d.sentences })),
  ].filter(m => m.lines && m.lines.length);
  const sb = box.querySelector(".sbody");
  let slow = true;
  function list() {
    sb.innerHTML = `<section class="card note"><p><b>怎么练：</b>先听原音（默认慢速），再按麦克风跟着读。系统会识别你的发音打分：<b>60 分 +1 猫粮，75 分 +2，90 分 +3</b>，读得好还可能掉落小零食。每句每天按最高分发一次奖励。</p></section>
      <div class="mats">${mats.map((m, j) => `<button class="card mat" data-m="${j}"><small>${m.kind} · ${m.lines.length} 句</small><b lang="ru">${esc(m.title)}</b><span>${esc(m.zh || "")}</span></button>`).join("")}</div>`;
    sb.querySelectorAll("[data-m]").forEach(b => b.onclick = () => run(mats[+b.dataset.m]));
  }
  function run(m) {
    let k = 0; const scores = [];
    function step() {
      if (k >= m.lines.length) return end();
      const [ru, zh] = m.lines[k];
      sb.innerHTML = `<p class="hint">${m.kind} · ${esc(m.title)} · 第 ${k + 1} / ${m.lines.length} 句</p>
        <section class="card shadow-card"><ol class="lines"><li><p class="ru big-line" lang="ru">${esc(ru)}</p><p class="zh">${esc(zh || "")}</p></li></ol>
          <div class="sh-ctrl"><button class="btn ghost" id="listen">${svgI(SPK, "fill")} 听原音</button>
          <label class="sw"><input type="checkbox" id="slow" ${slow ? "checked" : ""}> 慢速</label>
          <button class="mic big" id="mic" aria-label="跟读并打分">${MIC}</button></div></section>
        <div class="row2"><button class="btn ghost" id="prev" ${k ? "" : "disabled"}>上一句</button><button class="btn" id="next">${k + 1 < m.lines.length ? "下一句" : "完成"}</button></div>
        <button class="btn ghost small" id="out">换一篇材料</button>`;
      const li = sb.querySelector("li");
      const play = () => speak(ru, { rate: slow ? 0.7 : 1 });
      sb.querySelector("#listen").onclick = play;
      sb.querySelector("#slow").onchange = e => { slow = e.target.checked; };
      sb.querySelector("#mic").onclick = e => shadowLine(e.currentTarget, li, ru, `sh|${lv}|${m.title}|${k}`, sc => { scores[k] = Math.max(scores[k] || 0, sc); });
      sb.querySelector("#prev").onclick = () => { k--; step(); };
      sb.querySelector("#next").onclick = () => { k++; step(); };
      sb.querySelector("#out").onclick = list;
      setTimeout(play, 300);
    }
    function end() {
      const got = scores.filter(x => x != null), avg = got.length ? Math.round(got.reduce((a, b) => a + b, 0) / got.length) : 0;
      const v = Pet.view();
      sb.innerHTML = `<section class="card result"><div class="res-cat">${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: avg >= 75 ? "cheer" : "happy", size: 140 })}</div>
        <h2>${got.length ? `跟读了 ${got.length} 句 · 平均 ${avg} 分` : "这篇还没有跟读"}</h2>
        <p class="hint">${avg >= 90 ? "发音太棒了！" : avg >= 75 ? "很不错，继续保持" : got.length ? "多听几遍原音再读，分数会更高" : "按麦克风跟读才能拿到猫粮哦"}</p>
        <div class="row2"><button class="btn" id="again">再练一遍</button><button class="btn ghost" id="other">换一篇</button></div></section>`;
      if (got.length >= 3 && avg >= 75) {
        const kk = Pet.today() + "|shadowall|" + lv + m.title;
        if (!S.once[kk]) { S.once[kk] = 1; Pet.bonus({ g: 20, f: avg >= 90 ? 4 : 2, w: 1, text: `整篇跟读平均 ${avg} 分`, snackChance: avg >= 90 ? 0.5 : 0.2 }); }
      }
      sb.querySelector("#again").onclick = () => run(m); sb.querySelector("#other").onclick = list;
    }
    step();
  }
  list();
}

/* ---------- writing ---------- */
const WRITE_TASKS = {
  A1: { min: 20, list: ["介绍你自己：名字、国家、职业。（Меня́ зову́т… Я из…）", "介绍你的家庭。（У меня́ есть…）", "描述你的房间。（В мое́й ко́мнате…）"] },
  A2: { min: 40, list: ["写一写你的周末。（В суббо́ту я…）", "给朋友写一张明信片，讲讲你的旅行。", "描述你最喜欢的季节，并说明原因。"] },
  B1: { min: 80, list: ["你为什么学俄语？写出至少三个理由。", "讲一件让你难忘的事（用过去时，注意动词的体）。", "写一封邮件，向房东询问租房的条件。"] },
  B2: { min: 120, list: ["远程办公利大于弊吗？表达你的观点并举例。", "评论一则最近的新闻（可以用本级新闻页里的文章）。", "描述你家乡的一个问题，并提出解决办法。"] },
  C1: { min: 150, list: ["人工智能会改变语言学习吗？写一篇议论文。", "写一封正式的投诉信（使用公文语体）。", "比较中俄两国的一个文化传统。"] },
  C2: { min: 200, list: ["“语言的边界就是世界的边界”——谈谈你的理解。", "为一本你喜欢的书写书评。", "写一篇关于城市化的学术短文。"] },
};
const cyrWords = t => (t.match(/[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?/g) || []).length;
function pageWrite(lv) {
  const T = WRITE_TASKS[lv], S = Pet.state;
  let ti = 0;
  const box = h(`<div class="page write">${backHead("写作", lvNav("write", lv))}<div class="wbody"></div></div>`);
  app.append(box);
  const wb = box.querySelector(".wbody");
  const dkey = () => `mm_draft_${lv}_${ti}`;
  function draw() {
    let draft = ""; try { draft = localStorage.getItem(dkey()) || ""; } catch {}
    const doneToday = S.once[Pet.today() + "|write:" + lv + ":" + ti];
    const mine = S.writings.filter(w => w.lv === lv).slice(-3).reverse();
    wb.innerHTML = `<div class="seg" role="tablist" aria-label="题目">${T.list.map((_, i) => `<button role="tab" aria-selected="${i === ti}" data-i="${i}">题目 ${i + 1}</button>`).join("")}</div>
      <section class="card"><h2>${esc(T.list[ti])}</h2><p class="hint">用俄语写，至少 ${T.min} 个俄语单词。交作文得 3 猫粮 + 1 小鱼干（每个题目每天一次）。</p>
      <label class="sr" for="wt">作文</label><textarea id="wt" lang="ru" rows="10" placeholder="Пиши́те здесь…"></textarea>
      <div class="row"><span class="wc" aria-live="polite"></span><button class="btn" id="submit">${doneToday ? "再次保存" : "交作文"}</button></div></section>
      ${mine.length ? `<h2 class="sec">我写过的</h2>` + mine.map(w => `<details class="card"><summary>${new Date(w.t).toLocaleDateString("zh-CN")} · ${w.n} 个词 · ${esc(w.task.slice(0, 16))}…</summary><p lang="ru" class="ru">${esc(w.text)}</p></details>`).join("") : ""}`;
    wb.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { ti = +b.dataset.i; draw(); });
    const ta = wb.querySelector("#wt"), wc = wb.querySelector(".wc");
    ta.value = draft;
    const upd = () => { const n = cyrWords(ta.value); wc.textContent = `${n} / ${T.min} 个俄语单词`; wc.classList.toggle("ok", n >= T.min); try { localStorage.setItem(dkey(), ta.value); } catch {} };
    ta.oninput = upd; upd();
    wb.querySelector("#submit").onclick = () => {
      const n = cyrWords(ta.value);
      if (n < T.min) { Pet.toast(`还差 ${T.min - n} 个俄语单词，加油！`, "warn"); Pet.talk("再写几句吧～"); return; }
      S.writings.push({ lv, task: T.list[ti], text: ta.value, n, t: Date.now() });
      if (S.writings.length > 60) S.writings.shift();
      if (!Pet.once("write:" + lv + ":" + ti, "write", true)) { Pet.save(); Pet.toast("已保存"); }
      draw();
    };
  }
  draw();
}

/* ---------- level exam ---------- */
async function pageExam(lv) {
  const box = h(`<div class="page quiz exam">${backHead(`${lv} 模拟考试（ТРКИ）· 20 题 · 答对 16 题通过`, `<div class="bar thin"><i></i></div>`)}<div class="qbody"></div></div>`);
  app.append(box);
  const qb = box.querySelector(".qbody"), bar = box.querySelector(".bar i"), S = Pet.state, ex = S.exams[lv];
  qb.innerHTML = `<section class="card result"><div class="res-cat">${catSVG({ breed: S.cat.breed, stage: Pet.view().shownStage, mood: "happy", size: 140 })}</div>
    <h2>${lv} 模拟考试 · ТРКИ</h2><p>20 道题：看词选意思、看中文选俄语、听音选词。答对 16 题通过，奖励 100 成长值、10 猫粮、5 水和 1 个豪华罐头（每天一次）。</p>
    ${ex ? `<p class="hint">最好成绩 ${ex.best} / 20${ex.passed ? " · 已通过" : ""}</p>` : ""}<button class="btn big" id="start">开始考试</button></section>`;
  qb.querySelector("#start").onclick = async () => {
    const rows = await getJSON(`data/words_${lv}.json`);
    const pool = rows.map((r, i) => ({ r, i })).filter(({ r }) => isZh(r[1]));
    const used = new Set(), qs = [];
    while (qs.length < 20) {
      const t = pool[rndI(pool.length)]; if (used.has(t.i)) continue; used.add(t.i);
      qs.push({ t, opts: optionsFor(rows, t), type: ["ru", "zh", "ear"][qs.length % 3] });
    }
    let k = 0, right = 0;
    const q = () => {
      bar.style.width = (k / 20 * 100) + "%";
      if (k >= 20) return end();
      const Q = qs[k];
      const prompt = Q.type === "ru" ? `<p class="qword ru" lang="ru">${esc(Q.t.r[0])}</p>` : Q.type === "zh" ? `<p class="qzh">${esc(Q.t.r[1])}</p>` : `<button class="qword">${svgI(SPK, "fill")} 再听一遍</button>`;
      qb.innerHTML = `<section class="card qcard"><small>第 ${k + 1} / 20 题 · ${Q.type === "ear" ? "听音选词" : Q.type === "ru" ? "选意思" : "选俄语"}</small>${prompt}</section>
        <div class="qopts">${Q.opts.map((o, j) => `<button data-j="${j}" ${Q.type !== "ru" ? 'lang="ru" class="ru"' : ""}>${esc(Q.type === "ru" ? o.r[1] : o.r[0])}</button>`).join("")}</div>`;
      if (Q.type === "ear") { const b = qb.querySelector(".qword"); b.onclick = () => speak(Q.t.r[0]); setTimeout(() => speak(Q.t.r[0]), 250); }
      let done = false;
      qb.querySelectorAll("[data-j]").forEach(b => b.onclick = () => {
        if (done) return; done = true;
        const ok = Q.opts[+b.dataset.j] === Q.t; if (ok) right++;
        b.classList.add(ok ? "right" : "wrong");
        Pet.answered();
        setTimeout(() => { k++; q(); }, 450);
      });
    };
    const end = () => {
      const passed = right >= 16, prev = S.exams[lv] || {};
      S.exams[lv] = { best: Math.max(right, prev.best || 0), passed: passed || !!prev.passed };
      Pet.save();
      const v = Pet.view();
      qb.innerHTML = `<section class="card result"><div class="res-cat">${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: passed ? "cheer" : "happy", size: 150 })}</div>
        <h2>${right} / 20 · ${passed ? "通过！" : "还差一点"}</h2><p>${passed ? `${esc(v.cat.name)}为你骄傲！` : `答对 16 题就能通过，${esc(v.cat.name)}陪你再练练。`}</p>
        <div class="row2"><a class="btn" href="#/memo/${lv}">去背单词</a><a class="btn ghost" href="#/learn">回到学习</a></div></section>`;
      if (passed) { if (S.settings.meow) meowSound(); if (!Pet.once("exam:" + lv, "exam", true)) Pet.toast("今天已经领过这一级的考试奖励啦"); }
    };
    q();
  };
}

/* ---------- boot ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
route();

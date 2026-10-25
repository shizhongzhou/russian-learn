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

/* ---------- memorize: flashcard, then a check — passing it = 背下来 ---------- */
async function pageMemo(lv) {
  const box = h(`<div class="page memo">${backHead("背单词 · 选择词库", lvNav("memo", lv))}<div class="mbody"><p class="empty">加载词库…</p></div></div>`);
  app.append(box);
  const rows = await getJSON(`data/words_${lv}.json`);
  const S = Pet.state, total = LV_COUNT(lv), mb = box.querySelector(".mbody");
  const queue = rows.map((r, i) => ({ r, i })).filter(({ r, i }) => isZh(r[1]) && !S.mastered[lv + ":" + i]).slice(0, 60);
  let session = 0;
  function card() {
    if (!queue.length) { mb.innerHTML = `<section class="card result"><h2>这一组都背会啦！</h2><p>本次背会 ${session} 个词。</p><a class="btn" href="#/quiz/${lv}">去做今天的测验</a></section>`; return; }
    const t = queue[0];
    mb.innerHTML = `<p class="hint">${lv} 词库已背会 ${fmt(S.masteredCount[lv] || 0)} / ${fmt(total)} · 本次 ${session} 个 · 背会一个得 1 猫粮</p>
      <section class="card flash"><small>#${t.i + 1} · ${POS[t.r[2]] || ""}${t.r[3] ? " · " + esc(t.r[3]) : ""}</small>
        <button class="qword ru" lang="ru" aria-label="朗读 ${esc(t.r[0])}">${esc(t.r[0])} ${svgI(SPK, "fill")}</button>
        <div class="flash-back" hidden><p class="qzh">${esc(t.r[1])}</p><p class="hint">${esc(t.r[4] || "")}</p></div></section>
      <div class="row2"><button class="btn ghost big" id="no">还不认识</button><button class="btn big" id="yes">我记住了</button></div>`;
    const say = () => { speak(t.r[0]); Pet.heardWord(lv, t.i); };
    mb.querySelector(".qword").onclick = say; setTimeout(say, 200);
    const no = mb.querySelector("#no"), yes = mb.querySelector("#yes");
    no.onclick = () => {
      mb.querySelector(".flash-back").hidden = false; yes.hidden = true;
      Pet.talk("没关系，等会儿还会再见到它");
      no.textContent = "下一个"; no.onclick = () => { queue.push(queue.shift()); card(); };
    };
    yes.onclick = () => check(t);
  }
  function check(t) {
    const opts = optionsFor(rows, t);
    mb.innerHTML = `<section class="card qcard"><small>检验一下：选出正确的意思</small><p class="qword ru" lang="ru">${esc(t.r[0])}</p></section>
      <div class="qopts">${opts.map((o, j) => `<button data-j="${j}">${esc(o.r[1])}</button>`).join("")}</div><div class="qfb"></div>`;
    let done = false;
    mb.querySelectorAll("[data-j]").forEach(b => b.onclick = () => {
      if (done) return; done = true;
      const ok = opts[+b.dataset.j] === t;
      mb.querySelectorAll("[data-j]").forEach(x => { if (opts[+x.dataset.j] === t) x.classList.add("right"); });
      if (ok) { Pet.master(lv, t.i); session++; queue.shift(); if (S.settings.meow) meowSound(); Pet.cheer("背下来啦！"); }
      else { b.classList.add("wrong"); Pet.wrong(); queue.push(queue.shift()); }
      mb.querySelector(".qfb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><b>${ok ? "背下来了！+1 猫粮" : "还没记牢，等会儿再来"}</b><span class="ru" lang="ru">${esc(t.r[0])}</span> = ${esc(t.r[1])}</div><button class="btn big" id="nx">下一个</button>`;
      const nx = mb.querySelector("#nx"); nx.onclick = card; nx.focus();
    });
  }
  card();
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
  const box = h(`<div class="page quiz exam">${backHead(`${lv} 等级考试 · 20 题 · 答对 16 题通过`, `<div class="bar thin"><i></i></div>`)}<div class="qbody"></div></div>`);
  app.append(box);
  const qb = box.querySelector(".qbody"), bar = box.querySelector(".bar i"), S = Pet.state, ex = S.exams[lv];
  qb.innerHTML = `<section class="card result"><div class="res-cat">${catSVG({ breed: S.cat.breed, stage: Pet.view().shownStage, mood: "happy", size: 140 })}</div>
    <h2>${lv} 等级考试</h2><p>20 道题：看词选意思、看中文选俄语、听音选词。答对 16 题通过，奖励 100 成长值、10 猫粮、5 水和 1 个豪华罐头（每天一次）。</p>
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

"use strict";
/* ========== 猫猫俄语通 — ТРКИ-2 style mock exam (original practice paper) ========== */
let TRKI = null;
const loadTrki = async () => TRKI || (TRKI = await getJSON("data/trki_b2.json"));
const shuffleOpts = (o, a) => {   // shuffle options, keep track of the right one
  const idx = o.map((_, i) => i).sort(() => Math.random() - 0.5);
  return { o: idx.map(i => o[i]), a: idx.indexOf(a) };
};
const ABC = "АБВГ";
const trkiHead = (title, sub) => `<header class="subhead"><a class="iconbtn" href="#/trki" aria-label="返回模拟考试">${svgI(ICON.back, "stroke")}</a><div class="grow"><small>${sub || "ТРКИ-2 模拟考试"}</small><b>${title}</b></div><span class="timer" aria-live="off"></span></header>`;
function startTimer(box, minutes) {
  const el = box.querySelector(".timer"), end = Date.now() + minutes * 60e3;
  const t = later(() => {
    const left = Math.max(0, end - Date.now()), m = Math.floor(left / 60e3), s = Math.floor(left / 1e3) % 60;
    if (!document.body.contains(el)) return clearInterval(t);
    el.textContent = `${m}:${String(s).padStart(2, "0")}`; el.classList.toggle("late", left < 120e3);
  }, 1000);
}

async function pageTrki(part) {
  const T = await loadTrki(), S = Pet.state;
  S.trki = S.trki || {};
  if (part) {
    const sec = T.sections.find(s => s.id === part);
    if (sec) return sec.items || sec.texts ? trkiObjective(sec) : sec.id === "write" ? trkiWrite(sec) : trkiSpeak(sec);
  }
  const box = h(`<div class="page trki"><header class="subhead"><a class="iconbtn" href="#/learn" aria-label="返回学习">${svgI(ICON.back, "stroke")}</a><div class="grow"><small>B2 · 第二级</small><b>ТРКИ-2 模拟考试</b></div></header>
    <section class="card note"><p>${esc(T.note)} 真实考试分两天进行：阅读、写作、词汇语法，第二天听力、口语。每个部分都可以单独练习。</p></section>
    <div class="trki-secs">${T.sections.map(s => { const r = S.trki[s.id]; const n = s.items ? s.items.length : s.texts ? s.texts.reduce((a, t) => a + t.items.length, 0) : s.tasks.length;
      return `<a class="card trki-sec ${r && r.passed ? "pass" : ""}" href="#/trki/${s.id}"><div><small>${s.minutes} 分钟 · ${s.items || s.texts ? n + " 题" : n + " 个任务"}</small><b lang="ru">${esc(s.name)}</b><span>${esc(s.zh)}</span></div>
        <em>${r ? (r.passed ? "✓ 已通过" : "未通过") + (r.best != null ? ` · 最好 ${r.best}%` : "") : "开始 ›"}</em></a>`; }).join("")}</div>
    <p class="hint">通过一个部分：+5 猫粮，还有机会掉零食；五个部分全部通过：豪华罐头一个。</p></div>`);
  app.append(box);
}

function trkiReward(sec, pct) {
  const S = Pet.state, r = S.trki[sec.id] = S.trki[sec.id] || {};
  r.best = Math.max(r.best || 0, pct); r.last = pct; r.passed = r.passed || pct >= 66; Pet.save();
  if (pct < 66) { if (S.settings.meow) meowFor("wrong"); return; }
  const k = Pet.today() + "|trki|" + sec.id;
  if (!S.once[k]) { S.once[k] = 1; Pet.bonus({ g: 40, f: 5, w: 2, text: `ТРКИ-2「${sec.zh}」通过 ${pct}%`, snackChance: 0.5 }); }
  const all = TRKI.sections.every(s => S.trki[s.id] && S.trki[s.id].passed);
  if (all && !S.once["trki-all"]) { S.once["trki-all"] = 1; S.inv.s4 = (S.inv.s4 || 0) + 1; Pet.save(); setTimeout(() => Pet.toast("<b>ТРКИ-2 五个部分全部通过！</b><br>奖励豪华罐头 ×1", "big"), 1500); }
}

/* 词汇语法 / 阅读 / 听力: multiple choice, submit at the end */
function trkiObjective(sec) {
  const box = h(`<div class="page trki">${trkiHead(`${esc(sec.zh)} · <span lang="ru">${esc(sec.name)}</span>`)}<p class="hint">${esc(sec.introZh)}（${esc(sec.intro)}）</p><div class="tbody"></div>
    <button class="btn big" id="submit">交卷</button><div class="tres"></div></div>`);
  app.append(box); startTimer(box, sec.minutes);
  const body = box.querySelector(".tbody");
  const qs = [];
  const qHTML = (it, n) => { const sh = shuffleOpts(it.o, it.a); qs.push({ it, ...sh });
    return `<li class="tq" data-n="${n}"><p lang="ru">${esc(it.q).replace("___", "<span class=gap>______</span>")}</p><div class="topts">${sh.o.map((o, j) => `<button data-j="${j}" lang="ru"><i>${ABC[j]}</i>${esc(o)}</button>`).join("")}</div><div class="twhy" hidden></div></li>`; };
  if (sec.items) body.innerHTML = `<ol class="tqs">${sec.items.map((it, n) => qHTML(it, n)).join("")}</ol>`;
  else {
    let n = 0;
    body.innerHTML = sec.texts.map((t, ti) => `<section class="card ttext">
      <h2 lang="ru">${esc(t.title)} <small>${esc(t.zh)}</small></h2>
      ${t.body ? `<div class="tbody-text" lang="ru">${t.body.map(p => `<p>${esc(p)}</p>`).join("")}</div>`
        : `<div class="tplay"><button class="btn" data-play="${ti}">${svgI("M8 5v14l11-7z", "fill")} 播放录音</button><span class="hint" data-left="${ti}">还可以听 2 遍</span></div>
           <div class="ttrans" data-tr="${ti}" hidden lang="ru">${t.lines.map(([who, l]) => `<p>${t.dialog ? `<b>${who === "A" ? "—" : "—"}</b> ` : ""}${esc(l)}</p>`).join("")}</div>`}
      <ol class="tqs" start="${n + 1}">${t.items.map(it => qHTML(it, n++)).join("")}</ol></section>`).join("");
    body.querySelectorAll("[data-play]").forEach(b => {
      let left = 2;
      b.onclick = async () => {
        if (left <= 0) return;
        left--; b.disabled = true; body.querySelector(`[data-left="${b.dataset.play}"]`).textContent = left ? `还可以听 ${left} 遍` : "已经听完两遍";
        const t = sec.texts[+b.dataset.play];
        await playSequence(t.lines.map(([who, l]) => ({ text: l, voice: who === "A" ? 0 : 1 })));
        b.disabled = left <= 0;
      };
    });
  }
  const answers = {};
  body.querySelectorAll(".tq").forEach(li => li.querySelectorAll("[data-j]").forEach(b => b.onclick = () => {
    if (box.dataset.done) return;
    li.querySelectorAll("[data-j]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    answers[li.dataset.n] = +b.dataset.j;
  }));
  box.querySelector("#submit").onclick = () => {
    const missing = qs.length - Object.keys(answers).length;
    if (missing && !box.dataset.warned) { box.dataset.warned = 1; Pet.toast(`还有 ${missing} 题没做，再点一次“交卷”直接提交`, "warn"); return; }
    box.dataset.done = 1; stopAll();
    let right = 0;
    body.querySelectorAll(".tq").forEach(li => {
      const n = +li.dataset.n, q = qs[n], ok = answers[n] === q.a;
      if (ok) right++;
      li.classList.add(ok ? "ok" : "no");
      li.querySelectorAll("[data-j]").forEach(x => { if (+x.dataset.j === q.a) x.classList.add("right"); else if (+x.dataset.j === answers[n]) x.classList.add("wrong"); });
      if (q.it.why) { const w = li.querySelector(".twhy"); w.hidden = false; w.textContent = q.it.why; }
    });
    body.querySelectorAll(".ttrans").forEach(t => t.hidden = false);
    const pct = Math.round(right / qs.length * 100);
    box.querySelector("#submit").hidden = true;
    box.querySelector(".tres").innerHTML = `<section class="card result ${pct >= 66 ? "pass" : ""}"><h2>${right} / ${qs.length} · ${pct}%</h2><p>${pct >= 66 ? "通过！（ТРКИ 每部分 66% 及格）" : "还差一点，66% 及格。看看上面的解析再试一次吧。"}</p>
      <div class="row2"><a class="btn" href="#/trki/${sec.id}" data-again>再做一遍</a><a class="btn ghost" href="#/trki">其他部分</a></div></section>`;
    box.querySelector("[data-again]").onclick = e => { e.preventDefault(); route(); };
    box.querySelector(".tres").scrollIntoView({ behavior: "smooth", block: "center" });
    trkiReward(sec, pct);
  };
}

/* 写作: word count + self check */
function trkiWrite(sec) {
  const box = h(`<div class="page trki">${trkiHead(`${esc(sec.zh)} · <span lang="ru">${esc(sec.name)}</span>`)}<p class="hint">${esc(sec.introZh)}</p><div class="tbody"></div></div>`);
  app.append(box); startTimer(box, sec.minutes);
  const done = {};
  box.querySelector(".tbody").innerHTML = sec.tasks.map((t, i) => `<section class="card twrite" data-t="${i}"><h2 lang="ru">${esc(t.title)}</h2><p lang="ru">${esc(t.prompt)}</p>
    ${t.info ? `<ul class="tinfo" lang="ru">${t.info.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    <p class="hint">字数：${t.min}–${t.max} 词</p><textarea rows="8" lang="ru" spellcheck="false" placeholder="Пишите здесь…"></textarea>
    <div class="row"><span class="wc hint">0 词</span><button class="btn small" data-sub>提交</button></div><div class="tcheck" hidden></div></section>`).join("");
  box.querySelectorAll(".twrite").forEach(card => {
    const t = sec.tasks[+card.dataset.t], ta = card.querySelector("textarea"), wc = card.querySelector(".wc");
    const key = "trkiw" + card.dataset.t; ta.value = store.get(key, "");
    const count = () => (ta.value.match(/[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?/g) || []).length;
    const upd = () => { const n = count(); wc.textContent = `${n} 词`; wc.classList.toggle("ok", n >= t.min); store.set(key, ta.value); };
    ta.oninput = upd; upd();
    card.querySelector("[data-sub]").onclick = () => {
      const n = count();
      if (n < t.min) { Pet.toast(`还差 ${t.min - n} 个俄语词`, "warn"); return; }
      const c = card.querySelector(".tcheck"); c.hidden = false;
      c.innerHTML = `<p><b>对照评分要点自查：</b></p>${t.check.map((x, j) => `<label class="chk"><input type="checkbox" data-c="${j}"> <span lang="ru">${esc(x)}</span></label>`).join("")}<button class="btn small" data-fin>自查完成</button>`;
      c.querySelector("[data-fin]").onclick = () => {
        const got = c.querySelectorAll("input:checked").length;
        done[card.dataset.t] = Math.round(got / t.check.length * 100);
        c.querySelector("[data-fin]").disabled = true;
        Pet.toast(`自评 ${done[card.dataset.t]}%`, "good");
        if (Object.keys(done).length === sec.tasks.length) trkiReward(sec, Math.round(Object.values(done).reduce((a, b) => a + b, 0) / sec.tasks.length));
      };
    };
  });
}

/* 口语: listen to replicas / monologue with timer, record yourself, self check */
function recorder(el) {
  el.innerHTML = `<button class="btn small rec-b">${MIC} 录音</button><span class="rec-s hint"></span><audio controls hidden></audio>`;
  const b = el.querySelector(".rec-b"), st = el.querySelector(".rec-s"), au = el.querySelector("audio");
  let rec = null, t0 = 0, tick;
  b.onclick = async () => {
    if (rec) { rec.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { st.textContent = "这个浏览器不能录音，直接大声说出来就好"; return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      rec = new MediaRecorder(stream); const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { stream.getTracks().forEach(x => x.stop()); clearInterval(tick); rec = null; b.classList.remove("on"); b.innerHTML = `${MIC} 重新录`; au.hidden = false; au.src = URL.createObjectURL(new Blob(chunks, { type: chunks[0] && chunks[0].type || "audio/mp4" })); st.textContent = "听听自己的回答"; };
      rec.start(); t0 = Date.now(); b.classList.add("on"); b.textContent = "■ 停止";
      tick = setInterval(() => st.textContent = `录音中 ${Math.floor((Date.now() - t0) / 1000)} 秒`, 500);
    } catch { st.textContent = "没有麦克风权限"; }
  };
}
function trkiSpeak(sec) {
  const box = h(`<div class="page trki">${trkiHead(`${esc(sec.zh)} · <span lang="ru">${esc(sec.name)}</span>`)}<p class="hint">${esc(sec.introZh)}</p><div class="tbody"></div></div>`);
  app.append(box); startTimer(box, sec.minutes);
  const done = {};
  box.querySelector(".tbody").innerHTML = sec.tasks.map((t, i) => `<section class="card tspeak" data-t="${i}"><h2 lang="ru">${esc(t.title)}</h2>
    ${t.kind === "replies" ? `<ol class="treps">${t.replies.map((r, j) => `<li><button class="iconbtn" data-say="${j}" aria-label="听这句">${svgI("M4 9v6h4l5 4V5L8 9H4z", "fill")}</button><span lang="ru" class="rep" hidden>${esc(r)}</span><button class="btn ghost small" data-show>显示文字</button><div class="recw"></div></li>`).join("")}</ol>`
      : `<p lang="ru"><b>${esc(t.prompt)}</b></p><ul lang="ru">${t.plan.map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="row"><button class="btn small" data-timer>开始 ${Math.round(t.seconds / 60 * 10) / 10} 分钟计时</button><span class="mono hint" data-clock></span></div><div class="recw"></div>`}
    <div class="tcheck"><p><b>说完后自查：</b></p>${t.check.map(x => `<label class="chk"><input type="checkbox"> <span lang="ru">${esc(x)}</span></label>`).join("")}<button class="btn small" data-fin>自查完成</button></div></section>`).join("");
  box.querySelectorAll(".tspeak").forEach(card => {
    const t = sec.tasks[+card.dataset.t];
    card.querySelectorAll(".recw").forEach(recorder);
    card.querySelectorAll("[data-say]").forEach(b => b.onclick = () => playOne(b, t.replies[+b.dataset.say], 1));
    card.querySelectorAll("[data-show]").forEach(b => b.onclick = () => { b.previousElementSibling.hidden = false; b.remove(); });
    const tb = card.querySelector("[data-timer]");
    if (tb) tb.onclick = () => { const clk = card.querySelector("[data-clock]"), end = Date.now() + t.seconds * 1000; tb.disabled = true;
      const iv = setInterval(() => { const l = Math.max(0, end - Date.now()); clk.textContent = `${Math.floor(l / 60e3)}:${String(Math.floor(l / 1e3) % 60).padStart(2, "0")}`; if (!l) { clearInterval(iv); clk.textContent = "时间到"; tb.disabled = false; if (Pet.state.settings.meow) meowFor("correct"); } }, 300); };
    card.querySelector("[data-fin]").onclick = e => {
      const c = card.querySelector(".tcheck"), got = c.querySelectorAll("input:checked").length;
      done[card.dataset.t] = Math.round(got / t.check.length * 100); e.target.disabled = true; Pet.toast(`自评 ${done[card.dataset.t]}%`, "good");
      if (Object.keys(done).length === sec.tasks.length) trkiReward(sec, Math.round(Object.values(done).reduce((a, b) => a + b, 0) / sec.tasks.length));
    };
  });
}

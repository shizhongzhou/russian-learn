"use strict";
/* ========== 宠物俄语通 — 经典名著（公有领域俄语原文，来自维基文库） ==========
   data/books/index.json lists the books; data/books/<id>/<n>.json holds one chapter {t, p:[paragraphs]}.
   Reading: tap any word → look it up / hear it / hear the whole sentence. Each chapter read to the end = 小鱼干. */
let _classics;
const classicsIndex = () => _classics || (_classics = getJSON("data/books/index.json").catch(() => { _classics = null; return []; }));
const BOOK_EM = { "стихи": "🪶", "басня": "🦊", "сказка": "🐟", "пьеса": "🎭", "комедия": "🎭", "поэма": "📜", "роман": "📕", "роман в стихах": "📜", "повесть": "📗", "рассказ": "📘", "рассказ для детей": "🧸", "стихотворение в прозе": "🪶", "сказ": "🔧", "повесть-феерия": "⛵" };
const BOOK_ZH = { "Александр Пушкин": "普希金", "Михаил Лермонтов": "莱蒙托夫", "Николай Гоголь": "果戈理", "Иван Тургенев": "屠格涅夫", "Лев Толстой": "列夫·托尔斯泰", "Фёдор Достоевский": "陀思妥耶夫斯基", "Антон Чехов": "契诃夫", "Иван Крылов": "克雷洛夫", "Александр Грибоедов": "格里鲍耶陀夫", "Иван Гончаров": "冈察洛夫", "Николай Лесков": "列斯科夫", "Фёдор Тютчев": "丘特切夫", "Афанасий Фет": "费特", "Николай Некрасов": "涅克拉索夫", "Александр Блок": "勃洛克", "Сергей Есенин": "叶赛宁", "Иван Бунин": "蒲宁", "Александр Куприн": "库普林", "Александр Грин": "格林" };
const KIND_ZH = { "стихи": "诗", "басня": "寓言", "сказка": "童话诗", "пьеса": "剧本", "комедия": "喜剧", "поэма": "长诗", "роман": "长篇小说", "роман в стихах": "诗体小说", "повесть": "中篇小说", "рассказ": "短篇小说", "рассказ для детей": "儿童故事", "стихотворение в прозе": "散文诗", "сказ": "民间故事体", "повесть-феерия": "童话中篇" };
const bookProg = id => { const S = Pet.state; S.bookProg = S.bookProg || {}; return S.bookProg[id] || (S.bookProg[id] = { ch: 0, done: {} }); };
const readMins = n => Math.max(1, Math.round(n / 900));
const readLen = n => { const m = readMins(n); return m < 90 ? `${m} 分钟` : `${Math.round(m / 60)} 小时`; };

async function drawClassics(el) {
  const S = Pet.state;
  let lv = store.get("clsLv", "all");
  el.innerHTML = `<p class="empty3">加载书目…</p>`;
  const all = await classicsIndex();
  if (!all.length) { el.innerHTML = `<p class="empty3">名著正在整理中，很快就会上架。</p>`; return; }
  const draw = () => {
    const list = all.filter(b => lv === "all" || b.level === lv);
    const reading = all.filter(b => S.bookProg && S.bookProg[b.id] && S.bookProg[b.id].t).sort((a, b) => S.bookProg[b.id].t - S.bookProg[a.id].t).slice(0, 3);
    el.innerHTML = `<p class="hint cl-note">俄语原文，均为已进入公有领域的作品（来源：维基文库）。阅读时点任意单词可查词、朗读；读完一章得小鱼干。</p>
      ${reading.length ? `<h3 class="cl-h">继续阅读</h3><div class="cl-cont">${reading.map(b => { const p = S.bookProg[b.id]; return `<a href="#/book/${b.id}/${p.ch}" class="card"><span class="em">${BOOK_EM[b.kind] || "📖"}</span><span class="grow"><b lang="ru">${esc(b.title)}</b><small>${BOOK_ZH[b.author] || ""} · 第 ${p.ch + 1}/${b.ch.length} 部分</small></span>${GO}</a>`; }).join("")}</div>` : ""}
      <div class="pills cl-lv">${["all", ...ORDER].map(x => `<button data-l="${x}" aria-pressed="${x === lv}">${x === "all" ? "全部" : x}</button>`).join("")}</div>
      <div class="books">${list.map((b, i) => { const p = S.bookProg && S.bookProg[b.id]; const pct = p ? Math.round(Object.keys(p.done || {}).length / b.ch.length * 100) : 0;
        return `<a class="book" href="#/book/${b.id}"><span class="cover" style="background:${COVER_BG[(all.indexOf(b)) % COVER_BG.length]}"><i class="lvtag">${b.level}</i><span class="ct" lang="ru">${esc(b.title)}</span><span>${BOOK_EM[b.kind] || "📖"}</span></span>
          <b lang="ru">${esc(b.title)}</b><small>${BOOK_ZH[b.author] || esc(b.author)} · ${readLen(b.chars)}</small>${pct ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ""}</a>`; }).join("") || `<p class="empty3" style="grid-column:1/-1">这个级别还没有书</p>`}</div>`;
    el.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { lv = b.dataset.l; store.set("clsLv", lv); draw(); });
  };
  draw();
}

async function pageClassicBook(id) {
  const all = await classicsIndex(), b = all.find(x => x.id === id);
  const box = h(`<div class="page clbook">${head3(b ? esc(b.title) : "名著", "#/library/classics")}<div class="body"></div></div>`); app.append(box);
  const body = box.querySelector(".body");
  if (!b) { body.innerHTML = `<p class="empty3">找不到这本书</p>`; return; }
  const p = bookProg(id);
  body.innerHTML = `<section class="card clhero"><span class="cover" style="background:${COVER_BG[all.indexOf(b) % COVER_BG.length]}"><span class="ct" lang="ru">${esc(b.title)}</span><span>${BOOK_EM[b.kind] || "📖"}</span></span>
    <div class="grow"><h2 lang="ru">${esc(b.title)}</h2><p lang="ru">${esc(b.author)}</p><small>${BOOK_ZH[b.author] || ""} · ${b.year} 年 · ${KIND_ZH[b.kind] || esc(b.kind)}</small>
      <div class="tags"><i>${b.level}</i><i>${b.ch.length} 部分</i><i>约 ${readLen(b.chars)}</i></div></div></section>
    <a class="btn lime big" href="#/book/${id}/${p.ch || 0}">${p.t ? "继续阅读" : "开始阅读"}</a>
    ${b.ch.length > 1 ? `<h3 class="cl-h">目录</h3><nav class="rows clch">${b.ch.map((c, n) => `<a href="#/book/${id}/${n}"><span class="grow"><b lang="ru">${esc(c.t || "Часть " + (n + 1))}</b><small>约 ${readLen(c.n)}</small></span>${p.done && p.done[n] ? `<span class="okdot">✓</span>` : ""}${GO}</a>`).join("")}</nav>` : ""}
    <p class="hint">原文来源：<a href="${esc(b.src)}" target="_blank" rel="noopener">维基文库 Wikisource</a>（公有领域作品）。旧式拼写已转换为现代拼写。</p>`;
}

async function pageClassicRead(id, n) {
  const all = await classicsIndex(), b = all.find(x => x.id === id);
  const S = Pet.state;
  let fs = store.get("clFs", 19);
  const box = h(`<div class="page clread"><header class="v3head"><a class="back" href="#/book/${id}" aria-label="返回">${ic3(I3.back)}</a><h1 lang="ru">${b ? esc(b.title) : ""}</h1>
    <button class="ib" data-fs="-1" aria-label="字小一点">A−</button><button class="ib" data-fs="1" aria-label="字大一点">A+</button></header>
    <div class="cltext" lang="ru" style="font-size:${fs}px"><p class="empty3">加载中…</p></div>
    <nav class="clnav"></nav>
    <div class="clpop" hidden></div></div>`);
  app.append(box);
  if (!b) { box.querySelector(".cltext").innerHTML = `<p class="empty3">找不到这本书</p>`; return; }
  n = Math.max(0, Math.min(b.ch.length - 1, n));
  const txt = box.querySelector(".cltext"), pop = box.querySelector(".clpop");
  box.querySelectorAll("[data-fs]").forEach(x => x.onclick = () => { fs = Math.max(14, Math.min(28, fs + 2 * x.dataset.fs)); store.set("clFs", fs); txt.style.fontSize = fs + "px"; });
  let ch;
  try { ch = await getJSON(`data/books/${id}/${n}.json`); } catch (e) { txt.innerHTML = `<p class="empty3">加载失败，请检查网络</p>`; return; }
  const p = bookProg(id); p.ch = n; p.t = Date.now(); Pet.save();
  const wrap = s => esc(s).replace(/([А-Яа-яЁё́-]+)/g, `<w>$1</w>`);
  txt.innerHTML = `${ch.t ? `<h2>${esc(ch.t)}</h2>` : n === 0 ? `<h2>${esc(b.title)}</h2><p class="by">${esc(b.author)}</p>` : ""}` +
    ch.p.map(x => x.startsWith("## ") ? `<h3>${wrap(x.slice(3))}</h3>` : `<p${x.includes("\n") ? ' class="verse"' : ""}>${wrap(x)}</p>`).join("") + `<div class="clend"></div>`;
  box.querySelector(".clnav").innerHTML = `${n > 0 ? `<a class="btn soft" href="#/book/${id}/${n - 1}">上一部分</a>` : `<span></span>`}<span class="hint">${n + 1} / ${b.ch.length}</span>${n < b.ch.length - 1 ? `<a class="btn lime" href="#/book/${id}/${n + 1}">下一部分</a>` : `<a class="btn lime" href="#/library/classics">读完了</a>`}`;
  // finishing a chapter: reached the end and spent a reasonable time on it
  const t0 = Date.now(), need = Math.min(120e3, Math.max(15e3, b.ch[n].n * 25));
  const io = new IntersectionObserver(es => { if (!es.some(e => e.isIntersecting) || Date.now() - t0 < need || (p.done || {})[n]) return;
    p.done = p.done || {}; p.done[n] = 1; Pet.save(); io.disconnect();
    if (Pet.once(`book|${id}|${n}`, "read")) Pet.bonus({ g: 10, f: 1, text: "读完一部分名著", snackChance: 0.15 });
    logEvent("read", `读完《${b.title}》${b.ch.length > 1 ? "第 " + (n + 1) + " 部分" : ""}`);
  });
  io.observe(txt.querySelector(".clend"));
  // tap a word
  let cur;
  txt.onclick = async e => {
    const w = e.target.closest("w");
    if (!w) { pop.hidden = true; if (cur) cur.classList.remove("on"); return; }
    if (cur) cur.classList.remove("on"); cur = w; w.classList.add("on");
    const word = w.textContent.replace(/́/g, "");
    const para = w.closest("p,h3"), all = para.textContent;
    const pos = [...para.querySelectorAll("w")].indexOf(w);
    let off = 0, k = 0; for (const x of para.querySelectorAll("w")) { if (k++ === pos) break; off = all.indexOf(x.textContent, off) + x.textContent.length; }
    const st = Math.max(all.lastIndexOf(".", off) , all.lastIndexOf("!", off), all.lastIndexOf("?", off), all.lastIndexOf("\n", off)) + 1;
    const ends = [".", "!", "?", "\n"].map(c => all.indexOf(c, off)).filter(i => i >= 0);
    const sent = all.slice(st, ends.length ? Math.min(...ends) + 1 : all.length).trim();
    pop.hidden = false;
    pop.innerHTML = `<div class="row1"><b lang="ru">${esc(word)}</b><button class="ib" id="pw" aria-label="朗读单词">${ic3(I3.sound)}</button><span class="grow"></span><button class="ib" id="px" aria-label="关闭">${ic3(I3.x)}</button></div><p class="zh">查词中…</p>
      <div class="two2"><button class="btn soft" id="ps">朗读整句</button><a class="btn ghost" href="#/dict/word" id="pd">详细查词</a></div>`;
    pop.querySelector("#px").onclick = () => { pop.hidden = true; w.classList.remove("on"); };
    pop.querySelector("#pw").onclick = ev => playOne(ev.currentTarget, word);
    pop.querySelector("#pd").onclick = () => store.set("dictQ", word);
    pop.querySelector("#ps").onclick = ev => playOne(ev.currentTarget, sent);
    speak(word);
    const r = await lookup(word);
    if (cur !== w) return;
    pop.querySelector(".zh").innerHTML = r ? `${r.guess ? "可能是 " : ""}<span lang="ru">${esc(r.w)}</span>（${r.lv}）：${esc(r.zh)}` : "词库里暂时没有这个词，可以点「详细查词」";
  };
}

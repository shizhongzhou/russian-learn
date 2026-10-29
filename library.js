"use strict";
/* ========== 猫猫俄语通 — 我的书架: read your own PDF books on this device ========== */
let PDFJS = "vendor/pdfjs/";
let _pdfjs;
function loadPdfJs() {
  if (_pdfjs) return _pdfjs;
  _pdfjs = new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = PDFJS + "pdf.min.js";
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; res(window.pdfjsLib); };
    s.onerror = () => {
      if(PDFJS === "vendor/pdfjs/") { PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/"; s.src=PDFJS+"pdf.min.js"; }
      else {_pdfjs=null;rej(new Error("pdf.js"));}
    };
    document.head.append(s);
  });
  return _pdfjs;
}
/* books live in IndexedDB on this device only */
const BookDB = {
  db: null,
  open() {
    if (this.db) return this.db;
    return this.db = new Promise((res, rej) => {
      const r = indexedDB.open("mm_books", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("books", { keyPath: "id" });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction("books", mode), st = t.objectStore("books"); const r = fn(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); },
  put(b) { return this.tx("readwrite", st => st.put(b)); },
  get(id) { return this.tx("readonly", st => st.get(id)); },
  del(id) { return this.tx("readwrite", st => st.delete(id)); },
};
const bookMeta = () => store.get("mm_books_meta", []);
const setBookMeta = m => store.set("mm_books_meta", m);
const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB";

function pageLibrary() {
  const box = h(`<div class="page library"><header class="subhead"><a class="iconbtn" href="#/learn" aria-label="返回学习">${svgI(ICON.back, "stroke")}</a><h1 class="display small grow">我的书架</h1>
    <label class="btn small">导入 PDF<input type="file" accept="application/pdf,.pdf" multiple hidden id="pick"></label></header>
    <section class="card note"><p>把你自己的俄语教材、考试题导入进来阅读。书只保存在<b>这台设备</b>上，不会上传到网上。读书时选中俄语可以朗读、查词；每读 5 页，猫咪得 1 小鱼干。</p></section>
    <div class="books"></div><div class="drop hint">也可以把 PDF 文件拖到这里</div></div>`);
  app.append(box);
  const list = box.querySelector(".books");
  function draw() {
    const m = bookMeta();
    list.innerHTML = m.length ? m.map(b => `<div class="card book"><a href="#/read/${b.id}" class="bk-main"><span class="bk-cover">${esc((b.name.match(/[А-ЯA-Z一-鿿]/) || ["📖"])[0])}</span>
      <div><b>${esc(b.name)}</b><small>${b.pages ? `读到第 ${b.last || 1} / ${b.pages} 页` : "未打开"} · ${fmtSize(b.size)}</small><div class="bar thin"><i style="width:${b.pages ? Math.round((b.last || 1) / b.pages * 100) : 0}%"></i></div></div></a>
      <button class="iconbtn" data-del="${b.id}" aria-label="从书架删除">${svgI("M6 7h12 M9 7V5h6v2 M8 7l1 13h6l1-13", "stroke")}</button></div>`).join("")
      : `<p class="empty">书架还是空的。点右上角「导入 PDF」，选择手机或电脑里的电子书。</p>`;
    list.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      const id = b.dataset.del, bk = bookMeta().find(x => x.id === id);
      if (!b.dataset.sure) { b.dataset.sure = 1; Pet.toast(`再点一次删除《${esc(bk.name)}》`, "warn"); return; }
      await BookDB.del(id).catch(() => {}); setBookMeta(bookMeta().filter(x => x.id !== id)); draw();
    });
  }
  async function add(files) {
    for (const f of files) {
      if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { Pet.toast(`${esc(f.name)} 不是 PDF`, "warn"); continue; }
      const id = "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try {
        await BookDB.put({ id, blob: f });
        setBookMeta([{ id, name: f.name.replace(/\.pdf$/i, "").replace(/_/g, " "), size: f.size, added: Date.now(), last: 1, pages: 0 }, ...bookMeta()]);
        Pet.toast(`已加入书架：${esc(f.name)}`, "good");
      } catch { Pet.toast("存储空间不够，导入失败", "warn"); }
    }
    draw();
  }
  box.querySelector("#pick").onchange = e => add([...e.target.files]);
  box.ondragover = e => { e.preventDefault(); box.classList.add("over"); };
  box.ondragleave = () => box.classList.remove("over");
  box.ondrop = e => { e.preventDefault(); box.classList.remove("over"); add([...e.dataTransfer.files]); };
  draw();
}

/* quick dictionary lookup in the level word lists */
let _dict;
async function wordIndex() {
  if (_dict) return _dict;
  const m = new Map();
  for (const lv of ORDER) (await getJSON(`data/words_${lv}.json`)).forEach(r => { const k = r[0].replace(/́/g, "").toLowerCase().replace(/ё/g, "е"); if (!m.has(k)) m.set(k, { w: r[0], zh: r[1], lv }); });
  return _dict = m;
}
async function lookup(word) {
  const m = await wordIndex(), k = word.toLowerCase().replace(/ё/g, "е").replace(/[^а-я-]/g, "");
  if (!k) return null;
  if (m.has(k)) return m.get(k);
  for (let cut = 1; cut <= 3 && k.length - cut >= 3; cut++) {   // crude stemming: try dictionary words that share the stem
    const stem = k.slice(0, k.length - cut);
    for (const end of ["", "а", "я", "о", "е", "ь", "ть", "ться", "ый", "ий", "ой", "и", "ы"]) if (m.has(stem + end)) return { ...m.get(stem + end), guess: true };
  }
  return null;
}

async function pageReader(id) {
  const meta = resourceMeta(id) || bookMeta().find(b => b.id === id);
  const box = h(`<div class="page reader"><header class="subhead"><a class="iconbtn" href="${meta && meta.url ? '#/library/resources' : '#/library/shelf'}" aria-label="返回书架">${svgI(ICON.back, "stroke")}</a><div class="grow"><small>我的书架</small><b class="rd-title">${esc(meta ? meta.name : "")}</b></div><span class="hint rd-pg"></span></header>
    <div class="rd-view"><div class="rd-page"><canvas></canvas><div class="textLayer"></div></div><p class="empty rd-msg">打开中…</p></div>
    <div class="rd-sel" hidden><span class="rd-word" lang="ru"></span><span class="rd-zh"></span><button class="btn small" data-say>朗读</button></div>
    <nav class="rd-bar"><button class="iconbtn" data-prev aria-label="上一页">${svgI("M15 5l-7 7 7 7", "stroke")}</button>
      <label class="rd-goto"><input type="number" min="1" inputmode="numeric" aria-label="页码"><span class="rd-of"></span></label>
      <button class="iconbtn" data-zout aria-label="缩小">−</button><button class="iconbtn" data-zin aria-label="放大">+</button>
      <button class="iconbtn" data-next aria-label="下一页">${svgI("M9 5l7 7-7 7", "stroke")}</button></nav></div>`);
  app.append(box);
  const msg = box.querySelector(".rd-msg");
  if (!meta) { msg.textContent = "书架里没有这本书。"; return; }
  let pdf, lib;
  try {
    lib = await loadPdfJs();
    let source;
    if (meta.url) source = { url: meta.url, disableAutoFetch: true, disableStream: true, rangeChunkSize: 262144 };
    else {
      const rec = await BookDB.get(id);
      if (!rec) { msg.textContent = "这本书的文件找不到了，请重新导入。"; return; }
      source = { data: new Uint8Array(await rec.blob.arrayBuffer()) };
    }
    pdf = await lib.getDocument({ ...source, cMapUrl: PDFJS + "cmaps/", cMapPacked: true, standardFontDataUrl: PDFJS + "standard_fonts/" }).promise;
  } catch (e) { msg.textContent = "打不开这本书，请检查文件是否完整。"; return; }
  msg.remove();
  const S = Pet.state; S.readPages = S.readPages || {};
  const canvas = box.querySelector("canvas"), tl = box.querySelector(".textLayer"), pageEl = box.querySelector(".rd-page"), view = box.querySelector(".rd-view");
  const inp = box.querySelector(".rd-goto input"), of = box.querySelector(".rd-of"), pg = box.querySelector(".rd-pg");
  let n = Math.min(meta.last || 1, pdf.numPages), zoom = store.get("rd_zoom", 1), task, readT;
  of.textContent = `/ ${pdf.numPages}`; inp.max = pdf.numPages;
  const saveMeta = () => {
    if (meta.url) store.set("resourceProgress", { ...store.get("resourceProgress", {}), [id]: { last: n, pages: pdf.numPages } });
    else setBookMeta(bookMeta().map(b => b.id === id ? { ...b, last: n, pages: pdf.numPages } : b));
  };
  async function render() {
    inp.value = n; pg.textContent = `${n} / ${pdf.numPages}`; saveMeta();
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = (view.clientWidth - 2) / base.width * zoom, vp = page.getViewport({ scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.floor(vp.width * dpr); canvas.height = Math.floor(vp.height * dpr);
    canvas.style.width = Math.floor(vp.width) + "px"; canvas.style.height = Math.floor(vp.height) + "px";
    pageEl.style.width = Math.floor(vp.width) + "px"; pageEl.style.height = Math.floor(vp.height) + "px";
    if (task) task.cancel();
    task = page.render({ canvasContext: canvas.getContext("2d"), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
    await task.promise.catch(() => {});
    tl.innerHTML = ""; tl.style.setProperty("--scale-factor", scale);
    try { await lib.renderTextLayer({ textContentSource: await page.getTextContent(), container: tl, viewport: vp, textDivs: [] }).promise; } catch {}
    // a page counts as read after 20 s; every 5 new pages = 1 cat food (max 10 a day)
    clearTimeout(readT);
    readT = setTimeout(() => {
      const k = id + ":" + n; if (S.readPages[k]) return;
      S.readPages[k] = 1; const d = Pet.today(); S.readDay = S.readDay && S.readDay.d === d ? S.readDay : { d, n: 0 }; S.readDay.n++; Pet.save();
      if (S.readDay.n % 5 === 0 && S.readDay.n <= 50) Pet.bonus({ g: 8, f: 1, text: `今天读了 ${S.readDay.n} 页`, snackChance: 0.1 });
    }, 20000);
  }
  const go = d => { const m = Math.max(1, Math.min(pdf.numPages, n + d)); if (m !== n) { n = m; view.scrollTop = 0; render(); } };
  box.querySelector("[data-prev]").onclick = () => go(-1);
  box.querySelector("[data-next]").onclick = () => go(1);
  box.querySelector("[data-zin]").onclick = () => { zoom = Math.min(3, zoom + 0.25); store.set("rd_zoom", zoom); render(); };
  box.querySelector("[data-zout]").onclick = () => { zoom = Math.max(0.5, zoom - 0.25); store.set("rd_zoom", zoom); render(); };
  inp.onchange = () => { n = Math.max(1, Math.min(pdf.numPages, +inp.value || 1)); render(); };
  // swipe to turn pages (only when not zoomed in)
  let sx = null;
  view.addEventListener("touchstart", e => { sx = e.touches.length === 1 && zoom <= 1 ? e.touches[0].clientX : null; }, { passive: true });
  view.addEventListener("touchend", e => { if (sx == null || document.getSelection().toString()) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1); sx = null; });
  const key = e => { if (!document.body.contains(box)) return document.removeEventListener("keydown", key); if (e.target.tagName === "INPUT") return; if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
  document.addEventListener("keydown", key);
  // select Russian text → speak / look up
  const sel = box.querySelector(".rd-sel"), sw = sel.querySelector(".rd-word"), sz = sel.querySelector(".rd-zh");
  let selT;
  const onSel = () => { clearTimeout(selT); selT = setTimeout(async () => {
    if (!document.body.contains(box)) return document.removeEventListener("selectionchange", onSel);
    const t = document.getSelection().toString().replace(/\s+/g, " ").trim();
    if (!t || !/[А-Яа-яЁё]/.test(t) || !tl.contains(document.getSelection().anchorNode)) { sel.hidden = true; return; }
    sel.hidden = false; sw.textContent = t.length > 60 ? t.slice(0, 60) + "…" : t; sz.textContent = "";
    sel.querySelector("[data-say]").onclick = () => playOne(sel.querySelector("[data-say]"), t);
    if (!/\s/.test(t)) { const r = await lookup(t); sz.textContent = r ? `${r.guess ? "可能是 " : ""}${r.w.replace(/́/g, "́")}（${r.lv}）：${r.zh}` : "词库里没有这个词"; }
  }, 250); };
  document.addEventListener("selectionchange", onSel);
  const cleanup = new MutationObserver(() => {
    if (document.body.contains(box)) return;
    clearTimeout(readT); clearTimeout(selT); document.removeEventListener("selectionchange", onSel); document.removeEventListener("keydown", key);
    if (task) task.cancel(); pdf.destroy(); cleanup.disconnect();
  });
  cleanup.observe(app, { childList: true });
  render();
}

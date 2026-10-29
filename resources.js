"use strict";
function resourceMeta(id) {
  const b = STUDY_RESOURCES.find(x => x.id === id);
  return b ? { ...b, ...store.get("resourceProgress", {})[id] } : null;
}
function pageResources(initialLevel) {
  let lv = ORDER.includes(initialLevel) ? initialLevel : "all", kind = "all", query = "";
  const box = h(`<div class="page resources">${head3("学习资料", "#/learn")}
    <p class="v3sub">教材、考试与听力，按你的学习阶段整理。</p>
    <div class="resource-nav"><a aria-current="page" href="#/library/resources">学习资料</a><a href="#/library/classics">经典名著</a><a href="#/library/shelf">我的书架</a></div>
    <label class="resource-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="搜索教材、考试或技能" aria-label="搜索学习资料"></label>
    <nav class="pills resource-levels" aria-label="资料等级"></nav>
    <label class="resource-kind">资料类型 <select aria-label="资料类型"><option value="all">全部类型</option>${[...new Set(STUDY_RESOURCES.map(b => b.kind))].map(k => `<option>${esc(k)}</option>`).join("")}</select></label>
    <p class="hint resource-count" aria-live="polite"></p><div class="resource-list"></div>
    <p class="hint resource-note">资料随应用离线保存。教材的等级为学习建议；跨级教材会出现在多个等级。扫描版 PDF 可翻页阅读，图片中的文字无法直接选中查词。</p>
    <a class="btn ghost big" href="#/library/shelf">导入其他 PDF</a></div>`);
  app.append(box);
  function draw() {
    box.querySelector(".resource-levels").innerHTML = ["all", ...ORDER, "unassigned"].map(l => `<button data-level="${l}" aria-pressed="${lv === l}">${l === "all" ? "全部" : l === "unassigned" ? "待分级" : l}</button>`).join("");
    box.querySelectorAll("[data-level]").forEach(b => b.onclick = () => { lv = b.dataset.level; draw(); });
    const books = STUDY_RESOURCES.filter(b => (lv === "all" || (lv === "unassigned" ? !b.levels.length : b.levels.includes(lv))) && (kind === "all" || b.kind === kind) && `${b.name} ${b.source} ${b.kind} ${b.levels.join(" ")}`.toLowerCase().includes(query));
    box.querySelector(".resource-count").textContent = `${lv === "all" ? "全部" : lv === "unassigned" ? "待分级" : lv} · ${books.length} 份资料`;
    box.querySelector(".resource-list").innerHTML = books.map(b => {
      const progress = resourceMeta(b.id), href = b.type === "audio" ? `#/resource-audio/${b.id}` : `#/read/${b.id}`;
      return `<a class="card resource-card" href="${href}"><span class="resource-cover ${b.type}" aria-hidden="true">${b.type === "audio" ? "♫" : "书"}<small>${esc(b.kind)}</small></span><span class="grow"><b>${esc(b.name)}</b><span class="resource-tags">${b.levels.map(l => `<i>${l}</i>`).join("") || "<i>待分级</i>"}</span><small>${b.pages ? b.pages + " 页 · " : "音频 · "}${fmtSize(b.size)}${progress.last ? ` · 上次第 ${progress.last} 页` : ""}</small><small class="resource-advice">${esc(b.note)}</small></span><span aria-hidden="true">›</span></a>`;
    }).join("") || `<div class="card empty3">${query || kind !== "all" ? "没有匹配的资料，试试其他关键词。" : "这个等级暂时没有已导入的资料。"}</div>`;
  }
  box.querySelector("input").oninput = e => { query = e.target.value.trim().toLowerCase(); draw(); };
  box.querySelector("select").onchange = e => { kind = e.target.value; draw(); };
  draw();
}
function pageResourceAudio(id) {
  const b = resourceMeta(id);
  const box = h(`<div class="page resources">${head3(b ? esc(b.name) : "音频", "#/library/resources")}<section class="card resource-player"></section></div>`); app.append(box);
  const card = box.querySelector("section");
  if (!b || b.type !== "audio") { card.textContent = "找不到这份音频。"; return; }
  card.innerHTML = `<div class="audio-art" aria-hidden="true">♫</div><h2>${esc(b.name)}</h2><p class="hint">${esc(b.levels.join(" / ") || "待分级")} · 本机音频</p><audio controls preload="metadata" src="${b.url}" style="width:100%"></audio><p class="audio-error hint" hidden>音频暂时无法播放，请检查文件是否完整。</p><label class="resource-kind">播放速度 <select aria-label="播放速度">${[0.75,1,1.25,1.5].map(n => `<option value="${n}" ${n === 1 ? "selected" : ""}>${n}×</option>`).join("")}</select></label>`;
  const audio = card.querySelector("audio");
  audio.onloadedmetadata = () => { if (b.seconds && b.seconds < audio.duration) audio.currentTime = b.seconds; };
  audio.onerror = () => { card.querySelector(".audio-error").hidden = false; };
  card.querySelector("select").onchange = e => audio.playbackRate = +e.target.value;
  const save = () => store.set("resourceProgress", { ...store.get("resourceProgress", {}), [id]: { seconds: audio.currentTime } });
  audio.onpause = save;
  const observer = new MutationObserver(() => { if (document.body.contains(box)) return; audio.pause(); save(); audio.removeAttribute("src"); audio.load(); observer.disconnect(); });
  observer.observe(app, { childList: true });
}

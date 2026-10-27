"use strict";
/* ========== 宠物俄语通 v3 — new navigation, pages and the free-roaming pet ==========
   Loaded after the v2 modules; it replaces the router and the main pages and reuses the
   study engines (word lists, quiz, memo, grammar, dialogues, listening, TRKI, library, writing). */

/* ---------- small helpers ---------- */
const I3 = {
  back: "M15 5 L8 12 L15 19", go: "M9 6l6 6-6 6", spark: "M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3",
  book: "M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z",
  news: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5",
  shelf: "M5 4h4v16H5zM10 4h4v16h-4zM15 5l4 1-3 14-4-1z",
  cards: "M7 4h12v14H7zM4 7v13h12",
  play: "M8 5v14l11-7z", read: "M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5",
  words: "M4 6h10M4 12h7M4 18h10M17 8l3 3-3 3M14 18h6",
  gram: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  chat: "M4 5h16v11H9l-5 4z", ear: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3z",
  pen: "M4 20l4-1 11-11-3-3L5 16zM14 7l3 3", exam: "M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h4",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  clock: "M12 3a9 9 0 1 0 .01 0M12 7v5l3 2", star: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z",
  feather: "M20 4C11 4 6 9 5 19M9 15h6M7 11h8M11 7h7", user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.5 4-6.5 8-6.5s8 2 8 6.5",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z", cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.4-1.4L17 5l-3-1-1 2h-2L10 4 7 5l.4 2L6 8.3 4 8l-1 3 2 1v1l-2 1 1 3 2-.3 1.4 1.4L7 19l3 1 1-2h2l1 2 3-1-.4-2 1.4-1.4 2 .3 1-3-2-1z",
  folder: "M3 6h6l2 2h10v11H3z", list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  home: "M4 11l8-7 8 7M6 10v10h4v-6h4v6h4V10", globe: "M12 3a9 9 0 1 0 .01 0M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  plane: "M2 13l8-1 5-8h2l-2 8 5 .5 2-2h1l-1 3.5 1 3.5h-1l-2-2-5 .5 2 8h-2l-5-8-8-1z", camera: "M4 7h4l2-2h4l2 2h4v12H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  gift: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7C10 3 7 4 8 6M12 7c2-4 5-3 4-1", bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  search: "M11 4a7 7 0 1 0 .01 0M20 20l-4-4", translate: "M4 5h8M8 3v2M6 5c0 4 3 7 6 8M10 5c-1 4-3 6-6 8M13 20l4-9 4 9M14.5 17h5",
  paw: "M12 13c-3 0-5 3-5 5s2 2 5 2 5 0 5-2-2-5-5-5zM6 11a1.5 2 0 1 0 .01 0M18 11a1.5 2 0 1 0 .01 0M9 7a1.5 2 0 1 0 .01 0M15 7a1.5 2 0 1 0 .01 0",
  sofa: "M4 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 12h18v5H3zM5 17v2M19 17v2", shop: "M4 9l2-5h12l2 5M4 9h16v11H4zM9 20v-6h6v6",
  trash: "M6 7h12M9 7V5h6v2M8 7l1 13h6l1-13", plus: "M12 5v14M5 12h14", check: "M5 12l5 5 9-10", x: "M6 6l12 12M18 6L6 18",
  link: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1", vol: "M4 9v6h4l5 4V5L8 9z",
  sound: "M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12", photo: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01",
};
const ic3 = (d, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const tile3 = (d, tone = "") => `<span class="ti ${tone}">${ic3(d)}</span>`;
const GO = ic3(I3.go, "go");
const head3 = (title, back = "#/home", side = "") => `<header class="v3head"><a class="back" href="${back}" aria-label="返回">${ic3(I3.back)}</a><h1>${title}</h1>${side}</header>`;
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="11" cy="9" r="5.2" fill="#D9F25B"/><circle cx="20" cy="10.5" r="4.4" fill="#C9E83A"/><circle cx="9" cy="18" r="4.3" fill="#C9E83A"/><circle cx="16.5" cy="17" r="5.4" fill="#B5D92C"/><path d="M17 16h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5l-3.5 3v-3H17a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" fill="#1D1E1B"/><circle cx="19.5" cy="21" r="1" fill="#fff"/><circle cx="22.5" cy="21" r="1" fill="#fff"/><circle cx="25.5" cy="21" r="1" fill="#fff"/></svg>`;
const FISH_I = `<svg class="res-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="#F29A4A" d="M3 12c3-5 9-6 13-3l4-3v12l-4-3c-4 3-10 2-13-3z"/><circle cx="8" cy="11" r="1.2" fill="#fff"/></svg>`;
const DROP_I = `<svg class="res-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4E9BE8" d="M12 3 Q18 11 18 15 A6 6 0 0 1 6 15 Q6 11 12 3 Z"/></svg>`;
const PAW_I = `<svg class="res-i" viewBox="0 0 24 24" aria-hidden="true"><g fill="#F29A4A"><ellipse cx="12" cy="15.5" rx="4.6" ry="3.8"/><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6.5" r="2"/><circle cx="14" cy="6.5" r="2"/><circle cx="18" cy="10" r="2"/></g></svg>`;
const pickOne = a => a[Math.floor(Math.random() * a.length)];
const petName = () => Pet.state.cat.name || "小家伙";
const meowSafe = k => { if (Pet.state.settings.meow && !Pet.state.settings.mute) meowFor(k); };

/* activity log (动态记录) and inbox (消息) live in the save */
function logEvent(kind, text) {
  const S = Pet.state; S.log = S.log || [];
  S.log.unshift({ t: Date.now(), kind, text }); S.log.length = Math.min(S.log.length, 80); Pet.save();
}
function inbox(kind, title, text, em = "🎁") {
  const S = Pet.state; S.msgs = S.msgs || [];
  S.msgs.unshift({ t: Date.now(), kind, title, text, em, unread: true }); S.msgs.length = Math.min(S.msgs.length, 60); Pet.save();
}
const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? "刚刚" : s < 3600 ? `${Math.floor(s / 60)} 分钟前` : s < 86400 ? `${Math.floor(s / 3600)} 小时前` : `${Math.floor(s / 86400)} 天前`; };
const hhmm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

/* ---------- top bar & tabs ---------- */
function chrome3(active, { tool = false } = {}) {
  const v = Pet.view();
  const bar = document.getElementById("appbar");
  bar.querySelector(".brand-mark").innerHTML = LOGO;
  bar.querySelector(".brand-name").textContent = "宠物俄语通";
  bar.querySelector(".brand").setAttribute("aria-label", "宠物俄语通 主页");
  bar.querySelector(".res").innerHTML = !v.profile ? "" : tool
    ? `<a class="tool" href="#/dict">${ic3(I3.translate)}查词 / 翻译</a>`
    : `<a class="chip" href="#/shop" aria-label="小鱼干 ${v.food}">${FISH_I}${fmt(v.food)}</a><a class="chip" href="#/shop" aria-label="水 ${v.water}">${DROP_I}${fmt(v.water)}</a>`;
  const tabs = document.getElementById("tabbar");
  tabs.hidden = !v.profile;
  const labels = { home: "主页", learn: "学习", meow: "宠物", account: "账户" };
  tabs.querySelectorAll("a").forEach(a => {
    a.querySelector("span").textContent = labels[a.dataset.tab];
    if (a.dataset.tab === "meow") { a.href = "#/pet"; a.querySelector("svg").innerHTML = `<path d="${I3.paw}"/>`; }
    a.removeAttribute("aria-current");
    if (a.dataset.tab === active) a.setAttribute("aria-current", "page");
  });
}
Pet.onChange(() => {
  const res = document.querySelector("#appbar .res");
  const v = Pet.view();
  if (res && v.profile && !res.querySelector(".tool")) res.innerHTML = `<a class="chip" href="#/shop" aria-label="小鱼干 ${v.food}">${FISH_I}${fmt(v.food)}</a><a class="chip" href="#/shop" aria-label="水 ${v.water}">${DROP_I}${fmt(v.water)}</a>`;
});

/* ---------- router ---------- */
route = function () {
  stopAll();
  pageTimers.forEach(clearInterval); pageTimers = [];
  Roam.stopPage();
  const hash = location.hash || "#/home";
  const parts = hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const v = Pet.view();
  if (!v.profile && parts[0] !== "welcome") { location.replace("#/welcome"); return; }
  app.innerHTML = "";
  app.className = "";
  let tab = "home", roam = true, tool = false, title = "";
  const [p0, p1, p2] = parts;
  if (LEVELS[p0]) {
    tab = "learn"; renderLevel3(p0, p1 || "words", p2); title = p0;
  } else switch (p0) {
    case "welcome": tab = ""; roam = false; pageWelcome3(); break;
    case "learn": tab = "learn"; pageLearn3(); title = "学习"; break;
    case "ladder": tab = "learn"; pageLadder(); title = "俄语阶梯"; break;
    case "lv": tab = "learn"; pageLevel3(LEVELS[p1] ? p1 : v.lastLevel); break;
    case "grammar": tab = "learn"; pageGrammar3(LEVELS[p1] ? p1 : v.lastLevel); title = "语法体系"; break;
    case "alphabet": tab = "learn"; pageAlphabet(); title = "字母表"; break;
    case "news": tab = "learn"; p2 != null ? pageArticle(p1, +p2) : pageNews3(LEVELS[p1] ? p1 : v.lastLevel); title = "新闻媒体"; break;
    case "course": tab = "learn"; pageCourse(LEVELS[p1] ? p1 : v.lastLevel); title = "课程"; break;
    case "reading": tab = "learn"; pageReading(LEVELS[p1] ? p1 : v.lastLevel); title = "泛读"; break;
    case "quiz": tab = "learn"; pageQuiz(LEVELS[p1] ? p1 : v.lastLevel); break;
    case "memo": tab = "learn"; pageMemo(LEVELS[p1] || p1 === "mine" || /^t-\w+$/.test(p1 || "") ? p1 : v.lastLevel); break;
    case "shadow": tab = "learn"; roam = false; pageShadow3(LEVELS[p1] ? p1 : v.lastLevel, +p2 || 0); title = "跟读练习"; break;
    case "trki": tab = "learn"; pageTrki(p1); break;
    case "exams": tab = "learn"; pageExams3(LEVELS[p1] ? p1 : v.lastLevel, p2); title = "考试"; break;
    case "library": tab = "learn"; pageLibrary3(p1); title = "我的书架"; break;
    case "read": tab = "learn"; pageReader(p1); roam = false; break;
    case "write": tab = "learn"; pageWrite(LEVELS[p1] ? p1 : v.lastLevel); break;
    case "exam": tab = "learn"; pageExam(LEVELS[p1] ? p1 : v.lastLevel); break;
    case "pet": case "meow": tab = "meow"; pagePet3(); roam = false; title = "宠物"; break;
    case "nest": case "dress": tab = "meow"; pageNest(); roam = false; title = "小窝"; break;
    case "arrange": tab = "meow"; pageDress(); roam = false; break;
    case "shop": tab = "meow"; pageShop3(p1); title = "小卖部"; break;
    case "vet": tab = "meow"; pageVet(); roam = false; break;
    case "travel": tab = "meow"; pageTravel(p1); title = "旅游"; break;
    case "trip": tab = "meow"; roam = false; pageTrip(p1); break;
    case "photo": tab = "meow"; roam = false; pagePhoto(p1); break;
    case "album": tab = "meow"; roam = false; pageAlbum(); title = "旅行相册"; break;
    case "selfie": tab = "meow"; roam = false; pageSelfie(p1); title = "一起合影"; break;
    case "play": tab = "home"; roam = false; pagePlay(); break;
    case "rank": tab = "home"; pageRank(p1); break;
    case "friends": tab = "account"; pageFriends3(p1); title = "好友"; break;
    case "friend": tab = "account"; roam = false; pageFriendCat(p1); break;
    case "messages": tab = "account"; pageMessages(p1); title = "消息"; break;
    case "activity": tab = "meow"; pageActivity(); title = "动态记录"; break;
    case "records": tab = "account"; pageRecords(); title = "学习记录"; break;
    case "favs": tab = "account"; pageFavs(); title = "我的收藏"; break;
    case "partner": tab = "account"; pagePartner(); title = "我的伙伴"; break;
    case "settings": tab = "account"; pageSettings3(); title = "设置"; break;
    case "dict": tab = "home"; pageDict(p1); title = "查词与翻译"; break;
    case "admin": tab = "account"; roam = false; pageAdmin(); break;
    case "desk": tab = "account"; pageDesk(); break;
    case "account": tab = "account"; pageAccount3(); title = "账户"; break;
    default: tab = "home"; tool = true; pageHome3();
  }
  document.title = title ? `${title} · 宠物俄语通` : "宠物俄语通";
  chrome3(tab, { tool });
  Roam.set(roam && tab !== "");
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
};
Pet.setRoam = () => {};       // the v2 roaming cat is replaced by Roam (below)

/* ---------- the free-roaming pet ----------
   Walks, runs and jumps anywhere on the screen (above the tab bar), sits, lies down, looks around.
   Tap it to pet it; drag it and drop it somewhere. 小橘 uses the motion clips cut from video,
   other pets hop/bob with a still picture. */
const Roam = (() => {
  let el, img, bub, on = false, x = 40, y = 0, dir = 1, raf = 0, plan = null, idleT = 0, bubT = 0, drag = null, pageCtl = null;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const H = () => { const st = Pet.view().shownStage; return Math.round(78 * petK(st)); };
  const bounds = () => {
    const tb = document.getElementById("tabbar"), top = 70, bottom = (tb && !tb.hidden ? tb.getBoundingClientRect().top : innerHeight) - 4;
    return { x0: 4, x1: Math.max(60, Math.min(innerWidth, document.documentElement.clientWidth || innerWidth) - el.offsetWidth - 4), y0: Math.max(top + H(), bottom - Math.max(160, innerHeight * 0.42)), y1: bottom };
  };
  function ensure() {
    if (el) return;
    el = document.createElement("button");
    el.type = "button"; el.className = "roam2";
    el.innerHTML = `<span class="rb" hidden></span><span class="rp"><img alt="" draggable="false"></span>`;
    img = el.querySelector("img"); bub = el.querySelector(".rb");
    document.body.append(el);
    el.addEventListener("pointerdown", e => {
      drag = { sx: e.clientX, sy: e.clientY, ox: x, oy: y, moved: false, id: e.pointerId };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", e => {
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 8) return;
      if (!drag.moved) { drag.moved = true; plan = null; pose("look"); el.classList.remove("hopping", "bob"); say(pickOne(["放我下来～", "飞起来啦！", "喵？"])); }
      x = drag.ox + dx; y = drag.oy + dy; place();
    });
    const up = () => {
      if (!drag) return;
      const moved = drag.moved; drag = null;
      if (moved) { const b = bounds(); const ty = Math.min(b.y1, Math.max(b.y0, y)); fall(ty); return; }
      // a tap: pet it
      meowSafe("pet"); Pet.pet(); logEvent("pet", `摸了摸${petName()}，它很开心`);
      say(pickOne(isDog(Pet.state.cat.breed) ? ["汪！", "再摸摸～", "尾巴摇起来"] : ["喵～", "呼噜呼噜", "再摸摸我", "Мур-мур"]));
      hop(26);
    };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    addEventListener("resize", () => { if (on) { const b = bounds(); x = Math.min(x, b.x1); y = Math.min(Math.max(y, b.y0), b.y1); place(); } });
  }
  function place() { el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y - el.offsetHeight)}px)`; el.classList.toggle("left", dir < 0 !== clipDir < 0); }
  let clipDir = 1, curPose = "";
  function pose(p) {
    const v = Pet.view(), key = Pet.state.cat.breed;
    const src = animSrc(key, p, v.shownStage);
    clipDir = src ? ((ANIM_OK[src.split("/").pop().replace(".webp", "")] || {}).dir || 1) : 1;
    const want = src || petSrc(key, v.shownStage);
    if (img.getAttribute("src") !== want) img.src = want;
    el.style.setProperty("--h", H() + "px");
    curPose = p; el.classList.toggle("anim", !!src);
    el.classList.toggle("hopping", !src && (p === "run" || p === "walk"));
    el.classList.toggle("bob", false);
    place();
  }
  function say(t, ms = 2400) { if (!el || !t) return; bub.textContent = t; bub.hidden = false; clearTimeout(bubT); bubT = setTimeout(() => bub.hidden = true, ms); }
  /* movement: a plan is {tx, ty, speed, jump} animated with rAF */
  function go(tx, ty, kind) {
    const dist = Math.hypot(tx - x, ty - y); if (dist < 6) return idle();
    dir = tx < x ? -1 : 1;
    const jump = kind === "jump" || Math.abs(ty - y) > 60;
    const speed = kind === "run" ? 230 : jump ? 260 : 70;      // px / s
    plan = { fx: x, fy: y, tx, ty, t0: performance.now(), dur: Math.max(380, dist / speed * 1000), jump, arc: jump ? Math.min(140, 50 + Math.abs(ty - y) * 0.6) : 0 };
    pose(jump ? "run" : kind === "run" ? "run" : "walk");
    if (!raf) raf = requestAnimationFrame(step);
  }
  function step(now) {
    raf = 0;
    if (!plan || drag) return;
    const p = Math.min(1, (now - plan.t0) / plan.dur);
    const e = plan.jump ? p : p;
    x = plan.fx + (plan.tx - plan.fx) * e;
    y = plan.fy + (plan.ty - plan.fy) * e - (plan.jump ? Math.sin(Math.PI * p) * plan.arc : 0);
    place();
    if (p < 1) { raf = requestAnimationFrame(step); return; }
    const jumped = plan.jump; plan = null;
    if (jumped) { el.classList.remove("land"); void el.offsetWidth; el.classList.add("land"); }
    idle();
  }
  function fall(ty) { plan = { fx: x, fy: y, tx: x, ty, t0: performance.now(), dur: 320, jump: false, arc: 0 }; pose("look"); if (!raf) raf = requestAnimationFrame(step); }
  function hop(h = 30) { if (plan) return; plan = { fx: x, fy: y, tx: x, ty: y, t0: performance.now(), dur: 420, jump: true, arc: h }; if (!raf) raf = requestAnimationFrame(step); }
  function idle() {
    const v = Pet.view();
    const p = v.sick ? "lie" : pickOne(["sit", "sit", "look", "lie", "sit"]);
    pose(p);
    if (Math.random() < 0.25) say(pickOne(lines()));
  }
  let custom = null;
  const lines = () => custom || ["我在这儿陪你～", "Приве́т!", "学累了就摸摸我", "今天也一起学俄语吧", "答对题我就有小鱼干吃", "Ты молоде́ц!"];
  function tick() {
    if (!on || drag || plan || document.hidden) return;
    const v = Pet.view(); if (v.sick) return;
    const r = Math.random();
    if (r < 0.3 || reduce) { idle(); return; }
    const b = bounds();
    const tx = b.x0 + Math.random() * (b.x1 - b.x0);
    const ty = Math.random() < 0.55 ? b.y1 : b.y0 + Math.random() * (b.y1 - b.y0);
    go(tx, ty, r < 0.55 ? "walk" : r < 0.82 ? "run" : "jump");
  }
  setInterval(tick, 4200);
  return {
    set(want) {
      const S = Pet.state;
      on = want && S.profile && S.settings.roam !== false;
      ensure(); el.hidden = !on;
      if (!on) { plan = null; return; }
      custom = null;
      const b = bounds();
      if (!y) { x = b.x0 + 20; y = b.y1; }
      y = Math.min(Math.max(y, b.y0), b.y1);
      pose("sit");
    },
    say, hop, lines(l) { custom = l; },
    cheer(t) { if (on) { hop(34); if (t) say(t); } },
    stopPage() { if (pageCtl) { pageCtl(); pageCtl = null; } },
    onLeave(fn) { pageCtl = fn; },
  };
})();

/* ---------- 主页 ---------- */
function petPic(size, opts = {}) { const v = Pet.view(); return petImg(v.cat.breed, { stage: v.shownStage, size, ...opts }); }
function pageHome3() {
  const v = Pet.view(), S = Pet.state;
  const hr = new Date().getHours();
  const [zh, ru] = hr < 5 ? ["夜深了。", "Доброй ночи."] : hr < 11 ? ["早上好。", "Доброе утро."] : hr < 18 ? ["下午好。", "Добрый день."] : ["晚上好。", "Добрый вечер."];
  const acc = v.totalAnswered ? Math.round(v.totalCorrect / v.totalAnswered * 100) : 0;
  const lp = v.lastPlace, lv = lp ? lp.lv : v.lastLevel;
  const doing = v.sick ? "生病了，需要照顾" : v.full < 30 ? "饿了，等你喂饭" : v.drink < 30 ? "渴了，想喝水" : "正在自己玩";
  const pct = Math.min(100, Math.round(v.daily.correct / v.goal * 100));
  const box = h(`<div class="page h3">
    <section class="v3hero">
      <h1>${zh}</h1><p class="ru" lang="ru">${ru}</p>
      <span class="status"><i></i>${esc(doing)} · 刚刚更新</span>
      <a class="pet" href="#/pet" aria-label="去看${esc(petName())}">${petPic(128, { pose: "sit" })}</a>
    </section>
    ${v.sick ? `<a class="alert danger" href="#/vet"><b>${esc(petName())}生病了</b><span>${v.treated ? `康复中 ${v.recoverDays.length}/3 天` : "带它去宠物医院 →"}</span></a>` : ""}
    <nav class="quick">
      <a class="on" href="#/play">${tile3(I3.feather)}逗${isDog(v.cat.breed) ? "狗" : "猫"}棒</a>
      <a href="#/records">${tile3(I3.clock)}学习记录</a>
      <a href="#/favs">${tile3(I3.star)}我的收藏</a>
      <a href="#/memo/mine">${tile3(I3.book)}单词本</a>
    </nav>
    <section class="card"><h2 style="margin:0 0 8px;font-size:15px">继续学习</h2>
      <a class="cont" href="${lp ? `#/${lp.lv}/${lp.tab}` : `#/lv/${lv}`}"><span class="grow"><b>${lv} · ${esc(LEVELS[lv].title)}</b><small>${lp ? esc(lp.name) + " · 上次学到这里" : "对话与场景课"}</small></span>
      <span style="font-size:42px;line-height:1">📚</span>${GO}</a></section>
    <section class="card"><h2 style="margin:0;font-size:15px">学习数据</h2>
      <div class="trio"><div><b>${v.studyDays}</b><small>学习天数</small></div><div><b>${acc}%</b><small>正确率</small></div><div><b>${fmt(v.totalCorrect)}</b><small>答对题数</small></div></div></section>
    <a class="card plan" href="#/quiz/${v.lastLevel}" style="text-decoration:none;color:inherit">${tile3(I3.clock, "y")}
      <span class="grow"><b style="display:block">每日计划</b><small class="hint">${v.daily.done ? "今日目标已完成 🎉" : `答对 ${v.goal} 题完成今天的目标`}</small></span>
      <span class="ring" style="--p:${pct}"><span>${v.daily.correct}/${v.goal}</span></span></a>
  </div>`);
  app.append(box);
}

/* ---------- 学习 ---------- */
function pageLearn3() {
  const v = Pet.view();
  const box = h(`<div class="page">
    <section class="v3hero"><h1>学习</h1><p>系统学习，稳步进阶</p><span class="pet">${petPic(112, { pose: "look" })}</span></section>
    <a class="banner" href="#/ladder"><span><b>俄语阶梯 · A1–C2</b><small>从零基础到精通，系统课程</small></span><span class="pet">${petImg(v.cat.breed, { stage: 1, size: 86 })}</span>${GO}</a>
    <div class="tiles">
      <a class="tile" href="#/alphabet">${tile3("M4 19L9 5h1l5 14M6 14h7M15 12h4a2 2 0 0 1 0 4h-4v-8h3.5a2 2 0 0 1 0 4")}<span><b>字母表</b><small>掌握俄文字母</small></span></a>
      <a class="tile" href="#/news">${tile3(I3.news, "b")}<span><b>新闻媒体</b><small>读新闻学表达</small></span></a>
      <a class="tile" href="#/library">${tile3(I3.shelf, "g")}<span><b>书架</b><small>管理学习资料</small></span></a>
      <a class="tile" href="#/memo/${v.lastLevel}">${tile3(I3.cards, "y")}<span><b>背单词</b><small>科学记忆单词</small></span></a>
      <a class="tile" href="#/course/${v.lastLevel}">${tile3(I3.play, "g")}<span><b>课程</b><small>情景对话课</small></span></a>
      <a class="tile" href="#/reading/${v.lastLevel}">${tile3(I3.read, "b")}<span><b>泛读</b><small>阅读拓展提升</small></span></a>
      <a class="tile" href="#/shadow/${v.lastLevel}">${tile3(I3.mic, "o")}<span><b>跟读练习</b><small>听一句，跟着说</small></span></a>
      <a class="tile" href="#/exams/${v.lastLevel}">${tile3(I3.exam, "v")}<span><b>考试</b><small>ТРКИ · 词汇测验</small></span></a>
    </div>
    <a class="card plan" href="#/quiz/${v.lastLevel}" style="text-decoration:none;color:inherit">${tile3("M12 3a9 9 0 1 0 .01 0M8.5 12.5l2.5 2.5 5-5.5")}<span class="grow"><b style="display:block">每日小测</b><small class="hint">${v.lastLevel} · 答对 1 题得 2 小鱼干</small></span>${GO}</a>
  </div>`);
  app.append(box);
}
const LV_UNITS = lv => LEVELS[lv].total - (ORDER.indexOf(lv) ? LEVELS[ORDER[ORDER.indexOf(lv) - 1]].total : 0);
const LV_NAME = { A1: "入门", A2: "初级", B1: "中级", B2: "中高级", C1: "高级", C2: "精通" };
function lvProgress(lv) { const S = Pet.state, n = LV_UNITS(lv), heard = S.heardCount[lv] || 0; return { heard, n, pct: Math.min(100, Math.round(heard / n * 100)) }; }
function pageLadder() {
  const v = Pet.view();
  const box = h(`<div class="page">
    ${head3("俄语阶梯", "#/learn")}<p class="v3sub">从 A1 到 C2，循序渐进</p>
    <section class="v3hero" style="min-height:0;position:absolute;right:16px;top:58px">${petPic(96, { pose: "sit" })}</section>
    <nav class="ladder3" style="margin-top:60px">${ORDER.map(lv => { const p = lvProgress(lv); return `<a href="#/lv/${lv}" class="${lv === v.lastLevel ? "cur" : ""}"><span class="lv">${lv}</span><b>${LV_NAME[lv]}</b>
      <span><div class="pc">${fmt(p.heard)} / ${fmt(p.n)} 词</div><div class="bar"><i style="width:${p.pct}%"></i></div></span>${GO}</a>`; }).join("")}</nav>
  </div>`);
  app.append(box);
}
function pageLevel3(lv) {
  const S = Pet.state; S.lastLevel = lv; Pet.save();
  const p = lvProgress(lv);
  const topics = Object.keys(S.topics).filter(k => k.startsWith(lv + ":")).length;
  const box = h(`<div class="page">
    ${head3(`${lv} ${LV_NAME[lv]}`, "#/ladder")}<p class="v3sub">${esc(LEVELS[lv].desc)}</p>
    <div class="lvprog"><span>学习进度</span><div class="bar"><i style="width:${p.pct}%"></i></div><b>${p.pct}%</b></div>
    <div class="tiles">
      <a class="tile" href="#/${lv}/words">${tile3(I3.words)}<span><b>单词</b><small>词汇积累 · 已听 ${fmt(p.heard)}</small></span>${GO}</a>
      <a class="tile" href="#/grammar/${lv}">${tile3(I3.gram, "b")}<span><b>语法</b><small>掌握语法规则 · ${topics} 个专题</small></span>${GO}</a>
      <a class="tile" href="#/${lv}/dialogues">${tile3(I3.chat, "g")}<span><b>对话</b><small>日常情景对话</small></span>${GO}</a>
      <a class="tile" href="#/${lv}/listening">${tile3(I3.ear, "v")}<span><b>听力</b><small>听懂日常语速</small></span>${GO}</a>
      <a class="tile" href="#/reading/${lv}">${tile3(I3.read, "b")}<span><b>阅读</b><small>提升阅读能力</small></span>${GO}</a>
      <a class="tile" href="#/write/${lv}">${tile3(I3.pen, "o")}<span><b>写作</b><small>学会书面表达</small></span>${GO}</a>
      <a class="tile" href="#/shadow/${lv}">${tile3(I3.mic, "y")}<span><b>跟读</b><small>听一句，跟着说</small></span>${GO}</a>
      <a class="tile" href="#/memo/${lv}">${tile3(I3.cards, "g")}<span><b>背单词</b><small>本级词库</small></span>${GO}</a>
      <a class="tile wide" href="#/exams/${lv}">${tile3(I3.exam, "b")}<span><b>考试</b><small>ТРКИ 题型练习 · 本级词汇测验</small></span>${GO}</a>
    </div>
  </div>`);
  app.append(box);
}
/* the v2 level pages (words / dialogues / listening / news / grammar text) with the new header */
function renderLevel3(lv, tab, topic) {
  const names = { words: "单词", grammar: "语法", dialogues: "对话", listening: "听力", news: "新闻" };
  renderLevel(lv, tab);
  const head = h(`<div>${head3(`${lv} · ${names[tab] || "单词"}`, `#/lv/${lv}`)}</div>`);
  app.prepend(head.firstElementChild);
  const old = app.querySelector(".level-head h1"); if (old) old.remove();
  if (topic) {
    let n = 0;
    const t = setInterval(() => { const el = document.getElementById("g-" + topic); if (el || ++n > 40) { clearInterval(t); if (el) { el.open = true; el.scrollIntoView({ block: "start" }); } } }, 100);
  }
}
async function pageGrammar3(lv) {
  const box = h(`<div class="page">${head3("语法体系", `#/lv/${lv}`)}<p class="v3sub">${lv} 语法知识结构</p>
    <nav class="pills">${ORDER.map(x => `<a href="#/grammar/${x}" ${x === lv ? 'aria-current="page"' : ""}>${x}</a>`).join("")}</nav><div class="gtree"><p class="empty3">加载中…</p></div></div>`);
  app.append(box);
  const tree = box.querySelector(".gtree");
  let d; try { d = await getJSON(`data/grammar_${lv}.json`); } catch { tree.innerHTML = `<p class="empty3">${lv} 的语法正在编写中</p>`; return; }
  const S = Pet.state;
  tree.innerHTML = `<div class="root">${tile3(I3.gram).replace('class="ti "', 'class="ti" style="width:26px;height:26px;background:transparent"')}${lv} 语法</div>` +
    d.groups.map((g, gi) => `<div class="grp"><button class="${gi === 0 ? "open" : ""}" data-g="${gi}">${esc(g.name)}<small class="hint" style="font-weight:400">${g.topics.length} 个专题</small>${GO}</button>
      <ul ${gi === 0 ? "" : "hidden"}>${g.topics.map(t => `<li><a href="#/${lv}/grammar/${t.id}" class="${S.topics[lv + ":" + t.id] ? "done" : ""}">${esc(t.title)} <small>${esc(t.brief || "")}</small></a></li>`).join("")}</ul></div>`).join("");
  tree.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { const ul = b.nextElementSibling; ul.hidden = !ul.hidden; b.classList.toggle("open", !ul.hidden); });
}

/* 字母表 */
const ABC_INFO = { А: ["[a]", "🍉", "西瓜"], Б: ["[b]", "🍌", "香蕉"], В: ["[v]", "💧", "水"], Г: ["[g]", "🏙️", "城市"], Д: ["[d]", "🏠", "房子"], Е: ["[je]", "🌲", "云杉"], Ё: ["[jo]", "🎄", "圣诞树"],
  Ж: ["[ʐ]", "🪲", "甲虫"], З: ["[z]", "❄️", "冬天"], И: ["[i]", "🎲", "游戏"], Й: ["[j]", "🥛", "酸奶"], К: ["[k]", "🐈", "猫"], Л: ["[l]", "💡", "灯"], М: ["[m]", "👩", "妈妈"],
  Н: ["[n]", "👃", "鼻子"], О: ["[o]", "🪟", "窗户"], П: ["[p]", "👨", "爸爸"], Р: ["[r]", "🐟", "鱼"], С: ["[s]", "🧃", "果汁"], Т: ["[t]", "🎂", "蛋糕"], У: ["[u]", "🌅", "早晨"],
  Ф: ["[f]", "🚩", "旗子"], Х: ["[x]", "🍞", "面包"], Ц: ["[ts]", "🎪", "马戏团"], Ч: ["[tɕ]", "🍵", "茶"], Ш: ["[ʂ]", "🏫", "学校"], Щ: ["[ɕː]", "🐟", "狗鱼"], Ъ: ["（硬音符号）", "🚪", "单元门"],
  Ы: ["[ɨ]", "🧀", "奶酪"], Ь: ["（软音符号）", "🧂", "盐"], Э: ["[e]", "🔊", "回声"], Ю: ["[ju]", "👗", "裙子"], Я: ["[ja]", "🍎", "苹果"] };
function pageAlphabet() {
  let cur = "Ж";
  const box = h(`<div class="page">${head3("字母表", "#/learn")}<p class="v3sub">点击字母，听它的发音和例词。</p><div class="abc"></div><section class="card abc-card"></section></div>`);
  app.append(box);
  const grid = box.querySelector(".abc"), card = box.querySelector(".abc-card");
  function draw(play) {
    grid.innerHTML = ALPHABET.map(([L]) => `<button class="ru" data-l="${L}" aria-pressed="${L === cur}">${L}${L.toLowerCase()}</button>`).join("");
    grid.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { cur = b.dataset.l; draw(true); });
    const [L, name, ex] = ALPHABET.find(a => a[0] === cur), [ipa, em, zh] = ABC_INFO[L];
    card.innerHTML = `<button class="say3" aria-label="朗读">${ic3(I3.vol)}</button><div><div class="big ru">${L} ${L.toLowerCase()}</div><div class="ipa">${ipa}</div><div class="word ru" lang="ru">${esc(ex)}</div><div class="hint">（${zh}）</div></div><span class="emoji" aria-hidden="true">${em}</span>`;
    const say = () => playSequence([{ el: card, text: name }, { el: card, text: ex }]);
    card.querySelector(".say3").onclick = say;
    if (play) say();
  }
  draw(false);
}

/* 新闻媒体 */
const NEWS_EM = ["🏛️", "🧊", "📚", "🚀", "🌍", "🎭", "🏟️", "🌲", "🚆", "🎨", "🔬", "🌊"];
const NEWS_BG = ["#FDEBD8", "#E3F0FB", "#F1E8DD", "#E9E6FB", "#E2F4E8", "#FBE4EA"];
async function pageNews3(lv) {
  const box = h(`<div class="page">${head3("新闻媒体", "#/learn", `<span class="side">每周更新<br>按等级改写</span>`)}
    <nav class="pills">${ORDER.map(x => `<a href="#/news/${x}" ${x === lv ? 'aria-current="page"' : ""}>${x}</a>`).join("")}</nav><div class="news3"><p class="empty3">加载中…</p></div></div>`);
  app.append(box);
  const list = box.querySelector(".news3");
  const d = await getJSON(`data/content_${lv}.json`).catch(() => null);
  if (!d) { list.innerHTML = `<p class="empty3">加载失败，请稍后再试</p>`; return; }
  list.innerHTML = d.news.map((n, i) => `<a href="#/news/${lv}/${i}"><span class="th" style="background:${NEWS_BG[i % NEWS_BG.length]}">${NEWS_EM[(n.title.length + i) % NEWS_EM.length]}</span>
    <span><b lang="ru">${esc(n.title)}</b><small>${esc(n.titleZh)}</small><small>来源：${esc(n.source[0])} · ${esc(n.date)}</small><span class="lvtag ${/^B|^C/.test(lv) ? "b" : ""}">${lv}</span></span></a>`).join("");
}
async function pageArticle(lv, i) {
  const d = await getJSON(`data/content_${lv}.json`);
  const n = d.news[i]; if (!n) { location.hash = `#/news/${lv}`; return; }
  const box = h(`<div class="page">${head3("新闻", `#/news/${lv}`)}<div class="art"></div></div>`);
  app.append(box);
  const block = linesBlock("news", n.title, `${n.titleZh} · ${n.date}`, n.sentences.map(([ru, zh]) => ({ ru, zh })), { speeds: true, reward: "news", speak: true, read: true });
  block.append(h(`<p class="source hint">信息来源：<a href="${esc(n.source[1])}" target="_blank" rel="noopener">${esc(n.source[0])}</a>（按 ${lv} 难度改写，非原文）</p>`));
  box.querySelector(".art").append(block);
  Pet.state.lastPlace = { lv, tab: "news", name: "新闻 · " + n.titleZh }; Pet.save();
}
/* 课程 = 情景对话 + 听力 for one level */
async function pageCourse(lv) {
  const box = h(`<div class="page">${head3("课程", "#/learn")}<p class="v3sub">情景对话课 · 两种声音分角色朗读</p>
    <nav class="pills">${ORDER.map(x => `<a href="#/course/${x}" ${x === lv ? 'aria-current="page"' : ""}>${x}</a>`).join("")}</nav><div class="rows"></div></div>`);
  app.append(box);
  const d = await getJSON(`data/content_${lv}.json`);
  box.querySelector(".rows").innerHTML = d.dialogues.map((x, i) => `<a href="#/${lv}/dialogues">${tile3(I3.chat, ["g", "b", "o", "v"][i % 4])}<span class="grow"><b lang="ru">${esc(x.title)}</b><small>${esc(x.titleZh)} · ${x.lines.length} 句</small></span>${GO}</a>`).join("") +
    d.listening.map(x => `<a href="#/${lv}/listening">${tile3(I3.ear, "v")}<span class="grow"><b lang="ru">${esc(x.title)}</b><small>听力 · ${esc(x.titleZh)}</small></span>${GO}</a>`).join("");
}
/* 泛读 = news + listening texts as reading */
async function pageReading(lv) {
  const box = h(`<div class="page">${head3("泛读", "#/learn")}<p class="v3sub">选一篇，逐句读，点句子听发音</p>
    <nav class="pills">${ORDER.map(x => `<a href="#/reading/${x}" ${x === lv ? 'aria-current="page"' : ""}>${x}</a>`).join("")}</nav><div class="rows"></div>
    <a class="card plan" href="#/library" style="text-decoration:none;color:inherit">${tile3(I3.shelf, "g")}<span class="grow"><b style="display:block">读自己的书</b><small class="hint">导入 PDF 教材，选中俄语可朗读、查词</small></span>${GO}</a></div>`);
  app.append(box);
  const d = await getJSON(`data/content_${lv}.json`);
  box.querySelector(".rows").innerHTML = d.news.map((n, i) => `<a href="#/news/${lv}/${i}">${tile3(I3.news, "b")}<span class="grow"><b lang="ru">${esc(n.title)}</b><small>${esc(n.titleZh)} · ${n.sentences.length} 句</small></span>${GO}</a>`).join("");
}

/* ---------- 跟读练习: hold the mic → the kitten crouches (charging); speak → it runs ---------- */
async function pageShadow3(lv, start = 0) {
  const S = Pet.state, v = Pet.view();
  const box = h(`<div class="page sh3"><p class="crumb">学习 / 跟读</p>${head3("跟读练习", `#/learn`)}<p class="v3sub">听一句，跟着说</p>
    <nav class="pills">${ORDER.map(x => `<a href="#/shadow/${x}" ${x === lv ? 'aria-current="page"' : ""}>${x}</a>`).join("")}</nav>
    <section class="card sent"><p class="empty3">加载中…</p></section>
    <div class="nav2"><button class="btn ghost" id="prev">‹ 上一句</button><button class="btn" id="next">下一句 ›</button></div>
    <section class="stage"><span class="bubble">慢慢来，每一次开口都算数。</span><div class="speedlines">${[18, 34, 50, 26, 42].map((t, i) => `<i style="top:${t}px;left:${40 + i * 30}px;width:${30 + i * 8}px;animation-delay:${i * .12}s"></i>`).join("")}</div>
      <div class="runner">${petImg(v.cat.breed, { stage: v.shownStage, size: 120, pose: "sit" })}</div>
      <button class="mic" id="mic" aria-label="按住跟读">${ic3(I3.mic).replace("<path", '<path fill="none" stroke="#1D1E1B" stroke-width="2.2" stroke-linecap="round"')}</button>
      <p class="mic-l"><b id="micT">按住跟读</b><span id="micS">松开结束 · 回听自己的声音</span></p></section>
    <section class="card mine"><span>我的录音</span><button class="play2 iconbtn" id="mineP" aria-label="播放我的录音" disabled>${ic3(I3.play)}</button><div class="bar"><i id="mineBar" style="width:0"></i></div><span class="hint" id="mineT">00:00 / 00:00</span></section>
  </div>`);
  app.append(box);
  const c = await getJSON(`data/content_${lv}.json`);
  const lines = [...c.dialogues.flatMap(d => d.lines.map(l => [l[1], l[2]])), ...c.listening.flatMap(d => d.text), ...c.news.flatMap(d => d.sentences)].filter(l => l && l[0]);
  let k = Math.min(start, lines.length - 1), slow = store.get("shSlow", true), recURL = null, recAudio = null;
  const sent = box.querySelector(".sent"), runner = box.querySelector(".runner"), mic = box.querySelector("#mic"), lines3 = box.querySelector(".speedlines");
  const setPose = p => { const vv = Pet.view(); runner.innerHTML = petImg(vv.cat.breed, { stage: vv.shownStage, size: 120, pose: p }); runner.className = "runner " + p; lines3.classList.toggle("on", p === "run"); };
  function draw() {
    const [ru, zh] = lines[k];
    sent.innerHTML = `<span class="num">第 ${String(k + 1).padStart(2, "0")} 句</span><span class="cnt">${String(k + 1).padStart(2, "0")} / ${String(lines.length).padStart(2, "0")}</span>
      <p class="ru" lang="ru">${esc(ru)}</p><p class="zh">${esc(zh || "")}</p>
      <div class="ctl"><button class="play" aria-label="听原音">${ic3(I3.play)}</button><span>听原音</span><span class="wave">${Array.from({ length: 22 }, (_, i) => `<i style="height:${6 + Math.abs(Math.sin(i * 1.7)) * 20}px;animation-delay:${i * .04}s"></i>`).join("")}</span>
      <span>慢速</span><button class="switch" role="switch" aria-checked="${slow}" aria-label="慢速"></button></div>`;
    const wave = sent.querySelector(".wave");
    const play = async () => { wave.classList.add("on"); await speak(ru, { rate: slow ? 0.7 : 1 }); wave.classList.remove("on"); };
    sent.querySelector(".play").onclick = play;
    sent.querySelector(".switch").onclick = e => { slow = !slow; store.set("shSlow", slow); e.currentTarget.setAttribute("aria-checked", slow); };
    box.querySelector("#prev").disabled = k === 0;
    box.querySelector("#next").textContent = k + 1 < lines.length ? "下一句 ›" : "完成";
    setTimeout(play, 250);
  }
  box.querySelector("#prev").onclick = () => { if (k > 0) { k--; draw(); } };
  box.querySelector("#next").onclick = () => { if (k + 1 < lines.length) { k++; draw(); } else location.hash = `#/lv/${lv}`; };

  /* recording: MediaRecorder for playback, speech recognition for the score, an analyser to see when you speak */
  let rec = null, stream = null, chunks = [], ac = null, raf = 0, sr = null, heard = [], running = false, t0 = 0, holding = false;
  const micT = box.querySelector("#micT"), micS = box.querySelector("#micS");
  async function begin(e) {
    e.preventDefault(); if (holding) return; holding = true;
    stopAll(); mic.classList.add("rec"); micT.textContent = "正在听…"; micS.textContent = "说完松开"; setPose("charge"); running = false; heard = []; t0 = Date.now();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!holding) return finish();
      if (window.MediaRecorder) { chunks = []; rec = new MediaRecorder(stream); rec.ondataavailable = x => chunks.push(x.data); rec.start(); }
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      const loop = () => { an.getByteTimeDomainData(buf); let s = 0; for (const b of buf) s += (b - 128) ** 2; const rms = Math.sqrt(s / buf.length);
        if (!running && rms > 9) { running = true; setPose("run"); micT.textContent = "跑起来啦！继续说"; }
        raf = requestAnimationFrame(loop); };
      loop();
    } catch { micS.textContent = "没有麦克风权限，请在设置里允许"; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition, NSR = capPlugin("SpeechRecognition");
    try {
      if (NSR) { await NSR.requestPermissions(); NSR.addListener("partialResults", d => { if (d && d.matches) { heard = d.matches; if (!running) { running = true; setPose("run"); } } }); NSR.start({ language: "ru-RU", maxResults: 5, partialResults: true, popup: false }).then(r => { if (r && r.matches) heard = r.matches; }).catch(() => {}); sr = { stop: () => NSR.stop() }; }
      else if (SR) { const r = new SR(); r.lang = "ru-RU"; r.interimResults = true; r.maxAlternatives = 3; r.continuous = true;
        r.onresult = ev => { heard = [...ev.results].map(x => x[0].transcript).join(" ").trim() ? [[...ev.results].map(x => x[0].transcript).join(" ")] : heard; if (!running) { running = true; setPose("run"); } };
        r.onerror = () => {}; r.start(); sr = r; }
    } catch {}
  }
  async function finish() {
    if (!holding) return; holding = false;
    mic.classList.remove("rec"); cancelAnimationFrame(raf);
    try { sr && sr.stop(); } catch {} sr = null;
    await new Promise(r => setTimeout(r, 450));
    if (rec && rec.state !== "inactive") { await new Promise(r => { rec.onstop = r; rec.stop(); }); }
    if (stream) stream.getTracks().forEach(t => t.stop()); stream = null;
    try { ac && ac.close(); } catch {} ac = null;
    const dur = (Date.now() - t0) / 1000;
    if (chunks.length) { if (recURL) URL.revokeObjectURL(recURL); recURL = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })); recAudio = new Audio(recURL); box.querySelector("#mineP").disabled = false; box.querySelector("#mineT").textContent = `00:00 / 00:${String(Math.round(dur)).padStart(2, "0")}`; }
    rec = null;
    setPose("sit");
    micT.textContent = "按住跟读"; micS.textContent = "松开结束 · 回听自己的声音";
    if (dur < 0.6) { micS.textContent = "按住不放，说完再松开"; return; }
    const ru = lines[k][0];
    if (heard.length) {
      const best = heard.map(a => [a, scoreSpeech(ru, a)]).sort((a, b) => b[1] - a[1])[0];
      const sc = best[1];
      micS.innerHTML = `识别到：<span lang="ru">${esc(best[0])}</span> · <b>${sc} 分</b>`;
      if (sc >= 60) { Pet.scored(`speak:sh|${lv}|${k}`, sc); setPose(sc >= 85 ? "look" : "sit"); } else { Roam.say("慢一点，再读一遍～"); meowSafe("wrong"); }
    } else if (running) {
      micS.innerHTML = `读完啦！点「我的录音」听听自己，和原音比一比`;
      Pet.scored(`speak:sh|${lv}|${k}`, 70);
    } else micS.textContent = "没听到声音，靠近一点再试";
  }
  mic.addEventListener("pointerdown", begin);
  mic.addEventListener("pointerup", finish); mic.addEventListener("pointerleave", finish); mic.addEventListener("pointercancel", finish);
  mic.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) begin(e); });
  mic.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") finish(); });
  mic.oncontextmenu = e => e.preventDefault();
  box.querySelector("#mineP").onclick = () => {
    if (!recAudio) return; stopAll();
    const bar = box.querySelector("#mineBar");
    recAudio.currentTime = 0; recAudio.play();
    recAudio.ontimeupdate = () => { const d = recAudio.duration || 1; bar.style.width = (recAudio.currentTime / d * 100) + "%"; box.querySelector("#mineT").textContent = `00:${String(Math.floor(recAudio.currentTime)).padStart(2, "0")} / 00:${String(Math.round(isFinite(d) ? d : 0)).padStart(2, "0")}`; };
  };
  Roam.onLeave(() => { holding = false; try { sr && sr.stop(); } catch {} if (stream) stream.getTracks().forEach(t => t.stop()); });
  draw();
}

/* ---------- 考试 ---------- */
async function pageExams3(lv, tab = "real") {
  const S = Pet.state; S.trki = S.trki || {};
  const box = h(`<div class="page">${head3("考试 · ТРКИ", "#/learn")}
    <nav class="pills">${ORDER.map(x => `<a href="#/exams/${x}/${tab}" ${x === lv ? 'aria-current="page"' : ""}>${x}</a>`).join("")}</nav>
    <div class="seg" role="tablist">${[["real", "真题"], ["mock", "模拟"], ["wrong", "错题"]].map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" data-t="${k}">${l}</button>`).join("")}</div>
    <div class="exl" style="display:flex;flex-direction:column;gap:10px"></div></div>`);
  app.append(box);
  box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => location.hash = `#/exams/${lv}/${b.dataset.t}`);
  const list = box.querySelector(".exl");
  const ex = S.exams[lv];
  if (tab === "real") {
    list.innerHTML = `<section class="card"><p style="margin:0">ТРКИ 官方真题有版权，不能直接放进 App。这里先放<b>按真题结构原创的练习卷</b>；拿到授权的真题后会放在这里。</p></section>` +
      (lv === "B2" ? "" : `<a class="paper" href="#/exams/B2/mock">${ic3(I3.exam).replace("<svg", '<svg width="24" height="24" style="fill:none;stroke:#555;stroke-width:2"')}<span class="grow"><b>ТРКИ-2 练习卷 01</b><small>B2 · 原创练习卷 · 五个部分</small></span><span class="badge">去 B2</span></a>`);
    if (lv === "B2") list.innerHTML += mockList();
  } else if (tab === "mock") {
    list.innerHTML = (lv === "B2" ? mockList() : "") + `<a class="paper" href="#/exam/${lv}"><span class="grow"><b>${lv} 词汇测验</b><small>本级单词 20 题，16 题通过 · 通过得豪华罐头</small></span><span class="badge ${ex && ex.passed ? "ok" : "gray"}">${ex && ex.passed ? `已通过 ${ex.best}/20` : "未考"}</span>${GO}</a>
      <a class="paper" href="#/quiz/${lv}"><span class="grow"><b>每日小测</b><small>今天学过的词 + 生词本</small></span>${GO}</a>
      <a class="paper" href="#/write/${lv}"><span class="grow"><b>写作练习</b><small>${lv} 作文题</small></span>${GO}</a>
      <section class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <a class="tile" href="#/quiz/${lv}">${tile3(I3.list, "g")}<span><b>分项练习</b><small>按题型练习</small></span></a>
        <a class="tile" href="#/trki/lex">${tile3(I3.clock, "y")}<span><b>整套计时</b><small>按考试时间</small></span></a></div></section>`;
  } else {
    const n = Object.keys(S.wrongWords || {}).length;
    list.innerHTML = `<a class="paper" href="#/memo/mine"><span class="grow"><b>生词本 / 错题</b><small>答错的单词会自动收进来，答对就移出</small></span><span class="badge ${n ? "" : "ok"}">${n} 个</span>${GO}</a>` +
      Object.entries(S.trki).filter(([, r]) => !r.passed).map(([id]) => `<a class="paper" href="#/trki/${id}"><span class="grow"><b>ТРКИ-2 · ${id}</b><small>上次未通过，再练一次</small></span>${GO}</a>`).join("");
  }
  function mockList() {
    const parts = [["lex", "词汇 · 语法"], ["read", "阅读"], ["listen", "听力"], ["write", "写作"], ["speak", "口语"]];
    return parts.map(([id, name], i) => { const r = S.trki[id]; return `<a class="paper" href="#/trki/${id}"><span class="grow"><b>ТРКИ-2 练习卷 · ${name}</b><small>原创练习卷 · 第 ${i + 1} 部分</small></span><span class="badge ${r && r.passed ? "ok" : r ? "" : "gray"}">${r ? (r.passed ? "已通过" : "未通过") : "待练习"}</span>${GO}</a>`; }).join("");
  }
}

/* ---------- 书架 ---------- */
const COVER_BG = ["#F9E3C8", "#D9EBD2", "#F5E9D6", "#E4E7F7", "#FBE0E3", "#DDEFF3"];
const COVER_EM = ["⛪", "🌳", "📝", "📘", "🎻", "🪆"];
function pageLibrary3(tab = "shelf") {
  const S = Pet.state; S.bookFav = S.bookFav || {};
  const box = h(`<div class="page">${head3("我的书架", "#/learn", `<label class="btn small ghost">${ic3(I3.plus).replace("<svg", '<svg width="16" height="16" style="fill:none;stroke:currentColor;stroke-width:2.4"')}导入 PDF<input type="file" accept="application/pdf,.pdf" multiple hidden id="pick"></label>`)}
    <div class="seg" role="tablist"><button role="tab" aria-selected="${tab !== "fav"}" data-t="shelf">我的书架</button><button role="tab" aria-selected="${tab === "fav"}" data-t="fav">收藏</button></div>
    <div class="books"></div><p class="hint">书只保存在这台设备上，不会上传。阅读时选中俄语可以朗读、查词；每读 5 页得 1 小鱼干。</p></div>`);
  app.append(box);
  box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => location.hash = `#/library/${b.dataset.t}`);
  const list = box.querySelector(".books");
  function draw() {
    let m = bookMeta(); if (tab === "fav") m = m.filter(b => S.bookFav[b.id]);
    list.innerHTML = m.length ? m.map((b, i) => { const pct = b.pages ? Math.round((b.last || 1) / b.pages * 100) : 0;
      return `<div class="book"><a href="#/read/${b.id}" class="cover" style="background:${COVER_BG[i % COVER_BG.length]};text-decoration:none">${esc(b.name.slice(0, 12))}<span>${COVER_EM[i % COVER_EM.length]}</span></a>
        <b>${esc(b.name.slice(0, 16))}</b><small>已读 ${pct}%</small><div class="bar"><i style="width:${pct}%"></i></div>
        <div style="display:flex;gap:6px"><button class="btn small ghost" data-fav="${b.id}">${S.bookFav[b.id] ? "★" : "☆"}</button><button class="btn small ghost" data-del="${b.id}" aria-label="删除">${ic3(I3.trash).replace("<svg", '<svg width="16" height="16" style="fill:none;stroke:currentColor;stroke-width:2"')}</button></div></div>`; }).join("")
      : `<p class="empty3" style="grid-column:1/-1">${tab === "fav" ? "还没有收藏的书，在书架里点 ☆ 收藏" : "书架还是空的。点右上角「导入 PDF」，选择手机或电脑里的电子书。"}</p>`;
    list.querySelectorAll("[data-fav]").forEach(b => b.onclick = () => { const id = b.dataset.fav; S.bookFav[id] = !S.bookFav[id]; Pet.save(); draw(); });
    list.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      const id = b.dataset.del, bk = bookMeta().find(x => x.id === id);
      if (!b.dataset.sure) { b.dataset.sure = 1; Pet.toast(`再点一次删除《${esc(bk.name)}》`, "warn"); return; }
      await BookDB.del(id).catch(() => {}); setBookMeta(bookMeta().filter(x => x.id !== id)); draw();
    });
  }
  box.querySelector("#pick").onchange = async e => {
    for (const f of e.target.files) {
      if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { Pet.toast(`${esc(f.name)} 不是 PDF`, "warn"); continue; }
      const id = "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try { await BookDB.put({ id, blob: f }); setBookMeta([{ id, name: f.name.replace(/\.pdf$/i, "").replace(/_/g, " "), size: f.size, added: Date.now(), last: 1, pages: 0 }, ...bookMeta()]); Pet.toast(`已加入书架：${esc(f.name)}`, "good"); }
      catch { Pet.toast("存储空间不够，导入失败", "warn"); }
    }
    draw();
  };
  draw();
}

/* ---------- 宠物 ---------- */
function pagePet3() {
  const box = h(`<div class="page p3"></div>`);
  app.append(box);
  let flash = null;
  function draw() {
    const v = Pet.view(), S = Pet.state, dog = isDog(v.cat.breed);
    const sex = S.cat.sex === "f" ? "♀" : "♂";
    const say = v.sick ? "我不舒服……带我去看医生吧" : v.full < 40 ? "有点饿，想吃你做的饭～" : v.drink < 40 ? "好渴，想喝水" : v.happy < 45 ? "有点无聊，陪我玩一会儿吧" : pickOne(["今天也一起学习吧！", "Приве́т! 你来啦", "我又长大一点点了"]);
    const speedMode = S.settings.speed === "active" ? "活跃模式" : "标准模式";
    const row = (n, val, col) => `<div class="brow"><span>${n}</span><div class="bar"><i style="width:${val}%;background:${col}"></i></div><b>${Math.round(val)}%</b></div>`;
    box.innerHTML = `<div class="top"><h1>${esc(petName())}</h1><span class="sex" style="color:${S.cat.sex === "f" ? "#E8789A" : "#4E9BE8"}">${sex}</span><span class="lv">Lv.${v.level}</span>
        <a class="mode" href="#/activity">${ic3(I3.paw).replace("<svg", '<svg width="14" height="14" style="fill:none;stroke:currentColor;stroke-width:2"')}${speedMode}</a></div>
      <p class="hint" style="margin:-8px 0 0">${esc(petOf(v.cat.breed).name)} · ${ART_STAGE_NAMES[artStage(v.shownStage)]} · ${esc(v.stageName.replace("猫", dog ? "狗" : "猫"))}</p>
      ${v.sick ? `<a class="alert danger" href="#/vet"><b>${esc(petName())}生病了</b><span>${v.treated ? `康复中 ${v.recoverDays.length}/3 天` : "去宠物医院 →"}</span></a>` : ""}
      <div class="stagewrap">${ic3(I3.spark, "spark").replace('class="spark"', 'class="spark" style="left:12%;top:10%;fill:none;stroke:currentColor;stroke-width:2"')}
        <button aria-label="摸摸${esc(petName())}">${petPic(210, { pose: flash || (v.sick ? "lie" : "sit") })}</button></div>
      <section class="card bars"><div class="head"><span style="font-size:18px">✨</span><b>${esc(say)}</b><span>刚刚更新</span></div>
        ${row("饱腹", v.full, "#F29A4A")}${row("水分", v.drink, "#4E9BE8")}${row("心情", v.happy, "#8C7BE8")}${row("健康", v.health, v.health < 40 ? "#F06A5D" : "#58C27D")}
        <div class="brow"><span>成长</span><div class="bar"><i style="width:${v.nextAt ? Math.round((v.growth - v.prevAt) / (v.nextAt - v.prevAt) * 100) : 100}%"></i></div><b style="font-size:11px">${v.nextAt ? fmt(v.nextAt - v.growth) : "满级"}</b></div>
        <p class="hint" style="margin:0">${v.nextAt ? `再得 ${fmt(v.nextAt - v.growth)} 成长值长到下一阶段${artStage(v.stage + 1) > artStage(v.stage) ? "，会变大哦" : ""}` : "已经长到最大啦"}</p></section>
      <div class="acts"><button id="feed"><span class="e">🥣</span>喂食<small class="hint">${FISH_I} ${fmt(v.food)}</small></button><button id="petit"><span class="e">✋</span>抚摸</button><a class="ab" href="#/play"><span class="e">🪀</span>玩耍</a></div>
      <div class="acts"><button id="water"><span class="e">💧</span>喂水<small class="hint">${fmt(v.water)}</small></button><a class="ab" href="#/shop/food"><span class="e">🛍️</span>小卖部</a><a class="ab" href="#/activity"><span class="e">📋</span>动态</a></div>
      ${Object.entries(v.inv).filter(([, n]) => n > 0).length ? `<section class="card"><b>背包</b><div class="pills" style="margin-top:8px">${Object.entries(v.inv).filter(([, n]) => n > 0).map(([id, n]) => `<button data-snack="${id}">${Pet.SNACK_NAMES[id]} ×${n}</button>`).join("")}</div></section>` : ""}
      <div class="big2"><a class="dark" href="#/nest">${ic3(I3.home)}小窝<small>布置温馨的家</small></a><a class="lime" href="#/travel">${ic3(I3.globe)}旅游<small>带它去看世界</small></a></div>`;
    const tmp = (p, ms = 1600) => { flash = p; draw(); setTimeout(() => { flash = null; if (document.body.contains(box)) draw(); }, ms); };
    box.querySelector("#feed").onclick = () => { if (Pet.feed()) { logEvent("feed", `${petName()}吃饱了一点，饱腹 +8`); feedScene("kibble", draw); } };
    box.querySelector("#water").onclick = () => { if (Pet.giveWater()) { logEvent("water", `${petName()}喝了水，水分 +10`); feedScene("water", draw); } };
    box.querySelector("#petit").onclick = box.querySelector(".stagewrap button").onclick = () => { meowSafe(v.sick ? "sick" : "pet"); Pet.pet(); logEvent("pet", `摸了摸${petName()}，心情变好了`); tmp("look"); };
    box.querySelectorAll("[data-snack]").forEach(b => b.onclick = () => { const id = b.dataset.snack, it = SHOP.snack.find(x => x.id === id); Pet.state.inv[id]--; it.apply(Pet.state); Pet.save(); logEvent("snack", `${petName()}吃了${it.name}`); Pet.toast(`${esc(petName())}吃了${it.name}，好开心！`, "good"); feedScene(id, draw); });
  }
  draw();
}

/* ---------- 小窝 ---------- */
const FURN = [["bed", "猫窝", "🛏️"], ["tree", "猫爬架", "🪜"], ["toy", "小鱼玩具", "🐟"], ["scratch", "猫抓板", "🧶"], ["fish", "鱼缸", "🐠"], ["fountain", "饮水机", "⛲"], ["plant", "绿植", "🪴"], ["lamp", "台灯", "💡"]];
function pageNest() {
  const box = h(`<div class="page nest"></div>`);
  app.append(box);
  function draw() {
    const v = Pet.view(), S = Pet.state; S.owned = S.owned || {};
    const has = k => k === "tree" ? S.tree > 0 : k === "plant" || k === "lamp" ? !!S.owned[k] : !!S.decor[k];
    const n = FURN.filter(([k]) => has(k)).length;
    box.innerHTML = `${head3("小窝", "#/pet", `<label class="side" style="display:flex;align-items:center;gap:6px"><select id="scene" style="border:1px solid var(--line);border-radius:999px;padding:6px 10px;font:600 13px var(--zh);background:#fff">${Object.entries(SCENES).map(([k, s]) => `<option value="${k}" ${S.scene === k ? "selected" : ""} ${k === "living" || S.owned["scene_" + k] ? "" : "disabled"}>${s.name}${k === "living" || S.owned["scene_" + k] ? "" : "（未解锁）"}</option>`).join("")}</select></label>`)}
      <p class="v3sub">给${esc(petName())}一个温暖的家</p><div class="roomslot"></div>
      <section class="card"><div class="sec-t"><h2>家具清单 <span class="hint">(${n}/${FURN.length})</span></h2><a href="#/arrange">自由摆放 ›</a></div>
        <div class="furn" style="margin-top:12px">${FURN.map(([k, name, em]) => `<div class="${has(k) ? "on" : ""}"><span class="em">${em}</span>${name}</div>`).join("")}<div><a class="em" href="#/shop/furn" style="text-decoration:none;color:#999">+</a>添加</div></div></section>
      <div class="p3"><div class="big2"><a class="dark" href="#/arrange">${ic3(I3.sofa)}布置</a><a class="lime" href="#/shop/toy">${ic3(I3.shop)}小卖部</a></div></div>`;
    box.querySelector(".roomslot").append(roomBox(v, { label: false }));
    box.querySelector("#scene").onchange = e => { S.scene = e.target.value; Pet.save(); logEvent("nest", `小窝换成了「${SCENES[S.scene].name}」`); draw(); };
  }
  draw();
}

/* ---------- 小卖部 ---------- */
const SHOP3 = {
  food: [
    { id: "s1", name: "鸡肉干", em: "🍗", price: 8, kind: "snack" }, { id: "s2", name: "肉泥条", em: "🥫", price: 15, w: 2, kind: "snack" },
    { id: "s3", name: "冻干", em: "🧆", price: 25, kind: "snack" }, { id: "s4", name: "豪华罐头", em: "🍱", price: 40, w: 5, kind: "snack" },
    { id: "m1", name: "营养膏", em: "🧴", price: 12, w: 2, kind: "med" },
  ],
  toy: [
    { id: "toy", name: "羽毛逗猫棒", img: "img/item/feather.webp", price: 80 }, { id: "ball", name: "毛线球", img: "img/item/ball.webp", price: 120 },
    { id: "fishtoy", name: "小鱼玩具", em: "🐟", price: 180 }, { id: "scratch", name: "剑麻猫抓板", em: "🧶", price: 60 }, { id: "bone", name: "磨牙骨头", em: "🦴", price: 90 },
  ],
  furn: [
    { id: "bed", name: "舒适猫窝", em: "🛏️", price: 200 }, { id: "tree1", name: "猫爬架", em: "🪜", price: 300 }, { id: "plant", name: "绿植", em: "🪴", price: 120 },
    { id: "fish", name: "小鱼缸", em: "🐠", price: 260 }, { id: "fountain", name: "饮水机", em: "⛲", price: 220 }, { id: "lamp", name: "台灯", em: "💡", price: 90 },
  ],
  scene: [
    { id: "scene_window", name: "阳光窗台", em: "🪟", price: 280 }, { id: "scene_winter", name: "冬日壁炉", em: "🔥", price: 320 },
    { id: "scene_moscow", name: "莫斯科阁楼", em: "⛪", price: 400 }, { id: "scene_night", name: "星空屋顶", em: "🌌", price: 0, streak: 30 },
  ],
};
function pageShop3(tab) {
  let cur = SHOP3[tab] ? tab : "toy";
  const box = h(`<div class="page"></div>`);
  app.append(box);
  function draw() {
    const v = Pet.view(), S = Pet.state;
    box.innerHTML = `${head3("小卖部", "#/pet", `<span class="fishchip">${FISH_I.replace('class="res-i"', "")}${fmt(v.food)}</span>`)}<p class="v3sub">为${esc(petName())}挑选喜欢的物品吧！</p>
      <div class="seg" role="tablist">${[["food", "食物"], ["toy", "玩具"], ["furn", "家具"], ["scene", "场景"]].map(([k, l]) => `<button role="tab" aria-selected="${k === cur}" data-t="${k}">${l}</button>`).join("")}</div>
      <div class="shopgrid">${SHOP3[cur].map(it => { const own = !it.kind && S.owned[it.id], locked = it.streak && v.streak < it.streak && !own;
        return `<button class="sitem ${locked ? "dim" : ""}" data-id="${it.id}">${own ? `<span class="own">${ic3(I3.check)}</span>` : ""}<span class="em">${it.img ? `<img src="${it.img}" alt="">` : it.em}</span><b>${esc(it.name)}</b>
          <span class="price">${locked ? `连续 ${it.streak} 天` : own ? "已拥有" : `${FISH_I.replace('class="res-i"', "")}${it.price}${it.w ? ` +${it.w}💧` : ""}`}</span></button>`; }).join("")}</div>
      <p class="hint">答对 1 题得 1 小鱼干，听完一段对话、听力或新闻得 2 水。</p>`;
    box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { cur = b.dataset.t; draw(); });
    box.querySelectorAll("[data-id]").forEach(b => b.onclick = () => {
      const it = SHOP3[cur].find(x => x.id === b.dataset.id);
      if (!it.kind && S.owned[it.id]) { Pet.toast("已经拥有啦，去小窝里看看", ""); return; }
      if (it.streak) { if (v.streak >= it.streak) { S.owned[it.id] = 1; Pet.save(); Pet.toast(`解锁了${it.name}`, "good"); draw(); } else Pet.toast(`连续学习 ${it.streak} 天解锁（现在 ${v.streak} 天）`, "warn"); return; }
      if (!Pet.spend(it.price, it.w || 0)) { Pet.toast("小鱼干不够，先去学习赚一些吧", "warn"); return; }
      if (it.kind) { const src = [...SHOP.snack, ...SHOP.med].find(x => x.id === it.id); if (src && src.apply) src.apply(S); feedScene(it.kind === "snack" ? it.id : "kibble"); logEvent("snack", `${petName()}吃了${it.name}`); }
      else { S.owned[it.id] = 1; if (S.decor[it.id] !== undefined) S.decor[it.id] = 1; if (it.id === "tree1") S.tree = Math.max(S.tree, 1); if (it.id === "ball" || it.id === "fishtoy") S.decor.toy = 1; logEvent("buy", `买了${it.name}`); }
      Pet.save(); meowSafe("correct"); Pet.toast(it.kind ? `${esc(petName())}吃了${it.name}，好开心！` : `买到了${it.name}！`, "good"); draw();
    });
  }
  draw();
}

/* ---------- 旅游 ---------- */
const TRAVEL = {
  俄罗斯: [["moscow", "莫斯科", "Москва", "红场和洋葱顶教堂", "⛪", "#F6D9CF", 200, "UTC+3"], ["spb", "圣彼得堡", "Санкт-Петербург", "白夜和冬宫", "🏛️", "#DDE6F6", 260, "UTC+3"], ["baikal", "贝加尔湖", "Байкал", "世界最深的湖", "🏞️", "#D6EEF0", 320, "UTC+8"], ["kazan", "喀山", "Казань", "千年古城", "🕌", "#EDE4F7", 240, "UTC+3"]],
  日本: [["tokyo", "东京", "Токио", "霓虹与樱花", "🗼", "#FBE1E6", 300, "UTC+9"], ["kyoto", "京都", "Киото", "千年古都和寺庙", "⛩️", "#F7E8D6", 280, "UTC+9"], ["osaka", "大阪", "Осака", "美食之都", "🏯", "#E6EEF9", 260, "UTC+9"]],
  法国: [["paris", "巴黎", "Париж", "浪漫之都，与它一起看埃菲尔铁塔", "🥐", "#DCE9F7", 360, "UTC+1"], ["lyon", "里昂", "Лион", "历史古城，品味法式浪漫", "🏘️", "#F6E3D2", 320, "UTC+1"], ["nice", "尼斯", "Ницца", "地中海的阳光和蔚蓝海岸", "🏖️", "#D7EEF2", 340, "UTC+1"], ["marseille", "马赛", "Марсель", "港口城市，感受独特风情", "⛵", "#E3EEF8", 330, "UTC+1"]],
  中国: [["beijing", "北京", "Пекин", "长城和故宫", "🏯", "#F7DED6", 150, "UTC+8"], ["harbin", "哈尔滨", "Харбин", "冰雪之城，俄式建筑", "❄️", "#E0EDF8", 160, "UTC+8"], ["chengdu", "成都", "Чэнду", "大熊猫的家", "🐼", "#E4F3E3", 170, "UTC+8"]],
};
const CITY = Object.fromEntries(Object.entries(TRAVEL).flatMap(([c, l]) => l.map(([id, zh, ru, desc, em, bg, price, tz]) => [id, { id, country: c, zh, ru, desc, em, bg, price, tz }])));
function pageTravel(country) {
  const cur = TRAVEL[country] ? country : "法国", S = Pet.state; S.trips = S.trips || {};
  const box = h(`<div class="page">${head3("选择旅行目的地", "#/pet", `<span style="font-size:34px">🌍</span>`)}<p class="v3sub">带${esc(petName())}去看看更大的世界吧！</p>
    <nav class="pills">${Object.keys(TRAVEL).map(c => `<a href="#/travel/${c}" ${c === cur ? 'aria-current="page"' : ""}>${c}</a>`).join("")}</nav>
    <div class="cities">${TRAVEL[cur].map(([id]) => { const c = CITY[id]; return `<a class="city" href="#/trip/${id}"><span class="ph" style="background:${c.bg}">${c.em}</span><span><b>${c.zh}</b><small lang="ru">${c.ru}</small><small>${esc(c.desc)}</small>${S.trips[id] ? `<span class="lvtag">去过 ✓</span>` : ""}</span>${GO}</a>`; }).join("")}</div>
    <a class="card plan" href="#/album" style="text-decoration:none;color:inherit">${tile3(I3.photo, "b")}<span class="grow"><b style="display:block">旅行相册</b><small class="hint">${Object.keys(S.trips).length} 个城市的合影</small></span>${GO}</a></div>`);
  app.append(box);
}
function globeSVG(c) {
  return `<svg class="globe" viewBox="0 0 300 300" role="img" aria-label="地球，飞往${c.zh}"><defs><radialGradient id="gl" cx="38%" cy="32%"><stop offset="0" stop-color="#9FD3FF"/><stop offset=".6" stop-color="#3E8EE0"/><stop offset="1" stop-color="#1F5FAE"/></radialGradient></defs>
    <circle cx="150" cy="150" r="128" fill="url(#gl)"/>
    <path d="M70 110c20-30 60-40 80-30s10 30-10 40-30 30-50 20-30-10-20-30zM170 70c20 0 50 10 60 30s-10 30-30 30-40-20-30-60zM180 170c20-10 50 0 50 20s-20 40-40 40-30-20-10-60zM90 190c10 0 20 20 10 40s-30 0-30-20 10-20 20-20z" fill="#7CC77A" opacity=".9"/>
    <path d="M90 120 Q150 40 215 105" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="7 7"/>
    <g transform="translate(150 70) rotate(18)"><path d="${I3.plane}" transform="translate(-12 -12)" fill="#fff"/></g>
    <g transform="translate(215 105)"><circle r="7" fill="#1D1E1B"/><circle r="3" fill="#fff"/><rect x="10" y="-26" rx="8" width="${c.zh.length * 16 + 20}" height="26" fill="#1D1E1B"/><text x="${20 + c.zh.length * 8}" y="-8" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">${c.zh}</text></g></svg>`;
}
function pageTrip(id) {
  const c = CITY[id]; if (!c) { location.hash = "#/travel"; return; }
  const v = Pet.view(), S = Pet.state; S.trips = S.trips || {};
  const off = +c.tz.replace("UTC", ""), local = new Date(Date.now() + (off * 60 + new Date().getTimezoneOffset()) * 60000);
  const enough = v.food >= c.price;
  const box = h(`<div class="page">${head3(c.zh, `#/travel/${c.country}`)}
    ${globeSVG(c)}<p class="hint" style="text-align:center">拖动地球查看其他城市 · 当前目的地 <span lang="ru">${c.ru}</span></p>
    <section class="card" style="display:grid;grid-template-columns:1fr 1fr;text-align:center"><div><small class="hint">当地时间</small><b style="display:block;font-size:22px">${hhmm(local)}</b></div><div style="border-left:1px solid var(--line)"><small class="hint">时区</small><b style="display:block;font-size:22px">${c.tz}</b></div></section>
    <section class="card"><div class="ticket"><span class="plane">${ic3(I3.plane)}</span><span class="grow"><b style="font-size:17px">${c.zh}机票</b><small class="hint" style="display:block">${c.price} 小鱼干</small></span></div>
      <p class="hint" style="margin:10px 0 6px">我有：${FISH_I} ${fmt(v.food)} 小鱼干</p><div class="bar"><i style="width:${Math.min(100, v.food / c.price * 100)}%;background:var(--orange)"></i></div>
      <p style="margin:6px 0 0;color:${enough ? "var(--lime-deep)" : "var(--red)"};font-size:13px">${enough ? "小鱼干够啦，出发吧！" : `还差 ${c.price - v.food} 小鱼干`}</p></section>
    ${enough ? `<button class="btn big lime" id="fly">✈️ 出发去${c.zh}</button>` : `<a class="btn big" href="#/learn">去学习攒小鱼干 ›</a>`}
    ${S.trips[id] ? `<a class="btn big ghost" href="#/photo/${id}">看看在${c.zh}的照片</a>` : ""}</div>`);
  app.append(box);
  const fly = box.querySelector("#fly");
  if (fly) fly.onclick = () => {
    if (!Pet.spend(c.price, 0)) return;
    S.trips[id] = S.trips[id] || { t: Date.now() };
    Pet.save(); logEvent("travel", `和${petName()}一起去了${c.zh}`); inbox("system", "旅行成功", `你和${petName()}到达了${c.zh}！`, "✈️");
    meowSafe("correct"); location.hash = `#/photo/${id}`;
  };
}
function pagePhoto(id) {
  const c = CITY[id]; if (!c) { location.hash = "#/travel"; return; }
  const v = Pet.view();
  const box = h(`<div class="page">${head3("旅行合影", `#/trip/${id}`)}
    <div class="photo3" style="background:linear-gradient(180deg,${c.bg},#fff 75%)"><span class="land">${c.em}</span><span class="stamp">${c.zh.toUpperCase()}</span>${petPic(240, { pose: "sit" })}</div>
    <div class="seg" role="tablist"><button role="tab" aria-selected="true">仅宠物</button><button role="tab" aria-selected="false" id="both">一起合影</button></div>
    <a class="btn big lime" href="#/selfie/${id}">${ic3(I3.camera).replace("<svg", '<svg width="22" height="22" style="fill:none;stroke:currentColor;stroke-width:2"')} 拍张自拍，一起合影</a>
    <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><a class="btn ghost" href="#/selfie/${id}">拍摄头像</a><a class="btn ghost" href="#/selfie/${id}">从相册选择</a></div>
    <p class="hint" style="text-align:center">“仅宠物”的照片已存进旅行相册</p></div>`);
  app.append(box);
  box.querySelector("#both").onclick = () => location.hash = `#/selfie/${id}`;
}
function pageSelfie(id) {
  const c = CITY[id] || CITY.paris;
  const box = h(`<div class="page">${head3("一起合影", id ? `#/photo/${id}` : "#/album")}
    <div class="photo3" style="background:linear-gradient(180deg,${c.bg},#fff 75%);aspect-ratio:4/3"><span class="land">${c.em}</span>${petPic(180, { pose: "sit" })}</div>
    <div class="pills"><button aria-pressed="true">抱抱</button><button>并肩</button><button>击掌</button></div>
    <section class="card"><b>AI 合影 <span class="soon">即将上线</span></b><p class="hint" style="margin:6px 0 0">拍一张自拍，AI 会把你画成卡通形象，和${esc(petName())}在${c.zh}合影。这个功能需要接入 AI 生图服务，接好后就能用。</p></section>
    <button class="btn big lime" disabled>拍张自拍，开始合影</button></div>`);
  app.append(box);
}
function pageAlbum() {
  const S = Pet.state, ids = Object.keys(S.trips || {});
  const box = h(`<div class="page">${head3("旅行相册", "#/travel")}
    ${ids.length ? `<div class="books">${ids.map(id => { const c = CITY[id]; return c ? `<a class="book" href="#/photo/${id}"><span class="cover" style="background:linear-gradient(180deg,${c.bg},#fff);display:grid;place-items:center;font-size:48px">${c.em}</span><b>${c.zh}</b><small>${new Date(S.trips[id].t).toLocaleDateString("zh-CN")}</small></a>` : ""; }).join("")}</div>`
      : `<p class="empty3">还没有旅行照片。攒够小鱼干，带${esc(petName())}去旅行吧！</p><a class="btn big lime" href="#/travel">选择目的地</a>`}</div>`);
  app.append(box);
}

/* ---------- 好友 · 新朋友 ---------- */
function avatarPet(breed, stage = 2, size = 54) { return `<span class="av">${petImg(PETS[breed] ? breed : "orange", { stage, size })}</span>`; }
function pageFriends3(tab = "list") {
  const box = h(`<div class="page">${head3("好友", "#/account")}<div class="seg" role="tablist"><button role="tab" aria-selected="${tab !== "new"}" data-t="list">好友</button><button role="tab" aria-selected="${tab === "new"}" data-t="new">新朋友<span class="tbadge" id="nb" hidden></span></button></div><div class="fb3"><p class="empty3">加载中…</p></div></div>`);
  app.append(box);
  box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => location.hash = `#/friends/${b.dataset.t}`);
  const body = box.querySelector(".fb3");
  if (!Cloud.enabled()) { body.innerHTML = `<p class="empty3">好友功能需要联网</p>`; return; }
  async function draw() {
    let r;
    try { await Cloud.push(); r = await Cloud.call("friendList"); } catch (e) { body.innerHTML = `<p class="empty3">${esc(e.message)}</p><button class="btn big ghost" onclick="loginSheet(()=>route())">登录后使用好友</button>`; return; }
    const nb = box.querySelector("#nb"); if (r.incoming.length) { nb.hidden = false; nb.textContent = r.incoming.length; }
    const online = p => p.lastActive && Date.now() - p.lastActive < 10 * 60000;
    if (tab !== "new") {
      body.innerHTML = `<button class="btn big lime" id="addB">${ic3(I3.plus).replace("<svg", '<svg width="20" height="20" style="fill:none;stroke:currentColor;stroke-width:2.6"')} 添加好友</button>
        <div class="sec-t"><h2>我的好友 (${r.friends.length})</h2><span>好友码 <b>${r.myCode || "—"}</b> · <a href="#" id="copy">复制</a></span></div>
        <div class="rows">${r.friends.map(p => `<a class="fr" href="#/friend/${encodeURIComponent(p.uid)}">${avatarPet(p.breed, p.stage)}<span class="grow"><b>${esc(p.nick)}</b><small class="${online(p) ? "on" : ""}">${online(p) ? "在线" : p.lastActive ? `离线 · ${ago(p.lastActive)}` : "离线"}</small></span><span class="chat" aria-hidden="true">${ic3(I3.chat)}</span></a>`).join("") || `<p class="empty3">还没有好友。点上面「添加好友」，或者把你的好友码发给同学。</p>`}</div>
        ${r.outgoing.length ? `<p class="hint">等待对方确认：${r.outgoing.map(p => esc(p.nick)).join("、")}</p>` : ""}`;
      body.querySelector("#addB").onclick = () => addSheet();
      body.querySelector("#copy").onclick = async e => { e.preventDefault(); try { await navigator.clipboard.writeText(`来宠物俄语通加我好友吧！好友码：${r.myCode}`); Pet.toast("好友码已复制", "good"); } catch { Pet.toast(`好友码：${r.myCode}`); } };
    } else {
      body.innerHTML = `${r.incoming.length ? `<div class="sec-t"><h2>收到的申请 (${r.incoming.length})</h2></div>${r.incoming.map(p => `<section class="card req"><div class="fr" style="padding:0">${avatarPet(p.breed, p.stage)}<span class="grow"><b>${esc(p.nick)}</b><small>想和你的宠物做朋友～ · ${esc(p.catName)} Lv.${p.level}</small></span></div><div class="two"><button class="btn lime" data-ok="${p.uid}">接受</button><button class="btn ghost" data-no="${p.uid}">暂不</button></div></section>`).join("")}` : `<p class="empty3">暂时没有新的好友申请</p>`}
        ${r.friends.length ? `<div class="sec-t"><h2>已成为好友 (${r.friends.length})</h2></div><div class="rows">${r.friends.slice(0, 5).map(p => `<div class="fr">${avatarPet(p.breed, p.stage)}<span class="grow"><b>${esc(p.nick)}</b><small>我们现在是好友啦！</small></span><span class="badge gray">已成为好友</span></div>`).join("")}</div>` : ""}`;
      body.querySelectorAll("[data-ok],[data-no]").forEach(b => b.onclick = async () => {
        await Cloud.call("friendRespond", { other: b.dataset.ok || b.dataset.no, accept: !!b.dataset.ok }).catch(e => Pet.toast(e.message, "warn"));
        if (b.dataset.ok) inbox("social", "新朋友", "你们已经成为好友啦！", "🤝"); draw();
      });
    }
  }
  function addSheet() {
    const sh = h(`<div class="sheet3" role="dialog" aria-modal="true" aria-label="添加好友"><div class="in" style="position:relative"><h2>添加好友</h2><button class="x" aria-label="关闭">✕</button>
      <label class="input3">${ic3(I3.search).replace("<svg", '<svg width="18" height="18" style="fill:none;stroke:#999;stroke-width:2"')}<input id="code" maxlength="8" placeholder="输入对方的 6 位好友码" autocapitalize="characters"></label>
      <button class="btn big" id="send">发送申请</button><p class="hint" id="msg" style="text-align:center"></p></div></div>`);
    document.body.append(sh);
    const close = () => sh.remove();
    sh.querySelector(".x").onclick = close; sh.onclick = e => { if (e.target === sh) close(); };
    sh.querySelector("#send").onclick = async () => {
      const code = sh.querySelector("#code").value.trim(); if (!code) return;
      try { const x = await Cloud.call("friendAdd", { code }); sh.querySelector("#msg").innerHTML = `<span class="badge ok">✓ ${x.status === "ok" ? `已和 ${esc(x.friend.nick)} 成为好友` : "好友申请已发送"}</span>`; setTimeout(() => { close(); draw(); }, 1000); }
      catch (e) { sh.querySelector("#msg").textContent = e.message; }
    };
    sh.querySelector("#code").focus();
  }
  draw();
}

/* ---------- 消息 ---------- */
async function pageMessages(tab = "gift") {
  const S = Pet.state; S.msgs = S.msgs || [];
  const box = h(`<div class="page">${head3("消息", "#/account")}<div class="seg" role="tablist">${[["gift", "礼物"], ["social", "互动"], ["system", "系统"]].map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" data-t="${k}">${l}</button>`).join("")}</div><div class="rows"></div></div>`);
  app.append(box);
  box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => location.hash = `#/messages/${b.dataset.t}`);
  if (tab === "gift") await Cloud.claimGifts().catch(() => {});
  const list = S.msgs.filter(m => m.kind === tab);
  box.querySelector(".rows").innerHTML = list.map(m => `<div class="msg"><span class="em">${m.em}</span><span class="grow"><b>${esc(m.title)}</b><small>${esc(m.text)} · ${ago(m.t)}</small></span>${m.unread ? `<span class="red"></span>` : ""}</div>`).join("") || `<p class="empty3">${tab === "gift" ? "还没有收到礼物。好友可以给你的宠物送零食哦" : tab === "social" ? "还没有互动消息" : "没有系统消息"}</p>`;
  list.forEach(m => m.unread = false); Pet.save();
}

/* ---------- 动态记录 ---------- */
function pageActivity() {
  const S = Pet.state; S.log = S.log || [];
  const EM = { feed: "🥣", water: "💧", pet: "❤️", snack: "🍗", play: "🪀", travel: "✈️", buy: "🛍️", nest: "🏠", grow: "🌱" };
  const today = new Date().toDateString();
  const box = h(`<div class="page">${head3("动态记录", "#/pet")}
    <div class="sec-t"><h2>今天 <span class="hint" style="font-weight:400">${new Date().getMonth() + 1}月${new Date().getDate()}日</span></h2></div>
    <div class="rows">${S.log.filter(e => new Date(e.t).toDateString() === today).map(e => `<div class="msg"><span class="em" style="background:#F3F5EE">${EM[e.kind] || "🐾"}</span><span class="grow"><b>${esc(e.text)}</b></span><span class="hint">${hhmm(e.t)}</span></div>`).join("") || `<p class="empty3">今天还没有互动。去喂喂它、摸摸它吧</p>`}</div>
    ${S.log.some(e => new Date(e.t).toDateString() !== today) ? `<div class="sec-t"><h2>更早</h2></div><div class="rows">${S.log.filter(e => new Date(e.t).toDateString() !== today).slice(0, 20).map(e => `<div class="msg"><span class="em" style="background:#F3F5EE">${EM[e.kind] || "🐾"}</span><span class="grow"><b>${esc(e.text)}</b><small>${ago(e.t)}</small></span></div>`).join("")}</div>` : ""}
    <div class="sec-t"><h2>设置</h2></div>
    <section class="rows"><div><span class="grow"><b>状态变化速度</b><small>宠物的饱腹、水分、心情变化速度</small></span><span class="seg" style="width:140px;grid-auto-columns:1fr"><button aria-selected="${S.settings.speed !== "active"}" data-sp="std">标准</button><button aria-selected="${S.settings.speed === "active"}" data-sp="active">活跃</button></span></div>
      <div><span class="grow"><b>静音模式</b><small>开启后不播放叫声、不推送互动通知</small></span><button class="switch" role="switch" id="mute" aria-checked="${!!S.settings.mute}" aria-label="静音模式"></button></div></section></div>`);
  app.append(box);
  box.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => { S.settings.speed = b.dataset.sp; Pet.save(); route(); });
  box.querySelector("#mute").onclick = e => { S.settings.mute = !S.settings.mute; Pet.save(); e.currentTarget.setAttribute("aria-checked", S.settings.mute); };
}

/* ---------- 账户 ---------- */
function pageAccount3() {
  const v = Pet.view(), S = Pet.state;
  const acc = v.totalAnswered ? Math.round(v.totalCorrect / v.totalAnswered * 100) : 0;
  const unread = (S.msgs || []).filter(m => m.unread).length;
  const box = h(`<div class="page acc3">
    <div class="sec-t" style="margin:0"><span></span><a href="#/settings" aria-label="设置">${ic3(I3.cog).replace("<svg", '<svg width="24" height="24" style="fill:none;stroke:#333;stroke-width:1.8"')}</a></div>
    <a class="me" href="#/settings"><span class="ava">${petPic(90, { stage: 1 })}</span><span class="grow"><b>${esc(v.profile.nick)}</b><span class="online"><i></i>在线</span></span>${GO}</a>
    <section class="card"><h2 style="margin:0;font-size:15px">学习数据</h2><div class="trio"><div><b>${v.studyDays}</b><small>学习天数</small></div><div><b>${acc}%</b><small>正确率</small></div><div><b>${fmt(v.totalCorrect)}</b><small>答对题数</small></div></div></section>
    <nav class="rows">
      <a href="#/records">${tile3(I3.clock)}<span class="grow"><b>学习记录</b></span>${GO}</a>
      <a href="#/partner">${tile3(I3.paw, "o")}<span class="grow"><b>我的伙伴</b><small>${esc(petName())} · ${esc(petOf(v.cat.breed).name)}</small></span>${petPic(44)}${GO}</a>
      <a href="#/favs">${tile3(I3.folder, "y")}<span class="grow"><b>我的收藏</b></span>${GO}</a>
      <a href="#/friends">${tile3(I3.user, "b")}<span class="grow"><b>好友</b></span>${GO}</a>
      <a href="#/messages">${tile3(I3.bell, "v")}<span class="grow"><b>消息</b></span>${unread ? `<span class="tbadge">${unread}</span>` : ""}${GO}</a>
      <a href="#/rank">${tile3("M6 20V10M12 20V4M18 20v-7", "g")}<span class="grow"><b>排行榜</b></span>${GO}</a>
      <a href="#/settings">${tile3(I3.cog)}<span class="grow"><b>设置</b></span>${GO}</a>
    </nav>
    <div class="sec-t"><h2>最近互动</h2><a href="#/friends">全部 ›</a></div><div class="rows" id="recent"><p class="empty3">加载中…</p></div></div>`);
  app.append(box);
  const rc = box.querySelector("#recent");
  if (!Cloud.enabled()) { rc.innerHTML = `<p class="empty3">联网后显示好友动态</p>`; return; }
  Cloud.call("friendList").then(r => {
    rc.innerHTML = r.friends.slice(0, 3).map(p => `<a class="fr" href="#/friend/${encodeURIComponent(p.uid)}">${avatarPet(p.breed, p.stage)}<span class="grow"><b>${esc(p.nick)}</b><small>${p.lastActive ? `离线 · ${ago(p.lastActive)}在线` : "离线"}</small></span><span class="chat">${ic3(I3.chat)}</span></a>`).join("") || `<a class="fr" href="#/friends">${tile3(I3.plus)}<span class="grow"><b>还没有好友</b><small>点这里添加好友</small></span></a>`;
  }).catch(() => { rc.innerHTML = `<a class="fr" href="#/friends">${tile3(I3.user)}<span class="grow"><b>登录后可以加好友</b></span></a>`; });
}

/* ---------- 设置 ---------- */
const LANGS = [["zh", "简体中文 · 中文", "🇨🇳"], ["en", "English · 英语", "🇬🇧"], ["ru", "Русский · 俄语", "🇷🇺"]];
function pageSettings3() {
  const S = Pet.state, v = Pet.view();
  const u = Cloud.enabled() && Cloud.user(), L = Cloud.enabled() ? Cloud.label() : { text: "本机" };
  const box = h(`<div class="page">${head3("设置", "#/account")}
    <div class="sec-t"><h2>账号与安全</h2></div>
    <section class="rows">
      <label><span class="grow"><b>昵称</b></span><input id="nick" maxlength="12" value="${esc(v.profile.nick)}" style="border:0;text-align:right;font:inherit;width:50%"></label>
      <a href="#" id="acct"><span class="grow"><b>账号信息</b><small>${esc(L.text)}</small></span>${GO}</a>
      <a href="#" id="bind"><span class="grow"><b>绑定信息</b><small>${u && !u.is_anonymous ? "已绑定" : "手机号 / 邮箱登录后可换设备"}</small></span>${GO}</a>
    </section>
    <div class="sec-t"><h2>通用</h2></div>
    <section class="rows">
      <a href="#" id="lang"><span class="grow"><b>应用界面语言</b></span><em>${LANGS.find(l => l[0] === (S.settings.lang || "zh"))[1]}</em>${GO}</a>
      <div><span class="grow"><b>静音模式</b></span><button class="switch" role="switch" data-k="mute" aria-checked="${!!S.settings.mute}"></button></div>
      <div><span class="grow"><b>答对时宠物叫一声</b></span><button class="switch" role="switch" data-k="meow" aria-checked="${S.settings.meow !== false}"></button></div>
      <div><span class="grow"><b>宠物在页面里跑来跑去</b></span><button class="switch" role="switch" data-k="roam" aria-checked="${S.settings.roam !== false}"></button></div>
      <div><span class="grow"><b>宠物想你时提醒我</b>${IS_NATIVE ? "" : "<small>App 版可用</small>"}</span><button class="switch" role="switch" data-k="notify" aria-checked="${S.settings.notify !== false}"></button></div>
      <label><span class="grow"><b>每日目标</b></span><select id="goal" style="border:0;font:inherit;background:none">${[10, 20, 30, 50].map(n => `<option value="${n}" ${n === S.goal ? "selected" : ""}>答对 ${n} 题</option>`).join("")}</select></label>
      <a href="#/desk"><span class="grow"><b>桌面陪伴</b></span>${GO}</a>
    </section>
    <div class="cloudslot"></div>
    <div class="sec-t"><h2>数据</h2></div>
    <section class="card"><p class="hint" style="margin:0 0 8px">搬家：在旧设备点「导出」，到新设备点「导入」并粘贴。</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn ghost" id="exp">导出进度</button><button class="btn ghost" id="imp">导入进度</button></div>
      <textarea id="moveBox" rows="3" hidden style="width:100%;margin-top:8px"></textarea><p class="hint" id="moveHint"></p>
      <button class="btn ghost" id="reset" style="width:100%;margin-top:6px">清除本机数据，重新开始</button><p class="hint" id="resetHint"></p></section>
    <p class="hint" style="text-align:center">宠物俄语通 · 版本 3.0</p></div>`);
  app.append(box);
  if (Cloud.enabled()) box.querySelector(".cloudslot").replaceWith(cloudCard());
  box.querySelector("#nick").onchange = e => { S.profile.nick = e.target.value.trim() || S.profile.nick; Pet.save(); Pet.toast("昵称已保存", "good"); };
  box.querySelector("#acct").onclick = box.querySelector("#bind").onclick = e => { e.preventDefault(); if (Cloud.enabled() && !(u && !u.is_anonymous)) loginSheet(() => route()); else Pet.toast(L.text); };
  box.querySelector("#goal").onchange = e => { S.goal = +e.target.value; Pet.save(); };
  box.querySelectorAll("[data-k]").forEach(b => b.onclick = async () => {
    const k = b.dataset.k, val = b.getAttribute("aria-checked") !== "true";
    S.settings[k] = val; Pet.save(); b.setAttribute("aria-checked", val);
    if (k === "roam") Roam.set(true);
    if (k === "notify" && IS_NATIVE) { const ok = await REMIND.schedule(true); if (val && !ok) Pet.toast("请在手机设置里允许通知", "warn"); }
  });
  box.querySelector("#lang").onclick = e => {
    e.preventDefault();
    let pick = S.settings.lang || "zh";
    const sh = h(`<div class="sheet3" role="dialog" aria-modal="true" aria-label="应用界面语言"><div class="in" style="position:relative"><h2>应用界面语言</h2><p class="hint" style="text-align:center;margin:-6px 0 0">应用于整个界面</p><button class="x" aria-label="关闭">✕</button>
      ${LANGS.map(([k, n, f]) => `<button class="lang" role="radio" aria-checked="${k === pick}" data-l="${k}"><span class="fl">${f}</span><span class="grow">${n}${k === "zh" ? "" : `<span class="soon">即将支持</span>`}</span></button>`).join("")}
      <button class="btn big lime" id="apply">应用</button></div></div>`);
    document.body.append(sh);
    sh.querySelector(".x").onclick = () => sh.remove();
    sh.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { pick = b.dataset.l; sh.querySelectorAll("[data-l]").forEach(x => x.setAttribute("aria-checked", x.dataset.l === pick)); });
    sh.querySelector("#apply").onclick = () => { if (pick !== "zh") { Pet.toast("英语和俄语界面正在翻译中，很快上线", "warn"); return; } S.settings.lang = pick; Pet.save(); sh.remove(); };
  };
  const mb = box.querySelector("#moveBox"), mh = box.querySelector("#moveHint");
  box.querySelector("#exp").onclick = async () => { const code = "MM1:" + btoa(unescape(encodeURIComponent(JSON.stringify(Pet.state)))); mb.hidden = false; mb.value = code; mb.select(); try { await navigator.clipboard.writeText(code); mh.textContent = "进度码已复制"; } catch { mh.textContent = "请长按全选复制"; } };
  box.querySelector("#imp").onclick = () => {
    if (mb.hidden || mb.dataset.mode !== "imp") { mb.hidden = false; mb.value = ""; mb.dataset.mode = "imp"; mb.focus(); mh.textContent = "粘贴进度码后再点一次「导入进度」"; return; }
    try { const data = JSON.parse(decodeURIComponent(escape(atob(mb.value.trim().slice(4))))); if (!data.profile) throw 0; localStorage.setItem("mm_pet_v1", JSON.stringify(data)); location.hash = "#/home"; location.reload(); }
    catch { mh.textContent = "进度码不对，请完整复制后再试"; }
  };
  let armed = false;
  box.querySelector("#reset").onclick = e => { if (!armed) { armed = true; e.target.textContent = "再点一次确认清除"; box.querySelector("#resetHint").textContent = "会删除宠物、成长值和所有学习记录，无法恢复。"; return; } Pet.reset(); location.hash = "#/welcome"; };
}

/* ---------- 学习记录 ---------- */
function pageRecords() {
  const S = Pet.state, v = Pet.view();
  const box = h(`<div class="page">${head3("学习记录", "#/account")}
    <section class="card"><div class="trio"><div><b>${v.streak || 0}</b><small>连续天数</small></div><div><b>${fmt(Object.keys(S.heard).length)}</b><small>听过的词</small></div><div><b>${fmt(Object.keys(S.mastered).length)}</b><small>背会的词</small></div></div></section>
    <div class="sec-t"><h2>各等级进度</h2></div>
    <nav class="ladder3">${ORDER.map(lv => { const p = lvProgress(lv); return `<a href="#/lv/${lv}"><span class="lv">${lv}</span><span><b>${LV_NAME[lv]}</b><small class="hint" style="display:block">背会 ${S.masteredCount[lv] || 0} · 语法 ${Object.keys(S.topics).filter(k => k.startsWith(lv + ":")).length}</small></span><span><div class="pc">${p.pct}%</div><div class="bar"><i style="width:${p.pct}%"></i></div></span>${GO}</a>`; }).join("")}</nav>
    <div class="sec-t"><h2>考试</h2></div>
    <div class="rows">${ORDER.map(lv => S.exams[lv] ? `<div><span class="grow"><b>${lv} 词汇测验</b><small>最好 ${S.exams[lv].best}/20</small></span><span class="badge ${S.exams[lv].passed ? "ok" : ""}">${S.exams[lv].passed ? "已通过" : "未通过"}</span></div>` : "").join("") || `<p class="empty3">还没有考试记录</p>`}</div></div>`);
  app.append(box);
}

/* ---------- 我的收藏 ---------- */
function toggleFav(w, zh, lv) {
  const S = Pet.state; S.fav = S.fav || [];
  const i = S.fav.findIndex(f => f.w === w);
  if (i >= 0) S.fav.splice(i, 1); else S.fav.unshift({ w, zh, lv, t: Date.now() });
  Pet.save(); return i < 0;
}
function pageFavs() {
  const S = Pet.state; S.fav = S.fav || [];
  const box = h(`<div class="page">${head3("我的收藏", "#/account")}
    <a class="card plan" href="#/memo/mine" style="text-decoration:none;color:inherit">${tile3(I3.book, "y")}<span class="grow"><b style="display:block">单词本 / 生词本</b><small class="hint">答错的词自动收进来</small></span>${GO}</a>
    <div class="sec-t"><h2>收藏的单词 (${S.fav.length})</h2><a href="#/dict">去查词 ›</a></div>
    <div class="rows">${S.fav.map((f, i) => `<div><button class="say3" data-say="${i}" style="border:0;background:var(--lime-soft);width:36px;height:36px;border-radius:50%;display:grid;place-items:center">${ic3(I3.vol).replace("<svg", '<svg width="18" height="18" style="fill:#4E9BE8"')}</button><span class="grow"><b class="ru" lang="ru">${esc(f.w)}</b><small>${esc(f.zh)}${f.lv ? ` · ${f.lv}` : ""}</small></span><button class="iconbtn" data-del="${i}" aria-label="取消收藏" style="border:0;background:none;font-size:20px;color:#F2B21A">★</button></div>`).join("") || `<p class="empty3">还没有收藏。查词时点 ☆ 就能收藏</p>`}</div>`);
  app.append(box);
  box.querySelectorAll("[data-say]").forEach(b => b.onclick = () => playOne(b, S.fav[+b.dataset.say].w));
  box.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { S.fav.splice(+b.dataset.del, 1); Pet.save(); route(); });
}

/* ---------- 我的伙伴: switch pet / rename ---------- */
function petPicker(cur, onPick, kind) {
  return `<div class="pills" style="margin-bottom:8px"><button data-kind="cat" aria-pressed="${kind === "cat"}">🐱 猫咪</button><button data-kind="dog" aria-pressed="${kind === "dog"}">🐶 狗狗</button></div>
    <div class="breeds" role="radiogroup" aria-label="品种">${PET_KEYS[kind].map(k => `<button role="radio" aria-checked="${k === cur}" data-b="${k}">${petImg(k, { stage: 2, size: 58 })}<span>${PETS[k].short}</span></button>`).join("")}</div>`;
}
function pagePartner() {
  const S = Pet.state; let kind = petOf(S.cat.breed).kind;
  const box = h(`<div class="page">${head3("我的伙伴", "#/account")}<div class="pp"></div></div>`);
  app.append(box);
  function draw() {
    const v = Pet.view(), b = S.cat.breed;
    box.querySelector(".pp").innerHTML = `<section class="card" style="text-align:center"><div style="display:flex;justify-content:center;align-items:flex-end;gap:12px;min-height:150px">${[1, 2, 4].map(st => petImg(b, { stage: st, size: 130 })).join("")}</div>
        <p class="hint" style="margin:6px 0 0">幼年 → 少年 → 成年：学得越多，${esc(petName())}长得越大</p></section>
      <section class="card"><label class="field"><span>名字</span><input id="cname" maxlength="10" value="${esc(S.cat.name)}"></label>
        <div class="pills" style="margin-top:8px"><button data-sex="m" aria-pressed="${S.cat.sex !== "f"}">♂ 男孩</button><button data-sex="f" aria-pressed="${S.cat.sex === "f"}">♀ 女孩</button></div></section>
      <section class="card welcome">${petPicker(b, null, kind)}<p class="hint">换品种不会影响成长值和已解锁的东西。</p></section>`;
    const P = box.querySelector(".pp");
    P.querySelector("#cname").onchange = e => { S.cat.name = e.target.value.trim() || S.cat.name; Pet.save(); Pet.toast(`以后就叫它「${esc(S.cat.name)}」啦`, "good"); };
    P.querySelectorAll("[data-sex]").forEach(x => x.onclick = () => { S.cat.sex = x.dataset.sex; Pet.save(); draw(); });
    P.querySelectorAll("[data-kind]").forEach(x => x.onclick = () => { kind = x.dataset.kind; draw(); });
    P.querySelectorAll("[data-b]").forEach(x => x.onclick = () => { S.cat.breed = x.dataset.b; Pet.save(); Roam.set(true); draw(); });
  }
  draw();
}

/* ---------- 查词与翻译 ---------- */
function pageDict(tab = "word") {
  const S = Pet.state; S.lookups = S.lookups || [];
  const box = h(`<div class="page">${head3("查词与翻译", "#/home")}
    <div class="seg" role="tablist"><button role="tab" aria-selected="${tab !== "tr"}" data-t="word">查单词</button><button role="tab" aria-selected="${tab === "tr"}" data-t="tr">翻译句子</button></div><div class="dbody"></div>
    <div class="sec-t"><h2>最近查询</h2><a href="#" id="clr">清空</a></div><div class="rows" id="recent"></div></div>`);
  app.append(box);
  box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => location.hash = `#/dict/${b.dataset.t}`);
  const body = box.querySelector(".dbody");
  const fav = w => (S.fav || []).some(f => f.w === w);
  function recent() {
    box.querySelector("#recent").innerHTML = S.lookups.map((r, i) => `<div><span class="grow"><b class="ru" lang="ru">${esc(r.w)}</b><small>${esc(r.zh)}</small></span><button class="iconbtn" data-s="${i}" style="border:0;background:none" aria-label="朗读">${ic3(I3.sound).replace("<svg", '<svg width="20" height="20" style="fill:none;stroke:#555;stroke-width:2"')}</button><button data-f="${i}" style="border:0;background:none;font-size:20px;color:#F2B21A" aria-label="收藏">${fav(r.w) ? "★" : "☆"}</button></div>`).join("") || `<p class="empty3">还没有查过单词</p>`;
    box.querySelectorAll("[data-s]").forEach(b => b.onclick = () => playOne(b, S.lookups[+b.dataset.s].w));
    box.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { const r = S.lookups[+b.dataset.f]; const on = toggleFav(r.w, r.zh, r.lv); Pet.toast(on ? "已加入收藏" : "已取消收藏", on ? "good" : ""); recent(); });
  }
  box.querySelector("#clr").onclick = e => { e.preventDefault(); S.lookups = []; Pet.save(); recent(); };
  if (tab !== "tr") {
    body.innerHTML = `<label class="input3">${ic3(I3.search).replace("<svg", '<svg width="18" height="18" style="fill:none;stroke:#999;stroke-width:2"')}<input id="q" placeholder="输入俄语单词，例如 привет" autocomplete="off" lang="ru"></label><div id="res" style="margin-top:10px"></div>`;
    const q = body.querySelector("#q"), res = body.querySelector("#res");
    let t;
    q.oninput = () => { clearTimeout(t); t = setTimeout(async () => {
      const w = q.value.trim(); if (!w) { res.innerHTML = ""; return; }
      const r = await lookup(w);
      if (!r) { res.innerHTML = `<p class="empty3">词库里没有找到「${esc(w)}」</p>`; return; }
      res.innerHTML = `<section class="card abc-card"><button class="say3" aria-label="朗读">${ic3(I3.vol)}</button><div><div class="word ru" lang="ru" style="font-size:24px">${esc(r.w.replace(/́/g, "́"))}</div><div class="hint">${r.guess ? "可能是 · " : ""}${r.lv} · ${esc(r.zh)}</div></div><button id="fv" style="margin-left:auto;border:0;background:none;font-size:26px;color:#F2B21A" aria-label="收藏">${fav(r.w) ? "★" : "☆"}</button></section>`;
      res.querySelector(".say3").onclick = () => playOne(res.querySelector(".say3"), r.w);
      res.querySelector("#fv").onclick = e => { const on = toggleFav(r.w, r.zh, r.lv); e.currentTarget.textContent = on ? "★" : "☆"; recent(); };
      S.lookups = [{ w: r.w, zh: r.zh, lv: r.lv }, ...S.lookups.filter(x => x.w !== r.w)].slice(0, 20); Pet.save(); recent();
    }, 300); };
    q.focus();
  } else {
    body.innerHTML = `<div class="pills"><button aria-pressed="true">俄语</button><span style="align-self:center">⇄</span><button aria-pressed="false">中文</button></div>
      <label class="input3" style="margin-top:10px"><textarea id="src" rows="3" lang="ru" placeholder="输入要翻译的句子">Как прошёл твой день?</textarea></label>
      <button class="btn big lime" id="go" style="margin-top:10px">翻译</button>
      <section class="card" style="margin-top:10px"><b>整句翻译 <span class="soon">即将上线</span></b><p class="hint" style="margin:6px 0 0">句子翻译需要接入机器翻译服务，接好后就能用。现在可以先用「查单词」，或者点 🔊 听这句话的发音。</p>
        <button class="btn ghost" id="say" style="margin-top:8px">🔊 朗读这句俄语</button></section>`;
    body.querySelector("#go").onclick = () => Pet.toast("整句翻译即将上线", "warn");
    body.querySelector("#say").onclick = e => playOne(e.currentTarget, body.querySelector("#src").value);
  }
  recent();
}

/* ---------- welcome: choose a cat or a dog ---------- */
function pageWelcome3() {
  const S = Pet.state;
  let step = 1, nick = S.profile ? S.profile.nick : "", breed = PETS[S.cat.breed] ? S.cat.breed : "orange", kind = petOf(breed).kind, name = S.profile ? (S.cat.name || "") : "", sex = S.cat.sex || "m";
  const box = h(`<section class="welcome page"></section>`);
  app.append(box);
  function draw() {
    if (step === 1) {
      const logged = Cloud.enabled() && Cloud.user() && !Cloud.user().is_anonymous;
      box.innerHTML = `<div style="text-align:center;margin-top:10px">${petImg("orange", { stage: 1, size: 150 })}${petImg("corgi", { stage: 1, size: 130 })}</div>
        <h1 class="display" style="display:flex;align-items:center;gap:10px"><span style="width:40px;height:40px">${LOGO}</span>宠物俄语通</h1>
        <p class="hint" style="font-size:15px">学俄语，养一只小猫或小狗。你学得越多，它吃得越饱、长得越大；不学习它会饿、会生病。</p>
        ${Cloud.enabled() ? logged ? `<p class="badge ok">已登录：${esc(Cloud.label().text)}</p>` : `<button class="btn big" id="login">手机号 / 邮箱登录</button><p class="hint">已有账号？登录后自动取回你的宠物和学习进度。</p><div class="wl-or"><span>或者先体验一下</span></div>` : ""}
        <label class="field"><span>你的昵称</span><input id="nick" maxlength="12" autocomplete="nickname" placeholder="例如：小周" value="${esc(nick)}"></label>
        <button class="btn big ${Cloud.enabled() && !logged ? "ghost" : "lime"}" id="go">${Cloud.enabled() && !logged ? "游客开始" : "下一步"}</button>`;
      const lg = box.querySelector("#login");
      if (lg) lg.onclick = () => loginSheet(() => { if (!Pet.state.profile) { Pet.toast("登录成功！起个昵称，再选一只宠物", "good"); draw(); } });
      const inp = box.querySelector("#nick");
      box.querySelector("#go").onclick = () => { nick = inp.value.trim() || "同学"; step = 2; draw(); };
      inp.onkeydown = e => { if (e.key === "Enter") box.querySelector("#go").click(); };
    } else {
      box.innerHTML = `<p class="hint">第 2 步 / 共 2 步</p><h1 class="display small">选一只陪你学俄语的伙伴</h1>
        <section class="card" style="text-align:center"><div style="min-height:150px;display:flex;align-items:flex-end;justify-content:center">${petImg(breed, { stage: 1, size: 160 })}</div>
          <b style="font-size:18px">${esc(name) || "（还没起名字）"}</b><p class="hint" style="margin:2px 0 0">${PETS[breed].name} · ${PETS[breed].desc}</p></section>
        <section class="card">${petPicker(breed, null, kind)}</section>
        <section class="card"><label class="field"><span>给它起个名字</span><input id="cname" maxlength="10" value="${esc(name)}" placeholder="输入它的名字"></label>
          <div class="pills" style="margin-top:8px"><button data-sex="m" aria-pressed="${sex === "m"}">♂ 男孩</button><button data-sex="f" aria-pressed="${sex === "f"}">♀ 女孩</button></div></section>
        <p class="hint">每只宠物都从幼年开始，学得越多会长成少年、成年。</p>
        <button class="btn big lime" id="done">就选它，开始学习</button><button class="btn ghost" id="back">上一步</button>`;
      box.querySelectorAll("[data-kind]").forEach(b => b.onclick = () => { kind = b.dataset.kind; breed = PET_KEYS[kind][0]; draw(); });
      box.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { breed = b.dataset.b; draw(); });
      box.querySelectorAll("[data-sex]").forEach(b => b.onclick = () => { sex = b.dataset.sex; draw(); });
      const ci = box.querySelector("#cname");
      ci.oninput = () => { name = ci.value.trim(); };
      box.querySelector("#back").onclick = () => { step = 1; draw(); };
      box.querySelector("#done").onclick = () => {
        name = ci.value.trim();
        if (!name) { ci.focus(); ci.placeholder = "先给它起个名字吧"; ci.classList.add("need"); return; }
        S.profile = S.profile || { nick, created: Date.now() }; S.profile.nick = nick || S.profile.nick;
        S.cat = { breed, name, sex }; S.lastStudy = Date.now(); S.lastTick = Date.now();
        Pet.save(); logEvent("grow", `${name}来到你家啦！`);
        location.hash = "#/home";
        setTimeout(() => Pet.toast(`<b>${esc(name)} 来到你家啦！</b><br>答对题就能给它赚小鱼干`, "big"), 400);
      };
    }
  }
  draw();
}

/* ---------- every older page that draws "the cat" now draws the player's pet (cat or dog) ---------- */
catSVG = function (o = {}) {
  const b = PETS[o.breed] ? o.breed : "orange", m = o.mood;
  const pose = m === "sleep" || m === "sick" ? "lie" : m === "walk" ? "walk" : m === "cheer" ? "look" : "sit";
  return petImg(b, { stage: o.stage || 2, size: (o.size || 120) * 1.05, pose, label: o.label || "" });
};
catSideSVG = o => petImg(PETS[o.breed] ? o.breed : "orange", { stage: o.stage || 2, size: (o.size || 120) * 0.9, pose: o.eat ? "sit" : "walk", label: o.label || "" });
catLieSVG = o => petImg(PETS[o.breed] ? o.breed : "orange", { stage: o.stage || 2, size: (o.size || 120) * 0.85, pose: "lie", label: o.label || "" });
PET_LIST.forEach(([k, , name, short, desc]) => { BREEDS[k] = Object.assign({}, BREEDS[k] || BREEDS.orange, { name, short, desc }); });

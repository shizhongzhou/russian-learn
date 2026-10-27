"use strict";
/* ========== 猫猫俄语通 — app pages & router ========== */

const ICON = {
  home: "M3 11 L12 4 L21 11 M5 10 V20 H10 V14 H14 V20 H19 V10",
  learn: "M4 5 H10 A2 2 0 0 1 12 7 V20 A2 2 0 0 0 10 18 H4 Z M20 5 H14 A2 2 0 0 0 12 7 V20 A2 2 0 0 1 14 18 H20 Z",
  meow: "M5 9 L6 3 L10 7 H14 L18 3 L19 9 A8 7 0 1 1 5 9 Z M9.5 12.5 h.01 M14.5 12.5 h.01 M11 15.5 Q12 16.5 13 15.5",
  account: "M12 12 A4 4 0 1 0 12 4 A4 4 0 1 0 12 12 Z M4 21 C4 16.5 8 14.5 12 14.5 C16 14.5 20 16.5 20 21",
  back: "M15 5 L8 12 L15 19",
  play: "M8 5 L19 12 L8 19 Z",
};
const svgI = (d, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const FOOD_I = `<svg class="res-i" viewBox="0 0 24 24" aria-hidden="true"><g fill="#C9874A"><ellipse cx="12" cy="15" rx="5" ry="4"/><circle cx="6" cy="9" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="9" r="2"/></g></svg>`;
const WATER_I = `<svg class="res-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="#5C93C9" d="M12 3 Q18 11 18 15 A6 6 0 0 1 6 15 Q6 11 12 3 Z"/></svg>`;
const fmt = n => Math.round(n).toLocaleString("zh-CN");
let pageTimers = [];
const later = (fn, ms) => { const t = setInterval(fn, ms); pageTimers.push(t); return t; };

/* ---------- chrome: top bar + bottom tabs ---------- */
const THEME_BG = { living: "#F6F1E9", window: "#F6EDC4", winter: "#DFE8F2", moscow: "#F1DCCB", night: "#10142C" };
function applyTheme(scene) {
  // v2: the app stays white; the room scene only changes the cat's room
  document.documentElement.dataset.room = scene;
  document.querySelector('meta[name="theme-color"]').content = "#FFFFFF";
}
function chrome(active) {
  const v = Pet.view();
  applyTheme(v.profile ? v.scene : "living");
  const bar = document.getElementById("appbar");
  bar.querySelector(".brand-mark").innerHTML = catSVG({ breed: v.cat.breed, stage: 2, mood: "happy", size: 34, label: "" });
  bar.querySelector(".res").innerHTML = v.profile ? `<a class="chip" href="#/shop" aria-label="猫粮 ${v.food}，去小卖部">${FOOD_I}${fmt(v.food)}</a><a class="chip" href="#/shop" aria-label="水 ${v.water}，去小卖部">${WATER_I}${fmt(v.water)}</a>` : "";
  const tabs = document.getElementById("tabbar");
  tabs.hidden = !v.profile;
  tabs.querySelectorAll("a").forEach(a => a.toggleAttribute("aria-current", a.dataset.tab === active));
  if (active) tabs.querySelectorAll("a").forEach(a => { if (a.dataset.tab === active) a.setAttribute("aria-current", "page"); });
}
Pet.onChange(() => {
  const v = Pet.view();
  const res = document.querySelector("#appbar .res");
  if (res && v.profile) res.innerHTML = `<a class="chip" href="#/shop" aria-label="猫粮 ${v.food}">${FOOD_I}${fmt(v.food)}</a><a class="chip" href="#/shop" aria-label="水 ${v.water}">${WATER_I}${fmt(v.water)}</a>`;
  Pet.drawRoam();
});

/* ---------- router ---------- */
function route() {
  stopAll();
  pageTimers.forEach(clearInterval); pageTimers = [];
  const hash = location.hash || "#/home";
  const parts = hash.replace(/^#\/?/, "").split("/");
  const v = Pet.view();
  if (!v.profile && parts[0] !== "welcome") { location.replace("#/welcome"); return; }
  app.innerHTML = "";
  let tab = "home", roamLines = null, roam = true;
  const [p0, p1] = parts;
  if (LEVELS[p0]) { tab = "learn"; renderLevel(p0, p1 || "words"); roamLines = LEARN_LINES; document.title = `${p0} · 猫猫俄语通`; }
  else switch (p0) {
    case "welcome": tab = ""; roam = false; pageWelcome(); break;
    case "learn": tab = "learn"; pageLearn(); roamLines = LEARN_LINES; break;
    case "quiz": tab = "learn"; pageQuiz(LEVELS[p1] ? p1 : v.lastLevel); roamLines = LEARN_LINES; break;
    case "memo": tab = "learn"; pageMemo(LEVELS[p1] || p1 === "mine" || /^t-\w+$/.test(p1 || "") ? p1 : v.lastLevel); roamLines = LEARN_LINES; break;
    case "shadow": tab = "learn"; pageShadow(LEVELS[p1] ? p1 : v.lastLevel); roamLines = ["我在听你读哦", "Повтори́! 跟我读", "读得越像，猫粮越多"]; break;
    case "trki": tab = "learn"; pageTrki(p1); roamLines = ["考试加油！", "Уда́чи! 祝你好运", "我相信你"]; break;
    case "library": tab = "learn"; pageLibrary(); roamLines = ["今天读哪本书？", "读 5 页就有猫粮哦"]; break;
    case "read": tab = "learn"; pageReader(p1); roam = false; break;
    case "write": tab = "learn"; pageWrite(LEVELS[p1] ? p1 : v.lastLevel); roamLines = ["慢慢写，我等你～", "写完有小鱼干吃！", "Пиши́! 写吧"]; break;
    case "exam": tab = "learn"; pageExam(LEVELS[p1] ? p1 : v.lastLevel); roamLines = ["考试加油！", "我相信你", "Уда́чи! 祝你好运"]; break;
    case "meow": tab = "meow"; pageMeow(); roam = false; break;
    case "play": tab = "home"; pagePlay(); roam = false; break;
    case "rank": tab = "home"; pageRank(p1); break;
    case "friends": tab = "home"; pageFriends(); break;
    case "friend": tab = "home"; pageFriendCat(p1); roam = false; break;
    case "admin": tab = "account"; pageAdmin(); roam = false; break;
    case "shop": tab = "meow"; pageShop(p1); break;
    case "dress": tab = "home"; pageDress(); roam = false; break;
    case "vet": tab = "meow"; pageVet(); roam = false; break;
    case "account": tab = "account"; pageAccount(); break;
    case "desk": tab = "account"; pageDesk(); break;
    default: tab = "home"; pageHome();
  }
  if (!LEVELS[p0]) document.title = { home: "猫猫俄语通", learn: "学习 · 猫猫俄语通", meow: "猫咪 · 猫猫俄语通", account: "账号 · 猫猫俄语通" }[tab] || "猫猫俄语通";
  chrome(tab);
  Pet.setRoam(roam, roamLines);
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);
const LEARN_LINES = ["加油！我在旁边陪你", "Ты молоде́ц! 你真棒", "答对题我就有猫粮吃啦", "累了就摸摸我", "再学一会儿好不好～"];

/* ---------- welcome / register ---------- */
function pageWelcome() {
  const S = Pet.state;
  let step = 1, nick = "", breed = has3D(S.cat.breed) ? S.cat.breed : "orange", name = S.profile ? (S.cat.name || "") : "";
  const box = h(`<section class="welcome"></section>`);
  app.append(box);
  function draw() {
    if (step === 1) {
      box.innerHTML = `<div class="welcome-cat">${catSVG({ breed: "orange", stage: 4, mood: "cheer", size: 180 })}</div>
        <h1 class="display">猫猫俄语通</h1>
        <p class="lead">学俄语，养一只猫。你学得越多，它吃得越饱、长得越可爱；不学习它会饿、会生病。</p>
        ${Cloud.enabled() ? (() => { const u = Cloud.user(), L = Cloud.label(); return u && !u.is_anonymous
          ? `<p class="wl-in">已登录：${esc(L.text)} · 接下来创建你的猫</p>`
          : `<button class="btn big" id="login">手机号 / 邮箱登录</button><p class="hint">已有账号？登录后会自动取回你的猫和学习进度。没有账号会自动注册。</p><div class="wl-or"><span>或者先体验一下</span></div>`; })() : ""}
        <label class="field"><span>你的昵称</span><input id="nick" maxlength="12" autocomplete="nickname" placeholder="例如：小周"></label>
        <button class="btn big ${Cloud.enabled() && !(Cloud.user() && !Cloud.user().is_anonymous) ? "ghost" : ""}" id="go">${Cloud.enabled() && !(Cloud.user() && !Cloud.user().is_anonymous) ? "游客开始" : "下一步"}</button>
        <p class="hint">${Cloud.enabled() ? "游客的进度也会备份到云端，之后在「账号」页登录即可换设备继续。" : "账号和进度保存在这台设备上。"}</p>`;
      const lg = box.querySelector("#login");
      if (lg) lg.onclick = () => loginSheet(() => { if (!Pet.state.profile) { Pet.toast("登录成功！给自己起个昵称，再选一只猫", "good"); draw(); } });
      const inp = box.querySelector("#nick");
      inp.value = nick;
      box.querySelector("#go").onclick = () => { nick = inp.value.trim() || "同学"; step = 2; draw(); };
      inp.onkeydown = e => { if (e.key === "Enter") box.querySelector("#go").click(); };
    } else {
      box.innerHTML = `<p class="step">第 2 步 / 共 2 步</p><h1 class="display small">选一只陪你学俄语的猫</h1>
        <div class="pick-preview"><div class="pp-cat">${catSVG({ breed, stage: 1, mood: "happy", size: 170 })}</div>
          <div class="pp-name">${esc(name) || "（还没起名字）"}</div><div class="pp-breed">${BREEDS[breed].name} · ${BREEDS[breed].desc}</div></div>
        <div class="breeds" role="radiogroup" aria-label="猫咪品种">${PICK_BREEDS.map(k => [k, BREEDS[k]]).map(([k, b]) => `<button role="radio" aria-checked="${k === breed}" data-b="${k}">${catSVG({ breed: k, stage: 1, mood: "happy", size: 54 })}<span>${b.short}</span></button>`).join("")}</div>
        <label class="field"><span>给它起个名字</span><input id="cname" maxlength="10" value="${esc(name)}" placeholder="输入它的名字"></label>
        <p class="hint">每只猫都从“小奶猫”开始，学得越多会戴上铃铛、蝴蝶结、花环。</p>
        <button class="btn big" id="done">就选它，开始学习</button>
        <button class="btn ghost" id="back">上一步</button>`;
      box.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { breed = b.dataset.b; draw(); });
      const ci = box.querySelector("#cname");
      ci.oninput = () => { name = ci.value.trim(); box.querySelector(".pp-name").textContent = name || "（还没起名字）"; };
      box.querySelector("#back").onclick = () => { step = 1; draw(); };
      box.querySelector("#done").onclick = () => {
        name = ci.value.trim();
        if (!name) { ci.focus(); ci.placeholder = "先给它起个名字吧"; ci.classList.add("need"); return; }
        S.profile = S.profile || { nick, created: Date.now() };
        S.profile.nick = nick || S.profile.nick;
        S.cat = { breed, name };
        S.lastStudy = Date.now(); S.lastTick = Date.now();
        Pet.save();
        location.hash = "#/home";
        setTimeout(() => Pet.toast(`<b>${esc(S.cat.name)} 来到你家啦！</b><br>答对题就能给它赚猫粮`, "big"), 400);
      };
    }
  }
  draw();
}

/* ---------- home ---------- */
/* floor spots have lv 0; cat-tree platforms are climbed one level at a time */
function roomSpots(v) {
  const L = v.layout || {};
  const off = (k, p) => { const [dx, dy] = clampItem(k, ...(L[k] || [0, 0]), v.tree); return { ...p, x: p.x + dx, y: p.y + dy }; };
  const s = roomSpots0(v).map(p => p.item ? off(p.item, p) : p);
  s.base = off("tree", { x: 300, y: 270 });
  return s;
}
function roomSpots0(v) {
  const s = [
    { x: 190, y: 256, m: "happy" }, { x: 230, y: 274, m: "happy" }, { x: 150, y: 248, m: "happy" }, { x: 84, y: 280, m: "happy" },
    { x: 92, y: 272, m: "eat", say: "开饭啦～" }, { x: 170, y: 262, m: "lie" }, { x: 240, y: 284, m: "sleep" },
  ];
  if (v.decor.bed) s.push({ x: 62, y: 262, m: "sleep", item: "bed" });
  if (v.decor.toy) s.push({ x: 200, y: 280, m: "cheer", item: "toy" });
  if (v.decor.scratch) s.push({ x: 262, y: 270, m: "cheer", say: "磨磨爪子～", item: "scratch" });
  if (v.tree >= 1) s.push({ x: 327, y: 192, m: "happy", lv: 1, item: "tree" });
  if (v.tree >= 2) s.push({ x: 335, y: 114, m: "sleep", lv: 2, item: "tree" });
  if (v.tree >= 3) s.push({ x: 300, y: 84, m: "happy", lv: 3, item: "tree" }, { x: 280, y: 50, m: "cheer", lv: 4, say: "看我爬得多高！", item: "tree" });
  return s;
}
function roomPath(spots, a, b) {
  const tree = spots.filter(s => s.lv).sort((x, y) => x.lv - y.lv);
  const segs = [];
  const la = a.lv || 0, lb = b.lv || 0;
  if (la && lb) {
    const step = lb > la ? 1 : -1;
    for (let l = la + step; step > 0 ? l <= lb : l >= lb; l += step) segs.push({ to: tree[l - 1], jump: true });
    return segs;
  }
  if (la) { for (let l = la - 1; l >= 1; l--) segs.push({ to: tree[l - 1], jump: true }); segs.push({ to: spots.base, jump: true }); }
  if (lb) { if (!la) segs.push({ to: spots.base }); for (let l = 1; l <= lb; l++) segs.push({ to: tree[l - 1], jump: true }); return segs; }
  segs.push({ to: b });
  return segs;
}
function roomBox(v, { cat = true, label = true } = {}) {
  const box = h(`<section class="room" aria-label="${esc(v.cat.name)}的小窝">${roomSVG({ scene: v.scene, tree: v.tree, decor: v.decor, layout: v.layout || {} })}
    ${cat ? `<div class="room-cat"><span class="rc-bubble" hidden></span><span class="rc-flip"></span></div>` : ""}
    ${label ? `<div class="room-tag">${esc(v.cat.name)} · Lv.${v.level} · ${v.stageName}</div>` : ""}</section>`);
  if (!cat) return box;
  const el = box.querySelector(".room-cat"), flip = el.querySelector(".rc-flip"), bub = el.querySelector(".rc-bubble");
  const spots = roomSpots(v);
  let cur = v.sick ? (spots.find(s => s.m === "sleep") || spots[3]) : spots[0], moving = false;
  const pos = p => ({ left: (p.x / 390 * 100) + "%", top: (p.y / 300 * 100) + "%" });
  const front = mood => {
    const st = Pet.view().shownStage;
    flip.style.setProperty("--flip", 1); flip.className = "rc-flip";
    if (mood === "sleep") flip.innerHTML = catLieSVG({ breed: v.cat.breed, stage: st, size: 150 });
    else if (mood === "lie") flip.innerHTML = catLieSVG({ breed: v.cat.breed, stage: st, size: 150, awake: true });
    else if (mood === "eat") { flip.className = "rc-flip"; flip.innerHTML = catSideSVG({ breed: v.cat.breed, stage: st, size: 150, eat: true }); }
    else flip.innerHTML = catSVG({ breed: v.cat.breed, stage: st, mood, size: 120 });
  };
  const side = (cls, dir) => { flip.style.setProperty("--flip", dir); flip.className = "rc-flip " + cls; flip.innerHTML = catSideSVG({ breed: v.cat.breed, stage: Pet.view().shownStage, size: 150 }); };
  Object.assign(el.style, pos(cur));
  front(v.sick ? "sick" : v.mood === "hungry" ? "hungry" : "happy");
  el.onclick = () => { if (Pet.state.settings.meow) meowFor("pet"); Pet.pet(); say(["喵～", "呼噜呼噜", "Мур!"][Math.floor(Math.random() * 3)]); if (!moving) front("cheer"); };
  el.setAttribute("role", "button"); el.tabIndex = 0; el.setAttribute("aria-label", `${v.cat.name}，点一下摸摸它`);
  el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } };
  let bt;
  function say(t) { bub.textContent = t; bub.hidden = false; clearTimeout(bt); bt = setTimeout(() => bub.hidden = true, 2600); }
  if (v.sick) { setTimeout(() => say("我不舒服……带我去看医生吧"), 800); return box; }
  if (v.mood === "hungry") setTimeout(() => say(v.full < 30 ? "肚子饿了，咕～" : "好渴，想喝水"), 800);
  const lines = { eat: "开饭啦～", sleep: "", happy: "", cheer: "", lie: "" };
  const extra = ["今天也一起学吧", "Приве́т! 你来啦", "先复习单词好不好？", "在小窝里等你～"];
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return box;
  const W = () => box.clientWidth || 390;
  async function go(target) {
    moving = true;
    let p = cur;
    for (const sg of roomPath(spots, cur, target)) {
      if (!document.body.contains(el)) return;
      const q = sg.to, dir = q.x < p.x ? -1 : 1;
      const dx = (q.x - p.x) / 390 * W(), dy = (q.y - p.y) / 300 * (W() * 300 / 390), dist = Math.hypot(dx, dy);
      const a = pos(p), b = pos(q);
      if (sg.jump) {
        side("jumping", dir);
        const up = Math.min(p.y, q.y) - 34;
        const mid = pos({ x: (p.x + q.x) / 2, y: up });
        await el.animate([a, mid, b], { duration: 520 + dist * 1.2, easing: "ease-in-out" }).finished.catch(() => {});
        Object.assign(el.style, b);
        side("", dir); await new Promise(r => setTimeout(r, 260));
      } else if (dist > 4) {
        const run = dist > W() * 0.35 && Math.random() < 0.4;
        side(run ? "running" : "walking", dir);
        await el.animate([a, b], { duration: dist / (run ? 0.17 : 0.07), easing: "linear" }).finished.catch(() => {});
        Object.assign(el.style, b);
      }
      p = q;
    }
    cur = target; moving = false;
    const vv = Pet.view();
    front(vv.mood === "hungry" && target.m !== "eat" ? "hungry" : target.m);
    const t = target.say || lines[target.m] || (Math.random() < 0.35 ? extra[Math.floor(Math.random() * extra.length)] : "");
    if (t) say(t);
  }
  const loop = () => {
    if (!document.body.contains(el)) return;
    if (!moving) {
      let nx = spots[Math.floor(Math.random() * spots.length)];
      if (nx === cur) nx = spots[(spots.indexOf(cur) + 1) % spots.length];
      go(nx);
    }
  };
  setTimeout(loop, 2200);
  later(loop, 7000); // repeats until the page changes
  return box;
}
function pageHome() {
  const v = Pet.view();
  const hr = new Date().getHours();
  const hello = hr < 5 ? "夜深了。" : hr < 11 ? "早上好。" : hr < 13 ? "中午好。" : hr < 18 ? "下午好。" : "晚上好。";
  const words = Object.values(Pet.state.heardCount || {}).reduce((a, b) => a + b, 0);
  const lp = v.lastPlace, lv = v.lastLevel;
  const pct = Math.min(100, v.daily.correct / v.goal * 100);
  const doing = v.sick ? "生病了" : v.mood === "hungry" ? (v.full < 30 ? "饿了" : "渴了") : "正在自己玩";
  const box = h(`<div class="page home v2home">
    <section class="hm-hero">
      <h1>${hello}</h1>
      <p>和${esc(v.cat.name)}一起，每天进步一点点。</p>
      <a class="hm-cat" href="#/meow" aria-label="去看${esc(v.cat.name)}">
        ${v.cat.breed === "orange" ? `<img class="hm-pose" src="img/pose/ball.webp" alt="">` : `${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: v.sick ? "sick" : v.mood === "hungry" ? "hungry" : "happy", size: 96 })}<img class="hm-ball" src="img/item/ball.webp" alt="">`}
        <img class="hm-bowl" src="img/item/bowl.webp" alt="">
      </a>
      <span class="hm-chip"><i></i>${esc(v.cat.name)} · ${v.stageName} · ${doing}</span>
    </section>
    <section class="hm-stats">
      <div><b>${v.streak || 0}</b><span>连续学习 · 天</span></div>
      <div><b>${fmt(words)}</b><span>已学单词</span></div>
      <div><b>${v.daily.correct}<small> / ${v.goal}</small></b><span>今日答对</span></div>
    </section>
    <nav class="hm-social"><a href="#/rank">${svgI("M6 20V10M12 20V4M18 20v-7", "stroke")}排行榜</a><a href="#/friends">${svgI("M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21c0-3.5 3-6 6-6s6 2.5 6 6M17 11a3 3 0 1 0 0-6M21 21c0-2.6-1.7-4.6-4-5.4", "stroke")}好友</a></nav>
    <section class="hm-course">
      <div class="row"><div><small>当前课程</small><b>${lp ? lp.lv : lv} · ${esc(LEVELS[lp ? lp.lv : lv].title)}</b><span>${lp ? esc(lp.name) : "从字母和第一批单词开始"}</span></div><em>今日 ${v.daily.correct}/${v.goal}</em></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <a class="btn big" href="${lp ? `#/${lp.lv}/${lp.tab}` : `#/${lv}/words`}">继续学习 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
    </section>
    <section class="hm-plan">
      <div class="row"><h2>今日安排</h2><span>${v.daily.done ? "今日目标已完成" : `再答对 ${v.goal - v.daily.correct} 题拿奖励`}</span></div>
      ${[
        [`#/quiz/${lv}`, "每日小测", `${lv} · 答对 1 题 2 猫粮`, "M12 3a9 9 0 1 0 .01 0M8.5 12.5l2.5 2.5 5-5.5"],
        [`#/memo/${lv}`, "单词复习", "巩固核心词汇 · 每个 +1 猫粮", "M4 5.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4zM20 5.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"],
        [`#/${lv}/listening`, "听力练习", `${lv} 短对话 · 先听后答`, "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3z"],
        [`#/shadow/${lv}`, "复读跟读", "听一句 · 跟着读 · 打分", "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"],
      ].map(([href, t, sub, ic]) => `<a class="hm-row" href="${href}"><span class="hm-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ic}"/></svg></span><span class="grow"><b>${t}</b><small>${sub}</small></span><svg class="hm-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>`).join("")}
    </section>
    <a class="hm-wand" href="#/play" aria-label="拿出逗猫棒，陪${esc(v.cat.name)}玩"><img src="img/item/wand.webp" alt=""></a>
  </div>`);
  if (v.sick) box.prepend(h(`<a class="alert danger" href="#/vet"><b>${esc(v.cat.name)}生病了</b><span>${v.treated ? `正在康复：已坚持 ${v.recoverDays.length} / 3 天，今天答对 10 题算打卡` : "带它去宠物医院买药 →"}</span></a>`));
  else if (v.mood === "hungry" || v.thin) box.prepend(h(`<a class="alert warn" href="#/meow"><b>${esc(v.cat.name)}${v.full < 30 ? "饿了" : v.drink < 30 ? "渴了" : "瘦了一圈"}</b><span>去猫咪页喂它 →</span></a>`));
  app.append(box);
}

/* ---------- learn ---------- */
const LV_COUNT = lv => { const i = ORDER.indexOf(lv); return LEVELS[lv].total - (i ? LEVELS[ORDER[i - 1]].total : 0); };
function pageLearn() {
  const v = Pet.view();
  let lv = v.lastLevel;
  const box = h(`<div class="page learn"><h1 class="display small">学习</h1>
    <nav class="lv-pills" aria-label="等级">${ORDER.map(x => `<button data-lv="${x}" aria-pressed="${x === lv}">${x}</button>`).join("")}</nav><div class="lv-body"></div></div>`);
  app.append(box);
  const body = box.querySelector(".lv-body");
  function draw() {
    box.querySelectorAll("[data-lv]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lv === lv)));
    const heard = Pet.state.heardCount[lv] || 0, total = LV_COUNT(lv);
    const topics = Object.keys(Pet.state.topics).filter(k => k.startsWith(lv + ":")).length;
    const mastered = Pet.state.masteredCount[lv] || 0, ex = Pet.state.exams[lv];
    const M = [
      ["#memo", "背单词", "等级词库 · 主题词典 · 生词本", `已背会 ${fmt(mastered)} / ${fmt(total)} · 1 词 1 猫粮`, "M12 3 l2.6 5.6 6 .7 -4.5 4.1 1.2 6 -5.3 -3 -5.3 3 1.2 -6 -4.5 -4.1 6 -.7 z"],
      ["words", "单词", `${fmt(total)} 词 · 点击发音`, `已听 ${fmt(heard)} 个`, "M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3z M8 9h6 M8 13h4"],
      ["grammar", "语法", "思维导图 + 详解", `已学 ${topics} 个专题`, "M12 3 a2.5 2.5 0 1 0 .01 0 M5 16 a2.5 2.5 0 1 0 .01 0 M19 16 a2.5 2.5 0 1 0 .01 0 M12 7.5v4 M12 11.5 6.5 16 M12 11.5 17.5 16"],
      ["dialogues", "对话", "双声朗读 · 逐句翻译", "听完一段得 2 水", "M4 5h10v7H8l-4 3z M14 9h6v7l-3-2h-6v-2"],
      ["listening", "听力", "先听后答", "答对得猫粮", "M4 14v-2a8 8 0 0 1 16 0v2 M3 14h4v6H3z M17 14h4v6h-4z"],
      ["news", "新闻 · 阅读", "听、读、跟读", "读完一篇有奖励", "M3 4h18v16H3z M7 8h10 M7 12h10 M7 16h6"],
      ["#shadow", "复读跟读", "听一句 · 跟着读 · 打分", "分越高猫粮越多，还可能掉零食", "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3"],
      ["#write", "写作", "按题目写俄语短文", "写完得猫粮 + 小鱼干", "M4 20 L8 19 L19 8 L16 5 L5 16 Z M14 7 L17 10"],
      ["#trki", "ТРКИ-2 模拟", "阅读·写作·语法·听力·口语", Pet.state.trki ? `已通过 ${Object.values(Pet.state.trki).filter(x => x.passed).length} / 5 部分` : "全真题型，66% 及格", "M4 4h16v16H4z M8 9h8 M8 13h8 M8 17h5"],
      ["#library", "我的书架", "导入自己的 PDF 教材", "选中俄语可朗读、查词", "M5 4h4v16H5z M10 4h4v16h-4z M15 5l4 1-3 14-4-1z"],
      ["#exam", "词汇测验", "本级单词 20 题，16 题通过", ex && ex.passed ? `已通过 · 最好 ${ex.best}/20` : "通过得豪华罐头", "M6 3h12v18l-6-4-6 4z"],
    ];
    body.innerHTML = `<section class="card lvcard"><div class="row"><div><span class="lv-big">${lv}</span> <b>${LEVELS[lv].title}</b></div><span>${Math.round(heard / total * 100)}%</span></div>
      <div class="bar"><i style="width:${Math.min(100, heard / total * 100)}%"></i></div><p>${LEVELS[lv].desc}</p></section>
      <div class="modules">${M.map(m => `<a class="mod" href="${m[0][0] === "#" ? `#/${m[0].slice(1)}/${lv}` : `#/${lv}/${m[0]}`}">${svgI(m[4], "stroke")}<b>${m[1]}</b><small>${m[2]}</small><em>${m[3]}</em></a>`).join("")}
      <a class="mod dark" href="#/quiz/${lv}">${svgI("M12 3 a9 9 0 1 0 .01 0 M8.5 12.5l2.5 2.5 5-5.5", "stroke")}<b>每日小测</b><small>考今天学过的词 + 生词本 · 1 题 2 猫粮</small><em>今日已答对 ${Pet.state.daily.correct} 题</em></a></div>`;
    if (lv === "A1") {
      const alpha = h(`<section class="card"><h2>俄语字母表</h2><p class="hint">点一个字母，听它的名称和例词。</p><div class="alphabet"></div></section>`);
      const grid = alpha.querySelector(".alphabet");
      ALPHABET.forEach(([L, nm, ex]) => {
        const b = h(`<button class="ru" aria-label="字母 ${esc(L)}，例词 ${esc(ex)}">${esc(L)}${esc(L.toLowerCase())}</button>`);
        b.onclick = () => playSequence([{ el: b, text: nm }, { el: b, text: ex }]);
        grid.append(b);
      });
      body.append(alpha);
    }
  }
  box.querySelectorAll("[data-lv]").forEach(b => b.onclick = () => { lv = b.dataset.lv; Pet.state.lastLevel = lv; Pet.save(); draw(); });
  draw();
}

/* ---------- daily quiz (generated from the level's word list) ---------- */
async function pageQuiz(lv) {
  const box = h(`<div class="page quiz"><header class="subhead"><a class="iconbtn" href="#/learn" aria-label="返回学习">${svgI(ICON.back, "stroke")}</a>
    <div class="grow"><small class="qsrc">${lv} · 每日小测</small><div class="bar thin"><i></i></div></div></header><div class="qbody"><p class="empty">出题中…</p></div></div>`);
  app.append(box);
  const rows = await getJSON(`data/words_${lv}.json`);
  const pool = rows.map((r, i) => ({ r, i })).filter(({ r }) => r[1] && r[1] !== "-" && /[一-鿿]/.test(r[1]));
  Pet.tick();
  const todayIdx = new Set(Pet.state.todayWords.keys.concat(Object.keys(Pet.state.wrongWords || {})).filter(k => k.startsWith(lv + ":")).map(k => +k.split(":")[1]));
  const todayPool = pool.filter(p => todayIdx.has(p.i));
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const j = rnd(k + 1); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  const N = 10, qs = [];
  const used = new Set();
  const fromToday = todayPool.length;
  while (qs.length < N && used.size < pool.length) {
    const src0 = qs.length < Math.min(fromToday, N) && todayPool.some(p => !used.has(p.i)) ? todayPool : pool;
    const t = src0[rnd(src0.length)];
    if (used.has(t.i)) continue; used.add(t.i);
    const same = pool.filter(p => p.r[2] === t.r[2] && p.i !== t.i && p.r[1] !== t.r[1]);
    const src = same.length >= 3 ? same : pool.filter(p => p.i !== t.i && p.r[1] !== t.r[1]);
    const ds = new Set(); const opts = [t];
    while (opts.length < 4) { const d = src[rnd(src.length)]; if (!ds.has(d.i)) { ds.add(d.i); opts.push(d); } }
    qs.push({ t, opts: shuffle(opts), type: Math.random() < 0.6 ? "ru" : "zh" });
  }
  let k = 0, right = 0;
  const qb = box.querySelector(".qbody"), bar = box.querySelector(".bar i");
  box.querySelector(".qsrc").textContent = fromToday ? `${lv} · 每日小测 · ${Math.min(fromToday, N)} 题来自今天学过的词` : `${lv} · 每日小测 · 今天还没学新词，随机出题`;
  function q() {
    bar.style.width = (k / N * 100) + "%";
    if (k >= N) return end();
    const Q = qs[k];
    const prompt = Q.type === "ru" ? `<p class="qhint">这个词是什么意思？</p><button class="qword ru" lang="ru">${esc(Q.t.r[0])} ${svgI("M4 9v6h4l5 4V5L8 9H4z", "fill")}</button>`
      : `<p class="qhint">哪个俄语词的意思是：</p><p class="qzh">${esc(Q.t.r[1])}</p>`;
    qb.innerHTML = `<section class="card qcard"><small>第 ${k + 1} / ${N} 题</small>${prompt}</section>
      <div class="qopts">${Q.opts.map((o, j) => `<button data-j="${j}" ${Q.type === "zh" ? 'lang="ru" class="ru"' : ""}>${esc(Q.type === "ru" ? o.r[1] : o.r[0])}</button>`).join("")}</div><div class="qfb"></div>`;
    const qw = qb.querySelector(".qword");
    if (qw) { qw.onclick = () => speak(Q.t.r[0]); setTimeout(() => speak(Q.t.r[0]), 250); }
    qb.querySelectorAll("[data-j]").forEach(b => b.onclick = () => {
      if (qb.dataset.done === String(k)) return;
      qb.dataset.done = String(k);
      const o = Q.opts[+b.dataset.j], ok = o === Q.t;
      qb.querySelectorAll("[data-j]").forEach(x => { if (Q.opts[+x.dataset.j] === Q.t) x.classList.add("right"); });
      if (ok) { right++; Pet.reward("quiz"); } else { b.classList.add("wrong"); Pet.wrong(); Pet.missed(lv, Q.t.i); }
      if (Q.type === "zh") speak(Q.t.r[0]);
      Pet.heardWord(lv, Q.t.i);
      qb.querySelector(".qfb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><b>${ok ? "答对了！" : "差一点～"}</b><span lang="ru" class="ru">${esc(Q.t.r[0])}</span> = ${esc(Q.t.r[1])}</div><button class="btn big" id="nx">${k + 1 < N ? "下一题" : "看结果"}</button>`;
      qb.querySelector("#nx").onclick = () => { k++; q(); };
      qb.querySelector("#nx").focus();
    });
  }
  function end() {
    const v = Pet.view();
    qb.innerHTML = `<section class="card result"><div class="res-cat">${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: right >= 7 ? "cheer" : "happy", size: 150 })}</div>
      <h2>答对 ${right} / ${N} 题</h2><p>${esc(v.cat.name)}得到了 ${right * 2} 颗猫粮，成长值 +${right * 12}${right >= 8 ? "，另有满分奖励！" : ""}</p>
      <p class="hint">今日已答对 ${v.daily.correct} / ${v.goal} 题</p>
      <div class="row2"><a class="btn" href="#/quiz/${lv}" onclick="setTimeout(route,0)">再来 10 题</a><a class="btn ghost" href="#/meow">去喂${esc(v.cat.name)}</a></div></section>`;
    if (right >= 8) {
      const k2 = Pet.today() + "|quizbonus" + (right === N ? "10" : "8");
      if (!Pet.state.once[k2]) { Pet.state.once[k2] = 1; Pet.bonus({ g: 30, f: right === N ? 6 : 3, w: 2, text: right === N ? "小测满分" : "小测优秀", snackChance: right === N ? 0.6 : 0.3 }); }
    }
    if (location.hash === `#/quiz/${lv}`) qb.querySelector('a.btn').onclick = e => { e.preventDefault(); route(); };
  }
  q();
}

/* ---------- meow ---------- */
function pageMeow() {
  const box = h(`<div class="page meow"></div>`);
  app.append(box);
  let mood = null;
  function draw() {
    const v = Pet.view();
    const m = mood || v.mood;
    const gPct = v.nextAt ? (v.growth - v.prevAt) / (v.nextAt - v.prevAt) * 100 : 100;
    const barRow = (label, val, color) => `<div class="stat"><span>${label}</span><div class="bar"><i style="width:${val}%;background:${color}"></i></div><b>${Math.round(val)}%</b></div>`;
    box.innerHTML = `<header class="row"><h1 class="display small">猫咪</h1><span class="hint">${BREEDS[v.cat.breed].name} · 陪伴第 ${Math.max(1, Math.ceil((Date.now() - v.profile.created) / 86400000))} 天</span></header>
      ${v.sick ? `<a class="alert danger" href="#/vet"><b>${esc(v.cat.name)}生病了</b><span>${v.treated ? `康复中 ${v.recoverDays.length}/3 天` : "去宠物医院 →"}</span></a>` : ""}
      <section class="card catcard">
        <span class="pill ${v.sick ? "red" : "green"}">${esc(v.status)}</span><span class="pill orange">Lv.${v.level}</span>
        <button class="bigcat" aria-label="摸摸${esc(v.cat.name)}">${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: m, size: 210 })}</button>
        <div class="cname">${esc(v.cat.name)}</div>
        <div class="hint">${v.stageName}${v.thin ? "（瘦了）" : ""} · 成长值 ${fmt(v.growth)}${v.nextAt ? " / " + fmt(v.nextAt) : ""}</div>
        <div class="bar"><i style="width:${gPct}%;background:#E9A15E"></i></div>
        <div class="hint">${v.nextAt ? `再得 ${fmt(v.nextAt - v.growth)} 成长值长成“${v.nextName}”` : "已经是最可爱的阶段啦"}</div>
      </section>
      <section class="card stats">${barRow("饱食", v.full, "#E9A15E")}${barRow("水分", v.drink, "#5C93C9")}${barRow("健康", v.health, v.health < 40 ? "#C2412F" : "#1F7A72")}${barRow("心情", v.happy, "#6A7FC1")}</section>
      <a class="card hm-room" href="#/dress"><b>${esc(v.cat.name)}的小窝</b><small>布置猫窝、猫爬架和场景</small></a>
      <div class="actions">
        <button class="act dark" id="feed">喂饭<small>猫粮 ${fmt(v.food)}</small></button>
        <button class="act blue" id="water">喂水<small>水 ${fmt(v.water)}</small></button>
        <button class="act" id="pet">摸摸</button>
        <a class="act" href="#/shop">小卖部</a>
      </div>
      ${Object.entries(v.inv).filter(([, n]) => n > 0).length ? `<section class="card inv"><h2>背包里的零食</h2><div class="invs">${Object.entries(v.inv).filter(([, n]) => n > 0).map(([id, n]) => `<button data-snack="${id}">${Pet.SNACK_NAMES[id]} ×${n}<small>喂给它</small></button>`).join("")}</div></section>` : ""}
      <p class="hint">学习赚猫粮和水；写作、考试还能得到零食。1 天不学会饿、2 天会渴，3 天开始变瘦，7 天会生病，要买药看医生。${v.streak ? `已连续学习 ${v.streak} 天。` : ""}</p>`;
    const flash = (m2, ms = 1400) => { mood = m2; draw(); setTimeout(() => { mood = null; draw(); }, ms); };
    box.querySelector("#feed").onclick = () => { if (Pet.feed()) { feedScene("kibble", draw); Pet.toast("饱食 +8"); } };
    box.querySelector("#water").onclick = () => { if (Pet.giveWater()) { feedScene("water", draw); Pet.toast("水分 +10"); } };
    box.querySelectorAll("[data-snack]").forEach(b => b.onclick = () => {
      const id = b.dataset.snack, it = SHOP.snack.find(x => x.id === id);
      Pet.state.inv[id]--; it.apply(Pet.state); Pet.save(); Pet.toast(`${esc(v.cat.name)}吃了${it.name}，好开心！`, "good"); feedScene(id, draw);
    });
    box.querySelector("#pet").onclick = box.querySelector(".bigcat").onclick = () => { if (Pet.state.settings.meow) meowFor(v.sick ? "sick" : "pet"); Pet.pet(); flash(v.sick ? "sick" : "cheer"); };
  }
  draw();
}

/* ---------- shop ---------- */
const SHOP = {
  snack: [
    { id: "s1", kind: "snack", name: "小鱼干", effect: "饱食 +10 · 心情 +5", food: 8, water: 0, color: "#E9A15E", apply: s => { s.full = Math.min(100, s.full + 10); s.happy = Math.min(100, s.happy + 5); } },
    { id: "s2", kind: "snack", name: "猫条", effect: "心情 +15 · 饱食 +5", food: 15, water: 2, color: "#F07C9A", apply: s => { s.happy = Math.min(100, s.happy + 15); s.full = Math.min(100, s.full + 5); } },
    { id: "s3", kind: "snack", name: "冻干", effect: "饱食 +20 · 成长值 +20", food: 25, water: 0, color: "#C9874A", apply: s => { s.full = Math.min(100, s.full + 20); s.growth += 20; } },
    { id: "s4", kind: "snack", name: "豪华罐头", effect: "饱食、水分、心情全满", food: 40, water: 5, color: "#D9534F", apply: s => { s.full = 100; s.drink = 100; s.happy = 100; } },
  ],
  gear: [
    { id: "toy", name: "逗猫棒和小球", effect: "放进小窝，猫会去玩", stage: 2, color: "#F07C9A" },
    { id: "tree1", name: "猫抓柱", effect: "可以爬上去", stage: 2, color: "#E2C69A" },
    { id: "bed", name: "软软猫窝", effect: "在里面睡觉", stage: 3, color: "#C76F5B" },
    { id: "tree2", name: "二层猫爬架", effect: "会爬上去晒太阳", stage: 3, color: "#8FA9C9" },
    { id: "tree3", name: "豪华猫爬架 · 带小屋", effect: "最高层能看到窗外", stage: 4, color: "#5D7499" },
    { id: "fountain", name: "循环饮水机", effect: "放进小窝", stage: 4, color: "#5C93C9" },
    { id: "scratch", name: "剑麻猫抓板", effect: "放进小窝", food: 20, water: 0, color: "#D9B98A" },
    { id: "fish", name: "小鱼缸", effect: "放进小窝", food: 60, water: 0, color: "#5CB8C9" },
  ],
  scene: [
    { id: "scene_window", name: "阳光窗台", effect: "大窗户和阳光", food: 40, water: 0, color: "#9CC9B8" },
    { id: "scene_winter", name: "冬日壁炉", effect: "下雪天和壁炉", food: 80, water: 5, color: "#B65A3C" },
    { id: "scene_moscow", name: "莫斯科阁楼", effect: "窗外是洋葱顶教堂", stage: 4, color: "#C9564A" },
    { id: "scene_night", name: "星空屋顶", effect: "连续学习 30 天解锁", streak: 30, color: "#26325C" },
  ],
  med: [
    { id: "m1", kind: "med", name: "营养膏", effect: "饱食 +40 · 健康 +10，变瘦时用", food: 12, water: 2, color: "#E0A526", apply: s => { s.full = Math.min(100, s.full + 40); s.health = Math.min(100, s.health + 10); } },
    { id: "m2", kind: "med", name: "感冒药", effect: "生病时用：退烧，健康 +30", food: 30, water: 10, color: "#5C93C9", sickOnly: true, apply: s => { s.treated = true; s.health = Math.min(100, s.health + 30); } },
    { id: "m3", kind: "med", name: "退烧针（宠物医院）", effect: "马上退烧，健康 +60", food: 50, water: 10, color: "#C2412F", sickOnly: true, apply: s => { s.treated = true; s.health = Math.min(100, s.health + 60); } },
  ],
};
function itemState(it, v) {
  const owned = !!v.owned[it.id];
  if (it.stage && v.stage < it.stage) return { btn: "未解锁", note: `${Pet.STAGE_NAMES[it.stage]}阶段免费解锁`, active: false, dim: true };
  if (it.streak && v.streak < it.streak && !owned) return { btn: "未解锁", note: `连续学习 ${it.streak} 天解锁（现在 ${v.streak} 天）`, active: false, dim: true };
  if ((it.stage || it.streak) && !owned) return { btn: "领取", note: "已达成，免费领取", active: true, free: true };
  if (owned && !it.kind) return { btn: "已拥有", note: "已拥有，去装扮小窝里摆放", active: false };
  if (it.sickOnly && !v.sick) return { btn: "不需要", note: `${v.cat.name}很健康`, active: false };
  if (it.sickOnly && v.treated) return { btn: "已用药", note: "已经吃过药，接下来坚持学习康复", active: false };
  const price = `${it.food || 0} 猫粮${it.water ? ` + ${it.water} 水` : ""}`;
  const ok = v.food >= (it.food || 0) && v.water >= (it.water || 0);
  return { btn: ok ? "兑换" : "不够", note: price, active: ok };
}
function pageShop(tab) {
  let cur = SHOP[tab] ? tab : "snack";
  const box = h(`<div class="page shop"><header class="subhead"><a class="iconbtn" href="#/meow" aria-label="返回喵喵">${svgI(ICON.back, "stroke")}</a><h1 class="display small grow">喵喵小卖部</h1></header>
    <section class="res2"><div class="food">${FOOD_I}<div><small>猫粮</small><b class="f"></b></div></div><div class="water">${WATER_I}<div><small>水</small><b class="w"></b></div></div></section>
    <p class="hint">答对 1 题得 1 猫粮；听完一段对话、听力或新闻得 2 水。</p>
    <div class="seg" role="tablist" aria-label="商品分类"></div><div class="items"></div></div>`);
  app.append(box);
  function draw() {
    const v = Pet.view();
    box.querySelector(".f").textContent = fmt(v.food); box.querySelector(".w").textContent = fmt(v.water);
    box.querySelector(".seg").innerHTML = [["snack", "零食"], ["gear", "用品"], ["scene", "场景"], ["med", "药品"]].map(([k, l]) => `<button role="tab" aria-selected="${k === cur}" data-t="${k}">${l}</button>`).join("");
    box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { cur = b.dataset.t; draw(); });
    const list = box.querySelector(".items");
    list.innerHTML = "";
    SHOP[cur].forEach(it => {
      const st = itemState(it, v);
      const row = h(`<div class="item ${st.dim ? "dim" : ""}"><span class="sw" style="background:${it.color}"></span><div class="grow"><b>${esc(it.name)}</b><small>${esc(it.effect)}</small><em>${esc(st.note)}</em></div><button ${st.active ? "" : "disabled"}>${st.btn}</button></div>`);
      row.querySelector("button").onclick = () => {
        const S = Pet.state;
        if (st.free) {
          S.owned[it.id] = 1;
          if (it.id.startsWith("tree")) S.tree = Math.max(S.tree, +it.id.slice(4)); else if (S.decor[it.id] !== undefined) S.decor[it.id] = 1;
          Pet.save(); Pet.toast(`获得了${it.name}，喵～`); draw(); return;
        }
        const ok = Pet.buy(it.kind ? it : { ...it, apply: s => { s.owned[it.id] = 1; if (s.decor[it.id] !== undefined) s.decor[it.id] = 1; } });
        if (ok) { if (it.kind === "snack") feedScene(it.id); else if (Pet.state.settings.meow) meowFor("correct"); Pet.toast(it.kind === "snack" ? `${esc(Pet.state.cat.name)}吃了${it.name}，好开心！` : it.kind === "med" ? `用了${it.name}` : `买到了${it.name}，去装扮小窝里摆放吧`, "good"); }
        draw();
      };
      list.append(row);
    });
  }
  draw();
}

/* ---------- dress up the room ---------- */
function pageDress() {
  const box = h(`<div class="page dress"><header class="subhead"><a class="iconbtn" href="#/home" aria-label="返回主页">${svgI(ICON.back, "stroke")}</a><h1 class="display small grow">装扮小窝</h1><a class="btn small ghost" href="#/shop/gear">去小卖部</a></header>
    <div class="dress-room"></div><div class="seg" role="tablist" aria-label="装扮分类"></div><div class="items"></div></div>`);
  app.append(box);
  let cur = "scene", editing = false;
  function draw() {
    const v = Pet.view(), S = Pet.state;
    const r = box.querySelector(".dress-room");
    r.innerHTML = ""; r.append(roomBox(v, { label: false, cat: !editing }));
    const placed = Object.keys(ITEM_NAMES).filter(k => k === "tree" ? S.tree : S.decor[k]);
    r.append(h(`<div class="arrange"><button class="btn small ${editing ? "" : "ghost"}" id="arr">${editing ? "摆好了" : "✥ 自由摆放家具"}</button>${editing ? `<span class="hint">拖动猫爬架、猫窝等到想要的位置</span><button class="btn small ghost" id="rst">恢复默认</button>` : placed.length ? "" : `<span class="hint">先在下面摆放家具，再来调整位置</span>`}</div>`));
    r.querySelector("#arr").onclick = () => { editing = !editing; if (!editing) Pet.toast("新的摆放已保存", "good"); draw(); };
    if (editing) { r.querySelector("#rst").onclick = () => { S.layout = {}; Pet.save(); draw(); }; makeDraggable(r.querySelector(".room-svg"), S); }
    box.querySelector(".seg").innerHTML = [["scene", "场景"], ["tree", "猫爬架"], ["decor", "家具"]].map(([k, l]) => `<button role="tab" aria-selected="${k === cur}" data-t="${k}">${l}</button>`).join("");
    box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { cur = b.dataset.t; draw(); });
    const list = box.querySelector(".items"); list.innerHTML = "";
    let rows;
    if (cur === "scene") rows = Object.entries(SCENES).map(([k, s]) => ({ name: s.name, own: k === "living" || S.owned["scene_" + k], on: S.scene === k, color: s.rug, set: () => { S.scene = k; applyTheme(k); Pet.toast(`换成了“${s.name}”，整个应用也换上了同款配色`, "good"); } }));
    else if (cur === "tree") rows = [["不放猫爬架", 0, "#EDE3D5"], ["猫抓柱", 1, "#E2C69A"], ["二层猫爬架", 2, "#8FA9C9"], ["豪华猫爬架 · 带小屋", 3, "#5D7499"]].map(([n, t, c]) => ({ name: n, own: t === 0 || S.owned["tree" + t], on: S.tree === t, color: c, set: () => { S.tree = t; } }));
    else rows = [["bed", "软软猫窝", "#C76F5B"], ["toy", "逗猫棒和小球", "#F07C9A"], ["scratch", "剑麻猫抓板", "#D9B98A"], ["fish", "小鱼缸", "#5CB8C9"], ["fountain", "循环饮水机", "#5C93C9"]].map(([k, n, c]) => ({ name: n, own: S.owned[k], on: !!S.decor[k], color: c, toggle: true, set: () => { S.decor[k] = S.decor[k] ? 0 : 1; } }));
    rows.forEach(it => {
      const row = h(`<div class="item ${it.own ? "" : "dim"} ${it.on ? "on" : ""}"><span class="sw" style="background:${it.color}"></span><div class="grow"><b>${esc(it.name)}</b><em>${it.own ? (it.on ? (it.toggle ? "已摆放" : "使用中") : "已拥有") : "未拥有 · 去小卖部解锁"}</em></div>
        ${it.own ? `<button>${it.on ? (it.toggle ? "收起" : "使用中") : (it.toggle ? "摆放" : "使用")}</button>` : `<a class="btn small ghost" href="#/shop/${cur === "scene" ? "scene" : "gear"}">去看看</a>`}</div>`);
      const b = row.querySelector("button");
      if (b) b.onclick = () => { if (it.on && !it.toggle) return; it.set(); Pet.save(); draw(); };
      list.append(row);
    });
  }
  draw();
}

/* drag furniture inside the room svg; offsets saved in S.layout */
function makeDraggable(svg, S) {
  svg.classList.add("editing");
  const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.querySelectorAll("[data-item]").forEach(g => {
    const k = g.dataset.item;
    g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-label", `移动${ITEM_NAMES[k]}（方向键也可以移动）`);
    let start = null;
    const set = (dx, dy) => { [dx, dy] = clampItem(k, dx, dy, S.tree); S.layout[k] = [dx, dy]; g.setAttribute("transform", `translate(${dx} ${dy})`); };
    g.onpointerdown = e => { e.preventDefault(); g.setPointerCapture(e.pointerId); const p = pt(e), cur = S.layout[k] || [0, 0]; start = { x: p.x - cur[0], y: p.y - cur[1] }; g.classList.add("drag"); };
    g.onpointermove = e => { if (!start) return; const p = pt(e); set(p.x - start.x, p.y - start.y); };
    g.onpointerup = g.onpointercancel = () => { if (!start) return; start = null; g.classList.remove("drag"); Pet.save(); };
    g.onkeydown = e => { const d = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }[e.key]; if (!d) return; e.preventDefault(); const c = S.layout[k] || [0, 0]; set(c[0] + d[0], c[1] + d[1]); Pet.save(); };
  });
}

/* ---------- vet ---------- */
function pageVet() {
  const box = h(`<div class="page vet"></div>`);
  app.append(box);
  function draw() {
    const v = Pet.view();
    const head = `<header class="subhead"><a class="iconbtn" href="#/meow" aria-label="返回喵喵">${svgI(ICON.back, "stroke")}</a><h1 class="display small grow">喵喵宠物医院</h1><span class="hint">猫粮 ${fmt(v.food)} · 水 ${fmt(v.water)}</span></header>`;
    const pat = `<section class="card patient">${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: v.sick && !v.treated ? "sick" : "happy", size: 120 })}<div><b>${esc(v.cat.name)}</b><p>${!v.sick ? "很健康，不用看医生。保持每天学习就好～" : v.treated ? "已经退烧啦！接下来要好好吃饭、按时学习。" : `诊断：感冒发烧<br>原因：${v.idle >= 7 ? `${Math.floor(v.idle)} 天没学习，` : ""}饿瘦了、抵抗力下降`}</p></div></section>`;
    let mid = "";
    if (v.sick && !v.treated) {
      mid = `<h2>选择治疗方式</h2>${SHOP.med.filter(m => m.sickOnly).map(m => { const ok = v.food >= m.food && v.water >= m.water; return `<div class="item ${ok ? "" : "dim"}"><div class="grow"><b>${m.name}</b><small>${m.effect}</small><em>${m.food} 猫粮 + ${m.water} 水</em></div><button data-m="${m.id}" ${ok ? "" : "disabled"}>${ok ? "付款" : "不够"}</button></div>`; }).join("")}
        <a class="alert warn" href="#/quiz/${v.lastLevel}"><b>猫粮不够？</b><span>先学 10 题能赚 10 猫粮，听一段听力得 2 水 →</span></a>`;
    }
    const days = [0, 1, 2].map(i => `<div class="${i < v.recoverDays.length ? "done" : ""}"><b>第 ${i + 1} 天</b><small>${i < v.recoverDays.length ? "完成" : "待完成"}</small></div>`).join("");
    const plan = v.sick ? `<section class="card"><h2>康复计划：连续学习 3 天</h2><div class="days">${days}</div><p class="hint">${v.treated ? "每天答对 10 题算打卡。" : "先用药，再开始康复打卡。"}完全康复后会重新戴上配饰。</p>
      ${v.treated ? `<a class="btn big" href="#/quiz/${v.lastLevel}">开始今天的康复学习</a>` : ""}</section>` : "";
    box.innerHTML = head + pat + mid + plan;
    box.querySelectorAll("[data-m]").forEach(b => b.onclick = () => {
      const m = SHOP.med.find(x => x.id === b.dataset.m);
      if (Pet.buy(m)) { Pet.toast(`<b>${esc(Pet.state.cat.name)}退烧了！</b><br>坚持学习 3 天就能完全康复`, "big"); draw(); }
    });
  }
  draw();
}

/* ---------- account ---------- */
function pageAccount() {
  const box = h(`<div class="page account"></div>`);
  app.append(box);
  function draw() {
    const v = Pet.view(), S = Pet.state;
    const acc = v.totalAnswered ? Math.round(v.totalCorrect / v.totalAnswered * 100) : 0;
    box.innerHTML = `<h1 class="display small">账号</h1>
      <section class="card profile"><span class="avatar">${catSVG({ breed: v.cat.breed, stage: 2, mood: "happy", size: 64 })}</span>
        <div class="grow"><label class="field inline"><span>昵称</span><input id="nick" maxlength="12" value="${esc(v.profile.nick)}"></label><small>学习 ${v.studyDays} 天 · 已听 ${fmt(Object.keys(v.heard).length)} 个词</small></div></section>
      <section class="stats3"><div><b>${v.studyDays}</b><small>学习天数</small></div><div><b>${acc}%</b><small>正确率</small></div><div><b>${fmt(v.totalCorrect)}</b><small>答对题数</small></div></section>
      <section class="card">
        <h2>我的猫咪</h2>
        <label class="field"><span>名字</span><input id="cname" maxlength="8" value="${esc(v.cat.name)}"></label>
        <div class="breeds small" role="radiogroup" aria-label="品种">${PICK_BREEDS.map(k => [k, BREEDS[k]]).map(([k, b]) => `<button role="radio" aria-checked="${k === v.cat.breed}" data-b="${k}">${catSVG({ breed: k, stage: 1, mood: "happy", size: 44 })}<span>${b.short}</span></button>`).join("")}</div>
        <p class="hint">换品种不会影响成长值和已解锁的东西。</p>
      </section>
      <section class="card list">
        <a href="#/desk"><span>桌面陪伴</span><em>${S.settings.desk.float ? "已开启" : "未开启"} ›</em></a>
        <label><span>每日目标</span><select id="goal">${[10, 20, 30, 50].map(n => `<option value="${n}" ${n === S.goal ? "selected" : ""}>答对 ${n} 题</option>`).join("")}</select></label>
        <label><span>答对时喵叫</span><input type="checkbox" id="meowOn" ${S.settings.meow ? "checked" : ""}></label>
        <label><span>猫咪在页面里走动</span><input type="checkbox" id="roamOn" ${S.settings.roam ? "checked" : ""}></label>
        <label><span>猫咪想你时提醒我${IS_NATIVE ? "" : "<small>（App 版可用）</small>"}</span><input type="checkbox" id="notifyOn" ${S.settings.notify !== false ? "checked" : ""}></label>
      </section>
      ${IS_NATIVE ? "" : `<section class="card install"><h2>装到 iPhone 上</h2>
        <ol><li>用 <b>Safari</b> 打开这个网站</li><li>点底部的 <b>分享</b> 按钮 <span aria-hidden="true">⬆︎</span></li><li>选 <b>添加到主屏幕</b> → 添加</li></ol>
        <p class="hint">之后从桌面图标打开，就是全屏的“猫猫俄语通”，离线也能用。想装原生版（发音打分更准），见 <a href="https://github.com/shizhongzhou/russian-learn/releases/tag/ios-latest" target="_blank" rel="noopener">iOS 安装包</a>。</p>
        <h2>安卓手机</h2><p class="hint">直接下载安装包：<a href="https://github.com/shizhongzhou/russian-learn/releases/download/android-latest/MaoMaoRussian.apk">MaoMaoRussian.apk</a>，下载后点开安装（第一次要允许“安装未知应用”）。</p></section>`}
      <section class="card"><h2>搬家：导出 / 导入进度</h2><p class="hint">网页版和 App 的进度是分开保存的。在旧的地方点“导出”，到新的地方点“导入”并粘贴，猫咪就搬过来了。</p>
        <div class="row2"><button class="btn ghost" id="exp">导出进度</button><button class="btn ghost" id="imp">导入进度</button></div>
        <textarea id="moveBox" rows="3" hidden placeholder="把导出的进度码粘贴到这里"></textarea><p class="hint" id="moveHint"></p></section>
      <div class="cloud-slot"></div>
      <section class="card"><h2>数据</h2><button class="btn ghost" id="reset">清除本机数据，重新开始</button><p class="hint" id="resetHint"></p></section>`;
    box.querySelector(".cloud-slot").replaceWith(cloudCard());
    const mb = box.querySelector("#moveBox"), mh = box.querySelector("#moveHint");
    box.querySelector("#exp").onclick = async () => {
      const code = "MM1:" + btoa(unescape(encodeURIComponent(JSON.stringify(Pet.state))));
      mb.hidden = false; mb.value = code; mb.select();
      try { await navigator.clipboard.writeText(code); mh.textContent = "进度码已复制，到新的地方点“导入进度”粘贴即可。"; } catch { mh.textContent = "请长按上面的进度码全选复制。"; }
    };
    box.querySelector("#imp").onclick = () => {
      if (mb.hidden || !mb.value.startsWith("MM1:") || mb.dataset.mode !== "imp") { mb.hidden = false; mb.value = ""; mb.dataset.mode = "imp"; mb.focus(); mh.textContent = "粘贴进度码后再点一次“导入进度”。"; return; }
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(mb.value.trim().slice(4)))));
        if (!data.profile || !data.cat) throw 0;
        localStorage.setItem("mm_pet_v1", JSON.stringify(data)); location.hash = "#/home"; location.reload();
      } catch { mh.textContent = "进度码不对，请完整复制后再试。"; }
    };
    box.querySelector("#notifyOn").onchange = async e => {
      S.settings.notify = e.target.checked; Pet.save();
      if (!IS_NATIVE) { if (e.target.checked) Pet.toast("网页版没法在关掉后提醒；装上 App 版就能收到猫咪的消息"); return; }
      const ok = await REMIND.schedule(true);
      Pet.toast(!e.target.checked ? "已关闭提醒" : ok ? "好的！不学习时猫咪会来找你" : "请在手机设置里允许“猫猫俄语通”的通知", ok || !e.target.checked ? "good" : "warn");
    };
    box.querySelector("#nick").onchange = e => { S.profile.nick = e.target.value.trim() || S.profile.nick; Pet.save(); };
    box.querySelector("#cname").onchange = e => { S.cat.name = e.target.value.trim() || S.cat.name; Pet.save(); Pet.toast(`以后就叫它“${esc(S.cat.name)}”啦`); };
    box.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { S.cat.breed = b.dataset.b; Pet.save(); chrome("account"); draw(); });
    box.querySelector("#goal").onchange = e => { S.goal = +e.target.value; Pet.save(); };
    box.querySelector("#meowOn").onchange = e => { S.settings.meow = e.target.checked; Pet.save(); if (S.settings.meow) meowSound(); };
    box.querySelector("#roamOn").onchange = e => { S.settings.roam = e.target.checked; Pet.save(); Pet.setRoam(true); };
    let armed = false;
    box.querySelector("#reset").onclick = e => {
      if (!armed) { armed = true; e.target.textContent = "再点一次确认清除"; box.querySelector("#resetHint").textContent = "会删除猫咪、成长值和所有学习记录，无法恢复。"; return; }
      Pet.reset(); location.hash = "#/welcome";
    };
  }
  draw();
}

/* ---------- desktop companion (needs the native Android app) ---------- */
function pageDesk() {
  const S = Pet.state, v = Pet.view();
  const box = h(`<div class="page desk"><header class="subhead"><a class="iconbtn" href="#/account" aria-label="返回账号">${svgI(ICON.back, "stroke")}</a><h1 class="display small grow">桌面陪伴</h1></header>
    <section class="phone" aria-label="手机桌面预览"><div class="apps">${["相册", "日历", "天气", "音乐", "地图", "相机", "备忘录", "时钟"].map((n, i) => `<div><span style="background:${["#F2C14E", "#E76F7C", "#6FA8DC", "#C27BA0", "#76A87A", "#8E9AA6", "#F0B37E", "#5B6B7A"][i]}"></span><small>${n}</small></div>`).join("")}</div>
      <div class="desk-cat">${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: "walk", size: 64 })}</div>
      <div class="widget">${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: v.mood, size: 46 })}<div><b>${esc(v.cat.name)} · 饱食 ${Math.round(v.full)}%</b><small>今天还差 ${Math.max(0, v.goal - v.daily.correct)} 题</small></div></div></section>
    <section class="card list"></section>
    <section class="card note"><b>现在还不能用</b><p>浏览器里的网页没有权限显示在其他 App 上面，所以这个功能要等<b>安卓 App 版</b>上线后才能用：开启“显示在其他应用上层”权限后，猫会在桌面和其他 App 上走动，点它就回到学习。<br>iPhone 系统不允许 App 在桌面上自由走动，到时会以桌面小组件、锁屏和灵动岛的形式陪伴。</p>
    <p class="hint">下面的开关先帮你记下偏好，App 版上线后直接生效。</p></section></div>`);
  app.append(box);
  const list = box.querySelector(".list");
  [["float", "在桌面和其他 App 上走动", "安卓需开启悬浮窗权限"], ["widget", "桌面小组件", "显示饱食度和今日进度"], ["quiet", "夜间免打扰 22:00–8:00", "这段时间猫咪在小组件里睡觉"], ["idle", "玩游戏、看视频时自动躲起来", "全屏应用时不打扰"]].forEach(([k, n, d]) => {
    const row = h(`<label><span><b>${n}</b><small>${d}</small></span><input type="checkbox" ${S.settings.desk[k] ? "checked" : ""}></label>`);
    row.querySelector("input").onchange = e => { S.settings.desk[k] = e.target.checked; Pet.save(); };
    list.append(row);
  });
  const dc = box.querySelector(".desk-cat");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) later(() => { dc.style.left = (5 + Math.random() * 70) + "%"; dc.style.top = (5 + Math.random() * 45) + "%"; }, 2600);
}


"use strict";
/* ========== 猫猫俄语通 — feeding scene: the cat walks over and eats what you gave it ========== */
const FOOD_ART = {
  // drawn around (0,0) = centre of the dish on the floor
  kibble: { name: "猫粮", dish: "#D9534F", rim: "#B8433F", food: i => `<g class="bits">${[[-16, -8], [-6, -11], [5, -9], [15, -7], [-10, -3], [0, -4], [10, -2], [-2, -15], [8, -14]].map(([x, y], k) => `<ellipse class="bit" style="--d:${k * 0.12}s" cx="${x}" cy="${y}" rx="4.6" ry="3.8" fill="${["#C9874A", "#B87A40", "#D59658"][k % 3]}"/>`).join("")}</g>`, drop: true, sound: "kibble" },
  water:  { name: "水", dish: "#5C93C9", rim: "#4A7BB0", food: () => `<ellipse cx="0" cy="-6" rx="22" ry="5" fill="#9FD0F0"/><ellipse class="ripple" cx="0" cy="-6" rx="8" ry="2" fill="none" stroke="#fff" stroke-width="1.5"/>`, sound: "lap" },
  s1: { name: "小鱼干", dish: "#EEE6D8", rim: "#CFC3AE", food: () => [[-12, -8, -10], [6, -10, 8], [-2, -16, -4]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-12 0 Q-2 -6 8 0 Q-2 6 -12 0 Z" fill="#C9A06A"/><path d="M8 0 l7 -5 v10 Z" fill="#B88A50"/><circle cx="-8" cy="-1" r="1.3" fill="#3B2E22"/><path d="M-4 -3 v6 M0 -3 v6" stroke="#A7834F" stroke-width="1"/></g>`).join("") },
  s2: { name: "猫条", dish: "#F7D9E2", rim: "#E6B5C4", food: () => `<path d="M-14 -6 Q0 -16 14 -6 Q0 -2 -14 -6 Z" fill="#E9A07A"/><g class="tube"><rect x="18" y="-58" width="16" height="48" rx="3" fill="#F07C9A" transform="rotate(30 26 -34)"/><rect x="18" y="-58" width="16" height="12" rx="3" fill="#fff" opacity=".7" transform="rotate(30 26 -34)"/></g>` },
  s3: { name: "冻干", dish: "#E8E2F2", rim: "#C9BEDF", food: () => [[-14, -7], [-3, -9], [8, -7], [-8, -15], [4, -16], [14, -12]].map(([x, y], k) => `<rect class="bit" style="--d:${k * 0.15}s" x="${x - 5}" y="${y - 5}" width="10" height="9" rx="2" fill="${k % 2 ? "#E8C9A0" : "#D9B07A"}"/>`).join("") },
  s4: { name: "豪华罐头", dish: "#F2EEE8", rim: "#D6CEC2", food: () => `<path d="M-18 -6 Q-10 -18 0 -14 Q10 -20 18 -6 Q0 -2 -18 -6 Z" fill="#E59A8A"/><path d="M-8 -10 q4 -3 8 0 M4 -12 q3 -2 6 0" stroke="#C9776A" stroke-width="1.5" fill="none"/>
      <g class="can" transform="translate(44 -6)"><rect x="-14" y="-30" width="28" height="30" rx="4" fill="#D9534F"/><rect x="-14" y="-24" width="28" height="12" fill="#F6E7D3"/><path d="M-7 -18 q6 -5 12 0 q-6 5 -12 0 Z M5 -18 l4 -3 v6 Z" fill="#5C93C9"/><ellipse cx="0" cy="-30" rx="14" ry="4" fill="#C9C9CF"/><path d="M-12 -31 Q-20 -46 -6 -50" fill="none" stroke="#B9B9C0" stroke-width="3"/><ellipse cx="0" cy="-30" rx="11" ry="2.6" fill="#E59A8A"/></g>` },
};
function feedScene(kind = "kibble", onDone) {
  const S = Pet.state, v = Pet.view(), art = FOOD_ART[kind] || FOOD_ART.kibble;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ov = document.createElement("div");
  ov.className = "feed-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", `${S.cat.name}在吃${art.name}`);
  ov.innerHTML = `<div class="feed-card">
    <div class="feed-stage">
      <svg class="feed-dish" viewBox="-60 -70 120 90" aria-hidden="true">
        <ellipse cx="0" cy="12" rx="40" ry="5" fill="#000" opacity=".12"/>
        <path d="M-30 -4 H30 Q27 12 0 12 Q-27 12 -30 -4 Z" fill="${art.dish}"/><ellipse cx="0" cy="-4" rx="30" ry="6" fill="${art.rim}"/>
        <g class="food">${art.food()}</g>
        ${art.drop ? `<g class="falling">${[0, 1, 2, 3, 4].map(k => `<ellipse style="--d:${k * 0.09}s;--x:${(k - 2) * 7}px" cx="0" cy="-60" rx="4.5" ry="3.6" fill="#C9874A"/>`).join("")}</g>` : ""}
      </svg>
      <div class="feed-cat walking">${catSideSVG({ breed: v.cat.breed, stage: v.shownStage, size: 170 })}</div>
      <div class="feed-say" hidden></div>
    </div>
    <p class="feed-cap">${esc(S.cat.name)}${kind === "water" ? "来喝水啦" : `来吃${art.name}啦`}</p>
    <button class="btn ghost small feed-x">好的</button></div>`;
  document.body.append(ov);
  const cat = ov.querySelector(".feed-cat"), say = ov.querySelector(".feed-say"), cap = ov.querySelector(".feed-cap");
  const close = () => { ov.classList.add("out"); setTimeout(() => ov.remove(), 260); onDone && onDone(); };
  ov.querySelector(".feed-x").onclick = close;
  ov.onclick = e => { if (e.target === ov) close(); };
  const T = reduce ? 0 : 1;
  setTimeout(() => {
    cat.className = "feed-cat eating";
    cat.innerHTML = catSideSVG({ breed: v.cat.breed, stage: v.shownStage, size: 170, eat: true });
    ov.querySelector(".food").classList.add("eaten");
    say.hidden = false; say.textContent = kind === "water" ? "吧嗒吧嗒～" : kind === "s4" ? "啊呜啊呜，罐头好香！" : "啊呜啊呜～";
    if (S.settings.meow) meowFor("eat");
  }, 1300 * T + 50);
  setTimeout(() => {
    cat.className = "feed-cat done";
    cat.innerHTML = catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: "cheer", size: 150 });
    say.textContent = kind === "water" ? "喝饱啦，谢谢你！" : "好吃！最喜欢你了";
    cap.textContent = kind === "water" ? "水分补满了一些" : "吃饱饱，心情变好了";
    if (S.settings.meow) meowFor("pet");
  }, 3700 * T + 100);
  setTimeout(() => { if (document.body.contains(ov)) close(); }, 6000 * T + 600);
}

/* ---------- boot ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
route();
if (typeof Cloud !== "undefined") Cloud.start();

/* ========== intro (v2): 小橘 walks out, pounces on the yarn ball, looks at you, startles and runs off.
   The full story plays on the first open of the day; later opens just show the logo for a moment. Tap to skip. ========== */
(function intro() {
  const S = Pet.state;
  const breed = (S.profile && has3D(S.cat.breed)) ? S.cat.breed : "orange";
  const name = S.profile ? S.cat.name : "小橘";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const day = new Date().toDateString(), full = !reduce && store.get("introDay", "") !== day;
  store.set("introDay", day);
  const el = document.createElement("div");
  el.className = "intro v2intro";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<div class="v2i-logo"><span><img src="${CAT3D[breed]}" alt=""></span></div>
    <div class="v2i-title"><b>猫猫俄语通</b><small>和${esc(name)}一起，轻松学俄语。</small></div>
    <div class="v2i-stage"><div class="v2i-floor"></div>
      <img class="v2i-ball" src="img/item/ball.webp" alt="">
      <div class="v2i-cat"><img data-p="walk" src="img/pose/walk.webp" alt=""><img data-p="crouch" src="img/pose/crouch.webp" alt=""><img data-p="pounce" src="img/pose/pounce.webp" alt=""><img data-p="paw" src="img/pose/ball.webp" alt=""></div>
      <span class="v2i-alert">!</span><span class="v2i-dust"></span></div>
    <small class="v2i-skip">轻点跳过</small>`;
  document.body.append(el);
  let raf = 0;
  const done = () => { if (el.classList.contains("bye")) return; cancelAnimationFrame(raf); el.classList.add("bye"); setTimeout(() => el.remove(), 500); };
  el.addEventListener("click", done);
  if (!full) { el.classList.add("final", "short"); setTimeout(done, 1300); return; }
  const $ = q => el.querySelector(q), cat = $(".v2i-cat"), ball = $(".v2i-ball"), alert = $(".v2i-alert"), dust = $(".v2i-dust");
  const P = {}; cat.querySelectorAll("img").forEach(i => P[i.dataset.p] = i);
  const cl = v => Math.max(0, Math.min(1, v)), seg = (t, a, b) => cl((t - a) / (b - a));
  const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, out3 = u => 1 - Math.pow(1 - u, 3);
  const segs = [["walk", -1, 3.3], ["crouch", 3.3, 4.2], ["pounce", 4.2, 4.62], ["paw", 4.62, 7.0], ["walk", 7.0, 99]];
  const t0 = performance.now();
  (function frame(now) {
    const t = (now - t0) / 1000;
    const bu = out3(seg(t, 0, 1.3));
    ball.style.transform = `translateX(${(420 - 202 * bu).toFixed(1)}px) rotate(${(-540 * bu).toFixed(0)}deg)`;
    ball.style.opacity = t > 4.55 && t < 7.0 ? 0 : 1;
    let x = -130, y = 0, rot = 0, sq = 1;
    if (t < 0.3) x = -130;
    else if (t < 3.3) { const w = t - 0.3; x = -130 + 58 * w; y = 3 * Math.abs(Math.sin(w * Math.PI / 0.36)); rot = 1.4 * Math.sin(w * Math.PI / 0.36); }
    else if (t < 4.2) { x = 44; sq = 0.97 + 0.03 * Math.cos((t - 3.3) * 14); rot = t > 3.6 && t < 4.0 ? 1.5 * Math.sin((t - 3.6) * 40) : 0; }
    else if (t < 4.62) { const u = ease(seg(t, 4.2, 4.62)); x = 44 + 92 * u; y = 44 * Math.sin(Math.PI * u); }
    else if (t < 6.6) { x = 136; sq = 1 + 0.012 * Math.sin((t - 4.62) * 3.2); }
    else if (t < 7.0) { x = 136; y = 30 * Math.sin(Math.PI * seg(t, 6.6, 7.0)); }
    else { const r = t - 7.0; x = 136 + 230 * r; y = 5 * Math.abs(Math.sin(r * Math.PI / 0.24)); rot = -2 + 2 * Math.sin(r * Math.PI / 0.24); }
    cat.style.transform = `translate(${x.toFixed(1)}px, ${(-y).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scaleY(${sq.toFixed(3)})`;
    const op = { walk: 0, crouch: 0, pounce: 0, paw: 0 }, X = 0.12;
    segs.forEach(([k, a, b]) => { op[k] = Math.max(op[k], Math.min(cl((t - a + X / 2) / X), cl((b - t + X / 2) / X))); });
    for (const k in P) P[k].style.opacity = op[k].toFixed(2);
    const a = seg(t, 6.6, 6.72), aOut = seg(t, 7.05, 7.25);
    alert.style.opacity = (a * (1 - aOut)).toFixed(2);
    alert.style.transform = `translate(${(x + 92).toFixed(0)}px, ${(-y).toFixed(0)}px) scale(${(0.4 + 0.7 * a - 0.1 * seg(t, 6.72, 6.82)).toFixed(2)})`;
    dust.style.opacity = (0.7 * seg(t, 7.0, 7.1) * (1 - seg(t, 7.2, 7.8))).toFixed(2);
    dust.style.transform = `scale(${(0.5 + 1.3 * seg(t, 7.0, 7.8)).toFixed(2)})`;
    if (t > 7.6) el.classList.add("final");
    if (t > 9.4) return done();
    raf = requestAnimationFrame(frame);
  })(t0);
})();

/* ========== while you were away: welcome-back card + reminder notifications ========== */
const REMIND = {
  plan(name) {
    // [hours after the last study, title, body]
    return [
      [20, `${name}在等你 🐾`, `今天还没学俄语哦，${name}趴在门口等你回来。`],
      [44, `${name}饿了`, `${name}的碗空了，肚子咕咕叫……学几道题给它赚点猫粮吧。`],
      [72, `${name}瘦了一圈`, `已经三天没学习，${name}瘦了、也不开心了。回来摸摸它？`],
      [130, `${name}好像不舒服`, `${name}没精神、有点发烧。再不回来它就要生病了！`],
      [170, `${name}生病了`, `${name}生病了，需要你带它去宠物医院。回来学习就能赚到买药的猫粮。`],
    ];
  },
  at(h) {   // never ring at night: move into 9:00–21:30
    const d = new Date(Pet.state.lastStudy + h * 3600e3);
    const hr = d.getHours() + d.getMinutes() / 60;
    if (hr < 9) d.setHours(9, 30, 0, 0);
    else if (hr > 21.5) { d.setDate(d.getDate() + 1); d.setHours(9, 30, 0, 0); }
    if (d.getTime() < Date.now() + 60e3) d.setTime(Date.now() + 15 * 60e3);
    return d;
  },
  async schedule(ask = false) {
    const LN = capPlugin("LocalNotifications"), S = Pet.state;
    if (!LN || !S.profile) return false;
    try {
      let p = await LN.checkPermissions();
      if (p.display !== "granted" && ask) p = await LN.requestPermissions();
      if (p.display !== "granted") return false;
      await LN.cancel({ notifications: [101, 102, 103, 104, 105].map(id => ({ id })) }).catch(() => {});
      if (S.settings.notify === false) return true;
      const name = S.cat.name || "猫咪";
      const list = REMIND.plan(name).map(([h, title, body], i) => ({ id: 101 + i, title, body, schedule: { at: REMIND.at(h), allowWhileIdle: true }, extra: { route: "#/home" } }))
        .filter(n => n.schedule.at.getTime() > Date.now());
      if (list.length) await LN.schedule({ notifications: list });
      return true;
    } catch { return false; }
  },
};
let _remT;
Pet.onChange(() => { clearTimeout(_remT); _remT = setTimeout(() => REMIND.schedule(false), 4000); });
(function welcomeBack() {
  const S = Pet.state;
  if (!S.profile) return;
  const last = S.lastSeen || S.lastStudy, away = (Date.now() - last) / 864e5;
  S.lastSeen = Date.now(); Pet.save();
  const LN = capPlugin("LocalNotifications");
  if (LN) {
    LN.addListener && LN.addListener("localNotificationActionPerformed", e => { const r = e && e.notification && e.notification.extra && e.notification.extra.route; if (r) location.hash = r; });
    // ask once, a little after the first study session
    if (S.settings.notify !== false && !S.notifyAsked && S.studyDays >= 1) { S.notifyAsked = 1; Pet.save(); setTimeout(() => REMIND.schedule(true), 5000); }
    else REMIND.schedule(false);
  }
  const idle = (Date.now() - S.lastStudy) / 864e5;
  if (away < 0.5 || idle < 0.75) return;
  const v = Pet.view();
  const lines = [];
  if (v.sick) lines.push("生病了，正发着烧");
  else {
    if (v.full < 30) lines.push("饿得肚子咕咕叫");
    if (v.drink < 30) lines.push("渴了");
    if (v.thin) lines.push("瘦了一圈");
    if (!lines.length) lines.push("一直趴在门口等你");
  }
  const days = Math.floor(idle);
  setTimeout(() => {
    const ov = document.createElement("div");
    ov.className = "feed-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "欢迎回来");
    ov.innerHTML = `<div class="feed-card back">
      <div class="back-cat">${catSVG({ breed: v.cat.breed, stage: v.shownStage, mood: v.sick ? "sick" : v.mood === "hungry" ? "hungry" : "sad", size: 150 })}</div>
      <h2>你终于回来啦！</h2>
      <p>${days >= 1 ? `你已经 <b>${days} 天</b>没学俄语了，` : "好久不见，"}${esc(v.cat.name)}${lines.join("、")}。</p>
      <div class="row2"><a class="btn" href="${v.sick ? "#/vet" : `#/quiz/${v.lastLevel}`}">${v.sick ? "带它去看医生" : "学 10 题给它补补"}</a><button class="btn ghost" data-x>先摸摸它</button></div></div>`;
    document.body.append(ov);
    const close = () => ov.remove();
    ov.querySelector("[data-x]").onclick = () => { close(); Pet.pet(); if (S.settings.meow) meowFor("pet"); };
    ov.querySelector("a").onclick = close;
    ov.onclick = e => { if (e.target === ov) close(); };
    if (S.settings.meow) meowFor(v.mood === "hungry" ? "hungry" : "wrong");
  }, 3700);
})();

"use strict";
/* ========== #/play — the feather wand ==========
   Drag the feather (or shake the phone) and the cat crouches, pounces and paws at it.
   It only rarely catches it; a catch gives a small reward, at most 3 times a day. */
const PLAY = { catchChance: 0.08, maxPerDay: 3 };
function pagePlay() {
  const v = Pet.view(), orange = v.cat.breed === "orange";
  const img = {
    idle: animSrc(v.cat.breed,"sit",v.shownStage) || petSrc(v.cat.breed,v.shownStage),
    crouch: animSrc(v.cat.breed,"charge",v.shownStage) || petSrc(v.cat.breed,v.shownStage),
    pounce: animSrc(v.cat.breed,"toy",v.shownStage) || petSrc(v.cat.breed,v.shownStage)
  };
  const key = Pet.today() + "|wandcatch";
  const box = h(`<div class="page play play3">
    <header class="ptop"><a class="pawbtn" href="#/home" aria-label="返回主页">${ic3(I3.paw)}</a><h1>逗${isDog(v.cat.breed) ? "狗" : "猫"}时间</h1><span class="pl-count"></span></header>
    <section class="pl-field" aria-label="和${esc(v.cat.name)}玩逗猫棒">
      <svg class="pl-string" aria-hidden="true"><line class="stick"/><line class="str"/></svg><span class="holder" aria-hidden="true"></span>
      <span class="pl-feather" role="slider" tabindex="0" aria-label="羽毛，拖动它"><img src="img/item/feather.webp" alt=""></span>
      <div class="pl-cat"><img data-p="idle" src="${img.idle}" alt=""><img data-p="crouch" src="${img.crouch}" alt="" class=""><img data-p="pounce" src="${img.pounce}" alt=""></div>
      <div class="pl-floor"></div>
      <p class="pl-say" aria-live="polite"></p>
    </section>
    <div class="pbot"><button class="shake" id="shake">${ic3("M8 3h8v18H8zM11 18h2M4 9c-1 2-1 4 0 6M20 9c1 2 1 4 0 6")}<span>轻摇手机，陪它玩一会儿</span></button><button class="snd" id="snd" aria-label="声音">${ic3(I3.sound)}</button></div>
    <a class="putaway" href="#/home">⌃ 收起逗${isDog(v.cat.breed) ? "狗" : "猫"}棒</a>
  </div>`);
  app.append(box);
  const field = box.querySelector(".pl-field"), feather = box.querySelector(".pl-feather"), line = box.querySelector(".pl-string .str"), stick = box.querySelector(".pl-string .stick");
  const cat = box.querySelector(".pl-cat"), say = box.querySelector(".pl-say"), count = box.querySelector(".pl-count");
  const P = {}; cat.querySelectorAll("img").forEach(i => P[i.dataset.p] = i);
  const show = p => { for (const k in P) P[k].style.opacity = k === p ? 1 : 0; };
  const caught = () => Pet.state.once[key] || 0;
  const drawCount = () => count.textContent = `今日奖励 ${caught()}/${PLAY.maxPerDay}`;
  drawCount(); show("idle");
  box.querySelector("#snd").onclick = e => { const S = Pet.state; S.settings.mute = !S.settings.mute; Pet.save(); e.currentTarget.classList.toggle("off", S.settings.mute); };
  box.querySelector("#snd").classList.toggle("off", !!Pet.state.settings.mute);
  let W = field.clientWidth, H = field.clientHeight;
  // feather: spring towards the target the finger sets
  let fx = W * 0.5, fy = H * 0.36, vx = 0, vy = 0, tx = fx, ty = fy;
  const setTarget = (x, y) => { tx = Math.max(20, Math.min(W - 20, x)); ty = Math.max(30, Math.min(H - 60, y)); };
  const fromEvent = e => { const r = field.getBoundingClientRect(); setTarget(e.clientX - r.left, e.clientY - r.top); };
  field.addEventListener("pointerdown", e => { field.setPointerCapture(e.pointerId); fromEvent(e); });
  field.addEventListener("pointermove", e => { if (e.buttons || e.pointerType === "touch") fromEvent(e); });
  feather.addEventListener("keydown", e => { const d = 24; if (e.key === "ArrowLeft") setTarget(tx - d, ty); if (e.key === "ArrowRight") setTarget(tx + d, ty); if (e.key === "ArrowUp") setTarget(tx, ty - d); if (e.key === "ArrowDown") setTarget(tx, ty + d); });
  // shake → the feather dances
  let shakeT = 0;
  const onMotion = e => { const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return; const m = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0); if (m > 26) { shakeT = 0.9; Pet.state.settings.meow && Math.random() < .2 && meowFor("pet"); } };
  box.querySelector("#shake").onclick = async () => {
    try { if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) await DeviceMotionEvent.requestPermission(); } catch (_) {}
    window.addEventListener("devicemotion", onMotion); shakeT = 1;
    box.querySelector("#shake span").textContent = "它正跟着你扑抓";
  };
  // cat state machine
  let cx = W / 2, mode = "idle", mt = 0, from = null, to = null, face = 1, cooldown = 1.2;
  const reach = () => Math.hypot(fx - cx, fy - (H - 90)) < 230;
  let last = performance.now(), raf;
  function frame(now) {
    if (!document.body.contains(box)) { window.removeEventListener("devicemotion", onMotion); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    W = field.clientWidth; H = field.clientHeight;
    if (shakeT > 0) { shakeT -= dt; tx += (Math.random() - .5) * 60; ty += (Math.random() - .5) * 40; setTarget(tx, ty); }
    vx += (tx - fx) * 60 * dt; vy += (ty - fy) * 60 * dt + 40 * dt; vx *= 0.86; vy *= 0.86; fx += vx * dt * 10; fy += vy * dt * 10;
    feather.style.transform = `translate(${fx.toFixed(1)}px, ${fy.toFixed(1)}px) rotate(${(vx * 0.6).toFixed(1)}deg)`;
    const sx = W / 2 + (fx - W / 2) * 0.18, sy = 26; stick.setAttribute("x1", W / 2); stick.setAttribute("y1", 0); stick.setAttribute("x2", sx.toFixed(1)); stick.setAttribute("y2", sy);
    line.setAttribute("x1", sx.toFixed(1)); line.setAttribute("y1", sy); line.setAttribute("x2", fx.toFixed(1)); line.setAttribute("y2", (fy - 30).toFixed(1));
    mt += dt; cooldown -= dt;
    let x = cx, y = 0, rot = 0;
    if (mode === "idle") {
      face = fx < cx ? -1 : 1;
      if (Math.abs(fx - cx) > 60) cx += Math.sign(fx - cx) * Math.min(Math.abs(fx - cx) - 60, 70 * dt);   // pad closer
      x = cx;
      if (cooldown <= 0 && reach() && Math.hypot(vx, vy) > 2) { mode = "crouch"; mt = 0; }
    } else if (mode === "crouch") {
      rot = 1.5 * Math.sin(mt * 40);
      if (mt > 0.45) { mode = "pounce"; mt = 0; from = { x: cx }; to = { x: Math.max(60, Math.min(W - 60, fx)), y: Math.min(H - 120, Math.max(40, H - 60 - fy)) }; }
    } else if (mode === "pounce") {
      const u = Math.min(1, mt / 0.62), e2 = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      x = from.x + (to.x - from.x) * e2; y = to.y * Math.sin(Math.PI * u);
      if (u >= 1) { cx = to.x; x = cx; y = 0; mode = "land"; mt = 0; land(); }
    } else if (mode === "land" && mt > 0.5) { mode = "idle"; cooldown = 0.8 + Math.random() * 1.2; }
    show(mode === "crouch" ? "crouch" : mode === "pounce" || mode === "land" ? "pounce" : "idle");
    const flip = mode === "pounce" ? (to.x < from.x ? -1 : 1) : (orange ? face : 1);
    cat.style.transform = `translate(${(x - 70).toFixed(1)}px, ${(-y).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scaleX(${orange ? flip : 1})`;
    raf = requestAnimationFrame(frame);
  }
  function land() {
    const near = Math.hypot(fx - cx, (H - 60 - to.y) - fy) < 70;
    if (near && caught() < PLAY.maxPerDay && Math.random() < PLAY.catchChance) {
      Pet.state.once[key] = caught() + 1; Pet.save(); drawCount();
      Pet.bonus({ g: 6, f: 1, w: 0, text: "抓到逗猫棒了", snackChance: 0.15 });
      say.textContent = `${v.cat.name}抓到羽毛啦！`; if (Pet.state.settings.meow) meowFor("correct");
      setTarget(W * 0.7, 40); vy -= 30;
    } else {
      say.textContent = ["差一点！", "再来一次～", "喵！跑掉了", ""][Math.floor(Math.random() * 4)];
      if (near) { vx += (Math.random() < .5 ? -1 : 1) * 40; vy -= 30; }   // the feather escapes
    }
    setTimeout(() => { if (say.textContent && !/抓到/.test(say.textContent)) say.textContent = ""; }, 1400);
  }
  raf = requestAnimationFrame(frame);
}

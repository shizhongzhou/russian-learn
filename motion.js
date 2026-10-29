"use strict";
/* Shared motion controller for all 33 breeds and all growth stages. Video-backed
   poses are used only when the matching stage is available. Other breeds retain
   their own stage artwork, with low-amplitude secondary motion. */
const Roam = (() => {
  let el, img, bubble, body, ball, on = false, x = 24, y = 0, facing = 1;
  let surface = null, nextSurface = null, poseTimer = 0;
  let frame = 0, behaviorTimer = 0, bubbleTimer = 0, plan = null, drag = null, pageCtl = null, custom = null, generation = 0, poseName = "sit";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const profile = () => {
    const v = Pet.view(), stage = artStage(v.shownStage), dog = isDog(v.cat.breed);
    const calm = ["british", "persian", "ragdoll", "bernese", "frenchie"].includes(v.cat.breed);
    return { stage, dog, height: Math.round((dog ? 96 : 92) * petK(v.shownStage)), walk: (stage === 1 ? 51 : stage === 2 ? 61 : 48) * (dog ? 1.12 : 1) * (calm ? .8 : 1), run: stage === 1 ? 116 : stage === 2 ? 138 : 104, rest: stage === 1 ? 2200 : stage === 2 ? 2900 : 4100 };
  };
  function bounds() {
    const tab = document.getElementById("tabbar"), viewport = window.visualViewport;
    const width = viewport ? viewport.width : innerWidth, height = viewport ? viewport.height : innerHeight;
    const floor = Math.min(height - 8, tab && !tab.hidden ? tab.getBoundingClientRect().top : height - 8);
    const page=app.getBoundingClientRect(), left=Math.max(10,page.left+8), right=Math.min(width-10,page.right-8)-(el?el.offsetWidth:100);
    return { left, right:Math.max(left,right), top:110, floor };
  }
  function platforms() {
    const b = bounds(), w = el.offsetWidth;
    return [...app.querySelectorAll(".hhero,.cont2,.stats2,.plan2,.card.resource-entry")].filter(node => {
      const r=node.getBoundingClientRect(), yy=node.matches(".hhero")?r.bottom-5:r.top+1;return yy>110+profile().height && yy<b.floor-45 && r.width>w+30;
    });
  }
  function surfacePoint(node) {
    const b = bounds(); if (!node || !document.body.contains(node)) return { x:clamp(x,b.left,b.right), y:b.floor };
    const r=node.getBoundingClientRect();
    return { x:clamp(x, Math.max(b.left,r.left+12), Math.min(b.right,r.right-el.offsetWidth-12)), y:node.matches(".hhero") ? r.bottom-5 : r.top+1 };
  }
  function ensure() {
    if (el) return;
    el = h(`<button type="button" class="roam2 natural-pet" aria-label="摸摸你的宠物"><span class="rb" hidden></span><span class="rp"><img alt="" draggable="false"></span><span class="pet-ground" aria-hidden="true"></span></button>`);
    document.body.append(el); body = el.querySelector(".rp"); img = el.querySelector("img"); img.onerror=()=>{const v=Pet.view(),fallback=petFallbackSrc(v.cat.breed,v.shownStage);if(img.getAttribute("src")!==fallback)img.src=fallback;}; bubble = el.querySelector(".rb");
    ball = h(`<span class="roam-ball" aria-hidden="true" hidden></span>`); document.body.append(ball);
    el.onpointerdown = e => {
      if (e.button && e.button !== 0) return;
      clearTimeout(behaviorTimer); stopMove();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: x, oy: y, moved: false };
      el.setPointerCapture(e.pointerId);
    };
    el.onpointermove = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 7) return;
      if (!drag.moved) { drag.moved = true; setPose("look"); el.classList.add("held"); }
      const b = bounds(); x = clamp(drag.ox + dx, b.left, b.right); y = clamp(drag.oy + dy, 110, b.floor); place();
    };
    el.onpointerup = e => release(e, false);
    el.onpointercancel = e => release(e, true);
    addEventListener("resize", fit);
    addEventListener("scroll", fit, { passive:true });
    if (window.visualViewport) { visualViewport.addEventListener("resize", fit); visualViewport.addEventListener("scroll", fit); }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { clearTimeout(behaviorTimer); stopMove(); ball.hidden = true; }
      else if (on) { fit(); rest(); }
    });
    reduced.addEventListener("change", () => { if (on) { stopMove(); rest(); } });
  }
  function fit() {
    if (!el || !on || drag) return;
    stopMove(); const b=bounds(); let point=surfacePoint(surface);
    if(point.y<110+profile().height || point.y>b.floor) {surface=null;point=surfacePoint(null);}
    x=point.x;y=point.y;place();schedule();
  }
  function release(e, cancelled) {
    if (!drag || drag.id !== e.pointerId) return;
    const moved = drag.moved; drag = null; el.classList.remove("held");
    if (cancelled) { fit(); return rest(); }
    if (moved) {
      surface = null; const b = bounds(); move(x, b.floor, "land");
    } else { meowSafe("pet"); Pet.pet(); logEvent("pet", `摸了摸${petName()}`); say(profile().dog ? "汪！再摸摸～" : "呼噜呼噜～"); hop(12); }
  }
  function place() {
    if (!el) return;
    el.style.transform = `translate3d(${x.toFixed(2)}px,${(y - el.offsetHeight).toFixed(2)}px,0)`;
    const p = profile(); el.style.setProperty("--h", p.height + "px");
    // Depth is subtle and grounded; pets stay within the lower part of the page.
    const b = bounds(), depth = 1;
    el.style.setProperty("--depth", depth.toFixed(3));
  }
  function setPose(p) {
    if (!img) return;
    const v = Pet.view(), key = v.cat.breed, src = reduced.matches ? null : animSrc(key, p, v.shownStage);
    const wanted = src || petSrc(key, v.shownStage), token = ++generation;
    poseName = p;
    el.dataset.pose = p; el.classList.toggle("video-motion", !!src); el.classList.toggle("still-motion", !src);
    el.style.setProperty("--stride", (profile().stage === 1 ? .38 : profile().dog ? .52 : .64) + "s");
    const clip=src ? src.split("/").pop().replace(".webp", "") : "";
    el.style.setProperty("--sprite-height", (ORANGE_FRAME_HEIGHT[clip] || 100) + "%");
    const meta = src ? ANIM_OK[clip] : null;
    const direction = meta && meta.dir || 1;
    body.style.setProperty("--face", facing * direction);
    if (img.getAttribute("src") === wanted) { place(); return; }
    const next = new Image(); next.src = wanted;
    next.decode().then(() => {
      if (token !== generation) return;
      img.src = wanted; el.classList.remove("pose-blend"); void el.offsetWidth; el.classList.add("pose-blend"); place();
    }).catch(() => { if (token === generation) img.src = petSrc(key, v.shownStage); });
  }
  function stopMove() { if (frame) cancelAnimationFrame(frame); frame = 0; plan = null; if (el) el.classList.remove("moving"); }
  function schedule(delay) { clearTimeout(behaviorTimer); if (on && !document.hidden) behaviorTimer = setTimeout(choose, delay == null ? profile().rest + Math.random() * 3600 : delay); }
  function say(text, duration = 2400) { if (!on || !bubble || !text) return; bubble.textContent = text; bubble.hidden = false; clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => bubble.hidden = true, duration); }
  function rest() {
    if (!on) return;
    el.classList.remove("moving");
    const v = Pet.view(); const r=Math.random(); setPose(v.sick || v.full < 20 ? "sleep" : r < .25 ? "sleep" : r < .45 ? "lie" : r < .7 ? "look" : "sit");
    ball.hidden = true; schedule();
  }
  // Integral of an eased trapezoid velocity profile: acceleration, cruise, braking.
  function travel(t) {
    const r = .2, area = 1 - r;
    if (t < r) return (t / 2 - r / (2 * Math.PI) * Math.sin(Math.PI * t / r)) / area;
    if (t > 1 - r) return 1 - travel(1 - t);
    return (t - r / 2) / area;
  }
  function move(tx, ty, kind = "walk") {
    if (!on || document.hidden) return;
    clearTimeout(behaviorTimer); clearTimeout(poseTimer); stopMove();
    const b = bounds(), p = profile(); tx = clamp(tx, b.left, b.right); ty = clamp(ty, b.top, b.floor);
    const distance = Math.hypot(tx - x, ty - y);
    if (reduced.matches) return rest();
    if (distance < 8 && kind !== "hop" && kind !== "land") return rest();
    const nextFacing = Math.abs(tx - x) > 8 ? Math.sign(tx - x) : facing;
    const turning = nextFacing !== facing; facing = nextFacing;
    let speed = kind === "run" ? p.run : p.walk;
    // No adult run footage exists: keep its walking clip at a matching walking speed.
    if (Pet.view().cat.breed === "orange" && p.stage > 1) speed = Math.min(speed, 64);
    const dur = kind === "hop" ? 520 : kind === "land" ? 360 : kind === "jump" ? clamp(Math.sqrt(2*Math.abs(ty-y)/950)*1000+Math.abs(tx-x)*1.2,650,1400) : Math.max(900, distance / speed * 1000);
    const bend = 0;
    plan = { fx:x, fy:y, tx, ty, bend, elapsed: turning ? -170 : 0, previous:0, duration:dur, kind, jumping: kind === "hop" || kind === "jump", arc:kind === "jump" ? Math.min(42,Math.abs(ty-y)*.18+18) : 15 };
    setPose(kind === "run" || kind === "hop" || kind === "jump" ? "run" : kind === "land" ? "look" : "walk");
    el.classList.add("moving"); frame = requestAnimationFrame(step);
  }
  function step(now) {
    frame = 0;
    if (!on || !plan || drag || document.hidden) return;
    const m = plan;
    if (!m.previous) m.previous = now;
    m.elapsed += Math.min(40, now - m.previous); m.previous = now;
    const t = clamp(m.elapsed / m.duration, 0, 1), u = travel(t);
    x = m.fx + (m.tx - m.fx) * u;
    y = m.fy + (m.ty - m.fy) * u + Math.sin(Math.PI * u) * m.bend;
    if (m.jumping) y -= Math.sin(Math.PI * t) * m.arc;
    place();
    if (t < 1) frame = requestAnimationFrame(step);
    else { x=m.tx; y=m.ty; surface=nextSurface; nextSurface=null; stopMove(); place(); rest(); }
  }
  function hop(height = 16) { if (!on) return; if (reduced.matches) return setPose("look"); move(x, y, "hop"); if (plan) plan.arc = Math.min(26, height); }
  function choose() {
    if (!on || document.hidden || drag || plan) return;
    const v = Pet.view(), p = profile();
    if (v.sick || reduced.matches) return rest();
    const b = bounds(), r = Math.random();
    if (r < .42) return rest();
    const candidates=platforms();
    nextSurface = r > .72 && candidates.length ? pickOne(candidates) : (surface && r < .7 ? surface : null);
    const target=surfacePoint(nextSurface);
    let tx=b.left+Math.random()*(b.right-b.left), ty=target.y;
    if(nextSurface){const rr=nextSurface.getBoundingClientRect();tx=clamp(tx,Math.max(b.left,rr.left+12),Math.min(b.right,rr.right-el.offsetWidth-12));}
    if (r > .88) {
      ball.hidden = false; ball.style.left = (tx + el.offsetWidth * .5) + "px"; ball.style.top = (ty - 10) + "px";
      say(p.dog ? "接住小球！" : "发现一个小球～", 1700);
    }
    move(tx, ty, Math.abs(ty-y)>6 ? "jump" : r > .78 && p.stage < 3 ? "run" : "walk");
  }
  return {
    set(want) {
      ensure(); const v = Pet.view(), active = !!(want && v.profile && Pet.state.settings.roam !== false);
      on = active; el.hidden = !on; ball.hidden = true; custom = null;
      if (!on) { clearTimeout(poseTimer); clearTimeout(behaviorTimer); clearTimeout(bubbleTimer); bubble.hidden = true; generation++; stopMove(); return; }
      stopMove(); const b = bounds(); x = clamp(x, b.left, b.right); surface=null;nextSurface=null;y=b.floor;
      place(); rest();
    },
    playAt(node) {
      if(!on)return;
      const b=bounds();nextSurface=node;
      const r=node.getBoundingClientRect();
      if(surfacePoint(node).y<110+profile().height || surfacePoint(node).y>b.floor) {nextSurface=null;node=null;}
      const target=surfacePoint(node); move(node ? clamp(r.right-el.offsetWidth-25,b.left,b.right) : x,target.y,"jump");
      poseTimer=setTimeout(()=>{if(!on||!document.body.contains(node))return;setPose("ball");say("陪我玩一会儿～");schedule(5500);},plan?plan.duration+200:200);
    },
    action(p,duration=3000) {if(!on)return;clearTimeout(behaviorTimer);stopMove();setPose(p);clearTimeout(poseTimer);poseTimer=setTimeout(rest,duration);},
    say, hop, lines(value) { custom = value; },
    cheer(text) { if (on) { hop(20); if (text) say(text); } },
    stopPage() { if (pageCtl) { pageCtl(); pageCtl = null; } },
    onLeave(fn) { pageCtl = fn; },
    // Used by the in-app motion preview and automated motion checks.
    preview(kind) { const b=bounds(); move(x < (b.left+b.right)/2 ? b.right : b.left, b.floor, kind); },
    snapshot() { return { on, x, y, pose:poseName, moving:!!plan, stage:profile().stage, breed:Pet.view().cat.breed }; }
  };
})();

"use strict";
/* ========== 猫猫俄语通 — pet state, rewards, roaming cat ========== */

const Pet = (() => {
  const KEY = "mm_pet_v1";
  const DAY = 86400000;
  const STAGES = [0, 0, 500, 1500, 3000];            // index = stage
  const STAGE_NAMES = ["", "小奶猫", "铃铛小猫", "蝴蝶结萌猫", "花环小团子"];
  const STAGE_GIFTS = {                                // free unlocks when a stage is reached
    2: { label: "铃铛项圈、逗猫棒、猫抓柱", owned: ["toy", "tree1"] },
    3: { label: "蝴蝶结、软软猫窝、二层猫爬架", owned: ["bed", "tree2"] },
    4: { label: "花环、豪华猫爬架、循环饮水机、莫斯科阁楼", owned: ["tree3", "fountain", "scene_moscow"] },
  };
  const REWARDS = {
    correct: { g: 10, f: 1, w: 0, text: "答对了" },
    listen:  { g: 20, f: 0, w: 2, text: "听完一段" },
    news:    { g: 20, f: 0, w: 2, text: "听完新闻" },
    topic:   { g: 40, f: 3, w: 1, text: "学完语法专题" },
    words:   { g: 5,  f: 1, w: 0, text: "听了 10 个新单词" },
    goal:    { g: 50, f: 5, w: 3, text: "完成每日目标" },
    streak7: { g: 100, f: 10, w: 10, text: "连续学习 7 天" },
    master:  { g: 5,  f: 1, w: 0, text: "背下来一个单词" },
    speak:   { g: 5,  f: 1, w: 0, text: "跟读一句" },
    read:    { g: 15, f: 1, w: 1, text: "读完一篇文章" },
    write:   { g: 30, f: 3, w: 1, snack: "s1", text: "完成一篇写作" },
    exam:    { g: 100, f: 10, w: 5, snack: "s4", text: "通过等级考试" },
  };

  const today = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const fresh = () => ({
    v: 1, profile: null, cat: { breed: "ragdoll", name: "团子" },
    growth: 0, food: 10, water: 10, full: 80, drink: 80, health: 100, happy: 80,
    lastStudy: Date.now(), lastTick: Date.now(), streak: 0, streakDay: "", studyDays: 0,
    owned: { scene_living: 1 }, scene: "living", tree: 0, decor: { bed: 0, toy: 0, scratch: 0, fish: 0, fountain: 0 },
    sick: false, treated: false, recoverDays: [],
    heard: {}, heardCount: {}, topics: {}, daily: { date: "", correct: 0, done: false },
    totalCorrect: 0, totalAnswered: 0, inv: {}, mastered: {}, masteredCount: {}, todayWords: { date: "", keys: [] },
    once: {}, exams: {}, writings: [], goal: 20, lastLevel: "A1", lastPlace: null,
    settings: { meow: true, roam: true, desk: { float: true, widget: true, quiet: true, idle: false } },
  });

  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || "null") || {}); } catch { S = fresh(); }
  const listeners = new Set();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} listeners.forEach(fn => { try { fn(S); } catch {} }); }
  const clamp = v => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

  /* time passes: hunger, thirst, health */
  function tick() {
    const now = Date.now();
    const days = Math.max(0, (now - S.lastTick) / DAY);
    if (days > 0.001) {
      const idle = (now - S.lastStudy) / DAY;
      S.full = clamp(S.full - 30 * days);
      S.drink = clamp(S.drink - 40 * days);
      S.happy = clamp(S.happy - 12 * days);
      let hp = 0;
      if (idle >= 3) hp += 10 * days;
      if (S.full <= 0) hp += 5 * days;
      if (S.drink <= 0) hp += 5 * days;
      if (S.drink > 50 && S.full > 50 && idle < 3) hp -= 5 * days;   // slow natural recovery
      S.health = clamp(S.health - hp);
      if ((idle >= 7 || S.health < 25) && !S.sick) { S.sick = true; S.treated = false; S.recoverDays = []; }
      S.lastTick = now;
    }
    if (S.daily.date !== today()) S.daily = { date: today(), correct: 0, done: false };
    if (S.todayWords.date !== today()) S.todayWords = { date: today(), keys: [] };
  }

  const stageOf = g => g >= STAGES[4] ? 4 : g >= STAGES[3] ? 3 : g >= STAGES[2] ? 2 : 1;
  const idleDays = () => (Date.now() - S.lastStudy) / DAY;
  const thin = () => S.sick || idleDays() >= 3 || S.full < 15;
  function view() {
    tick();
    const stage = stageOf(S.growth);
    const shown = Math.max(1, stage - (thin() ? 1 : 0));
    const mood = S.sick ? "sick" : (S.full < 30 || S.drink < 30) ? "hungry" : "happy";
    const next = STAGES[stage + 1];
    const status = S.sick ? (S.treated ? `正在康复：已坚持 ${S.recoverDays.length} / 3 天` : "生病了，需要去宠物医院")
      : S.full < 30 ? "饿了，碗空了" : S.drink < 30 ? "渴了，想喝水" : thin() ? "瘦了一圈，多陪陪它" : S.happy < 40 ? "有点无聊，摸摸它吧" : "健康快乐";
    return {
      ...S, stage, shownStage: shown, stageName: STAGE_NAMES[stage], mood, status,
      level: 1 + Math.floor(S.growth / 200), nextAt: next || null, nextName: STAGE_NAMES[stage + 1] || "",
      nextGift: STAGE_GIFTS[stage + 1]?.label || "", prevAt: STAGES[stage], idle: idleDays(), thin: thin(),
    };
  }

  /* toast */
  let toastBox;
  function toast(html, kind = "") {
    if (!toastBox) { toastBox = document.createElement("div"); toastBox.className = "toasts"; toastBox.setAttribute("aria-live", "polite"); document.body.append(toastBox); }
    const t = document.createElement("div");
    t.className = "toast " + kind; t.innerHTML = html;
    toastBox.append(t);
    setTimeout(() => t.classList.add("out"), 2600);
    setTimeout(() => t.remove(), 3100);
  }

  function studied() {
    const d = today();
    if (S.streakDay !== d) {
      const y = today(Date.now() - DAY);
      S.streak = S.streakDay === y ? S.streak + 1 : 1;
      S.streakDay = d; S.studyDays++;
      if (S.streak > 0 && S.streak % 7 === 0) setTimeout(() => reward("streak7"), 1200);
    }
    S.lastStudy = Date.now();
  }

  function grantStage(from, to) {
    for (let st = from + 1; st <= to; st++) {
      const gift = STAGE_GIFTS[st];
      if (!gift) continue;
      gift.owned.forEach(k => {
        S.owned[k] = 1;
        if (k === "toy" || k === "bed" || k === "fountain") S.decor[k] = 1;
        if (k.startsWith("tree")) S.tree = Math.max(S.tree, +k.slice(4));
      });
      setTimeout(() => {
        toast(`<b>${S.cat.name} 长成了“${STAGE_NAMES[st]}”！</b><br>解锁：${gift.label}`, "big");
        cheer("我长大啦！谢谢你陪我学习");
      }, 600);
    }
  }

  function reward(kind) {
    const r = REWARDS[kind];
    if (!r || !S.profile) return;
    tick();
    const before = stageOf(S.growth);
    S.growth += r.g; S.food += r.f; S.water += r.w;
    S.happy = clamp(S.happy + 2);
    studied();
    if (kind === "correct") {
      S.totalCorrect++; S.daily.correct++;
      if (S.settings.meow) meowSound();
      if (S.sick && S.treated && S.daily.correct >= 10 && !S.recoverDays.includes(today())) {
        S.recoverDays.push(today());
        if (S.recoverDays.length >= 3) { S.sick = false; S.treated = false; S.health = Math.max(S.health, 85); setTimeout(() => toast(`<b>${S.cat.name} 完全康复了！</b>`, "big"), 900); }
      }
      if (!S.daily.done && S.daily.correct >= S.goal) { S.daily.done = true; setTimeout(() => reward("goal"), 900); }
    }
    const after = stageOf(S.growth);
    save();
    if (r.snack) S.inv[r.snack] = (S.inv[r.snack] || 0) + 1;
    save();
    const bits = [`+${r.g} 成长值`]; if (r.f) bits.push(`+${r.f} 猫粮`); if (r.w) bits.push(`+${r.w} 水`); if (r.snack) bits.push(`+1 ${SNACK_NAMES[r.snack]}`);
    toast(`${r.text} · ${bits.join(" · ")}`, kind === "correct" ? "good" : "");
    cheer(kind === "correct" ? pick(["Мяу～！答对啦", "Молоде́ц! 真棒", "喵！再来一题", "答对了，奖励我一颗猫粮"]) : pick(["喵～学完啦", "Отли́чно! 太好了", "又进步了一点"]));
    if (after > before) grantStage(before, after);
  }
  function answered() { S.totalAnswered++; save(); }
  function wrong() { answered(); talk(pick(["没关系，再想想～", "差一点点！", "我陪你再试一次"])); }

  function learnedToday(k) { tick(); if (!S.todayWords.keys.includes(k)) S.todayWords.keys.push(k); }
  function master(lv, i) {
    const k = lv + ":" + i;
    learnedToday(k);
    if (S.mastered[k]) { save(); return false; }
    S.mastered[k] = 1; S.masteredCount[lv] = (S.masteredCount[lv] || 0) + 1;
    reward("master"); return true;
  }
  /* reward a key only once (per day if daily) */
  function once(key, kind, daily = false) {
    const k = daily ? today() + "|" + key : key;
    if (S.once[k]) return false;
    S.once[k] = 1; reward(kind); return true;
  }
  function heardWord(lv, i) {
    const k = lv + ":" + i;
    learnedToday(k);
    if (S.heard[k]) return;
    S.heard[k] = 1;
    S.heardCount[lv] = (S.heardCount[lv] || 0) + 1;
    S.lastLevel = lv;
    const n = Object.keys(S.heard).length;
    save();
    if (n % 10 === 0) reward("words");
  }
  function topicDone(lv, id) {
    const k = lv + ":" + id;
    if (S.topics[k]) return;
    S.topics[k] = 1; save(); reward("topic");
  }

  /* spending */
  function spend(food, water) {
    if (S.food < food || S.water < water) return false;
    S.food -= food; S.water -= water; return true;
  }
  function feed() {
    if (!spend(1, 0)) return toast("猫粮不够了，去答几道题吧", "warn"), false;
    S.full = clamp(S.full + 8); S.happy = clamp(S.happy + 1); save(); return true;
  }
  function giveWater() {
    if (!spend(0, 1)) return toast("没有水了，听一段听力能得到水", "warn"), false;
    S.drink = clamp(S.drink + 10); save(); return true;
  }
  function pet() { S.happy = clamp(S.happy + 3); save(); }
  function buy(item) {
    if (S.owned[item.id] && item.kind !== "snack" && item.kind !== "med") return false;
    if (!spend(item.food || 0, item.water || 0)) { toast("猫粮或水不够，先去学习赚一些吧", "warn"); return false; }
    if (item.apply) item.apply(S); else S.owned[item.id] = 1;
    save(); return true;
  }

  /* ---------- the roaming cat ---------- */
  let roam, roamTimer, bubbleTimer, roamEnabled = true, here = { x: 20, y: 60 };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const SNACK_NAMES = { s1: "小鱼干", s2: "猫条", s3: "冻干", s4: "豪华罐头" };
  function ensureRoam() {
    if (roam) return roam;
    roam = document.createElement("button");
    roam.className = "roam";
    roam.type = "button";
    roam.innerHTML = `<span class="roam-bubble" hidden></span><span class="roam-cat"></span>`;
    roam.onclick = () => { if (S.settings.meow) meowSound(); pet(); talk(pick(["喵～", "呼噜呼噜", "再摸摸我", "Мур-мур"])); setMood("cheer", 1200); };
    document.body.append(roam);
    return roam;
  }
  let moodOverride = null, moodTimer;
  function drawRoam(mood) {
    if (!roam) return;
    const v = view();
    const m = moodOverride || mood || v.mood;
    roam.querySelector(".roam-cat").innerHTML = catSVG({ breed: S.cat.breed, stage: v.shownStage, mood: m, size: 64 });
    roam.setAttribute("aria-label", `${S.cat.name}：${MOOD_NAMES[m] || ""}，点一下摸摸它`);
  }
  function setMood(m, ms) { moodOverride = m; drawRoam(); clearTimeout(moodTimer); moodTimer = setTimeout(() => { moodOverride = null; drawRoam(); }, ms); }
  function talk(text, ms = 2600) {
    if (!roam || roam.hidden) return;
    const b = roam.querySelector(".roam-bubble");
    b.textContent = text; b.hidden = false;
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => { b.hidden = true; }, ms);
  }
  function cheer(text) { if (!roam || roam.hidden) return; setMood("cheer", 1600); roam.classList.remove("hop"); void roam.offsetWidth; roam.classList.add("hop"); if (text) talk(text); }
  function wander() {
    if (!roam || roam.hidden) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const v = view();
    if (v.sick) { drawRoam("sick"); return; }
    const r = Math.random();
    if (r < 0.25) { drawRoam(pick(["sleep", "happy", v.mood])); return; }
    if (r < 0.35 && !reduce) { drawRoam(v.full < 60 ? "eat" : "happy"); talk(pick(["吃饭饭～", "我开动啦"])); return; }
    if (reduce) return;
    const W = Math.min(innerWidth, document.documentElement.clientWidth || innerWidth);
    const nx = 8 + Math.random() * Math.max(10, W - 84);
    roam.style.setProperty("--flip", nx < here.x ? -1 : 1);
    here = { x: nx, y: 0 };
    roam.classList.toggle("rside", nx > W / 2);
    roam.style.transform = `translateX(${nx}px)`;
    drawRoam("walk");
    if (Math.random() < 0.3) talk(pick(roamLines()));
  }
  let lines = null;
  const roamLines = () => lines || ["我在这儿陪你～", "Приве́т!", "学累了就摸摸我", "今天也一起学俄语吧"];
  function setRoam(on, newLines) {
    roamEnabled = on && S.settings.roam;
    lines = newLines || null;
    ensureRoam();
    roam.hidden = !roamEnabled || !S.profile;
    if (!roam.hidden) { drawRoam(); if (!roamTimer) { roamTimer = setInterval(wander, 4500); setTimeout(wander, 300); } }
  }

  tick(); save();
  setInterval(() => { tick(); save(); }, 60000);

  return {
    get state() { return S; }, view, save, tick, reward, wrong, answered, heardWord, topicDone, master, once, SNACK_NAMES, feed, giveWater, pet, buy, spend,
    toast, cheer, talk, setRoam, drawRoam, onChange: fn => listeners.add(fn), STAGE_NAMES, STAGES, STAGE_GIFTS, REWARDS,
    reset() { S = fresh(); save(); }, today,
  };
})();

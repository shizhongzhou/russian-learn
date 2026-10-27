"use strict";
/* ========== 猫猫俄语通 · cloud (Tencent CloudBase) ==========
   - everyone gets a guest session automatically; logging in with phone / email / Apple keeps the progress
   - the whole save (Pet.state) is mirrored to the cloud a few seconds after it changes
   - on start / login the newer copy wins; when two different saves meet, the player chooses
   Works without configuration too: if CLOUD_CONFIG.env is empty every call is a no-op. */
const Cloud = (() => {
  const CFG = window.CLOUD_CONFIG || {};
  const SDK = "vendor/cloudbase.full.js";                 // vendored copy (see .github/workflows/vendor-sdk.yml)
  const SDK_CDN = "https://static.cloudbase.net/cloudbase-js-sdk/latest/cloudbase.full.js";
  const META_KEY = "mm_cloud_v1";
  const meta = Object.assign({ uid: "", syncedAt: 0, localAt: 0 }, store.get(META_KEY, {}));
  const saveMeta = () => store.set(META_KEY, meta);
  let app = null, auth = null, user = null, readyP = null, pushT = null, busy = false, lastErr = "";
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(); } catch (_) {} });
  const enabled = () => !!CFG.env;
  /* turn browser network errors ("Load failed", "Failed to fetch"…) into something a player understands */
  const BLOCKED_HOST = /github\.io$/.test(location.hostname);     // not on CloudBase's allowed-origin list
  function nice(e) {
    const m = String(e && e.message || e || "");
    if (/load failed|failed to fetch|network|unexpected end of json|NetworkError|403/i.test(m))
      return new Error(BLOCKED_HOST ? "网页版暂时不能登录，请在 App 里登录（或先点「游客开始」）" : "网络连接失败，请检查网络后再试");
    return e instanceof Error ? e : new Error(m);
  }

  function loadSDK() {
    if (window.cloudbase) return Promise.resolve();
    const load = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error("SDK " + src)); document.head.append(s); });
    return load(SDK).catch(() => load(SDK_CDN));
  }
  function ready() {
    if (!enabled()) return Promise.resolve(false);
    if (!readyP) readyP = (async () => {
      await loadSDK();
      app = cloudbase.init({ env: CFG.env, region: CFG.region || "ap-shanghai", accessKey: CFG.accessKey || "", timeout: 15000 });
      auth = typeof app.auth === "function" ? app.auth() : app.auth;
      const s = await auth.getSession().catch(() => null);
      if (!s || !s.data || !s.data.session) await auth.signInAnonymously();
      await refreshUser();
      return true;
    })().catch(e => { readyP = null; lastErr = BLOCKED_HOST ? "网页版暂时连不上云端，请用 App" : "连不上云端"; console.warn("cloud", e); emit(); return false; });
    return readyP;
  }
  async function refreshUser() {
    const r = await auth.getUser().catch(() => null);
    user = r && r.data && r.data.user || null; emit(); return user;
  }
  async function call(action, data = {}) {
    if (!(await ready())) throw nice(lastErr || "云服务未开启");
    let r; try { r = await app.callFunction({ name: "api", data: { action, data } }); } catch (e) { throw nice(e); }
    const res = r && r.result || {};
    if (!res.ok) { const e = new Error(res.msg || "请求失败"); e.code = res.code; throw e; }
    return res.data;
  }

  /* ---------- save sync ---------- */
  function isoWeek(t = Date.now()) {
    const d = new Date(t + 8 * 3600e3); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
    const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    return d.getUTCFullYear() + "-W" + String(1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7)).padStart(2, "0");
  }
  function summary() {
    const S = Pet.state, v = Pet.view(), wk = isoWeek();
    if (!S.wk || S.wk.key !== wk) S.wk = { key: wk, base: S.totalCorrect || 0 };
    return { nick: S.profile && S.profile.nick, catName: S.cat.name, breed: S.cat.breed, stage: v.stage, level: v.level, growth: S.growth,
      streak: S.streak, studyDays: S.studyDays, totalCorrect: S.totalCorrect, weekCorrect: (S.totalCorrect || 0) - S.wk.base,
      words: Object.values(S.heardCount || {}).reduce((a, b) => a + b, 0) };
  }
  function schedulePush() {
    if (!enabled() || !Pet.state.profile) return;
    meta.localAt = Date.now(); saveMeta();
    clearTimeout(pushT); pushT = setTimeout(push, 4000);
  }
  async function push(force = false) {
    if (!Pet.state.profile || busy) return;
    busy = true;
    try {
      const sum = summary();
      const r = await call("save", { state: Pet.state, summary: sum, updatedAt: meta.localAt || Date.now(), force });
      if (r.conflict) { await adopt(r.state, r.updatedAt, "另一台设备上的进度更新"); return; }
      meta.syncedAt = r.updatedAt; meta.uid = user && user.id || meta.uid; Pet.state.friendCode = r.friendCode || Pet.state.friendCode; saveMeta(); lastErr = "";
    } catch (e) { lastErr = e.message; } finally { busy = false; emit(); }
  }
  function adopt(state, updatedAt, why) {
    if (!state || !state.profile) return;
    localStorage.setItem("mm_pet_v1", JSON.stringify(state));
    meta.syncedAt = meta.localAt = updatedAt; meta.uid = user && user.id || meta.uid; saveMeta();
    Pet.toast(`已载入${why}`, "good");
    setTimeout(() => location.reload(), 600);
  }
  /* reconcile with the cloud on start and after login */
  async function pull({ afterLogin = false } = {}) {
    let r;
    try { r = await call("load"); } catch (e) { lastErr = e.message; emit(); return; }
    const uid = user && user.id;
    const local = Pet.state.profile ? Pet.state : null;
    if (!r.exists) { if (local) { meta.uid = uid; meta.localAt = meta.localAt || Date.now(); saveMeta(); await push(true); } return; }
    if (!local) return adopt(r.state, r.updatedAt, "云端存档");
    const sameAccount = meta.uid === uid;
    if (sameAccount) {
      const localChanged = meta.localAt > meta.syncedAt;
      if (r.updatedAt > meta.syncedAt && !localChanged) return adopt(r.state, r.updatedAt, "云端最新进度");
      if (localChanged || r.updatedAt < meta.localAt) return push();
      return;
    }
    if (afterLogin) return chooseSave(r);          // a different save already lives in this account
    meta.uid = uid; saveMeta();
  }
  function chooseSave(r) {
    const c = r.state || {}, l = Pet.state, cg = c.growth || 0, lg = l.growth || 0;
    const box = h(`<div class="cloud-pick" role="dialog" aria-modal="true" aria-label="选择存档"><div class="cp-card">
      <h2>这个账号里已经有一只猫</h2><p class="hint">选择要保留的进度，另一份会被覆盖。</p>
      <button class="cp-opt" data-k="cloud">${catSVG({ breed: (c.cat || {}).breed || "orange", stage: 2, mood: "happy", size: 56 })}<span><b>云端：${esc((c.cat || {}).name || "猫咪")}</b><small>成长值 ${fmt(cg)} · 学习 ${c.studyDays || 0} 天</small></span></button>
      <button class="cp-opt" data-k="local">${catSVG({ breed: l.cat.breed, stage: 2, mood: "happy", size: 56 })}<span><b>本机：${esc(l.cat.name)}</b><small>成长值 ${fmt(lg)} · 学习 ${l.studyDays || 0} 天</small></span></button>
    </div></div>`);
    document.body.append(box);
    box.querySelectorAll("[data-k]").forEach(b => b.onclick = async () => {
      box.remove();
      if (b.dataset.k === "cloud") adopt(r.state, r.updatedAt, "云端存档");
      else { meta.uid = user.id; meta.localAt = Date.now(); saveMeta(); await push(true); Pet.toast("本机进度已上传到这个账号", "good"); }
    });
  }
  async function claimGifts() {
    try {
      const r = await call("claimGifts");
      if (!r.gifts.length) return;
      const S = Pet.state; S.inv = S.inv || {};
      r.gifts.forEach(g => S.inv[g.kind] = (S.inv[g.kind] || 0) + 1);
      Pet.save();
      const names = [...new Set(r.gifts.map(g => g.fromNick))].slice(0, 3).join("、");
      Pet.toast(`<b>${esc(names)}</b> 送给${esc(S.cat.name)} ${r.gifts.length} 份零食！<br>去猫咪页喂它吧`, "big");
    } catch (_) {}
  }

  /* ---------- login ---------- */
  async function sendCode(kind, target) {
    try { return await sendCode0(kind, target); } catch (e) { throw nice(e); }
  }
  async function sendCode0(kind, target) {
    if (!(await ready())) throw nice(lastErr);
    const arg = kind === "phone" ? { phone: target } : { email: target };
    let r = await auth.signInWithOtp(arg);
    if (r.error && kind === "phone" && !/^\+/.test(target)) r = await auth.signInWithOtp({ phone: "+86 " + target });   // some SDK versions want the country code
    if (r.error) throw new Error(r.error.message || "验证码发送失败");
    return r.data;          // has .verifyOtp({ token })
  }
  async function verifyCode(pending, code) {
    let r; try { r = await pending.verifyOtp({ token: code }); } catch (e) { throw nice(e); }
    if (r.error) throw new Error(r.error.message || "验证码不对");
    await refreshUser(); await pull({ afterLogin: true }); claimGifts(); return user;
  }
  async function appleLogin() {
    const plug = capPlugin("SignInWithApple");
    if (!plug) throw new Error("Apple 登录需要在 iPhone App 里使用");
    const res = await plug.authorize({ clientId: "io.github.shizhongzhou.maomao", redirectURI: "https://localhost", scopes: "" });
    const token = res && res.response && res.response.identityToken;
    if (!token) throw new Error("Apple 登录被取消");
    await ready();
    const r = await auth.signInWithCustomTicket(async () => (await call("appleTicket", { identityToken: token })).ticket);
    if (r && r.error) throw new Error(r.error.message || "Apple 登录失败");
    await refreshUser(); await pull({ afterLogin: true }); claimGifts(); return user;
  }
  async function logout() {
    await ready(); await push(); await auth.signOut(); await auth.signInAnonymously(); await refreshUser();
    meta.uid = user && user.id || ""; meta.syncedAt = 0; saveMeta(); emit();
  }

  /* ---------- start ---------- */
  function start() {
    if (!enabled()) return;
    Pet.onChange(schedulePush);
    ready().then(ok => { if (ok) { pull(); claimGifts(); } });
    document.addEventListener("visibilitychange", () => { if (document.hidden) { clearTimeout(pushT); if (meta.localAt > meta.syncedAt) push(); } });
  }
  const label = () => {
    if (!enabled()) return { state: "off", text: "云服务未开启" };
    if (!user) return { state: "wait", text: lastErr || "正在连接云端…" };
    if (user.is_anonymous) return { state: "guest", text: "游客 · 进度已备份到云端，登录后可换设备" };
    const id = user.phone || user.phone_number || user.email || "Apple 账号";
    return { state: "user", text: String(id).replace(/(\d{3})\d{4}(\d{3,4})/, "$1****$2") };
  };
  return { enabled, ready, call, start, push, pull, sendCode, verifyCode, appleLogin, logout, label, claimGifts,
    user: () => user, onChange: fn => listeners.add(fn), status: () => ({ syncedAt: meta.syncedAt, localAt: meta.localAt, err: lastErr }) };
})();

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
  let restoring = false;
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(); } catch (_) {} });
  const enabled = () => !!CFG.env;
  /* turn browser network errors ("Load failed", "Failed to fetch"…) into something a player understands */
  const BLOCKED_HOST = /github\.io$/.test(location.hostname);     // not on CloudBase's allowed-origin list
  function nice(e) {
    const m = String(e && e.message || e || "");
    if (/load failed|failed to fetch|network|unexpected end of json|NetworkError|403/i.test(m))
      return new Error(BLOCKED_HOST ? "网页版暂时不能登录，请在 App 里登录" : "网络连接失败，请检查网络后再试");
    const code=String(e?.code||e?.error||"").toLowerCase();
    if(/invalid.*(?:phone|phonenumber)|phone.*(?:regexp|pattern)|ResetPasswordRequest\.PhoneNumber/i.test(m))return new Error("手机号格式不正确，请填写“+国家区号 手机号”，中国大陆可直接输入 11 位号码");
    if(/code_expired|verification.*expired/.test(code+" "+m))return new Error("验证码已过期，请重新获取");
    if(/invalid_password|invalid_credentials/.test(code+" "+m))return new Error("账号或密码不正确，请检查后重试");
    if(/password_not_set/.test(code+" "+m))return new Error("这个账号还没有设置密码，请用验证码登录，或选择“找回 / 设置密码”");
    if(/not_found|user_not_found/.test(code+" "+m))return new Error("没有找到这个账号，请先注册新账号");
    if(/invalid.*(?:code|verification)|验证码/.test(code+" "+m))return new Error("验证码不正确，请检查后重试");
    return e instanceof Error ? e : new Error(m||"操作未完成，请重试");
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
      if (!s || !s.data || !s.data.session) {
        // Internal legacy save sessions are optional. A disabled anonymous provider must
        // not prevent registration, OTP sign-in or password sign-in from opening.
        try { await auth.signInAnonymously(); } catch (_) {}
      }
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
    const requestedUid = user && user.id;
    try {
      const sum = summary();
      const r = await call("save", { state: Pet.state, summary: sum, updatedAt: meta.localAt || Date.now(), force });
      if (requestedUid !== (user && user.id)) return;
      if (r.conflict) { await adopt(r.state, r.updatedAt, "另一台设备上的进度更新"); return; }
      meta.syncedAt = r.updatedAt; meta.uid = user && user.id || meta.uid; Pet.state.friendCode = r.friendCode || Pet.state.friendCode; saveMeta(); lastErr = "";
    } catch (e) { lastErr = e.message; } finally { busy = false; emit(); }
  }
  function adopt(state, updatedAt, why, destination = "") {
    if (!state || !state.profile) return;
    restoring = true;
    localStorage.setItem("mm_pet_v1", JSON.stringify(state));
    meta.syncedAt = meta.localAt = updatedAt; meta.uid = user && user.id || meta.uid; saveMeta();
    Pet.toast(`已载入${why}`, "good");
    setTimeout(() => { if (destination) location.replace(destination); location.reload(); }, 150);
  }
  /* reconcile with the cloud on start and after login */
  async function pull({ afterLogin = false } = {}) {
    const requestedUid = user && user.id;
    let r;
    try { r = await call("load"); } catch (e) { lastErr = nice(e).message; emit(); if(afterLogin)throw new Error("账号已验证，但学习进度暂时读取失败。请点“重试恢复进度”，不会创建新存档。"); return; }
    const uid = user && user.id;
    if (requestedUid !== uid) { if(afterLogin)throw new Error("登录账号发生变化，请重新登录"); return; } // Discard stale responses.
    if(!r || typeof r.exists!=="boolean" || (r.exists && !r.state?.profile)){
      if(afterLogin)throw new Error("账号已验证，但云端存档尚未读取完整。请重试恢复进度。");
      return;
    }
    const local = Pet.state.profile ? Pet.state : null;
    if (!r.exists) { if (local) { meta.uid = uid; meta.localAt = meta.localAt || Date.now(); saveMeta(); await push(true); } return; }
    if (!local) return adopt(r.state, r.updatedAt, "云端存档", afterLogin ? "#/home" : "");
    const sameAccount = meta.uid === uid;
    if (sameAccount) {
      const localChanged = meta.localAt > meta.syncedAt;
      if (r.updatedAt > meta.syncedAt && !localChanged) return adopt(r.state, r.updatedAt, "云端最新进度", afterLogin ? "#/home" : "");
      if (localChanged || r.updatedAt < meta.localAt) return push();
      return;
    }
    if (afterLogin) return chooseSave(r);          // a different save already lives in this account
    meta.uid = uid; saveMeta();
  }
  function chooseSave(r) {
    return new Promise(resolve => {
      const c = r.state || {}, l = Pet.state, cg = c.growth || 0, lg = l.growth || 0;
      const box = h(`<div class="cloud-pick" role="dialog" aria-modal="true" aria-label="选择存档"><div class="cp-card">
        <h2>找到了两份学习进度</h2><p class="hint">请选择继续使用哪一份。本机已有的进度不会在你确认前覆盖云端。</p>
        <button class="cp-opt" data-k="cloud">${catSVG({ breed: (c.cat || {}).breed || "orange", stage: 1, mood: "happy", size: 56 })}<span><b>云端：${esc((c.cat || {}).name || "宠物")}</b><small>成长值 ${fmt(cg)} · 学习 ${c.studyDays || 0} 天</small></span></button>
        <button class="cp-opt" data-k="local">${catSVG({ breed: l.cat.breed, stage: 1, mood: "happy", size: 56 })}<span><b>本机：${esc(l.cat.name)}</b><small>成长值 ${fmt(lg)} · 学习 ${l.studyDays || 0} 天</small></span></button><p class="hint" role="status"></p>
      </div></div>`);
      document.body.append(box);
      box.querySelectorAll("[data-k]").forEach(b => b.onclick = async () => {
        box.querySelectorAll("[data-k]").forEach(x=>x.disabled=true);
        try {
          if (b.dataset.k === "cloud") adopt(r.state, r.updatedAt, "云端存档", "#/home");
          else { meta.uid = user.id; meta.localAt = Date.now(); saveMeta(); await push(true); if(lastErr)throw new Error(lastErr); Pet.toast("本机进度已保存到这个账号", "good"); }
          box.remove(); resolve();
        } catch(e) { box.querySelector('[role="status"]').textContent=nice(e).message; box.querySelectorAll("[data-k]").forEach(x=>x.disabled=false); }
      });
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

  /* ---------- account access ---------- */
  function normalizePhone(value) {
    let input=String(value||"").normalize("NFKC").trim().replace(/^00/, "+");
    if(/^1[3-9]\d{9}$/.test(input))return "+86 "+input;
    if(/^86\s*1[3-9]\d{9}$/.test(input))return "+86 "+input.replace(/^86\s*/, "");
    input=input.replace(/[()（）.-]/g, "").replace(/\s+/g," ");
    const domestic=input.replace(/ /g,"");
    if(/^1[3-9]\d{9}$/.test(domestic))return "+86 "+domestic;
    if(/^861[3-9]\d{9}$/.test(domestic))return "+86 "+domestic.slice(2);
    const explicit=input.match(/^\+([1-9]\d{0,2}) ([0-9 ]{4,24})$/);
    if(explicit){const national=explicit[2].replace(/ /g,"");if(national.length>=4&&national.length<=20)return `+${explicit[1]} ${national}`;}
    const compact=input.replace(/ /g,"");
    // Preserve the country boundary. In particular, do not let the SDK split +7 as +79.
    const codes=["1","7","20","27","30","31","32","33","34","36","39","40","41","43","44","45","46","47","48","49","51","52","53","54","55","56","57","58","60","61","62","63","64","65","66","81","82","84","86","90","91","92","93","94","95","98","852","853","886","971","972","973","974","975","976","977","992","993","994","995","996","998"];
    if(/^\+[1-9]\d{4,22}$/.test(compact)){
      const country=codes.find(code=>compact.startsWith("+"+code));
      if(country){const national=compact.slice(country.length+1);if(national.length>=4&&national.length<=20)return `+${country} ${national}`;}
    }
    throw new Error("请输入正确手机号：中国大陆号码可直接输入 11 位；其他地区请填写“+国家区号 手机号”");
  }
  function accountTarget(value, kind) {
    const target=String(value||"").trim();
    if(kind==="email" || (!kind && target.includes("@"))){
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target))throw new Error("请输入正确的邮箱地址");
      return {kind:"email",value:target};
    }
    return {kind:"phone",value:normalizePhone(target)};
  }
  function validateUsername(value) {
    const username=String(value||"").trim();
    if(!/^[A-Za-z][A-Za-z0-9_.-]{4,23}$/.test(username))throw new Error("用户名需以字母开头，共 5–24 位，可用字母、数字、下划线和短横线");
    return username;
  }
  function validatePassword(value) {
    if(typeof value!=="string"||value.length<8||value.length>64)throw new Error("密码需为 8–64 位");
    return value;
  }
  function sdkError(result, fallback) {
    if(result?.error)throw nice(result.error);
    if(!result)throw new Error(fallback||"请求没有完成，请重试");
    return result.data;
  }
  async function resumeSignIn() {
    if(!(await ready()))throw nice(lastErr||"暂时连接不上登录服务");
    await refreshUser();
    if(!user || user.is_anonymous)throw new Error("登录状态没有建立，请重新获取验证码后再试");
    try { await pull({afterLogin:true}); }
    catch(error) { const e=nice(error);e.code="AUTH_SYNC_PENDING";throw e; }
    claimGifts();return user;
  }
  async function finishSignIn(result) {
    sdkError(result,"登录没有完成，请重试");
    // A valid identity alone is not enough: do not mistake a failed save read for a new account.
    return resumeSignIn();
  }
  async function sendCode(kind, target) {
    const to=accountTarget(target,kind);
    if(!(await ready()))throw nice(lastErr||"暂时连接不上登录服务");
    const data=sdkError(await auth.signInWithOtp({[to.kind]:to.value,options:{shouldCreateUser:false}}),"验证码发送失败");
    if(typeof data?.verifyOtp!=="function")throw new Error("验证码发送失败，请重试");
    return {kind:to.kind,target:to.value,verifyOtp:data.verifyOtp};
  }
  async function sendRegistrationCode({kind,target,username,password}) {
    const to=accountTarget(target,kind),loginUsername=validateUsername(username),secret=validatePassword(password);
    if(!(await ready()))throw nice(lastErr||"暂时连接不上注册服务");
    if(typeof auth.isUsernameRegistered==="function" && await auth.isUsernameRegistered(loginUsername))throw new Error("这个用户名已被使用，请换一个；已有账号请选择登录");
    // CloudBase signUp sends a challenge and binds the normalized identity to verifyOtp.
    const data=sdkError(await auth.signUp({[to.kind]:to.value,username:loginUsername,password:secret}),"注册验证码发送失败");
    if(typeof data?.verifyOtp!=="function")throw new Error("注册验证码发送失败，请重试");
    return {kind:to.kind,target:to.value,username:loginUsername,verifyOtp:data.verifyOtp};
  }
  async function verifyCode(pending, code) {
    if(typeof pending?.verifyOtp!=="function")throw new Error("请先获取验证码");
    return finishSignIn(await pending.verifyOtp({token:String(code).trim()}));
  }
  async function setLoginUsername(value) {
    const username=validateUsername(value);
    if(!(await ready()) || !user || user.is_anonymous)throw new Error("请先登录账号");
    sdkError(await auth.updateUser({username}));await refreshUser();return user;
  }
  async function sendPasswordCode(account) {
    const to=accountTarget(account);
    if(!(await ready()))throw nice(lastErr||"暂时连接不上登录服务");
    // SDK resetPasswordForEmail closes over this argument and reuses it verbatim in
    // ResetPasswordRequest.PhoneNumber; it MUST already be '+country national'.
    const data=sdkError(await auth.resetPasswordForEmail(to.value),"找回密码验证码发送失败");
    if(typeof data?.updateUser!=="function")throw new Error("验证码发送失败，请重试");
    return {kind:to.kind,target:to.value,updateUser:data.updateUser};
  }
  async function finishPasswordSetup(pending,code,password) {
    validatePassword(password);
    if(typeof pending?.updateUser!=="function")throw new Error("请先获取验证码");
    return finishSignIn(await pending.updateUser({nonce:String(code).trim(),password}));
  }
  async function passwordLogin(account,password) {
    const id=String(account||"").trim();
    if(!id||!password)throw new Error("请输入账号和密码");
    let arg;
    if(id.includes("@")){const to=accountTarget(id,"email");arg={email:to.value,password};}
    else if(/^\+?[0-9 ()（）.-]+$/.test(id)){arg={phone:normalizePhone(id),password};}
    else arg={username:id,password};
    if(!(await ready()))throw nice(lastErr||"暂时连接不上登录服务");
    return finishSignIn(await auth.signInWithPassword(arg));
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
    const id = user.user_metadata?.username || user.username || user.phone || user.phone_number || user.email || "已登录账号";
    return { state: "user", text: String(id).replace(/(\d{3})\d{4}(\d{3,4})/, "$1****$2") };
  };
  return { restoring:()=>restoring, enabled, ready, call, start, push, pull, normalizePhone, accountTarget, resumeSignIn, sendCode, sendRegistrationCode, verifyCode, passwordLogin, setLoginUsername, sendPasswordCode, finishPasswordSetup, appleLogin, logout, label, claimGifts,
    user: () => user, onChange: fn => listeners.add(fn), status: () => ({ syncedAt: meta.syncedAt, localAt: meta.localAt, err: lastErr }) };
})();

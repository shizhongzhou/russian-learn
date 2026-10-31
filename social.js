"use strict";
/* ========== 猫猫俄语通 · login sheet, leaderboard, friends, visiting a friend's cat, admin ========== */
const SOC_BACK = (href, label) => `<a class="iconbtn" href="${href}" aria-label="${label}">${svgI(ICON.back, "stroke")}</a>`;
function cloudOffNote(box) {
  box.append(h(`<section class="card"><h2>云服务还没开启</h2><p class="hint">排行榜、好友和多设备同步需要先接入云端。开通后这里会自动出现。</p></section>`));
}
const catPic = (breed, size) => catSVG({ breed: breed || "orange", stage: 3, mood: "happy", size });

/* ---------- account: cloud card + login sheet ---------- */
function cloudCard() {
  const sec = h(`<section class="card cloudcard"></section>`);
  function draw() {
    const L = Cloud.label(), st = Cloud.status();
    const synced = st.syncedAt ? new Date(st.syncedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    sec.innerHTML = `<div class="row"><h2>云端账号</h2><span class="pill ${L.state === "user" ? "green" : ""}">${L.state === "user" ? "已登录" : L.state === "guest" ? "游客" : "未连接"}</span></div>
      <p class="hint">${esc(L.text)}${synced ? ` · 上次同步 ${synced}` : ""}</p>
      ${L.state === "user" && (Cloud.user()?.username || Cloud.user()?.user_metadata?.username) ? `<p class="hint">登录用户名：${esc(Cloud.user().username || Cloud.user().user_metadata?.username || "")}</p>` : ""}
      ${L.state === "off" ? "" : L.state === "user"
        ? `<div class="row2"><button class="btn ghost" id="syncNow">立即同步</button><button class="btn ghost" id="logout">退出登录</button></div><div class="row2"><button class="btn ghost" id="username">设置登录用户名</button><button class="btn ghost" id="passwordSetup">设置 / 找回密码</button></div>`
        : `<button class="btn big" id="login">登录 / 注册</button><p class="hint">登录后换手机、网页和 App 都是同一只猫。</p>`}
      ${L.state === "off" ? "" : `<div class="cloud-links"><a href="#/rank">排行榜 ›</a><a href="#/friends">好友 ›</a><a href="#/admin" id="adminLink" hidden>管理后台 ›</a></div>`}`;
    const q = s => sec.querySelector(s);
    if (q("#login")) q("#login").onclick = () => loginSheet();
    if(q("#username"))q("#username").onclick=()=>loginUsernameSheet(draw);
    if(q("#passwordSetup"))q("#passwordSetup").onclick=()=>{loginSheet(draw,{mode:"reset"});};
    if (q("#syncNow")) q("#syncNow").onclick = async () => { await Cloud.push(true); Pet.toast(Cloud.status().err || "已同步", Cloud.status().err ? "warn" : "good"); draw(); };
    if (q("#logout")) q("#logout").onclick = async () => { await Cloud.logout(); Pet.toast("已退出登录，本机进度已保留"); location.hash="#/welcome"; };
    if (Cloud.enabled()) Cloud.call("whoami").then(r => { const a = q("#adminLink"); if (a && r.admin) a.hidden = false; }).catch(() => {});
  }
  Cloud.onChange(() => { if (document.body.contains(sec)) draw(); });
  draw();
  return sec;
}
function loginSheet(onDone, options = {}) {
  if(loginSheet.current)return loginSheet.current;
  const apple = IS_NATIVE && !!capPlugin("SignInWithApple") && /iphone|ipad|mac/i.test(navigator.userAgent);
  const box = h(`<div class="cloud-pick auth-access" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div class="cp-card login"></div></div>`);
  document.body.append(box);
  const card=box.querySelector(".login");
  let mode=["register","reset"].includes(options.mode)?options.mode:"login",method=options.method==="password"?"password":"otp",identityKind="phone",pending=null,requestKey="",busy=false,closed=false,retrySync=false;
  const cooldowns=new Map();let clock;
  function close(){closed=true;clearInterval(clock);box.remove();loginSheet.current=null;}
  function entered(){
    if(closed)return;
    const outcome={user:Cloud.user(),mode,newAccount:!Pet.state.profile};
    close();
    if(typeof onDone==="function")onDone(outcome);
    else if(!Cloud.restoring()){if(Pet.state.profile)location.hash="#/home";else location.hash="#/welcome";Pet.toast(mode==="register"?"账号已验证，可以选择你的宠物了":"登录成功，已恢复你的进度","good");}
  }
  function draw(){
    pending=null;requestKey="";busy=false;retrySync=false;
    const register=mode==="register",reset=mode==="reset",passwordOnly=mode==="login"&&method==="password",needsPassword=register||reset||passwordOnly;
    card.innerHTML=`<header class="auth-heading"><div><h2 id="auth-title">${register?"注册新账号":reset?"找回 / 设置密码":"欢迎回来"}</h2><p>${register?"先验证手机号或邮箱，再领养你的宠物。":reset?"验证账号本人后，设置新的登录密码。":"登录后继续你的宠物和学习进度。"}</p></div><button type="button" class="iconbtn" data-auth-close aria-label="关闭登录窗口">×</button></header>
      <nav class="auth-modes" aria-label="账号操作"><button type="button" data-auth-mode="login" aria-current="${mode==="login"?"page":"false"}">登录</button><button type="button" data-auth-mode="register" aria-current="${register?"page":"false"}">注册新账号</button></nav>
      ${mode==="login"?`<div class="auth-methods" role="tablist" aria-label="登录方式"><button type="button" role="tab" aria-selected="${method==="otp"}" data-auth-method="otp">验证码登录</button><button type="button" role="tab" aria-selected="${passwordOnly}" data-auth-method="password">账号密码登录</button></div>`:""}
      <form class="auth-form" novalidate>
      ${register?`<label class="field"><span>登录用户名</span><input id="auth-username" autocomplete="username" maxlength="24" placeholder="5–24 位，以字母开头"></label>`:""}
      ${!passwordOnly?`<div class="auth-identities" role="group" aria-label="验证方式"><button type="button" data-auth-identity="phone" aria-pressed="${identityKind==="phone"}">手机号</button><button type="button" data-auth-identity="email" aria-pressed="${identityKind==="email"}">邮箱</button></div>`:""}
      <label class="field"><span>${passwordOnly?"用户名 / 手机号 / 邮箱":identityKind==="phone"?"手机号":"邮箱地址"}</span><input id="auth-account" ${passwordOnly?'autocomplete="username"':identityKind==="phone"?'inputmode="tel" autocomplete="tel"':'type="email" autocomplete="email"'} placeholder="${passwordOnly?"输入登录账号":identityKind==="phone"?"中国大陆手机号，或 +国家区号 手机号":"name@example.com"}"></label>
      ${needsPassword?`<label class="field"><span>${reset?"新密码":"密码"}</span><input id="auth-password" type="password" minlength="8" maxlength="64" autocomplete="${passwordOnly?"current-password":"new-password"}" placeholder="${passwordOnly?"输入密码":"8–64 位，请勿与其他账号共用"}"></label>`:""}
      ${register||reset?`<label class="field"><span>确认密码</span><input id="auth-confirm" type="password" autocomplete="new-password" maxlength="64" placeholder="再次输入密码"></label>`:""}
      ${!passwordOnly?`<div class="auth-code-row"><label class="field"><span>验证码</span><input id="auth-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="输入收到的验证码"></label><button class="btn ghost" type="button" id="auth-send">获取验证码</button></div>`:""}
      <p class="auth-message" id="auth-message" role="status" aria-live="polite"></p>
      <button class="btn big" id="auth-submit" type="submit">${register?"注册并进入":reset?"保存新密码并登录":"登录并进入"}</button></form>
      ${mode==="login"?`<div class="auth-links"><button type="button" data-auth-forgot>忘记密码？</button><button type="button" data-auth-register>还没有账号？注册新账号</button></div>`:reset?`<button class="auth-back" type="button" data-auth-login>返回登录</button><p class="hint auth-footnote">只有已注册的账号可以找回密码。新用户请选择“注册新账号”。</p>`:`<p class="hint auth-footnote">如果该手机号或邮箱已注册，验证后会登录原账号，不会修改原密码。</p><button class="auth-back" type="button" data-auth-login>已有账号？直接登录</button>`}
      ${apple&&mode==="login"?`<button class="btn big apple" type="button" data-auth-apple>通过 Apple 登录</button>`:""}`;
    const q=s=>card.querySelector(s),message=q("#auth-message"),account=q("#auth-account"),submit=q("#auth-submit");
    q("[data-auth-close]").onclick=close;
    card.querySelectorAll("[data-auth-mode]").forEach(b=>b.onclick=()=>{if(busy)return;mode=b.dataset.authMode;draw();});
    card.querySelectorAll("[data-auth-method]").forEach(b=>b.onclick=()=>{if(busy)return;method=b.dataset.authMethod;draw();});
    card.querySelectorAll("[data-auth-identity]").forEach(b=>b.onclick=()=>{if(busy||identityKind===b.dataset.authIdentity)return;identityKind=b.dataset.authIdentity;draw();});
    for(const selector of ["[data-auth-login]","[data-auth-register]","[data-auth-forgot]"]){const b=q(selector);if(b)b.onclick=()=>{if(busy)return;mode=selector.includes("register")?"register":selector.includes("forgot")?"reset":"login";draw();};}
    function fields(){
      const value=account.value.trim(),password=q("#auth-password")?.value||"",username=q("#auth-username")?.value.trim()||"";
      if(passwordOnly){if(!value||!password)throw new Error("请输入账号和密码");return {value,password};}
      const to=Cloud.accountTarget(value,identityKind);
      if(register||reset){if(password.length<8||password.length>64)throw new Error("密码需为 8–64 位");if(password!==q("#auth-confirm").value)throw new Error("两次输入的密码不一致");}
      if(register&&!/^[A-Za-z][A-Za-z0-9_.-]{4,23}$/.test(username))throw new Error("用户名需以字母开头，共 5–24 位，可用字母、数字、下划线和短横线");
      return {value:to.value,kind:to.kind,password,username};
    }
    function key(f){return JSON.stringify([mode,f.kind||"",f.value,f.username||"",register?f.password:""]);}
    function lock(value){busy=value;submit.disabled=value;card.querySelectorAll('[data-auth-mode],[data-auth-method],[data-auth-identity],[data-auth-login],[data-auth-register],[data-auth-forgot]').forEach(b=>b.disabled=value);if(q("#auth-send"))q("#auth-send").disabled=value||remaining()>0;}
    function remaining(){let f;try{f=Cloud.accountTarget(account.value.trim(),identityKind);}catch{return 0;}return Math.max(0,Math.ceil(((cooldowns.get(f.kind+":"+f.value)||0)-Date.now())/1000));}
    function showCooldown(){const b=q("#auth-send");if(!b)return;const n=remaining();b.textContent=n?`${n} 秒后重发`:"获取验证码";b.disabled=busy||n>0;}
    clearInterval(clock);if(!passwordOnly)clock=setInterval(showCooldown,1000);
    if(q("#auth-send"))q("#auth-send").onclick=async()=>{
      if(busy||remaining()>0)return;
      let f;try{f=fields();}catch(e){message.textContent=e.message;return;}
      lock(true);message.textContent="正在发送验证码…";
      try{
        const challenge=register?await Cloud.sendRegistrationCode({kind:f.kind,target:f.value,username:f.username,password:f.password}):reset?await Cloud.sendPasswordCode(f.value):await Cloud.sendCode(f.kind,f.value);
        if(closed)return;
        pending=challenge;requestKey=key(f);cooldowns.set(f.kind+":"+f.value,Date.now()+60000);message.textContent=`验证码已发送到 ${f.value}`;q("#auth-code").focus();
      }catch(e){if(!closed)message.textContent=e.message||"验证码没有发送成功，请重试";}finally{if(!closed){lock(false);showCooldown();}}
    };
    q(".auth-form").onsubmit=async e=>{
      e.preventDefault();if(busy)return;
      if(retrySync){lock(true);message.textContent="正在重新读取学习进度…";try{await Cloud.resumeSignIn();if(!closed)entered();}catch(error){if(!closed){message.textContent=error.message;lock(false);}}return;}
      let f;try{f=fields();}catch(error){message.textContent=error.message;return;}
      const code=q("#auth-code")?.value.trim()||"";
      if(!passwordOnly){if(!pending){message.textContent="请先获取验证码";return;}if(requestKey!==key(f)){pending=null;requestKey="";message.textContent="账号、用户名或注册密码已修改，请重新获取验证码";return;}if(!/^\d{4,6}$/.test(code)){message.textContent="请输入收到的 4–6 位验证码";return;}}
      lock(true);message.textContent=register?"正在验证并注册…":reset?"正在验证并保存新密码…":"正在登录…";
      try{
        if(passwordOnly)await Cloud.passwordLogin(f.value,f.password);
        else if(reset)await Cloud.finishPasswordSetup(pending,code,f.password);
        else await Cloud.verifyCode(pending,code);
        if(!closed)entered();
      }catch(error){if(!closed){message.textContent=error.message||"没有完成，请检查后重试";if(error.code==="AUTH_SYNC_PENDING"){retrySync=true;submit.textContent="重试恢复进度";}lock(false);}}
    };
    // Never submit merely because a code was typed: users can review their account first.
    if(q("[data-auth-apple]"))q("[data-auth-apple]").onclick=async()=>{if(busy)return;lock(true);message.textContent="正在通过 Apple 登录…";try{await Cloud.appleLogin();if(!closed)entered();}catch(e){if(!closed){message.textContent=e.message;lock(false);}}};
  }
  draw();loginSheet.current={close};return loginSheet.current;
}

/* ---------- leaderboard ---------- */
function pageRank(by) {
  if(by==="friends"){const box=h(`<div class="page"><header class="subhead">${SOC_BACK("#/home","返回主页")}<h1>好友学习排名</h1></header></div>`);app.append(box);mountHomeFriendRank(box,true);return;}
  const tabs = [["week", "本周答对"], ["streak", "连续学习"], ["growth", "成长值"], ["words", "单词量"]];
  by = tabs.some(t => t[0] === by) ? by : "week";
  const box = h(`<div class="page rank"><header class="subhead">${SOC_BACK("#/home", "返回主页")}<h1 class="display small grow">排行榜</h1></header>
    <nav class="lv-pills rank-tabs">${tabs.map(([k, t]) => `<a href="#/rank/${k}" ${k === by ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</nav><div class="rk-body"><p class="empty">加载中…</p></div></div>`);
  app.append(box);
  if (!Cloud.enabled()) { box.querySelector(".rk-body").innerHTML = ""; return cloudOffNote(box); }
  const unit = { week: "题", streak: "天", growth: "", words: "词" }[by];
  const field = { week: "weekCorrect", streak: "streak", growth: "growth", words: "words" }[by];
  Cloud.push().catch(() => {});
  Cloud.call("leaderboard", { by }).then(r => {
    const myUid = Cloud.user() && Cloud.user().id;
    box.querySelector(".rk-body").innerHTML = `${r.me ? `<section class="rk-me"><span>我的排名</span><b>第 ${r.me.rank} 名</b><em>${fmt(r.me.value)} ${unit}</em></section>` : ""}
      <ol class="rk-list">${r.top.map((p, i) => `<li class="${p.uid === myUid ? "me" : ""}"><span class="rk-n ${i < 3 ? "top" + i : ""}">${i + 1}</span>
        <span class="rk-cat">${catPic(p.breed, 44)}</span><span class="grow"><b>${esc(p.nick)}</b><small>${esc(p.catName)} · Lv.${p.level}</small></span><em>${fmt(p[field] || 0)}<small> ${unit}</small></em></li>`).join("") || `<p class="empty">还没有人上榜，快去答题吧！</p>`}</ol>
      ${by === "week" ? `<p class="hint">每周一 0 点（北京时间）重新开始。</p>` : ""}`;
  }).catch(e => box.querySelector(".rk-body").innerHTML = `<p class="empty">${esc(e.message)}</p>`);
}

/* ---------- friends ---------- */
function pageFriends() {
  const box = h(`<div class="page friends"><header class="subhead">${SOC_BACK("#/home", "返回主页")}<h1 class="display small grow">好友</h1></header><div class="fr-body"><p class="empty">加载中…</p></div></div>`);
  app.append(box);
  if (!Cloud.enabled()) { box.querySelector(".fr-body").innerHTML = ""; return cloudOffNote(box); }
  const body = box.querySelector(".fr-body");
  async function draw() {
    let r;
    try { await Cloud.push(); r = await Cloud.call("friendList"); } catch (e) { body.innerHTML = `<p class="empty">${esc(e.message)}</p>`; return; }
    const row = (p, extra) => `<div class="fr-row">${catPic(p.breed, 48)}<span class="grow"><b>${esc(p.nick)}</b><small>${esc(p.catName)} · Lv.${p.level} · 连续 ${p.streak} 天</small></span>${extra}</div>`;
    body.innerHTML = `<section class="card fr-code"><small>我的好友码</small><b>${r.myCode || "同步后生成"}</b><button class="btn small ghost" id="copy">复制</button></section>
      <section class="card"><h2>加好友</h2><div class="row2"><input class="fr-input" id="code" maxlength="8" placeholder="输入对方的 6 位好友码" autocapitalize="characters"><button class="btn" id="add">添加</button></div><p class="hint" id="msg"></p></section>
      ${r.incoming.length ? `<section class="card"><h2>好友请求</h2>${r.incoming.map(p => row(p, `<button class="btn small" data-ok="${p.uid}">同意</button><button class="btn small ghost" data-no="${p.uid}">忽略</button>`)).join("")}</section>` : ""}
      <section class="card"><h2>我的好友 · ${r.friends.length}</h2>${r.friends.map(p => `<a class="fr-link" href="#/friend/${encodeURIComponent(p.uid)}">${row(p, `<span class="hm-go-t">去看猫 ›</span>`)}</a>`).join("") || `<p class="hint">还没有好友。把好友码发给同学，一起养猫学俄语。</p>`}
      ${r.outgoing.length ? `<p class="hint">等待对方同意：${r.outgoing.map(p => esc(p.nick)).join("、")}</p>` : ""}</section>`;
    const $ = s => body.querySelector(s);
    $("#copy").onclick = async () => { try { await navigator.clipboard.writeText(`来猫猫俄语通加我好友吧！好友码：${r.myCode}`); Pet.toast("好友码已复制", "good"); } catch { Pet.toast(`好友码：${r.myCode}`); } };
    $("#add").onclick = async () => {
      const code = $("#code").value.trim(); if (!code) return;
      try { const x = await Cloud.call("friendAdd", { code }); $("#msg").textContent = x.status === "ok" ? `已和 ${x.friend.nick} 成为好友！` : `已发送请求给 ${x.friend.nick}，等对方同意`; setTimeout(draw, 900); }
      catch (e) { $("#msg").textContent = e.message; }
    };
    body.querySelectorAll("[data-ok],[data-no]").forEach(b => b.onclick = async () => {
      await Cloud.call("friendRespond", { other: b.dataset.ok || b.dataset.no, accept: !!b.dataset.ok }).catch(e => Pet.toast(e.message, "warn")); draw();
    });
  }
  draw();
}
function pageFriendCat(uid) {
  const box = h(`<div class="page friendcat"><header class="subhead">${SOC_BACK("#/friends", "返回好友")}<h1 class="display small grow">好友的猫</h1></header><div class="fc-body"><p class="empty">加载中…</p></div></div>`);
  app.append(box);
  const body = box.querySelector(".fc-body");
  Cloud.call("friendCat", { other: decodeURIComponent(uid || "") }).then(r => {
    const p = r.friend, m = r.mood, sick = m.sick, hungry = (m.full || 0) < 30;
    body.innerHTML = `<section class="card catcard fc-card"><span class="pill ${sick ? "red" : "green"}">${sick ? "生病了" : hungry ? "有点饿" : "很开心"}</span>
        <div class="bigcat">${catSVG({ breed: p.breed, stage: p.stage, mood: sick ? "sick" : hungry ? "hungry" : "happy", size: 200 })}</div>
        <div class="cname">${esc(p.catName)}</div><div class="hint">${esc(p.nick)} 的猫 · Lv.${p.level} · 连续学习 ${p.streak} 天 · 本周答对 ${p.weekCorrect} 题</div></section>
      <section class="card"><h2>送它点零食</h2><p class="hint">对方下次打开 App 就会收到。今天还能送 <b id="left">${r.giftsLeft}</b> 次。</p>
        <div class="row2"><button class="btn" data-g="s1">送鸡肉干</button><button class="btn ghost" data-g="s2">送肉泥条</button></div></section>`;
    body.querySelectorAll("[data-g]").forEach(b => b.onclick = async () => {
      try { const x = await Cloud.call("sendGift", { to: p.uid, kind: b.dataset.g }); body.querySelector("#left").textContent = x.left; Pet.toast(`已送给 ${esc(p.catName)}，它会很开心的`, "good"); if (Pet.state.settings.meow) meowFor("correct"); }
      catch (e) { Pet.toast(e.message, "warn"); }
    });
  }).catch(e => body.innerHTML = `<p class="empty">${esc(e.message)}</p>`);
}

/* ---------- admin ---------- */
function pageAdmin() {
  const box = h(`<div class="page admin"><header class="subhead">${SOC_BACK("#/account", "返回账号")}<h1 class="display small grow">管理后台</h1></header><div class="ad-body"><p class="empty">加载中…</p></div></div>`);
  app.append(box);
  const body = box.querySelector(".ad-body");
  Cloud.call("adminStats").then(r => {
    const max = Math.max(1, ...r.days.map(d => d.active));
    const today = r.days[r.days.length - 1];
    const urow = u => `<tr><td>${esc(u.nick)}</td><td>${esc(u.catName)}</td><td>${u.level}</td><td>${u.streak}</td><td>${fmt(u.totalCorrect || 0)}</td><td>${u.friendCode || ""}</td><td>${u.lastActive ? new Date(u.lastActive).toLocaleDateString("zh-CN") : ""}</td></tr>`;
    body.innerHTML = `<section class="hm-stats ad-kpi"><div><b>${fmt(r.total)}</b><span>注册玩家</span></div><div><b>${today.active}</b><span>今日活跃</span></div><div><b>${today.newUsers}</b><span>今日新增</span></div></section>
      <section class="card"><h2>近 14 天活跃</h2><div class="ad-chart" role="img" aria-label="近14天每日活跃人数">${r.days.map(d => `<div title="${d.day}：活跃 ${d.active}，新增 ${d.newUsers}"><i style="height:${d.active / max * 100}%"></i><small>${d.day.slice(8)}</small></div>`).join("")}</div></section>
      <section class="card"><h2>品种分布</h2><div class="ad-breeds">${Object.entries(r.breeds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span>${catPic(k, 30)}${esc((BREEDS[k] || {}).name || k)} <b>${n}</b></span>`).join("")}</div></section>
      <section class="card"><div class="row"><h2>玩家</h2><input class="fr-input" id="q" placeholder="搜昵称 / 好友码"></div>
        <div class="ad-table"><table><thead><tr><th>昵称</th><th>猫</th><th>等级</th><th>连续</th><th>答对</th><th>好友码</th><th>最近</th></tr></thead><tbody id="rows">${r.recent.map(urow).join("")}</tbody></table></div></section>`;
    const q = body.querySelector("#q");
    q.onchange = async () => { const x = await Cloud.call("adminFind", { q: q.value }).catch(e => ({ users: [] })); body.querySelector("#rows").innerHTML = x.users.map(urow).join(""); };
  }).catch(e => body.innerHTML = `<p class="empty">${esc(e.message)}</p>`);
}

function loginUsernameSheet(after){
 const box=h(`<div class="cloud-pick" role="dialog" aria-modal="true" aria-label="设置登录用户名"><div class="cp-card"><h2>设置登录用户名</h2><label class="field"><span>用户名</span><input id="login-username" autocomplete="username" minlength="5" maxlength="24" value="${esc((Cloud.user()?.username || Cloud.user()?.user_metadata?.username)||"")}" placeholder="5–24 位字母或数字"></label><p class="hint">用户名用于账号密码登录；宠物名字和学习昵称不会改变。</p><p class="hint" id="username-error" role="status"></p><button class="btn big" id="save-username">保存用户名</button><button class="btn ghost big" id="cancel-username">取消</button></div></div>`);document.body.append(box);
 box.querySelector("#cancel-username").onclick=()=>box.remove();box.querySelector("#save-username").onclick=async()=>{const button=box.querySelector("#save-username");button.disabled=true;try{await Cloud.setLoginUsername(box.querySelector("#login-username").value.trim());box.remove();after?.();Pet.toast("登录用户名已保存","good");}catch(e){box.querySelector("#username-error").textContent=e.message;button.disabled=false;}};
}

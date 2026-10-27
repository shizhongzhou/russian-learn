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
      ${L.state === "user" && Cloud.user() ? `<p class="hint uid">用户 ID：<span>${esc(Cloud.user().id)}</span></p>` : ""}
      ${L.state === "off" ? "" : L.state === "user"
        ? `<div class="row2"><button class="btn ghost" id="syncNow">立即同步</button><button class="btn ghost" id="logout">退出登录</button></div>`
        : `<button class="btn big" id="login">登录 / 注册</button><p class="hint">登录后换手机、网页和 App 都是同一只猫。</p>`}
      ${L.state === "off" ? "" : `<div class="cloud-links"><a href="#/rank">排行榜 ›</a><a href="#/friends">好友 ›</a><a href="#/admin" id="adminLink" hidden>管理后台 ›</a></div>`}`;
    const q = s => sec.querySelector(s);
    if (q("#login")) q("#login").onclick = loginSheet;
    if (q("#syncNow")) q("#syncNow").onclick = async () => { await Cloud.push(true); Pet.toast(Cloud.status().err || "已同步", Cloud.status().err ? "warn" : "good"); draw(); };
    if (q("#logout")) q("#logout").onclick = async () => { await Cloud.logout(); Pet.toast("已退出登录，本机进度还在"); draw(); };
    if (Cloud.enabled()) Cloud.call("whoami").then(r => { const a = q("#adminLink"); if (a && r.admin) a.hidden = false; }).catch(() => {});
  }
  Cloud.onChange(() => { if (document.body.contains(sec)) draw(); });
  draw();
  return sec;
}
function loginSheet() {
  const apple = IS_NATIVE && !!capPlugin("SignInWithApple") && /iphone|ipad|mac/i.test(navigator.userAgent);
  const box = h(`<div class="cloud-pick" role="dialog" aria-modal="true" aria-label="登录"><div class="cp-card login">
    <div class="row"><h2>登录 / 注册</h2><button class="iconbtn" id="x" aria-label="关闭">×</button></div>
    <div class="seg" role="tablist"><button role="tab" aria-selected="true" data-k="phone">手机号</button><button role="tab" aria-selected="false" data-k="email">邮箱</button></div>
    <label class="field"><span id="lbl">手机号</span><input id="who" inputmode="tel" autocomplete="tel" placeholder="13800138000"></label>
    <div class="row2"><label class="field grow"><span>验证码</span><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 位数字"></label><button class="btn ghost" id="send">获取验证码</button></div>
    <button class="btn big" id="go" disabled>登录</button>
    ${apple ? `<button class="btn big apple" id="apple"> 通过 Apple 登录</button>` : ""}
    <p class="hint" id="msg">没有账号会自动注册。登录后，本机的猫咪会同步到账号里。</p>
  </div></div>`);
  document.body.append(box);
  const $ = s => box.querySelector(s), msg = $("#msg");
  let kind = "phone", pending = null, cd = 0, timer;
  $("#x").onclick = () => { clearInterval(timer); box.remove(); };
  box.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
    kind = b.dataset.k; box.querySelectorAll("[data-k]").forEach(x => x.setAttribute("aria-selected", String(x === b)));
    $("#lbl").textContent = kind === "phone" ? "手机号" : "邮箱";
    const w = $("#who"); w.value = ""; w.inputMode = kind === "phone" ? "tel" : "email"; w.autocomplete = kind === "phone" ? "tel" : "email";
    w.placeholder = kind === "phone" ? "13800138000" : "name@example.com"; pending = null; $("#go").disabled = true;
  });
  $("#send").onclick = async () => {
    const who = $("#who").value.trim();
    if (kind === "phone" ? !/^1\d{10}$/.test(who) : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(who)) { msg.textContent = kind === "phone" ? "请输入 11 位手机号" : "邮箱格式不对"; return; }
    if (cd > 0) return;
    msg.textContent = "正在发送…";
    try {
      pending = await Cloud.sendCode(kind, who);
      msg.textContent = `验证码已发送到 ${who}`; $("#go").disabled = false; $("#code").focus();
      cd = 60; $("#send").disabled = true;
      timer = setInterval(() => { cd--; $("#send").textContent = cd > 0 ? `${cd} 秒` : "重新发送"; if (cd <= 0) { clearInterval(timer); $("#send").disabled = false; } }, 1000);
    } catch (e) { msg.textContent = e.message; }
  };
  $("#go").onclick = async () => {
    const code = $("#code").value.trim();
    if (!/^\d{4,6}$/.test(code)) { msg.textContent = "请输入收到的验证码"; return; }
    $("#go").disabled = true; msg.textContent = "登录中…";
    try { await Cloud.verifyCode(pending, code); clearInterval(timer); box.remove(); Pet.toast("登录成功，猫咪已同步", "good"); }
    catch (e) { msg.textContent = e.message; $("#go").disabled = false; }
  };
  if ($("#apple")) $("#apple").onclick = async () => {
    msg.textContent = "正在通过 Apple 登录…";
    try { await Cloud.appleLogin(); box.remove(); Pet.toast("登录成功，猫咪已同步", "good"); } catch (e) { msg.textContent = e.message; }
  };
}

/* ---------- leaderboard ---------- */
function pageRank(by) {
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
        <div class="row2"><button class="btn" data-g="s1">送小鱼干</button><button class="btn ghost" data-g="s2">送猫条</button></div></section>`;
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

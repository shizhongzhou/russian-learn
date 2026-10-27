"use strict";
/* 猫猫俄语通 · cloud API (Tencent CloudBase cloud function)
   Every client request goes through this one function; the database is never written directly by clients
   (all collections are server-only). The caller is identified by CloudBase auth, never by data it sends. */
const tcb = require("@cloudbase/node-sdk");
const crypto = require("crypto");
const https = require("https");

const ENV = tcb.SYMBOL_CURRENT_ENV;
let customKey = null;
try { customKey = process.env.TCB_CUSTOM_LOGIN_KEY ? JSON.parse(process.env.TCB_CUSTOM_LOGIN_KEY) : null; } catch (_) {}
const app = tcb.init(customKey ? { env: ENV, credentials: customKey } : { env: ENV });
const db = app.database();
const _ = db.command;
const C = { players: "players", friends: "friendships", gifts: "gifts", daily: "daily_active" };
const ADMINS = (process.env.ADMIN_UIDS || "").split(",").map(s => s.trim()).filter(Boolean);
const GIFT_KINDS = { s1: "小鱼干", s2: "猫条" };
const GIFTS_PER_DAY = 3;

let ready = null;
function ensureCollections() {
  if (!ready) ready = Promise.all(Object.values(C).map(n => db.createCollection(n).catch(() => null)));
  return ready;
}
const now = () => Date.now();
const today = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);          // China time
function weekKey(t = Date.now()) {
  const d = new Date(t + 8 * 3600e3); d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return d.getUTCFullYear() + "-W" + String(1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7)).padStart(2, "0");
}
const fail = (code, msg) => { const e = new Error(msg); e.code = code; throw e; };
const clean = (s, n) => String(s || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, n);
const num = (v, max = 1e9) => Math.max(0, Math.min(max, Math.floor(+v || 0)));

/* public summary of a player: what leaderboards and friends may see */
function pub(p) {
  return { uid: p._id, nick: p.nick, catName: p.catName, breed: p.breed, stage: p.stage, level: p.level, growth: p.growth,
    streak: p.streak, studyDays: p.studyDays, totalCorrect: p.totalCorrect, weekCorrect: p.weekKey === weekKey() ? p.weekCorrect : 0,
    words: p.words, friendCode: p.friendCode, lastActive: p.lastActive };
}
function summaryFrom(state, s) {
  return {
    nick: clean(s.nick, 12) || "同学", catName: clean(s.catName, 10) || "小橘", breed: clean(s.breed, 16) || "orange",
    stage: num(s.stage, 4), level: num(s.level, 9999), growth: num(s.growth), streak: num(s.streak, 100000),
    studyDays: num(s.studyDays, 100000), totalCorrect: num(s.totalCorrect), words: num(s.words),
    weekKey: weekKey(), weekCorrect: num(s.weekCorrect, 100000),
  };
}
async function newFriendCode() {
  const A = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  for (let i = 0; i < 6; i++) {
    let c = ""; for (let k = 0; k < 6; k++) c += A[crypto.randomInt(A.length)];
    const hit = await db.collection(C.players).where({ friendCode: c }).limit(1).get();
    if (!hit.data.length) return c;
  }
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
async function me(uid) { const r = await db.collection(C.players).doc(uid).get(); return r.data && r.data[0]; }
async function markActive(uid) {
  const id = today() + "_" + uid;
  await db.collection(C.daily).doc(id).set({ uid, day: today(), at: now() }).catch(() => null);
}

/* ---------------- actions ---------------- */
const A = {
  async load(uid) {
    const p = await me(uid); markActive(uid);
    return p ? { exists: true, state: p.state || null, updatedAt: p.updatedAt || 0, profile: pub(p) } : { exists: false };
  },

  async save(uid, { state, summary, updatedAt, force }) {
    if (!state || typeof state !== "object") fail("BAD", "缺少存档");
    const raw = JSON.stringify(state);
    if (raw.length > 400000) fail("BIG", "存档太大");
    const p = await me(uid), t = num(updatedAt) || now();
    if (p && !force && (p.updatedAt || 0) > t) return { conflict: true, state: p.state, updatedAt: p.updatedAt };   // newer copy on the server
    const doc = { ...summaryFrom(state, summary || {}), state, updatedAt: t, lastActive: now() };
    if (!p) { doc.createdAt = now(); doc.friendCode = await newFriendCode(); }
    if (p) await db.collection(C.players).doc(uid).update(doc); else await db.collection(C.players).doc(uid).set(doc);
    markActive(uid);
    return { ok: true, updatedAt: t, friendCode: p ? p.friendCode : doc.friendCode };
  },

  async leaderboard(uid, { by = "week" }) {
    const field = { week: "weekCorrect", streak: "streak", growth: "growth", words: "words" }[by] || "weekCorrect";
    let q = db.collection(C.players);
    if (field === "weekCorrect") q = q.where({ weekKey: weekKey() });
    const top = await q.orderBy(field, "desc").limit(50).get();
    const p = await me(uid); let rank = null;
    if (p) {
      const mine = field === "weekCorrect" ? (p.weekKey === weekKey() ? p.weekCorrect : 0) : p[field] || 0;
      const cond = { [field]: _.gt(mine) }; if (field === "weekCorrect") cond.weekKey = weekKey();
      const c = await db.collection(C.players).where(cond).count();
      rank = { rank: c.total + 1, value: mine };
    }
    return { by, field, week: weekKey(), top: top.data.map(pub), me: rank };
  },

  /* friends: requests by 6-letter code, accept, list, visit, gifts */
  async friendAdd(uid, { code }) {
    code = clean(code, 8).toUpperCase();
    const hit = await db.collection(C.players).where({ friendCode: code }).limit(1).get();
    const other = hit.data[0];
    if (!other) fail("NOCODE", "没有找到这个好友码");
    if (other._id === uid) fail("SELF", "这是你自己的好友码");
    const id = [uid, other._id].sort().join("_");
    const ex = await db.collection(C.friends).doc(id).get();
    const f = ex.data && ex.data[0];
    if (f && f.status === "ok") return { status: "ok", friend: pub(other) };
    if (f && f.from === other._id) {          // they already asked me: accept
      await db.collection(C.friends).doc(id).update({ status: "ok", at: now() }); return { status: "ok", friend: pub(other) };
    }
    await db.collection(C.friends).doc(id).set({ a: [uid, other._id].sort()[0], b: [uid, other._id].sort()[1], from: uid, to: other._id, status: "pending", at: now() });
    return { status: "pending", friend: pub(other) };
  },
  async friendRespond(uid, { other, accept }) {
    const id = [uid, String(other)].sort().join("_");
    const ex = await db.collection(C.friends).doc(id).get(); const f = ex.data && ex.data[0];
    if (!f || f.to !== uid || f.status !== "pending") fail("NOREQ", "请求已失效");
    if (accept) await db.collection(C.friends).doc(id).update({ status: "ok", at: now() });
    else await db.collection(C.friends).doc(id).remove();
    return { ok: true };
  },
  async friendRemove(uid, { other }) {
    await db.collection(C.friends).doc([uid, String(other)].sort().join("_")).remove(); return { ok: true };
  },
  async friendList(uid) {
    const rel = await db.collection(C.friends).where(_.or([{ a: uid }, { b: uid }])).limit(200).get();
    const ids = rel.data.map(f => (f.a === uid ? f.b : f.a));
    const ps = ids.length ? (await db.collection(C.players).where({ _id: _.in(ids) }).limit(200).get()).data : [];
    const byId = Object.fromEntries(ps.map(p => [p._id, pub(p)]));
    const p = await me(uid);
    return {
      myCode: p ? p.friendCode : null,
      friends: rel.data.filter(f => f.status === "ok").map(f => byId[f.a === uid ? f.b : f.a]).filter(Boolean),
      incoming: rel.data.filter(f => f.status === "pending" && f.to === uid).map(f => byId[f.from]).filter(Boolean),
      outgoing: rel.data.filter(f => f.status === "pending" && f.from === uid).map(f => byId[f.to]).filter(Boolean),
    };
  },
  async friendCat(uid, { other }) {
    const id = [uid, String(other)].sort().join("_");
    const ex = await db.collection(C.friends).doc(id).get(); const f = ex.data && ex.data[0];
    if (!f || f.status !== "ok") fail("NOTFRIEND", "还不是好友");
    const o = await me(String(other)); if (!o) fail("GONE", "对方还没有存档");
    const st = o.state || {};
    const sent = await db.collection(C.gifts).where({ from: uid, day: today() }).count();
    return { friend: pub(o), mood: { full: st.full, drink: st.drink, happy: st.happy, sick: !!st.sick }, decor: st.decor || {}, giftsLeft: Math.max(0, GIFTS_PER_DAY - sent.total) };
  },
  async sendGift(uid, { to, kind }) {
    if (!GIFT_KINDS[kind]) fail("BAD", "礼物不对");
    const id = [uid, String(to)].sort().join("_");
    const ex = await db.collection(C.friends).doc(id).get(); const f = ex.data && ex.data[0];
    if (!f || f.status !== "ok") fail("NOTFRIEND", "还不是好友");
    const sent = await db.collection(C.gifts).where({ from: uid, day: today() }).count();
    if (sent.total >= GIFTS_PER_DAY) fail("LIMIT", `今天已经送了 ${GIFTS_PER_DAY} 次啦`);
    const p = await me(uid);
    await db.collection(C.gifts).add({ from: uid, fromNick: p ? p.nick : "好友", fromCat: p ? p.catName : "", to: String(to), kind, day: today(), at: now(), claimed: false });
    return { ok: true, left: GIFTS_PER_DAY - sent.total - 1 };
  },
  async claimGifts(uid) {
    const r = await db.collection(C.gifts).where({ to: uid, claimed: false }).limit(50).get();
    if (r.data.length) await db.collection(C.gifts).where({ to: uid, claimed: false }).update({ claimed: true, claimedAt: now() });
    return { gifts: r.data.map(g => ({ kind: g.kind, name: GIFT_KINDS[g.kind], fromNick: g.fromNick, fromCat: g.fromCat })) };
  },

  /* admin */
  async adminStats(uid) {
    if (!ADMINS.includes(uid)) fail("DENY", "没有管理员权限");
    const total = await db.collection(C.players).count();
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() + 8 * 3600e3 - i * 864e5).toISOString().slice(0, 10);
      const c = await db.collection(C.daily).where({ day: d }).count();
      const n = await db.collection(C.players).where({ createdAt: _.gte(Date.parse(d + "T00:00:00+08:00")).and(_.lt(Date.parse(d + "T00:00:00+08:00") + 864e5)) }).count();
      days.push({ day: d, active: c.total, newUsers: n.total });
    }
    const recent = await db.collection(C.players).orderBy("lastActive", "desc").limit(30).get();
    const breeds = {};
    (await db.collection(C.players).field({ breed: true }).limit(1000).get()).data.forEach(p => breeds[p.breed] = (breeds[p.breed] || 0) + 1);
    return { total: total.total, days, breeds, recent: recent.data.map(p => ({ ...pub(p), createdAt: p.createdAt })) };
  },
  async adminFind(uid, { q }) {
    if (!ADMINS.includes(uid)) fail("DENY", "没有管理员权限");
    q = clean(q, 20);
    const r = await db.collection(C.players).where(_.or([{ nick: db.RegExp({ regexp: q, options: "i" }) }, { friendCode: q.toUpperCase() }, { _id: q }])).limit(30).get();
    return { users: r.data.map(p => ({ ...pub(p), createdAt: p.createdAt })) };
  },
  async whoami(uid) { return { uid, admin: ADMINS.includes(uid) }; },
};

/* Sign in with Apple → CloudBase custom-login ticket (needs the env's custom login key) */
function getJSON(url) {
  return new Promise((res, rej) => https.get(url, r => { let b = ""; r.on("data", c => b += c); r.on("end", () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on("error", rej));
}
async function appleTicket({ identityToken }) {
  if (!customKey) fail("NOAPPLE", "Apple 登录还没配置");
  const [h, p, s] = String(identityToken || "").split(".");
  if (!s) fail("BAD", "Apple 凭证不对");
  const head = JSON.parse(Buffer.from(h, "base64url")), body = JSON.parse(Buffer.from(p, "base64url"));
  const keys = await getJSON("https://appleid.apple.com/auth/keys");
  const jwk = keys.keys.find(k => k.kid === head.kid); if (!jwk) fail("BAD", "Apple 凭证不对");
  const ok = crypto.verify("RSA-SHA256", Buffer.from(h + "." + p), crypto.createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(s, "base64url"));
  const aud = (process.env.APPLE_AUDIENCE || "io.github.shizhongzhou.maomao").split(",");
  if (!ok || body.iss !== "https://appleid.apple.com" || !aud.includes(body.aud) || body.exp * 1000 < Date.now()) fail("BAD", "Apple 凭证无效");
  const ticket = app.auth().createTicket("apple_" + body.sub.replace(/[^A-Za-z0-9]/g, "").slice(0, 40), { refresh: 3600 * 1000 });
  return { ticket };
}

exports.main = async (event) => {
  const action = event && event.action;
  try {
    await ensureCollections();
    if (action === "appleTicket") return { ok: true, data: await appleTicket(event.data || {}) };
    const { uid } = app.auth().getUserInfo() || {};
    if (!uid) fail("AUTH", "请先登录");
    if (!A[action]) fail("BAD", "未知操作");
    return { ok: true, data: await A[action](uid, event.data || {}) };
  } catch (e) {
    return { ok: false, code: e.code || "ERR", msg: e.code ? e.message : "服务器开小差了，稍后再试" , detail: e.code ? undefined : String(e && e.message || e).slice(0, 200) };
  }
};

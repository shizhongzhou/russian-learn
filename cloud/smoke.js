// Smoke test after deploy: open the app from localhost (an allowed origin), let it sign in as a guest,
// then call the cloud function. Prints GitHub annotations so the result is visible without logs.
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const logs = [];
  p.on("console", m => { if (/cloud|error/i.test(m.text())) logs.push(m.text().slice(0, 200)); });
  p.on("pageerror", e => logs.push("pageerror " + e.message.slice(0, 200)));
  await p.addInitScript(() => {
    localStorage.setItem("mm_pet_v1", JSON.stringify({ profile: { nick: "冒烟测试", created: Date.now() }, cat: { breed: "orange", name: "测试猫" }, growth: 10, lastStudy: Date.now(), lastTick: Date.now() }));
    localStorage.setItem("introDay", JSON.stringify(new Date().toDateString()));
  });
  await p.goto("http://localhost:8080/index.html#/account");
  const out = await p.evaluate(async () => {
    const r = {};
    try { r.ready = await Promise.race([Cloud.ready(), new Promise(res => setTimeout(() => res("timeout"), 30000))]); } catch (e) { r.ready = "ERR " + e.message; }
    r.user = Cloud.user() ? { id: Cloud.user().id, anon: Cloud.user().is_anonymous } : null;
    for (const a of ["whoami", "load"]) { try { r[a] = await Cloud.call(a); } catch (e) { r[a] = "ERR " + (e.code || "") + " " + e.message; } }
    try { await Cloud.push(true); r.push = Cloud.status(); } catch (e) { r.push = "ERR " + e.message; }
    try { r.board = (await Cloud.call("leaderboard", { by: "growth" })).top.length; } catch (e) { r.board = "ERR " + e.message; }
    return r;
  });
  const line = JSON.stringify(out);
  console.log(line); logs.forEach(l => console.log("::warning::" + l));
  const ok = out.ready === true && out.whoami && !String(out.whoami).startsWith("ERR");
  console.log((ok ? "::notice::CLOUD OK " : "::error::CLOUD FAIL ") + line.slice(0, 900));
  await b.close(); process.exit(ok ? 0 : 1);
})();

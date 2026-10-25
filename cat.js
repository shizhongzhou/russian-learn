"use strict";
/* ========== 猫猫俄语通 — cats (front + side view), room scenes, meows ========== */

/* Each breed: colours + pattern flags.
   cap/maskL/maskR: head-top and eye-patch colours (null = none); blaze: stripe between the eyes;
   muzzle: lower-face colour (null = base); stripes/points/patches/shade/mane/ears/face: pattern features. */
const W_ = "#FBF8F4";
const BREEDS = {
  ragdoll:  { name: "布偶猫", short: "布偶", desc: "灰白长毛、蓝眼睛，温柔黏人", base: W_, body: "#9A9CA4", cap: "#767982", maskL: "#7F828B", maskR: "#7F828B", blaze: W_, chest: W_, paw: W_, ear: "#6A6D76", tail: "#7F828B", tailTip: W_, iris: ["#3D6FB0", "#3D6FB0"], nose: "#F49AA4", fur: "long" },
  bluewhite:{ name: "蓝白", short: "蓝白", desc: "灰蓝长毛、白围脖、窄窄的白鼻梁，就像你家那只", base: "#FFFFFF", body: "#7F8895", cap: "#7A8390", maskL: "#7A8390", maskR: "#7A8390", blaze: "#FFFFFF", blazeThin: true, muzzle: "#FFFFFF", chest: "#FFFFFF", paw: "#FFFFFF", ear: "#6F7885", tail: "#7F8895", tailTip: "#8E97A3", iris: ["#4A3426", "#4A3426"], nose: "#F2A3AE", fur: "long", whisker: "#E8ECF0" },
  british:  { name: "蓝猫", short: "蓝猫", desc: "英短蓝猫，铜色眼睛，稳重安静", base: "#A0ACB7", body: "#97A3AF", cap: "#909DAA", chest: "#AAB5C0", paw: "#A0ACB7", ear: "#87949F", tail: "#909DAA", tailTip: "#909DAA", iris: ["#E09235", "#E09235"], nose: "#7C8796", whisker: "#E7EBEF" },
  lion:     { name: "狮子猫", short: "狮子", desc: "雪白长毛大围脖，一蓝一黄鸳鸯眼", base: "#FFFDF9", body: "#FBF7F1", chest: "#FFFFFF", paw: "#FFFDF9", ear: "#F3ECE3", tail: "#F6F0E8", tailTip: "#FFFFFF", iris: ["#5B8FD9", "#E3B23C"], nose: "#F2A0A8", fur: "long", mane: "#F1EAE0", whisker: "#D8D0C6" },
  orange:   { name: "橘猫", short: "橘猫", desc: "能吃能睡，长胖最快", base: "#F4B572", body: "#F0A961", stripes: "#D9822F", muzzle: "#FCEBD6", chest: "#FCEBD6", paw: "#FCEBD6", ear: "#E0913F", tail: "#E8993F", tailTip: "#FCEBD6", iris: ["#C9A13A", "#C9A13A"], nose: "#EE8C93", whisker: "#9B7454" },
  lihua:    { name: "狸花猫", short: "狸花", desc: "中华田园猫，虎斑纹，聪明独立", base: "#A89277", body: "#9E876B", stripes: "#4B3B2C", muzzle: "#E9DFD0", chest: "#DCCDB7", paw: "#C9B79D", ear: "#8C755B", tail: "#9E876B", tailTip: "#3B2E22", iris: ["#93B84A", "#93B84A"], nose: "#C98D82", whisker: "#5A4A3C" },
  amshort:  { name: "美短", short: "美短", desc: "银色虎斑，活泼好动", base: "#D3D6DA", body: "#C9CCD1", stripes: "#3D3F44", muzzle: "#EEEFF1", chest: "#E3E5E8", paw: "#D9DBDE", ear: "#B9BDC3", tail: "#C9CCD1", tailTip: "#2F3135", iris: ["#7DAA4A", "#7DAA4A"], nose: "#D99A98", whisker: "#6A6D72" },
  siamese:  { name: "暹罗猫", short: "暹罗", desc: "奶油色身体、深色脸和脚，话很多", base: "#F4EADC", body: "#EFE3D2", points: "#5A4033", chest: "#F7EFE4", paw: "#5A4033", ear: "#5A4033", tail: "#5A4033", tailTip: "#4A3328", iris: ["#4F8FD9", "#4F8FD9"], nose: "#4A3328", whisker: "#D8CDBF" },
  cow:      { name: "奶牛猫", short: "奶牛", desc: "黑白花，像一头小奶牛", base: "#FFFFFF", body: "#FFFFFF", cap: "#2F2A2C", maskL: "#2F2A2C", maskR: null, blaze: "#FFFFFF", chest: "#FFFFFF", paw: "#FFFFFF", ear: "#2F2A2C", tail: "#2F2A2C", tailTip: "#FFFFFF", iris: ["#C9B03A", "#C9B03A"], nose: "#F2A0A8", patches: [[70, 150, 22, 16, "#2F2A2C"], [128, 162, 16, 12, "#2F2A2C"]], whisker: "#BDB5B7" },
  tuxedo:   { name: "燕尾服猫", short: "燕尾服", desc: "黑西装、白衬衫、白手套", base: "#2F2A2C", body: "#2F2A2C", cap: "#2A2527", blaze: "#FFFFFF", blazeThin: true, muzzle: "#FFFFFF", chest: "#FFFFFF", paw: "#FFFFFF", ear: "#262123", tail: "#2A2527", tailTip: "#2A2527", iris: ["#E6C34A", "#E6C34A"], nose: "#F2A0A8", whisker: "#D8D2D4" },
  calico:   { name: "三花猫", short: "三花", desc: "白、橘、黑三种花色，机灵", base: "#FCF9F5", body: "#FCF9F5", cap: "#E9A05A", maskL: "#4A4241", maskR: "#E9A05A", blaze: "#FCF9F5", chest: "#FCF9F5", paw: "#FCF9F5", ear: "#4A4241", tail: "#4A4241", tailTip: "#E9A05A", iris: ["#A9B23A", "#A9B23A"], nose: "#F49AA4", patches: [[74, 152, 20, 14, "#E9A05A"], [126, 160, 16, 12, "#4A4241"]], whisker: "#AFA295" },
  tortie:   { name: "玳瑁猫", short: "玳瑁", desc: "黑橘混色，独一无二", base: "#4A3A33", body: "#3E3330", cap: "#3A2C27", maskL: "#C9772E", maskR: null, chest: "#5A463C", paw: "#4A3A33", ear: "#3A2C27", tail: "#3E3330", tailTip: "#C9772E", iris: ["#D9A23A", "#D9A23A"], nose: "#9A6A60", patches: [[80, 148, 14, 10, "#C9772E"], [120, 156, 12, 9, "#B8662A"], [100, 168, 10, 7, "#C9772E"]], whisker: "#C8B8A8" },
  black:    { name: "黑猫", short: "黑猫", desc: "金色眼睛，夜里最有精神", base: "#463F42", body: "#3F393B", cap: "#3B3537", chest: "#4E4649", paw: "#463F42", ear: "#353031", tail: "#3B3537", tailTip: "#3B3537", iris: ["#E8C64A", "#E8C64A"], nose: "#9A7378", whisker: "#C8C0C2" },
  white:    { name: "白猫", short: "白猫", desc: "一身雪白，安静优雅", base: "#FFFFFF", body: "#FAF8F5", chest: "#FFFFFF", paw: "#FFFFFF", ear: "#F2EEE9", tail: "#F6F2EE", tailTip: "#FFFFFF", iris: ["#7FB6E6", "#7FB6E6"], nose: "#F2A0A8", whisker: "#D8D0C6" },
  golden:   { name: "金渐层", short: "金渐层", desc: "金色渐变毛，绿眼睛", base: "#F4DCB0", body: "#EFD1A0", shade: "#C9944F", chest: "#FBF0DE", paw: "#F4DCB0", ear: "#C9944F", tail: "#D9A867", tailTip: "#A9743A", iris: ["#6FAE6A", "#6FAE6A"], nose: "#E8907E", fur: "long", liner: true },
  silver:   { name: "银渐层", short: "银渐层", desc: "银白渐变毛，像穿了纱衣", base: "#F3F3F2", body: "#ECECEB", shade: "#A3A4AA", chest: "#FFFFFF", paw: "#F3F3F2", ear: "#A3A4AA", tail: "#C9CACE", tailTip: "#7F8086", iris: ["#5FA36A", "#5FA36A"], nose: "#E8A0A0", fur: "long", liner: true },
  fold:     { name: "折耳猫", short: "折耳", desc: "小耳朵折下来，圆滚滚", base: "#C9C0B5", body: "#BDB3A7", cap: "#B3A898", chest: "#E3DCD2", paw: "#D3CBC0", ear: "#B3A898", tail: "#B3A898", tailTip: "#B3A898", iris: ["#D98A2B", "#D98A2B"], nose: "#C99A94", ears: "fold" },
  maine:    { name: "缅因猫", short: "缅因", desc: "大个子，耳尖有簇毛，温柔巨人", base: "#957559", body: "#8B6B4E", stripes: "#3E2C1F", muzzle: "#E8DCCB", chest: "#E8DCCB", paw: "#D9C8B2", ear: "#7A5B40", tail: "#8B6B4E", tailTip: "#3E2C1F", iris: ["#C9A23A", "#C9A23A"], nose: "#B07A6E", fur: "long", ears: "tuft", whisker: "#F2E8DA" },
  exotic:   { name: "加菲猫", short: "加菲", desc: "异国短毛，扁扁的小脸", base: "#F2B36E", body: "#ECA862", stripes: "#DB8B3E", muzzle: "#F9DDB8", chest: "#FBE7CC", paw: "#F9DDB8", ear: "#DB8B3E", tail: "#ECA862", tailTip: "#DB8B3E", iris: ["#D9902F", "#D9902F"], nose: "#D9786E", fur: "long", face: "flat" },
};
const BREED_ORDER = Object.keys(BREEDS);
const MOOD_NAMES = { happy: "开心", sad: "想你了", walk: "散步中", cheer: "欢呼", sleep: "睡觉", lie: "趴着发呆", eat: "吃饭中", hungry: "饿了", sick: "生病了" };
let _uid = 0;

function shadeHex(hex, k) { // k<1 darker, >1 lighter
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1))));
  return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}

/* ---------- front view (sitting) ---------- */
function catSVG({ breed = "ragdoll", stage = 2, mood = "happy", size = 120, label = "" } = {}) {
  const c = BREEDS[breed] || BREEDS.ragdoll;
  const id = "c" + (++_uid);
  stage = Math.max(1, Math.min(4, stage | 0 || 1));
  const hungry = mood === "hungry", sick = mood === "sick";
  const long = c.fur === "long";
  const bodyRx = 27 + stage * 7.5 - (hungry ? 9 : 0), bodyRy = 25 + stage * 3, bodyCy = 186 - bodyRy + 6;
  const headRx = 63 + stage * 1.2, headCy = 96, headRy = 58, L = 100 - headRx, R = 100 + headRx;
  const whisker = c.whisker || "#CFC8C0";
  const fill = (col, g) => c.shade && g ? `url(#${id}${g})` : col;
  // fluffy bib
  let bib = `M${100 - bodyRx * 0.62} ${bodyCy - bodyRy * 0.6}`;
  const n = long ? 8 : 6;
  for (let i = 0; i < n; i++) {
    const x0 = 100 - bodyRx * 0.62 + bodyRx * 1.24 * (i / n), x1 = 100 - bodyRx * 0.62 + bodyRx * 1.24 * ((i + 1) / n);
    bib += ` Q${(x0 + x1) / 2} ${bodyCy - bodyRy * 0.6 + (i % 2 ? (long ? 14 : 9) : 5)} ${x1} ${bodyCy - bodyRy * 0.6}`;
  }
  bib += ` Q${100 + bodyRx * 0.58} ${bodyCy + bodyRy * 0.7} 100 ${bodyCy + bodyRy * 0.78} Q${100 - bodyRx * 0.58} ${bodyCy + bodyRy * 0.7} ${100 - bodyRx * 0.62} ${bodyCy - bodyRy * 0.6} Z`;
  // cheek fluff: more spikes for long hair
  const f = (long ? 9 : 4) + stage * 2;
  const cheek = long
    ? `M${L + 10} 96 L${L - f} 106 L${L + 2} 110 L${L - f + 2} 120 L${L + 4} 122 L${L - f + 6} 132 L${L + 22} 130 Z M${R - 10} 96 L${R + f} 106 L${R - 2} 110 L${R + f - 2} 120 L${R - 4} 122 L${R + f - 6} 132 L${R - 22} 130 Z`
    : `M${L + 8} 100 L${L - f} 112 L${L + 4} 114 L${L - f + 2} 126 L${L + 18} 126 Z M${R - 8} 100 L${R + f} 112 L${R - 4} 114 L${R + f - 2} 126 L${R - 18} 126 Z`;
  const cap = `M${L + 2} 92 Q100 -12 ${R - 2} 92 Q124 74 110 80 L100 74 L90 80 Q76 74 ${L + 2} 92 Z`;
  const tx = 100 + bodyRx - 6;
  const tail = `M${tx} 178 Q${tx + 36} 172 ${tx + 28} 136 Q${tx + 22} 118 ${tx + 34} 112`;
  const pawL = 100 - bodyRx * 0.42, pawR = 100 + bodyRx * 0.42;
  const sad = mood === "sad";
  const open = mood === "walk" || mood === "happy" || hungry || sad;
  const flat = c.face === "flat";
  const eyeRx = flat ? 16 : 15, eyeRy = flat ? 17.5 : 17, eyeY = flat ? 102 : 104;
  const eyeLine = sick ? "M62 106 Q74 112 86 106 M114 106 Q126 112 138 106"
    : mood === "sleep" ? "M62 104 Q74 114 86 104 M114 104 Q126 114 138 104"
    : "M62 108 Q74 94 86 108 M114 108 Q126 94 138 108";
  const noseY = flat ? 114 : 119;
  const mouth = mood === "eat" ? `M92 ${noseY + 8} Q100 ${noseY + 16} 108 ${noseY + 8}` : mood === "cheer" ? `M90 ${noseY + 8} Q100 ${noseY + 24} 110 ${noseY + 8} Q100 ${noseY + 12} 90 ${noseY + 8} Z`
    : (sick || hungry || sad) ? `M92 ${noseY + 12} Q100 ${noseY + 8} 108 ${noseY + 12}` : `M88 ${noseY + 7} Q94 ${noseY + 14} 100 ${noseY + 7} Q106 ${noseY + 14} 112 ${noseY + 7}`;
  const blush = (sick || hungry) ? 0.15 : 0.4 + stage * 0.12;
  const star = "l2 -4 l2 4 l4 1 l-4 1 l-2 4 l-2 -4 l-4 -1 Z";
  const deco = !sick && !hungry;
  // ears
  const earOuter = c.ears === "fold"
    ? `M52 66 Q50 44 70 42 Q84 44 82 54 Q70 52 60 64 Z M148 66 Q150 44 130 42 Q116 44 118 54 Q130 52 140 64 Z`
    : `M46 70 Q38 24 52 20 Q66 22 88 46 Z M154 70 Q162 24 148 20 Q134 22 112 46 Z`;
  const earInner = c.ears === "fold" ? "" : `<path d="M54 58 Q50 34 56 32 Q64 34 78 48 Z M146 58 Q150 34 144 32 Q136 34 122 48 Z" fill="${c.points ? shadeHex(c.points, 1.6) : "#F7B9BC"}"/>`;
  const tufts = c.ears === "tuft" ? `<path d="M52 22 L47 2 L58 19 Z M148 22 L153 2 L142 19 Z" fill="${c.ear}"/>` : "";
  const earFluff = long ? `<path d="M58 46 l6 10 M62 42 l8 10 M142 46 l-6 10 M138 42 l-8 10" stroke="${c.chest}" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>` : "";
  // mane (lion)
  let mane = "";
  if (c.mane) {
    let d = ""; const N = 22;
    for (let i = 0; i <= N * 2; i++) {
      const a = (i / (N * 2)) * Math.PI * 2, r = i % 2 ? 70 + stage : 82 + stage * 2;
      d += (i ? " L" : "M") + (100 + Math.cos(a) * r * 1.05).toFixed(1) + " " + (112 + Math.sin(a) * r * 0.86).toFixed(1);
    }
    mane = `<path d="${d} Z" fill="${c.mane}"/>`;
  }
  // tabby stripes
  const st = c.stripes ? `<g stroke="${c.stripes}" stroke-linecap="round" fill="none">
    <path d="M86 52 Q90 62 92 72 M100 44 V68 M114 52 Q110 62 108 72" stroke-width="4"/>
    <path d="M${L + 4} 100 h12 M${L + 2} 110 h12 M${R - 4} 100 h-12 M${R - 2} 110 h-12" stroke-width="3.5"/></g>` : "";
  const bodyStripes = c.stripes ? `<g stroke="${c.stripes}" stroke-width="5" stroke-linecap="round" fill="none" clip-path="url(#${id}b)">
    ${[0, 1, 2].map(i => `<path d="M${100 - bodyRx - 2} ${bodyCy - 12 + i * 13} q12 -2 16 6 M${100 + bodyRx + 2} ${bodyCy - 12 + i * 13} q-12 -2 -16 6"/>`).join("")}</g>` : "";
  const tailRings = c.stripes ? `<path d="${tail}" fill="none" stroke="${c.stripes}" stroke-width="${long ? 19 : 15}" stroke-dasharray="5 9" stroke-linecap="butt" opacity=".85"/>` : "";
  const patches = (c.patches || []).map(([x, y, rx, ry, col]) => `<ellipse cx="${x}" cy="${y + (bodyCy - 160) * 0.6}" rx="${rx * (0.8 + stage * 0.08)}" ry="${ry}" fill="${col}"/>`).join("");
  const points = c.points ? `<ellipse cx="100" cy="108" rx="34" ry="28" fill="url(#${id}p)"/>` : "";
  const liner = c.liner ? `<path d="M60 104 Q74 88 88 104 M112 104 Q126 88 140 104" fill="none" stroke="${shadeHex(c.shade, 0.6)}" stroke-width="2.2" opacity=".55"/>` : "";
  const muzzle = c.muzzle ? `<path d="M76 114 Q100 100 124 114 Q132 136 100 146 Q68 136 76 114 Z" fill="${c.muzzle}"/>` : "";
  const blaze = c.blaze ? (c.blazeThin ? `<path d="M100 66 L94 112 Q100 117 106 112 Z" fill="${c.blaze}"/>` : `<path d="M100 76 L88 118 Q100 128 112 118 Z" fill="${c.blaze}"/>`) : "";
  const aria = label || `${c.name}，${MOOD_NAMES[mood] || ""}`;
  return `<svg class="cat-svg" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="${aria}"${sick ? ' style="filter:saturate(.35) brightness(1.04)"' : ""}>
<defs>
<radialGradient id="${id}h" cx=".38" cy=".28" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".10"/></radialGradient>
<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.shade || c.base}"/><stop offset=".6" stop-color="${c.base}"/></linearGradient>
<linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.shade || c.body}"/><stop offset=".7" stop-color="${c.body}"/></linearGradient>
<radialGradient id="${id}p"><stop offset="0" stop-color="${c.points || "#000"}" stop-opacity=".95"/><stop offset=".6" stop-color="${c.points || "#000"}" stop-opacity=".7"/><stop offset="1" stop-color="${c.points || "#000"}" stop-opacity="0"/></radialGradient>
<clipPath id="${id}b"><ellipse cx="100" cy="${bodyCy}" rx="${bodyRx}" ry="${bodyRy}"/></clipPath>
<clipPath id="${id}k"><ellipse cx="100" cy="${headCy}" rx="${headRx}" ry="${headRy}"/></clipPath>
</defs>
<ellipse cx="100" cy="193" rx="${bodyRx + 20}" ry="6" fill="#000" opacity=".1"/>
${mane}
<path d="${tail}" fill="none" stroke="${c.tail}" stroke-width="${long ? 19 : 15}" stroke-linecap="round"/>${tailRings}<circle cx="${tx + 34}" cy="112" r="${long ? 11 : 9}" fill="${c.tailTip}"/>
<ellipse cx="100" cy="${bodyCy}" rx="${bodyRx}" ry="${bodyRy}" fill="${fill(c.body, "t")}"/>
${bodyStripes}<g clip-path="url(#${id}b)">${patches}</g>
<path d="${bib}" fill="${c.chest}"/>
<ellipse cx="${pawL}" cy="186" rx="14" ry="10" fill="${c.paw}"/><ellipse cx="${pawR}" cy="186" rx="14" ry="10" fill="${c.paw}"/>
<path d="M${pawL - 4} 191 v-4 M${pawL + 4} 191 v-4 M${pawR - 4} 191 v-4 M${pawR + 4} 191 v-4" stroke="${shadeHex(c.paw, 0.82)}" stroke-width="1.6" stroke-linecap="round"/>
${stage >= 2 ? `<path d="M70 ${bodyCy - bodyRy + 6} Q100 ${bodyCy - bodyRy + 18} 130 ${bodyCy - bodyRy + 6}" fill="none" stroke="#D9534F" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="${bodyCy - bodyRy + 17}" r="7.5" fill="#F2C14E" stroke="#C9952A" stroke-width="1.5"/><path d="M96 ${bodyCy - bodyRy + 18} H104 M100 ${bodyCy - bodyRy + 18} V${bodyCy - bodyRy + 22}" stroke="#9A6D12" stroke-width="1.5" stroke-linecap="round"/>` : ""}
<path d="${earOuter}" fill="${c.ear}"/>${earInner}${tufts}${earFluff}
<path d="${cheek}" fill="${fill(c.base, "s")}"/>
<ellipse cx="100" cy="${headCy}" rx="${headRx}" ry="${headRy}" fill="${fill(c.base, "s")}"/>
<g clip-path="url(#${id}k)">
${c.cap ? `<path d="${cap}" fill="${c.cap}"/>` : ""}
${c.maskL ? `<ellipse cx="72" cy="102" rx="24" ry="22" fill="${c.maskL}" transform="rotate(-14 72 102)"/>` : ""}${c.maskR ? `<ellipse cx="128" cy="102" rx="24" ry="22" fill="${c.maskR}" transform="rotate(14 128 102)"/>` : ""}
${blaze}${muzzle}${points}${st}
<ellipse cx="100" cy="${headCy}" rx="${headRx}" ry="${headRy}" fill="url(#${id}h)"/>
</g>
<path d="M96 42 Q100 30 106 34 Q101 38 100 46 Z" fill="${c.cap || c.base}"/>
${liner}
${open ? `<ellipse cx="74" cy="${eyeY}" rx="${eyeRx}" ry="${eyeRy}" fill="${c.iris[0]}"/><ellipse cx="126" cy="${eyeY}" rx="${eyeRx}" ry="${eyeRy}" fill="${c.iris[1]}"/>
<ellipse cx="74" cy="${eyeY + 2}" rx="${eyeRx - 3.5}" ry="${eyeRy - 3}" fill="#1B1718"/><ellipse cx="126" cy="${eyeY + 2}" rx="${eyeRx - 3.5}" ry="${eyeRy - 3}" fill="#1B1718"/>
<ellipse cx="79" cy="${eyeY - 6}" rx="6" ry="6.5" fill="#fff"/><ellipse cx="131" cy="${eyeY - 6}" rx="6" ry="6.5" fill="#fff"/><circle cx="69" cy="${eyeY + 8}" r="3" fill="#fff"/><circle cx="121" cy="${eyeY + 8}" r="3" fill="#fff"/><circle cx="82" cy="${eyeY + 4}" r="1.6" fill="#fff" opacity=".8"/><circle cx="134" cy="${eyeY + 4}" r="1.6" fill="#fff" opacity=".8"/>
${stage >= 3 && deco ? `<path d="M66 ${eyeY - 11} ${star}" fill="#fff"/><path d="M118 ${eyeY - 11} ${star}" fill="#fff"/>` : ""}`
    : `<path d="${eyeLine}" fill="none" stroke="#1B1718" stroke-width="4.5" stroke-linecap="round"/>`}
<path d="M96 ${noseY} Q100 ${noseY - 3} 104 ${noseY} Q102 ${noseY + 4} 100 ${noseY + 5} Q98 ${noseY + 4} 96 ${noseY} Z" fill="${c.nose}"/>
<path d="${mouth}" fill="${mood === "cheer" ? "#E76F7C" : "none"}" stroke="${c.base === "#2F2A2C" || c.base === "#463F42" ? "#C8BFC2" : "#5A4A48"}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
<ellipse cx="58" cy="125" rx="12" ry="7" fill="#F59AA0" opacity="${blush}"/><ellipse cx="142" cy="125" rx="12" ry="7" fill="#F59AA0" opacity="${blush}"/>
<path d="M44 118 L24 113 M44 124 L24 127 M156 118 L176 113 M156 124 L176 127" stroke="${whisker}" stroke-width="1.6" stroke-linecap="round"/>
${stage >= 3 && deco ? `<path d="M136 40 L122 30 Q118 40 122 50 Z M136 40 L150 30 Q154 40 150 50 Z" fill="#F07C9A"/><circle cx="136" cy="40" r="4.5" fill="#D9557A"/>` : ""}
${stage >= 4 && deco ? `<circle cx="72" cy="46" r="6" fill="#fff"/><circle cx="72" cy="46" r="2.6" fill="#F2C14E"/><circle cx="86" cy="40" r="6" fill="#F7A8C4"/><circle cx="86" cy="40" r="2.6" fill="#fff"/><circle cx="100" cy="38" r="6.5" fill="#A8C8F0"/><circle cx="100" cy="38" r="2.8" fill="#fff"/><circle cx="114" cy="40" r="6" fill="#FFE08A"/><circle cx="114" cy="40" r="2.6" fill="#F28C5A"/><path d="M64 50 q4 -4 8 0 M106 34 q4 -4 8 0" stroke="#6DB36D" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M28 70 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z M170 60 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z" fill="#F2C14E"/>` : ""}
${mood === "eat" || hungry ? `<path d="M62 178 H138 Q134 198 100 198 Q66 198 62 178 Z" fill="#D9534F"/><ellipse cx="100" cy="178" rx="38" ry="7" fill="#B8433F"/>${mood === "eat" ? `<circle cx="86" cy="175" r="5" fill="#C9874A"/><circle cx="98" cy="173" r="5" fill="#B87A40"/><circle cx="110" cy="175" r="5" fill="#C9874A"/><circle cx="104" cy="170" r="4.5" fill="#D59658"/>` : ""}` : ""}
${sad ? `<path d="M62 ${eyeY + 16} q-4 8 0 12 q4 -4 0 -12 Z" fill="#8EC5EC"/><path d="M60 ${eyeY - 15} Q70 ${eyeY - 19} 82 ${eyeY - 23} M140 ${eyeY - 15} Q130 ${eyeY - 19} 118 ${eyeY - 23}" fill="none" stroke="#5A4A48" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>` : ""}
${hungry ? `<path d="M160 74 Q166 84 160 90 Q154 84 160 74 Z" fill="#7FB3D9"/><text x="146" y="150" font-size="18" font-family="sans-serif" font-weight="700" fill="#9A4A12">咕～</text><path d="M60 ${eyeY - 15} Q70 ${eyeY - 19} 82 ${eyeY - 23} M140 ${eyeY - 15} Q130 ${eyeY - 19} 118 ${eyeY - 23}" fill="none" stroke="#5A4A48" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>` : ""}
${sick ? `<rect x="110" y="120" width="30" height="7" rx="3.5" fill="#fff" stroke="#5A6B7A" stroke-width="1.5" transform="rotate(20 110 120)"/><circle cx="138" cy="132" r="4.5" fill="#D94A3D"/><path d="M162 70 Q168 80 162 86 Q156 80 162 70 Z" fill="#7FB3D9"/><rect x="72" y="52" width="56" height="14" rx="5" fill="#fff" stroke="#A9C4DA" stroke-width="1.5"/>` : ""}
${mood === "sleep" ? `<g fill="#6B7A8A" font-family="sans-serif" font-weight="700"><text x="158" y="48" font-size="22">z</text><text x="176" y="30" font-size="16">z</text></g>` : ""}
${mood === "cheer" ? `<g fill="#F07C9A"><path d="M30 44 c-4 -6 -12 -2 -8 4 l8 8 l8 -8 c4 -6 -4 -10 -8 -4 Z"/><path d="M172 56 c-3 -5 -10 -2 -7 3 l7 7 l7 -7 c3 -5 -4 -8 -7 -3 Z"/></g>` : ""}
</svg>`;
}

/* ---------- side view (walking / running / jumping), facing right ---------- */
function catSideSVG({ breed = "ragdoll", stage = 2, size = 120, label = "", eat = false } = {}) {
  const c = BREEDS[breed] || BREEDS.ragdoll;
  const id = "s" + (++_uid);
  stage = Math.max(1, Math.min(4, stage | 0 || 1));
  const long = c.fur === "long";
  const brx = 46 + stage * 5, bry = 26 + stage * 2.5, bcx = 104, bcy = 98;
  const far = shadeHex(c.body, 0.86), farPaw = shadeHex(c.paw, 0.86);
  const legC = c.points ? c.points : c.body;
  const leg = (x, cls, col, paw) => `<g class="leg ${cls}"><rect x="${x - 8}" y="${bcy}" width="16" height="${54 - stage * 2}" rx="8" fill="${col}"/><ellipse cx="${x + 2}" cy="${bcy + 54 - stage * 2}" rx="10.5" ry="7" fill="${paw}"/></g>`;
  const hx = bcx + brx - 6, hy = 70;
  const tailD = `M${bcx - brx + 10} ${bcy - 8} Q${bcx - brx - 26} ${bcy - 16} ${bcx - brx - 20} ${bcy - 56} Q${bcx - brx - 16} ${bcy - 74} ${bcx - brx - 2} ${bcy - 70}`;
  const stripes = c.stripes ? `<g stroke="${c.stripes}" stroke-width="5" stroke-linecap="round" fill="none" clip-path="url(#${id}b)">${[0, 1, 2, 3].map(i => `<path d="M${bcx - brx + 18 + i * 20} ${bcy - bry} q6 14 0 24"/>`).join("")}</g>` : "";
  const patches = (c.patches || []).map(([x, y, rx, ry, col], i) => `<ellipse cx="${bcx - 22 + i * 30}" cy="${bcy - 6 + i * 4}" rx="${rx}" ry="${ry}" fill="${col}"/>`).join("");
  const capCol = c.cap || (c.points ? null : null);
  return `<svg class="cat-side" width="${size}" height="${size * 0.75}" viewBox="0 0 240 180" role="img" aria-label="${label || c.name + "，走路中"}">
<defs><clipPath id="${id}b"><ellipse cx="${bcx}" cy="${bcy}" rx="${brx}" ry="${bry}"/></clipPath>
<radialGradient id="${id}h" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></radialGradient>
<radialGradient id="${id}p"><stop offset="0" stop-color="${c.points || "#000"}" stop-opacity=".95"/><stop offset="1" stop-color="${c.points || "#000"}" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="${bcx + 10}" cy="${bcy + 60 - stage * 2}" rx="${brx + 24}" ry="6" fill="#000" opacity=".1"/>
<g class="tail" style="transform-origin:${bcx - brx + 10}px ${bcy - 8}px"><path d="${tailD}" fill="none" stroke="${c.tail}" stroke-width="${long ? 18 : 14}" stroke-linecap="round"/>
${c.stripes ? `<path d="${tailD}" fill="none" stroke="${c.stripes}" stroke-width="${long ? 18 : 14}" stroke-dasharray="5 9" opacity=".85"/>` : ""}<circle cx="${bcx - brx - 2}" cy="${bcy - 70}" r="${long ? 10 : 8}" fill="${c.tailTip}"/></g>
${leg(bcx - brx + 20, "lb far", c.points ? shadeHex(c.points, 0.85) : far, c.points ? shadeHex(c.points, 0.85) : farPaw)}${leg(bcx + brx - 22, "la far", c.points ? shadeHex(c.points, 0.85) : far, c.points ? shadeHex(c.points, 0.85) : farPaw)}
<g class="bodyg">
<ellipse cx="${bcx}" cy="${bcy}" rx="${brx}" ry="${bry}" fill="${c.body}"/>
${c.cap && !c.stripes ? `<path d="M${bcx - brx} ${bcy} Q${bcx} ${bcy - bry * 2.1} ${bcx + brx} ${bcy - 4} Q${bcx} ${bcy - 8} ${bcx - brx} ${bcy} Z" fill="${c.cap}" clip-path="url(#${id}b)"/>` : ""}
${stripes}<g clip-path="url(#${id}b)">${patches}</g>
<ellipse cx="${bcx + brx * 0.35}" cy="${bcy + bry * 0.45}" rx="${brx * 0.55}" ry="${bry * 0.55}" fill="${c.chest}" opacity="${c.chest === c.body ? 0 : 1}"/>
${long ? `<path d="M${bcx + brx * 0.2} ${bcy + bry * 0.8} l5 8 l5 -6 l5 8 l5 -6 l5 7 l5 -8" fill="${c.chest}"/>` : ""}
</g>
${leg(bcx - brx + 30, "la near", legC, c.paw)}${leg(bcx + brx - 12, "lb near", legC, c.paw)}
<g class="headg${eat ? " chewing" : ""}" style="transform-origin:${hx - 30}px ${hy + 34}px">
${c.mane ? `<circle cx="${hx}" cy="${hy + 4}" r="${46 + stage}" fill="${c.mane}"/>` : ""}
<path d="${c.ears === "fold" ? `M${hx - 30} ${hy - 22} Q${hx - 28} ${hy - 40} ${hx - 12} ${hy - 36} Z M${hx + 8} ${hy - 34} Q${hx + 22} ${hy - 42} ${hx + 28} ${hy - 26} Z` : `M${hx - 34} ${hy - 16} Q${hx - 40} ${hy - 58} ${hx - 22} ${hy - 50} Q${hx - 12} ${hy - 44} ${hx - 6} ${hy - 32} Z M${hx + 6} ${hy - 32} Q${hx + 18} ${hy - 58} ${hx + 30} ${hy - 44} Q${hx + 34} ${hy - 30} ${hx + 32} ${hy - 18} Z`}" fill="${c.ear}"/>
${c.ears === "tuft" ? `<path d="M${hx - 36} ${hy - 52} l-3 -13 l8 10 Z M${hx + 21} ${hy - 52} l3 -13 l-8 10 Z" fill="${c.ear}"/>` : ""}
${c.ears === "fold" ? "" : `<path d="M${hx - 30} ${hy - 22} Q${hx - 32} ${hy - 46} ${hx - 22} ${hy - 42} Q${hx - 16} ${hy - 36} ${hx - 12} ${hy - 30} Z M${hx + 12} ${hy - 30} Q${hx + 20} ${hy - 48} ${hx + 26} ${hy - 38} Q${hx + 28} ${hy - 30} ${hx + 26} ${hy - 22} Z" fill="${c.points ? shadeHex(c.points, 1.6) : "#F7B9BC"}"/>`}
<ellipse cx="${hx}" cy="${hy}" rx="${40 + stage}" ry="${35 + stage}" fill="${c.base}"/>
<clipPath id="${id}k"><ellipse cx="${hx}" cy="${hy}" rx="${40 + stage}" ry="${35 + stage}"/></clipPath>
<g clip-path="url(#${id}k)">
${c.cap ? `<path d="M${hx - 44} ${hy + 4} Q${hx} ${hy - 70} ${hx + 44} ${hy + 4} Q${hx + 16} ${hy - 8} ${hx} ${hy - 16} Q${hx - 16} ${hy - 8} ${hx - 44} ${hy + 4} Z" fill="${c.cap}"/>` : ""}
${c.maskL ? `<ellipse cx="${hx - 13}" cy="${hy + 2}" rx="15" ry="13" fill="${c.maskL}"/>` : ""}${c.maskR ? `<ellipse cx="${hx + 15}" cy="${hy + 2}" rx="15" ry="13" fill="${c.maskR}"/>` : ""}
${c.blaze ? `<path d="M${hx + 1} ${hy - 16} L${hx - 6} ${hy + 12} Q${hx + 2} ${hy + 18} ${hx + 9} ${hy + 12} Z" fill="${c.blaze}"/>` : ""}
${c.muzzle ? `<ellipse cx="${hx + 2}" cy="${hy + 18}" rx="20" ry="13" fill="${c.muzzle}"/>` : ""}
${c.points ? `<ellipse cx="${hx + 2}" cy="${hy + 8}" rx="26" ry="22" fill="url(#${id}p)"/>` : ""}
${c.stripes ? `<path d="M${hx - 8} ${hy - 30} l3 12 M${hx + 2} ${hy - 34} v14 M${hx + 12} ${hy - 30} l-3 12" stroke="${c.stripes}" stroke-width="3.5" stroke-linecap="round"/>` : ""}
<ellipse cx="${hx}" cy="${hy}" rx="${40 + stage}" ry="${35 + stage}" fill="url(#${id}h)"/>
</g>
<ellipse cx="${hx - 13}" cy="${hy + 2}" rx="8.5" ry="10" fill="${c.iris[0]}"/><ellipse cx="${hx + 15}" cy="${hy + 2}" rx="8.5" ry="10" fill="${c.iris[1]}"/>
<ellipse cx="${hx - 11}" cy="${hy + 4}" rx="5.5" ry="7" fill="#1B1718"/><ellipse cx="${hx + 17}" cy="${hy + 4}" rx="5.5" ry="7" fill="#1B1718"/>
<circle cx="${hx - 9}" cy="${hy - 1}" r="3" fill="#fff"/><circle cx="${hx + 19}" cy="${hy - 1}" r="3" fill="#fff"/>
<path d="M${hx + 1} ${hy + 13} Q${hx + 4} ${hy + 11} ${hx + 7} ${hy + 13} Q${hx + 5} ${hy + 16} ${hx + 4} ${hy + 17} Q${hx + 3} ${hy + 16} ${hx + 1} ${hy + 13} Z" fill="${c.nose}"/>
<path d="M${hx - 3} ${hy + 20} Q${hx + 1} ${hy + 24} ${hx + 4} ${hy + 19} Q${hx + 7} ${hy + 24} ${hx + 11} ${hy + 20}" fill="none" stroke="${c.base === "#2F2A2C" || c.base === "#463F42" ? "#C8BFC2" : "#5A4A48"}" stroke-width="1.8" stroke-linecap="round"/>
<ellipse cx="${hx - 24}" cy="${hy + 16}" rx="7" ry="4.5" fill="#F59AA0" opacity=".6"/><ellipse cx="${hx + 28}" cy="${hy + 16}" rx="7" ry="4.5" fill="#F59AA0" opacity=".6"/>
<path d="M${hx + 22} ${hy + 14} l20 -4 M${hx + 22} ${hy + 19} l20 2" stroke="${c.whisker || "#CFC8C0"}" stroke-width="1.4" stroke-linecap="round"/>
${stage >= 3 ? `<path d="M${hx + 22} ${hy - 34} l-12 -8 q-3 8 0 15 Z M${hx + 22} ${hy - 34} l12 -8 q3 8 0 15 Z" fill="#F07C9A"/><circle cx="${hx + 22}" cy="${hy - 34}" r="3.5" fill="#D9557A"/>` : ""}
${stage >= 4 ? `<circle cx="${hx - 20}" cy="${hy - 32}" r="5" fill="#fff"/><circle cx="${hx - 8}" cy="${hy - 37}" r="5" fill="#F7A8C4"/><circle cx="${hx + 4}" cy="${hy - 38}" r="5" fill="#A8C8F0"/>` : ""}
</g>
${stage >= 2 ? `<path d="M${hx - 26} ${hy + 28} Q${hx - 18} ${hy + 40} ${hx - 2} ${hy + 36}" fill="none" stroke="#D9534F" stroke-width="6" stroke-linecap="round"/><circle cx="${hx - 12}" cy="${hy + 41}" r="5.5" fill="#F2C14E" stroke="#C9952A" stroke-width="1.2"/>` : ""}
</svg>`;
}


/* ---------- lying down (sleeping loaf), facing right ---------- */
function catLieSVG({ breed = "ragdoll", stage = 2, size = 120, label = "", awake = false } = {}) {
  const c = BREEDS[breed] || BREEDS.ragdoll;
  const id = "l" + (++_uid);
  stage = Math.max(1, Math.min(4, stage | 0 || 1));
  const long = c.fur === "long";
  const bx = 112, by = 112, brx = 62 + stage * 4, bry = 30 + stage * 2;
  const hx = bx + brx - 18, hy = 100, hr = 38 + stage;
  const dark = c.base === "#2F2A2C" || c.base === "#463F42";
  return `<svg class="cat-lie" width="${size}" height="${size * 0.65}" viewBox="0 0 240 156" role="img" aria-label="${label || c.name + (awake ? "，趴着" : "，趴着睡觉")}">
<defs><clipPath id="${id}b"><ellipse cx="${bx}" cy="${by}" rx="${brx}" ry="${bry}"/></clipPath><clipPath id="${id}k"><circle cx="${hx}" cy="${hy}" r="${hr}"/></clipPath>
<radialGradient id="${id}h" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></radialGradient></defs>
<ellipse cx="${bx + 8}" cy="${by + bry + 4}" rx="${brx + 26}" ry="7" fill="#000" opacity=".1"/>
<g class="breath" style="transform-origin:${bx}px ${by + bry}px">
<ellipse cx="${bx}" cy="${by}" rx="${brx}" ry="${bry}" fill="${c.body}"/>
${c.cap && !c.stripes ? `<path d="M${bx - brx} ${by + 4} Q${bx - 10} ${by - bry * 2} ${bx + brx} ${by - 2} Q${bx} ${by - 6} ${bx - brx} ${by + 4} Z" fill="${c.cap}" clip-path="url(#${id}b)"/>` : ""}
${c.stripes ? `<g stroke="${c.stripes}" stroke-width="5" stroke-linecap="round" fill="none" clip-path="url(#${id}b)">${[0, 1, 2, 3].map(i => `<path d="M${bx - brx + 22 + i * 22} ${by - bry} q6 14 0 26"/>`).join("")}</g>` : ""}
<g clip-path="url(#${id}b)">${(c.patches || []).map(([x, y, rx, ry, col], i) => `<ellipse cx="${bx - 26 + i * 30}" cy="${by - 8 + i * 4}" rx="${rx}" ry="${ry}" fill="${col}"/>`).join("")}</g>
<ellipse cx="${bx + brx * 0.3}" cy="${by + bry * 0.55}" rx="${brx * 0.5}" ry="${bry * 0.45}" fill="${c.chest}" opacity="${c.chest === c.body ? 0 : 1}"/>
</g>
<path d="M${bx - brx + 6} ${by + 6} Q${bx - brx - 18} ${by + bry + 6} ${bx - 10} ${by + bry + 6} Q${bx + 40} ${by + bry + 6} ${bx + 56} ${by + bry - 2}" fill="none" stroke="${c.tail}" stroke-width="${long ? 17 : 13}" stroke-linecap="round"/>
${c.stripes ? `<path d="M${bx - brx + 6} ${by + 6} Q${bx - brx - 18} ${by + bry + 6} ${bx - 10} ${by + bry + 6} Q${bx + 40} ${by + bry + 6} ${bx + 56} ${by + bry - 2}" fill="none" stroke="${c.stripes}" stroke-width="${long ? 17 : 13}" stroke-dasharray="5 9" opacity=".85"/>` : ""}
<circle cx="${bx + 56}" cy="${by + bry - 2}" r="${long ? 9 : 7}" fill="${c.tailTip}"/>
<ellipse cx="${hx + 6}" cy="${by + bry - 4}" rx="17" ry="8" fill="${c.points || c.paw}"/><ellipse cx="${hx + 26}" cy="${by + bry - 2}" rx="15" ry="7.5" fill="${c.points || c.paw}"/>
<g class="headg">
${c.mane ? `<circle cx="${hx}" cy="${hy + 4}" r="${hr + 10}" fill="${c.mane}"/>` : ""}
<path d="${c.ears === "fold" ? `M${hx - 30} ${hy - 20} Q${hx - 28} ${hy - 38} ${hx - 12} ${hy - 34} Z M${hx + 8} ${hy - 32} Q${hx + 22} ${hy - 40} ${hx + 28} ${hy - 24} Z` : `M${hx - 34} ${hy - 14} Q${hx - 40} ${hy - 54} ${hx - 22} ${hy - 48} Q${hx - 12} ${hy - 42} ${hx - 6} ${hy - 30} Z M${hx + 6} ${hy - 30} Q${hx + 18} ${hy - 54} ${hx + 30} ${hy - 42} Q${hx + 34} ${hy - 28} ${hx + 32} ${hy - 16} Z`}" fill="${c.ear}"/>
${c.ears === "fold" ? "" : `<path d="M${hx - 30} ${hy - 20} Q${hx - 32} ${hy - 44} ${hx - 22} ${hy - 40} Q${hx - 16} ${hy - 34} ${hx - 12} ${hy - 28} Z M${hx + 12} ${hy - 28} Q${hx + 20} ${hy - 46} ${hx + 26} ${hy - 36} Q${hx + 28} ${hy - 28} ${hx + 26} ${hy - 20} Z" fill="${c.points ? shadeHex(c.points, 1.6) : "#F7B9BC"}"/>`}
<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${c.base}"/>
<g clip-path="url(#${id}k)">
${c.cap ? `<path d="M${hx - 44} ${hy + 6} Q${hx} ${hy - 70} ${hx + 44} ${hy + 6} Q${hx + 16} ${hy - 6} ${hx} ${hy - 14} Q${hx - 16} ${hy - 6} ${hx - 44} ${hy + 6} Z" fill="${c.cap}"/>` : ""}
${c.maskL ? `<ellipse cx="${hx - 14}" cy="${hy + 4}" rx="16" ry="14" fill="${c.maskL}"/>` : ""}${c.maskR ? `<ellipse cx="${hx + 14}" cy="${hy + 4}" rx="16" ry="14" fill="${c.maskR}"/>` : ""}
${c.blaze ? `<path d="M${hx} ${hy - 18} L${hx - 5} ${hy + 12} Q${hx} ${hy + 16} ${hx + 5} ${hy + 12} Z" fill="${c.blaze}"/>` : ""}
${c.muzzle ? `<ellipse cx="${hx}" cy="${hy + 20}" rx="20" ry="13" fill="${c.muzzle}"/>` : ""}
${c.points ? `<circle cx="${hx}" cy="${hy + 8}" r="26" fill="${c.points}" opacity=".75"/>` : ""}
${c.stripes ? `<path d="M${hx - 8} ${hy - 30} l3 12 M${hx} ${hy - 34} v14 M${hx + 8} ${hy - 30} l-3 12" stroke="${c.stripes}" stroke-width="3.5" stroke-linecap="round"/>` : ""}
<circle cx="${hx}" cy="${hy}" r="${hr}" fill="url(#${id}h)"/>
</g>
${awake ? `<ellipse cx="${hx - 14}" cy="${hy + 4}" rx="8" ry="9" fill="${c.iris[0]}"/><ellipse cx="${hx + 14}" cy="${hy + 4}" rx="8" ry="9" fill="${c.iris[1]}"/><ellipse cx="${hx - 14}" cy="${hy + 5}" rx="5.5" ry="7" fill="#1B1718"/><ellipse cx="${hx + 14}" cy="${hy + 5}" rx="5.5" ry="7" fill="#1B1718"/><circle cx="${hx - 11}" cy="${hy}" r="2.6" fill="#fff"/><circle cx="${hx + 17}" cy="${hy}" r="2.6" fill="#fff"/>`
  : `<path d="M${hx - 22} ${hy + 4} Q${hx - 14} ${hy + 11} ${hx - 6} ${hy + 4} M${hx + 6} ${hy + 4} Q${hx + 14} ${hy + 11} ${hx + 22} ${hy + 4}" fill="none" stroke="${dark ? "#E8E0E2" : "#1B1718"}" stroke-width="3" stroke-linecap="round"/>`}
<path d="M${hx - 3} ${hy + 14} Q${hx} ${hy + 12} ${hx + 3} ${hy + 14} Q${hx + 1.5} ${hy + 17} ${hx} ${hy + 18} Q${hx - 1.5} ${hy + 17} ${hx - 3} ${hy + 14} Z" fill="${c.nose}"/>
<path d="M${hx - 6} ${hy + 21} Q${hx - 3} ${hy + 24} ${hx} ${hy + 21} Q${hx + 3} ${hy + 24} ${hx + 6} ${hy + 21}" fill="none" stroke="${dark ? "#C8BFC2" : "#5A4A48"}" stroke-width="1.6" stroke-linecap="round"/>
<ellipse cx="${hx - 24}" cy="${hy + 16}" rx="7" ry="4.5" fill="#F59AA0" opacity=".55"/><ellipse cx="${hx + 24}" cy="${hy + 16}" rx="7" ry="4.5" fill="#F59AA0" opacity=".55"/>
${stage >= 3 ? `<path d="M${hx + 22} ${hy - 32} l-11 -7 q-3 7 0 14 Z M${hx + 22} ${hy - 32} l11 -7 q3 7 0 14 Z" fill="#F07C9A"/><circle cx="${hx + 22}" cy="${hy - 32}" r="3.2" fill="#D9557A"/>` : ""}
</g>
${awake ? "" : `<g class="zzz" fill="#7C8BA0" font-family="sans-serif" font-weight="700"><text x="${hx + 30}" y="${hy - 40}" font-size="18">z</text><text x="${hx + 44}" y="${hy - 56}" font-size="13">z</text></g>`}
</svg>`;
}

/* ---------- room scenes ---------- */
const SCENES = {
  living: { treeC: "#8FA9C9", name: "温馨客厅", wall: "#F6E7D6", wall2: "#EFD8C0", trim: "#E2C3A0", floor: "#D9B184", floor2: "#CDA273", rug: "#E8A3A0", rug2: "#F3C5C0" },
  window: { treeC: "#93B872", name: "阳光窗台", wall: "#FCF1D8", wall2: "#F5E2B8", trim: "#EBCF96", floor: "#E3C08C", floor2: "#D6AF79", rug: "#9CC9B8", rug2: "#C6E3D7" },
  winter: { treeC: "#7E9CC0", name: "冬日壁炉", wall: "#E8EBF1", wall2: "#D8DEE8", trim: "#C2CCDA", floor: "#C99D72", floor2: "#B98C62", rug: "#7FA5C9", rug2: "#B1CAE2" },
  moscow: { treeC: "#C46A58", name: "莫斯科阁楼", wall: "#EADCC9", wall2: "#DDC9AF", trim: "#C4A783", floor: "#B98C64", floor2: "#A77B55", rug: "#C9564A", rug2: "#E08A7E" },
  night:  { treeC: "#8E7BC2", name: "星空屋顶", wall: "#2E3A66", wall2: "#26315A", trim: "#46538A", floor: "#5A4F70", floor2: "#4D4363", rug: "#8E7BC2", rug2: "#B3A4DE" },
};
/* movable furniture: default bounding boxes (svg units) — layout stores [dx, dy] offsets */
const ITEM_BOX = {
  bed: [14, 241, 110, 274], scratch: [226, 196, 262, 264], toy: [182, 146, 250, 284], fish: [14, 166, 82, 214], fountain: [174, 232, 198, 276],
  tree1: [294, 188, 360, 279], tree2: [294, 110, 372, 279], tree3: [248, 6, 382, 279],
};
const ITEM_NAMES = { bed: "猫窝", scratch: "猫抓板", toy: "逗猫棒", fish: "鱼缸", fountain: "饮水机", tree: "猫爬架" };
function clampItem(item, dx, dy, tree) {
  const b = ITEM_BOX[item === "tree" ? "tree" + Math.max(1, tree) : item];
  if (!b) return [0, 0];
  dx = Math.max(-b[0], Math.min(390 - b[2], dx));
  const minBottom = item === "fish" ? 150 : item === "tree" ? 262 : 228;   // bottom edge must stay on the floor (fish tank may sit on the wall shelf)
  dy = Math.max(minBottom - b[3], Math.min(299 - b[3], dy));
  if (b[1] + dy < 2) dy = 2 - b[1];
  return [Math.round(dx), Math.round(dy)];
}
function roomSVG({ scene = "living", tree = 0, decor = {}, layout = {}, label = "" } = {}) {
  const wrap = (k, inner) => { const [dx, dy] = clampItem(k, ...(layout[k] || [0, 0]), tree); return `<g data-item="${k}" transform="translate(${dx} ${dy})">${inner}</g>`; };
  const s = SCENES[scene] || SCENES.living;
  const id = "r" + (++_uid);
  const win = (x, y, w, hh, sky = "#BFE0F2", extra = "") => `<g><rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${hh + 12}" rx="10" fill="#fff"/><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="6" fill="url(#${id}sky)"/>${extra}<path d="M${x + w / 2} ${y} V${y + hh} M${x} ${y + hh / 2} H${x + w}" stroke="#fff" stroke-width="5"/><rect x="${x - 10}" y="${y + hh + 4}" width="${w + 20}" height="8" rx="3" fill="${s.trim}"/></g>`;
  const curtains = (x, w, hh, col) => `<path d="M${x - 18} 26 q10 ${hh / 2} 0 ${hh + 16} h16 q-6 ${-hh / 2} 4 ${-hh - 16} Z M${x + w + 18} 26 q-10 ${hh / 2} 0 ${hh + 16} h-16 q6 ${-hh / 2} -4 ${-hh - 16} Z" fill="${col}"/><rect x="${x - 26}" y="22" width="${w + 52}" height="6" rx="3" fill="${s.trim}"/>`;
  const plant = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0 q-14 -26 -4 -46 M0 0 q2 -30 14 -44 M0 0 q-22 -14 -28 -30 M0 0 q18 -12 26 -26" stroke="#5E9F5E" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="-4" cy="-46" rx="7" ry="11" fill="#76B36E"/><ellipse cx="14" cy="-44" rx="7" ry="11" fill="#6AA864" transform="rotate(30 14 -44)"/><ellipse cx="-28" cy="-30" rx="6" ry="10" fill="#7FBF76" transform="rotate(-50 -28 -30)"/><ellipse cx="26" cy="-26" rx="6" ry="10" fill="#6AA864" transform="rotate(50 26 -26)"/><path d="M-12 0 h24 l-3 18 h-18 Z" fill="#D98B5F"/><rect x="-14" y="-3" width="28" height="6" rx="2" fill="#C4774D"/></g>`;
  const back = {
    living: `${curtains(40, 110, 92, "#E9B7A6")}${win(40, 36, 110, 92, "", `<circle cx="72" cy="62" r="11" fill="#FFF3C4"/><path d="M40 112 q30 -16 60 0 q24 -12 50 0 V128 H40 Z" fill="#A9D3A0"/>`)}
      <rect x="196" y="56" width="50" height="38" rx="3" fill="#F6E7D3" stroke="#B8875A" stroke-width="4"/><path d="M204 86 L216 70 L224 80 L232 72 L240 86 Z" fill="#8FBF8A"/><circle cx="232" cy="66" r="4" fill="#F2C14E"/>
      <rect x="196" y="112" width="70" height="7" rx="3" fill="#B8875A"/><rect x="202" y="96" width="9" height="16" fill="#D9534F"/><rect x="212" y="99" width="8" height="13" fill="#5C93C9"/><rect x="221" y="95" width="10" height="17" fill="#F2C14E"/>${plant(250, 112, 0.45)}
      <path d="M300 30 V64" stroke="#8A6A4A" stroke-width="2"/><path d="M284 64 h32 l-8 18 h-16 Z" fill="#F2C14E"/><ellipse cx="300" cy="88" rx="26" ry="10" fill="#FFF3C4" opacity=".5"/>`,
    window: `${curtains(28, 250, 132, "#F4D6A0")}${win(28, 34, 250, 132, "", `<circle cx="222" cy="72" r="20" fill="#FFE59A"/><path d="M28 140 q60 -30 120 -6 q60 -26 130 4 V166 H28 Z" fill="#A9D3A0"/><path d="M60 80 q8 -6 16 0 M90 64 q8 -6 16 0" stroke="#fff" stroke-width="3" fill="none"/>`)}
      <path d="M40 176 L120 214 M110 176 L196 222 M180 176 L262 214" stroke="#FFF4C8" stroke-width="26" opacity=".45"/>${plant(52, 172, 0.7)}${plant(250, 172, 0.55)}`,
    winter: `${win(30, 40, 110, 88, "", `<g fill="#fff"><circle cx="50" cy="60" r="2.5"/><circle cx="80" cy="74" r="2.5"/><circle cx="116" cy="58" r="2.5"/><circle cx="64" cy="100" r="2.5"/><circle cx="104" cy="96" r="2.5"/></g><path d="M30 112 q30 -14 55 -2 q30 -12 55 2 V128 H30 Z" fill="#fff"/>`)}
      <rect x="170" y="96" width="122" height="112" rx="6" fill="#B65A3C"/><path d="M170 120 h122 M170 146 h122 M170 172 h122 M200 96 v24 M240 96 v24 M220 120 v26 M262 120 v26 M196 146 v26 M244 146 v26" stroke="#9C4A30" stroke-width="2"/>
      <rect x="160" y="86" width="142" height="14" rx="4" fill="#8A3F2A"/><rect x="196" y="130" width="70" height="78" rx="35" fill="#3A2522"/>
      <path d="M214 206 q-4 -26 14 -40 q-2 18 10 22 q8 -14 4 -28 q18 20 10 46 Z" fill="#F2A23A"/><path d="M222 206 q0 -14 10 -22 q2 12 10 22 Z" fill="#FFE07A"/>
      <rect x="182" y="70" width="12" height="16" rx="2" fill="#F2C14E"/><rect x="268" y="72" width="16" height="14" rx="2" fill="#D9534F"/><path d="M172 70 q60 -14 120 0" stroke="#5E9F5E" stroke-width="5" fill="none"/><circle cx="196" cy="66" r="3" fill="#D9534F"/><circle cx="240" cy="62" r="3" fill="#F2C14E"/><circle cx="276" cy="66" r="3" fill="#D9534F"/>`,
    moscow: `<path d="M0 0 L130 0 L0 120 Z" fill="#7A5A44"/><path d="M0 120 L130 0" stroke="#5E4332" stroke-width="6"/>
      <rect x="142" y="34" width="156" height="114" rx="62" fill="#2E3E66" stroke="#F6E7D3" stroke-width="8"/>
      <g fill="#fff"><circle cx="166" cy="56" r="1.8"/><circle cx="262" cy="62" r="2"/><circle cx="214" cy="46" r="1.6"/><circle cx="240" cy="78" r="1.4"/></g>
      <path d="M162 148 V112 h20 v36 M198 148 V96 h24 v52 M238 148 V108 h22 v40" fill="#E6C27A"/>
      <path d="M172 112 q-13 -15 0 -28 q13 13 0 28 Z M210 96 q-15 -17 0 -32 q15 15 0 32 Z M249 108 q-13 -15 0 -28 q13 13 0 28 Z" fill="#D9534F"/>
      <path d="M172 84 v-8 M210 64 v-10 M249 80 v-8" stroke="#E6C27A" stroke-width="2"/>${plant(330, 206, 0.6)}`,
    night: `<rect x="0" y="0" width="390" height="210" fill="url(#${id}night)"/><circle cx="300" cy="56" r="24" fill="#FFF1B8"/><circle cx="290" cy="50" r="22" fill="#2A3560"/>
      <path d="M40 40 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z M120 70 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z M200 30 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z M90 120 l2 -4 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 Z M350 110 l2 -4 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 Z" fill="#FFE59A"/>
      <g fill="#fff" opacity=".7"><circle cx="160" cy="20" r="1.3"/><circle cx="250" cy="100" r="1.3"/><circle cx="60" cy="90" r="1.3"/><circle cx="370" cy="30" r="1.3"/></g>
      <path d="M0 210 L60 176 L130 192 L200 168 L270 188 L330 172 L390 190 V210 Z" fill="#3A4778"/><path d="M90 186 h10 v-14 h6 v14" fill="#F2C14E" opacity=".7"/>`,
  }[scene] || "";
  const planks = [0, 1, 2, 3].map(i => `<path d="M0 ${226 + i * 20} H390" stroke="${s.floor2}" stroke-width="2"/>`).join("") + [40, 150, 270, 90, 210, 330].map((x, i) => `<path d="M${x} ${210 + Math.floor(i / 3) * 40 + (i % 2) * 20} v20" stroke="${s.floor2}" stroke-width="2"/>`).join("");
  const tc = s.treeC || "#8FA9C9", tl = shadeHex(tc, 1.25), td = shadeHex(tc, 0.85), tdd = shadeHex(tc, 0.6);
  const t1 = `<rect x="318" y="198" width="18" height="72" rx="4" fill="#E2C69A"/><path d="M318 206 h18 M318 216 h18 M318 226 h18 M318 236 h18 M318 246 h18 M318 256 h18" stroke="#BF9C68" stroke-width="2"/><rect x="294" y="188" width="66" height="13" rx="6" fill="${tc}"/><rect x="294" y="188" width="66" height="5" rx="2.5" fill="${tl}"/><rect x="298" y="266" width="60" height="13" rx="5" fill="${tc}"/>`;
  const t2 = `<rect x="322" y="120" width="16" height="70" rx="4" fill="#E2C69A"/><path d="M322 130 h16 M322 142 h16 M322 154 h16 M322 166 h16 M322 178 h16" stroke="#BF9C68" stroke-width="2"/><rect x="298" y="110" width="74" height="13" rx="6" fill="${tc}"/><rect x="298" y="110" width="74" height="5" rx="2.5" fill="${tl}"/><path d="M366 123 q4 14 -2 22" stroke="#F07C9A" stroke-width="2" fill="none"/><circle cx="364" cy="147" r="4" fill="#F2C14E"/>`;
  const t3 = `<rect x="272" y="56" width="16" height="140" rx="4" fill="#E2C69A"/><path d="M272 70 h16 M272 86 h16 M272 102 h16 M272 118 h16 M272 134 h16 M272 150 h16 M272 166 h16 M272 182 h16" stroke="#BF9C68" stroke-width="2"/><rect x="298" y="26" width="80" height="58" rx="12" fill="${tc}"/><path d="M294 30 L338 6 L382 30 Z" fill="${td}"/><ellipse cx="338" cy="58" rx="16" ry="15" fill="${tdd}"/><rect x="294" y="82" width="88" height="10" rx="5" fill="${td}"/><rect x="250" y="46" width="60" height="11" rx="5" fill="${tc}"/><rect x="250" y="46" width="60" height="4" rx="2" fill="${tl}"/><path d="M300 92 L322 120 M378 92 L338 120" stroke="#E2C69A" stroke-width="5"/><path d="M248 150 Q270 170 292 150" stroke="#F07C9A" stroke-width="3" fill="#F7C6D2"/>`;
  return `<svg class="room-svg" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label || "猫咪小窝：" + s.name}">
<defs>
<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.wall2}"/><stop offset="1" stop-color="${s.wall}"/></linearGradient>
<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.floor2}"/><stop offset=".35" stop-color="${s.floor}"/></linearGradient>
<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${scene === "winter" ? "#CBD9E8" : "#9FD0F0"}"/><stop offset="1" stop-color="${scene === "winter" ? "#EEF3F8" : "#DDF0FA"}"/></linearGradient>
<linearGradient id="${id}night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C2448"/><stop offset="1" stop-color="#3A4778"/></linearGradient>
<radialGradient id="${id}rug"><stop offset="0" stop-color="${s.rug2}"/><stop offset="1" stop-color="${s.rug}"/></radialGradient>
<radialGradient id="${id}light" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></radialGradient>
</defs>
<rect width="390" height="300" fill="url(#${id}w)"/>
${scene !== "night" ? `<path d="M0 160 H390 V210 H0 Z" fill="${s.wall2}" opacity=".55"/><path d="M0 160 H390" stroke="${s.trim}" stroke-width="3"/>` : ""}
${back}
<rect x="0" y="210" width="390" height="90" fill="url(#${id}f)"/>${planks}
<rect x="0" y="206" width="390" height="8" fill="${s.trim}"/>
<ellipse cx="150" cy="262" rx="114" ry="26" fill="url(#${id}rug)"/><ellipse cx="150" cy="262" rx="92" ry="17" fill="none" stroke="#fff" stroke-width="2" opacity=".55" stroke-dasharray="6 6"/>
<g><ellipse cx="116" cy="279" rx="18" ry="3" fill="#000" opacity=".12"/><path d="M100 266 H132 Q130 279 116 279 Q102 279 100 266 Z" fill="#D9534F"/><ellipse cx="116" cy="266" rx="16" ry="3.5" fill="#B8433F"/><circle cx="111" cy="264" r="2.6" fill="#C9874A"/><circle cx="119" cy="264" r="2.6" fill="#C9874A"/><circle cx="115" cy="262" r="2.4" fill="#D59658"/>
<ellipse cx="152" cy="279" rx="18" ry="3" fill="#000" opacity=".12"/><path d="M136 266 H168 Q166 279 152 279 Q138 279 136 266 Z" fill="#5C93C9"/><ellipse cx="152" cy="266" rx="16" ry="3.5" fill="#9FD0F0"/><path d="M146 265 q4 -2 8 0" stroke="#fff" stroke-width="1.2" fill="none"/></g>
${decor.bed ? wrap("bed", `<ellipse cx="62" cy="266" rx="48" ry="8" fill="#000" opacity=".1"/><ellipse cx="62" cy="260" rx="46" ry="19" fill="#C76F5B"/><ellipse cx="62" cy="254" rx="35" ry="11" fill="#F6D9C8"/><path d="M30 254 q32 10 64 0" stroke="#E9BFAA" stroke-width="2" fill="none"/>`) : ""}
${decor.scratch ? wrap("scratch", `<rect x="236" y="196" width="16" height="64" rx="3" fill="#D9B98A"/><path d="M236 204 h16 M236 212 h16 M236 220 h16 M236 228 h16 M236 236 h16 M236 244 h16 M236 252 h16" stroke="#B8955F" stroke-width="2"/><rect x="226" y="256" width="36" height="8" rx="3" fill="#A97D52"/>`) : ""}
${decor.toy ? wrap("toy", `<path d="M196 214 Q210 160 232 150" stroke="#8A6A4A" stroke-width="3" fill="none"/><path d="M232 150 q10 6 4 16 q10 -2 10 10" stroke="#F07C9A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="246" cy="178" r="4" fill="#F7A8C4"/><circle cx="190" cy="276" r="8" fill="#F2C14E"/><path d="M184 272 l12 8 M196 272 l-12 8" stroke="#D9534F" stroke-width="2"/>`) : ""}
${decor.fish ? wrap("fish", `<rect x="18" y="166" width="60" height="44" rx="12" fill="#BFE6EE" stroke="#fff" stroke-width="3"/><path d="M24 196 q30 -6 48 0 v10 h-48 Z" fill="#E9D3A6"/><path d="M36 184 q8 -8 16 0 q-8 8 -16 0 Z M52 184 l6 -5 v10 Z" fill="#F28C5A"/><circle cx="64" cy="176" r="2" fill="#fff"/><circle cx="60" cy="170" r="1.4" fill="#fff"/><rect x="14" y="208" width="68" height="6" rx="3" fill="#8A6A4A"/>`) : ""}
${decor.fountain ? wrap("fountain", `<rect x="174" y="250" width="24" height="26" rx="7" fill="#E3EEF6" stroke="#5C93C9" stroke-width="2"/><path d="M186 250 q-6 -12 0 -18 q6 6 0 18" fill="#9FD0F0"/>`) : ""}
${tree >= 1 ? wrap("tree", t1 + (tree >= 2 ? t2 : "") + (tree >= 3 ? t3 : "")) : ""}
<rect width="390" height="300" fill="url(#${id}light)" pointer-events="none"/>
</svg>`;
}

/* ---------- meows: formant synthesis, several kinds, randomised ---------- */
let _ac, _master;
function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!_ac) {
    _ac = new AC();
    _master = _ac.createGain(); _master.gain.value = 0.9; _master.connect(_ac.destination);
  }
  if (_ac.state === "suspended") _ac.resume();
  return _ac;
}
/* soft kitten voice: warm few-harmonic source, gentle attack/release, light formant colour, low volume */
const MEOWS = {
  //  pitch contour [t 0..1, Hz], formant glide [start, mid, end], duration, vibrato Hz
  mew:   { dur: 0.32, f0: [[0, 820], [0.35, 1020], [1, 860]], fm: [900, 1300, 1000], vib: 0 },
  meow:  { dur: 0.52, f0: [[0, 700], [0.3, 920], [0.7, 860], [1, 640]], fm: [800, 1250, 900], vib: 5 },
  happy: { dur: 0.42, f0: [[0, 760], [0.25, 980], [0.55, 1060], [1, 940]], fm: [900, 1400, 1200], vib: 6 },
  mrrp:  { dur: 0.36, f0: [[0, 520], [0.6, 700], [1, 680]], fm: [600, 800, 900], trill: 22 },
  sad:   { dur: 0.6, f0: [[0, 820], [0.4, 760], [1, 560]], fm: [900, 1100, 750], vib: 4 },
  eat:   { dur: 0.16, f0: [[0, 560], [1, 520]], fm: [700, 700, 700], vib: 0, chain: 3 },
};
let _wave;
function playMeow(kind = "meow") {
  try {
    const ac = audio(); if (!ac) return;
    if (kind === "purr") return purr(ac);
    const m = MEOWS[kind] || MEOWS.meow;
    if (!_wave) _wave = ac.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0]), new Float32Array([0, 1, 0.42, 0.16, 0.07, 0.03]));
    const reps = m.chain || 1;
    for (let rI = 0; rI < reps; rI++) {
      const k = 0.94 + Math.random() * 0.14, d = m.dur * (0.9 + Math.random() * 0.2);
      const t = ac.currentTime + 0.02 + rI * (d + 0.09);
      const src = ac.createOscillator(); src.setPeriodicWave(_wave);
      m.f0.forEach(([p, f], i) => i ? src.frequency.linearRampToValueAtTime(f * k, t + p * d) : src.frequency.setValueAtTime(f * k, t));
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = m.trill || m.vib || 5; lg.gain.value = m.trill ? 0 : (m.vib ? 7 : 0);
      lfo.connect(lg); lg.connect(src.frequency);
      const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.22, t + Math.min(0.07, d * 0.3));
      env.gain.setValueAtTime(0.22, t + d * 0.55); env.gain.exponentialRampToValueAtTime(0.0001, t + d);
      if (m.trill) { const tg = ac.createGain(); tg.gain.value = 0.09; lfo.connect(tg); tg.connect(env.gain); }
      const peak = ac.createBiquadFilter(); peak.type = "peaking"; peak.Q.value = 2.2; peak.gain.value = 7;
      peak.frequency.setValueAtTime(m.fm[0], t); peak.frequency.linearRampToValueAtTime(m.fm[1], t + d * 0.35); peak.frequency.linearRampToValueAtTime(m.fm[2], t + d);
      const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600; lp.Q.value = 0.5;
      const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 260;
      src.connect(peak); peak.connect(lp); lp.connect(hp); hp.connect(env); env.connect(_master);
      src.start(t); lfo.start(t); src.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
    }
  } catch {}
}
function purr(ac) {
  const t = ac.currentTime, d = 1.4;
  const b = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  const n = ac.createBufferSource(); n.buffer = b;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 360;
  const am = ac.createGain(); am.gain.value = 0;
  const lfo = ac.createOscillator(); lfo.frequency.value = 24; const lg = ac.createGain(); lg.gain.value = 0.6;
  lfo.connect(lg); lg.connect(am.gain);
  const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(0.55, t + 0.2); env.gain.setValueAtTime(0.55, t + d - 0.3); env.gain.exponentialRampToValueAtTime(0.0001, t + d);
  n.connect(lp); lp.connect(am); am.connect(env); env.connect(_master);
  n.start(t); lfo.start(t); n.stop(t + d); lfo.stop(t + d);
}
/* pick a meow that fits the moment */
function meowFor(what) {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  playMeow({ correct: pick(["happy", "mew", "mrrp", "happy"]), wrong: pick(["sad", "mew"]), pet: pick(["purr", "mrrp", "purr"]), hungry: pick(["meow", "sad"]), sick: "sad", eat: "eat" }[what] || pick(["meow", "mew", "mrrp"]));
}
function meowSound() { meowFor("correct"); }

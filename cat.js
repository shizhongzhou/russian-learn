"use strict";
/* ========== 猫猫俄语通 — cats (front + side view), room scenes, meows ========== */

/* Each breed: colours + pattern flags.
   cap/maskL/maskR: head-top and eye-patch colours (null = none); blaze: stripe between the eyes;
   muzzle: lower-face colour (null = base); stripes/points/patches/shade/mane/ears/face: pattern features. */
const W_ = "#FBF8F4";
const BREEDS = {
  ragdoll:  { name: "布偶猫", short: "布偶", desc: "灰白长毛、蓝眼睛，温柔黏人", base: W_, body: "#9A9CA4", cap: "#767982", maskL: "#7F828B", maskR: "#7F828B", blaze: W_, chest: W_, paw: W_, ear: "#6A6D76", tail: "#7F828B", tailTip: W_, iris: ["#3D6FB0", "#3D6FB0"], nose: "#F49AA4", fur: "long" },
  bluewhite:{ name: "蓝白", short: "蓝白", desc: "灰蓝长毛、大白围脖、琥珀色眼睛，就像你家那只", base: "#8A919B", body: "#7F8691", cap: "#7F8691", maskL: null, maskR: null, blaze: "#F7F5F2", blazeThin: true, muzzle: "#F7F5F2", chest: "#F7F5F2", paw: "#F7F5F2", ear: "#737A85", tail: "#7F8691", tailTip: "#8D949E", iris: ["#D9962B", "#D9962B"], nose: "#F2A3AE", fur: "long", whisker: "#F0F0F0" },
  british:  { name: "蓝猫", short: "蓝猫", desc: "英短蓝猫，圆脸胖嘟嘟，橙色大眼睛", base: "#858B95", body: "#7D838D", chest: "#858B95", paw: "#858B95", ear: "#737983", tail: "#7D838D", tailTip: "#7D838D", iris: ["#E8902A", "#E8902A"], nose: "#5E636B", fat: true, whisker: "#E7EBEF" },
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

/* ================= cats drawn in a flat ink-brush style =================
   flat fills, a dark brush edge on the shadow side (an offset ink copy under each shape),
   slightly rough edges (turbulence filter), small dark nose, thin whiskers, expressive lids. */
const INK = "#2A2526";
function _defs(id, c) {
  return `<filter id="${id}r" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>`;
}
const inkOf = c => (c.body === "#3F393B" || c.body === "#2F2A2C" || c.body === "#3E3330") ? "#141112" : INK;
/* a filled shape with a brush edge: ink copy shifted to the lower-left, then the fill */
const brush = (d, fill, ink, dx = -2.6, dy = 2.2, extra = "") => `<path d="${d}" fill="${ink}" transform="translate(${dx} ${dy})"/><path d="${d}" fill="${fill}"${extra}/>`;
const strokeBrush = (d, col, ink, w) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w + 4}" stroke-linecap="round" transform="translate(-2 2)"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

/* eyes: cx, cy, size; kind = calm (half-lidded), open, wide, closed, sad, sick */
function _eye(cx, cy, s, iris, ink, kind, faceCol, side) {
  const w = 13 * s, h = 9 * s, sd = side; // side: -1 left eye, 1 right eye (for slant)
  if (kind === "closed") return `<path d="M${cx - w} ${cy} Q${cx} ${cy + h * 1.1} ${cx + w} ${cy}" fill="none" stroke="${ink}" stroke-width="${3.2 * s}" stroke-linecap="round"/>`;
  const almond = `M${cx - w} ${cy + sd * 0} Q${cx} ${cy - h * 1.5} ${cx + w} ${cy} Q${cx} ${cy + h * 1.2} ${cx - w} ${cy} Z`;
  const round = `M${cx - w * 0.9} ${cy} A${w * 0.9} ${h * 1.35} 0 1 0 ${cx + w * 0.9} ${cy} A${w * 0.9} ${h * 1.35} 0 1 0 ${cx - w * 0.9} ${cy} Z`;
  const shape = kind === "wide" || kind === "sad" ? round : almond;
  const pw = kind === "wide" || kind === "sad" ? 4.8 * s : 4 * s, ph = kind === "wide" || kind === "sad" ? 8.5 * s : 8 * s;
  const px = kind === "calm" ? cx + 3.5 * s : cx;   // calm cats glance sideways
  let out = `<path d="${shape}" fill="${iris}" stroke="${ink}" stroke-width="${1.6 * s}"/>
    <ellipse cx="${px}" cy="${cy + 0.5 * s}" rx="${pw}" ry="${ph}" fill="${ink}"/>
    <circle cx="${px + 2.4 * s}" cy="${cy - 3.2 * s}" r="${1.9 * s}" fill="#fff"/>${kind === "wide" || kind === "sad" ? `<circle cx="${px - 2.6 * s}" cy="${cy + 3.4 * s}" r="${1.1 * s}" fill="#fff" opacity=".85"/>` : ""}`;
  if (kind === "calm" || kind === "sick") {   // upper lid down to half: face-colour lid + thick lid line
    const lidY = cy - h * (kind === "sick" ? 0.15 : 0.62);
    out += `<path d="M${cx - w - 2} ${cy + 1} Q${cx} ${cy - h * 2.2} ${cx + w + 2} ${cy + 1} L${cx + w + 2} ${lidY} Q${cx} ${lidY - h * 0.25} ${cx - w - 2} ${lidY} Z" fill="${faceCol}"/>
      <path d="M${cx - w - 1} ${lidY + 0.5} Q${cx} ${lidY - h * 0.3} ${cx + w + 2} ${lidY - sd * 1.2 - 1}" fill="none" stroke="${ink}" stroke-width="${3.4 * s}" stroke-linecap="round"/>`;
  } else out += `<path d="M${cx - w - 1} ${cy} Q${cx} ${cy - h * 1.75} ${cx + w + 1} ${cy - 1}" fill="none" stroke="${ink}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`;
  return out;
}
const MOOD_EYES = { happy: "calm", walk: "calm", cheer: "closedHappy", sleep: "closed", eat: "closed", hungry: "wide", sick: "sick", sad: "sad", lie: "calm" };

/* ---------- front view (sitting) ---------- */
function catSVG({ breed = "ragdoll", stage = 2, mood = "happy", size = 120, label = "" } = {}) {
  const c = BREEDS[breed] || BREEDS.ragdoll;
  const id = "c" + (++_uid);
  stage = Math.max(1, Math.min(4, stage | 0 || 1));
  const ink = inkOf(c), long = c.fur === "long", fat = c.fat ? 6 : 0;
  const hungry = mood === "hungry", sick = mood === "sick", sad = mood === "sad";
  const bw = 34 + stage * 4 + fat - (hungry ? 7 : 0);            // half body width at the bottom
  const hw = 52 + stage * 1.2 + fat * 0.6, hy = 82;                   // head half width / centre
  const face = c.base, bodyCol = c.body;
  const head = `M${100 - hw} ${hy + 4} C${100 - hw} ${hy - 30} ${100 - hw * 0.55} ${hy - 44} 100 ${hy - 44} C${100 + hw * 0.55} ${hy - 44} ${100 + hw} ${hy - 30} ${100 + hw} ${hy + 4} C${100 + hw} ${hy + 30} ${100 + hw * 0.55} ${hy + 42} 100 ${hy + 42} C${100 - hw * 0.55} ${hy + 42} ${100 - hw} ${hy + 30} ${100 - hw} ${hy + 4} Z`;
  const body = `M${100 - bw} 186 C${100 - bw - 6} 160 ${100 - bw * 0.8} 126 ${100 - bw * 0.45} 110 L${100 + bw * 0.45} 110 C${100 + bw * 0.8} 126 ${100 + bw + 6} 160 ${100 + bw} 186 Z`;
  const earL = c.ears === "fold" ? `M${100 - hw * 0.78} ${hy - 26} Q${100 - hw * 0.7} ${hy - 50} ${100 - hw * 0.25} ${hy - 42} Q${100 - hw * 0.5} ${hy - 34} ${100 - hw * 0.78} ${hy - 26} Z`
    : `M${100 - hw * 0.92} ${hy - 14} L${100 - hw * 0.78} ${hy - 66} L${100 - hw * 0.22} ${hy - 40} Z`;
  const earR = c.ears === "fold" ? `M${100 + hw * 0.78} ${hy - 26} Q${100 + hw * 0.7} ${hy - 50} ${100 + hw * 0.25} ${hy - 42} Q${100 + hw * 0.5} ${hy - 34} ${100 + hw * 0.78} ${hy - 26} Z`
    : `M${100 + hw * 0.92} ${hy - 14} L${100 + hw * 0.78} ${hy - 66} L${100 + hw * 0.22} ${hy - 40} Z`;
  const earIn = c.ears === "fold" ? "" : `<path d="M${100 - hw * 0.8} ${hy - 24} L${100 - hw * 0.72} ${hy - 56} L${100 - hw * 0.36} ${hy - 38} Z M${100 + hw * 0.8} ${hy - 24} L${100 + hw * 0.72} ${hy - 56} L${100 + hw * 0.36} ${hy - 38} Z" fill="${c.points ? shadeHex(c.points, 0.8) : ink}" opacity=".78"/><path d="M${100 - hw * 0.74} ${hy - 30} L${100 - hw * 0.7} ${hy - 48} L${100 - hw * 0.5} ${hy - 36} Z M${100 + hw * 0.74} ${hy - 30} L${100 + hw * 0.7} ${hy - 48} L${100 + hw * 0.5} ${hy - 36} Z" fill="#E9A3AA" opacity=".55"/>`;
  const tufts = c.ears === "tuft" ? `<path d="M${100 - hw * 0.78} ${hy - 64} l-3 -12 l7 9 Z M${100 + hw * 0.78} ${hy - 64} l3 -12 l-7 9 Z" fill="${ink}"/>` : "";
  // fluffy cheeks for long fur / mane
  let fluff = "";
  if (long || c.mane) {
    const r = c.mane ? 16 : 9;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.05 + i * 0.1125); pts.push([100 + Math.cos(a) * (hw + (i % 2 ? r : 2)), hy + 6 + Math.sin(a) * (40 + (i % 2 ? r : 2))]); }
    fluff = `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(" ")).join(" L")} Z" fill="${c.mane || c.chest}"/>`;
  }
  // patterns on the head
  const capD = `M${100 - hw - 4} ${hy + 2} C${100 - hw} ${hy - 50} ${100 + hw} ${hy - 50} ${100 + hw + 4} ${hy + 2} C${100 + hw * 0.5} ${hy - 8} ${100 + 10} ${hy - 16} 100 ${hy - 20} C${100 - 10} ${hy - 16} ${100 - hw * 0.5} ${hy - 8} ${100 - hw - 4} ${hy + 2} Z`;
  const headPat = `${c.cap ? `<path d="${capD}" fill="${c.cap}"/>` : ""}
    ${c.maskL ? `<ellipse cx="${100 - 24}" cy="${hy + 2}" rx="22" ry="19" fill="${c.maskL}"/>` : ""}${c.maskR ? `<ellipse cx="${100 + 24}" cy="${hy + 2}" rx="22" ry="19" fill="${c.maskR}"/>` : ""}
    ${c.blaze ? `<path d="M100 ${hy - 30} L${c.blazeThin ? 95 : 90} ${hy + 14} L${c.blazeThin ? 105 : 110} ${hy + 14} Z" fill="${c.blaze}"/>` : ""}
    ${c.muzzle ? `<path d="M${100 - 24} ${hy + 22} Q100 ${hy + 4} ${100 + 24} ${hy + 22} Q${100 + 22} ${hy + 40} 100 ${hy + 42} Q${100 - 22} ${hy + 40} ${100 - 24} ${hy + 22} Z" fill="${c.muzzle}"/>` : ""}
    ${c.points ? `<ellipse cx="100" cy="${hy + 14}" rx="30" ry="26" fill="${c.points}" opacity=".85"/>` : ""}
    ${c.stripes ? `<g stroke="${c.stripes}" stroke-width="4" stroke-linecap="round" fill="none"><path d="M90 ${hy - 40} l2 14 M100 ${hy - 43} v16 M110 ${hy - 40} l-2 14"/><path d="M${100 - hw + 2} ${hy + 8} h12 M${100 - hw + 1} ${hy + 17} h11 M${100 + hw - 2} ${hy + 8} h-12 M${100 + hw - 1} ${hy + 17} h-11"/></g>` : ""}
    ${c.shade ? `<path d="M${100 - hw} ${hy - 6} C${100 - hw} ${hy - 50} ${100 + hw} ${hy - 50} ${100 + hw} ${hy - 6} C${100 + hw * 0.4} ${hy - 22} ${100 - hw * 0.4} ${hy - 22} ${100 - hw} ${hy - 6} Z" fill="${c.shade}" opacity=".45"/>` : ""}`;
  const bodyPat = `${(c.patches || []).map(([x, y, rx, ry, col]) => `<ellipse cx="${x}" cy="${y - 6}" rx="${rx}" ry="${ry}" fill="${col}"/>`).join("")}
    ${c.stripes ? `<g stroke="${c.stripes}" stroke-width="5" stroke-linecap="round" fill="none">${[0, 1, 2].map(i => `<path d="M${100 - bw - 4} ${132 + i * 16} q12 -2 15 7 M${100 + bw + 4} ${132 + i * 16} q-12 -2 -15 7"/>`).join("")}</g>` : ""}
    <path d="M${100 - bw * 0.5} 112 Q100 ${120 + (long ? 10 : 4)} ${100 + bw * 0.5} 112 L${100 + bw * 0.42} 180 Q100 186 ${100 - bw * 0.42} 180 Z" fill="${c.chest}" opacity="${c.chest === c.body ? 0 : 1}"/>`;
  // eyes / face by mood
  const ek = mood === "cheer" ? "closedHappy" : MOOD_EYES[mood] || "calm";
  const es = 1.12 + (stage - 1) * 0.04, ey = hy + 4, ex = 25;
  let eyes;
  if (ek === "closedHappy") eyes = `<path d="M${100 - ex - 12} ${ey + 3} Q${100 - ex} ${ey - 10} ${100 - ex + 12} ${ey + 3} M${100 + ex - 12} ${ey + 3} Q${100 + ex} ${ey - 10} ${100 + ex + 12} ${ey + 3}" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/>`;
  else eyes = _eye(100 - ex, ey, es, c.iris[0], ink, ek, c.maskL || face, -1) + _eye(100 + ex, ey, es, c.iris[1], ink, ek, c.maskR || face, 1);
  const brows = sad || hungry ? `<path d="M${100 - ex - 12} ${ey - 18} Q${100 - ex} ${ey - 21} ${100 - ex + 9} ${ey - 26} M${100 + ex + 12} ${ey - 18} Q${100 + ex} ${ey - 21} ${100 + ex - 9} ${ey - 26}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>` : "";
  const ny = hy + 22;
  const mouth = mood === "cheer" ? `<path d="M93 ${ny + 6} Q100 ${ny + 16} 107 ${ny + 6} Z" fill="#E7808C" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>`
    : mood === "eat" ? `<path d="M95 ${ny + 7} Q100 ${ny + 12} 105 ${ny + 7}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/><path d="M99 ${ny + 9} q2 6 4 0" fill="#E7808C"/>`
    : (sad || hungry || sick) ? `<path d="M100 ${ny + 4} v3 M94 ${ny + 11} Q100 ${ny + 6} 106 ${ny + 11}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M100 ${ny + 4} v3 M100 ${ny + 7} Q96 ${ny + 11} 92 ${ny + 8} M100 ${ny + 7} Q104 ${ny + 11} 108 ${ny + 8}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
  const nose = `<path d="M95.5 ${ny - 1} L104.5 ${ny - 1} L100 ${ny + 4.5} Z" fill="${c.nose}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
  const whisk = `<path d="M${100 - 30} ${ny + 2} L${100 - 62} ${ny - 4} M${100 - 30} ${ny + 7} L${100 - 60} ${ny + 10} M${100 + 30} ${ny + 2} L${100 + 62} ${ny - 4} M${100 + 30} ${ny + 7} L${100 + 60} ${ny + 10}" stroke="${c.whisker && c.base === c.body && /^#[0-4]/.test(c.body) ? c.whisker : ink}" stroke-width="1.3" stroke-linecap="round"/>`;
  const blush = sick || hungry ? "" : `<ellipse cx="${100 - 38}" cy="${ny + 6}" rx="8" ry="4.5" fill="#F08C98" opacity=".28"/><ellipse cx="${100 + 38}" cy="${ny + 6}" rx="8" ry="4.5" fill="#F08C98" opacity=".28"/>`;
  // tail curling up on the right
  const tail = `M${100 + bw - 6} 182 C${100 + bw + 34} 186 ${100 + bw + 40} 150 ${100 + bw + 26} 128 C${100 + bw + 18} 116 ${100 + bw + 24} 104 ${100 + bw + 34} 100`;
  const legs = [100 - bw * 0.38, 100 + bw * 0.14].map(x => brush(`M${x - 2} 142 Q${x + 10} 138 ${x + 22} 142 L${x + 22} 182 Q${x + 10} 190 ${x - 2} 182 Z`, c.points ? c.points : c.paw === c.chest ? c.paw : bodyCol, ink, -1.8, 1.6)).join("");
  const paws = [100 - bw * 0.38 + 10, 100 + bw * 0.14 + 10].map(x => `<ellipse cx="${x}" cy="186" rx="13" ry="7" fill="${c.paw}" stroke="${ink}" stroke-width="1.6"/><path d="M${x - 4} 190 v-3 M${x + 4} 190 v-3" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>`).join("");
  const deco = !sick && !hungry;
  const bell = stage >= 2 ? `<path d="M${100 - hw * 0.62} ${hy + 40} Q100 ${hy + 54} ${100 + hw * 0.62} ${hy + 40}" fill="none" stroke="#D9534F" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="${hy + 52}" r="6.5" fill="#F2C14E" stroke="${ink}" stroke-width="1.4"/>` : "";
  const bow = stage >= 3 && deco ? `<g transform="translate(${100 + hw * 0.62} ${hy - 40})"><path d="M0 0 L-13 -9 Q-16 0 -13 9 Z M0 0 L13 -9 Q16 0 13 9 Z" fill="#F07C9A" stroke="${ink}" stroke-width="1.4"/><circle r="3.6" fill="#D9557A" stroke="${ink}" stroke-width="1.2"/></g>` : "";
  const crown = stage >= 4 && deco ? [[-30, -38, "#fff", "#F2C14E"], [-14, -45, "#F7A8C4", "#fff"], [2, -47, "#A8C8F0", "#fff"], [18, -44, "#FFE08A", "#F28C5A"]].map(([x, y, a, b]) => `<circle cx="${100 + x}" cy="${hy + y}" r="6" fill="${a}" stroke="${ink}" stroke-width="1.2"/><circle cx="${100 + x}" cy="${hy + y}" r="2.4" fill="${b}"/>`).join("") : "";
  const extras = `${mood === "eat" || hungry ? `<path d="M62 180 H138 Q134 198 100 198 Q66 198 62 180 Z" fill="#D9534F" stroke="${ink}" stroke-width="1.6"/><ellipse cx="100" cy="180" rx="38" ry="6" fill="#B8433F"/>${mood === "eat" ? `<circle cx="88" cy="177" r="4.5" fill="#C9874A"/><circle cx="99" cy="175" r="4.5" fill="#B87A40"/><circle cx="110" cy="177" r="4.5" fill="#C9874A"/>` : ""}` : ""}
    ${hungry ? `<text x="150" y="150" font-size="17" font-family="sans-serif" font-weight="700" fill="#9A4A12">咕～</text>` : ""}
    ${sad ? `<path d="M${100 - ex - 8} ${ey + 14} q-4 8 0 12 q4 -4 0 -12 Z" fill="#8EC5EC" stroke="${ink}" stroke-width="1"/>` : ""}
    ${sick ? `<rect x="74" y="${hy - 40}" width="52" height="13" rx="5" fill="#fff" stroke="${ink}" stroke-width="1.4"/><rect x="112" y="${ny + 10}" width="28" height="6" rx="3" fill="#fff" stroke="${ink}" stroke-width="1.2" transform="rotate(20 112 ${ny + 10})"/><circle cx="138" cy="${ny + 21}" r="4" fill="#D94A3D"/>` : ""}
    ${mood === "sleep" ? `<g fill="${ink}" font-family="sans-serif" font-weight="700"><text x="156" y="40" font-size="20">z</text><text x="172" y="24" font-size="14">z</text></g>` : ""}
    ${mood === "cheer" ? `<g fill="#F07C9A" stroke="${ink}" stroke-width="1.2"><path d="M28 44 c-4 -6 -12 -2 -8 4 l8 8 l8 -8 c4 -6 -4 -10 -8 -4 Z"/><path d="M172 56 c-3 -5 -10 -2 -7 3 l7 7 l7 -7 c3 -5 -4 -8 -7 -3 Z"/></g>` : ""}
    ${stage >= 4 && deco ? `<path d="M24 72 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z M172 84 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z" fill="#C6DD3A"/>` : ""}`;
  return `<svg class="cat-svg" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="${label || `${c.name}，${MOOD_NAMES[mood] || ""}`}"${sick ? ' style="filter:saturate(.45) brightness(1.03)"' : ""}>
<defs>${_defs(id, c)}<clipPath id="${id}h"><path d="${head}"/></clipPath><clipPath id="${id}b"><path d="${body}"/></clipPath></defs>
<ellipse cx="100" cy="192" rx="${bw + 30}" ry="6" fill="#000" opacity=".1"/>
<g filter="url(#${id}r)">
${strokeBrush(tail, c.tail, ink, long ? 17 : 13)}${c.stripes ? `<path d="${tail}" fill="none" stroke="${c.stripes}" stroke-width="${long ? 17 : 13}" stroke-dasharray="5 9"/>` : ""}<circle cx="${100 + bw + 34}" cy="100" r="${long ? 9.5 : 7}" fill="${c.tailTip}"/>
${brush(body, bodyCol, ink)}<g clip-path="url(#${id}b)">${bodyPat}</g>
${legs}${paws}
${fluff}
${brush(earL, c.ear, ink, -2, 1.6)}${brush(earR, c.ear, ink, -2, 1.6)}${earIn}${tufts}
${brush(head, face, ink, -3, 2.4)}<g clip-path="url(#${id}h)">${headPat}</g>
${long ? `<path d="M${100 - 10} ${hy - 44} q4 -8 10 -2 q4 -8 10 2" fill="${c.cap || face}" stroke="${ink}" stroke-width="1.2"/>` : ""}
</g>
${eyes}${brows}${nose}${mouth}${whisk}${blush}${bell}${bow}${crown}${extras}
</svg>`;
}

/* ---------- side view (walking / running / jumping / eating), facing right ---------- */
function catSideSVG({ breed = "ragdoll", stage = 2, size = 120, label = "", eat = false } = {}) {
  const c = BREEDS[breed] || BREEDS.ragdoll;
  const id = "s" + (++_uid);
  stage = Math.max(1, Math.min(4, stage | 0 || 1));
  const ink = inkOf(c), long = c.fur === "long", fat = c.fat ? 5 : 0;
  const by = 98, bry = 24 + stage * 2 + fat, x0 = 50, x1 = 166;
  const body = `M${x0} ${by} C${x0} ${by - bry - 6} ${x0 + 40} ${by - bry - 4} ${(x0 + x1) / 2} ${by - bry} C${x1 - 20} ${by - bry - 2} ${x1 + 8} ${by - bry + 6} ${x1 + 4} ${by + 2} C${x1} ${by + bry} ${x0 + 30} ${by + bry + 2} ${x0 + 10} ${by + bry - 6} C${x0 - 2} ${by + bry - 12} ${x0} ${by + 8} ${x0} ${by} Z`;
  const legCol = c.points || c.body, far = shadeHex(legCol, 0.8);
  const L = 50 - stage * 1.5;
  const leg = (x, cls, col, pawCol) => `<g class="leg ${cls}">${brush(`M${x - 8} ${by} Q${x} ${by - 4} ${x + 8} ${by} L${x + 7} ${by + L} Q${x} ${by + L + 4} ${x - 7} ${by + L} Z`, col, ink, -1.6, 1.4)}<ellipse cx="${x + 3}" cy="${by + L}" rx="10" ry="6" fill="${pawCol}" stroke="${ink}" stroke-width="1.5"/></g>`;
  const hx = x1 + 4, hy = 66, hw = 34 + stage + fat * 0.5;
  const head = `M${hx - hw} ${hy + 4} C${hx - hw} ${hy - 26} ${hx - hw * 0.5} ${hy - 34} ${hx} ${hy - 34} C${hx + hw * 0.5} ${hy - 34} ${hx + hw} ${hy - 26} ${hx + hw} ${hy + 4} C${hx + hw} ${hy + 26} ${hx + hw * 0.5} ${hy + 32} ${hx} ${hy + 32} C${hx - hw * 0.5} ${hy + 32} ${hx - hw} ${hy + 26} ${hx - hw} ${hy + 4} Z`;
  const ears = c.ears === "fold" ? `M${hx - hw * 0.8} ${hy - 20} Q${hx - hw * 0.7} ${hy - 40} ${hx - hw * 0.25} ${hy - 32} Z M${hx + hw * 0.8} ${hy - 20} Q${hx + hw * 0.7} ${hy - 40} ${hx + hw * 0.25} ${hy - 32} Z`
    : `M${hx - hw * 0.92} ${hy - 10} L${hx - hw * 0.76} ${hy - 52} L${hx - hw * 0.2} ${hy - 30} Z M${hx + hw * 0.92} ${hy - 10} L${hx + hw * 0.76} ${hy - 52} L${hx + hw * 0.2} ${hy - 30} Z`;
  const tail = `M${x0 + 6} ${by - 10} C${x0 - 30} ${by - 14} ${x0 - 30} ${by - 50} ${x0 - 14} ${by - 66} C${x0 - 6} ${by - 74} ${x0 + 6} ${by - 70} ${x0 + 4} ${by - 62}`;
  const ex = 14, ey = hy + 2;
  const eyes = eat ? `<path d="M${hx - ex - 9} ${ey + 2} Q${hx - ex} ${ey + 8} ${hx - ex + 9} ${ey + 2} M${hx + ex - 9} ${ey + 2} Q${hx + ex} ${ey + 8} ${hx + ex + 9} ${ey + 2}" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>`
    : _eye(hx - ex, ey, 0.72, c.iris[0], ink, "calm", c.maskL || c.base, -1) + _eye(hx + ex, ey, 0.72, c.iris[1], ink, "calm", c.maskR || c.base, 1);
  const ny = hy + 16;
  const headPat = `${c.cap ? `<path d="M${hx - hw - 4} ${hy + 2} C${hx - hw} ${hy - 40} ${hx + hw} ${hy - 40} ${hx + hw + 4} ${hy + 2} C${hx + hw * 0.5} ${hy - 6} ${hx + 8} ${hy - 12} ${hx} ${hy - 15} C${hx - 8} ${hy - 12} ${hx - hw * 0.5} ${hy - 6} ${hx - hw - 4} ${hy + 2} Z" fill="${c.cap}"/>` : ""}
    ${c.maskL ? `<ellipse cx="${hx - 16}" cy="${hy + 2}" rx="15" ry="13" fill="${c.maskL}"/>` : ""}${c.maskR ? `<ellipse cx="${hx + 16}" cy="${hy + 2}" rx="15" ry="13" fill="${c.maskR}"/>` : ""}
    ${c.blaze ? `<path d="M${hx} ${hy - 22} L${hx - (c.blazeThin ? 4 : 7)} ${hy + 10} L${hx + (c.blazeThin ? 4 : 7)} ${hy + 10} Z" fill="${c.blaze}"/>` : ""}
    ${c.muzzle ? `<path d="M${hx - 17} ${hy + 16} Q${hx} ${hy + 2} ${hx + 17} ${hy + 16} Q${hx + 15} ${hy + 30} ${hx} ${hy + 32} Q${hx - 15} ${hy + 30} ${hx - 17} ${hy + 16} Z" fill="${c.muzzle}"/>` : ""}
    ${c.points ? `<ellipse cx="${hx}" cy="${hy + 10}" rx="22" ry="20" fill="${c.points}" opacity=".85"/>` : ""}
    ${c.stripes ? `<path d="M${hx - 7} ${hy - 32} l2 10 M${hx} ${hy - 34} v12 M${hx + 7} ${hy - 32} l-2 10" stroke="${c.stripes}" stroke-width="3.5" stroke-linecap="round"/>` : ""}`;
  const bodyPat = `${c.cap && !c.stripes ? `<path d="M${x0 - 4} ${by + 2} C${x0} ${by - bry * 2.2} ${x1} ${by - bry * 2.2} ${x1 + 8} ${by - 2} C${x1 - 30} ${by - 8} ${x0 + 30} ${by - 6} ${x0 - 4} ${by + 2} Z" fill="${c.cap}"/>` : ""}
    ${c.stripes ? `<g stroke="${c.stripes}" stroke-width="5" stroke-linecap="round" fill="none">${[0, 1, 2, 3].map(i => `<path d="M${x0 + 18 + i * 22} ${by - bry - 2} q6 14 0 24"/>`).join("")}</g>` : ""}
    ${(c.patches || []).map(([, , rx, ry, col], i) => `<ellipse cx="${x0 + 32 + i * 34}" cy="${by - 8 + i * 4}" rx="${rx}" ry="${ry}" fill="${col}"/>`).join("")}
    <path d="M${x1 - 46} ${by + bry + 4} Q${x1 - 30} ${by + 2} ${x1 + 6} ${by - 4} L${x1 + 8} ${by + bry} Z" fill="${c.chest}" opacity="${c.chest === c.body ? 0 : 1}"/>`;
  return `<svg class="cat-side" width="${size}" height="${size * 0.75}" viewBox="0 0 240 180" role="img" aria-label="${label || c.name + (eat ? "，吃饭中" : "，走路中")}">
<defs>${_defs(id, c)}<clipPath id="${id}b"><path d="${body}"/></clipPath><clipPath id="${id}k"><path d="${head}"/></clipPath></defs>
<ellipse cx="${(x0 + x1) / 2 + 10}" cy="${by + L + 6}" rx="${(x1 - x0) / 2 + 26}" ry="6" fill="#000" opacity=".1"/>
<g filter="url(#${id}r)">
<g class="tail" style="transform-origin:${x0 + 6}px ${by - 10}px">${strokeBrush(tail, c.tail, ink, long ? 16 : 12)}${c.stripes ? `<path d="${tail}" fill="none" stroke="${c.stripes}" stroke-width="${long ? 16 : 12}" stroke-dasharray="5 9"/>` : ""}<circle cx="${x0 + 4}" cy="${by - 62}" r="${long ? 9 : 6.5}" fill="${c.tailTip}"/></g>
${leg(x0 + 20, "lb far", far, shadeHex(c.paw, 0.85))}${leg(x1 - 24, "la far", far, shadeHex(c.paw, 0.85))}
<g class="bodyg">${brush(body, c.body, ink)}<g clip-path="url(#${id}b)">${bodyPat}</g></g>
${leg(x0 + 34, "la near", legCol, c.paw)}${leg(x1 - 10, "lb near", legCol, c.paw)}
<g class="headg${eat ? " chewing" : ""}" style="transform-origin:${hx - 26}px ${hy + 30}px">
${c.mane || long ? `<circle cx="${hx}" cy="${hy + 8}" r="${hw + (c.mane ? 12 : 4)}" fill="${c.mane || c.chest}" opacity="${c.mane ? 1 : .9}"/>` : ""}
${brush(ears, c.ear, ink, -1.6, 1.4)}${c.ears === "fold" ? "" : `<path d="M${hx - hw * 0.8} ${hy - 16} L${hx - hw * 0.72} ${hy - 42} L${hx - hw * 0.36} ${hy - 28} Z M${hx + hw * 0.8} ${hy - 16} L${hx + hw * 0.72} ${hy - 42} L${hx + hw * 0.36} ${hy - 28} Z" fill="${ink}" opacity=".75"/>`}
${c.ears === "tuft" ? `<path d="M${hx - hw * 0.76} ${hy - 50} l-3 -11 l7 8 Z M${hx + hw * 0.76} ${hy - 50} l3 -11 l-7 8 Z" fill="${ink}"/>` : ""}
${brush(head, c.base, ink, -2.4, 2)}<g clip-path="url(#${id}k)">${headPat}</g>
${eyes}
<path d="M${hx - 4} ${ny - 1} L${hx + 4} ${ny - 1} L${hx} ${ny + 3.5} Z" fill="${c.nose}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M${hx} ${ny + 3} v3 M${hx} ${ny + 6} Q${hx - 3} ${ny + 9} ${hx - 6} ${ny + 7} M${hx} ${ny + 6} Q${hx + 3} ${ny + 9} ${hx + 6} ${ny + 7}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
<path d="M${hx + 20} ${ny + 2} l24 -4 M${hx + 20} ${ny + 6} l22 3 M${hx - 20} ${ny + 2} l-20 -3" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/>
${stage >= 3 ? `<g transform="translate(${hx + hw * 0.6} ${hy - 30})"><path d="M0 0 l-10 -7 q-3 7 0 14 Z M0 0 l10 -7 q3 7 0 14 Z" fill="#F07C9A" stroke="${ink}" stroke-width="1.2"/><circle r="3" fill="#D9557A"/></g>` : ""}
</g>
${stage >= 2 ? `<path d="M${hx - 26} ${hy + 26} Q${hx - 14} ${hy + 38} ${hx + 4} ${hy + 32}" fill="none" stroke="#D9534F" stroke-width="5" stroke-linecap="round"/><circle cx="${hx - 10}" cy="${hy + 37}" r="5" fill="#F2C14E" stroke="${ink}" stroke-width="1.2"/>` : ""}
</g>
</svg>`;
}

/* ---------- lying down (loaf), facing right; asleep unless awake ---------- */
function catLieSVG({ breed = "ragdoll", stage = 2, size = 120, label = "", awake = false } = {}) {
  const c = BREEDS[breed] || BREEDS.ragdoll;
  const id = "l" + (++_uid);
  stage = Math.max(1, Math.min(4, stage | 0 || 1));
  const ink = inkOf(c), long = c.fur === "long", fat = c.fat ? 5 : 0;
  const bx = 106, by = 112, brx = 60 + stage * 4 + fat, bry = 28 + stage * 2 + fat;
  const body = `M${bx - brx} ${by + bry} C${bx - brx - 6} ${by - 4} ${bx - brx + 20} ${by - bry - 4} ${bx} ${by - bry} C${bx + brx - 16} ${by - bry} ${bx + brx + 4} ${by - 6} ${bx + brx} ${by + bry} Z`;
  const hx = bx + brx - 12, hy = 98, hw = 34 + stage + fat * 0.5;
  const head = `M${hx - hw} ${hy + 4} C${hx - hw} ${hy - 26} ${hx - hw * 0.5} ${hy - 32} ${hx} ${hy - 32} C${hx + hw * 0.5} ${hy - 32} ${hx + hw} ${hy - 26} ${hx + hw} ${hy + 4} C${hx + hw} ${hy + 24} ${hx + hw * 0.5} ${hy + 30} ${hx} ${hy + 30} C${hx - hw * 0.5} ${hy + 30} ${hx - hw} ${hy + 24} ${hx - hw} ${hy + 4} Z`;
  const ears = c.ears === "fold" ? `M${hx - hw * 0.8} ${hy - 20} Q${hx - hw * 0.7} ${hy - 38} ${hx - hw * 0.25} ${hy - 30} Z M${hx + hw * 0.8} ${hy - 20} Q${hx + hw * 0.7} ${hy - 38} ${hx + hw * 0.25} ${hy - 30} Z`
    : `M${hx - hw * 0.92} ${hy - 10} L${hx - hw * 0.76} ${hy - 50} L${hx - hw * 0.2} ${hy - 28} Z M${hx + hw * 0.92} ${hy - 10} L${hx + hw * 0.76} ${hy - 50} L${hx + hw * 0.2} ${hy - 28} Z`;
  const tail = `M${bx - brx + 8} ${by + bry - 4} Q${bx - brx - 14} ${by + bry + 8} ${bx - 20} ${by + bry + 8} Q${bx + 30} ${by + bry + 8} ${bx + 46} ${by + bry + 2}`;
  const ex = 14, ey = hy + 4, ny = hy + 17;
  const eyes = awake ? _eye(hx - ex, ey, 0.7, c.iris[0], ink, "calm", c.maskL || c.base, -1) + _eye(hx + ex, ey, 0.7, c.iris[1], ink, "calm", c.maskR || c.base, 1)
    : `<path d="M${hx - ex - 9} ${ey} Q${hx - ex} ${ey + 6} ${hx - ex + 9} ${ey} M${hx + ex - 9} ${ey} Q${hx + ex} ${ey + 6} ${hx + ex + 9} ${ey}" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>`;
  const headPat = `${c.cap ? `<path d="M${hx - hw - 4} ${hy + 4} C${hx - hw} ${hy - 38} ${hx + hw} ${hy - 38} ${hx + hw + 4} ${hy + 4} C${hx + hw * 0.5} ${hy - 4} ${hx + 8} ${hy - 10} ${hx} ${hy - 13} C${hx - 8} ${hy - 10} ${hx - hw * 0.5} ${hy - 4} ${hx - hw - 4} ${hy + 4} Z" fill="${c.cap}"/>` : ""}
    ${c.maskL ? `<ellipse cx="${hx - 16}" cy="${hy + 4}" rx="15" ry="13" fill="${c.maskL}"/>` : ""}${c.maskR ? `<ellipse cx="${hx + 16}" cy="${hy + 4}" rx="15" ry="13" fill="${c.maskR}"/>` : ""}
    ${c.blaze ? `<path d="M${hx} ${hy - 20} L${hx - 5} ${hy + 12} L${hx + 5} ${hy + 12} Z" fill="${c.blaze}"/>` : ""}
    ${c.muzzle ? `<path d="M${hx - 17} ${hy + 18} Q${hx} ${hy + 4} ${hx + 17} ${hy + 18} Q${hx + 15} ${hy + 30} ${hx} ${hy + 31} Q${hx - 15} ${hy + 30} ${hx - 17} ${hy + 18} Z" fill="${c.muzzle}"/>` : ""}
    ${c.points ? `<ellipse cx="${hx}" cy="${hy + 12}" rx="22" ry="20" fill="${c.points}" opacity=".85"/>` : ""}
    ${c.stripes ? `<path d="M${hx - 7} ${hy - 30} l2 10 M${hx} ${hy - 32} v12 M${hx + 7} ${hy - 30} l-2 10" stroke="${c.stripes}" stroke-width="3.5" stroke-linecap="round"/>` : ""}`;
  const bodyPat = `${c.cap && !c.stripes ? `<path d="M${bx - brx - 4} ${by + 8} C${bx - brx} ${by - bry * 2.3} ${bx + brx} ${by - bry * 2.3} ${bx + brx + 4} ${by + 4} C${bx + 20} ${by - 4} ${bx - 30} ${by - 2} ${bx - brx - 4} ${by + 8} Z" fill="${c.cap}"/>` : ""}
    ${c.stripes ? `<g stroke="${c.stripes}" stroke-width="5" stroke-linecap="round" fill="none">${[0, 1, 2, 3].map(i => `<path d="M${bx - brx + 24 + i * 22} ${by - bry} q6 14 0 26"/>`).join("")}</g>` : ""}
    ${(c.patches || []).map(([, , rx, ry, col], i) => `<ellipse cx="${bx - 24 + i * 30}" cy="${by - 6 + i * 4}" rx="${rx}" ry="${ry}" fill="${col}"/>`).join("")}`;
  return `<svg class="cat-lie" width="${size}" height="${size * 0.65}" viewBox="0 0 240 156" role="img" aria-label="${label || c.name + (awake ? "，趴着" : "，趴着睡觉")}">
<defs>${_defs(id, c)}<clipPath id="${id}b"><path d="${body}"/></clipPath><clipPath id="${id}k"><path d="${head}"/></clipPath></defs>
<ellipse cx="${bx + 8}" cy="${by + bry + 6}" rx="${brx + 28}" ry="6" fill="#000" opacity=".1"/>
<g filter="url(#${id}r)">
<g class="breath" style="transform-origin:${bx}px ${by + bry}px">${brush(body, c.body, ink)}<g clip-path="url(#${id}b)">${bodyPat}</g></g>
${strokeBrush(tail, c.tail, ink, long ? 15 : 12)}<circle cx="${bx + 46}" cy="${by + bry + 2}" r="${long ? 8.5 : 6.5}" fill="${c.tailTip}"/>
<ellipse cx="${hx - 6}" cy="${by + bry - 2}" rx="16" ry="7.5" fill="${c.points || c.paw}" stroke="${ink}" stroke-width="1.5"/><ellipse cx="${hx + 18}" cy="${by + bry}" rx="14" ry="7" fill="${c.points || c.paw}" stroke="${ink}" stroke-width="1.5"/>
<g class="headg">
${c.mane || long ? `<circle cx="${hx}" cy="${hy + 8}" r="${hw + (c.mane ? 12 : 4)}" fill="${c.mane || c.chest}"/>` : ""}
${brush(ears, c.ear, ink, -1.6, 1.4)}${c.ears === "fold" ? "" : `<path d="M${hx - hw * 0.8} ${hy - 16} L${hx - hw * 0.72} ${hy - 40} L${hx - hw * 0.36} ${hy - 26} Z M${hx + hw * 0.8} ${hy - 16} L${hx + hw * 0.72} ${hy - 40} L${hx + hw * 0.36} ${hy - 26} Z" fill="${ink}" opacity=".75"/>`}
${brush(head, c.base, ink, -2.4, 2)}<g clip-path="url(#${id}k)">${headPat}</g>
</g>
</g>
${eyes}
<path d="M${hx - 4} ${ny - 1} L${hx + 4} ${ny - 1} L${hx} ${ny + 3.5} Z" fill="${c.nose}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M${hx} ${ny + 3} v2.5 M${hx} ${ny + 5.5} Q${hx - 3} ${ny + 8} ${hx - 6} ${ny + 6} M${hx} ${ny + 5.5} Q${hx + 3} ${ny + 8} ${hx + 6} ${ny + 6}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>
<path d="M${hx + 20} ${ny + 2} l22 -4 M${hx + 20} ${ny + 6} l20 3 M${hx - 20} ${ny + 2} l-20 -4 M${hx - 20} ${ny + 6} l-18 3" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/>
${stage >= 3 ? `<g transform="translate(${hx + hw * 0.6} ${hy - 28})"><path d="M0 0 l-10 -7 q-3 7 0 14 Z M0 0 l10 -7 q3 7 0 14 Z" fill="#F07C9A" stroke="${ink}" stroke-width="1.2"/><circle r="3" fill="#D9557A"/></g>` : ""}
${awake ? "" : `<g class="zzz" fill="${ink}" font-family="sans-serif" font-weight="700"><text x="${hx + 28}" y="${hy - 38}" font-size="18">z</text><text x="${hx + 42}" y="${hy - 54}" font-size="13">z</text></g>`}
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

/* ========== v2: 3D-rendered cats ==========
   The breeds below have soft 3D artwork (img/cats); 小橘 (orange) also has a full pose set (img/pose).
   catSVG / catSideSVG / catLieSVG keep their signatures, so every page picks the art up automatically;
   breeds chosen before v2 that have no artwork fall back to the old flat drawings. */
const V2_BREEDS = [
  ["orange", "橘白", "活泼贪吃，学得越多胖得越快", "orange"],
  ["british", "英短蓝猫", "圆脸胖嘟嘟，橙色大眼睛，稳重安静", "british"],
  ["bluewhite", "蓝白长毛", "灰蓝长毛配白围脖，温柔黏人", "bluewhite"],
  ["ragdoll", "布偶", "蓝眼睛、重点色，抱起来软软的", "ragdoll"],
  ["amshort", "美短", "银色虎斑，精力旺盛的小运动员", "amshort"],
  ["siamese", "暹罗", "深色小脸，话很多，会一直陪你聊", "siamese"],
  ["maine", "缅因", "大个子，耳尖簇毛，温柔的巨人", "maine"],
  ["silver", "灰白长毛", "绿眼睛，蓬松安静，喜欢晒太阳", "silver"],
  ["persian", "波斯", "雪白长毛，慢悠悠的贵族", "lion"],
  ["bengal", "豹猫", "豹纹花色，好奇心爆棚", "lihua"],
  ["russian", "俄罗斯蓝猫", "来自俄罗斯的绿眼睛蓝猫，最懂俄语", "british"],
  ["abyssinian", "阿比西尼亚", "大耳朵、金棕色，爱爬高", "golden"],
  ["birman", "伯曼", "戴着白手套的蓝眼睛长毛猫", "ragdoll"],
  ["siberian", "西伯利亚森林猫", "俄罗斯国猫，厚厚的毛不怕冷", "maine"],
  ["white", "白色长毛", "一身雪白，安静优雅", "white"],
  ["devon", "德文卷毛", "大耳朵卷卷毛，像小精灵", "fold"],
];
V2_BREEDS.forEach(([k, name, desc, like]) => {
  const SHORT = { russian: "俄罗斯蓝", abyssinian: "阿比西尼亚", siberian: "西伯利亚" };
  BREEDS[k] = Object.assign({}, BREEDS[k] || BREEDS[like], { name, short: SHORT[k] || name, desc });
});
const PICK_BREEDS = V2_BREEDS.map(b => b[0]);
const CAT3D = Object.fromEntries(PICK_BREEDS.map(k => [k, `img/cats/${k}.webp`]));
const POSE3D = { walk: "img/pose/walk.webp", eat: "img/pose/eat.webp", sleep: "img/pose/sleep.webp", ball: "img/pose/ball.webp",
  crouch: "img/pose/crouch.webp", pounce: "img/pose/pounce.webp", hero: "img/pose/hero.webp" };
const STAGE_K = [0, 0.78, 0.86, 0.94, 1];           // the kitten grows with its stage
const _flatCat = catSVG, _flatSide = catSideSVG, _flatLie = catLieSVG;
const has3D = b => !!CAT3D[b];
function cat3D(src, { size, stage = 2, cls = "", label = "", flip = false, z = false }) {
  const k = STAGE_K[Math.max(1, Math.min(4, stage | 0 || 1))];
  return `<span class="c3d ${cls}" style="--s:${Math.round(size)}px;--k:${k}"${label ? ` role="img" aria-label="${label}"` : ""}>` +
    `<img src="${src}" alt="" draggable="false"${flip ? ' class="flip"' : ""}>${z ? '<i class="c3d-z" aria-hidden="true">z</i>' : ""}</span>`;
}
catSVG = function (o = {}) {
  const { breed = "orange", mood = "happy" } = o;
  if (!has3D(breed)) return _flatCat(o);
  const orange = breed === "orange";
  if (mood === "sleep") return orange ? cat3D(POSE3D.sleep, { ...o, cls: "m-sleep" }) : cat3D(CAT3D[breed], { ...o, cls: "m-sleep", z: true });
  if (mood === "eat" && orange) return cat3D(POSE3D.eat, { ...o, cls: "m-eat" });
  if (mood === "walk" && orange) return cat3D(POSE3D.walk, { ...o, cls: "m-walk" });
  return cat3D(CAT3D[breed], { ...o, cls: "m-" + mood });
};
catSideSVG = function (o = {}) {
  const { breed = "orange", eat = false } = o;
  if (!has3D(breed)) return _flatSide(o);
  if (breed === "orange") return cat3D(eat ? POSE3D.eat : POSE3D.walk, { ...o, cls: "side" + (eat ? " m-eat" : ""), flip: true });
  return cat3D(CAT3D[breed], { ...o, size: (o.size || 120) * 0.8, cls: "side" + (eat ? " m-eat" : "") });
};
catLieSVG = function (o = {}) {
  const { breed = "orange", awake = false } = o;
  if (!has3D(breed)) return _flatLie(o);
  if (breed === "orange") return cat3D(awake ? POSE3D.ball : POSE3D.sleep, { ...o, cls: awake ? "m-lie" : "m-sleep" });
  return cat3D(CAT3D[breed], { ...o, size: (o.size || 120) * 0.8, cls: awake ? "m-lie" : "m-sleep", z: !awake });
};

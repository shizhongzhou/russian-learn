"use strict";
/* ========== 猫猫俄语通 — cat & room drawings, meow sound ========== */

const BREEDS = {
  ragdoll: { name: "布偶猫", short: "布偶", desc: "灰白长毛、温柔黏人", body: "#9A9CA4", base: "#FBF8F4", cap: "#767982", maskL: "#7F828B", maskR: "#7F828B", blaze: "#FBF8F4", chest: "#FBF8F4", paw: "#FBF8F4", toe: "#D9CFC8", ear: "#6A6D76", tail: "#7F828B", tailTip: "#FBF8F4", iris: "#3D5A8A", nose: "#F49AA4", whisker: "#CFC8C0" },
  orange:  { name: "橘猫", short: "橘猫", desc: "能吃能睡，长胖最快", body: "#F0A961", base: "#F4B572", cap: "#E0913F", maskL: "#F4B572", maskR: "#F4B572", blaze: "#FCEBD6", chest: "#FCEBD6", paw: "#FCEBD6", toe: "#E8C8A4", ear: "#E0913F", tail: "#E0913F", tailTip: "#FCEBD6", iris: "#C9A13A", nose: "#EE8C93", whisker: "#9B7454" },
  british: { name: "英短蓝猫", short: "英短", desc: "圆脸铜色眼睛，稳重安静", body: "#97A3AF", base: "#A0ACB7", cap: "#8E9BA8", maskL: "#A0ACB7", maskR: "#A0ACB7", blaze: "#A9B4BF", chest: "#AEB8C2", paw: "#A0ACB7", toe: "#8693A0", ear: "#87949F", tail: "#8E9BA8", tailTip: "#8E9BA8", iris: "#E09235", nose: "#7C8796", whisker: "#E7EBEF" },
  calico:  { name: "三花猫", short: "三花", desc: "三种花色，性格机灵", body: "#FCF9F5", base: "#FCF9F5", cap: "#E9A05A", maskL: "#4A4241", maskR: "#E9A05A", blaze: "#FCF9F5", chest: "#FCF9F5", paw: "#FCF9F5", toe: "#E3D6CA", ear: "#4A4241", tail: "#4A4241", tailTip: "#E9A05A", iris: "#A9B23A", nose: "#F49AA4", whisker: "#AFA295" },
  black:   { name: "黑猫", short: "黑猫", desc: "金色眼睛，夜里最有精神", body: "#3F393B", base: "#463F42", cap: "#3B3537", maskL: "#463F42", maskR: "#463F42", blaze: "#463F42", chest: "#4E4649", paw: "#463F42", toe: "#2E292A", ear: "#353031", tail: "#3B3537", tailTip: "#3B3537", iris: "#E8C64A", nose: "#9A7378", whisker: "#C8C0C2" },
};
const MOOD_NAMES = { happy: "开心", walk: "散步中", cheer: "欢呼", sleep: "睡觉", eat: "吃饭中", hungry: "饿了", sick: "生病了" };

/* returns an SVG string */
function catSVG({ breed = "ragdoll", stage = 2, mood = "happy", size = 120, label = "" } = {}) {
  const c = BREEDS[breed] || BREEDS.ragdoll;
  stage = Math.max(1, Math.min(4, stage | 0 || 1));
  const hungry = mood === "hungry";
  const bodyRx = 30 + stage * 8 - (hungry ? 10 : 0), bodyRy = 28 + stage * 3, bodyCy = 186 - bodyRy + 6;
  const headRx = 60 + stage * 1.5, L = 100 - headRx, R = 100 + headRx;
  let bib = `M${100 - bodyRx * 0.6} ${bodyCy - bodyRy * 0.55}`;
  for (let i = 0; i < 6; i++) {
    const x0 = 100 - bodyRx * 0.6 + bodyRx * 1.2 * (i / 6), x1 = 100 - bodyRx * 0.6 + bodyRx * 1.2 * ((i + 1) / 6);
    bib += ` Q${(x0 + x1) / 2} ${bodyCy - bodyRy * 0.55 + (i % 2 ? 9 : 5)} ${x1} ${bodyCy - bodyRy * 0.55}`;
  }
  bib += ` Q${100 + bodyRx * 0.55} ${bodyCy + bodyRy * 0.7} 100 ${bodyCy + bodyRy * 0.75} Q${100 - bodyRx * 0.55} ${bodyCy + bodyRy * 0.7} ${100 - bodyRx * 0.6} ${bodyCy - bodyRy * 0.55} Z`;
  const f = 4 + stage * 2;
  const cheek = `M${L + 8} 100 L${L - f} 112 L${L + 4} 114 L${L - f + 2} 126 L${L + 18} 126 Z M${R - 8} 100 L${R + f} 112 L${R - 4} 114 L${R + f - 2} 126 L${R - 18} 126 Z`;
  const cap = `M${L + 2} 92 Q100 -12 ${R - 2} 92 Q124 74 110 80 L100 74 L90 80 Q76 74 ${L + 2} 90 Z`;
  const tx = 100 + bodyRx - 6;
  const tail = `M${tx} 178 Q${tx + 34} 172 ${tx + 26} 136 Q${tx + 20} 120 ${tx + 32} 116`;
  const pawL = 100 - bodyRx * 0.42, pawR = 100 + bodyRx * 0.42;
  const open = mood === "walk" || mood === "happy" || hungry;
  const eyeLine = mood === "sick" ? "M62 102 Q74 108 86 102 M114 102 Q126 108 138 102"
    : mood === "sleep" ? "M62 100 Q74 110 86 100 M114 100 Q126 110 138 100"
    : "M62 104 Q74 90 86 104 M114 104 Q126 90 138 104";
  const mouth = mood === "eat" ? "M92 120 Q100 128 108 120" : mood === "cheer" ? "M90 120 Q100 136 110 120 Q100 124 90 120 Z"
    : (mood === "sick" || hungry) ? "M92 124 Q100 120 108 124" : "M88 119 Q94 126 100 119 Q106 126 112 119";
  const blush = (mood === "sick" || hungry) ? 0.15 : 0.45 + stage * 0.12;
  const star = "l2 -4 l2 4 l4 1 l-4 1 l-2 4 l-2 -4 l-4 -1 Z";
  const aria = label || `${c.name}，${MOOD_NAMES[mood] || ""}`;
  return `<svg class="cat-svg" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="${aria}"${mood === "sick" ? ' style="filter:saturate(.35) brightness(1.04)"' : ""}>
<ellipse cx="100" cy="192" rx="${bodyRx + 18}" ry="6" fill="#000" opacity=".08"/>
<path d="${tail}" fill="none" stroke="${c.tail}" stroke-width="15" stroke-linecap="round"/><circle cx="${tx + 32}" cy="116" r="9" fill="${c.tailTip}"/>
<ellipse cx="100" cy="${bodyCy}" rx="${bodyRx}" ry="${bodyRy}" fill="${c.body}"/>
<path d="${bib}" fill="${c.chest}"/>
<ellipse cx="${pawL}" cy="186" rx="14" ry="10" fill="${c.paw}"/><ellipse cx="${pawR}" cy="186" rx="14" ry="10" fill="${c.paw}"/>
<path d="M${pawL - 4} 190 v-4 M${pawL + 4} 190 v-4 M${pawR - 4} 190 v-4 M${pawR + 4} 190 v-4" stroke="${c.toe}" stroke-width="1.6" stroke-linecap="round"/>
${stage >= 2 ? `<path d="M70 140 Q100 152 130 140" fill="none" stroke="#D9534F" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="151" r="7.5" fill="#F2C14E" stroke="#C9952A" stroke-width="1.5"/><path d="M96 152 H104 M100 152 V156" stroke="#9A6D12" stroke-width="1.5" stroke-linecap="round"/>` : ""}
<path d="M46 70 Q38 24 52 20 Q66 22 88 46 Z" fill="${c.ear}"/><path d="M154 70 Q162 24 148 20 Q134 22 112 46 Z" fill="${c.ear}"/>
<path d="M54 58 Q50 34 56 32 Q64 34 78 48 Z" fill="#F7B9BC"/><path d="M146 58 Q150 34 144 32 Q136 34 122 48 Z" fill="#F7B9BC"/>
<path d="${cheek}" fill="${c.base}"/>
<ellipse cx="100" cy="94" rx="${headRx}" ry="54" fill="${c.base}"/>
<path d="${cap}" fill="${c.cap}"/>
<ellipse cx="72" cy="98" rx="22" ry="20" fill="${c.maskL}" transform="rotate(-14 72 98)"/><ellipse cx="128" cy="98" rx="22" ry="20" fill="${c.maskR}" transform="rotate(14 128 98)"/>
<path d="M100 74 L88 112 Q100 122 112 112 Z" fill="${c.blaze}"/>
<path d="M96 42 Q100 30 106 34 Q101 38 100 46 Z" fill="${c.cap}"/>
${open ? `<ellipse cx="74" cy="100" rx="13" ry="15" fill="${c.iris}"/><ellipse cx="126" cy="100" rx="13" ry="15" fill="${c.iris}"/>
<ellipse cx="74" cy="102" rx="9" ry="11" fill="#1B1718"/><ellipse cx="126" cy="102" rx="9" ry="11" fill="#1B1718"/>
<circle cx="79" cy="95" r="5" fill="#fff"/><circle cx="131" cy="95" r="5" fill="#fff"/><circle cx="70" cy="107" r="2.4" fill="#fff"/><circle cx="122" cy="107" r="2.4" fill="#fff"/>
${stage >= 3 && !hungry ? `<path d="M66 89 ${star}" fill="#fff"/><path d="M118 89 ${star}" fill="#fff"/>` : ""}`
    : `<path d="${eyeLine}" fill="none" stroke="#1B1718" stroke-width="4.5" stroke-linecap="round"/>`}
<path d="M96 112 Q100 109 104 112 Q102 116 100 117 Q98 116 96 112 Z" fill="${c.nose}"/>
<path d="${mouth}" fill="${mood === "cheer" ? "#E76F7C" : "none"}" stroke="#5A4A48" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
<ellipse cx="60" cy="118" rx="11" ry="6.5" fill="#F59AA0" opacity="${blush}"/><ellipse cx="140" cy="118" rx="11" ry="6.5" fill="#F59AA0" opacity="${blush}"/>
<path d="M46 112 L28 108 M46 118 L28 120 M154 112 L172 108 M154 118 L172 120" stroke="${c.whisker}" stroke-width="1.6" stroke-linecap="round"/>
${stage >= 3 && mood !== "sick" && !hungry ? `<path d="M136 40 L122 30 Q118 40 122 50 Z M136 40 L150 30 Q154 40 150 50 Z" fill="#F07C9A"/><circle cx="136" cy="40" r="4.5" fill="#D9557A"/>` : ""}
${stage >= 4 && mood !== "sick" && !hungry ? `<circle cx="72" cy="46" r="6" fill="#fff"/><circle cx="72" cy="46" r="2.6" fill="#F2C14E"/><circle cx="86" cy="40" r="6" fill="#F7A8C4"/><circle cx="86" cy="40" r="2.6" fill="#fff"/><circle cx="100" cy="38" r="6.5" fill="#A8C8F0"/><circle cx="100" cy="38" r="2.8" fill="#fff"/><circle cx="114" cy="40" r="6" fill="#FFE08A"/><circle cx="114" cy="40" r="2.6" fill="#F28C5A"/><path d="M64 50 q4 -4 8 0 M106 34 q4 -4 8 0" stroke="#6DB36D" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M28 70 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z M170 60 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z" fill="#F2C14E"/>` : ""}
${mood === "eat" || hungry ? `<path d="M62 178 H138 Q134 198 100 198 Q66 198 62 178 Z" fill="#D9534F"/><ellipse cx="100" cy="178" rx="38" ry="7" fill="#B8433F"/>${mood === "eat" ? `<circle cx="86" cy="175" r="5" fill="#C9874A"/><circle cx="98" cy="173" r="5" fill="#B87A40"/><circle cx="110" cy="175" r="5" fill="#C9874A"/><circle cx="104" cy="170" r="4.5" fill="#D59658"/>` : ""}` : ""}
${hungry ? `<path d="M160 74 Q166 84 160 90 Q154 84 160 74 Z" fill="#7FB3D9"/><text x="146" y="150" font-size="18" font-family="sans-serif" font-weight="700" fill="#9A4A12">咕～</text><path d="M60 80 L84 86 M140 80 L116 86" stroke="#5A4A48" stroke-width="3" stroke-linecap="round"/>` : ""}
${mood === "sick" ? `<rect x="110" y="120" width="30" height="7" rx="3.5" fill="#fff" stroke="#5A6B7A" stroke-width="1.5" transform="rotate(20 110 120)"/><circle cx="138" cy="132" r="4.5" fill="#D94A3D"/><path d="M162 70 Q168 80 162 86 Q156 80 162 70 Z" fill="#7FB3D9"/><rect x="72" y="52" width="56" height="14" rx="5" fill="#fff" stroke="#A9C4DA" stroke-width="1.5"/>` : ""}
${mood === "sleep" ? `<g fill="#6B7A8A" font-family="sans-serif" font-weight="700"><text x="158" y="48" font-size="22">z</text><text x="176" y="30" font-size="16">z</text></g>` : ""}
${mood === "cheer" ? `<g fill="#F07C9A"><path d="M30 44 c-4 -6 -12 -2 -8 4 l8 8 l8 -8 c4 -6 -4 -10 -8 -4 Z"/><path d="M172 56 c-3 -5 -10 -2 -7 3 l7 7 l7 -7 c3 -5 -4 -8 -7 -3 Z"/></g>` : ""}
</svg>`;
}

/* ---------- room scenes ---------- */
const SCENES = {
  living: { name: "温馨客厅", wall: "#F4E6D6", trim: "#E7CFB4", floor: "#D8B48A", floorLine: "#B98E62", rug: "#E8A3A0" },
  window: { name: "阳光窗台", wall: "#FBF0D6", trim: "#EFD9A8", floor: "#E2C08E", floorLine: "#C49B62", rug: "#9CC9B8" },
  winter: { name: "冬日壁炉", wall: "#E6E9EF", trim: "#C9D1DD", floor: "#C79C72", floorLine: "#A3784F", rug: "#7FA5C9" },
  moscow: { name: "莫斯科阁楼", wall: "#E9DCCB", trim: "#C9AE8E", floor: "#B98C64", floorLine: "#946A47", rug: "#C9564A" },
  night:  { name: "星空屋顶", wall: "#2E3A66", trim: "#46538A", floor: "#5A4F70", floorLine: "#463C5A", rug: "#8E7BC2" },
};
function roomSVG({ scene = "living", tree = 0, decor = {}, label = "" } = {}) {
  const s = SCENES[scene] || SCENES.living;
  const back = {
    living: `<rect x="34" y="40" width="120" height="96" rx="8" fill="#BFE0F2" stroke="#fff" stroke-width="8"/><path d="M94 40 V136 M34 88 H154" stroke="#fff" stroke-width="6"/><circle cx="66" cy="66" r="10" fill="#FFF3C4"/><rect x="186" y="58" width="44" height="34" rx="3" fill="#F6E7D3" stroke="#B8875A" stroke-width="4"/><path d="M196 84 L206 70 L214 80 L220 74 L226 84 Z" fill="#8FBF8A"/>`,
    window: `<rect x="20" y="30" width="260" height="140" rx="10" fill="#CDE9F7" stroke="#fff" stroke-width="8"/><path d="M150 30 V170" stroke="#fff" stroke-width="6"/><circle cx="220" cy="70" r="20" fill="#FFE59A"/><path d="M40 170 L120 214 M100 170 L190 220 M170 170 L250 214" stroke="#FFF4C8" stroke-width="22" opacity=".55"/><rect x="14" y="168" width="272" height="12" rx="4" fill="#E9D3B6"/><path d="M40 168 q6 -30 14 0 M48 168 q-10 -24 -16 -4" stroke="#5E9F5E" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="34" y="150" width="26" height="20" rx="4" fill="#D98B5F"/>`,
    winter: `<rect x="30" y="40" width="110" height="90" rx="8" fill="#DCEAF5" stroke="#fff" stroke-width="8"/><g fill="#fff"><circle cx="50" cy="60" r="2.5"/><circle cx="80" cy="74" r="2.5"/><circle cx="116" cy="58" r="2.5"/><circle cx="64" cy="100" r="2.5"/><circle cx="104" cy="96" r="2.5"/></g><rect x="170" y="96" width="120" height="110" rx="6" fill="#B65A3C"/><rect x="160" y="88" width="140" height="14" rx="4" fill="#8A3F2A"/><rect x="194" y="128" width="72" height="78" rx="36" fill="#3A2522"/><path d="M214 204 q-4 -26 14 -40 q-2 18 10 22 q8 -14 4 -28 q18 20 10 46 Z" fill="#F2A23A"/><path d="M222 204 q0 -14 10 -22 q2 12 10 22 Z" fill="#FFE07A"/>`,
    moscow: `<path d="M0 0 L120 0 L0 110 Z" fill="#7A5A44"/><rect x="130" y="34" width="150" height="110" rx="60" fill="#2E3E66" stroke="#F6E7D3" stroke-width="8"/><path d="M152 144 V112 h18 v32 M186 144 V98 h22 v46 M224 144 V108 h20 v36" fill="#E6C27A"/><path d="M161 112 q-12 -14 0 -26 q12 12 0 26 Z M197 98 q-14 -16 0 -30 q14 14 0 30 Z M234 108 q-12 -14 0 -26 q12 12 0 26 Z" fill="#D9534F"/><g fill="#fff"><circle cx="160" cy="54" r="2"/><circle cx="250" cy="60" r="2"/><circle cx="210" cy="46" r="1.6"/></g>`,
    night: `<rect x="0" y="0" width="390" height="200" fill="#26325C"/><circle cx="300" cy="56" r="24" fill="#FFF1B8"/><circle cx="290" cy="50" r="22" fill="#26325C"/><path d="M40 40 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z M120 70 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z M200 30 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 Z M90 120 l2 -4 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 Z" fill="#FFE59A"/><path d="M0 200 L60 170 L130 186 L200 164 L270 182 L330 168 L390 184 V200 Z" fill="#3A4778"/>`,
  }[scene] || "";
  const t1 = `<rect x="318" y="200" width="18" height="70" rx="4" fill="#E2C69A"/><path d="M318 208 h18 M318 218 h18 M318 228 h18 M318 238 h18 M318 248 h18 M318 258 h18" stroke="#BF9C68" stroke-width="2"/><rect x="296" y="190" width="62" height="12" rx="6" fill="#8FA9C9"/><rect x="300" y="268" width="56" height="12" rx="5" fill="#8FA9C9"/>`;
  const t2 = `<rect x="322" y="120" width="16" height="80" rx="4" fill="#E2C69A"/><path d="M322 130 h16 M322 142 h16 M322 154 h16 M322 166 h16 M322 178 h16 M322 190 h16" stroke="#BF9C68" stroke-width="2"/><rect x="300" y="112" width="70" height="12" rx="6" fill="#8FA9C9"/>`;
  const t3 = `<rect x="272" y="56" width="16" height="140" rx="4" fill="#E2C69A"/><path d="M272 70 h16 M272 86 h16 M272 102 h16 M272 118 h16 M272 134 h16 M272 150 h16 M272 166 h16 M272 182 h16" stroke="#BF9C68" stroke-width="2"/><rect x="300" y="28" width="76" height="56" rx="10" fill="#8FA9C9"/><ellipse cx="338" cy="58" rx="16" ry="14" fill="#5D7499"/><rect x="296" y="82" width="84" height="10" rx="5" fill="#7A93B5"/><rect x="252" y="48" width="56" height="10" rx="5" fill="#8FA9C9"/><path d="M300 92 L322 120 M378 92 L338 120" stroke="#E2C69A" stroke-width="5"/><path d="M250 150 Q270 168 290 150" stroke="#F07C9A" stroke-width="3" fill="#F7C6D2"/>`;
  return `<svg class="room-svg" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label || "猫咪小窝：" + s.name}">
<rect width="390" height="300" fill="${s.wall}"/><path d="M0 0 H390 V18 H0 Z" fill="${s.trim}" opacity=".5"/>
${back}
<rect x="0" y="210" width="390" height="90" fill="${s.floor}"/><path d="M0 210 H390" stroke="${s.trim}" stroke-width="6"/>
<path d="M60 230 H120 M200 248 H280 M20 268 H90 M300 236 H360 M150 280 H230" stroke="${s.floorLine}" stroke-width="2" opacity=".6"/>
<ellipse cx="150" cy="262" rx="110" ry="24" fill="${s.rug}"/><ellipse cx="150" cy="262" rx="88" ry="16" fill="none" stroke="#fff" stroke-width="2" opacity=".5" stroke-dasharray="6 6"/>
<path d="M100 266 H130 Q128 278 115 278 Q102 278 100 266 Z" fill="#D9534F"/><ellipse cx="115" cy="266" rx="15" ry="3.5" fill="#B8433F"/><circle cx="110" cy="264" r="2.6" fill="#C9874A"/><circle cx="118" cy="264" r="2.6" fill="#C9874A"/>
<path d="M136 266 H166 Q164 278 151 278 Q138 278 136 266 Z" fill="#5C93C9"/><ellipse cx="151" cy="266" rx="15" ry="3.5" fill="#9FD0F0"/>
${decor.bed ? `<ellipse cx="62" cy="262" rx="44" ry="18" fill="#C76F5B"/><ellipse cx="62" cy="256" rx="34" ry="11" fill="#F6D9C8"/>` : ""}
${decor.scratch ? `<rect x="236" y="196" width="16" height="64" rx="3" fill="#D9B98A"/><path d="M236 204 h16 M236 212 h16 M236 220 h16 M236 228 h16 M236 236 h16 M236 244 h16 M236 252 h16" stroke="#B8955F" stroke-width="2"/><rect x="226" y="256" width="36" height="8" rx="3" fill="#A97D52"/>` : ""}
${decor.toy ? `<path d="M196 214 Q210 160 232 150" stroke="#8A6A4A" stroke-width="3" fill="none"/><path d="M232 150 q10 6 4 16 q10 -2 10 10" stroke="#F07C9A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="190" cy="276" r="8" fill="#F2C14E"/><path d="M184 272 l12 8 M196 272 l-12 8" stroke="#D9534F" stroke-width="2"/>` : ""}
${decor.fish ? `<rect x="18" y="168" width="58" height="42" rx="10" fill="#BFE6EE" stroke="#fff" stroke-width="3"/><path d="M36 186 q8 -8 16 0 q-8 8 -16 0 Z M52 186 l6 -5 v10 Z" fill="#F28C5A"/><rect x="14" y="208" width="66" height="6" rx="3" fill="#8A6A4A"/>` : ""}
${decor.fountain ? `<rect x="174" y="252" width="22" height="24" rx="6" fill="#E3EEF6" stroke="#5C93C9" stroke-width="2"/><path d="M185 252 q-6 -10 0 -16 q6 6 0 16" fill="#9FD0F0"/>` : ""}
${tree >= 1 ? t1 : ""}${tree >= 2 ? t2 : ""}${tree >= 3 ? t3 : ""}
</svg>`;
}

/* ---------- meow (synthesised, no audio files) ---------- */
let _ac;
function meowSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    _ac = _ac || new AC();
    if (_ac.state === "suspended") _ac.resume();
    const t = _ac.currentTime, o = _ac.createOscillator(), g = _ac.createGain(), f = _ac.createBiquadFilter();
    o.type = "sawtooth"; f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = 2.5;
    o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(860, t + 0.18); o.frequency.linearRampToValueAtTime(480, t + 0.55);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(f); f.connect(g); g.connect(_ac.destination); o.start(t); o.stop(t + 0.62);
  } catch {}
}

"use strict";
/* ========== 宠物俄语通 — pets: 17 cats + 16 dogs, each with 3 growth stages ==========
   Images: img/pets/<key>_<1|2|3>.webp (small → big), cut out from the breed sheets (scripts/matte_imgs.py).
   小橘 (orange) also has motion clips cut from video: img/anim/orange/<clip>.webp (scripts/matte.py).
   The 16 cat keys are the breeds players could already pick, so old saves keep their cat. */
const PET_LIST = [
  // key, kind, name, short, personality
  ["orange", "cat", "橘白猫", "橘白", "活泼贪吃，学得越多胖得越快"],
  ["british", "cat", "英短蓝猫", "英短", "圆脸胖嘟嘟，稳重安静"],
  ["bluewhite", "cat", "蓝白长毛猫", "蓝白", "毛茸茸的白围脖，温柔黏人"],
  ["ragdoll", "cat", "布偶猫", "布偶", "蓝眼睛、重点色，抱起来软软的"],
  ["amshort", "cat", "美国短毛猫", "美短", "银色虎斑，精力旺盛"],
  ["siamese", "cat", "暹罗猫", "暹罗", "话很多，会一直陪你聊"],
  ["maine", "cat", "缅因猫", "缅因", "大个子，温柔的巨人"],
  ["silver", "cat", "灰白长毛猫", "灰白", "蓬松安静，喜欢晒太阳"],
  ["persian", "cat", "波斯猫", "波斯", "雪白长毛，慢悠悠的贵族"],
  ["bengal", "cat", "孟加拉豹猫", "豹猫", "豹纹花色，好奇心爆棚"],
  ["russian", "cat", "俄罗斯蓝猫", "俄蓝", "来自俄罗斯，最懂俄语"],
  ["abyssinian", "cat", "阿比西尼亚猫", "阿比", "大耳朵、金棕色，爱爬高"],
  ["birman", "cat", "伯曼猫", "伯曼", "戴着白手套的蓝眼睛长毛猫"],
  ["siberian", "cat", "西伯利亚森林猫", "西伯利亚", "俄罗斯国猫，厚毛不怕冷"],
  ["white", "cat", "白色长毛猫", "白长毛", "一身雪白，安静优雅"],
  ["devon", "cat", "德文卷毛猫", "德文", "大耳朵卷卷毛，像小精灵"],
  ["tuxedo", "cat", "奶牛猫", "奶牛", "黑白西装配小胡子，戏很多"],
  ["golden", "dog", "金毛寻回犬", "金毛", "暖男一枚，永远开心"],
  ["labrador", "dog", "拉布拉多", "拉布拉多", "聪明听话，最佳学习搭子"],
  ["shiba", "dog", "柴犬", "柴犬", "微笑脸，有点小倔强"],
  ["corgi", "dog", "柯基", "柯基", "小短腿，大屁股，跑得飞快"],
  ["husky", "dog", "哈士奇", "哈士奇", "蓝眼睛，精力无限的拆家王"],
  ["shepherd", "dog", "德国牧羊犬", "德牧", "忠诚可靠，学什么都快"],
  ["samoyed", "dog", "萨摩耶", "萨摩耶", "微笑天使，白白软软"],
  ["poodle", "dog", "贵宾犬", "贵宾", "卷卷毛，优雅又聪明"],
  ["pomeranian", "dog", "博美", "博美", "小毛球，元气满满"],
  ["collie", "dog", "边境牧羊犬", "边牧", "狗狗界的学霸"],
  ["beagle", "dog", "比格犬", "比格", "好奇宝宝，鼻子超灵"],
  ["spaniel", "dog", "可卡犬", "可卡", "长耳朵，温柔爱撒娇"],
  ["frenchie", "dog", "法国斗牛犬", "法斗", "蝙蝠耳，憨憨的小胖子"],
  ["dalmatian", "dog", "斑点狗", "斑点", "一身斑点，活泼好动"],
  ["bernese", "dog", "伯恩山犬", "伯恩山", "三色大熊，稳重温柔"],
  ["dachshund", "dog", "腊肠犬", "腊肠", "长身子短腿，勇敢的小猎犬"],
];
const PETS = Object.fromEntries(PET_LIST.map(([key, kind, name, short, desc]) => [key, { key, kind, name, short, desc }]));
const PET_KEYS = { cat: PET_LIST.filter(p => p[1] === "cat").map(p => p[0]), dog: PET_LIST.filter(p => p[1] === "dog").map(p => p[0]) };
const petOf = key => PETS[key] || PETS.orange;
const isDog = key => petOf(key).kind === "dog";
/* app growth stages 1–4 → art stages 1–3 (幼年 / 少年 / 成年) */
const artStage = st => (st | 0) <= 1 ? 1 : (st | 0) === 2 ? 2 : 3;
const ART_STAGE_NAMES = ["", "幼年", "少年", "成年"];
const petFallbackSrc = (key,st) => `img/pets/${PETS[key] ? key : "orange"}_${artStage(st)}.webp`;
const petSrc = (key, st) => `img/pets/exact/${PETS[key] ? key : "orange"}_${artStage(st)}.png`;
const petK = st => [0, 0.72, 0.86, 1, 1.06][Math.max(1, Math.min(4, st | 0 || 1))];
/* orange cat motion clips (animated WebP with transparency); s = kitten clip, a = adult clip */
const ORANGE_FRAME_HEIGHT = {"treat": 160.77, "whip_small": 152.04, "wand": 101.82, "side_walk": 139.42, "kitten_charge": 116.89, "can": 139.42, "adult_walk": 154.22, "whip_adult": 127.27, "eat_big": 136.59, "whip_front": 144.21, "kitten_sit": 104.92, "kitten_run": 106.67, "cuddle": 176.84, "sleep": 187.71, "adult_sit": 213.33, "ball": 192.0, "side_look": 139.89, "kitten_walk": 131.25, "kitten_lie": 104.92, "adult_lie": 203.17, "eat": 101.82};
const ORANGE_ANIM = {
  walk: { s: "kitten_walk", a: "side_walk" },
  run: { s: "kitten_run", a: "adult_walk" },
  charge: { s: "kitten_charge", a: "adult_lie" },
  sit: { s: "kitten_sit", a: "adult_sit" },
  lie: { s: "kitten_lie", a: "adult_lie" },
  look: { s: "side_look", a: "side_look" },
  sleep: { s: "sleep", a: "sleep" },
  ball: { s: "ball", a: "ball" },
  toy: { s: "wand", a: "wand" },
  eat: { s: "eat", a: "eat_big" },
  can: { s: "can", a: "can" },
  treat: { s: "treat", a: "treat" },
  cuddle: { s: "cuddle", a: "cuddle" },
  whip: { s: "whip_small", a: "whip_adult" },
};
let ANIM_OK = typeof ORANGE_MOTION === "undefined" ? {} : ORANGE_MOTION;               // filled from img/anim/orange/index.json (clips that exist)
fetch("img/anim/orange/index.json").then(r => r.ok ? r.json() : {}).then(j => { ANIM_OK = j || {}; }).catch(() => {});
function animSrc(key, pose, st) {
  if (key !== "orange") return null;
  const a = ORANGE_ANIM[pose]; if (!a) return null;
  const clip = artStage(st) === 1 ? a.s : a.a;
  return ANIM_OK[clip] ? `img/anim/orange/${clip}.webp` : null;
}
/* one pet picture: <span class="pet3d"><img></span>; size = height in px of a grown pet */
function petImg(key, { stage = 2, size = 120, pose = "", cls = "", label = "", flip = false } = {}) {
  const motion = pose && animSrc(key,pose,stage);
  const src = motion || petSrc(key,stage);
  const frameHeight = motion ? ORANGE_FRAME_HEIGHT[motion.split("/").pop().replace(".webp", "")] || 100 : 100;
  const k = petK(stage);
  return `<span class="pet3d ${motion ? "motion-picture " : ""}${cls}${isDog(key) ? " dog" : ""}" style="--s:${Math.round(size)}px;--k:${k};--sprite-height:${frameHeight}%"${label ? ` role="img" aria-label="${esc(label)}"` : ""}>` +
    `<img src="${src}" onerror="this.onerror=null;this.src='${petFallbackSrc(key,stage)}'" alt="" draggable="false" decoding="async"${flip ? ' class="flip"' : ""}></span>`;
}

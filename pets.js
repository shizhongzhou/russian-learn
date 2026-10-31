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
const petLegacyFallbackSrc = (key,st) => key==="orange" ? "img/pets/hd/orange-model-r8.png" : `img/pets/${PETS[key] ? key : "orange"}_${artStage(st)}.webp`;
const petFallbackSrc = (key,st) => (typeof PetArt!=="undefined" && PetArt.peek(key,st)?.src) || petLegacyFallbackSrc(key,st);
const petSrc = (key,st) => petFallbackSrc(key,st);
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
function cleanMotion(pose) {
  const map={sit:"sit",look:"sit",walk:"walk",run:"run",sleep:"sleep",lie:"sleep",ball:"paw",toy:"paw",charge:"charge",pounce:"pounce",land:"land",eat:"eat",can:"can",treat:"eat",cuddle:"cuddle"};
  return typeof CLEAN_CAT_MOTION!=="undefined" ? CLEAN_CAT_MOTION[map[pose]] : null;
}
function animSrc(key,pose,st) {
  if(key!=="orange")return null;
  if(pose==="climb"&&artStage(st)===1)return "img/anim/orange/generated/climb-smooth-v1.webp";
  if(pose==="groom"&&artStage(st)===1)return "img/anim/orange/generated/groom-smooth-v2.webp";
  if(pose==="stretch"&&artStage(st)===1&&typeof APPROVED_CAT_MOTION!=="undefined")return APPROVED_CAT_MOTION["kitten-stretch"].clip;
  if(pose==="paw-ready"&&artStage(st)===1)return "img/anim/orange/generated/paw-poster-v1.png";
  if(pose==="yawn"&&artStage(st)===1)return cleanMotion("sleep")?.clip||null;
  if(pose==="ball"&&artStage(st)===1)return "img/anim/orange/generated/paw-smooth-v2.webp";
  const stage=artStage(st), approved=typeof APPROVED_CAT_MOTION!=="undefined"?APPROVED_CAT_MOTION:{};
  const name=["walk","run"].includes(pose)?["","kitten-walk","young-walk","adult-walk"][stage]:["sit","look"].includes(pose)&&stage===1?"kitten-idle":["sleep","lie"].includes(pose)&&stage>1?["","","young-rest","adult-rest"][stage]:"";
  if(approved[name])return approved[name].clip;
  const clean=cleanMotion(pose);
  if(clean && (artStage(st)===1 || ["eat","can","treat","cuddle"].includes(pose)))return clean.clip;
  // Reject the old colour-keyed clips: they erase white fur and cut tails.
  return null;
}
function motionHeight(src) {
  if(typeof CLEAN_CAT_MOTION!=="undefined") {const m=Object.values(CLEAN_CAT_MOTION).find(x=>x.clip===src);if(m)return m.frameHeightPercent||110;}
  return 100;
}
/* Canonical, complete high-resolution portrait per breed.  All poses and avatar
   contexts use this renderer; growth remains game data, never a scale surprise.
   The current HD library contains juvenile portraits. Later growth stages reuse
   this artwork intentionally until matching high-resolution growth art exists. */
const PetArt = (() => {
  const cats = ["orange","british","bluewhite","ragdoll","amshort","siamese","maine","silver","persian","bengal","russian","abyssinian","birman","siberian","white","devon"];
  const rects = [[41,17,284,301],[349,14,595,300],[652,11,919,300],[967,20,1228,301],[32,310,288,623],[354,308,594,623],[648,317,931,623],[973,318,1236,623],[22,639,309,930],[343,625,590,929],[664,630,905,931],[967,623,1210,930],[28,945,306,1240],[333,937,618,1240],[649,937,939,1241],[974,930,1219,1241]];
  const cache = new Map(), pending = new Map();
  let sheetPromise;
  const normalKey = key => PETS[key] ? key : "orange";
  const cacheKey = key => normalKey(key);
  function loadImage(src) {
    return new Promise((resolve,reject) => {
      const image = new Image(); image.decoding="async";
      image.onload = () => resolve(image); image.onerror=()=>reject(new Error("宠物图片加载失败")); image.src=src;
    });
  }
  function metadata(key, requestedStage, item) {
    return {...item, key:normalKey(key), requestedStage:artStage(requestedStage), artStage:1,
      strategy:isDog(key)?"existing-native-portrait":"shared-hd-juvenile-portrait"};
  }
  async function make(key) {
    key=normalKey(key);
    if(key==="orange") {
      const src="img/pets/hd/orange-model-r8.png", image=await loadImage(src);
      return {src,image,width:image.naturalWidth,height:image.naturalHeight,nativeWidth:image.naturalWidth,nativeHeight:image.naturalHeight,quality:"model-render-hd",transparent:true};
    }
    const index=cats.indexOf(key);
    if(index>=0) {
      if(!sheetPromise) sheetPromise=loadImage("img/pets/hd/kittens-transparent-r7.png").catch(e=>{sheetPromise=null;throw e;});
      const sheet=await sheetPromise, r=rects[index], nativeWidth=r[2]-r[0], nativeHeight=r[3]-r[1];
      // Native Canvas sprite extraction. Rectangles follow the complete alpha
      // components, not the nominal grid: ear tips cross several grid lines.
      // Transparent safety padding prevents clipping in circles and moving scenes.
      const pad=12, canvas=document.createElement("canvas");
      canvas.width=nativeWidth+pad*2; canvas.height=nativeHeight+pad*2;
      const ctx=canvas.getContext("2d");
      ctx.drawImage(sheet,r[0],r[1],nativeWidth,nativeHeight,pad,pad,nativeWidth,nativeHeight);
      const src=canvas.toDataURL("image/png"), image=await loadImage(src);
      return {src,image,width:canvas.width,height:canvas.height,nativeWidth,nativeHeight,quality:"native-hd",transparent:true};
    }
    const src=key==="tuxedo"?"img/pets/hd/tuxedo-transparent-r7.png":`img/pets/${key}_1.webp`;
    const image=await loadImage(src);
    return {src,image,width:image.naturalWidth,height:image.naturalHeight,nativeWidth:image.naturalWidth,nativeHeight:image.naturalHeight,quality:key==="tuxedo"?"native-hd":"legacy-native",transparent:true};
  }
  function load(key,stage=1) {
    const k=cacheKey(key);
    if(cache.has(k))return Promise.resolve(metadata(key,stage,cache.get(k)));
    if(!pending.has(k))pending.set(k,make(k).then(item=>{cache.set(k,item);pending.delete(k);return item;}).catch(e=>{pending.delete(k);throw e;}));
    return pending.get(k).then(item=>metadata(key,stage,item));
  }
  const source=(key,stage=1)=>load(key,stage).then(item=>item.src);
  function peek(key,stage=1) {const item=cache.get(cacheKey(key));return item?metadata(key,stage,item):null;}
  function draw(ctx,key,stage,rect={}) {
    const item=peek(key,stage);
    if(!item){load(key,stage).catch(()=>{});return false;}
    const x=Number(rect.x)||0,y=Number(rect.y)||0,width=Number(rect.width)||item.width,height=Number(rect.height)||item.height;
    const scale=Math.min(width/item.width,height/item.height),w=item.width*scale,h=item.height*scale;
    const dx=x+(width-w)/2,dy=y+(rect.align==="bottom"?height-h:(height-h)/2);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    if(rect.flip){ctx.translate(x+width,y);ctx.scale(-1,1);ctx.drawImage(item.image,dx-x,dy-y,w,h);}
    else ctx.drawImage(item.image,dx,dy,w,h);
    ctx.restore();return true;
  }
  function hydrate(root=document) {
    const images=[];
    if(root.matches?.("img[data-pet-art]"))images.push(root);
    if(root.querySelectorAll)images.push(...root.querySelectorAll("img[data-pet-art]"));
    for(const image of images) {
      const key=image.dataset.petArt, stage=Number(image.dataset.petStage)||1, token=`${key}/${stage}`;
      if(image.dataset.petArtPending===token||image.dataset.petArtReady===token)continue;
      image.dataset.petArtPending=token;
      source(key,stage).then(src=>{if(image.dataset.petArtPending!==token)return;image.src=src;image.dataset.petArtReady=token;image.removeAttribute("data-pet-art-pending");}).catch(()=>{image.removeAttribute("data-pet-art-pending");});
    }
  }
  if(typeof document!=="undefined") {
    const start=()=>{
      hydrate();new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)hydrate(n);}).observe(document.documentElement,{subtree:true,childList:true});
      // Decode the current pet before the first scene asks for it; the single
      // source sheet stays cached across every route and every growth label.
      try{load(Pet.state.cat.breed,Pet.view().shownStage).catch(()=>{});}catch{}
    };
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  }
  return {load,source,draw,peek,hydrate,rects,cats};
})();

/* Every still, including avatars, is an ordinary complete image. No CSS atlas
   positioning, no growth multiplier, no animated low-resolution fallback. */
function petImg(key, { stage = 1, size = 120, pose = "", cls = "", label = "", flip = false } = {}) {
  key=PETS[key]?key:"orange";
  const ready=PetArt.peek(key,stage), src=ready?.src||petLegacyFallbackSrc(key,1);
  return `<span class="pet3d pet-hd ${cls}${isDog(key)?" dog":""}" style="--s:${Math.round(size)}px;--k:1;width:${Math.round(size)}px;height:${Math.round(size)}px" role="img" aria-label="${esc(label||PETS[key].name)}" data-pet-pose="${esc(pose)}"><img src="${src}" data-pet-art="${key}" data-pet-stage="${artStage(stage)}" alt="" draggable="false" decoding="async"${flip?' class="flip"':""}></span>`;
}

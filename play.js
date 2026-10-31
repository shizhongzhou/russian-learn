"use strict";
const PLAY={catchChance:.08,maxPerDay:3};
const PET_PLAY_FRESH_MS=500;
const PET_PLAY_TIP_OFFSET=20;

// Coordinates here describe the feather tip and the actual visible portrait.
// Until a rigged renderer is available, a seated portrait stays on its paws:
// moving the whole picture is not used to impersonate walking or jumping.
class PetPlayMotion {
  constructor(random=Math.random){
    this.random=random;this.x=180;this.y=0;this.mode="idle";this.elapsed=0;
    this.cooldown=0;this.speed=0;this.facing=1;this.catches=0;this.bodyHeight=150;
    this.lookX=0;this.lookY=0;this.actionId=0;this.contact=false;this.contactDistance=Infinity;
  }
  enter(mode){this.mode=mode;this.elapsed=0;this.contact=false;if(mode==="reach")this.actionId++;}
  update(dt,target,width,floor){
    dt=Math.min(.04,Math.max(0,dt));this.elapsed+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    this.x=width*.5;this.y=0;this.speed=0;
    const fresh=!!target.active&&Number.isFinite(target.ageMs)&&target.ageMs<=PET_PLAY_FRESH_MS;
    const tip={x:target.x,y:target.y+PET_PLAY_TIP_OFFSET},dx=tip.x-this.x;
    const interested=fresh&&Math.abs(dx)<this.bodyHeight&&tip.y>floor-this.bodyHeight-30&&tip.y<floor+20;
    const points=target.contactPoints?.length?target.contactPoints:[{x:this.x,y:floor-this.bodyHeight*.61},{x:this.x-this.bodyHeight*.14,y:floor-10},{x:this.x+this.bodyHeight*.14,y:floor-10}];
    this.contactDistance=Math.min(...points.map(p=>Math.hypot(tip.x-p.x,tip.y-p.y)));
    const touching=fresh&&this.contactDistance<=19;
    this.lookX=interested?Math.max(-1,Math.min(1,dx/this.bodyHeight)):0;
    this.lookY=interested?Math.max(-1,Math.min(1,(tip.y-(floor-this.bodyHeight*.61))/100)):0;
    if(this.mode==="idle"){
      if(interested)this.enter("watch");
    }else if(this.mode==="watch"){
      if(!interested)this.enter("idle");
      else if(touching&&this.cooldown<=0&&this.elapsed>=.08)this.enter("reach");
    }else if(this.mode==="reach"){
      // Test contact again at the response frame: a target moved away cannot be caught.
      if(!this.contact&&this.elapsed>=.12&&touching){this.catches++;this.contact=true;}
      if(this.elapsed>=.42){this.enter("recover");this.cooldown=1.4;}
    }else if(this.mode==="recover"){
      if(this.elapsed>=.8)this.enter(interested?"watch":"idle");
    }
    return this;
  }
}

// Pointer, keyboard and sensor events share one current target. It expires when
// the user stops moving it; no pending spring, replay queue or stale active flag.
class PetPlayInput {
  constructor(now=()=>performance.now()){this.now=now;this.x=0;this.y=0;this.at=-Infinity;this.source="initial";this.vx=0;this.vy=0;}
  move(x,y,width,height,source="pointer"){
    const now=this.now(),oldX=this.x,oldY=this.y,elapsed=Math.max(1,now-this.at);
    this.x=Math.max(25,Math.min(width-25,x));this.y=Math.max(55,Math.min(height-70,y));
    this.vx=Number.isFinite(elapsed)?(this.x-oldX)/elapsed*1000:0;
    this.vy=Number.isFinite(elapsed)?(this.y-oldY)/elapsed*1000:0;
    this.at=now;this.source=source;return this.sample();
  }
  sample(){const ageMs=Math.max(0,this.now()-this.at);return{x:this.x,y:this.y,vx:this.vx,vy:this.vy,source:this.source,ageMs,active:ageMs<=PET_PLAY_FRESH_MS};}
  reset(){this.at=-Infinity;this.vx=0;this.vy=0;}
}

class PetPlaySensor {
  constructor(){this.at=0;this.gravityX=null;this.gravityY=null;}
  read(e,now){
    // Ignore old or out-of-order samples rather than replaying a backlog.
    let stamp=Number(e.timeStamp);
    if(stamp>1e12)stamp=now-(Date.now()-stamp);
    const stampComparable=Number.isFinite(stamp)&&stamp>=0;
    if(stampComparable&&(now-stamp>180||stamp-now>180))return null;
    const at=stampComparable?stamp:now;if(this.at&&at<=this.at)return null;
    const dt=this.at?Math.max(.008,Math.min(.04,(at-this.at)/1000)):1/60;this.at=at;
    const a=e.acceleration||{},g=e.accelerationIncludingGravity||{};
    if(this.gravityX===null){this.gravityX=Number(g.x)||0;this.gravityY=Number(g.y)||0;}
    const ax=Number.isFinite(a.x)?a.x:(Number(g.x)||0)-this.gravityX;
    const ay=Number.isFinite(a.y)?a.y:(Number(g.y)||0)-this.gravityY;
    this.gravityX+=((Number(g.x)||0)-this.gravityX)*.08;this.gravityY+=((Number(g.y)||0)-this.gravityY)*.08;
    if(!Number.isFinite(ax)||!Number.isFinite(ay)||Math.hypot(ax,ay)<.12)return null;
    return{x:Math.max(-36,Math.min(36,ax*240*dt)),y:Math.max(-36,Math.min(36,-ay*240*dt))};
  }
}

function pagePlay(){
  const v=Pet.view(),reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box=h(`<div class="page play play3 play-natural play-r7"><header class="ptop"><a class="pawbtn" href="#/pet" aria-label="返回宠物">${ic3(I3.back)}</a><h1>陪${isDog(v.cat.breed)?"狗狗":"猫咪"}玩</h1><span class="pl-count"></span></header>
    <section class="pl-field" aria-label="拖动羽毛，和${esc(v.cat.name)}玩耍"><svg class="pl-string" aria-hidden="true"><line class="stick"/><path class="str" fill="none"/></svg><span class="holder" aria-hidden="true"></span>
      <span class="pl-feather" role="slider" tabindex="0" aria-label="逗猫棒，拖动或按方向键移动" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><img src="img/item/feather.webp" alt=""></span>
      <div class="pl-cat" role="img" aria-label="${esc(v.cat.name)}在看着羽毛"><canvas width="768" height="576" aria-hidden="true"></canvas></div><div class="pl-floor"></div><p class="pl-say" aria-live="polite">正在准备它的高清形象……</p></section>
    <div class="pbot"><button class="shake btn ghost" id="shake">${ic3(I3.feather)}<span>开启手机摇晃</span></button></div><a class="btn ghost big" href="#/pet">收起玩具，回到宠物</a></div>`);
  app.append(box);
  const field=box.querySelector(".pl-field"),feather=box.querySelector(".pl-feather"),cat=box.querySelector(".pl-cat"),canvas=cat.querySelector("canvas"),ctx=canvas.getContext("2d"),string=box.querySelector(".str"),stick=box.querySelector(".stick"),say=box.querySelector(".pl-say");
  const motion=new PetPlayMotion(),input=new PetPlayInput(),sensor=new PetPlaySensor();
  let width=field.clientWidth,height=field.clientHeight,pointer=null,last=0,raf=0,ended=false,catchCount=0,clearMessage=0,sensorNotice=0,renderer=null,renderReady=false;
  input.x=width*.5;input.y=height*.43;
  const key=Pet.today()+"|wandcatch",earned=()=>Pet.state.once[key]||0;
  const count=()=>box.querySelector(".pl-count").textContent=`今日奖励 ${earned()}/${PLAY.maxPerDay}`;count();
  const standardMessage="拖动羽毛靠近它的鼻子或前爪，看看它的反应。";
  function drawToy(){
    const target=input.sample(),fx=target.x,fy=target.y;
    const angle=target.active?Math.max(-12,Math.min(12,target.vx*.012)):0;
    feather.style.transform=`translate3d(${fx.toFixed(2)}px,${fy.toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg)`;
    feather.setAttribute("aria-valuenow",Math.round(fx/width*100));
    const sx=width*.5,sy=22;stick.setAttribute("x1",sx);stick.setAttribute("y1",0);stick.setAttribute("x2",sx);stick.setAttribute("y2",sy);
    string.setAttribute("d",`M${sx} ${sy} Q${sx+(fx-sx)*.4} ${fy*.55} ${fx} ${fy-28}`);
  }
  const target=(x,y,source)=>{if(ended)return;input.move(x,y,width,height,source);drawToy();};
  const from=e=>{const r=field.getBoundingClientRect();target(e.clientX-r.left,e.clientY-r.top,"pointer");};
  field.onpointerdown=e=>{pointer=e.pointerId;try{field.setPointerCapture(pointer);}catch{}from(e);};
  field.onpointermove=e=>{if(pointer===e.pointerId)from(e);};
  field.onpointerup=field.onpointercancel=e=>{if(pointer===e.pointerId){pointer=null;try{field.releasePointerCapture(e.pointerId);}catch{}}};
  feather.onkeydown=e=>{const map={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]};if(map[e.key]){e.preventDefault();target(input.x+map[e.key][0],input.y+map[e.key][1],"keyboard");}};
  let sensorEnabled=false,sensorSeen=0;
  const onMotion=e=>{
    if(ended||!sensorEnabled||document.hidden)return;
    sensorSeen=performance.now();const delta=sensor.read(e,sensorSeen),current=input.sample();
    if(!delta||pointer!==null||(["pointer","keyboard"].includes(current.source)&&current.ageMs<250))return;
    target(input.x+delta.x,input.y+delta.y,"sensor");
  };
  const shake=box.querySelector("#shake"),shakeLabel=box.querySelector("#shake span");
  shake.onclick=async()=>{
    if(sensorEnabled){sensorEnabled=false;window.removeEventListener("devicemotion",onMotion);clearTimeout(sensorNotice);shakeLabel.textContent="开启手机摇晃";return;}
    try{
      if(typeof DeviceMotionEvent==="undefined"){say.textContent="当前设备没有手机动作传感器，直接拖动羽毛就能玩。";return;}
      if(typeof DeviceMotionEvent.requestPermission==="function"){
        const granted=await DeviceMotionEvent.requestPermission();if(ended)return;
        if(granted!=="granted"){say.textContent="没有开启动作权限，可以直接拖动羽毛。";return;}
      }
      sensor.at=0;sensor.gravityX=null;sensor.gravityY=null;sensorSeen=0;sensorEnabled=true;
      window.addEventListener("devicemotion",onMotion,{passive:true});shakeLabel.textContent="手机摇晃已开启 · 点击关闭";say.textContent="轻轻晃动手机，羽毛会跟着移动。也可以直接拖动。";
      clearTimeout(sensorNotice);sensorNotice=setTimeout(()=>{if(!ended&&sensorEnabled&&!sensorSeen)say.textContent="暂未收到手机动作，请检查浏览器的动作权限；也可以直接拖动。";},1800);
    }catch{if(!ended)say.textContent="未能开启动作权限，直接拖动羽毛也能玩。";}
  };

  // This is the replaceable renderer boundary. A future rigged 3D renderer may
  // return {draw({motion,target,floor,width,height,now,reduce}), destroy()}.
  async function prepareRenderer(){
    try{
      if(typeof PetArt==="undefined")throw new Error("高清形象尚未就绪");
      const sprite=await PetArt.load(v.cat.breed,v.shownStage);if(ended)return;
      const fallback={draw({motion}){
        ctx.clearRect(0,0,768,576);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
        const pulse=motion.mode==="reach"?Math.sin(Math.min(1,motion.elapsed/.42)*Math.PI):0;
        const lean=reduce?0:(motion.lookX*.014+pulse*(motion.lookX||.35)*.018);
        ctx.save();ctx.translate(384,556);ctx.rotate(lean);
        PetArt.draw(ctx,v.cat.breed,v.shownStage,{x:-264,y:-480,width:528,height:480,align:"bottom"});ctx.restore();
      }};
      // Keep the HD canvas prepared while the optional skinned model initializes.
      fallback.draw({motion});
      if(typeof window.createPetPlayRenderer==="function")renderer=await window.createPetPlayRenderer({host:cat,canvas,ctx,sprite,breed:v.cat.breed,stage:v.shownStage,fallback});
      if(ended){renderer?.destroy?.();return;}
      if(!renderer)renderer=fallback;
      renderReady=true;say.textContent=standardMessage;
    }catch{if(!ended)say.textContent="高清形象暂时没有加载成功，请返回宠物页再试。";}
  }
  function frame(now){
    if(ended||!document.body.contains(box))return cleanup();
    const dt=last?Math.min(.04,Math.max(0,(now-last)/1000)):0;last=now;width=field.clientWidth;height=field.clientHeight;
    const current=input.sample(),floor=height-45;
    const actualContacts=renderer?.contactPoints?.();if(actualContacts?.length)current.contactPoints=actualContacts.map(p=>({x:width*.5-120+p.x,y:height-39-180+p.y}));
    motion.x=width*.5;if(renderReady)motion.update(dt,current,width,floor);
    cat.style.transform=`translate3d(${(motion.x-120).toFixed(2)}px,0,0)`;
    drawToy();if(renderReady)renderer.draw({motion,target:current,floor,width,height,now,reduce});
    if(renderReady&&motion.catches!==catchCount){
      catchCount=motion.catches;clearTimeout(clearMessage);
      if(motion.contactDistance<=19&&current.active&&earned()<PLAY.maxPerDay&&Math.random()<PLAY.catchChance){
        Pet.state.once[key]=earned()+1;Pet.save();count();Pet.bonus({g:6,f:1,w:0,text:"轻轻碰到羽毛了",snackChance:.15});say.textContent="碰到了！让它歇一小会儿。";
      }else say.textContent="轻轻碰了一下羽毛～";
      clearMessage=setTimeout(()=>{if(!ended)say.textContent=standardMessage;},2200);
    }
    raf=requestAnimationFrame(frame);
  }
  function cleanup(){
    if(ended)return;ended=true;cancelAnimationFrame(raf);clearTimeout(clearMessage);clearTimeout(sensorNotice);
    input.reset();document.removeEventListener("visibilitychange",visibility);window.removeEventListener("devicemotion",onMotion);renderer?.destroy?.();
    field.onpointerdown=field.onpointermove=field.onpointerup=field.onpointercancel=null;feather.onkeydown=null;shake.onclick=null;
  }
  function visibility(){last=0;input.reset();sensor.at=0;}
  document.addEventListener("visibilitychange",visibility);Roam.onLeave(cleanup);drawToy();prepareRenderer();raf=requestAnimationFrame(frame);
}

"use strict";
/* One HD animal, one ground plane, and one owner for every interaction.
   Low-resolution auto-looping videos are intentionally not used as idle states. */
const PET_PROP = {
  ball:'<img src="img/anim/orange/generated/yarn-v1.png" alt="毛线球" draggable="false">',
  fish:'<svg preserveAspectRatio="xMidYMax meet" viewBox="0 0 94 62" role="img" aria-label="小鱼抱枕"><ellipse cx="43" cy="55" rx="35" ry="4" fill="#23374b" opacity=".10"/><path d="M18 31Q42 2 72 26L89 15V48L71 37Q42 63 18 31Z" fill="#8db8cf" stroke="#5c8fa8" stroke-width="2"/><path d="M32 19Q41 31 32 43M44 14Q55 31 44 48" stroke="#c1d9df" stroke-width="2" fill="none"/><circle cx="25" cy="27" r="3" fill="#314858"/><circle cx="24" cy="26" r="1" fill="white"/><path d="M18 32Q22 37 26 33" fill="none" stroke="#577d91" stroke-width="1.5"/></svg>',
  food:'<svg preserveAspectRatio="xMidYMax meet" viewBox="0 0 76 56" aria-label="猫粮碗"><ellipse cx="38" cy="48" rx="32" ry="5" fill="#26311a" opacity=".12"/><path d="M8 22h60l-7 22Q38 54 15 44z" fill="#c9744e"/><ellipse cx="38" cy="22" rx="30" ry="10" fill="#8a4d2c"/><g fill="#c49357"><circle cx="23" cy="22" r="4"/><circle cx="33" cy="17" r="4"/><circle cx="44" cy="23" r="4"/><circle cx="53" cy="19" r="4"/><circle cx="32" cy="25" r="4"/></g></svg>',
  water:'<svg preserveAspectRatio="xMidYMax meet" viewBox="0 0 76 56" aria-label="水碗"><ellipse cx="38" cy="48" rx="32" ry="5" fill="#26311a" opacity=".12"/><path d="M8 22h60l-7 22Q38 54 15 44z" fill="#5f94b9"/><ellipse cx="38" cy="22" rx="30" ry="10" fill="#acd9e6"/><path d="M19 22q15-6 30 0" fill="none" stroke="#f4ffff" stroke-width="2"/></svg>'
};
const PetBehaviorMemory = (() => { try { return JSON.parse(sessionStorage.getItem("mm_behavior_r7") || "{}"); } catch (_) { return {}; } })();
function rememberPetBehavior(key, snapshot) {
  PetBehaviorMemory[key] = snapshot;
  try { sessionStorage.setItem("mm_behavior_r7", JSON.stringify(PetBehaviorMemory)); } catch (_) {}
}
/* Wall-clock nap deadlines survive route changes, visibility changes and reloads. */
class PetBehaviorModel {
  constructor({ now=()=>Date.now(), random=Math.random, memory=null }={}) {
    this.now=now;this.random=random;this.state="observe";this.elapsed=0;this.duration=30;
    this.energy=.8;this.napUntil=0;this.lastNapAt=0;this.lastCare=0;this.lastToyAt=0;
    if(memory) { this.energy=Number.isFinite(memory.energy)?memory.energy:.8;this.lastNapAt=memory.lastNapAt||0;this.lastCare=memory.lastCare||0;this.lastToyAt=memory.lastToyAt||0;
      if(memory.napUntil>this.now()) {this.napUntil=memory.napUntil;this.enter("sleep",(this.napUntil-this.now())/1000);} }
  }
  enter(state,duration=30){this.state=state;this.elapsed=0;this.duration=duration;}
  nap(){this.lastNapAt=this.now();this.napUntil=this.now()+(180+this.random()*180)*1000;this.enter("settle",1.5);}
  touch(){if(this.napUntil>this.now()){this.enter("drowsy",2.5);return false;}this.enter("pet",6);return true;}
  toy(kind){this.napUntil=0;this.lastToyAt=this.now();this.enter(kind==="fish"?"cuddle":"play",kind==="fish"?24:32);}
  rest(){this.napUntil=0;this.enter("rest",90);}
  step(dt){
    const step=Math.min(.05,Math.max(0,dt));this.elapsed+=step;
    if(!["sleep","settle","drowsy","rest"].includes(this.state))this.energy=Math.max(.15,this.energy-step/1200);
    if(this.state==="sleep") { if(this.now()>=this.napUntil){this.napUntil=0;this.energy=Math.min(1,this.energy+.4);this.enter("observe",45);}return; }
    if(this.state==="drowsy") {if(this.elapsed>=this.duration)this.enter("sleep",Math.max(1,(this.napUntil-this.now())/1000));return;}
    if(this.state==="settle"){if(this.elapsed>=this.duration)this.enter("sleep",Math.max(1,(this.napUntil-this.now())/1000));return;}
    if(this.elapsed<this.duration)return;
    if(["play","cuddle","pet","rest","recover"].includes(this.state)){this.enter("observe",30+this.random()*20);return;}
    // A settled animal rests for a while; it does not alternate yawn/lie every few seconds.
    if(this.state==="observe" && this.energy<.3 && this.now()-this.lastNapAt>1200000)this.nap();
    else this.enter("observe",30+this.random()*25);
  }
  snapshot(){return {at:this.now(),state:this.state,energy:this.energy,napUntil:this.napUntil,lastNapAt:this.lastNapAt,lastCare:this.lastCare,lastToyAt:this.lastToyAt};}
}
class PetToyPhysics {
  constructor(){this.x=0;this.y=0;this.v=0;this.spin=0;this.dragging=false;this.rolls=0;}
  roll(velocity){this.v=velocity;this.rolls++;}
  step(dt,left,right){
    if(this.dragging)return;
    dt=Math.min(.05,Math.max(0,dt));this.x+=this.v*dt;this.spin+=this.v*dt/24;this.v*=Math.exp(-1.8*dt);
    if(this.x<left){this.x=left;this.v=Math.abs(this.v)*.45;}else if(this.x>right){this.x=right;this.v=-Math.abs(this.v)*.45;}
    if(Math.abs(this.v)<.35)this.v=0;
  }
}
const PetSleepArt={};
class NaturalPetScene {
  constructor(host,{floating=false}={}){
    this.host=host;this.floating=floating;this.dead=false;this.suspended=false;this.raf=0;this.last=0;this.version=0;this.sprite=null;this.face=1;this.pose="sit";this.x=0;this.y=0;this.moving=false;this.runPreview=null;this.propKind="ball";this.toy=new PetToyPhysics();this.pendingContact=false;this.contactAt=0;this.smallClock=0;this.smallNext=1.5;this.smallAction=null;this.smallIndex=0;
    const v=Pet.view();this.key=v.cat.breed;this.stage=v.shownStage;this.memoryKey=this.key+"/"+artStage(this.stage);
    this.model=new PetBehaviorModel({memory:PetBehaviorMemory[this.memoryKey]});
    this.el=h('<button type="button" class="animal-v3 animal-r7" aria-label="摸摸宠物" hidden><span class="animal-shadow"></span><canvas width="768" height="432" aria-hidden="true"></canvas><span class="animal-message" hidden></span></button>');
    this.canvas=this.el.querySelector("canvas");this.ctx=this.canvas.getContext("2d");this.bubble=this.el.querySelector(".animal-message");
    this.prop=h('<button type="button" class="animal-prop animal-prop-r7" aria-label="和宠物玩球" hidden></button>');host.append(this.prop,this.el);this.setProp("ball");
    this.el.onclick=()=>this.touch();this.prop.onclick=()=>{if(this.suppressClick){this.suppressClick=false;return;}return this.propKind==="fish"?this.playFish():this.playBall();};
    this.bindToyDrag();this.resize=()=>this.fit();window.addEventListener("resize",this.resize);this.fit(true);
    this.visibility=()=>{this.last=0;if(!document.hidden&&!this.raf)this.raf=requestAnimationFrame(t=>this.tick(t));};document.addEventListener("visibilitychange",this.visibility);
    this.scroll=()=>{if(this.floating){this.y=this.bounds().floor;this.toy.y=this.y;this.render();}};if(floating)window.addEventListener("scroll",this.scroll,{passive:true});
    this.ready=PetArt.load(this.key,this.stage).then(sprite=>{if(this.dead)return;this.sprite=sprite;this.el.hidden=this.suspended;this.prop.hidden=this.suspended;this.drawAnimal();this.threeReady=this.prepare3D();return sprite;}).catch(()=>{if(!this.dead)this.say("宠物图片暂未加载，请刷新重试");});
    if(this.key==="orange"&&!PetSleepArt.image){const im=new Image();im.src="img/anim/orange/generated/sleep-hold-v2.png";PetSleepArt.ready=im.decode().then(()=>PetSleepArt.image=im).catch(()=>null);}
    this.raf=requestAnimationFrame(t=>this.tick(t));
  }
  get state(){return this.model.state;}
  get elapsed(){return this.model.elapsed;}
  bounds(){
    const unit=this.floating?100:Math.min(142,this.host.clientWidth*.36);this.unit=unit;
    if(!this.floating){const left=unit*.58+8,right=Math.max(left,this.host.clientWidth-unit*.58-8);return {left,right,floor:Math.max(unit+18,this.host.clientHeight-18)};}
    const r=app.getBoundingClientRect(),tab=document.getElementById("tabbar"),floor=tab&&!tab.hidden?tab.getBoundingClientRect().top:innerHeight-8;
    const left=Math.max(unit*.58,r.left+unit*.58),right=Math.max(left,Math.min(innerWidth-unit*.58,r.right-unit*.58));return {left,right,floor};
  }
  fit(initial=false){const b=this.bounds();this.x=initial?(b.left+b.right)*.5:Math.max(b.left,Math.min(b.right,this.x));this.y=b.floor;if(initial){this.toy.x=Math.max(b.left-15,this.x-this.unit*.65);this.toy.y=this.y;}this.render();}
  setProp(kind){this.propKind=kind;this.prop.innerHTML=PET_PROP[kind]||PET_PROP.ball;this.prop.setAttribute("aria-label",kind==="fish"?"抱抱小鱼玩具":kind==="food"?"食物碗":kind==="water"?"水碗":"和宠物玩球");}
  touch(){
    this.cancelGo();this.version++;const awake=this.model.touch();if(awake){Pet.pet();this.say("靠过来，陪你一会儿～");}else this.say("嗯…让我再睡一会儿…");
    this.persist();this.drawAnimal();return awake;
  }
  playBall(){
    this.cancelGo();this.version++;this.model.toy("ball");this.setProp("ball");const b=this.bounds();this.face=this.x<(b.left+b.right)*.5?1:-1;
    // Put the user-placed ball within the nearest front paw's actual reach.
    const projected=this.projectedPaws(),paw=projected.length?(this.face>0?Math.max(...projected.map(p=>p.x)):Math.min(...projected.map(p=>p.x))):this.x+this.face*this.unit*.28;
    const destination=projected.length?paw+this.face*26:this.x+this.face*(this.unit*.28+22);this.toy.x=Math.max(b.left-18,Math.min(b.right+18,destination));this.toy.y=this.y;
    this.toy.roll(-this.face*14);this.pendingContact=true;this.contactAt=.55;this.say("小球到爪边啦，轻轻拨一下～");this.persist();this.render();return true;
  }
  playFish(){
    this.cancelGo();this.version++;this.model.toy("fish");this.setProp("fish");this.toy.v=0;this.toy.spin=0;this.toy.x=this.x+this.unit*.2;this.toy.y=this.y;this.pendingContact=false;this.say("把小鱼抱枕放在爪边，陪它玩一会儿～");this.persist();this.render();return true;
  }
  rest(){this.cancelGo();this.model.rest();this.toy.v=0;this.say("就在这里安静陪你～");this.persist();this.render();return true;}
  enter(state,duration=30){this.cancelGo();if(state==="sleep"||state==="yawn"){this.model.nap();}else this.model.enter(state,duration);this.persist();}
  setPose(pose){this.pose=pose;/* HD renderer owns the complete body; no image-size swap. */}
  playAt(){return this.playBall();}
  // Explicit run preview only. No idle policy calls it automatically.
  // Slow requests never select the running asset.
  cancelGo(){this.runPreview=null;this.moving=false;}
  async previewRun(seconds=5){
    if(this.dead||this.suspended||this.key!=="orange"||typeof Pet3D==="undefined"||!Pet3D.poseURLs.run||(typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches))return false;
    if(!this.three){await this.ready;await this.threeReady;if(this.dead||this.suspended||!this.three)return false;}
    if(this.runPreview){this.runPreview.elapsed=0;if(this.runPreview.active){this.runPreview.startedAt=performance.now();this.runPreview.until=this.runPreview.startedAt+this.runPreview.duration*1000;}return true;}
    this.cancelGo();const preview={ready:false,active:false,elapsed:0,duration:Math.max(.5,Math.min(10,seconds)),token:++this.version};this.runPreview=preview;
    try{const asset=await Pet3D.preloadPose("run");if(this.dead||this.runPreview!==preview)return false;if(!asset||!Pet3D.math.clipFor(asset,"run")){this.runPreview=null;return false;}
      preview.ready=true;this.render();await this.three.setPose("run");if(this.dead||this.runPreview!==preview)return false;
      if(this.three.poseName!=="run"||!this.three.active){this.runPreview=null;this.render();return false;}preview.active=true;preview.startedAt=performance.now();preview.until=preview.startedAt+preview.duration*1000;this.render();return true;
    }catch{if(this.runPreview===preview){this.runPreview=null;this.render();}return false;}
  }
  async go(destination,{mode="run",speed=(this.unit||100)*2}={}){
    // Compatibility entry only: this release has no new traversal or pathfinding.
    if(!Number.isFinite(destination)||!Number.isFinite(speed)||mode!=="run"||speed<(this.unit||100)*1.4)return false;
    return this.previewRun(5);
  }
  platforms(){return [];}
  say(text){this.bubble.textContent=text;this.bubble.hidden=false;clearTimeout(this.msgTimer);this.msgTimer=setTimeout(()=>{if(!this.dead)this.bubble.hidden=true;},3000);}
  persist(){rememberPetBehavior(this.memoryKey,this.model.snapshot());}
  projectedPaws(){if(!this.three?.active)return[];const u=this.unit||100;return ['fore_paw.L','fore_paw.R'].map(name=>this.three.projectNode(name)).filter(Boolean).map(p=>({x:this.x-u*1.2+p.x,y:this.y-u*1.35+p.y}));}
  update(dt){
    // This explicit preview pauses the previous state and its toys, then resumes
    // it unchanged. It never changes x/y, starts a sound, or schedules roaming.
    if(this.runPreview?.active){this.runPreview.elapsed=Math.max(0,(performance.now()-this.runPreview.startedAt)/1000);if(performance.now()>=this.runPreview.until)this.runPreview=null;return;}
    this.smallClock+=dt;
    if(["observe","rest"].includes(this.state)&&this.smallClock>=this.smallNext){
      const actions=[{mode:"look",duration:5},{mode:"tail",duration:4},{mode:"ear",duration:2},{mode:"tilt",duration:4},{mode:"paw",duration:3},{mode:"up",duration:4},{mode:"curious",duration:5},{mode:"tap",duration:2}],action=actions[this.smallIndex++%actions.length];
      this.smallAction={...action,until:this.smallClock+action.duration,token:++this.version};this.smallNext=this.smallClock+Math.max(action.duration+.8,4+Math.random()*6);
    }
    const before=this.state;this.model.step(dt);if(before!==this.state)this.persist();const b=this.bounds();
    if(this.pendingContact&&this.elapsed>=this.contactAt){const projected=this.projectedPaws(),paws=projected.length?projected:[{x:this.x+this.face*this.unit*.28,y:this.y-8}];
      const touching=paws.some(p=>Math.hypot(this.toy.x-p.x,this.toy.y-23-p.y)<=29);
      if(this.propKind==="ball"&&touching){this.pendingContact=false;this.toy.roll(this.face*100);this.model.energy=Math.max(.1,this.model.energy-.015);}
      else if(this.elapsed>3)this.pendingContact=false;
    }
    if(this.propKind==="ball")this.toy.step(dt,b.left-18,b.right+18);
    if(this.state==="observe" && this.model.now()-this.model.lastCare>900000){const v=Pet.view();if(v.full<30||v.drink<30){const food=v.full<=v.drink;this.setProp(food?"food":"water");this.toy.x=this.x-this.unit*.6;this.toy.y=this.y;}}
  }
  async prepare3D(){
    if(this.key!=="orange"||typeof Pet3D==="undefined"||this.three||this.threeLoading)return;
    this.threeLoading=true;
    try{const pose=["sleep","drowsy","settle"].includes(this.state)?"sleep":this.state==="rest"?"sit":"rigged";const renderer=await Pet3D.mountActor(this.el,{breed:this.key,pose,fill:320/432,bottom:.008,captureKey:"scene",onFallback:()=>{this.canvas.style.visibility="visible";}});
      if(this.dead){renderer?.destroy();return;}this.three=renderer;this.smallClock=0;this.smallNext=1.5;this.smallAction=null;this.drawAnimal();
    }catch{this.threeFailed=true;/* The complete HD canvas remains visible on unsupported/lost WebGL. */}
    finally{this.threeLoading=false;}
  }
  drawAnimal(){
    if(!this.sprite||this.dead)return;
    const sleepState=["sleep","drowsy","settle"].includes(this.state);
    if(this.three){const idleMode=this.smallAction&&this.smallClock<this.smallAction.until?this.smallAction.mode:"idle";
      const running=!!this.runPreview?.ready,pose=running?"run":sleepState?"sleep":this.state==="rest"?"sit":"rigged";
      const mode=running?"run":sleepState?"idle":this.state==="pet"?"rub":this.state==="cuddle"?"paw":this.state==="play"?(this.elapsed<3?"paw":"look"):idleMode;
      const gaze=!running&&this.propKind==="ball"&&this.state==="play"?[Math.max(-1,Math.min(1,(this.toy.x-this.x)/(this.unit||100))),.55]:undefined;
      const ok=this.three.draw({now:performance.now(),pose,mode,gaze,token:this.state+"/"+this.version,reduce:typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches});
      this.canvas.style.visibility=ok?"hidden":"visible";if(ok){const actual=this.three.poseName||"rigged";this.pose=actual==="rigged"?(sleepState?"rest":mode):actual;this.el.dataset.modelPose=actual;return;}
    }
    // During a route's GPU setup, retain the last complete 3D body rather than
    // flashing the old two-dimensional sleep cutout between 3D poses.
    if(this.key==="orange"&&!this.threeFailed&&!this.three&&typeof Pet3D!=="undefined"&&Pet3D.lastFrames.scene){this.ctx.clearRect(0,0,768,432);this.ctx.drawImage(Pet3D.lastFrames.scene,0,0,768,432);return;}
    const ctx=this.ctx;ctx.clearRect(0,0,768,432);
    const sleeping=sleepState&&this.key==="orange"&&PetSleepArt.image&&(typeof Pet3D==="undefined"||this.threeFailed);
    if(sleeping){const im=PetSleepArt.image,w=350,h=w*im.naturalHeight/im.naturalWidth;ctx.drawImage(im,384-w/2,432-h,w,h);this.pose="sleep";return;}
    this.pose=this.state==="play"?"look":this.state==="cuddle"?"cuddle":"sit";
    const e=this.elapsed,lean=this.state==="pet"?Math.sin(Math.min(1,e/1.5)*Math.PI)*.025:this.state==="cuddle"?Math.sin(Math.min(1,e/2)*Math.PI)*.02:this.state==="play"&&e<1.2?this.face*Math.sin(e/1.2*Math.PI)*.025:0;
    ctx.save();ctx.translate(384,432);ctx.rotate(lean);PetArt.draw(ctx,this.key,this.stage,{x:-210,y:-320,width:420,height:320,align:"bottom"});ctx.restore();
  }
  render(){
    if(this.dead)return;if(!this.suspended)this.drawAnimal();const u=this.unit||100;this.el.style.setProperty("--animal-unit",u+"px");this.el.style.transform=`translate3d(${(this.x-u*1.2).toFixed(2)}px,${(this.y-u*1.35).toFixed(2)}px,0)`;
    const hidden=this.suspended||!this.sprite;this.el.hidden=hidden;this.prop.hidden=hidden;
    const angle=this.propKind==="ball"?this.toy.spin:0;this.prop.style.transform=`translate3d(${(this.toy.x-23).toFixed(2)}px,${(this.toy.y-46).toFixed(2)}px,0) rotate(${angle.toFixed(2)}rad)`;
    this.el.dataset.state=this.state;this.el.dataset.quality=this.sprite?.quality||"loading";
  }
  bindToyDrag(){
    let pointer=null,lastX=0,lastAt=0,velocity=0,moved=0;
    this.prop.onpointerdown=e=>{pointer=e.pointerId;this.prop.setPointerCapture?.(pointer);this.toy.dragging=true;this.pendingContact=false;moved=0;lastX=e.clientX;lastAt=performance.now();velocity=0;};
    this.prop.onpointermove=e=>{if(pointer!==e.pointerId)return;const now=performance.now(),dx=e.clientX-lastX,b=this.bounds();moved+=Math.abs(dx);velocity=dx/Math.max(.016,(now-lastAt)/1000);this.toy.x=Math.max(b.left-18,Math.min(b.right+18,this.toy.x+dx));lastX=e.clientX;lastAt=now;this.render();};
    const finish=e=>{if(pointer!==e.pointerId)return;pointer=null;this.toy.dragging=false;this.suppressClick=moved>4;clearTimeout(this.dragClickTimer);this.dragClickTimer=setTimeout(()=>this.suppressClick=false,250);if(this.propKind==="ball")this.toy.roll(Math.max(-180,Math.min(180,velocity)));};this.prop.onpointerup=finish;this.prop.onpointercancel=finish;
  }
  tick(t){this.raf=0;if(this.dead)return;if(document.hidden){this.last=0;return;}const dt=this.last?Math.min(.04,(t-this.last)/1000):0;this.last=t;if(!this.suspended)this.update(dt);this.render();this.raf=requestAnimationFrame(n=>this.tick(n));}
  destroy(){if(this.dead)return;this.persist();this.dead=true;this.cancelGo();this.three?.destroy();cancelAnimationFrame(this.raf);clearTimeout(this.msgTimer);clearTimeout(this.dragClickTimer);window.removeEventListener("resize",this.resize);window.removeEventListener("scroll",this.scroll);document.removeEventListener("visibilitychange",this.visibility);this.el.remove();this.prop.remove();}
}
const Roam=(()=>{
  let scene=null,local=null,leave=null,root=null,suspended=false;
  const valid=s=>s&&!s.dead&&s.host?.isConnected!==false&&document.body.contains(s.host);
  const active=()=>{if(local&&!valid(local)){local.destroy();local=null;}if(scene&&!valid(scene)){scene.destroy();scene=null;}return valid(local)?local:valid(scene)?scene:null;};
  const stopFloating=()=>{if(scene){scene.destroy();scene=null;}if(root){root.remove();root=null;}};
  return {
    set(want){stopFloating();const v=Pet.view();if(!want||!v.profile||Pet.state.settings.roam===false||valid(local))return;root=h('<div class="animal-world" aria-label="宠物活动区域"></div>');document.body.append(root);scene=new NaturalPetScene(root,{floating:true});scene.suspended=suspended;scene.render();},
    mountScene(host){if(local){local.destroy();local=null;}stopFloating();if(!host)return;host.classList.add("animal-local");const old=[...host.querySelectorAll("button")].find(b=>!b.classList.contains("animal-v3")&&!b.classList.contains("animal-prop"));const next=local=new NaturalPetScene(host);next.suspended=suspended;next.render();next.ready.then(()=>{if(old&&local===next&&next.sprite)old.hidden=true;});},
    playBall(){return active()?.playBall()||false;},playFish(){return active()?.playFish()||false;},rest(){return active()?.rest()||false;},
    playAt(){return this.playBall();},
    go(destination,options){return active()?.go(destination,options)||false;},
    action(p,d=3000){const s=active();if(!s)return false;if(p==="run")return s.previewRun(5);if(p==="ball")return s.playBall();if(p==="cuddle")return s.playFish();if(["sleep","lie","yawn"].includes(p)){s.model.nap();s.persist();return true;}if(p==="sit")return s.rest();s.enter("observe",d/1000);return true;},
    capture(){return active()?.three?.capture()||null;},pet(){return active()?.touch();},say(t){active()?.say(t);},hop(){return active()?.touch();},cheer(t){active()?.say(t);},lines(){},
    onLeave(fn){leave=fn;},stopPage(){if(leave){const fn=leave;leave=null;fn();}if(local){local.destroy();local=null;}},
    preview(){return active()?.touch();},suspend(value){suspended=!!value;for(const s of [scene,local])if(s&&!s.dead){s.suspended=value;s.render();}},
    snapshot(){const s=active();return s?{on:true,x:s.x,y:s.y,pose:s.pose,state:s.state,moving:!!s.moving,breed:s.key,quality:s.sprite?.quality||"loading",toy:s.propKind,toyX:s.toy.x,napUntil:s.model.napUntil}: {on:false};}
  };
})();

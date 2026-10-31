/* Optional, dormant action protocol for validated clips from one model family.
   This file is deliberately not wired into the current app/default renderer.
   No animation is inferred from a future clip name, no picture is translated
   to impersonate gait, and no audio is emitted here. Units are metres/seconds. */
(function(global){
  'use strict';
  const EPS=1e-7,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),positive=v=>Number.isFinite(v)&&v>0;
  const copy3=v=>[Number(v?.[0])||0,Number(v?.[1])||0,Number(v?.[2])||0];
  const modulo=v=>(v%1+1)%1;
  const approach=(from,to,amount)=>from<to?Math.min(to,from+amount):Math.max(to,from-amount);
  function phaseIn(phase,range){return range[0]<=range[1]?phase>=range[0]&&phase<=range[1]:phase>=range[0]||phase<=range[1];}
  function trajectory(points,phase){let i=0;while(i<points.length-2&&points[i+1][0]<phase)i++;const a=points[i],b=points[Math.min(i+1,points.length-1)],u=b[0]===a[0]?0:clamp((phase-a[0])/(b[0]-a[0]),0,1);return[1,2,3].map(j=>a[j]+(b[j]-a[j])*u);}
  function compile({family,manifest,clips,approvedRoles=[],rootNode}){
    const roles=new Map(),rejected={},source=clips instanceof Map?clips:new Map((clips||[]).map(c=>[c.name,c])),approved=new Set(approvedRoles);
    if(!manifest||manifest.version!==1||manifest.family!==family)return{roles,rejected:{manifest:'missing_or_different_family'}};
    for(const [role,d] of Object.entries(manifest.roles||{})){
      let reason=null;const clip=source.get(d.clip);
      if(!approved.has(role)||d.validated!==true)reason='not_approved';
      else if(!clip||!positive(clip.duration))reason='actual_clip_missing';
      else if(clip.channels?.some(c=>c.path==='scale'))reason='scale_animation_not_allowed';
      else if(['walk','run'].includes(role)&&(!d.in_place||!positive(d.stride_meters)||!positive(d.cycle_seconds)||Math.abs(d.cycle_seconds-clip.duration)>.034||!Array.isArray(d.stance_phases)||!d.stance_phases.length||d.stance_phases.some(p=>!Number.isFinite(p)||p<0||p>=1)))reason='unverified_gait_metrics';
      else if(['walk','run'].includes(role)&&!clip.channels?.some(c=>c.path==='rotation'&&Array.from(c.values||[]).some((v,i,a)=>i>=4&&Math.abs(v-a[i%4])>1e-5)))reason='no_actual_gait_rotation';
      else if(d.in_place&&rootNode!==undefined&&clip.channels?.some(c=>c.node===rootNode&&c.path==='translation'&&Array.from(c.values||[]).some((v,i,a)=>i>=3&&i%3!==1&&Math.abs(v-a[i%3])>1e-6)))reason='double_root_motion';
      else if(d.root_trajectory&&(!d.in_place||!Array.isArray(d.root_trajectory)||d.root_trajectory.length<2||d.root_trajectory[0][0]!==0||d.root_trajectory.at(-1)[0]!==1||d.root_trajectory.some((p,i,a)=>p.length!==4||p.some(n=>!Number.isFinite(n))||(i>0&&p[0]<=a[i-1][0]))))reason='invalid_root_trajectory';
      if(!reason&&d.root_trajectory&&(Math.hypot(...d.root_trajectory[0].slice(1))>1e-6||Math.abs(d.root_trajectory.at(-1)[2])>1e-6))reason='trajectory_not_grounded';
      if(!reason)for(const event of d.contact_events||[]){if(!event.limb||!Array.isArray(event.phase)||event.phase.length!==2||event.phase.some(p=>!Number.isFinite(p)||p<0||p>1)||!positive(event.impulse_mps)){reason='invalid_contact_event';break;}}
      if(reason)rejected[role]=reason;else roles.set(role,{...d,role,duration:clip.duration,clipData:clip});
    }
    return{roles,rejected};
  }
  class PetActionController{
    constructor(options={}){
      this.family=options.family;this.clock=options.clock||Date.now;this.contacts=options.contacts||(()=>[]);this.onEvent=options.onEvent||(()=>{});
      const compiled=compile(options);this.roles=compiled.roles;this.rejected=compiled.rejected;this.root=copy3(options.position);this.groundY=options.manifest?.ground_y||0;this.root[1]=this.groundY;this.direction=copy3(options.manifest?.locomotion_direction||[1,0,0]);this.direction[1]=0;const directionLength=Math.hypot(this.direction[0],this.direction[2])||1;this.direction=this.direction.map(v=>v/directionLength);
      this.heading=options.heading===-1?-1:1;this.speed=0;this.desiredSpeed=0;this.action=null;this.gait=null;this.next=null;this.id=0;this.poseToken=0;this.contactWindow=null;this.usedContacts=new Set();this.toy=options.toy||{kind:'ball',position:[0,0,0],velocity:[0,0,0],radius:.03};this.bowl=null;
      this.nap=null;this.sleepyTouches=0;this.wakeQueued=false;this.touchAt=-Infinity;this.nowSeconds=0;
      const remembered=options.memory?.family===this.family?options.memory.nap:null;
      if(remembered&&this.has('sleep_hold')){this.nap={...remembered};if(this.has('wake_up'))delete this.nap.wakeUnavailable;if(this.clock()<this.nap.until)this._start('sleep_hold',{loop:true});else this._wake(false);}
      if(!this.action)this._idle();
    }
    has(role){return this.roles.has(role);}
    capabilities(){return Array.from(this.roles.keys());}
    _emit(type,data={}){this.onEvent({type,family:this.family,...data});}
    _idle(){this.gait=null;this.speed=0;this.desiredSpeed=0;this.root[1]=this.groundY;if(!this._start('idle',{loop:true}))this.action=null;const next=this.next;this.next=null;next?.();}
    _busy(){return !!this.action&&this.action.role!=='idle';}
    _start(role,{loop=false,done=null,origin=null}={}){
      if(!this.has(role))return false;this.action={role,descriptor:this.roles.get(role),elapsed:0,loop,done,id:++this.id,origin:origin?copy3(origin):copy3(this.root)};this.usedContacts.clear();this._emit('action_start',{role,clip:this.action.descriptor.clip,id:this.id});return true;
    }
    _missing(roles){return roles.filter(r=>!this.has(r));}
    move(direction,speed,{role='walk'}={}){
      if(!this.has(role)||!['walk','run'].includes(role)||!Number.isFinite(speed)||speed<=0||!Number.isFinite(direction)||!direction||this.nap)return{accepted:false,reason:'validated_gait_unavailable'};
      direction=Math.sign(direction);if(direction!==this.heading&&!this.has('turn'))return{accepted:false,reason:'actual_turn_clip_unavailable'};
      if(!this.gait&&this._busy()){this.next=()=>this.move(direction,speed,{role});return{accepted:true,queued:true};}
      if(!this.gait&&direction!==this.heading){this._start('turn',{done:()=>{this.heading=direction;if(!this.next)this.next=()=>this.move(direction,speed,{role});this._idle();}});return{accepted:true,queued:true};}
      const d=this.roles.get(role),limit=d.max_speed_mps||d.stride_meters/d.cycle_seconds*1.5;
      if(this.gait&&(this.gait.role!==role||this.heading!==direction)){this.next=()=>this.move(direction,speed,{role});this.stop();return{accepted:true,queued:true};}
      if(!this.gait){if(this._busy()){this.next=()=>this.move(direction,speed,{role});return{accepted:true,queued:true};}this.heading=direction;this._start(role,{loop:true});this.gait={role,cycle:d.stance_phases[0],stopCycle:null};}
      this.gait.stopCycle=null;this.desiredSpeed=direction*clamp(speed,.001,limit);return{accepted:true};
    }
    stop(){if(!this.gait)return false;const d=this.roles.get(this.gait.role),cycle=this.gait.cycle;const atStance=d.stance_phases.some(p=>Math.abs(modulo(cycle)-p)<EPS);this.gait.stopCycle=atStance&&Math.abs(this.speed)<.001?cycle:Math.min(...d.stance_phases.map(p=>Math.floor(cycle-p+EPS)+1+p));this.desiredSpeed=0;return true;}
    selectToy(kind){if(!['ball','fish'].includes(kind))return false;this.toy.kind=kind;return true;}
    playToy(kind=this.toy.kind){
      const role=kind==='fish'?'toy_fish':'paw_tap';if(!this.has(role)||this.nap)return{accepted:false,reason:'actual_toy_clip_unavailable'};
      if(this.gait){this.next=()=>this.playToy(kind);this.stop();return{accepted:true,queued:true};}
      this.selectToy(kind);if(this._busy()){this.next=()=>this.playToy(kind);return{accepted:true,queued:true};}this._start(role,{done:()=>this._idle()});return{accepted:true};
    }
    pounce(){
      if(this.nap||this._missing(['crouch','pounce','land']).length||!this.roles.get('pounce').root_trajectory)return{accepted:false,reason:'validated_pounce_sequence_unavailable'};
      if(this.gait){this.next=()=>this.pounce();this.stop();return{accepted:true,queued:true};}if(this._busy()){this.next=()=>this.pounce();return{accepted:true,queued:true};}
      this._start('crouch',{done:()=>this._start('pounce',{origin:this.root,done:()=>this._start('land',{done:()=>this._idle()})})});return{accepted:true};
    }
    feed(kind,bowl,{seconds=6}={}){
      const role=kind==='water'?'drink':'eat';if(!this.has(role)||!bowl?.position||this.nap)return{accepted:false,reason:'actual_feed_clip_unavailable'};
      if(this.gait){this.next=()=>this.feed(kind,bowl,{seconds});this.stop();return{accepted:true,queued:true};}
      if(this._busy()){this.next=()=>this.feed(kind,bowl,{seconds});return{accepted:true,queued:true};}
      const position=copy3(bowl.position);position[1]=this.groundY;this.bowl={kind,position:Object.freeze(position),groundY:this.groundY,visible:true};const loop=!!this.roles.get(role).loop;this.mealRemaining=loop?Math.max(this.roles.get(role).duration,seconds):this.roles.get(role).duration;
      this._start(role,{loop,done:()=>this._finishMeal()});return{accepted:true};
    }
    _finishMeal(){this.mealRemaining=0;this._emit('meal_finished',{bowl:this.bowl});const role=this.action?.role,exit=this.roles.get(role)?.exit_role;if(exit&&this.has(exit))this._start(exit,{done:()=>this._idle()});else if(this.roles.get(role)?.ends_in_stance)this._idle();else if(this.action){this.action.elapsed=this.action.descriptor.duration;this.action.loop=false;this.action.done=null;}}
    groom(){if(!this.has('groom')||this.gait||this.nap||this._busy())return false;return this._start('groom',{done:()=>this._idle()});}
    sleep({seconds=240,yawn=true}={}){
      if(this.nap)return{accepted:true,alreadySleeping:true};if(this._missing(['lay_down','sleep_hold']).length)return{accepted:false,reason:'actual_sleep_sequence_unavailable'};
      if(this.gait){this.next=()=>this.sleep({seconds,yawn});this.stop();return{accepted:true,queued:true};}
      if(this._busy()){this.next=()=>this.sleep({seconds,yawn});return{accepted:true,queued:true};}
      const hold=clamp(seconds,180,360)*1000,transition=this.roles.get('lay_down').duration+(yawn&&this.has('yawn')?this.roles.get('yawn').duration:0);
      this.nap={id:++this.id,until:this.clock()+hold+transition*1000,holdMs:hold,stage:'preparing',yawnDone:false};this.sleepyTouches=0;this.wakeQueued=false;
      const lay=()=>{this.nap.stage='lay_down';this._start('lay_down',{done:()=>{if(!this.nap)return;this.nap.stage='sleep_hold';this.nap.until=this.clock()+hold;this._start('sleep_hold',{loop:true});}});};
      if(yawn&&this.has('yawn')){this.nap.stage='yawn';this.nap.yawnDone=true;this._start('yawn',{done:lay});}else lay();return{accepted:true};
    }
    touch({wake=false}={}){
      if(!this.nap)return{accepted:false,reason:'not_sleeping'};if(!this.has('look_sleepy'))return{accepted:false,reason:'actual_sleepy_look_unavailable'};
      const now=this.clock();if(now-this.touchAt<8000)this.sleepyTouches++;else this.sleepyTouches=1;this.touchAt=now;this.wakeQueued=this.wakeQueued||wake||this.sleepyTouches>=2;
      if(this.action?.role==='look_sleepy')return{accepted:true,queuedWake:this.wakeQueued};
      if(this.action?.role!=='sleep_hold')return{accepted:true,ignoredDuringTransition:true};
      this.nap.stage='look_sleepy';this._start('look_sleepy',{done:()=>{if(this.wakeQueued)this._wake(true);else{this.nap.stage='sleep_hold';this._start('sleep_hold',{loop:true});}}});return{accepted:true,queuedWake:this.wakeQueued};
    }
    _wake(alreadyLooked){
      if(!this.nap)return false;if(!this.has('wake_up')){this.nap.wakeUnavailable=true;this.nap.stage='sleep_hold';this._start('sleep_hold',{loop:true});return false;}
      const wake=()=>{this.nap.stage='wake_up';this._start('wake_up',{done:()=>{this.nap=null;this.wakeQueued=false;this._idle();}});};
      if(!alreadyLooked&&this.has('look_sleepy')){this.nap.stage='look_sleepy';this._start('look_sleepy',{done:wake});}else wake();return true;
    }
    _stepGait(dt){
      const previousPhase=this.action.elapsed/this.action.descriptor.duration,d=this.action.descriptor,g=this.gait,accel=d.acceleration_mps2||.4,stopping=g.stopCycle!==null,minCoast=d.stride_meters/d.cycle_seconds*.25;
      const desired=stopping?this.heading*minCoast:this.desiredSpeed;this.speed=approach(this.speed,desired,accel*dt);let delta=Math.abs(this.speed)*dt/d.stride_meters;
      if(stopping&&g.cycle+delta>=g.stopCycle-EPS){delta=Math.max(0,g.stopCycle-g.cycle);this.root[0]+=this.heading*delta*d.stride_meters*this.direction[0];this.root[2]+=this.heading*delta*d.stride_meters*this.direction[2];g.cycle=g.stopCycle;this.action.elapsed=modulo(g.cycle)*d.cycle_seconds;this.action.cycle=Math.floor(g.cycle);this._contacts(previousPhase);this.speed=0;this.desiredSpeed=0;this.stanceUntil=this.nowSeconds+.12;this.gait=null;this.action.loop=false;this.action.done=null;this._emit('stance',{role:g.role,phase:modulo(g.cycle)});return;}
      g.cycle+=delta;this.root[0]+=this.heading*delta*d.stride_meters*this.direction[0];this.root[2]+=this.heading*delta*d.stride_meters*this.direction[2];this.action.elapsed=modulo(g.cycle)*d.cycle_seconds;this.action.cycle=Math.floor(g.cycle);this._contacts(previousPhase);
    }
    _contacts(previousPhase){
      const action=this.action;if(!action||this.toy.kind!=='ball')return;const fraction=action.descriptor.duration?action.elapsed/action.descriptor.duration:0,phase=action.loop?modulo(fraction):clamp(fraction,0,1);
      if((!action.loop&&previousPhase>=1)||Math.abs(phase-previousPhase)<EPS)return;
      this.contactWindow={action,phase,previousPhase,cycle:action.cycle||0,poseToken:this.poseToken};
    }
    // Call only after the renderer has applied sample().clipTime/position and
    // obtained this frame's real paw locations. A previous-frame pose is rejected.
    resolveContacts({poseToken,clipTime,points}={}){
      const w=this.contactWindow,current=this.sample();if(!w||w.poseToken!==poseToken||poseToken!==this.poseToken||w.action!==this.action||!Number.isFinite(clipTime)||Math.abs(clipTime-current.clipTime)>1e-5)return false;
      this.contactWindow=null;const contacts=points||this.contacts();
      for(const [index,event] of (w.action.descriptor.contact_events||[]).entries()){
        const crossed=Number.isFinite(w.previousPhase)&&(w.phase>=w.previousPhase?w.previousPhase<event.phase[0]&&w.phase>=event.phase[0]:event.phase[0]>w.previousPhase||event.phase[0]<=w.phase);if(!phaseIn(w.phase,event.phase)&&!crossed)continue;
        const id=w.action.id+':'+w.cycle+':'+index;if(this.usedContacts.has(id))continue;
        const limb=contacts.find(c=>c.limb===event.limb);if(!limb?.position)continue;const p=limb.position,b=this.toy.position,r=(limb.radius||.008)+(this.toy.radius||.03),distance=Math.hypot(p[0]-b[0],p[2]-b[2]);
        if(distance>r||Math.abs(p[1]-b[1])>r)continue;
        this.usedContacts.add(id);const dx=b[0]-p[0],dz=b[2]-p[2],length=Math.hypot(dx,dz),impulse=event.impulse_mps;this.toy.velocity=this.toy.velocity||[0,0,0];this.toy.velocity[0]+=(length?dx/length:this.heading)*impulse;this.toy.velocity[2]+=(length?dz/length:0)*impulse;this._emit('toy_contact',{limb:event.limb,phase:w.phase,impulse_mps:impulse});
      }
      return true;
    }
    update(dt){
      dt=clamp(Number(dt)||0,0,.05);this.poseToken++;this.contactWindow=null;this.nowSeconds+=dt;if(this.stanceUntil&&this.nowSeconds>=this.stanceUntil){this.stanceUntil=null;this._idle();}
      if(this.gait)this._stepGait(dt);else if(!this.stanceUntil&&this.action){const a=this.action,previous=a.elapsed;a.elapsed+=dt;
        if(a.descriptor.root_trajectory){const p=trajectory(a.descriptor.root_trajectory,clamp(a.elapsed/a.descriptor.duration,0,1));this.root=[a.origin[0]+this.heading*p[0],this.groundY+p[1],a.origin[2]+this.heading*p[2]];}
        this._contacts(previous/a.descriptor.duration);
        if(a.loop&&a.elapsed>=a.descriptor.duration){a.elapsed%=a.descriptor.duration;this.usedContacts.clear();}
        else if(!a.loop&&a.elapsed>=a.descriptor.duration){a.elapsed=a.descriptor.duration;const done=a.done;a.done=null;done?.();}
      }
      if(this.nap&&this.action?.role==='sleep_hold'&&this.clock()>=this.nap.until&&!this.nap.wakeUnavailable)this._wake(false);
      if(this.mealRemaining>0&&['eat','drink'].includes(this.action?.role)){this.mealRemaining-=dt;if(this.mealRemaining<=0)this._finishMeal();}
      return this.sample();
    }
    sample(){
      const a=this.action,d=a?.descriptor;return{poseToken:this.poseToken,family:this.family,role:a?.role||'hold',clip:d?.clip||null,clipTime:a?clamp(a.elapsed,0,d.duration):0,loop:!!a?.loop,phase:a&&d.duration?(a.loop?modulo(a.elapsed/d.duration):clamp(a.elapsed/d.duration,0,1)):0,position:copy3(this.root),heading:this.heading,speed:this.speed,moving:!!this.gait,sleepUntil:this.nap?.until||null,actualSleepHold:a?.role==='sleep_hold',bowl:this.bowl,toy:this.toy,capabilities:this.capabilities()};
    }
    snapshot(){return{family:this.family,nap:this.nap?{...this.nap}:null};}
  }
  const API={PetActionController,compile,phaseIn,trajectory};global.PetActions=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window==='undefined'?globalThis:window);

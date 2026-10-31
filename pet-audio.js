"use strict";
/* Pet videos may contain music. Audio is an explicit control, never a pet-tap side effect. */
const PetAudio=(()=>{
 let audio=null,last=0,blockedUntil=0,speechToken=0;
 return {
  stop(){if(audio){audio.pause();audio.currentTime=0;audio=null;}},
  speechStart(){this.stop();blockedUntil=Date.now()+30000;return ++speechToken;},
  speechEnd(t){if(t===speechToken)blockedUntil=Date.now()+400;},
  play(kind,{explicit=false}={}){
   if(!explicit)return false;
   const S=Pet.state;
   if(!S.settings.meow||S.settings.mute||isDog(S.cat.breed)||document.hidden||Date.now()<blockedUntil||Date.now()-last<1000)return false;
   this.stop();last=Date.now();
   const happy=["pet","happy","correct","purr"].includes(kind);
   audio=new Audio(`audio/pets/orange/${happy?"happy":"meow"}-source-v1.m4a`);audio.volume=happy?.35:.45;
   const current=audio;audio.onended=()=>{if(audio===current)audio=null;};audio.play().catch(()=>{if(audio===current)audio=null;});return true;
  }
 };
})();
meowFor=function(kind,options){return PetAudio.play(kind,options);};
document.addEventListener("visibilitychange",()=>{if(document.hidden)PetAudio.stop();});

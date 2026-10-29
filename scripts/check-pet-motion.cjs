// Checks the real motion controller with a deterministic viewport and clock.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
class Element{
 constructor(){this.hidden=false;this.inert=false;this.attrs={};this.dataset={};this.children=[];this.style={setProperty:(k,v)=>this.style[k]=v};const set=new Set();this.classList={add:(...a)=>a.forEach(x=>set.add(x)),remove:(...a)=>a.forEach(x=>set.delete(x)),toggle:(k,on)=>{on===undefined?set.has(k)?set.delete(k):set.add(k):on?set.add(k):set.delete(k);},contains:k=>set.has(k)};}
 get offsetHeight(){return parseFloat(this.style['--h'])||58;} get offsetWidth(){return this.offsetHeight*1.9;}
 getAttribute(k){return k==='src'?this.src:this.attrs[k];}setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(){}setPointerCapture(){}focus(){}remove(){}matches(s){return this.hero&&s==='.hhero';}
 getBoundingClientRect(){return this.rect||{left:0,right:390,top:760,bottom:844,width:390};}
 querySelector(k){return this.parts?.[k]||new Element();}
}
let now=0,id=0,frames=new Map(),timers=new Map(),nodes=[],surfaces=[];
const state={profile:{nick:'test'},cat:{breed:'orange'},settings:{roam:true},sick:false,full:80};let stage=1;const reduced={matches:false,addEventListener(){}};
const document={hidden:false,body:{children:[],append(el){this.children.push(el);},contains:()=>true,style:{}},getElementById:()=>({hidden:false,getBoundingClientRect:()=>({top:760})}),addEventListener(){},removeEventListener(){}};
const context=vm.createContext({console,Math,Date,HTMLElement:Element,document,window:{},innerWidth:390,innerHeight:844,addEventListener(){},matchMedia:()=>reduced,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:k=>frames.delete(k),setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:k=>timers.delete(k),fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({})}),Image:class{decode(){return Promise.resolve();}},Pet:{state,view:()=>({...state,shownStage:stage}),pet(){},today:()=>'',save(){}},app:{getBoundingClientRect:()=>({left:0,right:390}),querySelectorAll:()=>surfaces},h:html=>{const el=new Element();if(html.includes('natural-pet'))el.parts={'.rp':new Element(),'img':new Element(),'.rb':new Element()};nodes.push(el);return el;},pickOne:a=>a[0],meowSafe(){},logEvent(){},petName:()=> 'test',esc:s=>s});
vm.runInContext('const ORANGE_MOTION = {};'+fs.readFileSync(path.join(root,'pets.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'motion.js'),'utf8'),context);
const run=code=>vm.runInContext(code,context);
function drain(){for(let n=0;n<2000&&frames.size;n++){now+=20;const q=[...frames.values()];frames.clear();q.forEach(fn=>fn(now));}assert.equal(frames.size,0,'motion must finish');}
let cases=0;
for(const breed of run('Object.keys(PETS)'))for(stage of [1,2,3]){
 state.cat.breed=breed;run('Roam.set(true);Roam.preview("walk")');drain();const s=run('Roam.snapshot()');assert(Number.isFinite(s.x)&&Number.isFinite(s.y));assert.equal(s.y,760,'feet must land on navigation edge');assert(s.x>=8&&s.x<=390-58*1.9);assert.equal(s.stage,stage);assert.equal(s.moving,false);assert(fs.existsSync(path.join(root,'img/pets/exact',`${breed}_${stage}.png`)));cases++;
}
const platform=new Element();platform.hero=true;platform.rect={left:0,right:390,top:130,bottom:380,width:390};surfaces=[platform];context.testPlatform=platform;
run('Roam.set(true);Roam.playAt(testPlatform)');drain();assert.equal(run('Roam.snapshot().y'),375,'hero play area must be a supported surface');
run('Roam.set(false)');assert.equal(frames.size,0);assert.equal(run('Roam.snapshot().on'),false);
reduced.matches=true;run('Roam.set(true);Roam.preview("run")');assert.equal(run('Roam.snapshot().moving'),false);
console.log(`PASS: ${cases} breed/stage movements, floor alignment, hero platform, stop, reduced motion.`);

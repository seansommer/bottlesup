import {RULES} from './simulation.js';

export const SHIFT_PHRASES = Object.freeze([
  'Clock in. Caps on. Let’s make this a good shift.',
  'The juice is loose. You’ve got this.',
  'Another day, another perfectly upright bottle.',
  'Your conveyor called. It asked for its favorite operator.',
  'A fresh bin, a fresh start. Let’s roll.',
  'Keep your friends close and your bottle caps closer.',
  'Today’s forecast: a strong chance of six-packs.',
  'No bottle left lounging. Let’s get to work.',
  'Hairnet? Check. Good vibes? Double check.',
  'The only thing we’re bottling up today is juice.'
]);
export class PhraseBag {
  constructor(random=Math.random){this.random=random;this.bag=[];this.last=null;}
  next(){
    if(!this.bag.length){this.bag=[...SHIFT_PHRASES];for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}if(this.bag.at(-1)===this.last)[this.bag[0],this.bag[this.bag.length-1]]=[this.bag.at(-1),this.bag[0]];}
    this.last=this.bag.pop();return this.last;
  }
}
export class ShiftCountdown {
  constructor(){this.elapsed=0;this.duration=3.65;}
  step(dt){this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,dt));}
  get label(){return this.elapsed<3?String(3-Math.floor(this.elapsed)):'Bottles up!';}
  get done(){return this.elapsed>=this.duration;}
}
export function flowProgress(sim){
  if(sim.fullFlow)return {fraction:Math.max(0,(sim.fullUntil-sim.time)/10),label:'BOTTLE BLITZ · ×3 points',detail:`Enjoy your groove · ${Math.ceil(sim.fullUntil-sim.time)}s`,active:true};
  const n=sim.upright, fraction=Math.min(1,n/RULES.fullFlowAt);
  if(!sim.fullArmed)return {fraction:0,label:'Great run! Keep the line moving.',detail:'The next bonus will recharge as bottles head into the machine.',active:false};
  return {fraction,label:fraction>=.8?'So close — keep that rhythm!':fraction>=.5?'Looking good, crew!':fraction>0?'Nice start. Keep them standing.':'Build your Bottle Blitz',detail:`${n} / ${RULES.fullFlowAt} good bottles standing · then ×3 points`,active:false};
}

export function validCamera(value){
  if(!value||value.version!==1)return null;
  if(value.kind==='3d'){
    const vector=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<200);
    if(!vector(value.position)||!vector(value.target)||!['first','overhead'].includes(value.view))return null;
    const distance=Math.hypot(...value.position.map((n,i)=>n-value.target[i]));if(distance<2.5||distance>45)return null;
    return {version:1,kind:'3d',view:value.view,position:[...value.position],target:[...value.target]};
  }
  if(value.kind==='2d'&&Number.isFinite(value.zoom)&&value.zoom>=.65&&value.zoom<=4.5&&Array.isArray(value.pan)&&value.pan.length===2&&value.pan.every(n=>Number.isFinite(n)&&Math.abs(n)<20)&&Number.isFinite(value.angle))return {version:1,kind:'2d',view:'overhead',zoom:value.zoom,pan:[...value.pan],angle:value.angle};
  return null;
}
export class PlayerPreferences {
  constructor(storage){this.storage=storage;}
  key(player){return `bottlesUp.preferences.v1.${player||'guest'}`;}
  read(player){try{const p=JSON.parse(this.storage.getItem(this.key(player))||'{}');return {camera:validCamera(p.camera),dashboard:p.dashboard===true};}catch{return {camera:null,dashboard:false};}}
  write(player,patch){try{const p={...this.read(player),...patch};if(p.camera)p.camera=validCamera(p.camera);this.storage.setItem(this.key(player),JSON.stringify(p));return true;}catch{return false;}}
}

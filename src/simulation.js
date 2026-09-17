import {releaseBottle, stepDrop} from './dumper.js';
export const RULES = Object.freeze({ version: '1.0.0', shiftSeconds:180, wasteLimit:12, secondaryCapacity:50, primaryCapacity:48, fullFlowAt:34 });
export const JUICES = [
 {name:'Mighty Dozen',color:'#588520',label:'#087a40',short:'MIGHTY DOZEN'},
 {name:'Celery + Lemon',color:'#9eb51f',label:'#aacb19',short:'CELERY + LEMON'},
 {name:'Citrus Pineapple',color:'#f4b624',label:'#efaa17',short:'IMMUNITY'},
 {name:'Berry Lemon',color:'#bb344d',label:'#a3158c',short:'GUT HEALTH'}
];
export function seededRandom(seed=1){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export class Simulation{
 constructor({mode='shift',seed=12345,onEvent=()=>{}}={}){
  this.mode=mode;this.seed=seed;this.random=seededRandom(seed);this.onEvent=onEvent;this.time=0;this.level=1;this.score=0;this.waste=0;this.stood=0;this.rejected=0;this.delivered=0;this.maxCombo=0;this.combo=0;this.lastAction=-20;this.bottles=[];this.nextId=1;this.binsLoaded=0;this.binLeft=0;this.binState='empty';this.loadTime=0;this.tilt=0;this.lift=0;this.feeder=0.5;this.dumpCredit=0;this.transferCredit=0;this.stopUntil=0;this.cards=1;this.helpers=[];this.fullUntil=0;this.fullArmed=true;this.qualityUntil=0;this.rewardProgress=0;this.bestFullness=0;this.ended=false;this.paused=false;this.reason='';this.pendingReward=null;this.batchDelivered=0;this.batchReady=false;
 }
 get juice(){return JUICES[(this.level-1)%JUICES.length];}
 get binsRequired(){return Math.min(4,2+Math.floor((this.level-1)/3));}
 get binSize(){return 32+Math.min(12,(this.level-1)*2);}
 get secondarySpeed(){return .38+Math.min(.58,(this.level-1)*.055);}
 get secondary(){return this.bottles.filter(b=>b.belt==='secondary');}
 get upright(){return this.secondary.filter(b=>b.up&&!b.defect).length;}
 get fullness(){return Math.min(1,this.upright/RULES.secondaryCapacity);}
 get fullFlow(){return this.time<this.fullUntil;}
 get stopped(){return this.time<this.stopUntil;}
 event(type,data={}){this.onEvent({type,...data});}
 loadBin(){if(this.ended||this.paused||this.batchReady||this.binState!=='empty'||this.tilt>8||this.binsLoaded>=this.binsRequired)return false;this.binState='loading';this.loadTime=1.2;this.binLeft=this.binSize;for(let i=0;i<this.binSize;i++){const b=this.addBottle();b.belt='bin';b.slot=i;}this.event('load');return true;}
 setLift(dir){this.lift=Math.sign(dir);}
 setFeeder(value){this.feeder=Math.max(0,Math.min(1,Number(value)||0));}
 stopBelt(){if(!this.cards||this.ended||this.paused||this.batchReady)return false;this.cards--;this.stopUntil=Math.max(this.time,this.stopUntil)+7;this.event('stop');return true;}
 addBottle(){const r=this.random(),defect=r<.037?'label':r<.071?'cap':r<.10?'fill':null;const b={id:this.nextId++,belt:'primary',x:-4.2+(this.random()-.5)*2.2,z:-4.65,up:false,defect,rotation:this.random()*Math.PI*2,age:0,awarded:false,finicky:this.random()<.05,wobbleAt:5+this.random()*11,wobbled:false};this.bottles.push(b);return b;}
 points(n){this.score=Math.max(0,Math.round(this.score+n));}
 action(id,reject=false,helper=false){if(this.ended||this.paused||this.batchReady)return false;const b=this.bottles.find(b=>b.id===id);if(!b||b.belt!=='secondary')return false;
  if(reject){this.bottles=this.bottles.filter(x=>x!==b);if(b.defect){this.rejected++;this.points(30*(this.fullFlow?3:1));this.rewardProgress++;this.event('reject',{id,good:true,x:b.x,z:b.z});}else{this.points(-25);this.combo=0;this.event('reject',{id,good:false,x:b.x,z:b.z});}return true;}
  if(b.up)return false;b.up=true;b.rotation=0;let points=2;if(!b.awarded){b.awarded=true;this.stood++;if(!helper){this.combo=this.time-this.lastAction<2.5?this.combo+1:1;this.lastAction=this.time;this.maxCombo=Math.max(this.maxCombo,this.combo);}points=10*Math.min(4,1+Math.floor(this.combo/8));this.rewardProgress++;}points*=this.fullFlow?3:1;this.points(points);this.event('stand',{id,points,helper,x:b.x,z:b.z});return true;
 }
 loseBottle(b,why){this.bottles=this.bottles.filter(x=>x!==b);this.waste++;this.combo=0;this.points(why==='defect'?-60:-35);this.event('waste',{why,id:b.id,x:b.x,z:b.z});if(this.mode!=='practice'&&this.waste>=RULES.wasteLimit)this.finish('Line overflow');}
 award(){if(this.pendingReward)return;const kinds=['stop','helper','points','card','quality'];this.pendingReward=kinds[Math.floor(this.random()*kinds.length)];this.event('mystery');}
 openReward(){const kind=this.pendingReward;if(!kind||this.ended||this.paused||this.batchReady)return null;this.pendingReward=null;if(kind==='stop')this.stopUntil=Math.max(this.time,this.stopUntil)+8;if(kind==='helper'){if(this.helpers.length<4)this.helpers.push({until:this.time+25,next:this.time+.6,index:this.helpers.length});else this.points(250);}if(kind==='points')this.points(250);if(kind==='card')this.cards=Math.min(5,this.cards+1);if(kind==='quality')this.qualityUntil=this.time+18;this.event('reward',{kind});return kind;}
 step(dt){if(this.paused||this.ended||this.batchReady)return;dt=Math.min(.05,Math.max(0,dt));this.time+=dt;
  if(this.mode==='shift'&&this.time>=RULES.shiftSeconds){this.time=RULES.shiftSeconds;this.finish('Shift complete');return;}
  if(this.time-this.lastAction>2.5)this.combo=0;
  if(this.binState==='loading'){this.loadTime-=dt;if(this.loadTime<=0){this.binState='ready';this.binLeft=this.binSize;this.binsLoaded++;this.event('loaded');}}
  if(this.binState!=='loading')this.tilt=Math.max(0,Math.min(100,this.tilt+this.lift*35*dt));
  if(this.binState==='ready'&&this.tilt>42&&this.binLeft){this.dumpCredit+=dt*(1.2+(this.tilt-42)*.19);while(this.dumpCredit>=1&&this.binLeft){this.dumpCredit--;const b=this.bottles.findLast(b=>b.belt==='bin');if(!b)break;this.binLeft--;releaseBottle(b);}if(!this.binLeft){this.binState='empty';this.dumpCredit=0;this.event('binEmpty');}}
  for(const b of this.bottles.filter(b=>b.belt==='falling')){if(stepDrop(b,dt,this.tilt)){if(this.bottles.filter(x=>x.belt==='primary').length>RULES.primaryCapacity){this.loseBottle(b,'feeder overflow');if(this.ended)return;}else this.event('land',{id:b.id});}}
  const primary=this.bottles.filter(b=>b.belt==='primary');const primSpeed=this.feeder*2.6;
  for(const b of primary){b.age+=dt;b.z=Math.min(-1.75,b.z+primSpeed*dt);}
  this.transferCredit+=dt*this.feeder*9;
  if(this.transferCredit>=1){this.transferCredit=Math.min(2,this.transferCredit);const waiting=primary.filter(b=>b.z>=-1.8);for(const b of waiting){if(this.transferCredit<1)break;const laneOrder=[0,1,2,3,4].sort((a,c)=>this.secondary.filter(x=>x.lane===a).length-this.secondary.filter(x=>x.lane===c).length);const lane=laneOrder.find(l=>!this.secondary.some(x=>x.lane===l&&x.x<-3.35));if(lane===undefined)break;b.belt='secondary';b.lane=lane;b.x=-4.45;b.z=(lane-2)*.48;b.age=0;this.transferCredit--;}}
  // Spacing makes laid-down bottles consume much more belt length than upright bottles.
  for(let lane=0;lane<5;lane++){const row=this.secondary.filter(b=>b.lane===lane).sort((a,b)=>b.x-a.x);let ahead=null;for(const b of row){b.age+=dt;const space=(b.up?.26:.53)+(ahead?.up?.26:.53);const maxX=ahead?ahead.x-space:6.0;b.x=Math.min(maxX,b.x+(this.stopped?0:this.secondarySpeed)*dt);if(b.finicky&&!b.wobbled&&b.up&&b.age>b.wobbleAt){b.up=false;b.wobbled=true;b.rotation=Math.PI/2;this.event('wobble',{id:b.id});}if(b.x>=5.97){if(b.up&&!b.defect){this.delivered++;this.batchDelivered++;this.points(8*(this.fullFlow?3:1));this.bottles=this.bottles.filter(x=>x!==b);this.event('delivered');continue;}b.jam=(b.jam||0)+dt;if(b.jam>1.5){this.loseBottle(b,b.defect?'defect':'fallen at machine');if(this.ended)return;continue;}}ahead=b;}}
  // Accumulated transfer pressure knocks bottles off if the entry remains packed.
  const blocked=primary.filter(b=>b.z>=-1.8).length>18&&this.feeder>.15;this.pressure=blocked?(this.pressure||0)+dt:Math.max(0,(this.pressure||0)-dt);if(this.pressure>2){this.pressure=0;const b=primary[0];if(b)this.loseBottle(b,'transfer overflow');if(this.ended)return;}
  this.helpers=this.helpers.filter(h=>h.until>this.time);for(const h of this.helpers){if(h.next<this.time){h.next=this.time+1.0;const b=this.secondary.filter(b=>!b.up&&!b.defect).sort((a,b)=>b.x-a.x)[0];if(b)this.action(b.id,false,true);}}
  if(this.qualityUntil>this.time){this.qaTick=(this.qaTick||0)+dt;if(this.qaTick>1){this.qaTick=0;const b=this.secondary.find(b=>b.defect);if(b)this.action(b.id,true,true);}}
  this.bestFullness=Math.max(this.bestFullness,this.fullness);if(this.fullArmed&&this.upright>=RULES.fullFlowAt){this.fullUntil=this.time+10;this.fullArmed=false;this.points(300);this.event('fullFlow');}if(!this.fullFlow&&this.upright<22)this.fullArmed=true;
  if(this.rewardProgress>=18&&!this.pendingReward){this.rewardProgress-=18;this.award();}
  if(this.binsLoaded>=this.binsRequired&&this.binLeft===0&&this.bottles.length===0&&!this.ended){this.batchReady=true;this.lift=0;this.event('batchComplete',{bottles:this.batchDelivered,juiceIndex:(this.level-1)%JUICES.length});}
 }
 completeBatch(){if(!this.batchReady||this.ended)return false;this.batchReady=false;this.batchDelivered=0;this.level++;this.binsLoaded=0;this.binState='empty';this.tilt=0;this.lift=0;this.points(300);this.event('level',{level:this.level,juice:this.juice.name});return true;}
 finish(reason){if(this.ended)return;this.ended=true;this.lift=0;this.reason=reason;this.event('end',{result:this.result()});}
 result(){return{version:RULES.version,mode:this.mode,seed:this.seed,score:this.score,level:this.level,stood:this.stood,rejected:this.rejected,delivered:this.delivered,waste:this.waste,maxCombo:this.maxCombo,bestFullness:Math.round(this.bestFullness*100),duration:Math.round(this.time),reason:this.reason};}
}

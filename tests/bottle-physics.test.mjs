import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {overlaps,moveBody,SECONDARY_BOUNDS,PRIMARY_BOUNDS,INTAKE_SLOTS,fits} from '../src/bottle-physics.js';
const advance=(s,t)=>{for(let i=0;i<t*60;i++)s.step(1/60);};
const make=(s,patch={})=>Object.assign(s.addBottle(),{belt:'secondary',x:0,z:0,up:true,defect:null,finicky:false},patch);
const row=(s,n=6)=>INTAKE_SLOTS.slice(0,n).map((z,gateSlot)=>make(s,{x:6.25,z,gateSlot}));

test('standing preserves free-form positions; swept motion cannot pass through another bottle',()=>{
 const s=new Simulation(),a=make(s,{x:1.139,z:.213,up:false,rotation:1.12}),b=make(s,{x:2,z:.21});
 s.action(a.id);assert.equal(a.x,1.139);assert.equal(a.z,.213);moveBody(a,10,0,[a,b],SECONDARY_BOUNDS);assert.ok(!overlaps(a,b));assert.ok(a.x<b.x);
});
test('the machine waits for six, then awards and removes exactly one complete row',()=>{
 const events=[],s=new Simulation({onEvent:e=>events.push(e)}),first=row(s,5);advance(s,.1);assert.equal(s.delivered,0);assert.equal(s.score,0);assert.equal(s.queueCount,5);
 make(s,{x:6.25,z:INTAKE_SLOTS[5],gateSlot:5});s.step(1/60);assert.equal(s.delivered,6);assert.equal(s.sixPacks,1);assert.equal(s.score,48);assert.equal(s.batchDelivered,6);assert.equal(s.secondary.length,0);advance(s,3);assert.equal(s.score,48);assert.equal(events.filter(e=>e.type==='intake').length,1);assert.equal(s.action(first[0].id),false);
});
test('one through five final stragglers earn half intake points, including shift cutoff',()=>{
 for(let n=1;n<6;n++){
  const s=new Simulation();s.binsLoaded=s.binsRequired;row(s,n);s.step(1/60);assert.equal(s.score,n*4);assert.equal(s.stragglers,n);assert.equal(s.sixPacks,0);assert.equal(s.batchReady,true);assert.equal(s.batchDelivered,n);
  const cutoff=new Simulation();row(cutoff,n);cutoff.time=179.999;cutoff.step(1/60);assert.equal(cutoff.score,n*4);assert.equal(cutoff.ended,true);assert.equal(cutoff.delivered,n);
 }
});
test('reject bin counts manual, helper and machine defects without counting the same bottle twice',()=>{
 const s=new Simulation();const a=make(s,{defect:'cap'});s.action(a.id,true);s.action(a.id,true);s.action(make(s,{x:1}).id,true);const bad=make(s,{x:6.25,z:1.2,defect:'fill',jam:1.5});s.step(1/60);assert.equal(s.rejectBinCount,3);assert.equal(s.rejectBinBad,2);assert.equal(s.rejected,1);assert.equal(s.waste,1);assert.equal(s.bottles.includes(bad),false);assert.equal(s.rejectBinItems.length,3);
});
test('several busy shifts preserve collision bounds and keep completing six-packs',()=>{
 for(const seed of [17,73,120]){
  const s=new Simulation({mode:'practice',seed});let checked=0;
  for(let frame=0;frame<240*60;frame++){
   if(s.batchReady)s.completeBatch();
   if(s.binState==='empty'){s.setLift(s.tilt>0?-1:0);if(s.tilt<=.1)s.loadBin();}else if(s.binState==='ready')s.setLift(1);
   for(const b of s.secondary)s.action(b.id,!!b.defect);
   s.step(1/60);
   for(const belt of ['primary','secondary']){
    const bottles=s.bottles.filter(b=>b.belt===belt),bounds=belt==='primary'?PRIMARY_BOUNDS:SECONDARY_BOUNDS;
    for(const b of bottles){assert.ok(fits(b,bottles.filter(o=>(o.layer||0)===(b.layer||0)),bounds),`seed ${seed}, frame ${frame}, ${belt}, bottle ${b.id}`);checked++;}
   }
  }
  assert.ok(checked>10000);assert.ok(s.level>=2,`seed ${seed}: the intake must not deadlock`);assert.ok(s.sixPacks>=9);assert.equal(s.delivered,s.sixPacks*6+s.stragglers);
 }
});

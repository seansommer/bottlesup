import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Simulation} from '../src/simulation.js';
import {binSlot,fromBin,dumperPose,BELT_HEIGHT} from '../src/dumper.js';
import {crate} from '../src/models.js';
import {Palletizer} from '../src/palletizer.js';
import {TapGesture,nearbyBottles} from '../src/picking.js';
const advance=(s,seconds)=>{for(let i=0;i<seconds*60;i++)s.step(1/60);};

test('raising lifts the rear of the bin and the rendered hinge matches bottle coordinates',()=>{
 const rear={x:0,y:0,z:-2};assert.ok(fromBin(rear,65).y>fromBin(rear,0).y+1.5);
 for(const angle of [0,43,75,100]){const group=new THREE.Group(),p=dumperPose(angle);group.position.set(p.x,p.y,p.z);group.rotation.x=p.angle;const local=binSlot(21);const actual=group.localToWorld(new THREE.Vector3(local.x,local.y,local.z)),expected=fromBin(local,angle);assert.ok(actual.distanceTo(new THREE.Vector3(expected.x,expected.y,expected.z))<1e-9);}
 const bin=crate();bin.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(0,3,0),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(bin,true)[0];assert.ok(hit.point.y<.3,'The center is open, not covered by a solid lid.');
});
test('one bin contains its inventory before pouring, releases the same bottles, then lands on the feeder',()=>{
 const s=new Simulation({mode:'practice'});s.setFeeder(0);s.loadBin();const ids=s.bottles.map(b=>b.id);assert.equal(ids.length,s.binSize);assert.ok(s.bottles.every(b=>b.belt==='bin'));
 advance(s,2);assert.equal(s.binLeft,s.binSize);s.setLift(1);advance(s,1.15);s.setLift(0);advance(s,1);assert.equal(s.binLeft,s.binSize,'No spill below 42 degrees.');
 s.setLift(1);advance(s,.3);s.setLift(0);let sawAir=false;for(let i=0;i<14*60;i++){s.step(1/60);if(s.bottles.some(b=>b.belt==='falling'))sawAir=true;assert.equal(s.bottles.filter(b=>b.belt==='bin').length,s.binLeft);assert.equal(s.bottles.length,s.binSize);}
 assert.ok(sawAir);assert.ok(s.bottles.some(b=>b.belt==='primary'));assert.deepEqual(s.bottles.map(b=>b.id),ids);assert.ok(s.bottles.filter(b=>b.belt==='primary').every(b=>b.y===BELT_HEIGHT&&b.z>=-4.8&&b.z<=-2.1));
});
test('airborne bottles pause in place and cannot be tapped or counted as good output',()=>{
 const s=new Simulation({mode:'practice'});s.loadBin();advance(s,1.3);s.setLift(1);advance(s,2);s.setLift(0);const b=s.bottles.find(b=>b.belt==='falling');assert.ok(b);assert.equal(s.action(b.id),false);assert.equal(s.action(b.id,true),false);s.paused=true;const before=structuredClone(b);advance(s,3);assert.deepEqual(b,before);assert.equal(s.delivered,0);
});
test('only accepted good exits enter the batch packing count',()=>{
 const s=new Simulation();for(const [lane,defect,up] of [[0,null,true],[1,'cap',true],[2,null,false]])Object.assign(s.addBottle(),{belt:'secondary',x:6,z:(lane-2)*.48,lane,up,defect,finicky:false});advance(s,2);assert.equal(s.delivered,1);assert.equal(s.batchDelivered,1);assert.equal(s.waste,2);
});
test('manual packing requires wrap before place and never duplicates a six-pack',()=>{
 const p=new Palletizer(13);assert.equal(p.total,2);assert.equal(p.loose,1);assert.equal(p.place(),false);assert.equal(p.wrap(),true);assert.equal(p.wrap(),false);p.step(.8);assert.equal(p.phase,'wrapped');assert.equal(p.stacked,0);assert.equal(p.place(),true);assert.equal(p.place(),false);p.step(.8);assert.equal(p.stacked,1);assert.equal(p.phase,'ready');p.auto=true;for(let i=0;i<180;i++)p.step(1/60);assert.equal(p.phase,'done');assert.equal(p.stacked,2);p.step(100);assert.equal(p.stacked*6+p.loose,13);
});
test('zero, partial and exact packs account for every accepted bottle',()=>{
 for(const count of [0,1,5,6,12,32,63,128]){const p=new Palletizer(count);p.auto=true;for(let i=0;i<200*60;i++)p.step(1/60);assert.equal(p.phase,'done');assert.equal(p.stacked,Math.floor(count/6));assert.equal(p.stacked*6+p.loose,count);}
});
const pointer=(id,x,y,button=0)=>({pointerId:id,clientX:x,clientY:y,button});
test('tap targets are forgiving, but drags and pinches can never activate bottles',()=>{
 const g=new TapGesture();g.down(pointer(1,100,100));assert.ok(g.up(pointer(1,102,102)));g.down(pointer(1,100,100));g.move(pointer(1,140,100));assert.equal(g.up(pointer(1,100,100)),null);
 g.down(pointer(1,100,100));g.down(pointer(2,105,100));assert.equal(g.up(pointer(1,100,100)),null);assert.equal(g.up(pointer(2,105,100)),null);
 g.down(pointer(3,100,100));g.cancel(pointer(3,100,100));assert.equal(g.up(pointer(3,100,100)),null);
 assert.deepEqual(nearbyBottles([{id:1,x:100,y:100},{id:2,x:108,y:100},{id:3,x:180,y:100}],104,107),[1,2]);
});
test('confirming an old bottle ID cannot reject its neighbor after it leaves',()=>{
 const s=new Simulation();const a=Object.assign(s.addBottle(),{belt:'secondary',lane:0,x:6,z:-.96,up:true,defect:null,finicky:false}),b=Object.assign(s.addBottle(),{belt:'secondary',lane:1,x:1,z:-.48,up:false,defect:null,finicky:false});advance(s,.1);const score=s.score;assert.equal(s.action(a.id,true),false);assert.ok(s.bottles.includes(b));assert.equal(s.score,score);
});

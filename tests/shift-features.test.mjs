import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,seededRandom,RULES} from '../src/simulation.js';
import {PlayerPreferences,validCamera,ShiftCountdown,PhraseBag,SHIFT_PHRASES,flowProgress} from '../src/shift-features.js';
import {controlState,PLANT} from '../src/control-state.js';
import {EquipmentGesture} from '../src/equipment-input.js';
import {makeBonusCube,animateBonusCube} from '../src/bonus-cube.js';

const camera={version:1,kind:'3d',view:'overhead',position:[3,8,9],target:[1,1,-2]};
test('camera and dashboard preferences survive a new session and stay isolated by player',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},prefs=new PlayerPreferences(storage);
 prefs.write('sean',{camera,dashboard:true});prefs.write('pat',{camera:{...camera,view:'first',position:[5,8,9]}});prefs.write(null,{dashboard:true});
 const again=new PlayerPreferences(storage);assert.deepEqual(again.read('sean'),{camera,dashboard:true});assert.equal(again.read('pat').camera.position[0],5);assert.equal(again.read(null).camera,null);assert.equal(again.read('new-user').dashboard,false);
 prefs.write('sean',{dashboard:false});assert.deepEqual(prefs.read('sean').camera,camera);
 data.set(prefs.key('sean'),'{bad');assert.equal(prefs.read('sean').camera,null);
 assert.equal(validCamera({...camera,position:[NaN,2,3]}),null);assert.equal(validCamera({...camera,target:camera.position}),null);
 const blocked=new PlayerPreferences({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});assert.equal(blocked.write('sean',{camera}),false);assert.deepEqual(blocked.read('sean'),{camera:null,dashboard:false});
});
test('countdown completes before simulation starts and supports an interruption without lost time',()=>{
 const s=new Simulation(),c=new ShiftCountdown();assert.equal(c.label,'3');c.step(1);assert.equal(c.label,'2');c.step(1);assert.equal(c.label,'1');c.step(1);assert.equal(c.label,'Bottles up!');assert.equal(c.done,false);assert.equal(s.time,0);c.step(.65);assert.equal(c.done,true);s.step(1/60);assert.equal(s.time,1/60);
});
test('the phrase bank uses all ten phrases before repeating, without repeating at the boundary',()=>{
 const bag=new PhraseBag(seededRandom(7)),first=Array.from({length:10},()=>bag.next()),second=Array.from({length:10},()=>bag.next());assert.equal(new Set(first).size,10);assert.equal(new Set(second).size,10);assert.notEqual(first.at(-1),second[0]);assert.deepEqual([...first].sort(),[...SHIFT_PHRASES].sort());
});
test('Full Flow meter reaches the actual 34-bottle trigger and shows active bonus time',()=>{
 const s=new Simulation();for(let i=0;i<17;i++)Object.assign(s.addBottle(),{belt:'secondary',up:true,defect:null});assert.equal(flowProgress(s).fraction,.5);
 for(let i=17;i<RULES.fullFlowAt;i++)Object.assign(s.addBottle(),{belt:'secondary',up:true,defect:null});assert.equal(flowProgress(s).fraction,1);s.fullUntil=10;s.time=4;assert.equal(flowProgress(s).fraction,.6);assert.equal(flowProgress(s).active,true);
});
test('scene guidance lights only the next appropriate dumper action and pauses safely',()=>{
 const s=new Simulation();assert.equal(controlState(s).load.glow,true);assert.equal(controlState(s).raise.glow,false);s.tilt=.2;assert.equal(controlState(s).load.glow,false);
 s.tilt=50;s.binState='empty';assert.equal(controlState(s).lower.glow,true);const b=s.addBottle();assert.equal(controlState(s).lower.glow,false);b.belt='falling';assert.equal(controlState(s).lower.glow,false);s.bottles=[];assert.equal(controlState(s).lower.glow,true);
 s.binState='ready';s.binLeft=32;s.tilt=0;assert.equal(controlState(s).raise.glow,true);s.paused=true;for(const state of Object.values(controlState(s))){assert.equal(state.glow,false);assert.equal(state.enabled,false);}
 assert.equal(PLANT.machineLength/PLANT.beltLength,.25);
});
test('equipment holds stop on release, cancellation and a second touch; drags cannot activate a button',()=>{
 const events=[],g=new EquipmentGesture((...args)=>events.push(args)),e=(pointerId,x=1)=>({pointerId,clientX:x,clientY:1});
 g.down('raise',e(1));g.up(e(1));assert.deepEqual(events.splice(0),[['raise','start'],['raise','end']]);
 g.down('lower',e(1));g.cancel();g.up(e(1));assert.deepEqual(events.splice(0),[['lower','start'],['lower','end']]);
 g.down('raise',e(1));g.down('lower',e(2));assert.deepEqual(events.splice(0),[['raise','start'],['raise','end']]);
 g.down('load',e(1));g.move(e(1,30));g.up(e(1));assert.deepEqual(events,[]);g.down('load',e(1));g.up(e(1,3));assert.deepEqual(events,[['load','tap']]);
});
test('rainbow bonus has physical glass and respects reduced motion',()=>{
 const cube=makeBonusCube({withText:false});assert.equal(cube.userData.glass.isMeshPhysicalMaterial,true);assert.ok(cube.userData.glass.iridescence>0);animateBonusCube(cube,0,true,true);const before=cube.rotation.toArray(),color=cube.userData.glass.color.getHex(),inner=cube.userData.inner.rotation.y;animateBonusCube(cube,15,true,true);assert.deepEqual(cube.rotation.toArray(),before);assert.equal(cube.userData.glass.color.getHex(),color);assert.equal(cube.userData.inner.rotation.y,inner);
});

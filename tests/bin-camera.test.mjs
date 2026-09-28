import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from 'three';import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Simulation} from '../src/simulation.js';import {nextBinAction} from '../src/control-state.js';import {FactoryScene} from '../src/scene.js';import {PlantControls} from '../src/plant-controls.js';import {Palletizer} from '../src/palletizer.js';import {EquipmentGesture} from '../src/equipment-input.js';
const advance=(s,t)=>{for(let i=0;i<t*60;i++)s.step(1/60);};
function rig(){const doc=new EventTarget(),el=new EventTarget();Object.assign(el,{style:{},ownerDocument:doc,getRootNode:()=>doc,clientHeight:844,clientWidth:390});const r=Object.create(FactoryScene.prototype);r.camera=new THREE.PerspectiveCamera(47,390/844,.1,90);r.controls=new OrbitControls(r.camera,el);Object.assign(r.controls,{minDistance:3,maxDistance:42,minPolarAngle:.08,maxPolarAngle:Math.PI*.47});r.setView('first');return r;}
test('the same bin tap loads, raises, stops a partial tilt, lowers, then loads the next bin',()=>{
 const s=new Simulation({mode:'practice'});assert.equal(nextBinAction(s),'load');assert.equal(s.tapBin(),true);assert.equal(s.tapBin(),false);advance(s,1.3);assert.equal(nextBinAction(s),'raise');s.tapBin();advance(s,.6);assert.ok(s.tilt>15);s.tapBin();const angle=s.tilt;advance(s,.3);assert.equal(s.tilt,angle);
 // Complete the pour, retaining feeder bottles: the very next bin tap must lower.
 s.binState='empty';s.binLeft=0;s.bottles=s.bottles.filter(b=>b.belt!=='bin');s.addBottle();assert.equal(nextBinAction(s),'lower');s.tapBin();advance(s,1);assert.equal(s.tilt,0);assert.equal(s.lift,0);assert.equal(s.tiltTarget,null);assert.equal(nextBinAction(s),'load');s.tapBin();advance(s,1.3);assert.equal(s.binsLoaded,2);assert.equal(nextBinAction(s),'raise');
});
test('pausing/manual controls cancel automatic tilt; dragging or pinching a bin never activates it',()=>{
 const s=new Simulation();s.binState='ready';s.binLeft=32;s.tapBin();advance(s,.4);s.setLift(0);const angle=s.tilt;advance(s,.5);assert.equal(s.tilt,angle);s.paused=true;assert.equal(s.tapBin(),false);s.paused=false;s.batchReady=true;assert.equal(s.tapBin(),false);
 const calls=[],g=new EquipmentGesture((...args)=>calls.push(args)),p=(id,x)=>({pointerId:id,clientX:x,clientY:10});g.down('bin',p(1,10));assert.equal(calls.length,0);g.move(p(1,30));g.up(p(1,30));assert.equal(calls.length,0);g.down('bin',p(2,10));g.down('bin',p(3,10));g.up(p(2,10));assert.equal(calls.length,0);g.down('bin',p(4,10));g.up(p(4,10));assert.deepEqual(calls,[['bin','tap']]);
});
test('countdown orbit preserves saved camera, returns exactly to it, and reduced motion skips the sweep',()=>{
 const r=rig();r.cameraAction('in');const saved=r.getCamera(),position=r.camera.position.clone();r.startIntro();r.updateIntro(.4);assert.ok(r.camera.position.distanceTo(position)>1);assert.deepEqual(r.getCamera(),saved);r.updateIntro(1);assert.ok(r.camera.position.distanceTo(position)<1e-6);r.endIntro();assert.deepEqual(r.getCamera(),saved);r.startIntro(true);assert.equal(r.intro,0);assert.deepEqual(r.getCamera(),saved);r.controls.dispose();
});
test('every palletizing stage starts from its preset and restores the player view afterward',()=>{
 const r=rig(),saved=r.getCamera();r.setPacking(new Palletizer(60));const preset=r.camera.position.clone();r.cameraAction('rotate-right');assert.ok(r.camera.position.distanceTo(preset)>1);r.setPacking(null);assert.equal(r.getCamera().view,saved.view);assert.ok(r.camera.position.distanceTo(new THREE.Vector3(...saved.position))<1e-6);assert.ok(r.controls.target.distanceTo(new THREE.Vector3(...saved.target))<1e-6);r.setPacking(new Palletizer(60));assert.ok(r.camera.position.distanceTo(preset)<1e-6);r.setPacking(null);r.controls.dispose();
});
test('next juice preview is prepared independently from the prior juice being packed',()=>{
 const p=Object.create(PlantControls.prototype);p.binJuices=new THREE.Group();p.models=Array.from({length:4},(_,i)=>{const good=new THREE.Group();good.name='juice-'+i;return {good};});p.setJuice(0);p.setJuice(1);assert.equal(p.binJuices.children.length,6);assert.ok(p.binJuices.children.every(b=>b.name==='juice-1'&&b.userData.control==='bin'));const first=p.binJuices.children[0];p.setJuice(1);assert.equal(p.binJuices.children[0],first);const packing=new Palletizer(30,0);assert.equal(packing.juiceIndex,0);
});

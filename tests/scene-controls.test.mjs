import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {FactoryScene} from '../src/scene.js';
import {PackingScene} from '../src/packing-scene.js';
import {Palletizer} from '../src/palletizer.js';
import {bottle} from '../src/models.js';

test('camera supports a full orbit, zoom, persistent adjustments and restoration after packing',()=>{
 const doc=new EventTarget(),element=new EventTarget();Object.assign(element,{style:{},ownerDocument:doc,getRootNode:()=>doc,clientHeight:800,clientWidth:390});
 // Exercise the real controls and scene camera methods without requiring a GPU.
 const rig=Object.create(FactoryScene.prototype);rig.camera=new THREE.PerspectiveCamera(47,390/800,.1,90);rig.controls=new OrbitControls(rig.camera,element);Object.assign(rig.controls,{minDistance:3,maxDistance:42,minPolarAngle:.08,maxPolarAngle:Math.PI*.47});
 rig.setView('first');const original=rig.camera.position.clone();for(let i=0;i<20;i++)rig.cameraAction('rotate-right');assert.ok(original.distanceTo(rig.camera.position)<1e-6);
 rig.cameraAction('in');assert.ok(rig.camera.position.distanceTo(rig.controls.target)<original.distanceTo(rig.controls.target));rig.cameraAction('up');const manual=rig.camera.position.clone();rig.controls.update();assert.ok(manual.distanceTo(rig.camera.position)<1e-6);
 rig.setPacking(new Palletizer(13));rig.setPacking(null);assert.ok(manual.distanceTo(rig.camera.position)<1e-6);rig.controls.dispose();
});

test('the 3D pallet contains six bottles per finished pack and no duplicate active pack',()=>{
 const group=new THREE.Scene(),models=Array.from({length:4},()=>({good:bottle()})),scene=new PackingScene(group,models),p=new Palletizer(13);p.auto=true;
 for(let i=0;i<600;i++){p.step(1/60);scene.update(p);}
 assert.equal(scene.packs.length,2);for(const pack of scene.packs)assert.equal(pack.children.filter(x=>x.name==='SujaBottle').length,6);assert.equal(scene.work.visible,false);
 scene.products.traverse(o=>{if(o.isMesh){o.updateWorldMatrix(true,false);assert.ok(o.matrixWorld.elements.every(Number.isFinite));}});
});

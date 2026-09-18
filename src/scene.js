import * as THREE from 'three';
import {box,cyl,sphere,bottle,worker,crate,materials as M} from './models.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TapGesture,nearbyBottles} from './picking.js';
import {binSlot,fromBin,dumperPose} from './dumper.js';
import {PackingScene} from './packing-scene.js';
import {PlantControls} from './plant-controls.js';
import {installEquipmentInput} from './equipment-input.js';
import {PLANT} from './control-state.js';
import {validCamera} from './shift-features.js';
import {JUICES} from './simulation.js';
export class FactoryScene{
 constructor(canvas,onPick,onControl=()=>{}){
  this.kind='3d';this.interactionActive=false;this.intakes=[];
  this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#d8e8df');this.scene.fog=new THREE.Fog('#d8e8df',24,65);this.camera=new THREE.PerspectiveCamera(47,1,.1,90);this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.view='first';this.meshes=new Map();this.pool=new Map();this.particles=[];this.clock=0;this.cameraTarget=new THREE.Vector3();this.intro=0;this.labels=JUICES.map(j=>this.label(j));this.models=JUICES.map((j,i)=>Object.fromEntries([null,'label','cap','fill'].map(d=>[d||'good',bottle({...j,texture:this.labels[i],defect:d})])));
  this.scene.add(new THREE.HemisphereLight(0xf1fff8,0x52675b,2.5));const sun=new THREE.DirectionalLight(0xfff7e7,4);sun.position.set(-4,13,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:13,bottom:-12,near:.5,far:40});sun.shadow.bias=-.001;sun.shadow.normalBias=.035;this.scene.add(sun);const rim=new THREE.DirectionalLight(0xbdc6ff,1.5);rim.position.set(5,8,-9);this.scene.add(rim);
  this.buildPlant();this.packingScene=new PackingScene(this.scene,this.models);this.packingScene.group.position.x=1.25;this.plantControls=new PlantControls(this.scene,this.models);this.loadModels();this.resize();
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.14;this.controls.minDistance=3;this.controls.maxDistance=42;this.controls.minPolarAngle=.08;this.controls.maxPolarAngle=Math.PI*.47;this.controls.screenSpacePanning=true;this.controls.rotateSpeed=.65;this.controls.zoomSpeed=.75;
  this.controls.addEventListener('start',()=>{this.intro=0;this.cameraUserDriven=true;});this.controls.addEventListener('change',()=>{if(this.cameraUserDriven&&!this.packing&&!this.intro)this.onCameraChanged?.();});this.setView('first');
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
  this.equipmentInput=installEquipmentInput(canvas,(x,y)=>this.hitControl(x,y),(id,phase)=>{if(phase!=='end')this.plantControls.press(id);onControl(id,phase);},captured=>this.controls.enabled=!captured);
  const gesture=new TapGesture();
  canvas.addEventListener('pointerdown',e=>gesture.down(e));canvas.addEventListener('pointermove',e=>gesture.move(e));
  canvas.addEventListener('pointercancel',e=>gesture.cancel(e));canvas.addEventListener('lostpointercapture',e=>gesture.cancel(e));
  canvas.addEventListener('pointerup',e=>{const tap=gesture.up(e);if(!tap||this.packing)return;const candidates=this.pickCandidates(e.clientX,e.clientY);if(candidates.length)onPick(candidates[0],tap.button===2,e.clientX,e.clientY,candidates);},{capture:true});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  this.selection=new THREE.Mesh(new THREE.TorusGeometry(.54,.035,8,40),new THREE.MeshBasicMaterial({color:0xa645e4,depthTest:false}));this.selection.rotation.x=Math.PI/2;this.selection.renderOrder=10;this.selection.visible=false;this.scene.add(this.selection);
 }
 async loadModels(){const loader=new GLTFLoader();await Promise.allSettled(JUICES.map(async(j,i)=>{const asset=await loader.loadAsync(new URL('./assets/models/bottle-'+(i+1)+'.glb',import.meta.url).href);const model=asset.scene;const label=model.getObjectByName('BrandLabel');if(label){label.material=label.material.clone();label.material.map=this.labels[i];label.material.color.set(0xffffff);}model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});this.models[i].good=model;}));}
 label(j){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.fillStyle=j.label;x.fillRect(0,0,512,256);for(let i=0;i<2;i++){const p=128+i*256;x.textAlign='center';x.fillStyle='white';x.font='76px Arial';x.fillText('suja',p,115);x.font='bold 12px Arial';x.fillText('ORGANIC',p,138);x.fillStyle='#fff9d9';x.fillRect(p-122,153,244,36);x.fillStyle=j.label;x.font='bold 17px Arial';x.fillText(j.short,p,177);x.fillStyle='white';x.font='12px Arial';x.fillText('COLD-PRESSED JUICE',p,219);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 textSign(text,w,h,bg='#0a6038',fg='#ffffff',size=64){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;ctx.font=`700 ${size}px Arial`;ctx.fillText(text,512,128);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.8}));}
 belt(w,d,x,z){const g=new THREE.Group();g.position.set(x,0,z);g.add(box(w+.24,.27,d+.2,M.steel,0,1.22,0),box(w,.075,d,M.white,0,1.39,0,.02));const slats=[];const longX=w>d;for(let p=-(longX?w:d)/2;p<(longX?w:d)/2;p+=.18){const slat=box(longX?.022:w,.018,longX?d:.022,new THREE.MeshStandardMaterial({color:0xa5b9b0,roughness:.85}),longX?p:0,1.441,longX?0:p,0);g.add(slat);slats.push(slat);}
  for(const sx of [-1,1])for(const sz of [-1,1])g.add(box(.11,1.2,.11,M.steel,sx*(w/2-.25),.6,sz*(d/2-.17)));
  if(longX){for(const s of [-1,1]){g.add(box(w,.08,.09,M.steel,0,1.67,s*(d/2+.02)));for(let p=-w/2+.2;p<w/2;p+=1.2)g.add(box(.06,.36,.07,M.steel,p,1.54,s*(d/2+.02)));}}
  else{for(const s of [-1,1])g.add(box(.1,.42,d,M.steel,s*(w/2+.02),1.58,0));}
  this.scene.add(g);return {g,slats,longX,w,d,phase:0};
 }
 buildPlant(){
  const floorMat=new THREE.MeshStandardMaterial({color:0x829c8d,roughness:.87});this.scene.add(box(55,.2,55,floorMat,0,-.14,0,0));const grid=new THREE.GridHelper(50,25,0x759383,0x97aca0);grid.position.y=-.03;this.scene.add(grid);
  this.backWall=box(34,8,.25,new THREE.MeshStandardMaterial({color:0xe1eae3,roughness:1}),0,3.8,-11);this.leftWall=box(.3,8,26,M.white,-13,3.8,-2);this.scene.add(this.backWall,this.leftWall);
  for(let x=-12;x<17;x+=3)this.scene.add(box(.025,7.5,.03,M.steel,x,3.75,-10.84,0));
  const wordmark=this.textSign('suja',5,1.25,'#086139','#ffffff',178);wordmark.position.set(4.7,4.1,-10.8);this.scene.add(wordmark);const sign=this.textSign('BOTTLING HALL  /  01',4,.65,'#e1eae3','#246044',42);sign.position.set(4.7,3.06,-10.77);this.scene.add(sign);
  this.primary=this.belt(2.9,3.6,-4.2,-3.32);this.secondary=this.belt(PLANT.beltLength,PLANT.beltWidth,1,0);
  // Feed motor, fixed-speed machine and overhead pipework.
  this.scene.add(cyl(.29,.29,.55,M.green,-5.86,1.13,-2));
  const length=PLANT.machineLength,mx=PLANT.machineX;
  this.scene.add(box(length,.58,3.12,M.steel,mx,.3,0,.12),box(length+.08,.33,3.14,M.green,mx,2.4,0,.09));
  const glass=new THREE.MeshPhysicalMaterial({color:0x75cda4,transparent:true,opacity:.24,roughness:.16,metalness:.15});
  for(const z of [-1.5,1.5]){this.scene.add(box(length,.62,.13,M.steel,mx,.88,z),box(length-.3,.8,.05,glass,mx,1.62,z));for(const x of [mx-length/2+.07,mx+length/2-.07])this.scene.add(box(.15,1.5,.15,M.steel,x,1.53,z));}
  this.scene.add(box(length,.07,2.95,M.white,mx,1.39,0));
  const exit=this.textSign('SIX-PACK LINE 01',length-.2,.34);exit.position.set(mx,2.4,1.59);this.scene.add(exit);
  const tower=cyl(.065,.065,.7,M.dark,mx+.75,2.92,0);this.scene.add(tower);this.light=sphere(.15,new THREE.MeshStandardMaterial({color:0x39e884,emissive:0x10b151,emissiveIntensity:1.5}),mx+.75,3.38,0);this.scene.add(this.light);
  for(let x=-8;x<=10;x+=6){this.scene.add(box(.11,5.5,.11,M.steel,x,2.75,-9.5));const pipe=cyl(.065,.065,17,M.steel,0,5.43,-9.5);pipe.rotation.z=Math.PI/2;this.scene.add(pipe);const glow=box(3,.075,.5,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:2}),x,6.3,-4);this.scene.add(glow);}
  for(let i=0;i<3;i++){const stack=crate();stack.position.set(-9.1,0,-7+i*2.4);this.scene.add(stack);const upper=crate();upper.position.set(-9.1,1.85,-7+i*2.4);this.scene.add(upper);}
  // Hinged dumper with hydraulic arms; bin rotates about the conveyor-facing lip.
  this.dumper=new THREE.Group();this.dumper.position.set(-4.2,1.65,-5.3);this.bin=crate();this.bin.position.set(0,0,-1);this.dumper.add(this.bin);this.scene.add(this.dumper);for(const x of [-5.5,-2.9]){this.scene.add(box(.2,2.2,.22,M.steel,x,1.1,-5.8),box(.4,.12,2.4,M.dark,x,.09,-6));}
  this.jack=new THREE.Group();this.jack.add(box(1.7,.13,.22,M.purple,0,.2,0),box(.22,.13,2,M.purple,-.7,.2,-.9),box(.22,.13,2,M.purple,.7,.2,-.9),cyl(.07,.07,1.4,M.dark,0,.9,.28));this.jack.position.set(-4.2,0,-7);this.scene.add(this.jack);
  this.crew=[];for(let i=0;i<4;i++){const w=worker(i);w.position.set(-1.8+i*1.95,0,-2.23);this.scene.add(w);w.visible=false;this.crew.push(w);}
  // Reference-inspired protective mesh and background accumulation belt.
  const fenceMat=new THREE.MeshStandardMaterial({color:0x385046,metalness:.4,roughness:.7});for(let x=-.5;x<10;x+=2){this.scene.add(box(.09,3.25,.09,M.steel,x,1.62,-6.1));}for(let y=.5;y<3.4;y+=.23)this.scene.add(box(10.7,.014,.018,fenceMat,4.7,y,-6.1,0));for(let x=-.5;x<10;x+=.23)this.scene.add(box(.014,3,.018,fenceMat,x,1.78,-6.1,0));
  const rear=this.belt(10,1.1,4.5,-8);for(let i=0;i<20;i++){const b=this.models[0].good.clone();b.position.set(i*.46,1.44,-8);this.scene.add(b);}
  const panel=this.textSign('FEEDER',.95,.3);panel.position.set(-5.74,1.19,-1.46);this.scene.add(panel);
 }
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 setView(view,notify=true){
  this.cameraUserDriven=false;this.flushCamera();this.cameraUserDriven=notify;this.view=view;this.intro=0;const narrow=this.camera.aspect<.8;
  if(this.packing){this.camera.position.set(16.05,narrow?12:7.6,narrow?18:11.5);this.controls.target.set(11.85,1.4,3.2);}
  else if(view==='overhead'){this.camera.position.set(.8,narrow?40:20,1.5);this.controls.target.set(.8,0,-2);}
  else{this.camera.position.set(narrow?.7:1.5,narrow?29:4.7,narrow?29:10.8);this.controls.target.set(narrow?.8:.1,1.2,-1.8);}
  this.flushCamera();
 }
 flushCamera(){const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=damping;}
 cameraAction(action){
  this.intro=0;this.cameraUserDriven=true;if(action==='reset'){this.setView(this.view);return;}
  this.flushCamera();const offset=this.camera.position.clone().sub(this.controls.target),s=new THREE.Spherical().setFromVector3(offset);
  if(action==='in'||action==='out')s.radius=THREE.MathUtils.clamp(s.radius*(action==='in'?.82:1.22),3,42);
  if(action==='rotate-left'||action==='rotate-right')s.theta+=(action==='rotate-left'?-1:1)*Math.PI/10;
  if(action==='tilt-up'||action==='tilt-down')s.phi=THREE.MathUtils.clamp(s.phi+(action==='tilt-up'?-1:1)*.14,.08,Math.PI*.47);
  this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(s));
  const directions={up:[1,1],down:[1,-1],left:[0,-1],right:[0,1]};
  if(directions[action]){const [axis,sign]=directions[action],move=new THREE.Vector3().setFromMatrixColumn(this.camera.matrix,axis).multiplyScalar(sign*s.radius*.07);this.controls.target.add(move);this.camera.position.add(move);}
  this.controls.update();
 }
 focus(id){const m=this.meshes.get(id);if(!m)return;this.intro=0;this.cameraUserDriven=true;this.flushCamera();const direction=this.camera.position.clone().sub(this.controls.target).normalize();this.controls.target.copy(m.position);this.camera.position.copy(m.position).addScaledVector(direction,5);this.controls.update();}
 setSelection(id){this.selectedId=id;}
 setPacking(packing){
  this.equipmentInput?.cancel();this.cameraUserDriven=false;
  if(packing&&!this.packing){this.savedCamera={view:this.view,position:this.camera.position.clone(),target:this.controls.target.clone()};this.packing=packing;this.setView(this.view,false);}
  else if(!packing&&this.packing){this.packing=null;if(this.savedCamera){this.view=this.savedCamera.view;this.camera.position.copy(this.savedCamera.position);this.controls.target.copy(this.savedCamera.target);this.flushCamera();}}
  this.packing=packing;
 }
 project(id){const m=this.meshes.get(id);if(!m)return null;const p=m.position.clone().project(this.camera);if(p.z>1||p.z< -1)return null;const r=this.canvas.getBoundingClientRect();return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2};}
 pickCandidates(x,y){
  const bottles=this.simRef?.secondary||[],r=this.canvas.getBoundingClientRect(),points=bottles.map(b=>{const p=this.project(b.id);return p?{id:b.id,...p}:null;}).filter(Boolean);
  const candidates=nearbyBottles(points,x,y);this.pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);
  const hits=this.ray.intersectObjects(bottles.map(b=>this.meshes.get(b.id)).filter(Boolean),true),exact=hits[0]?.object.userData.bottleId;
  if(exact)return [exact,...candidates.filter(id=>id!==exact)];return candidates;
 }
 getCamera(){const saved=this.packing?this.savedCamera:null;return {version:1,kind:'3d',view:saved?.view||this.view,position:(saved?.position||this.camera.position).toArray(),target:(saved?.target||this.controls.target).toArray()};}
 restoreCamera(value){const p=validCamera(value);if(!p||p.kind!=='3d')return false;this.cameraUserDriven=false;this.intro=0;this.flushCamera();this.view=p.view;this.camera.position.fromArray(p.position);this.controls.target.fromArray(p.target);this.flushCamera();return true;}
 startIntro(){this.intro=0;}
 setInteraction(active,{reduced=false,inspect=false}={}){if(!active)this.equipmentInput?.cancel();this.interactionActive=active;this.reduced=reduced;if(this.plantControls)this.plantControls.inspecting=inspect;}
 hitControl(x,y){if(!this.interactionActive||this.packing)return null;const r=this.canvas.getBoundingClientRect();this.pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);return this.plantControls.hit(this.ray,this.camera,this.canvas,x,y,(this.simRef?.secondary||[]).map(b=>this.meshes.get(b.id)).filter(Boolean));}
 intake(event){for(const b of event.bottles){const source=this.meshes.get(b.id);if(!source)continue;const m=source.clone();this.scene.add(m);this.intakes.push({mesh:m,age:0});}}

 burst(x,z,color=0x93f160){for(let i=0;i<10;i++){const m=box(.065,.065,.065,new THREE.MeshBasicMaterial({color}),x,2,z);this.scene.add(m);this.particles.push({m,v:new THREE.Vector3((Math.random()-.5)*2,1+Math.random()*2,(Math.random()-.5)*2),life:.7});}}
 render(sim,dt){if(this.simRef!==sim){for(const m of this.meshes.values())this.scene.remove(m);this.meshes.clear();for(const item of this.intakes)this.scene.remove(item.mesh);this.intakes=[];this.simRef=sim;}this.clock+=dt;
  if(this.intro>0){this.intro=Math.max(0,this.intro-dt);this.camera.position.copy(this.introPosition);this.camera.position.x+=this.intro*1.5;this.camera.position.y+=this.intro;}
  this.controls.update();this.backWall.visible=this.camera.position.z> -10.6;this.leftWall.visible=this.camera.position.x> -12.6;
  const activeIds=new Set(sim.bottles.map(b=>b.id));for(const[id,m]of this.meshes){if(!activeIds.has(id)){this.scene.remove(m);this.meshes.delete(id);}}
  const loading=sim.binState==='loading'?Math.max(0,1-sim.loadTime/1.2):1;
  for(const b of sim.bottles){
   let m=this.meshes.get(b.id);if(!m){m=new THREE.Group();const model=this.models[(sim.level-1)%4][b.defect||'good'].clone();model.position.y=-.44;m.add(model);m.traverse(o=>{o.userData.bottleId=b.id;});this.meshes.set(b.id,m);this.scene.add(m);}
   if(b.belt==='bin'){const p=fromBin(binSlot(b.slot),sim.tilt,loading);m.position.set(p.x,p.y,p.z);m.rotation.set(Math.PI/2+sim.tilt*Math.PI/180,0,0);}
   else if(b.belt==='falling'){m.position.set(b.x,b.y,b.z);m.rotation.set(b.spin||0,b.rotation,0);}
   else {m.position.set(b.x,b.up?1.88:1.67+(b.belt==='primary'?(b.layer||0)*.48:0),b.z);m.rotation.x=0;m.rotation.z=b.up?0:Math.PI/2;m.rotation.y=b.up?0:-b.rotation;}
  }
  const pose=dumperPose(sim.tilt,loading);this.dumper.rotation.x=pose.angle;this.dumper.position.set(pose.x,pose.y,pose.z);this.bin.visible=sim.binState!=='empty'||sim.tilt>5;this.jack.position.z=sim.binState==='loading'?-9+loading*2:-7;
  const selected=this.meshes.get(this.selectedId);this.selection.visible=!!selected&&!this.packing;if(selected){this.selection.position.set(selected.position.x,1.48,selected.position.z);}
  this.packingScene.update(this.packing);this.plantControls.group.visible=!this.packing;this.plantControls.rejectGroup.visible=!this.packing;this.plantControls.gateLabel.visible=!this.packing;this.plantControls.gatePads.forEach(p=>p.visible=!this.packing);this.plantControls.update(sim,dt,this.clock,this.interactionActive,this.reduced);
  for(const item of this.intakes){if(!sim.paused){item.age+=dt;item.mesh.position.x+=dt*3.8;}if(item.age>.85)this.scene.remove(item.mesh);}this.intakes=this.intakes.filter(item=>item.age<=.85);
  for(const belt of [this.primary,this.secondary]){const speed=sim.paused||sim.ended||sim.batchReady?0:belt===this.primary?sim.feeder*2.6:sim.stopped?0:sim.secondarySpeed;belt.phase=(belt.phase+speed*dt)%.18;for(let i=0;i<belt.slats.length;i++){const p=-(belt.longX?belt.w:belt.d)/2+i*.18+belt.phase;if(belt.longX)belt.slats[i].position.x=p;else belt.slats[i].position.z=p;}}
  for(let i=0;i<4;i++){const w=this.crew[i];w.visible=i<sim.helpers.length;w.userData.arms.forEach((a,j)=>a.rotation.x=-.55+Math.sin(this.clock*5+i+j)*.5);}
  this.light.material.color.set(sim.stopped?'#a370ed':sim.fullFlow?'#eff98b':'#39e884');this.light.material.emissive.copy(this.light.material.color);
  for(const p of this.particles){p.life-=dt;p.v.y-=dt*5;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*4;if(p.life<=0){this.scene.remove(p.m);p.m.material.dispose();}}this.particles=this.particles.filter(p=>p.life>0);
  this.renderer.render(this.scene,this.camera);
 }
}

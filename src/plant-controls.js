import * as THREE from 'three';
import {box,cyl,crate,materials as M} from './models.js';
import {controlState,CONTROL_POSITIONS,PLANT} from './control-state.js';
import {makeBonusCube,animateBonusCube} from './bonus-cube.js';
import {INTAKE_SLOTS,intakeReady} from './bottle-physics.js';
import {CONTROL_VISUALS,drawControlIcon} from './control-visuals.js';
import {makeControlHead} from './control-head.js';

function placard(text,width=1.35,control=null){
 const c=document.createElement('canvas');c.width=384;c.height=128;const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sprite.scale.set(width,width/3,1);
 sprite.userData.setText=(value,lit=false)=>{
  const key=value+lit;if(sprite.userData.last===key)return;sprite.userData.last=key;
  const x=c.getContext('2d'),style=CONTROL_VISUALS[control];x.clearRect(0,0,384,128);x.fillStyle=lit?'#fffde3':style?.light||'#f7fff2';x.beginPath();x.roundRect(4,4,376,120,24);x.fill();x.strokeStyle=style?.color||'#658b71';x.lineWidth=lit?9:5;x.stroke();x.fillStyle=style?.color||'#154a30';x.textAlign='center';x.textBaseline='middle';x.font='800 34px Arial';
  if(control){drawControlIcon(x,control,19,27,74,style.color);x.fillText(value,235,67,270);}else x.fillText(value,192,67);
  texture.needsUpdate=true;
 };sprite.userData.setText(text);return sprite;
}
export class PlantControls {
 constructor(scene,models){
  this.scene=scene;this.models=models;this.group=new THREE.Group();scene.add(this.group);this.items=new Map();this.states={};
  for(const [id,position] of Object.entries(CONTROL_POSITIONS)){
   const root=new THREE.Group();root.position.fromArray(position);this.group.add(root);let press,glow;
   if(id==='load'){
    const bin=crate();bin.scale.setScalar(.8);bin.position.set(0,-.8,0);root.add(bin);
    for(let i=0;i<6;i++){const b=models[0].good.clone();b.scale.setScalar(.75);b.rotation.z=Math.PI/2;b.position.set((i%3-1)*.4,.4,(Math.floor(i/3)-.5)*.5);root.add(b);}
    glow=new THREE.Mesh(new THREE.BoxGeometry(1.96,.08,1.82),new THREE.MeshStandardMaterial({color:0x9cdbff,emissive:0x42baff,emissiveIntensity:0}));glow.position.y=-.73;root.add(glow);
   }else if(id==='bonus'){this.bonus=makeBonusCube();this.bonus.scale.setScalar(.68);root.add(this.bonus);}
   else{
    root.add(box(.8,.13,.75,M.steel,0,-.18,0),box(.13,1.25,.13,M.steel,0,-.82,0),box(.7,.12,.65,M.dark,0,-1.46,0));
    const head=makeControlHead(id);press=head.press;glow=head.glow;root.add(head.group);
   }
   const label=placard(id.toUpperCase(),id==='load'?1.9:1.65,id);label.position.y=id==='load'?1.03:id==='bonus'?.66:.59;root.add(label);
   root.traverse(o=>o.userData.control=id);this.items.set(id,{root,press,glow,label,pressed:0});
  }
  this.speedLabel=placard('FEEDER 50%',1.55);this.speedLabel.position.set(-4.95,2.65,2.35);this.group.add(this.speedLabel);
  this.dial=cyl(.23,.23,.16,M.dark,-4.95,1.7,2.35,24);this.dial.add(box(.06,.025,.21,M.white,0,.095,-.02));this.group.add(this.dial);
  this.gatePads=INTAKE_SLOTS.map(z=>{const pad=cyl(.24,.24,.025,new THREE.MeshStandardMaterial({color:0xc5dccb,emissive:0x2fbc76,emissiveIntensity:0}),PLANT.gateX,1.452,z,24);scene.add(pad);return pad;});
  this.gateLabel=placard('SIX-PACK 0 / 6',2);this.gateLabel.position.set(6.4,2.65,1.95);scene.add(this.gateLabel);
  this.makeRejectBin();
 }
 makeRejectBin(){
  this.rejectGroup=new THREE.Group();this.rejectGroup.position.set(5.3,0,3.5);this.scene.add(this.rejectGroup);
  const purple=new THREE.MeshStandardMaterial({color:0x8861b1,roughness:.65});this.rejectGroup.add(box(1.9,.12,1.6,M.dark,0,.08,0));
  for(const x of [-.92,.92])this.rejectGroup.add(box(.12,1.05,1.6,purple,x,.61,0));for(const z of [-.76,.76])this.rejectGroup.add(box(1.9,1.05,.1,purple,0,.61,z));
  this.rejectContents=new THREE.Group();this.rejectGroup.add(this.rejectContents);this.rejectLabel=placard('REJECT BIN · 0',2.1);this.rejectLabel.position.set(0,1.7,0);this.rejectGroup.add(this.rejectLabel);
 }
 press(id){const item=this.items.get(id);if(item)item.pressed=.16;}
 update(sim,dt,clock,active,reduced){
  this.states=controlState(sim,active);const pulse=reduced?1:.55+.45*Math.sin(clock*5);
  for(const [id,item] of this.items){const state=this.states[id];item.root.visible=id!=='bonus'||!!sim.pendingReward;item.label.userData.setText(id==='inspect'&&this.inspecting?'INSPECT ON':state.label,state.glow);if(item.glow)item.glow.material.emissiveIntensity=state.glow?.4+pulse*1.2:state.enabled?.1:0;if(item.press){item.pressed=Math.max(0,item.pressed-dt);item.press.position.y=item.pressed>0?-.025:.04;item.press.material.opacity=state.enabled?1:.65;item.press.material.transparent=!state.enabled;}}
  animateBonusCube(this.bonus,clock,!!sim.pendingReward,reduced);this.speedLabel.userData.setText(`FEEDER ${Math.round(sim.feeder*100)}%`);this.dial.rotation.y=(sim.feeder-.5)*Math.PI*1.5;
  const ready=intakeReady(sim.secondary),slots=new Set(ready.map(b=>b.gateSlot));this.gatePads.forEach((pad,i)=>pad.material.emissiveIntensity=slots.has(i)?.9:0);this.gateLabel.userData.setText(`SIX-PACK ${ready.length} / 6`,ready.length>=4);
  if(this.rejectCount!==sim.rejectBinCount){this.rejectCount=sim.rejectBinCount;this.rejectLabel.userData.setText(`REJECT BIN · ${sim.rejectBinCount}`);this.rejectContents.clear();sim.rejectBinItems.forEach((b,i)=>{const m=this.models[b.juiceIndex][b.defect||'good'].clone();m.scale.setScalar(.65);m.rotation.z=Math.PI/2;m.rotation.y=(i%3-.8)*.4;m.position.set((i%3-1)*.43+.2,.34+Math.floor(i/6)*.3,(Math.floor(i/3)%2-.5)*.58);this.rejectContents.add(m);});}
 }
 hit(ray,camera,canvas,x,y,bottleMeshes){
  const roots=[...this.items.values()].filter(i=>i.root.visible).map(i=>i.root);
  const direct=ray.intersectObjects([...roots,...bottleMeshes],true)[0];if(direct){const id=direct.object.userData.control;if(id&&this.states[id]?.enabled)return id;if(direct.object.userData.bottleId)return null;}
  const r=canvas.getBoundingClientRect();let nearest=null,distance=25;
  for(const [id,item] of this.items){if(!this.states[id]?.enabled||!item.root.visible)continue;const p=item.root.position.clone().project(camera);if(p.z< -1||p.z>1)continue;const d=Math.hypot(r.x+(p.x+1)*r.width/2-x,r.y+(1-p.y)*r.height/2-y);if(d<distance){distance=d;nearest=id;}}
  return nearest;
 }
}

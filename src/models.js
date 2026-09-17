import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export const materials={steel:new THREE.MeshStandardMaterial({color:0xb8c9ca,metalness:.72,roughness:.31}),white:new THREE.MeshStandardMaterial({color:0xf7faf5,roughness:.65}),dark:new THREE.MeshStandardMaterial({color:0x23332e,roughness:.72}),green:new THREE.MeshStandardMaterial({color:0x0a683c,roughness:.53}),blue:new THREE.MeshStandardMaterial({color:0x269dd3,roughness:.56}),purple:new THREE.MeshStandardMaterial({color:0x914bd4,roughness:.36})};
const boxCache=new Map();
export function box(w,h,d,material,x=0,y=0,z=0,r=.04){const key=[w,h,d,r].join(',');if(!boxCache.has(key))boxCache.set(key,new RoundedBoxGeometry(w,h,d,1,r));const m=new THREE.Mesh(boxCache.get(key),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
export function cyl(rt,rb,h,material,x=0,y=0,z=0,n=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
export function sphere(r,material,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),material);m.position.set(x,y,z);m.castShadow=true;return m;}
const bodyGeo=new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.19,0),new THREE.Vector2(.215,.045),new THREE.Vector2(.22,.56),new THREE.Vector2(.2,.65),new THREE.Vector2(.135,.75),new THREE.Vector2(.135,.84),new THREE.Vector2(0,.84)],20);
const capGeo=new THREE.CylinderGeometry(.153,.153,.115,20);const labelGeo=new THREE.CylinderGeometry(.223,.223,.39,20,1,true);
export function bottle({color='#628728',label='#08763d',texture=null,defect=null}={}){
 const g=new THREE.Group();g.name='SujaBottle';const juice=new THREE.MeshStandardMaterial({color,roughness:.26,metalness:.05});
 const body=new THREE.Mesh(bodyGeo,juice);body.name="JuiceBody";body.castShadow=true;body.receiveShadow=true;g.add(body);
 if(defect==='fill'){body.material=materials.white;const low=new THREE.Mesh(bodyGeo,juice);low.scale.y=.47;low.scale.x=1.004;low.scale.z=1.004;g.add(low);}
 const cap=new THREE.Mesh(capGeo,materials.white);cap.position.y=.87;if(defect==='cap'){cap.position.y=.97;cap.rotation.z=.32;}cap.name="BottleCap";cap.castShadow=true;g.add(cap);
 if(defect!=='label'){const l=new THREE.Mesh(labelGeo,new THREE.MeshStandardMaterial({map:texture,color:texture?0xffffff:label,roughness:.6}));l.name="BrandLabel";l.position.y=.35;l.rotation.y=Math.PI/2;g.add(l);}
 return g;
}
export function worker(index=0){
 const g=new THREE.Group();g.name='CrewMember';const skins=[0x9b6344,0xebbc91,0x69412f,0xc99a6c],skin=new THREE.MeshStandardMaterial({color:skins[index%4],roughness:.9});const pants=new THREE.MeshStandardMaterial({color:index%2?0x334752:0x61594b,roughness:1});
 g.add(box(.65,.98,.4,materials.white,0,1.1,0,.13),box(.34,.32,.36,materials.white,0,1.68,0,.06));
 for(const x of [-.19,.19]){g.add(box(.25,.68,.29,pants,x,.47,0,.05),box(.3,.19,.45,materials.dark,x,.1,.07,.07));}
 g.add(sphere(.29,skin,0,1.97,0));const netmat=new THREE.MeshStandardMaterial({color:0xf4faff,transparent:true,opacity:.6,roughness:1});const net=sphere(.315,netmat,0,2.07,-.015);net.scale.set(1,.67,1);g.add(net);const wires=sphere(.32,new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.25}),0,2.08,0);wires.scale.y=.67;g.add(wires);
 const eyeMat=new THREE.MeshStandardMaterial({color:0x222524});for(const x of [-.1,.1])g.add(sphere(.027,eyeMat,x,1.99,.263));g.add(sphere(.054,skin,0,1.91,.282));
 if(index%2===0){const beard=sphere(.23,netmat,0,1.8,.09);beard.scale.set(1,.5,1);g.add(beard);}
 const band=new THREE.Mesh(new THREE.TorusGeometry(.35,.035,8,24,Math.PI),materials.dark);band.position.y=2.04;g.add(band);for(const x of [-.32,.32])g.add(box(.12,.22,.24,materials.purple,x,1.99,0,.045));
 const arms=[];for(const s of [-1,1]){const arm=new THREE.Group();arm.name=s===-1?"ArmLeft":"ArmRight";arm.position.set(s*.4,1.53,0);arm.add(box(.23,.59,.25,materials.white,0,-.2,0,.08),sphere(.13,materials.blue,0,-.53,.02));arm.rotation.z=s*.18;g.add(arm);arms.push(arm);}g.userData.arms=arms;
 for(let y=.75;y<1.6;y+=.2)g.add(sphere(.022,materials.steel,.02,y,.205));return g;
}
export function crate(){const g=new THREE.Group();g.name='ReusableJuiceBin';const plastic=new THREE.MeshStandardMaterial({color:0xc3ccb0,roughness:.82});g.add(box(2.25,.14,2.0,materials.green,0,.07,0));for(const x of [-1.05,1.05])g.add(box(.13,1.55,2,plastic,x,.85,0));for(const z of [-.92,.92]){g.add(box(2.2,1.55,.14,plastic,0,.85,z));for(let x=-.85;x<1;x+=.29)g.add(box(.09,.62,.025,materials.dark,x,1,z+Math.sign(z)*.073,.03));}for(const x of [-1.08,1.08])g.add(box(.16,.12,2.1,plastic,x,1.68,0,.03));for(const z of [-.98,.98])g.add(box(2.3,.12,.16,plastic,0,1.68,z,.03));return g;}

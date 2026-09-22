import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {CONTROL_VISUALS,drawControlIcon} from './control-visuals.js';
function extrude(points){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSize:.025,bevelThickness:.015,bevelSegments:1,steps:1}).rotateX(-Math.PI/2).translate(0,-.08,0);}
export function makeControlHead(id,{withSymbol=true}={}){
 const style=CONTROL_VISUALS[id],group=new THREE.Group();let geometry;
 if(id==='raise'||id==='lower'){geometry=extrude([[-.43,-.3],[.43,-.3],[0,.46]]);if(id==='lower')geometry.rotateY(Math.PI);}
 else if(id==='slower')geometry=new RoundedBoxGeometry(.88,.16,.4,1,.07);
 else if(id==='faster')geometry=extrude([[-.14,-.43],[.14,-.43],[.14,-.14],[.43,-.14],[.43,.14],[.14,.14],[.14,.43],[-.14,.43],[-.14,.14],[-.43,.14],[-.43,-.14],[-.14,-.14]]);
 else geometry=new THREE.CylinderGeometry(id==='stop'?.46:.39,id==='stop'?.49:.39,id==='stop'?.2:.16,id==='stop'?8:32);
 const press=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:style.color,metalness:.18,roughness:.29}));press.castShadow=true;press.position.y=.04;group.add(press);
 const glow=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:style.color,emissive:style.color,emissiveIntensity:0,roughness:.45}));glow.scale.set(1.15,.55,1.15);glow.position.y=-.055;group.add(glow);
 if(withSymbol){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;drawControlIcon(canvas.getContext('2d'),id,8,8,112);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));face.rotation.x=-Math.PI/2;face.position.y=id==='stop'?.112:.095;press.add(face);
 }
 group.userData.shape=style.shape;return {group,press,glow};
}

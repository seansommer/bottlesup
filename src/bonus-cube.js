import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

let question;
function questionTexture(){
 if(question)return question;const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.clearRect(0,0,128,128);c.textAlign='center';c.textBaseline='middle';c.font='900 102px Arial';c.shadowColor='#ffffff';c.shadowBlur=10;c.fillStyle='#fff';c.fillText('?',64,68);question=new THREE.CanvasTexture(canvas);question.colorSpace=THREE.SRGBColorSpace;return question;
}
export function makeBonusCube({withText=true}={}){
 const g=new THREE.Group(),glass=new THREE.MeshPhysicalMaterial({color:0xaa77ee,metalness:.14,roughness:.08,transparent:true,opacity:.72,transmission:.22,thickness:.6,clearcoat:1,iridescence:1,iridescenceIOR:1.6});
 const shell=new THREE.Mesh(new RoundedBoxGeometry(1,1,1,3,.13),glass);g.add(shell);
 const inner=new THREE.Mesh(new THREE.OctahedronGeometry(.39),new THREE.MeshStandardMaterial({color:0x8dffbd,emissive:0x3fcb99,emissiveIntensity:.6,metalness:.25,roughness:.2}));g.add(inner);
 const lines=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.96,.96,.96)),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.75}));g.add(lines);
 if(withText){const material=new THREE.MeshBasicMaterial({map:questionTexture(),transparent:true,depthWrite:false});for(const [x,y,z,rx,ry] of [[0,0,.512,0,0],[0,0,-.512,0,Math.PI],[.512,0,0,0,Math.PI/2],[-.512,0,0,0,-Math.PI/2],[0,.512,0,-Math.PI/2,0],[0,-.512,0,Math.PI/2,0]]){const face=new THREE.Mesh(new THREE.PlaneGeometry(.65,.65),material);face.position.set(x,y,z);face.rotation.set(rx,ry,0);g.add(face);}}
 const glint=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));glint.position.set(.46,.46,.46);g.add(glint);g.userData={glass,inner,glint};return g;
}
export function animateBonusCube(cube,time,ready,reduced=false){
 if(reduced)time=0;
 cube.rotation.set(.3,reduced?.55:time*(ready?.8:.25),.12);cube.userData.glass.color.setHSL((time*.085)%1,.8,.66);cube.userData.inner.rotation.y=-time*.65;
 cube.userData.glass.opacity=ready?.8:.42;cube.userData.inner.material.emissiveIntensity=ready?.7+(reduced?0:.3*Math.sin(time*4)): .1;
 cube.userData.glint.scale.setScalar(ready?1+(reduced?0:.35*Math.sin(time*4)): .5);
}
export class BonusBadge {
 constructor(canvas,use3d=true){
  this.canvas=canvas;if(!use3d)return;
  try{this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(88,88,false);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(35,1,.1,10);this.camera.position.set(0,.35,3.4);this.camera.lookAt(0,0,0);this.cube=makeBonusCube();this.scene.add(this.cube,new THREE.HemisphereLight(0xffffff,0x725ecf,3));for(const [color,x,y,z] of [[0xffffff,2,3,4],[0x82ffb7,-2,1,1],[0xeaa4ff,1,-2,-1]]){const l=new THREE.DirectionalLight(color,3);l.position.set(x,y,z);this.scene.add(l);}canvas.parentElement.classList.add('has-3d');}catch{this.renderer=null;}
 }
 render(time,ready,reduced,visible){if(!this.renderer||!visible)return;animateBonusCube(this.cube,time,ready,reduced);this.renderer.render(this.scene,this.camera);}
}

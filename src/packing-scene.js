import * as THREE from 'three';
import {box, materials as M} from './models.js';

const blue = new THREE.MeshStandardMaterial({color:0x1766c2, roughness:.7});
const cardboard=new THREE.MeshStandardMaterial({color:0xbf965e,roughness:1});
const film = new THREE.MeshPhysicalMaterial({color:0xffffff, transparent:true, opacity:.17, roughness:.12, metalness:.08, depthWrite:false});
const wrapEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.46,.98,1.02));
const seams = new THREE.LineBasicMaterial({color:0xf4fff8, transparent:true, opacity:.55});
export function palletSlot(index) {
  return new THREE.Vector3(11.1 + (index % 3 - 1) * 1.54, .39 + Math.floor(index / 6) * 1.06, 2 + (Math.floor(index / 3) % 2 - .5) * 2.2);
}
export class PackingScene {
  constructor(scene, models) {
    this.models = models; this.group = new THREE.Group(); this.group.visible = false; scene.add(this.group);
    this.group.add(box(2.15,.16,2,M.steel,8.8,1.34,5), box(2.18,.06,2.04,M.green,8.8,1.45,5));
    for(const x of [8,9.6]) for(const z of [4.45,5.55]) this.group.add(box(.1,1.3,.1,M.steel,x,.67,z));
    for(const x of [9.15,11.1,13.05]) this.group.add(box(.25,.25,4.9,blue,x,.14,2));
    for(let i=0;i<7;i++) this.group.add(box(4.9,.12,.52,blue,11.1,.33,-.16+i*.72));
    this.layerSheets=new THREE.Group();this.group.add(this.layerSheets);
    this.products = new THREE.Group(); this.group.add(this.products);
    this.workOrigin = new THREE.Vector3(8.8,1.49,5);
  }
  sixPack(juice) {
    const g = new THREE.Group();
    for(let i=0;i<6;i++) {const b=this.models[juice].good.clone(); b.position.set((i%3-1)*.48,0,(Math.floor(i/3)-.5)*.5); g.add(b);}
    const wrap = new THREE.Group();
    wrap.add(box(1.46,.98,1.02,film,0,.48,0,.08));
    const edges = new THREE.LineSegments(wrapEdges, seams); edges.position.y=.48; wrap.add(edges);
    g.add(wrap); g.userData.wrap=wrap;
    return g;
  }
  update(packing) {
    this.group.visible = !!packing;
    if(!packing) return;
    if(this.current!==packing) {
      this.current=packing; this.products.clear(); this.packs=[];this.layerSheets.clear();this.sheets=[];this.slidingSheet=box(4.8,.04,4.8,cardboard,0,0,0,0);this.layerSheets.add(this.slidingSheet);
      this.work=this.sixPack(packing.juiceIndex); this.products.add(this.work);
      for(let i=0;i<packing.loose;i++){const b=this.models[packing.juiceIndex].good.clone();b.position.set(8.1+i*.37,1.49,5.64);this.products.add(b);}
    }
    while(this.packs.length<packing.stacked) {const pack=this.sixPack(packing.juiceIndex);pack.position.copy(palletSlot(this.packs.length));this.products.add(pack);this.packs.push(pack);}
    while(this.sheets.length<packing.sheets){const layer=this.sheets.length+1,sheet=box(4.8,.04,4.8,cardboard,11.1,.37+layer*1.06,2,0);this.layerSheets.add(sheet);this.sheets.push(sheet);}
    this.slidingSheet.visible=packing.phase==='sheet';
    if(this.slidingSheet.visible){const t=packing.progress,e=t*t*(3-2*t);this.slidingSheet.position.set(11.1+6*(1-e),.37+Math.floor(packing.stacked/6)*1.06+Math.sin(t*Math.PI)*.35,2);}
    this.work.visible=!['done','sheet'].includes(packing.phase); this.work.position.copy(this.workOrigin); this.work.rotation.y=0;
    const wrap=this.work.userData.wrap;
    wrap.visible=packing.phase!=='ready';
    const shrink=packing.phase==='wrapping'?1+.48*(1-packing.progress):1;wrap.scale.set(shrink,shrink,shrink);
    if(packing.phase==='placing') {const t=packing.progress, eased=t*t*(3-2*t);this.work.position.lerp(palletSlot(packing.stacked),eased);this.work.position.y+=Math.sin(t*Math.PI)*1.5;}
  }
}

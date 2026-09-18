import {PLANT} from './control-state.js';

export const BODY_RADIUS=.235;
export const PRIMARY_BOUNDS={minX:-5.65,maxX:-2.75,minZ:-5.12,maxZ:-1.52};
export const SECONDARY_BOUNDS={minX:-4.625,maxX:PLANT.gateX+BODY_RADIUS,minZ:-PLANT.beltWidth/2,maxZ:PLANT.beltWidth/2};
export const INTAKE_SLOTS=Object.freeze([ -1.2,-.72,-.24,.24,.72,1.2 ]);
export function footprint(b){
 const half=b.up?0:b.defect==='cap'?.42:.33,a=b.rotation||0,dx=Math.cos(a)*half,dz=Math.sin(a)*half;
 return {ax:b.x-dx,az:b.z-dz,bx:b.x+dx,bz:b.z+dz,r:BODY_RADIUS,extentX:Math.abs(dx)+BODY_RADIUS,extentZ:Math.abs(dz)+BODY_RADIUS};
}
function pointSegment(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l)):0;return (x-ax-t*dx)**2+(z-az-t*dz)**2;}
function distanceSquared(a,b){
 const ux=a.bx-a.ax,uz=a.bz-a.az,vx=b.bx-b.ax,vz=b.bz-b.az,den=ux*vz-uz*vx;
 if(Math.abs(den)>1e-9){const dx=b.ax-a.ax,dz=b.az-a.az,s=(dx*vz-dz*vx)/den,t=(dx*uz-dz*ux)/den;if(s>=0&&s<=1&&t>=0&&t<=1)return 0;}
 return Math.min(pointSegment(a.ax,a.az,b.ax,b.az,b.bx,b.bz),pointSegment(a.bx,a.bz,b.ax,b.az,b.bx,b.bz),pointSegment(b.ax,b.az,a.ax,a.az,a.bx,a.bz),pointSegment(b.bx,b.bz,a.ax,a.az,a.bx,a.bz));
}
export function overlaps(a,b){return distanceSquared(footprint(a),footprint(b))<(BODY_RADIUS*2+.003)**2-1e-8;}
export function fits(b,others,bounds){
 const f=footprint(b);
 return b.x-f.extentX>=bounds.minX-1e-6&&b.x+f.extentX<=bounds.maxX+1e-6&&b.z-f.extentZ>=bounds.minZ-1e-6&&b.z+f.extentZ<=bounds.maxZ+1e-6&&!others.some(o=>o.id!==b.id&&overlaps(b,o));
}
export function bounded(b,bounds){const f=footprint(b);return {...b,x:Math.max(bounds.minX+f.extentX,Math.min(bounds.maxX-f.extentX,b.x)),z:Math.max(bounds.minZ+f.extentZ,Math.min(bounds.maxZ-f.extentZ,b.z))};}
export function moveBody(b,dx,dz,others,bounds){
 // Swept, bounded movement: a blocked bottle stops at contact instead of
 // briefly overlapping and being pushed apart on the following frame.
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
 for(let step=0;step<steps;step++){
  const start={x:b.x,z:b.z},target=bounded({...b,x:b.x+dx/steps,z:b.z+dz/steps},bounds);
  if(fits(target,others,bounds)){b.x=target.x;b.z=target.z;continue;}
  let lo=0,hi=1;for(let i=0;i<9;i++){const t=(lo+hi)/2,c={...b,x:start.x+(target.x-start.x)*t,z:start.z+(target.z-start.z)*t};if(fits(c,others,bounds))lo=t;else hi=t;}
  b.x=start.x+(target.x-start.x)*lo;b.z=start.z+(target.z-start.z)*lo;
  // Sliding along a contact lets bottles settle into the collection row.
  for(const axis of ['z','x']){const c={...b,[axis]:target[axis]};if(fits(c,others,bounds))b[axis]=c[axis];}
 }
}
export function settlePrimary(b,bottles){
 const all=bottles.filter(o=>o.id!==b.id&&o.belt==='primary');
 for(let layer=0;layer<4;layer++){
  const others=all.filter(o=>(o.layer||0)===layer);
  for(let i=0;i<110;i++){
   const r=.19*Math.sqrt(i),a=i*2.399963229728653,c=bounded({...b,x:b.x+Math.cos(a)*r,z:b.z+Math.sin(a)*r},PRIMARY_BOUNDS);
   if(fits(c,others,PRIMARY_BOUNDS)){Object.assign(b,{x:c.x,z:c.z,layer,y:1.67+layer*.48});return true;}
  }
 }
 return false;
}
export function transferPosition(b,secondary){
 const entryZ=Math.max(-1.15,Math.min(1.15,(b.x+4.2)*.9+(b.entryOffset||0)));
 for(let i=0;i<18;i++){
  const z=entryZ+(i===0?0:Math.ceil(i/2)*.145*(i%2?1:-1));
  const c=bounded({...b,x:SECONDARY_BOUNDS.minX+footprint(b).extentX+.015,z},SECONDARY_BOUNDS);
  if(fits(c,secondary,SECONDARY_BOUNDS))return {x:c.x,z:c.z};
 }
 return null;
}
export function intakeReady(bottles){return bottles.filter(b=>b.up&&!b.defect&&Number.isInteger(b.gateSlot)&&b.x>=PLANT.gateX-.025&&Math.abs(b.z-INTAKE_SLOTS[b.gateSlot])<.025);}
export function moveSecondary(bottles,speed,dt){
 const row=[...bottles].sort((a,b)=>b.x-a.x||a.id-b.id),taken=new Set();
 for(const b of row){if(!b.up||b.defect||taken.has(b.gateSlot))delete b.gateSlot;else if(Number.isInteger(b.gateSlot))taken.add(b.gateSlot);}
 const queued=new Set(intakeReady(row).map(b=>b.id));
 let guide=row.find(b=>Number.isInteger(b.gateSlot)&&!queued.has(b.id));
 if(!guide){
  guide=row.find(b=>b.up&&!b.defect&&!Number.isInteger(b.gateSlot)&&b.x>=4.1);
  if(guide){const free=INTAKE_SLOTS.map((z,index)=>({z,index})).filter(s=>!taken.has(s.index)).sort((a,b)=>Math.abs(a.z-guide.z)-Math.abs(b.z-guide.z));if(free.length)guide.gateSlot=free[0].index;else guide=null;}
 }
 for(const b of row){
  if(!speed)continue;
  if(b===guide){
   const target=INTAKE_SLOTS[b.gateSlot],alignX=5.65;
   // The intake guide leaves a clear turning strip behind the collection row.
   // Its rollers pull one bottle through, while the belt queues the next ones.
   if(b.x<alignX-.001)moveBody(b,Math.min(1.2*dt,alignX-b.x),0,bottles,SECONDARY_BOUNDS);
   else if(Math.abs(target-b.z)>1e-6)moveBody(b,0,Math.max(-1.1*dt,Math.min(1.1*dt,target-b.z)),bottles,SECONDARY_BOUNDS);
   else moveBody(b,1.2*dt,0,bottles,SECONDARY_BOUNDS);
  }else if(queued.has(b.id))continue;
  else{
   const waiting=b.up&&!b.defect,limit=waiting?Math.max(5.04,b.x):SECONDARY_BOUNDS.maxX;
   const bounds=waiting?{...SECONDARY_BOUNDS,maxX:limit+BODY_RADIUS}:SECONDARY_BOUNDS;
   moveBody(b,speed*dt,0,bottles,bounds);
  }
 }
}

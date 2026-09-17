import {TapGesture,nearbyBottles} from './picking.js';
import {binSlot,fromBin} from './dumper.js';
import {JUICES} from './simulation.js';
// The same simulation stays playable on browsers without WebGL.
export class CompatibilityScene {
 constructor(canvas,onPick) {
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.view='overhead';this.hitboxes=[];this.zoom=1;this.pan={x:0,y:0};this.angle=0;this.contacts=new Map();
  this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);
  const gesture=new TapGesture();
  canvas.addEventListener('pointerdown',e=>{gesture.down(e);this.contacts.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
   gesture.move(e);const old=this.contacts.get(e.pointerId);if(!old)return;
   if(this.contacts.size===1){this.pan.x+=e.clientX-old.x;this.pan.y+=e.clientY-old.y;}
   else {const other=[...this.contacts.entries()].find(([id])=>id!==e.pointerId)?.[1];if(other){const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(before>5)this.zoom=Math.max(.65,Math.min(4.5,this.zoom*after/before));this.pan.x+=(e.clientX-old.x)/2;this.pan.y+=(e.clientY-old.y)/2;}}
   this.contacts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  });
  canvas.addEventListener('pointerup',e=>{const tap=gesture.up(e);this.contacts.delete(e.pointerId);if(!tap||this.packing)return;const ids=nearbyBottles(this.hitboxes,e.clientX,e.clientY);if(ids.length)onPick(ids[0],tap.button===2,e.clientX,e.clientY,ids);});
  for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{gesture.cancel(e);this.contacts.delete(e.pointerId);});
  canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.65,Math.min(4.5,this.zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
 }
 resize(){this.w=this.canvas.clientWidth;this.h=this.canvas.clientHeight;const d=Math.min(devicePixelRatio,2);this.canvas.width=this.w*d;this.canvas.height=this.h*d;this.ctx.setTransform(d,0,0,d,0,0);}
 setView(){this.cameraAction('reset');}startIntro(){this.cameraAction('reset');}burst(){}
 setSelection(id){this.selectedId=id;}
 setPacking(p){if(!!p!==!!this.packing)this.cameraAction('reset');this.packing=p;}
 cameraAction(action){if(action==='reset'){this.zoom=1;this.pan={x:0,y:0};this.angle=0;}if(action==='in'||action==='out')this.zoom=Math.max(.65,Math.min(4.5,this.zoom*(action==='in'?1.22:.82)));if(action==='rotate-left'||action==='rotate-right')this.angle+=(action==='rotate-left'?-1:1)*Math.PI/10;const d={up:[0,45],down:[0,-45],left:[45,0],right:[-45,0]};if(d[action]){this.pan.x+=d[action][0];this.pan.y+=d[action][1];}}
 focus(id){const b=this.sim?.bottles.find(b=>b.id===id);if(!b)return;this.zoom=2.2;this.pan.x=-b.x*this.baseScale*this.zoom;this.pan.y=-b.z*this.baseScale*this.zoom;}
 project(id){const b=this.hitboxes.find(b=>b.id===id);return b?{x:b.x,y:b.y}:null;}
 render(sim){
  this.sim=sim;const c=this.ctx,w=this.w,h=this.h;c.clearRect(0,0,w,h);c.fillStyle='#cbdccd';c.fillRect(0,0,w,h);
  c.strokeStyle='#bed0bf';c.lineWidth=1;for(let x=0;x<w;x+=35){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=35){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  this.hitboxes=[];
  if(this.packing){this.drawPacking();return;}
  this.baseScale=Math.max(15,Math.min(w/17,(h-240)/8.5));const s=this.baseScale*this.zoom,ox=w/2-.5*s+this.pan.x,oy=Math.max(210,h*.57)+this.pan.y;
  const rect=this.canvas.getBoundingClientRect(),cos=Math.cos(this.angle),sin=Math.sin(this.angle);
  c.save();c.translate(ox,oy);c.rotate(this.angle);c.scale(s,s);
  const box=(x,z,bw,bh,fill)=>{c.fillStyle=fill;c.beginPath();c.roundRect(x-bw/2,z-bh/2,bw,bh,.1);c.fill();};
  box(-4.2,-3.2,3.1,3.9,'#889d91');box(-4.2,-3.2,2.8,3.65,'#e2e8da');box(1,0,11.5,2.85,'#778e83');box(1,0,11.2,2.5,'#e4e8d9');
  c.strokeStyle='#b2c0b2';c.lineWidth=.025;for(let i=0;i<51;i++){const x=-4.5+i*.22+(sim.stopped?0:(sim.time*sim.secondarySpeed)%.22);c.beginPath();c.moveTo(x,-1.2);c.lineTo(x,1.2);c.stroke();}
  for(let i=0;i<16;i++){const z=-4.9+i*.22+(sim.time*sim.feeder)%.22;c.beginPath();c.moveTo(-5.5,z);c.lineTo(-2.9,z);c.stroke();}
  box(-4.2,-6,2.7,1.8,'#a8b992');box(7.45,0,1.7,3.1,'#17623e');c.fillStyle='white';c.textAlign='center';c.font='700 .3px system-ui';c.save();c.translate(7.45,0);c.rotate(-Math.PI/2);c.fillText('LINE 01 →',0,.1);c.restore();
  for(const b of sim.bottles){
   let x=b.x,z=b.z;if(b.belt==='bin'){const p=fromBin(binSlot(b.slot),sim.tilt,sim.binState==='loading'?1-sim.loadTime/1.2:1);x=p.x;z=p.z;}
   const bw=b.up?.39:.82,bh=b.up?.49:.35;c.save();c.translate(x,z);
   if(b.id===this.selectedId){c.strokeStyle='#953bcf';c.lineWidth=.09;c.strokeRect(-bw/2-.16,-bh/2-.16,bw+.32,bh+.32);}
   box(0,0,bw,bh,sim.juice.color);
   if(b.defect!=='label')box(-bw*.04,0,bw*.61,bh*.65,sim.juice.label);
   c.fillStyle='#f9fff1';if(b.up){c.beginPath();c.ellipse(0,-bh*.2,bw*.44,bw*.35,b.defect==='cap'?.5:0,0,Math.PI*2);c.fill();}else{c.save();c.translate(bw*.4,0);if(b.defect==='cap')c.rotate(.45);c.fillRect(-bw*.09,-bh*.52,bw*.18,bh*1.04);c.restore();}
   if(b.defect==='fill'){c.fillStyle='#e0eddf';c.fillRect(-bw*.43,-bh*.4,bw*.32,bh*.8);}c.restore();
   if(b.belt==='secondary')this.hitboxes.push({id:b.id,x:rect.x+ox+(x*cos-z*sin)*s,y:rect.y+oy+(x*sin+z*cos)*s,radius:bw*s/2+8});
  }
  c.restore();c.fillStyle='#46674f';c.font='600 11px system-ui';c.textAlign='center';c.fillText('OVERHEAD COMPATIBILITY VIEW',w/2,150);
 }
 drawPacking(){
  const c=this.ctx,p=this.packing,j=JUICES[p.juiceIndex],s=Math.min(this.w/430,(this.h-245)/350)*this.zoom;
  c.save();c.translate(this.w/2+this.pan.x,Math.max(230,this.h*.47)+this.pan.y);c.rotate(this.angle);c.scale(s,s);
  const bottle=(x,y)=>{c.fillStyle=j.color;c.beginPath();c.roundRect(x,y,15,35,4);c.fill();c.fillStyle=j.label;c.fillRect(x,y+12,15,14);c.fillStyle='white';c.fillRect(x+3,y-3,9,6);};
  const pack=(x,y,wrapped=true)=>{for(let i=0;i<6;i++)bottle(x+(i%3)*17,y+Math.floor(i/3)*8);if(wrapped){c.fillStyle='#ffffff35';c.fillRect(x-3,y-6,57,53);c.strokeStyle='#f5fffaff';c.lineWidth=1.5;c.strokeRect(x-3,y-6,57,53);}};
  c.fillStyle='#be935b';for(let i=0;i<5;i++)c.fillRect(-15,66+i*7,198,5);
  for(let i=0;i<p.stacked;i++)pack(-7+i%3*62,25-Math.floor(i/6)*39+Math.floor(i/3)%2*10);
  c.fillStyle='#78998c';c.fillRect(-182,63,120,11);c.fillRect(-170,74,8,48);c.fillRect(-80,74,8,48);
  if(p.phase!=='done'){let x=-152,y=22;if(p.phase==='placing'){const t=p.progress;x+=t*(145+(p.stacked%3)*62);y+=(3-Math.floor(p.stacked/6)*39+Math.floor(p.stacked/3)%2*10)*t-Math.sin(t*Math.PI)*90;}pack(x,y,p.phase==='wrapped'||p.phase==='placing');if(p.phase==='wrapping'){c.strokeStyle='#fff';c.lineWidth=3;c.strokeRect(x-12*(1-p.progress)-3,y-6,57+24*(1-p.progress),53);}}
  for(let i=0;i<p.loose;i++)bottle(-177+i*20,134);
  c.fillStyle='#30543d';c.font='700 11px system-ui';c.textAlign='center';c.fillText('WRAP STATION',-122,0);c.fillText('FINISHED PALLET',85,122);if(p.loose)c.fillText(`${p.loose} LOOSE · SET ASIDE`,-122,192);c.restore();
 }
}

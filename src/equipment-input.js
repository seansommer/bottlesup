export class EquipmentGesture {
 constructor(onControl){this.onControl=onControl;this.active=null;}
 down(id,e){
  if(this.active){this.cancel();return false;}
  const hold=id==='raise'||id==='lower';this.active={id,pointerId:e.pointerId,x:e.clientX,y:e.clientY,hold,cancelled:false};
  if(hold)this.onControl(id,'start');return true;
 }
 move(e){const a=this.active;if(a&&a.pointerId===e.pointerId&&!a.hold&&Math.hypot(e.clientX-a.x,e.clientY-a.y)>8)a.cancelled=true;}
 up(e){const a=this.active;if(!a||a.pointerId!==e.pointerId)return;this.move(e);this.active=null;if(a.hold)this.onControl(a.id,'end');else if(!a.cancelled)this.onControl(a.id,'tap');}
 cancel(){const a=this.active;this.active=null;if(a?.hold)this.onControl(a.id,'end');}
}
export function installEquipmentInput(canvas,hit,onControl,capture=()=>{}){
 const gesture=new EquipmentGesture(onControl);
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation();};
 canvas.addEventListener('pointerdown',e=>{
  if(gesture.active){gesture.cancel();capture(false);stop(e);return;}
  if(e.button!==0)return;const id=hit(e.clientX,e.clientY);if(!id)return;
  gesture.down(id,e);capture(true);canvas.setPointerCapture(e.pointerId);stop(e);
 },{capture:true});
 canvas.addEventListener('pointermove',e=>{if(gesture.active?.pointerId===e.pointerId){gesture.move(e);stop(e);}},{capture:true});
 canvas.addEventListener('pointerup',e=>{if(gesture.active?.pointerId!==e.pointerId)return;gesture.up(e);capture(false);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);stop(e);},{capture:true});
 for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(gesture.active?.pointerId===e.pointerId){gesture.cancel();capture(false);}},{capture:true});
 return {cancel(){gesture.cancel();capture(false);}};
}

// A drag, pinch, or cancelled pointer must never stand or reject a bottle.
export class TapGesture {
  constructor() {this.pointers = new Map();}
  down(e) {
    if (e.button !== 0 && e.button !== 2) return;
    this.pointers.set(e.pointerId, {x:e.clientX, y:e.clientY, button:e.button, cancelled:this.pointers.size > 0});
    if (this.pointers.size > 1) for (const p of this.pointers.values()) p.cancelled = true;
  }
  move(e) {const p = this.pointers.get(e.pointerId); if (p && Math.hypot(e.clientX-p.x, e.clientY-p.y) > 8) p.cancelled = true;}
  up(e) {this.move(e); const p = this.pointers.get(e.pointerId); this.pointers.delete(e.pointerId); return p && !p.cancelled ? p : null;}
  cancel(e) {this.pointers.delete(e.pointerId);}
}
export function nearbyBottles(points, x, y, radius = 27) {
  return points.map(p=>({...p, distance:Math.hypot(p.x-x,p.y-y)})).filter(p=>p.distance <= Math.max(radius,p.radius||0)).sort((a,b)=>a.distance-b.distance).map(p=>p.id);
}

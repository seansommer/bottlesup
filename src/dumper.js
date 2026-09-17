// Shared coordinates keep the bin, its contents and released bottles together.
export const BELT_HEIGHT = 1.66;
export function binSlot(index) {
  return {x: (index % 5 - 2) * .39, y: .36 + Math.floor(index / 10) * .34, z: -1 + (Math.floor(index / 5) % 2 - .5) * .87};
}
export function dumperPose(tilt, loading = 1) {
  const t = Math.max(0, Math.min(1, loading));
  return {x: -4.2, y: .24 + t * 1.41 + tilt * .0045, z: -7.5 + t * 2.2, angle: tilt * Math.PI / 180};
}
export function fromBin(point, tilt, loading = 1) {
  const p = dumperPose(tilt, loading), c = Math.cos(p.angle), s = Math.sin(p.angle);
  return {x: p.x + point.x, y: p.y + point.y * c - point.z * s, z: p.z + point.y * s + point.z * c};
}
export function releaseBottle(b) {
  b.belt = 'falling'; b.dropTime = 0; b.airborne = false;
}
export function stepDrop(b, dt, tilt) {
  b.dropTime += dt;
  if (!b.airborne) {
    const t = Math.min(1, b.dropTime / .32), start = binSlot(b.slot);
    // Roll over the open rim before gravity takes over outside the bin.
    const local = {x:start.x, y:start.y + (2.12 - start.y) * t, z:start.z + (.06 - start.z) * t};
    Object.assign(b, fromBin(local, tilt));
    b.spin = Math.PI / 2 + tilt * Math.PI / 180 + t * .5;
    if (t === 1) {b.airborne = true; b.vx = start.x * .12; b.vy = .2; b.vz = 1.05 + tilt * .005;}
    return false;
  }
  b.vy -= 9.8 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.spin += dt * 3;
  if (b.y > BELT_HEIGHT) return false;
  b.y = BELT_HEIGHT; b.x = Math.max(-5.25, Math.min(-3.15, b.x)); b.z = Math.max(-4.8, Math.min(-2.1, b.z));
  b.belt = 'primary'; b.age = 0;
  return true;
}

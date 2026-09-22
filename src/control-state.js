export const PLANT = Object.freeze({beltLength:11.25,beltWidth:3,machineLength:11.25/4,machineX:6.675+11.25/8,gateX:6.25});
export const CONTROL_POSITIONS = Object.freeze({
 load:[-4.1,.8,-8.5],raise:[-6.55,2,-3.8],lower:[-6.55,1.4,-1.5],
 slower:[-6,1.55,2.35],faster:[-3.9,1.55,2.35],stop:[-.8,1.5,2.35],inspect:[1.3,1.5,2.35],bonus:[3.4,2.1,2.35]
});
export function controlState(sim,active=true){
 const ready=active&&!sim.paused&&!sim.ended&&!sim.batchReady,firstClear=!sim.bottles.some(b=>b.belt==='primary'||b.belt==='falling');
 const load=sim.binState==='empty'&&sim.tilt<=.1&&sim.binsLoaded<sim.binsRequired;
 return {
  load:{enabled:ready&&load,glow:ready&&load,label:'LOAD BIN'},
  raise:{enabled:ready&&sim.binState==='ready'&&sim.binLeft>0&&sim.tilt<100,glow:ready&&sim.binState==='ready'&&sim.binLeft>0&&sim.tilt<=42,label:'RAISE · HOLD'},
  lower:{enabled:ready&&sim.binState!=='loading'&&sim.tilt>0,glow:ready&&sim.binState==='empty'&&firstClear&&sim.tilt>0,label:'LOWER · HOLD'},
  slower:{enabled:ready&&sim.feeder>0,glow:false,label:'SLOWER'},
  faster:{enabled:ready&&sim.feeder<1,glow:false,label:'FASTER'},
  stop:{enabled:ready&&sim.cards>0,glow:ready&&sim.cards>0&&sim.pressure>1,label:sim.stopped?`STOPPED ${Math.ceil(sim.stopUntil-sim.time)}s`:`STOP ×${sim.cards}`},
  inspect:{enabled:ready,glow:false,label:'INSPECT'},
  bonus:{enabled:ready&&!!sim.pendingReward,glow:ready&&!!sim.pendingReward,label:sim.pendingReward?'BONUS READY':'BONUS'}
 };
}

import test from 'node:test';import assert from 'node:assert/strict';import {Simulation,juiceSpeedBonus} from '../src/simulation.js';import {Palletizer} from '../src/palletizer.js';import {topRuns} from '../src/leaderboard.js';
const bottle=(s,defect=null)=>Object.assign(s.addBottle(),{belt:'secondary',x:0,z:0,up:false,defect,finicky:false});
test('speed rewards quicker quality work, not throwing everything away',()=>{
 assert.equal(juiceSpeedBonus(60,64,'race'),6400);assert.equal(juiceSpeedBonus(180,64,'race'),3200);
 assert.equal(juiceSpeedBonus(1,0,'race'),0);assert.ok(juiceSpeedBonus(60,32,'race')<juiceSpeedBonus(60,64,'race'));
 assert.equal(juiceSpeedBonus(60,64,'shift'),1280);
 const s=new Simulation({mode:'race'}),good=bottle(s),bad=bottle(s,'cap');s.action(good.id);assert.equal(s.score,0);s.intake([good]);assert.equal(s.score,50);s.action(bad.id,true);assert.equal(s.score,125);s.action(bottle(s).id,true);assert.equal(s.score,25);assert.equal(s.batchRejected,1);
});
test('four-juice race completes once after four packing finishes, with fixed inventories and untimed packing',()=>{
 const events=[],s=new Simulation({mode:'race',onEvent:e=>events.push(e)});
 for(let i=1;i<=4;i++){
  assert.equal(s.level,i);assert.equal(s.binsRequired,2);assert.equal(s.binSize,32);
  s.binsLoaded=2;s.batchDelivered=58;s.batchRejected=6;s.time=s.juiceStartedAt+60;s.step(0);
  assert.equal(s.batchReady,true);assert.equal(s.splits.length,i);assert.equal(s.splits.at(-1).bonus,6400);
  const before=s.time,score=s.score;s.step(30);assert.equal(s.time,before);assert.equal(s.score,score);
  assert.equal(s.completeBatch(),true);assert.equal(s.completeBatch(),false);
 }
 assert.equal(s.ended,true);assert.equal(s.reason,'Four-juice finish');assert.equal(s.time,240);assert.equal(s.result().completedJuices,4);assert.equal(s.speedBonusTotal,25600);assert.equal(events.filter(e=>e.type==='end').length,1);assert.equal(s.level,4);
});
test('cardboard slides exactly once between complete layers, never over the final layer',()=>{
 for(const packs of [4,5,8,9,12,13]){const p=new Palletizer(packs*6);p.auto=true;let sheets=0,previous='';for(let i=0;i<5000&&p.phase!=='done';i++){p.step(1/60);if(p.phase==='sheet'&&previous!=='sheet'){sheets++;assert.equal(p.stacked%4,0);assert.equal(p.wrap(),false);assert.equal(p.place(),false);}previous=p.phase;}assert.equal(p.stacked,packs);assert.equal(p.sheets,Math.floor((packs-1)/4));assert.equal(sheets,p.sheets);}
});
test('race board ranks completed total points first, speed breaks ties, failed races never rank',()=>{
 const run=(score,duration,completedJuices=4)=>({version:'1.0.0',mode:'race',score,duration,completedJuices,reason:completedJuices===4?'Four-juice finish':'Line overflow'});
 const rows=topRuns({p:{displayName:'Paul'}},{p:{slow:run(100,300),fast:run(100,200),winner:run(120,400),dnf:run(999,40,1)}} ,{},'race');assert.deepEqual(rows.map(r=>r.id),['winner','fast','slow']);
});

test('the long belt fully supports the feeder width and its visual edge matches collision bounds',async()=>{const {PLANT}=await import('../src/control-state.js');const {PRIMARY_BOUNDS,SECONDARY_BOUNDS}=await import('../src/bottle-physics.js');assert.ok(SECONDARY_BOUNDS.minX<=PRIMARY_BOUNDS.minX);assert.ok(SECONDARY_BOUNDS.maxX>=PRIMARY_BOUNDS.maxX);assert.ok(Math.abs(PLANT.beltX-PLANT.beltLength/2-SECONDARY_BOUNDS.minX)<1e-8);assert.ok(Math.abs(PLANT.beltX+PLANT.beltLength/2-6.625)<1e-8);});

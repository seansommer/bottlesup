import test from 'node:test';import assert from 'node:assert/strict';import {topRuns} from '../src/leaderboard.js';
const run=(score,mode='shift',finishedAt=1)=>({score,mode,finishedAt,version:'1.0.0'});
test('all-time top ten ranks individual runs, includes repeated players and excludes hidden, orphaned, practice and invalid results',()=>{
 const runs={a:Object.fromEntries(Array.from({length:14},(_,i)=>['r'+i,run(i*100)])),b:{best:run(1600),endless:run(9000,'endless'),practice:run(2000,'practice'),bad:run(NaN),old:{...run(3000),version:'0'}},orphan:{r:run(9999)}};
 const result=topRuns({a:{displayName:'Paul'},b:{displayName:'Sean'}},runs,{b:{best:true}},'shift');
 assert.equal(result.length,10);assert.deepEqual(result.map(r=>r.score),[1300,1200,1100,1000,900,800,700,600,500,400]);assert.equal(result[0].displayName,'Paul');
 assert.equal(topRuns({b:{}},runs,{},'endless')[0].score,9000);
 assert.deepEqual(topRuns(null,null,null),[]);
});
test('equal scores have stable ordering and no destructive truncation of the source',()=>{const runs={p:{later:run(30,'shift',3),early:run(30,'shift',1),small:run(10)}};assert.deepEqual(topRuns({p:{}},runs,{},'shift',2).map(r=>r.id),['early','later']);assert.equal(Object.keys(runs.p).length,3);});

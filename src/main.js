import {Palletizer} from './palletizer.js';
import {CompatibilityScene} from './fallback.js';
import {Simulation,RULES} from './simulation.js';
import {FactoryScene} from './scene.js';
import {AudioEngine} from './audio.js';
import {Community,friendlyError} from './community.js';
import {PlayerPreferences,PhraseBag,ShiftCountdown,flowProgress} from './shift-features.js';
import {controlState} from './control-state.js';
import {BonusBadge} from './bonus-cube.js';
import {DefectTutorial} from './tutorial.js';

const $=id=>document.getElementById(id),audio=new AudioEngine(),community=new Community();
const preferences=new PlayerPreferences(localStorage),phrases=new PhraseBag();
let mode='shift',playing=false,rejectMode=false,scene,sim,last=0,accumulator=0,eventTimer;
let runId,runOwner=null,pendingResult=null,challenge=null;
let packing=null,packingFinal=false,packingPhase=null,selectionId=null,inspectionIds=[];
let countdown=null,countdownLabel='',shiftPaused=false,dashboard=false,viewOwner=null,cameraSaveTimer;
let reduced=localStorage.getItem('sujaReducedFx')==='true'||matchMedia('(prefers-reduced-motion: reduce)').matches;
const query=new URLSearchParams(location.search),challengeCode=(query.get('challenge')||'').toUpperCase();
const canOperate=()=>playing&&!shiftPaused&&!countdown&&!packing&&!sim.ended&&!sim.batchReady;

function notice(text){clearTimeout(eventTimer);$('event').textContent=text;$('event').hidden=false;eventTimer=setTimeout(()=>$('event').hidden=true,3200);}
function float(text,x,y){if(reduced)return;const n=document.createElement('span');n.className='float-score';n.textContent=text;n.style.left=x+'px';n.style.top=y+'px';$('floating').append(n);setTimeout(()=>n.remove(),850);}
function handleEvent(e){
 if(!playing)return;
 audio.play(e.type==='reward'?`reward-${e.kind}`:e.type);
 if(e.type==='loaded')notice('Bin ready. Hold the glowing ↑ to begin tipping.');
 if(e.type==='binEmpty')notice(sim.binsLoaded<sim.binsRequired?'Bin empty. The ↓ will glow when the feeder is clear.':'Last bin! Clear the line for the next juice.');
 if(e.type==='mystery')notice('A little help? Your rainbow ? bonus is ready.');
 if(e.type==='reward'){
  const labels={stop:'Line stopped · 8 seconds',helper:'Extra hands · 25 seconds',points:'+250 bonus points',card:'One stop card added',quality:'Quality sweep · 18 seconds'};
  notice(labels[e.kind]);
 }
 if(e.type==='waste')notice(e.why==='defect'?'Bad bottle reached the machine · −60':'Bottle lost · −35');
 if(e.type==='fullFlow')notice('FULL FLOW! Triple points for 10 seconds');
 if(e.type==='level')notice(`Juice ${e.level}: ${e.juice} · +300`);
 if(e.type==='wobble')notice('Bottle down! Check downstream.');
 if(e.type==='stand'&&!reduced)scene.burst(e.x,e.z);
 if(e.type==='intake'){
  scene.intake(e);
  $('intake-status').textContent=e.partial?`${e.count} straggler${e.count===1?'':'s'} · +${e.points} (half intake points)`:`Six-pack in! +${e.points}`;
 }
 if(e.type==='batchComplete')beginPacking(e.bottles,e.juiceIndex);
 if(e.type==='end')endRun(e.result);
}

function syncViewLabel(){$('view').textContent=scene.kind==='2d'?'Overhead':scene.view==='first'?'Overhead':'First person';}
function saveCamera(){clearTimeout(cameraSaveTimer);if(scene&&!packing)preferences.write(viewOwner,{camera:scene.getCamera()});}
function queueCameraSave(){
 if(packing)return;
 clearTimeout(cameraSaveTimer);
 // Capture the owner and view together; an account change cannot claim another player's camera.
 const owner=viewOwner,camera=scene.getCamera();
 cameraSaveTimer=setTimeout(()=>preferences.write(owner,{camera}),300);
}
function restorePreferences(owner){
 clearTimeout(cameraSaveTimer);viewOwner=owner||null;
 const p=preferences.read(viewOwner);dashboard=p.dashboard;
 if(!scene.restoreCamera(p.camera))scene.setView('first',false);
 syncViewLabel();updateVisibility();
}
function updateVisibility(){
 const inShift=playing&&!packing&&!sim?.ended;
 const toolsVisible=inShift&&!countdown&&selectionId===null;
 $('controls').hidden=!toolsVisible||!dashboard;
 $('dash-toggle').hidden=!toolsVisible;
 $('quick-inspect').hidden=!toolsVisible||dashboard;
 $('hint').hidden=!toolsVisible;
 $('dash-toggle').setAttribute('aria-expanded',String(dashboard));
 $('dash-toggle-label').textContent=dashboard?'Hide controls':'Controls';
 $('dash-toggle').classList.toggle('bonus-ready',!!sim?.pendingReward);
 $('dash-bonus').hidden=!sim?.pendingReward;
 document.body.classList.toggle('dash-open',toolsVisible&&dashboard);
 document.body.classList.toggle('reduced-fx',reduced);
 $('countdown').hidden=!countdown;
 scene?.setInteraction(canOperate()&&selectionId===null,{reduced,inspect:rejectMode});
}
function toggleDashboard(){dashboard=!dashboard;preferences.write(viewOwner,{dashboard});updateVisibility();}
function setFeeder(value){if(!canOperate())return;sim.setFeeder(Math.max(0,Math.min(1,value)));audio.play('feeder');}
function operate(id,phase='tap'){
 if(phase==='end'){if(id==='raise'||id==='lower')sim?.setLift(0);return;}
 if(!canOperate()||!controlState(sim)[id]?.enabled)return;
 if(id==='raise'||id==='lower')sim.setLift(id==='raise'?1:-1);
 else if(id==='load')sim.loadBin();
 else if(id==='stop')sim.stopBelt();
 else if(id==='bonus')sim.openReward();
 else if(id==='slower'||id==='faster')setFeeder(sim.feeder+(id==='faster'?.1:-.1));
 else if(id==='inspect')setReject(!rejectMode);
}

function pick(id,right,x,y,candidates=[id]){
 if(!canOperate())return;
 if(right||rejectMode){sim.setLift(0);inspectionIds=candidates;selectBottle(id);return;}
 const before=sim.score;if(sim.action(id))float((sim.score>=before?'+':'')+(sim.score-before),x,y);
}
function selectBottle(id){
 const b=sim.secondary.find(b=>b.id===id);if(!b)return;
 selectionId=id;scene.setSelection(id);$('inspection').hidden=false;updateVisibility();
 const preview=$('inspection-bottle');preview.dataset.defect=b.defect||'none';preview.style.setProperty('--juice-color',sim.juice.color);preview.style.setProperty('--label-color',sim.juice.label);$('inspection-juice').textContent=sim.juice.short;
 $('inspection-count').textContent=inspectionIds.length>1?`Bottle ${inspectionIds.indexOf(id)+1} of ${inspectionIds.length} nearby`:'Selected bottle';
 $('inspect-prev').disabled=$('inspect-next').disabled=inspectionIds.length<2;
}
function closeInspection(){selectionId=null;inspectionIds=[];scene.setSelection(null);$('inspection').hidden=true;updateVisibility();}
function cycleInspection(dir){const available=inspectionIds.filter(id=>sim.secondary.some(b=>b.id===id));if(!available.length){closeInspection();return;}const index=available.indexOf(selectionId);inspectionIds=available;selectBottle(available[(index+dir+available.length)%available.length]);}
function confirmInspection(reject){
 if(selectionId===null||!canOperate())return;
 const id=selectionId,b=sim.secondary.find(b=>b.id===id);if(!b){closeInspection();notice('That bottle has moved off the line.');return;}
 const before=sim.score,position=scene.project(id);
 if(sim.action(id,reject)&&position)float((sim.score>=before?'+':'')+(sim.score-before),position.x,position.y);
 closeInspection();
}
function beginPacking(bottles,juiceIndex,final=false){
 saveCamera();packing=new Palletizer(bottles,juiceIndex);packingFinal=final;shiftPaused=false;packingPhase=null;
 sim.setLift(0);closeInspection();scene.setPacking(packing);$('packing').hidden=false;$('bonus-status').hidden=true;
 $('packing-juice').textContent=sim.juice.name;updatePacking();updateVisibility();
 notice(final?'Finish your pallet. Your shift score is complete.':'Juice run complete — time to pack. The clock is paused.');
}
function updatePacking(){
 const p=packing;if(!p)return;
 if(p.phase!==packingPhase){if(p.phase==='wrapping')audio.play('wrap');if(packingPhase==='placing')audio.play('stack');packingPhase=p.phase;}
 $('packing-count').textContent=`${p.bottles} good bottle${p.bottles===1?'':'s'} · ${p.total} six-pack${p.total===1?'':'s'}`;
 $('packing-loose').textContent=p.loose?`${p.loose} loose bottle${p.loose===1?'':'s'} set aside — only full six-packs go on the pallet.`:'Every accepted bottle fits a full six-pack.';
 $('packing-stacked').textContent=`${p.stacked} / ${p.total} stacked`;
 const labels={ready:'Wrap the next six bottles.',wrapping:'Shrink-wrapping…',wrapped:'Six-pack ready. Place it on the pallet.',placing:'Stacking your six-pack…',done:p.total?'Pallet ready. Nice work, crew.':'No full six-pack this time. Your loose bottles are set aside.'};
 $('packing-status').textContent=labels[p.phase];$('wrap-pack').disabled=p.phase!=='ready'||p.auto;$('place-pack').disabled=p.phase!=='wrapped'||p.auto;$('auto-pack').disabled=p.phase==='done'||p.auto;
 $('packing-actions').hidden=p.phase==='done';$('packing-next').hidden=p.phase!=='done';$('packing-next').textContent=packingFinal?'View shift results →':'Start the next juice →';
}
function finishPacking(){
 if(packing?.phase!=='done')return;
 const final=packingFinal;scene.setPacking(null);packing=null;shiftPaused=false;$('packing').hidden=true;
 syncViewLabel();updateVisibility();
 if(final){$('results-dialog').showModal();return;}
 sim.completeBatch();updateHud();updateVisibility();
}
function createDemo(){
 sim=new Simulation({mode:'practice'});
 for(let i=0;i<29;i++){const b=sim.addBottle();b.belt='secondary';b.x=-3.8+Math.floor(i/4)*1.2;b.z=-1.04+(i%4)*.69+(Math.floor(i/4)%2)*.08;b.up=i%4!==0;b.rotation=0;}
 sim.paused=true;
}
try{scene=new FactoryScene($('world'),pick,operate);}
catch(e){
 console.warn('3D unavailable; using compatibility view.',e.message);
 const old=$('world'),replacement=old.cloneNode(false);old.replaceWith(replacement);scene=new CompatibilityScene(replacement,pick,operate);
 $('view').disabled=true;document.body.classList.add('compatibility');
 $('camera-help').textContent='Drag to move · Pinch or scroll to zoom · Use the buttons to rotate the overhead view.';
 for(const b of document.querySelectorAll('[data-camera^="tilt"]'))b.hidden=true;
}
const bonusBadge=new BonusBadge($('bonus-canvas'),scene.kind==='3d');
const tutorial=new DefectTutorial($('tutorial-dialog'),audio);
createDemo();restorePreferences(null);scene.onCameraChanged=queueCameraSave;
new ResizeObserver(entries=>{const h=entries[0].target.getBoundingClientRect().height;if(h)document.body.style.setProperty('--dash-height',h+'px');}).observe($('controls'));
requestAnimationFrame(frame);

function updateCountdown(){
 const label=countdown.label;
 if(label!==countdownLabel){
  countdownLabel=label;$('countdown-number').textContent=label;
  $('countdown-number').classList.toggle('go',label==='Bottles up!');
  if(label!=='Bottles up!')audio.play(`count${label}`);else audio.play('start');
  if(!reduced)$('countdown-number').animate([{transform:'scale(.78)',opacity:.4},{transform:'scale(1)',opacity:1}],{duration:260,easing:'ease-out'});
 }
}
function frame(now){
 const dt=Math.min(.08,(now-(last||now))/1000);last=now;
 if(playing){
  accumulator+=dt;
  while(accumulator>=1/60){
   if(!shiftPaused){
    if(countdown){countdown.step(1/60);updateCountdown();if(countdown.done){countdown=null;sim.paused=false;updateVisibility();}}
    else if(packing)packing.step(1/60);
    else sim.step(1/60);
   }
   accumulator-=1/60;
  }
  if(packing)updatePacking();
  if(selectionId!==null&&!sim.secondary.some(b=>b.id===selectionId)){closeInspection();notice('Selected bottle has left the line. Tap another to inspect.');}
  updateHud();
 }
 const moving=canOperate()&&sim.binState!=='loading'&&((sim.lift>0&&sim.tilt<100)||(sim.lift<0&&sim.tilt>0));
 audio.setDumperMotion(moving?sim.lift:0);
 scene.render(sim,dt||.016);
 bonusBadge.render(now/1000,!!sim.pendingReward,reduced,!$('controls').hidden);
 requestAnimationFrame(frame);
}
function updateHud(){
 $('score').textContent=sim.score.toLocaleString();
 $('combo').textContent=sim.combo>=2?`${sim.combo} in a row · ×${Math.min(4,1+Math.floor(sim.combo/8))}`:'Build your streak';
 const seconds=mode==='shift'?Math.ceil(RULES.shiftSeconds-sim.time):Math.floor(sim.time);
 $('timer').textContent=mode==='practice'?'PRACTICE':`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
 $('juice').textContent=sim.juice.name;$('level').textContent=`JUICE ${String(sim.level).padStart(2,'0')}`;
 $('waste').textContent=mode==='practice'?`${sim.waste} lost`:`${sim.waste} / ${RULES.wasteLimit} lost`;
 const flow=flowProgress(sim);$('flow-fill').style.width=flow.fraction*100+'%';$('flow-label').textContent=flow.label;$('flow-target').textContent=flow.detail;
 $('flow-meter').setAttribute('aria-valuenow',String(Math.round(flow.fraction*100)));$('flow-meter').setAttribute('aria-valuetext',flow.label+'. '+flow.detail);
 document.body.classList.toggle('full-flow',flow.active);
 const controls=controlState(sim,canOperate());
 for(const [id,state]of [['load','load'],['raise','raise'],['lower','lower'],['stop-belt','stop']]){$(id).disabled=!controls[state].enabled;$(id).classList.toggle('suggested',controls[state].glow);}
 $('tilt-label').textContent=`Tilt ${Math.round(sim.tilt)}°`;$('bin-left').textContent=sim.binState==='loading'?'Loading…':sim.binLeft?`${sim.binLeft} bottles left`:'Bin empty';$('bin-counter').textContent=`BIN ${sim.binsLoaded} / ${sim.binsRequired}`;
 $('speed').value=Math.round(sim.feeder*100);$('speed-value').textContent=`${Math.round(sim.feeder*100)}%`;
 $('stop-belt').textContent=sim.stopped?`Stopped ${Math.ceil(sim.stopUntil-sim.time)}s`:`Stop ×${sim.cards}`;
 $('mystery').disabled=!controls.bonus.enabled;$('mystery').classList.toggle('ready',!!sim.pendingReward);$('bonus-label').textContent=sim.pendingReward?'Tap your bonus':'Bonus charging';
 $('mystery').setAttribute('aria-label',sim.pendingReward?'Open rainbow mystery bonus':'Mystery bonus charging');
 $('reject-count').textContent=`Reject bin · ${sim.rejectBinCount}`;$('queue-count').textContent=`${sim.queueCount} / 6 at intake`;
 const statuses=[];
 if(sim.helpers.length)statuses.push(`${sim.helpers.length} helper${sim.helpers.length===1?'':'s'} · ${Math.ceil(Math.max(...sim.helpers.map(h=>h.until))-sim.time)}s`);
 if(sim.qualityUntil>sim.time)statuses.push('Quality sweep');if(sim.stopped)statuses.push('Long belt stopped');
 $('bonus-status').textContent=statuses.join(' · ');$('bonus-status').hidden=!!packing||sim.ended||!!countdown||!statuses.length;
 let hint=rejectMode?'Inspect mode · Tap a bottle for a close look.':'Tap fallen bottles · Six standing bottles make a pack.';
 if(sim.binState==='loading')hint='Pallet jack moving the bin into position…';
 else if(!sim.binsLoaded)hint='Tap the glowing bin to load. Controls are below if you need them.';
 else if(sim.binLeft&&sim.tilt<43)hint='Hold ↑ past 42° to pour. Release to hold the angle.';
 else if(!sim.binLeft&&sim.binsLoaded<sim.binsRequired)hint=sim.tilt>.1?'Clear the feeder, then hold ↓ to lower the dumper.':'Tap the glowing bin to load your next one.';
 else if(sim.bottles.filter(b=>b.belt==='primary').length>25)hint='A busy feeder! Try a gentler pour.';
 else if(sim.pressure>1)hint='Keep the transfer moving — stand bottles near the left end.';
 $('hint').textContent=hint;updateVisibility();
}
async function start(){
 if(!scene)return;
 if(challengeCode&&(!challenge||challenge.status!=='open')){notice('This challenge is not open yet. Return to Game Center.');return;}
 saveCamera();await audio.unlock();audio.active=true;
 mode=challengeCode?'shift':mode;
 const seed=challenge?challenge.seed:Number(new Date().toISOString().slice(0,10).replaceAll('-',''));
 scene.setPacking(null);packing=null;
 sim=new Simulation({mode,seed,onEvent:handleEvent});playing=true;shiftPaused=false;accumulator=0;
 runId=crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
 runOwner=community.profile?.profileId||null;pendingResult=null;
 restorePreferences(runOwner);$('packing').hidden=true;closeInspection();
 $('camera-panel').hidden=true;$('camera-toggle').setAttribute('aria-expanded','false');setReject(false);
 $('intake-status').textContent='Six good bottles. One satisfying pack.';
 $('menu').hidden=true;for(const id of ['hud','pause'])$(id).hidden=false;
 for(const d of document.querySelectorAll('dialog'))if(d.open)d.close();
 clearTimeout(eventTimer);$('event').hidden=true;
 countdown=new ShiftCountdown();countdownLabel='';sim.paused=true;
 $('shift-phrase').textContent=phrases.next();updateCountdown();updateHud();updateVisibility();
}
function setReject(value){
 if(!value&&selectionId!==null)closeInspection();rejectMode=value;
 for(const id of ['reject-mode','quick-inspect']){$(id).classList.toggle('selected',value);$(id).setAttribute('aria-pressed',String(value));}
 $('stand-mode').classList.toggle('selected',!value);$('stand-mode').setAttribute('aria-pressed',String(!value));
 $('quick-inspect').textContent=value?'✓ Inspecting':'Inspect';$('world').style.cursor=value?'crosshair':'pointer';
 updateVisibility();
}
function pause(){
 if(!playing||(sim.ended&&!packing))return;
 shiftPaused=true;sim.paused=true;sim.setLift(0);audio.active=false;saveCamera();updateVisibility();
 if(!$('pause-dialog').open)$('pause-dialog').showModal();
}
function resume(){
 if(!playing||(sim.ended&&!packing))return;
 shiftPaused=false;sim.paused=sim.ended||!!countdown;audio.active=true;$('pause-dialog').close();audio.unlock();updateVisibility();
}
function menu(){
 saveCamera();scene.setPacking(null);packing=null;countdown=null;playing=false;shiftPaused=false;audio.active=false;
 $('packing').hidden=true;closeInspection();$('camera-panel').hidden=true;$('camera-toggle').setAttribute('aria-expanded','false');
 for(const d of document.querySelectorAll('dialog'))d.close();
 for(const id of ['hud','pause','event','bonus-status'])$(id).hidden=true;
 $('menu').hidden=false;document.body.classList.remove('full-flow');createDemo();restorePreferences(community.profile?.profileId||null);updateVisibility();
}
function endRun(result){
 saveCamera();audio.active=false;pendingResult=result;sim.paused=true;
 $('result-reason').textContent=result.reason.toUpperCase();$('result-score').textContent=result.score.toLocaleString();$('result-grid').replaceChildren();
 for(const [label,value]of [['Stood up',result.stood],['Six-packs',sim.sixPacks],['Stragglers · ½ points',sim.stragglers],['Defects caught',result.rejected],['Best combo',result.maxCombo],['Juice level',result.level]]){
  const n=document.createElement('div'),b=document.createElement('b'),s=document.createElement('span');b.textContent=value;s.textContent=label;n.append(b,s);$('result-grid').append(n);
 }
 saveResult();
 if(sim.batchDelivered>0)beginPacking(sim.batchDelivered,(sim.level-1)%4,true);else{closeInspection();$('results-dialog').showModal();}
 updateVisibility();
}
async function saveResult(){
 if(!pendingResult)return;$('retry-save').hidden=true;
 if(mode==='practice'){$('save-status').textContent='Practice complete. Practice scores are not ranked.';return;}
 if(!runOwner){$('save-status').textContent='Guest run. Sign in before your next shift to save your score.';return;}
 if(community.profile?.profileId!==runOwner){$('save-status').textContent='Your player changed. This run cannot be saved to a different account.';return;}
 $('save-status').textContent='Saving your shift…';
 try{await community.saveRun(runId,pendingResult,challengeCode);$('save-status').textContent='Shift saved to your player card and Hall of Fame.';}
 catch(e){$('save-status').textContent=friendlyError(e);$('retry-save').hidden=false;}
}

$('retry-save').addEventListener('click',saveResult);
for(const id of ['start','again','restart'])$(id).addEventListener('click',start);
$('resume').addEventListener('click',resume);$('pause').addEventListener('click',pause);$('quit').addEventListener('click',menu);$('result-menu').addEventListener('click',menu);
for(const [id,action]of [['load','load'],['stop-belt','stop'],['mystery','bonus']])$(id).addEventListener('click',()=>operate(action));
$('dash-toggle').addEventListener('click',toggleDashboard);
$('stand-mode').addEventListener('click',()=>setReject(false));
for(const id of ['reject-mode','quick-inspect'])$(id).addEventListener('click',()=>setReject(!rejectMode));
$('speed').addEventListener('input',e=>setFeeder(e.target.value/100));
for(const id of ['raise','lower']){
 const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);operate(id,'start');});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>operate(id,'end'));
 b.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();operate(id,'start');}});
 b.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key))operate(id,'end');});
 b.addEventListener('blur',()=>operate(id,'end'));
}
function toggleView(){if($('view').disabled)return;scene.setView(scene.view==='first'?'overhead':'first');syncViewLabel();}
$('camera-toggle').addEventListener('click',()=>{const open=$('camera-panel').hidden;$('camera-panel').hidden=!open;$('camera-toggle').setAttribute('aria-expanded',String(open));});
$('camera-close').addEventListener('click',()=>{$('camera-panel').hidden=true;$('camera-toggle').setAttribute('aria-expanded','false');});
for(const b of document.querySelectorAll('[data-camera]'))b.addEventListener('click',()=>scene.cameraAction(b.dataset.camera));
$('inspect-close').addEventListener('click',closeInspection);$('inspect-prev').addEventListener('click',()=>cycleInspection(-1));$('inspect-next').addEventListener('click',()=>cycleInspection(1));$('inspect-focus').addEventListener('click',()=>scene.focus(selectionId));$('inspect-reject').addEventListener('click',()=>confirmInspection(true));$('inspect-keep').addEventListener('click',()=>confirmInspection(false));
$('wrap-pack').addEventListener('click',()=>packing?.wrap());$('place-pack').addEventListener('click',()=>packing?.place());$('auto-pack').addEventListener('click',()=>{if(packing)packing.auto=true;});$('packing-next').addEventListener('click',finishPacking);
$('view').addEventListener('click',toggleView);
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{mode=b.dataset.mode;for(const x of document.querySelectorAll('[data-mode]'))x.classList.toggle('selected',x===b);});
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$(b.dataset.close).close());
$('how').addEventListener('click',()=>$('help-dialog').showModal());
for(const b of document.querySelectorAll('[data-tutorial]'))b.addEventListener('click',()=>{if(playing&&!shiftPaused)pause();audio.unlock();tutorial.open();});
$('sound').addEventListener('click',()=>{if(playing&&(!sim.ended||packing))pause();$('sound-dialog').showModal();audio.unlock();});
for(const [k,id]of [['music','music-volume'],['sfx','sfx-volume']]){$(id).value=audio[k]*100;$(id).addEventListener('input',e=>{audio.set(k,e.target.value/100);audio.unlock();});}
$('reduced-fx').checked=reduced;$('reduced-fx').addEventListener('change',e=>{reduced=e.target.checked;localStorage.setItem('sujaReducedFx',String(reduced));updateVisibility();});
window.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||(e.target.tagName==='BUTTON'&&[' ','Enter'].includes(e.key)))return;
 if(e.key==='Escape'&&playing&&(!sim.ended||packing)){
  const open=[...document.querySelectorAll('dialog[open]')];if(open.some(d=>d.id!=='pause-dialog'))return;
  e.preventDefault();shiftPaused?resume():pause();return;
 }
 if(document.querySelector('dialog[open]'))return;
 if(e.key.toLowerCase()==='v')toggleView();if(!canOperate())return;
 if(['ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.repeat)return;
 const actions={ArrowUp:'raise',ArrowDown:'lower',l:'load',r:'inspect',' ':'stop'};
 const action=actions[e.key]||actions[e.key.toLowerCase()];if(action)operate(action,'start');
});
window.addEventListener('keyup',e=>{if(['ArrowUp','ArrowDown'].includes(e.key))sim.setLift(0);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveCamera();pause();}});
window.addEventListener('pagehide',saveCamera);
window.addEventListener('blur',()=>{sim?.setLift(0);if(playing)pause();});
$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('results-dialog').addEventListener('cancel',e=>{e.preventDefault();menu();});
community.subscribe(p=>{
 $('player-status').textContent=p?`Playing as ${p.displayName} · Your competitive shifts save to SUJA.`:'Guest play · Sign in at SUJA Game Center to save scores.';
 if(!playing){saveCamera();restorePreferences(p?.profileId||null);}
});
community.init().then(async()=>{
 if(challengeCode){
  $('challenge-status').hidden=false;$('challenge-status').textContent='Connecting to challenge…';
  try{
   challenge=await community.read(`challenges/${challengeCode}`);if(!challenge)throw new Error('Challenge not found.');
   $('challenge-status').textContent=`${challenge.title} · Hosted by ${challenge.hostName} · ${challenge.status}`;
   document.querySelector('.mode-picker').hidden=true;$('start').disabled=challenge.status!=='open';
   community.watch(`challenges/${challengeCode}`,c=>{challenge=c;$('start').disabled=!c||c.status!=='open';$('challenge-status').textContent=c?`${c.title} · ${c.status}`:'Challenge unavailable';});
  }catch(e){$('challenge-status').textContent=friendlyError(e);$('start').disabled=true;}
 }
}).catch(()=>{$('player-status').textContent='Community connection unavailable. Guest play is ready.';});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
// Read-only snapshots are opt-in and contain no identity or score-writing controls.
if(query.get('debug')==='1')window.bottlesDebug={snapshot:()=>({...sim.result(),bottles:sim.bottles.map(b=>({...b})),tilt:sim.tilt,binLeft:sim.binLeft,binState:sim.binState,feeder:sim.feeder,batchReady:sim.batchReady,batchDelivered:sim.batchDelivered,paused:sim.paused,inspection:selectionId,countdown:countdown?.label,queue:sim.queueCount,rejectBin:sim.rejectBinCount,packing:packing?{bottles:packing.bottles,total:packing.total,loose:packing.loose,stacked:packing.stacked,phase:packing.phase}:null}),project:id=>scene.project(id)};

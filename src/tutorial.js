export const DEFECT_LESSONS=Object.freeze([
 {defect:null,title:'Meet a good bottle.',copy:'A straight, snug cap. A complete label. Juice up to the shoulder. This one belongs on the line.'},
 {defect:'label',title:'Look for a missing label.',copy:'If the colored SUJA label is missing, reject the bottle. You should be able to see a complete label around the middle.'},
 {defect:'cap',title:'Check the cap.',copy:'A raised or crooked cap is a reject. Compare it with the straight, snug white cap on a good bottle.'},
 {defect:'fill',title:'Check the fill level.',copy:'A low fill leaves a large empty area above the juice. A good bottle is filled up to its shoulder.'}
]);
export class DefectTutorial {
 constructor(dialog,audio){
  this.dialog=dialog;this.audio=audio;this.$=id=>dialog.querySelector('#'+id);
  this.$('tutorial-next').addEventListener('click',()=>this.next());this.$('tutorial-keep').addEventListener('click',()=>this.answer(false));this.$('tutorial-reject').addEventListener('click',()=>this.answer(true));this.$('tutorial-done').addEventListener('click',()=>dialog.close());
 }
 open(){this.lesson=0;this.practice=-1;this.checked=false;this.examples=['cap',null,'fill','label',null];this.render();this.dialog.showModal();}
 next(){if(this.practice<0){this.lesson++;if(this.lesson===DEFECT_LESSONS.length)this.practice=0;}else if(this.checked){this.practice++;this.checked=false;}this.render();}
 answer(reject){
  if(this.practice<0||this.checked||this.practice>=this.examples.length)return;
  const defect=this.examples[this.practice];
  if(reject===!!defect){this.checked=true;this.audio.play('correct');this.$('tutorial-feedback').textContent=defect?'Good catch! That bottle goes in the reject bin.':'Exactly — stand it up and keep it moving.';this.$('tutorial-next').hidden=false;this.$('tutorial-keep').disabled=this.$('tutorial-reject').disabled=true;}
  else this.$('tutorial-feedback').textContent=defect?`Take another look: ${defect==='cap'?'the cap is tilted and raised.':defect==='label'?'the label is missing.':'the juice is only about half full.'} You can try again.`:'This bottle has a snug cap, a full label and a good fill. Give it another look — no points lost.';
 }
 render(){
  const practice=this.practice>=0,done=this.practice>=this.examples.length,lesson=DEFECT_LESSONS[Math.min(this.lesson,3)];
  this.$('tutorial-step').textContent=done?'READY FOR YOUR SHIFT':practice?`YOUR TURN · ${this.practice+1} / ${this.examples.length}`:`BOTTLE BASICS · ${this.lesson+1} / ${DEFECT_LESSONS.length}`;
  this.$('tutorial-title').textContent=done?'You’re on quality duty!':practice?'Keep it or reject it?':lesson.title;
  this.$('tutorial-copy').textContent=done?'You’ve practiced all three defects. In the game, choose Inspect, tap a bottle, then confirm your choice.':practice?'Look at the cap, label and fill. This is untimed practice; take a good look.':lesson.copy;
  this.$('tutorial-bottle').dataset.defect=(practice?this.examples[this.practice]:lesson.defect)||'none';this.$('tutorial-visual').hidden=done;
  this.$('tutorial-decisions').hidden=!practice||done;this.$('tutorial-next').hidden=practice;this.$('tutorial-next').textContent=practice?'Next bottle →':this.lesson===3?'Try a few bottles →':'Next example →';
  this.$('tutorial-done').hidden=!done;this.$('tutorial-feedback').textContent='';this.$('tutorial-keep').disabled=this.$('tutorial-reject').disabled=false;
 }
}

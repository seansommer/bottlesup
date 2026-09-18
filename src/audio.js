const midi=n=>440*2**((n-69)/12);
// An original, relaxed lounge loop: soft electric keys, rounded bass and brushes.
const CHORDS=[{bass:48,notes:[64,67,71,74]},{bass:45,notes:[60,64,67,71]},{bass:50,notes:[65,69,72,76]},{bass:43,notes:[59,64,65,69]},{bass:48,notes:[64,67,71,74]},{bass:45,notes:[60,64,67,72]},{bass:50,notes:[65,69,72,76]},{bass:43,notes:[59,62,65,69]}];
const MELODY=[76,74,null,71,72,null,69,67,71,null,74,76,77,76,74,null];
export class AudioEngine {
 constructor(){this.music=Number(localStorage.getItem('sujaMusic')??.2);this.sfx=Number(localStorage.getItem('sujaSfx')??.6);this.enabled=true;this.step=0;this._active=false;this.lastFx={};}
 get active(){return this._active;}
 set active(value){this._active=!!value;if(this.ctx){this.musicBus.gain.setTargetAtTime(value?this.music:0,this.ctx.currentTime,.08);if(value)this.nextNote=this.ctx.currentTime+.03;else this.setDumperMotion(0);}}
 unlock(){try{
  if(!this.ctx){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;this.ctx=new Context();this.master=this.ctx.createGain();this.master.gain.value=.72;this.master.connect(this.ctx.destination);this.musicBus=this.ctx.createGain();this.fxBus=this.ctx.createGain();this.musicBus.gain.value=this.active?this.music:0;this.fxBus.gain.value=this.sfx;this.musicBus.connect(this.master);this.fxBus.connect(this.master);
   this.noiseBuffer=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   this.nextNote=this.ctx.currentTime+.05;this.timer=setInterval(()=>this.tick(),75);
  }
  if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return true;
 }catch{return false;}}
 tone(freq,duration=.13,volume=.18,type='sine',delay=0,bus='fx',at){
  if(!this.ctx||this.ctx.state!=='running'||!this.enabled)return;const t=at??this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.025,duration));o.connect(g);g.connect(bus==='music'?this.musicBus:this.fxBus);o.start(t);o.stop(t+duration+.04);o.onended=()=>{o.disconnect();g.disconnect();};
 }
 noise(duration=.12,volume=.08,cutoff=900,delay=0,bus='fx',at){
  if(!this.ctx||this.ctx.state!=='running')return;const t=at??this.ctx.currentTime+delay,n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();n.buffer=this.noiseBuffer;f.type='bandpass';f.frequency.value=cutoff;f.Q.value=.6;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(f);f.connect(g);g.connect(bus==='music'?this.musicBus:this.fxBus);n.start(t);n.stop(t+duration+.02);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();};
 }
 setDumperMotion(direction){
  if(!this.ctx||this.ctx.state!=='running')return;direction=this.active?Math.sign(direction):0;if(direction===this.motionDirection)return;this.motionDirection=direction;
  if(!this.motor){const o=this.ctx.createOscillator(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();o.type='triangle';f.type='lowpass';f.frequency.value=290;g.gain.value=0;o.connect(f);f.connect(g);g.connect(this.fxBus);o.start();this.motor={o,g};}
  this.motor.o.frequency.setTargetAtTime(direction>0?116:82,this.ctx.currentTime,.08);this.motor.g.gain.setTargetAtTime(direction?.055:0,this.ctx.currentTime,.07);
 }
 play(name){
  if(!this.ctx)return;const now=this.ctx.currentTime,minGap={land:.12,feeder:.07,stand:.025,rejectBin:.08}[name]||0;if(now-(this.lastFx[name]??-10)<minGap)return;this.lastFx[name]=now;
  const notes=(ns,step=.075,v=.14)=>ns.forEach((n,i)=>this.tone(midi(n),.27,v,'sine',i*step));
  if(name==='stand'){this.tone(550+this.step%4*60,.085,.15,'triangle');}
  else if(name==='load'){this.noise(.36,.14,370);[0,.13,.26].forEach(t=>this.tone(95,.11,.11,'triangle',t));}
  else if(name==='loaded'){this.tone(135,.16,.15,'triangle');this.noise(.1,.13,650);this.tone(784,.15,.07,'sine',.13);}
  else if(name==='land'){this.tone(330+Math.random()*160,.06,.08,'triangle');this.noise(.045,.055,1800);}
  else if(name==='binEmpty'){notes([67,72],.13,.09);}
  else if(name==='rejectBin'){this.noise(.12,.1,780);this.tone(190,.09,.085,'triangle');}
  else if(name==='reject'){this.tone(1000,.1,.1);}
  else if(name==='feeder'){this.noise(.035,.07,2100);this.tone(430,.045,.06,'triangle');}
  else if(name==='stop'){this.noise(.3,.12,450);[240,175,120].forEach((f,i)=>this.tone(f,.13,.13,'sine',i*.08));}
  else if(name==='mystery'){notes([79,83,86,91],.11,.13);}
  else if(name==='reward-helper'){notes([60,64,67,72],.12);}
  else if(name==='reward-card'){notes([72,79,84],.1);}
  else if(name==='reward-stop'){this.play('stop');notes([72,76],.13,.09);}
  else if(name==='reward-quality'){notes([76,79,83,88],.08);}
  else if(name==='reward-points'){notes([72,76,79,84,88],.065);}
  else if(name==='fullFlow'){notes([72,76,79,83,86,91],.1,.17);}
  else if(name==='intake'){this.noise(.2,.13,440);notes([60,67,72],.06,.1);}
  else if(name==='wrap'){this.noise(.48,.12,1600);notes([72,76],.2,.07);}
  else if(name==='stack'){this.tone(150,.16,.14,'triangle');this.noise(.09,.11,500);this.tone(523,.2,.09,'sine',.07);}
  else if(name==='waste'){this.tone(196,.18,.085,'triangle');this.tone(165,.2,.07,'sine',.09);}
  else if(/^count[123]$/.test(name)){this.tone(midi(72+(3-Number(name.at(-1)))*2),.16,.16,'sine');}
  else if(name==='start'||name==='level'){notes([60,64,67,72],.09,.15);}
  else if(name==='correct'){notes([76,79],.09,.1);}
 }
 tick(){
  if(!this.active||!this.ctx||this.ctx.state!=='running'||document.hidden)return;
  const now=this.ctx.currentTime;if(this.nextNote<now-.4)this.nextNote=now+.025;
  while(this.nextNote<now+.16){
   const t=this.nextNote,beat=this.step%8,bar=Math.floor(this.step/8)%CHORDS.length,chord=CHORDS[bar];
   if(beat===0||beat===5)chord.notes.forEach((n,i)=>{this.tone(midi(n),1.8,.055,'sine',0,'music',t+i*.013);this.tone(midi(n)*2.003,.75,.009,'sine',0,'music',t+i*.013);});
   if(beat===0||beat===4)this.tone(midi(chord.bass+(beat===4?7:0)),.65,.13,'triangle',0,'music',t);
   if(beat===2||beat===6){const n=MELODY[(bar*2+(beat===6?1:0))%MELODY.length];if(n)this.tone(midi(n),.72,.063,'sine',0,'music',t);this.noise(.18,.04,3200,0,'music',t);}
   if(beat%2===1)this.noise(.035,.025,4800,0,'music',t);
   this.step++;this.nextNote+=60/78/2;
  }
 }
 set(kind,value){this[kind]=Math.max(0,Math.min(1,Number(value)));try{localStorage.setItem(kind==='music'?'sujaMusic':'sujaSfx',this[kind]);}catch{}if(this.ctx)(kind==='music'?this.musicBus:this.fxBus).gain.setTargetAtTime(kind==='music'&&!this.active?0:this[kind],this.ctx.currentTime,.06);}
}

export class Palletizer {
  constructor(bottles, juiceIndex = 0) {
    this.bottles = Math.max(0, Math.floor(bottles)); this.juiceIndex = juiceIndex;
    this.total = Math.floor(this.bottles / 6); this.loose = this.bottles % 6;
    this.stacked = 0; this.sheets = 0; this.phase = this.total ? 'ready' : 'done'; this.progress = 0; this.auto = false;
  }
  wrap() {if (this.phase !== 'ready') return false; this.phase = 'wrapping'; this.progress = 0; return true;}
  place() {if (this.phase !== 'wrapped') return false; this.phase = 'placing'; this.progress = 0; return true;}
  step(dt) {
    if (this.auto) {if (this.phase === 'ready') this.wrap(); else if (this.phase === 'wrapped') this.place();}
    if (!['wrapping', 'placing', 'sheet'].includes(this.phase)) return;
    this.progress = Math.min(1, this.progress + Math.max(0, dt) / (this.phase === 'wrapping' ? .7 : this.phase === 'sheet' ? .85 : .65));
    if (this.progress < 1) return;
    if (this.phase === 'wrapping') this.phase = 'wrapped';
    else if(this.phase==='sheet'){this.sheets++;this.phase='ready';}
    else {this.stacked++; this.phase = this.stacked === this.total ? 'done' : this.stacked%6===0 ? 'sheet' : 'ready';}
    this.progress = 0;
  }
}

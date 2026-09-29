// The hub and every SUJA game share one preference on this origin.
const KEY='sujaTheme';
const moon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A9 9 0 0 1 9.5 3.5a9 9 0 1 0 11 11Z"/></svg>';
const sun='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
export function initTheme(button){
 function apply(value){
  const dark=value==='dark';document.documentElement.dataset.theme=dark?'dark':'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#11291d':'#fbfdfb');
  if(button){button.innerHTML=dark?sun:moon;button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');button.setAttribute('aria-pressed',String(dark));button.title=dark?'Light mode':'Dark mode';}
 }
 let value='light';try{value=localStorage.getItem(KEY)||'light';}catch{}apply(value);
 button?.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';apply(next);try{localStorage.setItem(KEY,next);}catch{}});
 window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)apply(e.newValue);});
}

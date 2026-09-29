import{initTheme}from'./theme.js';
import{scoreCards,friendlyError}from'./community.js';
const node=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls||'';el.textContent=text||'';return el;};
const initials=name=>Array.from(name||'?').slice(0,2).join('').toUpperCase();
export function initGameHeader({community,pause,resume,menu,isRunning}){
 const $=id=>document.getElementById(id);initTheme($('theme'));
 const card=node('dialog','suite-dialog');card.id='suite-player-card';card.setAttribute('aria-labelledby','suite-player-title');
 const close=node('button','suite-close','×');close.setAttribute('aria-label','Close player card');close.addEventListener('click',()=>card.close());
 const avatar=node('span','suite-card-avatar','?'),role=node('p','suite-kicker','SUJA CREW'),title=node('h2','','Your player card');title.id='suite-player-title';
 const status=node('p','',''),grid=node('div','suite-card-stats'),account=node('a','suite-card-link','Account & Game Center →');account.href='/sujagamecenter/#account';account.target='_top';
 card.append(close,avatar,role,title,status,grid,account);document.body.append(card);
 let request=0;
 async function loadCard(){
  const version=++request,p=community.profile;grid.replaceChildren();grid.hidden=true;
  avatar.textContent=p?initials(p.displayName):'?';title.textContent=p?.displayName||'Join the crew.';role.textContent=p?.role==='master'?'MASTER HOST':'SUJA CREW';
  account.textContent=p?'Account & Game Center →':'Sign in at Game Center →';
  status.textContent=p?'Loading your lifetime scores…':'Sign in at the Game Center to bring your player and scores into every SUJA game.';
  if(!p)return;
  try{
   const id=p.profileId;
   const [runs,hidden,stacks,stackHidden]=await Promise.all(['runs','moderation','stackerRuns','stackerModeration'].map(path=>community.read(`${path}/${id}`)));
   if(version!==request||community.profile?.profileId!==id)return;
   const stats=scoreCards({[id]:p},{[id]:runs||{}},{[id]:hidden||{}},{[id]:stacks||{}},{[id]:stackHidden||{}})[0];
   for(const [label,key] of [['Pallet Stacker','stacker'],['Stacker cases','stackerCases'],['Best shift','best'],['Four-juice race','race'],['Bottle points','total'],['Bottles stood','bottles'],['Shifts played','games'],['Best combo','combo'],['Defects caught','quality']]){
    const cell=node('div');cell.append(node('strong','',Number(stats[key]||0).toLocaleString()),node('span','',label));grid.append(cell);
   }
   grid.hidden=false;status.textContent='Your SUJA crew record. Keep making it count.';
  }catch(e){if(version===request)status.textContent=friendlyError(e);}
 }
 $('player-card').addEventListener('click',()=>{pause();card.showModal();loadCard();});
 community.subscribe(p=>{
  $('header-avatar').textContent=p?initials(p.displayName):'?';$('header-player-name').textContent=p?.displayName||'Sign in';
  const label=p?`Open ${p.displayName}'s player card`:'Sign in or view your player card';$('player-card').setAttribute('aria-label',label);$('player-card').title=label;
  if(card.open)loadCard();else request++;
 });
 const home=node('dialog','suite-dialog');home.setAttribute('aria-labelledby','suite-home-title');
 const homeTitle=node('h2','','Head back home?');homeTitle.id='suite-home-title';
 const homeCopy=node('p','','Your current run will end. Your saved scores stay on your player card.');
 const leave=node('button','suite-confirm','Return to game home'),stay=node('button','suite-cancel','Keep playing');
 leave.addEventListener('click',()=>{home.close();menu();});stay.addEventListener('click',()=>{home.close();resume();});
 home.addEventListener('cancel',e=>{e.preventDefault();home.close();resume();});home.append(homeTitle,homeCopy,leave,stay);document.body.append(home);
 $('game-home').addEventListener('click',e=>{e.preventDefault();if(isRunning()){pause();home.showModal();}else menu();});
}

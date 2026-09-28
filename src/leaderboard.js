// Rank individual competitive runs; practice and moderated runs never enter the board.
export function topRuns(directory={},runs={},hidden={},mode='shift',limit=10){
 const entries=[];
 for(const [playerId,player] of Object.entries(directory||{})){
  for(const [id,run] of Object.entries(runs?.[playerId]||{})){
   if(!run||hidden?.[playerId]?.[id]||run.version!=='1.0.0'||run.mode!==mode||!['shift','endless'].includes(mode)||!Number.isFinite(run.score)||run.score<0)continue;
   entries.push({id,playerId,displayName:player.displayName||run.displayName||'Player',score:run.score,finishedAt:Number.isFinite(run.finishedAt)?run.finishedAt:0});
  }
 }
 return entries.sort((a,b)=>b.score-a.score||a.finishedAt-b.finishedAt||a.playerId.localeCompare(b.playerId)||a.id.localeCompare(b.id)).slice(0,limit);
}

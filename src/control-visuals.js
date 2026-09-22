// One visual language for the dashboard, 3D equipment and compatibility view.
export const CONTROL_VISUALS=Object.freeze({
 load:{color:'#176da7',light:'#e5f3ff',shape:'crate',name:'Load bin'},
 raise:{color:'#16753e',light:'#e6f6e7',shape:'triangle-up',name:'Raise'},
 lower:{color:'#a96309',light:'#fff0cb',shape:'triangle-down',name:'Lower'},
 slower:{color:'#167c8b',light:'#def5f7',shape:'bar',name:'Slower'},
 faster:{color:'#167c8b',light:'#def5f7',shape:'cross',name:'Faster'},
 stop:{color:'#bc303e',light:'#fff0ef',shape:'octagon',name:'Stop belt'},
 inspect:{color:'#763caa',light:'#f1e7fc',shape:'lens',name:'Inspect'},
 stand:{color:'#16753e',light:'#e6f6e7',shape:'bottle',name:'Stand'},
 bonus:{color:'#763caa',light:'#f1e7fc',shape:'cube',name:'Bonus'}
});
export const CONTROL_PATHS=Object.freeze({
 load:'M3 6H21V21H3Z M2 3H22V6H2Z M8 10V17 M16 10V17',
 raise:'M12 3L4 11H9V21H15V11H20Z',
 lower:'M9 3H15V13H20L12 21L4 13H9Z',
 slower:'M5 12H19',faster:'M12 5V19 M5 12H19',
 stop:'M8 2H16L22 8V16L16 22H8L2 16V8Z M9 8V16 M15 8V16',
 inspect:'M16 10A6 6 0 1 1 4 10A6 6 0 1 1 16 10 M15 15L21 21',
 stand:'M9 2H15V6L18 10V21H6V10L9 6Z M7 13H17 M10 2V6 M14 2V6',
 bonus:'M8 8A4 4 0 1 1 14 11L12 13V15 M12 19V20'
});
export function controlIcon(id){return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${CONTROL_PATHS[id]||CONTROL_PATHS.bonus}" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/></svg>`;}
const paths=new Map();
export function drawControlIcon(ctx,id,x,y,size,color='#fff'){
 if(!paths.has(id))paths.set(id,new Path2D(CONTROL_PATHS[id]||CONTROL_PATHS.bonus));
 ctx.save();ctx.translate(x,y);ctx.scale(size/24,size/24);ctx.strokeStyle=color;ctx.lineWidth=2.3;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(paths.get(id));ctx.restore();
}

export const PALLET=Object.freeze({casesPerLayer:4,size:3.4,sheetSize:3.3,color:0x0e3977,layerStep:1.06});
export function caseSlot(index){return {column:index%2,row:Math.floor(index/2)%2,layer:Math.floor(index/PALLET.casesPerLayer)};}

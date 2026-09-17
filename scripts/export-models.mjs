import{GLTFExporter}from'three/addons/exporters/GLTFExporter.js';import{writeFile,mkdir}from'node:fs/promises';import{bottle,worker,crate}from'../src/models.js';import{JUICES}from'../src/simulation.js';
// Node adapter for the browser-standard FileReader used by Three's exporter.
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(value=>{this.result=`data:${blob.type};base64,${Buffer.from(value).toString('base64')}`;this.onloadend?.();});}};
await mkdir('assets/models',{recursive:true});const exporter=new GLTFExporter();
const assets=[...JUICES.map((j,i)=>[`bottle-${i+1}`,bottle(j)]),...Array.from({length:4},(_,i)=>[`crew-${i+1}`,worker(i)]),['juice-bin',crate()]];
for(const[name,model]of assets){model.traverse(o=>{o.userData={};});const data=await exporter.parseAsync(model,{binary:true});await writeFile(`assets/models/${name}.glb`,Buffer.from(data));console.log(name, data.byteLength);}

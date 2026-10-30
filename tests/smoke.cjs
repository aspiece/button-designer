// Run with: node tests/smoke.cjs  (no npm packages required)
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'Inline application script exists');
new vm.Script(script,{filename:'index.html'});
const nodes=new Map();
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
let imageDraws=0,rotations=[];
const ctx=new Proxy({}, {get(t,p){
if(p==='measureText')return s=>({width:String(s).length*19});
if(p==='drawImage')return()=>{imageDraws++};
if(p==='rotate')return a=>rotations.push(a);
return ()=>{};
},set(){return true}});
class Node {
constructor(id){this.id=id;this.value='';this.checked=false;this.disabled=false;this.style={};this.classList={add(){},remove(){}};
this.width=id==='editorCanvas'?800:id==='sheetPreview'?680:800;this.height=id==='sheetPreview'?880:800;}
getContext(){return ctx}addEventListener(){}appendChild(){}remove(){}click(){}setCustomValidity(){}
getBoundingClientRect(){return {left:0,top:0,width:800,height:800}}
toDataURL(){return 'data:image/jpeg;base64,/9j/2Q=='}
}
ids.forEach(id=>nodes.set(id,new Node(id)));
const defaults={theme:'paw',cutSize:'3',copies:'6',logoSize:'52',topSize:'34',bottomSize:'28',middleSize:'52',centerSize:'58',font:'Arial Black',borderStyle:'double',borderColor:'#111111'};
Object.entries(defaults).forEach(([k,v])=>nodes.get(k).value=v);
const doc={getElementById(id){assert.ok(nodes.has(id),'Missing control: '+id);return nodes.get(id)},createElement(t){return new Node(t)},body:{append(){}}};
class Image {constructor(){this.complete=true;this.naturalWidth=300;this.naturalHeight=300;}}
const sandbox={document:doc,Image,localStorage:{getItem:()=>null,setItem(){}},confirm:()=>true,TextEncoder,Blob,URL:{createObjectURL:()=>'/blob',revokeObjectURL(){}},setTimeout:()=>{},console,Uint8Array,atob};
vm.createContext(sandbox);
vm.runInContext(script+'\nthis.appTest={themes,changeTheme,drawButton,drawSheet,sheetLayout,pdfFromJpegs,restoreProject};',sandbox);
const api=sandbox.appTest;
const names=['paw','tiger','titanium','blank','orange','black'];
assert.deepEqual(Object.keys(api.themes),names,'Six template names');
for(const name of names){nodes.get('theme').value=name;api.changeTheme();api.drawButton(ctx,800,{cut:3});assert.ok(nodes.get('bgColor').value.startsWith('#'),name+' background');}
assert.equal(api.sheetLayout(2.625).count,9,'Default 2.25-inch button yields nine 2.625-inch cuts per US Letter');
assert.equal(api.sheetLayout(1.313).count,35,'One-inch buttons fit 35 per page');
assert.equal(api.sheetLayout(6.656).count,1,'Six-inch button fits once per page');
for(const [cut,expected] of [[1.629,24],[1.837,20],[2.088,12],[2.8,6],[3.451,6],[4,4],[4.5,2]]){
 const layout=api.sheetLayout(cut);
 assert.equal(layout.count,expected,'Sheet layout for '+cut+'-inch cuts');
 assert.ok(layout.x0>0.17&&layout.y0>0.17,'Printable margins must be positive for '+cut);
 assert.ok(layout.x0+layout.cols*cut+(layout.cols-1)*layout.hgap<=8.5,'Print stays on page width');
 assert.ok(layout.y0+layout.rows*cut+(layout.rows-1)*layout.vgap<=11,'Print stays on page height')
}
assert.equal(api.sheetLayout(3).count,6);
assert.equal(api.sheetLayout(2.8).count,6);
assert.equal(api.sheetLayout(2.5).count,12);
nodes.get('cutSize').value='2.5';imageDraws=0;api.drawSheet(ctx,680,880,false,4);assert.equal(imageDraws,4,'Partial sheet does not overprint');
nodes.get('theme').value='paw';api.changeTheme();rotations=[];api.drawButton(ctx,800,{cut:3});assert.ok(rotations.length>0,'Curved letters rendered');assert.ok(rotations.every(a=>Math.abs(a)<Math.PI/2),'Upright curved text');
const logoMarkup=html.match(/<select id="teamLogo">([\s\S]*?)<\/select>/i)?.[1]||'';
const pngNames=[...logoMarkup.matchAll(/<option value="([\w-]+)">/g)].map(m=>m[1]).filter(Boolean);
assert.equal(pngNames.length,10,'Ten actual team logo choices');
for(const name of pngNames)assert.ok(fs.existsSync(path.join(__dirname,'..','logos',name+'.png')),'Missing team logo '+name);
const pdf=api.pdfFromJpegs([{bytes:Uint8Array.of(255,216,255,217),w:1,h:1}]);
assert.ok(pdf.size>100,'PDF is not empty');
pdf.arrayBuffer().then(buf=>{assert.equal(Buffer.from(buf).toString('ascii',0,8),'%PDF-1.4');console.log('PASS: six templates, print grids, partial sheet, upright text, ten logos and PDF structure');}).catch(e=>{console.error(e);process.exitCode=1});

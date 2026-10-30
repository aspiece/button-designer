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
getContext(){return ctx}addEventListener(){}appendChild(){}remove(){}click(){}
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
assert.equal(api.sheetLayout(3).count,6);
assert.equal(api.sheetLayout(2.8).count,6);
assert.equal(api.sheetLayout(2.5).count,12);
nodes.get('cutSize').value='2.5';imageDraws=0;api.drawSheet(ctx,680,880,false,4);assert.equal(imageDraws,4,'Partial sheet does not overprint');
rotations=[];api.drawButton(ctx,800,{cut:3});assert.ok(rotations.every(a=>Math.abs(a)<Math.PI/2),'Upright curved text');
const pngNames=[...html.matchAll(/<option value="([\w-]+)">(?:Tiger|Siberian|Bengal|Tungsten|Chromium|Iridium)/g)].map(m=>m[1]);
for(const name of pngNames)assert.ok(fs.existsSync(path.join(__dirname,'..','logos',name+'.png')),'Missing team logo '+name);
const pdf=api.pdfFromJpegs([{bytes:Uint8Array.of(255,216,255,217),w:1,h:1}]);
assert.ok(pdf.size>100,'PDF is not empty');
pdf.arrayBuffer().then(buf=>{assert.equal(Buffer.from(buf).toString('ascii',0,8),'%PDF-1.4');console.log('PASS: six templates, print grids, partial sheet, upright text, ten logos and PDF structure');}).catch(e=>{console.error(e);process.exitCode=1});

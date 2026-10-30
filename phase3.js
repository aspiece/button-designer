/* Phase 3: print-only workspace, safe area guidance, portable classroom batch sheets. */
(() => {
'use strict';
const panel=document.querySelector('.right');
if(!panel||!window.HTMLDialogElement)return;
const openButton=document.createElement('button');
openButton.id='openPrintStudio';openButton.type='button';
openButton.className='btn primary full';openButton.textContent='Preview, print & combine buttons';
const intro=document.createElement('p');intro.className='hint';
intro.textContent='Open the print workspace for single designs or a whole team. Everything prints at actual size.';
panel.querySelector('h2')?.after(intro,openButton);
const legacy=document.createElement('details');legacy.id='legacyPrint';
const legacySummary=document.createElement('summary');legacySummary.textContent='Quick print controls (advanced)';
const movable=[...panel.children].filter(el=>el!==panel.querySelector('h2')&&el!==intro&&el!==openButton);
legacy.append(legacySummary,...movable);panel.append(legacy);

const dialog=document.createElement('dialog');dialog.id='printWorkspace';
dialog.setAttribute('aria-labelledby','printStudioTitle');
dialog.innerHTML=`
<div class="ps-heading"><div><h2 id="printStudioTitle">Print Studio</h2><p>2.5-inch finished buttons · US Letter paper</p></div><button id="psClose" type="button" aria-label="Close print workspace">✕</button></div>
<div class="ps-tabs" role="tablist" aria-label="Print mode">
 <button id="psSingleTab" role="tab" aria-selected="true" aria-controls="psSingle" type="button">My button</button>
 <button id="psMixedTab" role="tab" aria-selected="false" aria-controls="psMixed" type="button">Classroom sheet</button>
</div>
<div class="ps-layout">
 <div class="ps-options">
  <div class="ps-common"><label for="psCut">Cut-circle diameter</label><select id="psCut">
    <option value="2.5">2.5″ (no paper wrap)</option><option value="2.75">2.75″</option><option value="2.8">2.8″</option><option value="3">3.0″</option>
  </select><p class="ps-muted">Choose the size required by your button press, not the finished face diameter.</p></div>
  <section id="psSingle" role="tabpanel" aria-labelledby="psSingleTab">
    <label for="psCopies">Number of identical buttons</label><select id="psCopies"><option value="6">6</option><option value="12">12</option><option value="18">18</option><option value="24">24</option><option value="36">36</option><option value="48">48</option></select>
    <h3>Design checks</h3><div id="psWarnings" class="ps-warnings" aria-live="polite"></div>
    <button type="button" class="btn primary full" id="psDownloadSingle">Download my print PDF</button>
  </section>
  <section id="psMixed" role="tabpanel" aria-labelledby="psMixedTab" hidden>
    <h3>Combine different student designs</h3><p class="ps-muted">Ask students to download an <strong>editable project (.json)</strong>. Add them here; no accounts or uploads to a server.</p>
    <button type="button" class="ps-add" id="psAddCurrent">+ Add my current button</button>
    <label class="ps-file-label" for="psUploadProjects">+ Add student projects (JSON) or button PNGs</label>
    <input id="psUploadProjects" type="file" accept=".json,.png,application/json,image/png" multiple>
    <p id="psImportMessage" aria-live="polite" class="ps-muted"></p>
    <div class="ps-queue-head"><h3>Print queue</h3><span id="psQueueCount">0 buttons</span></div>
    <div id="psQueue" class="ps-queue"></div>
    <p id="psMixedHint" class="ps-muted">Printed in the order shown; each design repeats for its quantity.</p>
    <button type="button" class="btn primary full" id="psDownloadMixed" disabled>Download combined PDF</button>
  </section>
  <div class="ps-autosave" id="psRecovery" hidden><strong>Unsaved design recovered?</strong><p>An earlier version of your button is available on this device.</p><button type="button" id="psRestore">Restore earlier design</button><button type="button" id="psDiscard">Discard</button></div>
 </div>
 <div class="ps-preview">
   <h3>Print preview <span id="psPage">Page 1 of 1</span></h3>
   <canvas id="psCanvas" width="510" height="660" aria-label="Preview of a US Letter printed button sheet"></canvas>
   <div class="ps-pagination"><button id="psPrevious" type="button" disabled>← Previous</button><button id="psNext" type="button" disabled>Next →</button></div>
   <p class="ps-muted"><strong>Always print at 100% / Actual size.</strong> Print one test sheet and measure the cut diameter with a ruler before mass production. The dotted face guides are preview-only.</p>
   <p id="psStatus" aria-live="polite"></p>
 </div>
</div>`;
document.body.append(dialog);
const get=id=>document.getElementById(id);
const cutInput=get('psCut'),copiesInput=get('psCopies'),canvas=get('psCanvas'),canvasCtx=canvas.getContext('2d');
let mode='single',page=0,queue=[],nextId=1,previewCache=new Map(),busy=false;
const MAX_DESIGNS=30,MAX_BUTTONS=120,MAX_JSON_BYTES=20000000;
const cleanName=s=>String(s||'Student design').replace(/\.[^.]+$/,'').slice(0,70);
function note(s){get('psStatus').textContent=s}
function total(){return queue.reduce((n,item)=>n+item.qty,0)}
function pageCount(){return Math.max(1,Math.ceil((mode==='single'?+copiesInput.value:total())/sheetLayout(+cutInput.value).count))}
function updatePager(){let pages=pageCount();page=Math.min(page,pages-1);get('psPage').textContent='Page '+(page+1)+' of '+pages;get('psPrevious').disabled=page===0;get('psNext').disabled=page===pages-1}
function setMode(to){mode=to;page=0;get('psSingle').hidden=to!=='single';get('psMixed').hidden=to!=='mixed';get('psSingleTab').setAttribute('aria-selected',String(to==='single'));get('psMixedTab').setAttribute('aria-selected',String(to==='mixed'));preview()}
function editorValues(){const o={};for(const id of tracked){const el=$(id);o[id]=el.type==='checkbox'?el.checked:el.value}return o}
function projectFromCurrent(){return {values:editorValues(),layers:layers.map(l=>({data:l.data,x:l.x,y:l.y,size:l.size,name:l.name})),textLayout:JSON.parse(JSON.stringify(uxText)),markPosition:{...uxMark}}}
function cloneJson(p){return JSON.parse(JSON.stringify(p))}
function safeWarnings(){
 const errors=[],cut=+$('cutSize').value,f=(editor.width/2-2)*2.5/cut;
 const border=$('borderStyle').value!=='none',safe=border?.82:.91;
 for(let i=0;i<layers.length;i++){
  const l=layers[i];if(!l.im?.naturalWidth||!l.im?.naturalHeight)continue;
  const z=f*1.25*l.size/100,r=l.im.naturalWidth/l.im.naturalHeight,w=r>=1?z:z*r,h=r>=1?z/r:z;
  const x=(l.x-.5)*f*1.35,y=(l.y-.5)*f*1.35;
  const far=Math.hypot(Math.abs(x)+w/2,Math.abs(y)+h/2)/f;
  if(far>safe)errors.push('Picture '+(i+1)+' may overlap the border or wrap onto the back. Reduce its size or move it inward.')
 }
 if($('centerLogoChoice').value!=='none'&&+$('centerSize').value>=88&&!$('centerText').value.trim())errors.push('The center graphic is large. Check its clearance from the text and border.');
 if($('headline').value.length>23||$('subline').value.length>23)errors.push('Long curved text may print small. Shorter text is easier to read on a 2.5-inch button.');
 if(+cutInput.value===2.5)errors.push('2.5-inch cutting circles leave no paper to wrap. Confirm your button press supports this.');
 return errors
}
function paintWarnings(){
 const warnings=safeWarnings(),el=get('psWarnings');el.replaceChildren();
 if(!warnings.length){const p=document.createElement('p');p.className='ps-good';p.textContent='✓ No obvious safe-area issues detected. Verify a physical print before production.';el.append(p)}
 else for(const warning of warnings){const p=document.createElement('p');p.className='ps-warning';p.textContent='⚠ '+warning;el.append(p)}
}
function withProject(project,fn){
 const saved={values:editorValues(),layers,uxText,uxMark};
 try{
  for(const [id,v] of Object.entries(project.values||{})){if(!tracked.includes(id))continue;const el=$(id);if(el){if(el.type==='checkbox')el.checked=!!v;else el.value=String(v)}}
  layers=project.preparedLayers||[];
  uxText=project.textLayout||defaultTextLayout();uxMark=project.markPosition||{x:.5,y:.5};
  return fn()
 }finally{
  for(const [id,v] of Object.entries(saved.values)){const el=$(id);if(el){if(el.type==='checkbox')el.checked=v;else el.value=v}}
  layers=saved.layers;uxText=saved.uxText;uxMark=saved.uxMark
 }
}
function makeTile(item,cut,size){
 const key=item.id+'|'+cut+'|'+size;
 if(previewCache.has(key))return previewCache.get(key);
 const c=document.createElement('canvas');c.width=c.height=size;const cc=c.getContext('2d');
 if(item.kind==='png'){
  cc.save();cc.beginPath();cc.arc(size/2,size/2,size/2-2,0,Math.PI*2);cc.clip();
  cc.drawImage(item.im,0,0,size,size);cc.restore()
 }else withProject(item.project,()=>drawButton(cc,size,{cut}));
 previewCache.set(key,c);return c
}
function drawMixed(ctx,w,h,items,offset,count,hires=false){
 const cut=+cutInput.value,ly=sheetLayout(cut);
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
 const dia=cut/8.5*w,detail=hires?900:520;
 for(let i=0;i<count;i++){
  const col=i%ly.cols,row=Math.floor(i/ly.cols),x=(ly.hgap+col*(cut+ly.hgap))/8.5*w,y=(ly.vgap+row*(cut+ly.vgap))/11*h;
  const tile=makeTile(items[offset+i],cut,detail);
  ctx.drawImage(tile,x,y,dia,dia);
  ctx.strokeStyle='#495465';ctx.lineWidth=hires?2:1;ctx.beginPath();ctx.arc(x+dia/2,y+dia/2,dia/2,0,Math.PI*2);ctx.stroke()
 }
 return ly
}
function sequence(){
 const out=[];for(const item of queue)for(let j=0;j<item.qty;j++)out.push(item);return out
}
function preview(){
 updatePager();paintWarnings();
 canvasCtx.fillStyle='#fff';canvasCtx.fillRect(0,0,canvas.width,canvas.height);
 if(mode==='single'){
  const ly=sheetLayout(+cutInput.value),offset=page*ly.count,copies=+copiesInput.value;
  drawSheet(canvasCtx,canvas.width,canvas.height,false,Math.max(0,Math.min(ly.count,copies-offset)));
 }else {
  const items=sequence(),ly=sheetLayout(+cutInput.value),offset=page*ly.count;
  if(items.length)drawMixed(canvasCtx,canvas.width,canvas.height,items,offset,Math.min(ly.count,items.length-offset))
 }
 const n=mode==='single'?+copiesInput.value:total(),pageNo=page+1;
 note((n||0)+' buttons · '+pageCount()+' sheet(s) · '+cutInput.value+'-inch cut circles'+(mode==='mixed'?' · showing page '+pageNo:''))
}
function labelRow(item){
 const row=document.createElement('div');row.className='ps-queue-row';row.dataset.id=String(item.id);
 const name=document.createElement('div');name.className='ps-queue-name';name.textContent=item.name;
 const tag=document.createElement('small');tag.textContent=item.kind==='png'?'PNG · verify cut sizing':'Editable project';
 const info=document.createElement('div');info.className='ps-queue-info';info.append(name,tag);
 const qty=document.createElement('input');qty.type='number';qty.min='1';qty.max='48';qty.value=String(item.qty);qty.dataset.action='qty';qty.setAttribute('aria-label','Number of buttons for '+item.name);
 const up=document.createElement('button');up.type='button';up.textContent='↑';up.dataset.action='up';up.title='Move earlier';up.setAttribute('aria-label','Move '+item.name+' earlier');
 const down=document.createElement('button');down.type='button';down.textContent='↓';down.dataset.action='down';down.title='Move later';down.setAttribute('aria-label','Move '+item.name+' later');
 const remove=document.createElement('button');remove.type='button';remove.textContent='✕';remove.dataset.action='remove';remove.title='Remove design';remove.setAttribute('aria-label','Remove '+item.name);
 row.append(info,qty,up,down,remove);return row
}
function refreshQueue(){
 const el=get('psQueue');el.replaceChildren();for(const item of queue)el.append(labelRow(item));
 get('psQueueCount').textContent=total()+' buttons';get('psDownloadMixed').disabled=!queue.length||busy;
 previewCache.clear();preview()
}
async function decode(src){
 return await new Promise((resolve,reject)=>{
  const im=new Image();im.onload=()=>im.naturalWidth&&im.naturalHeight?resolve(im):reject(Error('Invalid image dimensions'));im.onerror=()=>reject(Error('Image could not be decoded'));im.src=src
 })
}
function validateProject(raw){
 if(!raw||typeof raw!=='object'||!raw.values||typeof raw.values!=='object')throw Error('Not a Button Studio project JSON');
 if(raw.layers&&!Array.isArray(raw.layers))throw Error('Invalid image layers');
 if((raw.layers||[]).length>12)throw Error('Project contains too many images');
 for(const [key,value] of Object.entries(raw.values)){if(!tracked.includes(key))continue;if(typeof value!=='boolean'&&typeof value!=='string'&&typeof value!=='number')throw Error('Invalid project control')}
 return raw
}
async function prepare(raw){
 const input=validateProject(raw),preparedLayers=[];
 for(const l of input.layers||[]){
  if(typeof l.data!=='string'||!/^data:image\/(png|jpeg|webp|avif);base64,/.test(l.data)||l.data.length>12000000)throw Error('Unsupported or oversized embedded artwork');
  const im=await decode(l.data);
  if(im.naturalWidth*im.naturalHeight>25000000)throw Error('Embedded image is too large');
  preparedLayers.push({im,data:l.data,x:Math.max(0,Math.min(1,Number(l.x)||.5)),y:Math.max(0,Math.min(1,Number(l.y)||.5)),size:Math.max(15,Math.min(100,Number(l.size)||52)),name:String(l.name||'Image').slice(0,60)})
 }
 const safeValues={};
 for(const id of tracked){const el=$(id);safeValues[id]=el.type==='checkbox'?el.checked:el.value}
 for(const [k,v] of Object.entries(input.values)){if(tracked.includes(k))safeValues[k]=v}
 const clamp=(n,a,b,fallback)=>Number.isFinite(Number(n))?Math.max(a,Math.min(b,Number(n))):fallback;
 const tl=input.textLayout||{},mark=input.markPosition||{};
 return {values:safeValues,preparedLayers,textLayout:{
  top:{radius:clamp(tl.top?.radius,.6,.78,.73),angle:clamp(tl.top?.angle,-.16,.16,0)},
  bottom:{radius:clamp(tl.bottom?.radius,.6,.78,.73),angle:clamp(tl.bottom?.angle,-.16,.16,0)},
  middle:{x:clamp(tl.middle?.x,.14,.86,.5),y:clamp(tl.middle?.y,.15,.9,.84)}
 },markPosition:{x:clamp(mark.x,.12,.88,.5),y:clamp(mark.y,.12,.88,.5)}}
}
async function addCurrent(){
 if(queue.length>=MAX_DESIGNS){note('Maximum '+MAX_DESIGNS+' designs per sheet collection.');return}
 if(layers.some(l=>!l.im.complete||!l.im.naturalWidth)){note('Wait for your image to finish loading.');return}
 const project=await prepare(cloneJson(projectFromCurrent()));
 queue.push({id:nextId++,name:'My button '+(queue.length+1),kind:'json',qty:1,project});refreshQueue()
}
async function importFiles(files){
 let accepted=0,problems=[];busy=true;get('psDownloadMixed').disabled=true;
 for(const file of Array.from(files||[])){
  if(queue.length>=MAX_DESIGNS){problems.push('Limit reached: '+MAX_DESIGNS+' designs');break}
  if(file.size>MAX_JSON_BYTES||!file.size){problems.push(file.name+': too large or empty');continue}
  try{
   if(file.name.toLowerCase().endsWith('.json')||file.type==='application/json'){
    const data=JSON.parse(await file.text()),project=await prepare(data);
    queue.push({id:nextId++,kind:'json',name:cleanName(file.name),qty:1,project})
   }else if(file.type==='image/png'||file.name.toLowerCase().endsWith('.png')){
    const src=await new Promise((resolve,reject)=>{
     const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read image'));reader.readAsDataURL(file)
    });
    const im=await decode(src);if(im.naturalWidth<500||im.naturalHeight<500)throw Error('PNG should be at least 500 × 500 pixels');
    queue.push({id:nextId++,kind:'png',name:cleanName(file.name),qty:1,im})
   }else throw Error('Use .json or .png');
   accepted++
  }catch(err){problems.push(file.name+': '+err.message)}
 }
 busy=false;
 get('psImportMessage').textContent=accepted+' design(s) added.'+(problems.length?' '+problems.join('; ').slice(0,380):'');
 refreshQueue()
}
function jpegFromCanvas(c){
 const raw=atob(c.toDataURL('image/jpeg',.92).split(',')[1]),bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return {bytes,w:c.width,h:c.height}
}
async function exportPdf(mixed){
 if(busy)return;busy=true;
 const btn=get(mixed?'psDownloadMixed':'psDownloadSingle');btn.disabled=true;
 const original=btn.textContent;btn.textContent='Building PDF…';
 try{
  const ly=sheetLayout(+cutInput.value),items=mixed?sequence():[],num=mixed?items.length:+copiesInput.value;
  if(!num)throw Error('Add at least one design');
  if(num>MAX_BUTTONS)throw Error('Limit: '+MAX_BUTTONS+' buttons per PDF');
  if(!mixed&&layers.some(l=>!l.im.complete||!l.im.naturalWidth))throw Error('A picture is still loading');
  const pages=Math.ceil(num/ly.count),jpegs=[];
  for(let p=0;p<pages;p++){
   const c=document.createElement('canvas');c.width=1700;c.height=2200;
   const count=Math.min(ly.count,num-p*ly.count);
   if(mixed)drawMixed(c.getContext('2d'),c.width,c.height,items,p*ly.count,count,true);
   else drawSheet(c.getContext('2d'),c.width,c.height,true,count);
   jpegs.push(jpegFromCanvas(c))
  }
  const blob=pdfFromJpegs(jpegs),url=URL.createObjectURL(blob);
  downloadUrl(url,mixed?'fenton-classroom-button-sheet.pdf':'fenton-button-print-sheet.pdf');
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  note('PDF created: '+num+' buttons, '+pages+' page(s). Print at Actual Size / 100%.');
 }catch(err){note('Could not create PDF: '+err.message)}
 finally{busy=false;btn.disabled=mixed?!queue.length:false;btn.textContent=original}
}
get('psSingleTab').onclick=()=>setMode('single');
get('psMixedTab').onclick=()=>setMode('mixed');
get('psClose').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
get('psCut').onchange=()=>{page=0;const v=cutInput.value;$('cutSize').value=v;$('cutSize').dispatchEvent(new Event('input',{bubbles:true}));previewCache.clear();preview()};
get('psCopies').onchange=()=>{page=0;$('copies').value=copiesInput.value;$('copies').dispatchEvent(new Event('input',{bubbles:true}));preview()};
get('psPrevious').onclick=()=>{page=Math.max(0,page-1);preview()};
get('psNext').onclick=()=>{page=Math.min(pageCount()-1,page+1);preview()};
get('psDownloadSingle').onclick=()=>exportPdf(false);
get('psDownloadMixed').onclick=()=>exportPdf(true);
get('psAddCurrent').onclick=()=>addCurrent().catch(e=>note('Could not add current design: '+e.message));
get('psUploadProjects').onchange=e=>{const files=e.target.files;e.target.value='';importFiles(files)};
get('psQueue').addEventListener('change',e=>{
 if(e.target.dataset.action!=='qty')return;
 const row=e.target.closest('[data-id]'),item=queue.find(q=>q.id===Number(row?.dataset.id));if(!item)return;
 const requested=Math.max(1,Math.min(48,Math.round(Number(e.target.value)||1)));
 if(total()-item.qty+requested>MAX_BUTTONS){note('A classroom sheet is limited to '+MAX_BUTTONS+' buttons.');e.target.value=item.qty;return}
 item.qty=requested;refreshQueue()
});
get('psQueue').addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b)return;
 const row=b.closest('[data-id]'),index=queue.findIndex(q=>q.id===Number(row?.dataset.id));if(index<0)return;
 if(b.dataset.action==='remove')queue.splice(index,1);
 if(b.dataset.action==='up'&&index>0)[queue[index-1],queue[index]]=[queue[index],queue[index-1]];
 if(b.dataset.action==='down'&&index<queue.length-1)[queue[index+1],queue[index]]=[queue[index],queue[index+1]];
 refreshQueue()
});
function open(){cutInput.value=$('cutSize').value;copiesInput.value=$('copies').value;setMode(mode);dialog.showModal();preview()}
openButton.onclick=open;
const toolbar=document.querySelector('.studio-toolbar');
if(toolbar){const b=document.createElement('button');b.type='button';b.className='studio-tool';b.textContent='🖨 Print Studio';b.onclick=open;toolbar.append(b)}
// Autosave is local only. Do not clobber a previous saved session until the student acts.
const AUTOSAVE_KEY='fentonButtonAutosaveV3';
let previous=null,autosaveReady=false,timer=null,reportedFull=false;
try{previous=localStorage.getItem(AUTOSAVE_KEY)}catch{}
if(previous){
 get('psRecovery').hidden=false;
 const recovery=document.createElement('div');recovery.className='ps-recovery-banner';
 recovery.id='psRecoveryBanner';
 recovery.innerHTML='<span>Earlier button design found on this device.</span><button type="button">Restore</button><button type="button">Dismiss</button>';
 document.querySelector('.previewPanel')?.prepend(recovery);
 const restore=()=>{try{restoreProject(JSON.parse(previous));autosaveReady=true;get('psRecovery').hidden=true;recovery.remove();setMessage('Earlier design restored.')}catch{setMessage('Could not restore earlier design.')}}
 const discard=()=>{try{localStorage.removeItem(AUTOSAVE_KEY)}catch{};previous=null;autosaveReady=true;get('psRecovery').hidden=true;recovery.remove()};
 recovery.querySelectorAll('button')[0].onclick=restore;
 recovery.querySelectorAll('button')[1].onclick=discard;
 get('psRestore').onclick=restore;get('psDiscard').onclick=discard
}else autosaveReady=true;
function autosave(){
 if(!autosaveReady)return;try{
  const raw=JSON.stringify(projectFromCurrent());
  if(raw.length>3500000)throw Error('Design exceeds local autosave limit');
  localStorage.setItem(AUTOSAVE_KEY,raw);reportedFull=false
 }catch{if(!reportedFull){setMessage('Autosave unavailable; download an editable project to protect your work.');reportedFull=true}}
}
function schedule(){if(!autosaveReady)return;clearTimeout(timer);timer=setTimeout(autosave,900)}
document.addEventListener('input',e=>{if(e.target.closest('.app'))schedule()});
document.addEventListener('pointerup',e=>{if(e.target===editor)schedule()});
const priorRender=render;
render=function(){priorRender();if(dialog.open&&mode==='single')paintWarnings();schedule()};
})();

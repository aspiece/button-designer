/* Phase 1: Student-friendly, direct-manipulation editor. No external dependencies. */
(() => {
 'use strict';
 const left=document.querySelector('.app > section.panel:first-child');
 const previewPanel=document.querySelector('.previewPanel');
 if(!left||!previewPanel||!window.HTMLCanvasElement)return;
 const heading=left.querySelector('h2');
 heading.textContent='1 · Start with a design';
 heading.classList.add('studio-panel-title');
 const existing=Array.from(left.children).filter(n=>n!==heading);
 const gallery=document.createElement('section');gallery.className='template-section';
 gallery.setAttribute('aria-label','Starting button templates');
 gallery.innerHTML='<h3>Choose a template</h3><div class="template-grid" id="templateGrid"></div>';
 const quick=document.createElement('section');quick.className='quick-panel';quick.id='quickPanel';
 quick.setAttribute('aria-live','off');
 const advanced=document.createElement('details');advanced.id='advancedTools';
 const sum=document.createElement('summary');sum.textContent='All design settings · advanced';advanced.append(sum);
 existing.forEach(n=>advanced.append(n));
 left.append(gallery,quick,advanced);
 const thumbs={
 paw:['#f58220','#111111','paw'],tiger:['#111111','#f58220','paw'],
 titanium:['#111111','#ffffff','T'],blank:['#ffffff','#111111',''],orange:['#f58220','#111111',''],black:['#111111','#ffffff','']
 };
 const templates=[
 ['paw','Tiger Paw','Orange & black'],['tiger','Tiger Spirit','Black & orange'],
 ['titanium','Titanium Tigers','Black & white'],['blank','Blank','White canvas'],
 ['orange','Orange','Solid background'],['black','Black','Solid background']
 ];
 function thumb(bg,fg,mark){
  let figure=mark==='paw'?'<circle cx="30" cy="32" r="7"/><circle cx="45" cy="21" r="7"/><circle cx="62" cy="21" r="7"/><circle cx="77" cy="32" r="7"/><path d="M31 73 Q20 51 45 48 Q54 53 59 48 Q84 51 77 73 Q65 83 54 76 Q43 83 31 73Z"/>':
    mark==='T'?'<text x="54" y="74" font-size="57" font-family="Arial" font-weight="900" text-anchor="middle">T</text>':'';
  return '<span class="template-thumb"><svg viewBox="0 0 108 108" aria-hidden="true"><circle cx="54" cy="54" r="53" fill="'+bg+'"/><circle cx="54" cy="54" r="45" fill="none" stroke="'+fg+'" stroke-width="3"/><g fill="'+fg+'">'+figure+'</g></svg></span>';
 }
 const grid=gallery.querySelector('#templateGrid');
 templates.forEach(item=>{
  const b=document.createElement('button');b.type='button';b.className='template-card';b.dataset.template=item[0];
  b.setAttribute('aria-pressed','false');
  const t=thumb(...thumbs[item[0]]);
  b.innerHTML=t+'<span>'+item[1]+'</span><small>'+item[2]+'</small>';
  grid.append(b)
 });
 function syncGallery(){
  grid.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.template===$('theme').value)))
 }
 const title=previewPanel.querySelector('h2');if(title)title.textContent='2 · Design on the canvas';
 const tools=document.createElement('div');tools.className='studio-toolbar';
 tools.innerHTML='<button type="button" class="studio-tool" id="uxUndo" disabled title="Undo (Ctrl+Z)">↶ Undo</button><button type="button" class="studio-tool" id="uxRedo" disabled title="Redo (Ctrl+Y)">↷ Redo</button><span id="selectedName">Tap text or a picture to edit it</span>';
 previewPanel.insertBefore(tools,previewPanel.querySelector('.canvasWrap'));
 editor.tabIndex=0;editor.setAttribute('role','img');
 editor.setAttribute('aria-label','Editable circular button. Tap text or a logo to select and drag. Use the selected element controls to resize.');
 const help=document.createElement('p');help.className='studio-canvas-hint';
 help.textContent='Tap to select. Drag to move. Drag the orange handle to resize. Preview guides are not printed.';
 previewPanel.querySelector('.canvasWrap').after(help);
 const selectedLabel=$('selectedName'),undoBtn=$('uxUndo'),redoBtn=$('uxRedo');
 let selected=null,draggingObject=null,gesture=false,formFocus=false,restoring=false;
 let snapGuideX=false,snapGuideY=false;
 function snapCenter(v,axis){let close=Math.abs(v-.5)<.027;if(axis==='x')snapGuideX=close;else snapGuideY=close;return close?.5:v}
 let past=[],future=[],current=null;const MAX_HISTORY=35;
 function capture(){
  const values={};tracked.forEach(id=>{const el=$(id);values[id]=el.type==='checkbox'?el.checked:el.value});
  return {values,layers:layers.map(l=>({...l})),uxText:JSON.parse(JSON.stringify(uxText)),uxMark:{...uxMark}}
 }
 function equal(a,b){
  if(!a||!b)return false;
  for(const key in a.values)if(a.values[key]!==b.values[key])return false;
  if(JSON.stringify(a.uxText)!==JSON.stringify(b.uxText)||a.uxMark.x!==b.uxMark.x||a.uxMark.y!==b.uxMark.y)return false;
  if(a.layers.length!==b.layers.length)return false;
  for(let i=0;i<a.layers.length;i++){
   const x=a.layers[i],y=b.layers[i];
   if(x.data!==y.data||x.x!==y.x||x.y!==y.y||x.size!==y.size||x.name!==y.name)return false
  }return true
 }
 function historyButtons(){undoBtn.disabled=!past.length;redoBtn.disabled=!future.length}
 function commit(){
  if(restoring)return;
  const now=capture();
  if(!equal(current,now)){if(current){past.push(current);if(past.length>MAX_HISTORY)past.shift()}current=now;future=[]}
  historyButtons()
 }
 function restoreSnapshot(s){
  if(!s)return;
  restoring=true;
  Object.entries(s.values).forEach(([id,value])=>{const el=$(id);if(el){if(el.type==='checkbox')el.checked=value;else el.value=value}});
  layers=s.layers.map(l=>({...l}));selectedLayer=layers.length?Math.min(Math.max(selectedLayer,0),layers.length-1):-1;
  image=selectedLayer>=0?layers[selectedLayer].im:null;imageData=selectedLayer>=0?layers[selectedLayer].data:'';
  uxText=JSON.parse(JSON.stringify(s.uxText));uxMark={...s.uxMark};
  if(selected&&selected.kind==='image'&&selected.index>=layers.length)selected=null;
  syncLayerUI();syncGallery();refreshContext();render();
  restoring=false;current=capture();historyButtons()
 }
 function undo(){
  if(gesture)return;commit();if(!past.length)return;
  future.push(current);restoreSnapshot(past.pop());setMessage('Undo complete.')
 }
 function redo(){
  if(gesture)return;if(!future.length)return;
  past.push(current);restoreSnapshot(future.pop());setMessage('Redo complete.')
 }
 undoBtn.onclick=undo;redoBtn.onclick=redo;
 function startGesture(){commit();gesture=true}
 function finishGesture(){if(!gesture)return;gesture=false;commit()}
 function setControl(id,value){
  const node=$(id);if(!node)return;node.value=String(value);
  node.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function newSelection(kind,index){
  const next=kind?{kind,index:index??null}:null;
  if(selected&&next&&selected.kind===next.kind&&selected.index===next.index)return;
  selected=next;
  if(kind==='image'&&index>=0){
    selectedLayer=index;image=layers[index].im;imageData=layers[index].data;syncLayerUI()
  }
  refreshContext();render()
 }
 function desc(){
  if(!selected)return 'Tap text or a picture to edit it';
  if(selected.kind==='image')return layers[selected.index]?.name||'Image';
  return {top:'Top curved text',bottom:'Bottom curved text',middle:'Center text',mark:'Center logo',background:'Background & border'}[selected.kind]||'Design element'
 }
 function quickInput(id,label,type,value,min,max){
  const range=type==='range'?' min="'+min+'" max="'+max+'" step="1"':'';
  return '<div class="quick-field"><label for="'+id+'">'+label+'</label><input id="'+id+'" type="'+type+'" value="'+String(value).replace(/"/g,'&quot;')+'"'+range+'></div>'
 }
 function refreshContext(){
  selectedLabel.textContent=desc();
  if(!selected){
   quick.innerHTML='<h3>3 · Edit your selection</h3><p>Tap the top text, bottom text, center logo, or an uploaded image on the button. The right tools appear here. For other controls open <strong>All design settings</strong>.</p><div class="quick-actions"><button type="button" data-quick="addText">Add center text</button><button type="button" data-quick="addImage">Upload picture</button></div>';
   return
  }
  const kind=selected.kind;
  let body='<h3>3 · '+desc()+'</h3>';
  if(kind==='top'||kind==='bottom'||kind==='middle'){
   const field=kind==='top'?'headline':kind==='bottom'?'subline':'centerText';
   const size=kind==='top'?'topSize':kind==='bottom'?'bottomSize':'middleSize';
   body+=quickInput('quickText','Words','text',$(field).value);
   body+=quickInput('quickTextSize','Text size ('+$(size).value+')','range',$(size).value,kind==='middle'?20:kind==='top'?20:16,kind==='middle'?72:kind==='top'?56:48);
   if(kind!=='middle')body+='<p>Drag the curved letters to reposition the ring text safely. Text stays upright for printing.</p><div class="quick-actions"><button type="button" data-quick="resetArc">Reset text position</button><button type="button" data-quick="clearText">Remove text</button></div>';
   else body+='<p>Drag the text itself to move it. Drag its orange corner handle to resize.</p><div class="quick-actions"><button type="button" data-quick="centerMiddle">Center text</button><button type="button" data-quick="clearText">Remove text</button></div>';
  }else if(kind==='image'){
   const l=layers[selected.index];if(!l){selected=null;refreshContext();return}
   body+='<p>'+l.name.replace(/</g,'&lt;')+'</p>'+quickInput('quickImageSize','Picture size ('+l.size+'%)','range',l.size,15,100);
   body+='<div class="quick-actions"><button type="button" data-quick="centerImage">Center</button><button type="button" data-quick="cropImage">Crop</button><button type="button" data-quick="forwardImage">Bring forward</button><button type="button" data-quick="backImage">Send backward</button><button type="button" class="danger" data-quick="deleteImage">Remove image</button></div>';
  }else if(kind==='mark'){
   body+='<div class="quick-field"><label for="quickMark">Center logo</label><select id="quickMark"><option value="none">Blank</option><option value="f">Fenton F</option><option value="paw">Tiger Paw</option><option value="t">Titanium T</option></select></div>';
   body+=quickInput('quickMarkSize','Logo size ('+$('centerSize').value+'%)','range',$('centerSize').value,15,95);
   body+='<p>Drag the logo to move it. Use the orange handle to resize.</p><div class="quick-actions"><button type="button" data-quick="centerMark">Center logo</button></div>';
  }else{
   body+='<div class="quick-field"><label for="quickBackground">Background color</label><input id="quickBackground" type="color" value="'+$('bgColor').value+'"></div>';
   body+='<div class="quick-field"><label for="quickBorder">Border color</label><select id="quickBorder"><option value="#111111">Black</option><option value="#ffffff">White</option><option value="#f58220">Orange</option></select></div>';
   body+='<div class="quick-field"><label for="quickBorderStyle">Border style</label><select id="quickBorderStyle"><option value="double">Double</option><option value="solid">Single</option><option value="dashed">Dashed</option><option value="none">None</option></select></div>';
   body+='<div class="quick-actions"><button type="button" data-quick="addText">Add text</button><button type="button" data-quick="addImage">Add image</button></div>';
  }
  quick.innerHTML=body;
  if(kind==='mark')$('quickMark').value=$('centerLogoChoice').value;
  if(kind==='background'){$('quickBorder').value=$('borderColor').value;$('quickBorderStyle').value=$('borderStyle').value}
 }
 quick.addEventListener('input',e=>{
  if(!selected)return;
  const id=e.target.id,k=selected.kind;
  if(id==='quickText'){setControl(k==='top'?'headline':k==='bottom'?'subline':'centerText',e.target.value)}
  if(id==='quickTextSize'){setControl(k==='top'?'topSize':k==='bottom'?'bottomSize':'middleSize',e.target.value)}
  if(id==='quickImageSize'&&k==='image'){const l=layers[selected.index];if(l){l.size=+e.target.value;setControl('logoSize',l.size)}}
  if(id==='quickMark'){setControl('centerLogoChoice',e.target.value)}
  if(id==='quickMarkSize'){setControl('centerSize',e.target.value)}
  if(id==='quickBackground'){setControl('bgColor',e.target.value)}
  if(id==='quickBorder'){setControl('borderColor',e.target.value)}
  if(id==='quickBorderStyle'){setControl('borderStyle',e.target.value)}
 });
 quick.addEventListener('click',e=>{
  const b=e.target.closest('[data-quick]');if(!b)return;
  const action=b.dataset.quick;commit();
  const k=selected?.kind,idx=selected?.index;
  if(action==='addText'){setControl('centerText','YOUR TEXT');newSelection('middle')}
  if(action==='addImage')$('logo').click();
  if(action==='clearText'&&k){setControl(k==='top'?'headline':k==='bottom'?'subline':'centerText','');newSelection('background')}
  if(action==='resetArc'&&(k==='top'||k==='bottom')){uxText[k]={radius:.73,angle:0};render()}
  if(action==='centerMiddle'){uxText.middle={x:.5,y:.84};render()}
  if(action==='centerMark'){uxMark={x:.5,y:.5};render()}
  if(action==='centerImage'&&idx>=0){layers[idx].x=layers[idx].y=.5;render()}
  if(action==='cropImage'&&idx>=0){selectedLayer=idx;image=layers[idx].im;imageData=layers[idx].data;$('cropLogo').click()}
  if(action==='deleteImage'&&idx>=0){layers.splice(idx,1);selectedLayer=layers.length-1;image=layers[selectedLayer]?.im||null;imageData=layers[selectedLayer]?.data||'';syncLayerUI();newSelection(null)}
  if((action==='forwardImage'||action==='backImage')&&idx>=0){
   const to=idx+(action==='forwardImage'?1:-1);
   if(to>=0&&to<layers.length){const tmp=layers[idx];layers[idx]=layers[to];layers[to]=tmp;selected.index=to;selectedLayer=to;syncLayerUI();refreshContext();render()}
  }commit()
 });
 grid.addEventListener('click',e=>{
  const b=e.target.closest('[data-template]');if(!b)return;
  finishGesture();commit();setControl('theme',b.dataset.template);
  syncGallery();newSelection(null);commit()
 });
 // Context coordinates in canvas native pixels; rendering uses the same units.
 function metrics(){const m=editor.width/2,f=(m-2)*2.5/(+$('cutSize').value);return {m,f}}
 function imageRect(i){
  const l=layers[i];if(!l||!l.im.naturalWidth)return null;
  const {m,f}=metrics(),z=f*1.25*l.size/100,ratio=l.im.naturalWidth/l.im.naturalHeight;
  const w=ratio>=1?z:z*ratio,h=ratio>=1?z/ratio:z;
  return {cx:m+(l.x-.5)*f*1.35,cy:m+(l.y-.5)*f*1.35,w,h}
 }
 function middleRect(){
  const t=$('centerText').value.trim();if(!t)return null;
  const {m,f}=metrics(),px=+ $('middleSize').value,c=ctx;
  c.save();c.font='900 '+(Math.min(72,px)*editor.width/800)+'px '+$('font').value;
  const width=Math.min(f*1.12,c.measureText(t).width+12);c.restore();
  return {cx:m+(uxText.middle.x-.5)*f*1.35,cy:m+(uxText.middle.y-.5)*f*1.35,w:Math.max(45,width),h:Math.max(35,px*editor.width/800*1.3)}
 }
 function markRect(){
  const {m,f}=metrics(),size=+$('centerSize').value;
  const z=f*Math.min($('centerText').value.trim()?42:size,size)/100;
  return {cx:m+(uxMark.x-.5)*f*1.35,cy:m+(uxMark.y-.5)*f*1.35-($('centerText').value.trim()?f*.12:0),w:z*1.9,h:z*1.9}
 }
 function getRect(){if(!selected)return null;if(selected.kind==='image')return imageRect(selected.index);if(selected.kind==='middle')return middleRect();if(selected.kind==='mark')return markRect();return null}
 function point(e){const r=editor.getBoundingClientRect(),scale=editor.width/r.width;return{x:(e.clientX-r.left)*scale,y:(e.clientY-r.top)*scale}}
 function near(p,x,y,r=18){return Math.hypot(p.x-x,p.y-y)<r}
 function getHit(p){
  const rect=getRect();
  if(rect&&near(p,rect.cx+rect.w/2,rect.cy+rect.h/2,22))return {...selected,mode:'resize'};
  if(selected&&(selected.kind==='top'||selected.kind==='bottom')){
   const {m,f}=metrics(),v=uxText[selected.kind],angle=.52+v.angle;
   const hx=m+Math.sin(angle)*f*v.radius,hy=m+(selected.kind==='top'?-1:1)*Math.cos(angle)*f*v.radius;
   if(near(p,hx,hy,24))return {...selected,mode:'resize'}
  }
  for(let i=layers.length-1;i>=0;i--){
   const r=imageRect(i);if(r&&Math.abs(p.x-r.cx)<r.w/2+8&&Math.abs(p.y-r.cy)<r.h/2+8)return {kind:'image',index:i,mode:'move'}
  }
  const mid=middleRect();if(mid&&Math.abs(p.x-mid.cx)<mid.w/2+10&&Math.abs(p.y-mid.cy)<mid.h/2+9)return {kind:'middle',mode:'move'};
  const {m,f}=metrics(),dx=p.x-m,dy=p.y-m,dist=Math.hypot(dx,dy);
  if(dist<=f*.9&&dist>=f*.57&&p.y<m&&$('headline').value.trim())return {kind:'top',mode:'move'};
  if(dist<=f*.9&&dist>=f*.57&&p.y>m&&$('subline').value.trim())return {kind:'bottom',mode:'move'};
  const mark=markRect();if($('centerLogoChoice').value!=='none'&&Math.abs(p.x-mark.cx)<mark.w/2+9&&Math.abs(p.y-mark.cy)<mark.h/2+9)return {kind:'mark',mode:'move'};
  if(dist<f)return {kind:'background',mode:'none'};
  return null
 }
 function drawOverlay(){
  if(!selected||selected.kind==='background')return;
  const r=getRect();if(!r&&selected.kind!=='top'&&selected.kind!=='bottom')return;
  const {m,f}=metrics();ctx.save();
  if(snapGuideX||snapGuideY){ctx.save();ctx.setLineDash([7,6]);ctx.strokeStyle='#137b70';ctx.lineWidth=2;
   if(snapGuideX){ctx.beginPath();ctx.moveTo(m,m-f*.95);ctx.lineTo(m,m+f*.95);ctx.stroke()}
   if(snapGuideY){ctx.beginPath();ctx.moveTo(m-f*.95,m);ctx.lineTo(m+f*.95,m);ctx.stroke()}ctx.restore()}
  ctx.strokeStyle='#e66d08';ctx.fillStyle='#ffffff';ctx.lineWidth=3;
  ctx.setLineDash([9,6]);
  if(r){ctx.strokeRect(r.cx-r.w/2,r.cy-r.h/2,r.w,r.h)}
  else if(selected.kind==='top'||selected.kind==='bottom'){
   const d=uxText[selected.kind],sign=selected.kind==='top'?-1:1;
   ctx.beginPath();
   for(let k=0;k<=40;k++){
    const angle=-.56+d.angle+k*1.12/40,x=m+Math.sin(angle)*f*d.radius,y=m+sign*Math.cos(angle)*f*d.radius;
    if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)
   }ctx.stroke()
  }
  ctx.setLineDash([]);
  let hx,hy;
  if(r){hx=r.cx+r.w/2;hy=r.cy+r.h/2}
  else{const d=uxText[selected.kind],ang=.52+d.angle;hx=m+Math.sin(ang)*f*d.radius;hy=m+(selected.kind==='top'?-1:1)*Math.cos(ang)*f*d.radius}
  ctx.beginPath();ctx.arc(hx,hy,10,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e66d08';ctx.lineWidth=4;ctx.stroke();
  ctx.restore()
 }
 const oldRender=render;
 render=function(){
  oldRender();drawOverlay();
  if(!gesture&&!formFocus&&!restoring)commit();
  syncGallery()
 };
 const oldRestore=restoreProject;
 restoreProject=function(data){const before=capture();oldRestore(data);if(!equal(before,capture())){past.push(before);if(past.length>MAX_HISTORY)past.shift();current=capture();future=[];historyButtons()}};
 const oldReset=$('reset').onclick;
 $('reset').onclick=function(){commit();oldReset();newSelection(null);commit()};
 // Canvas selection and movement; handles are painted only on the editor, never the PDF.
 editor.addEventListener('pointerdown',e=>{
  const p=point(e),hit=getHit(p);
  if(!hit){newSelection(null);return}
  if(hit.kind==='background'){newSelection('background');return}
  newSelection(hit.kind,hit.index);
  const {m,f}=metrics(),origin=hit.kind==='image'?{...layers[hit.index]}:
    hit.kind==='mark'?{...uxMark}:
    hit.kind==='middle'?{...uxText.middle}:{...uxText[hit.kind]};
  startGesture();
  draggingObject={kind:hit.kind,index:hit.index,mode:hit.mode,point:p,origin,m,f};
  editor.classList.add('is-moving');editor.setPointerCapture(e.pointerId);e.preventDefault()
 });
 editor.addEventListener('pointermove',e=>{
  if(!draggingObject)return;
  const p=point(e),d=draggingObject,dx=p.x-d.point.x,dy=p.y-d.point.y;
  if(d.kind==='image'){
   const l=layers[d.index];if(!l)return;
   if(d.mode==='resize'){
    const r=imageRect(d.index),distance=Math.hypot(p.x-r.cx,p.y-r.cy);
    l.size=clamp(Math.round(distance*2/(d.f*1.25)*100),15,100);
    $('logoSize').value=l.size
   }else{
    l.x=snapCenter(clamp(d.origin.x+dx/(d.f*1.35),.08,.92),'x');
    l.y=snapCenter(clamp(d.origin.y+dy/(d.f*1.35),.08,.92),'y')
   }
  }else if(d.kind==='middle'){
   if(d.mode==='resize'){$('middleSize').value=clamp(Math.round(+$('middleSize').value+(dx+dy)*.08),20,72);d.point=p}
   else{
    uxText.middle.x=snapCenter(clamp(d.origin.x+dx/(d.f*1.35),.16,.84),'x');
    uxText.middle.y=snapCenter(clamp(d.origin.y+dy/(d.f*1.35),.17,.9),'y')
   }
  }else if(d.kind==='mark'){
   if(d.mode==='resize'){$('centerSize').value=clamp(Math.round(Math.hypot(p.x-(d.m+(uxMark.x-.5)*d.f*1.35),p.y-(d.m+(uxMark.y-.5)*d.f*1.35))/(d.f*.75)*100),15,95)}
   else{
    uxMark.x=snapCenter(clamp(d.origin.x+dx/(d.f*1.35),.15,.85),'x');
    uxMark.y=snapCenter(clamp(d.origin.y+dy/(d.f*1.35),.15,.85),'y')
   }
  }else if(d.kind==='top'||d.kind==='bottom'){
   if(d.mode==='resize'){
    const el=$(d.kind==='top'?'topSize':'bottomSize');
    el.value=clamp(Math.round(+el.value+dx*.15),+el.min,+el.max);d.point=p
   }else{
    const sign=d.kind==='top'?-1:1;
    const polar=(v)=>({radius:Math.hypot(v.x-d.m,v.y-d.m)/d.f,angle:Math.atan2(v.x-d.m,sign*(v.y-d.m))});
    const a=polar(d.point),b=polar(p);
    uxText[d.kind].radius=clamp(d.origin.radius+b.radius-a.radius,.61,.78);
    uxText[d.kind].angle=clamp(d.origin.angle+b.angle-a.angle,-.16,.16)
   }
  }
  render();e.preventDefault()
 });
 function stopDrag(){if(!draggingObject)return;draggingObject=null;snapGuideX=snapGuideY=false;editor.classList.remove('is-moving');finishGesture();refreshContext();render()}
 editor.addEventListener('pointerup',stopDrag);editor.addEventListener('pointercancel',stopDrag);
 editor.addEventListener('lostpointercapture',stopDrag);
 // The dropdown remains available in Advanced tools; selections stay in sync.
 $('imageLayer').addEventListener('change',()=>{
  const index=+$('imageLayer').value;
  if(Number.isInteger(index)&&index>=0&&index<layers.length)newSelection('image',index)
 });
 $('centerLogoChoice').addEventListener('change',()=>{if(selected?.kind==='mark')refreshContext()});
 document.addEventListener('focusin',e=>{
  if(e.target.closest('.quick-panel')||e.target.closest('#advancedTools')){
   if(e.target.matches('input:not([type=file]),select,textarea')){commit();formFocus=true}
  }
 });
 document.addEventListener('focusout',e=>{
  if(e.target.closest('.quick-panel')||e.target.closest('#advancedTools')){
   if(e.target.matches('input:not([type=file]),select,textarea')){
    formFocus=false;commit()
   }
  }
 });
 document.addEventListener('change',e=>{
  if(e.target.id==='theme')syncGallery();
  if(e.target.closest('.quick-panel')||e.target.closest('#advancedTools')){
   if(!gesture){formFocus=false;commit()}
  }
 });
 document.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,[contenteditable]'))return;
  const cmd=e.ctrlKey||e.metaKey;
  if(cmd&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo()}
  else if(cmd&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}
  else if((e.key==='Delete'||e.key==='Backspace')&&selected){
   e.preventDefault();commit();if(selected.kind==='image'){layers.splice(selected.index,1);selectedLayer=layers.length-1;image=layers[selectedLayer]?.im||null;imageData=layers[selectedLayer]?.data||'';syncLayerUI()}
   else if(selected.kind==='mark')setControl('centerLogoChoice','none');
   else if(selected.kind!=='background')setControl(selected.kind==='top'?'headline':selected.kind==='bottom'?'subline':'centerText','');
   newSelection(null);commit()
  }
 });
 // Select via keyboard even if the canvas has no mouse/touch input.
 editor.addEventListener('keydown',e=>{
  if(e.key==='Enter'){newSelection('background');e.preventDefault()}
 });
 // Keep image selection and undo snapshots current when images finish loading asynchronously.
 const oldSync=syncLayerUI;
 syncLayerUI=function(){oldSync();if(selected?.kind==='image'&&selected.index>=layers.length){selected=null;refreshContext()}if(!gesture&&!restoring&&!formFocus)commit();notifyPhase2()};
 const phase2Listeners=new Set();
 function notifyPhase2(){for(const cb of phase2Listeners){try{cb()}catch(e){console.error('Phase2 UI update error',e)}}}
 const priorRender=render;
 render=function(){priorRender();notifyPhase2()};
 window.ButtonStudioUX={
  onUpdate(fn){phase2Listeners.add(fn);fn();return ()=>phase2Listeners.delete(fn)},
  getState(){return {layers:layers.map((l,i)=>({index:i,name:l.name,data:l.data,size:l.size})),selected:selected?{...selected}:null}},
  selectImage(index){if(Number.isInteger(index)&&layers[index])newSelection('image',index)},
  addLogo(id){const select=$('teamLogo');if(!select||![...select.options].some(o=>o.value===id))return false;
   select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));return true},
  reorderImage(index,move){
   const to=index+move;if(!layers[index]||to<0||to>=layers.length)return false;
   commit();[layers[index],layers[to]]=[layers[to],layers[index]];
   selectedLayer=to;image=layers[to].im;imageData=layers[to].data;
   syncLayerUI();newSelection('image',to);commit();notifyPhase2();return true
  }
 };
 current=capture();historyButtons();syncGallery();refreshContext();render();
})();

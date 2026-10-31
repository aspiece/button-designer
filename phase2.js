/* Phase 2: Visual team logo library, layered artwork, and beginner/advanced mode. */
(() => {
 'use strict';
 const general=window.ButtonStudioEdition==='general';
 const api=window.ButtonStudioUX;
 if(!api)return;
 const left=document.querySelector('.app > section.panel:first-child');
 const gallery=left?.querySelector('.template-section');
 const quick=left?.querySelector('#quickPanel');
 const advanced=left?.querySelector('#advancedTools');
 if(!left||!gallery||!quick||!advanced)return;
 
 // Students begin with the essential controls. Advanced users opt in to detailed settings.
 const modes=document.createElement('div');modes.className='studio-modes';
 modes.setAttribute('role','group');modes.setAttribute('aria-label','Editor mode');
 modes.innerHTML='<button type="button" id="uxBeginner" aria-pressed="true">Beginner</button><button type="button" id="uxAdvanced" aria-pressed="false">Advanced</button>';
 left.insertBefore(modes,gallery);
 function setMode(advancedMode){
  advanced.hidden=!advancedMode;advanced.open=advancedMode;
  document.getElementById('uxBeginner').setAttribute('aria-pressed',String(!advancedMode));
  document.getElementById('uxAdvanced').setAttribute('aria-pressed',String(advancedMode));
 }
 modes.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;setMode(b.id==='uxAdvanced')
 });
 setMode(false);
 
 const groups=general?[]:[
  ['Fenton numbered teams',[
    ['tiger-paws-24471','Tiger Paws','24471'],['tiger-cubs-29168','Tiger Cubs','29168'],
    ['tiger-kits-31558','Tiger Kits','31558'],['tiger-claws-31575','Tiger Claws','31575'],
    ['tiger-eyes-31577','Tiger Eyes','31577'],['siberian-tigers-38050','Siberian Tigers','38050'],
    ['bengal-tigers-52545','Bengal Tigers','52545']]],
  ['Titanium Tigers teams',[
    ['tungsten-tigers','Tungsten Tigers',''],['chromium-tigers','Chromium Tigers',''],
    ['iridium-tigers','Iridium Tigers','']]]
 ];
 const library=document.createElement('section');library.className='studio-logo-library';
 library.setAttribute('aria-label',general?'Upload your own images':'Available Fenton robotics team logos');
 library.innerHTML=general?'<h3>Your artwork</h3><p>No preloaded team images. Upload a photo, logo, or illustration from your own device.</p><button type="button" class="studio-upload" id="uxUpload">+ Upload an image</button>':'<h3>Team logos</h3><p>Choose a team logo to add it to your button.</p><label for="uxLogoSearch">Search teams</label><input type="search" id="uxLogoSearch" placeholder="Team name or number" autocomplete="off"><div id="uxLogoGroups"></div><p id="uxLogoEmpty" hidden>No teams found. Try another search.</p><button type="button" class="studio-upload" id="uxUpload">+ Upload my own picture</button>';
 left.insertBefore(library,quick);
 const groupsContainer=library.querySelector('#uxLogoGroups');

 if(!general)for(const [heading,items] of groups){
  const group=document.createElement('div');group.className='studio-logo-group';
  const title=document.createElement('h4');title.textContent=heading;group.append(title);
  const grid=document.createElement('div');grid.className='studio-logo-grid';
  for(const [id,name,number] of items){
   const button=document.createElement('button');button.type='button';button.className='studio-logo-card';
   button.dataset.logo=id;button.dataset.search=(name+' '+number).toLowerCase();
   button.setAttribute('aria-label','Add '+name+(number?' team '+number:'')+' logo');
   const picture=document.createElement('img');picture.src='logos/'+id+'.png';picture.alt='';picture.loading='lazy';
   const text=document.createElement('span');text.textContent=name;
   const numberLabel=document.createElement('small');numberLabel.textContent=number||'Robotics';
   button.append(picture,text,numberLabel);grid.append(button)
  }group.append(grid);groupsContainer.append(group)
 }
 if(!general){
 document.getElementById('uxLogoSearch').addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();let total=0;
  groupsContainer.querySelectorAll('.studio-logo-group').forEach(group=>{
   let visible=0;
   group.querySelectorAll('.studio-logo-card').forEach(card=>{
    const match=card.dataset.search.includes(q);card.hidden=!match;if(match)visible++
   });group.hidden=visible===0;total+=visible
  });
  document.getElementById('uxLogoEmpty').hidden=total!==0
 });
 groupsContainer.addEventListener('click',e=>{
  const card=e.target.closest('button[data-logo]');if(!card)return;
  if(api.getState().layers.length>=12){document.getElementById('message').textContent='Maximum 12 images. Remove one before adding another.';return}
  api.addLogo(card.dataset.logo)
 });
 }
 document.getElementById('uxUpload').addEventListener('click',()=>document.getElementById('logo').click());
 
 const layersSection=document.createElement('section');layersSection.className='studio-layers';
 layersSection.innerHTML='<div class="studio-layers-head"><h3>Pictures on your button</h3><span id="uxLayerCount">0</span></div><p>Select a picture to move, resize, or change which one appears on top.</p><div class="studio-layer-list" id="uxLayersList"></div>';
 left.insertBefore(layersSection,advanced);
 const list=layersSection.querySelector('#uxLayersList');
 let lastSignature='';
 function refresh(){
  const state=api.getState();
  const signature=state.layers.map(l=>l.index+':'+l.name+':'+l.size+':'+l.data.length).join('|')+'|'+(state.selected?.kind||'')+':'+(state.selected?.index??'');
  if(signature===lastSignature)return;lastSignature=signature;
  document.getElementById('uxLayerCount').textContent=String(state.layers.length);
  list.replaceChildren();
  if(!state.layers.length){const p=document.createElement('p');p.className='studio-no-layers';p.textContent='No pictures yet. Add a team logo above or upload a picture.';list.append(p);return}
  for(let i=state.layers.length-1;i>=0;i--){
   const layer=state.layers[i],row=document.createElement('div');row.className='studio-layer-row';
   const choose=document.createElement('button');choose.type='button';choose.className='studio-layer-select';
   choose.dataset.action='select';choose.dataset.index=String(i);
   choose.setAttribute('aria-pressed',String(state.selected?.kind==='image'&&state.selected.index===i));
   const img=document.createElement('img');img.src=layer.data;img.alt='';
   const title=document.createElement('span');title.textContent=layer.name;choose.append(img,title);
   const controls=document.createElement('div');controls.className='studio-layer-arrows';
   for(const [action,label,title] of [['forward','↑','Bring forward'],['backward','↓','Send backward']]){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.title=title+' '+layer.name;button.setAttribute('aria-label',title+' '+layer.name);
    button.dataset.action=action;button.dataset.index=String(i);
    button.disabled=action==='forward'?i===state.layers.length-1:i===0;controls.append(button)
   }
   row.append(choose,controls);list.append(row)
  }
 }
 list.addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;
  const i=Number(b.dataset.index);const action=b.dataset.action;
  if(action==='select')api.selectImage(i);
  else api.reorderImage(i,action==='forward'?1:-1)
 });
 api.onUpdate(refresh);
})();

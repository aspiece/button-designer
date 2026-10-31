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
 
 const library=document.createElement('section');library.className='studio-logo-library';
 library.setAttribute('aria-label',general?'Upload your own images':'Approved Fenton robotics image gallery');
 library.innerHTML=general?
  '<h3>Your artwork</h3><p>No preloaded team images. Upload a photo, logo, or illustration from your own device.</p><button type="button" class="studio-upload" id="uxUpload">+ Upload an image</button>':
  '<h3>Approved image library</h3><p>Choose a reusable image uploaded to GitHub. New approved artwork appears after the gallery updates.</p><label for="uxLogoSearch">Search approved images</label><input type="search" id="uxLogoSearch" placeholder="Search names, teams, or keywords" autocomplete="off"><label for="uxLogoCategory">Category</label><select id="uxLogoCategory"><option value="All">All images</option><option value="School Logos">School Logos</option><option value="Robotics Teams">Robotics Teams</option><option value="FIRST Logos">FIRST Logos</option><option value="Custom Artwork">Custom Artwork</option></select><div class="studio-logo-results" id="uxLogoResults" role="status" aria-live="polite">Loading approved images…</div><div id="uxLogoGroups"></div><p id="uxLogoEmpty" hidden>No images match these filters.</p><button type="button" class="studio-upload" id="uxUpload">+ Upload my own picture</button>';
 left.insertBefore(library,quick);

 if(!general){
   const groupsContainer=document.getElementById('uxLogoGroups');
   const search=document.getElementById('uxLogoSearch');
   const select=document.getElementById('uxLogoCategory');
   const results=document.getElementById('uxLogoResults');
   const empty=document.getElementById('uxLogoEmpty');
   const ORDER=['School Logos','Robotics Teams','FIRST Logos','Custom Artwork'];
   let assets=[];
   let busy=false;
   function validPath(path){
     if(typeof path!=='string'||!path.startsWith('logos/'))return false;
     const parts=path.split('/');
     return parts.length>=2&&!parts.some(p=>!p||p==='.'||p==='..'||p.includes('\\'))&&/\\.(png|jpe?g|webp|avif)$/i.test(path);
   }
   const imageUrl=path=>path.split('/').map(encodeURIComponent).join('/');
   const mimetype=path=>/\\.png$/i.test(path)?'image/png':/\\.jpe?g$/i.test(path)?'image/jpeg':/\\.webp$/i.test(path)?'image/webp':'image/avif';
   function showGallery(){
     groupsContainer.replaceChildren();
     const query=search.value.trim().toLowerCase(),category=select.value;
     const filtered=assets.filter(item=>(category==='All'||item.category===category)&&
      (item.name+' '+item.path+' '+item.tags.join(' ')).toLowerCase().includes(query));
     for(const groupName of ORDER){
       const items=filtered.filter(item=>item.category===groupName);
       if(!items.length)continue;
       const group=document.createElement('section');group.className='studio-logo-group';
       group.dataset.category=groupName;
       const title=document.createElement('h4');title.textContent=groupName+' ('+items.length+')';group.append(title);
       const grid=document.createElement('div');grid.className='studio-logo-grid';
       for(const item of items){
         const button=document.createElement('button');button.type='button';button.className='studio-logo-card';
         button.dataset.path=item.path;
         button.setAttribute('aria-label','Add '+item.name+' from '+groupName+' to your button');
         const picture=document.createElement('img');
         picture.src=imageUrl(item.path);picture.alt='';picture.loading='lazy';
         picture.addEventListener('error',()=>{picture.hidden=true;button.classList.add('studio-logo-broken')});
         const label=document.createElement('span');label.textContent=item.name;
         const detail=document.createElement('small');
         detail.textContent=groupName;
         button.append(picture,label,detail);grid.append(button)
       }
       group.append(grid);groupsContainer.append(group)
     }
     empty.hidden=filtered.length!==0;
     results.textContent=filtered.length+' of '+assets.length+' approved image'+(assets.length===1?'':'s')+' shown';
   }
   async function loadGallery(){
     results.textContent='Loading approved images…';
     try{
       const response=await fetch('logos/catalog.json',{cache:'no-store'});
       if(!response.ok)throw Error('Catalog not available ('+response.status+')');
       const manifest=await response.json();
       if(manifest.version!==1||!Array.isArray(manifest.images))throw Error('Invalid gallery format');
       const paths=new Set();
       assets=manifest.images.filter(item=>{
         if(!item||!validPath(item.path)||typeof item.name!=='string'||!item.name.trim()||!ORDER.includes(item.category)||paths.has(item.path))return false;
         paths.add(item.path);return true
       }).slice(0,300).map(item=>({
         path:item.path,name:item.name.slice(0,100),category:item.category,
         tags:Array.isArray(item.tags)?item.tags.filter(x=>typeof x==='string').slice(0,10):[]
       }));
       showGallery()
     }catch(error){
       results.textContent='Could not load the approved image gallery: '+error.message;
       empty.hidden=true
     }
   }
   search.addEventListener('input',showGallery);
   select.addEventListener('change',showGallery);
   groupsContainer.addEventListener('click',async e=>{
     const card=e.target.closest('button[data-path]');if(!card||busy)return;
     const entry=assets.find(x=>x.path===card.dataset.path);if(!entry||!validPath(entry.path))return;
     if(api.getState().layers.length>=12){results.textContent='Maximum 12 image layers. Remove one first.';return}
     busy=true;card.disabled=true;results.textContent='Adding '+entry.name+'…';
     try{
       const response=await fetch(imageUrl(entry.path),{cache:'force-cache'});
       if(!response.ok)throw Error('Could not load image ('+response.status+')');
       const blob=await response.blob();
       if(!blob.size||blob.size>8*1024*1024)throw Error('Image is empty or larger than 8 MB');
       // Let the existing file-import pipeline validate, normalize, and create an editable layer.
       const file=new File([blob],entry.name.replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,55)+'.'+entry.path.split('.').pop().toLowerCase(),{type:mimetype(entry.path)});
       addImages([file]);
       results.textContent='Added '+entry.name+'. Drag the image to position it.';
     }catch(err){
       results.textContent='Could not add '+entry.name+': '+err.message;
     }finally{busy=false;card.disabled=false}
   });
   loadGallery()
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

/* Phase 2: One image gallery for team logos, FIRST marks, school logos, and approved public art. */
(() => {
 'use strict';
 const general=window.ButtonStudioEdition==='general';
 const api=window.ButtonStudioUX;
 if(!api)return;
 const left=document.querySelector('#designTools, .app > section.panel');
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
 library.setAttribute('aria-label',general?'Upload your own images':'Fenton image gallery with teacher-approved public art');
 library.innerHTML=general?
  '<h3>Your artwork</h3><p>No preloaded team images. Upload a photo, logo, or illustration from your own device.</p><button type="button" class="studio-upload" id="uxUpload">+ Upload an image</button>':
  '<h3>Image Library</h3><p>Search team logos, school logos, FIRST artwork, and coach-approved public images in one place. Public images are reviewed before appearing here; there is no live internet image search.</p><label for="uxLogoSearch">Search images</label><input type="search" id="uxLogoSearch" placeholder="Search names, teams, or keywords" autocomplete="off"><label for="uxLogoCategory">Category</label><select id="uxLogoCategory"><option value="All">All images</option><option value="School Logos">School Logos</option><option value="Robotics Teams">Robotics Teams</option><option value="FIRST Logos">FIRST Logos</option><option value="Public Images">Public Images</option></select><div class="studio-logo-results" id="uxLogoResults" role="status" aria-live="polite">Loading images…</div><div id="uxLogoGroups"></div><p id="uxLogoEmpty" hidden>No images match these filters.</p><button type="button" class="studio-upload" id="uxUpload">+ Upload my own picture</button>';
 const logoTab=!general?document.getElementById('logosTools')?.querySelector('.toolSectionBody'):null;
 if(logoTab){
  // Keep the existing hidden inputs and layer controls wired to the editor,
  // while using the searchable gallery as the single image selection UI.
  ['teamLogo','firstLogo','logo'].forEach(id=>{
   const field=document.getElementById(id);
   const container=field?.closest('.group');
   if(container){container.hidden=true;container.style.display='none'}
  });
  const layerField=document.getElementById('imageLayer')?.closest('.group');
  if(layerField){layerField.hidden=true;layerField.style.display='none'}
  const upload=document.getElementById('uxUpload');
 }

 (logoTab||left).insertBefore(library,logoTab?logoTab.firstChild:quick);
 // Students often want a tiger picture rather than a named robotics team logo.
 // Offer direct links into two already curated, locally hosted collections.
 if(!general){
  const shortcuts=document.createElement('div');
  shortcuts.className='studio-tiger-shortcuts';
  shortcuts.setAttribute('role','group');
  shortcuts.setAttribute('aria-label','Find tiger artwork quickly');
  shortcuts.innerHTML='<span>Looking for a tiger?</span><button type="button" data-tiger-shortcut="pictures" aria-pressed="false">Tiger pictures</button><button type="button" data-tiger-shortcut="teams" aria-pressed="false">Tiger team logos</button><button type="button" data-tiger-shortcut="all" aria-pressed="true">All images</button>';
  // Place the quick choices before the gallery search label.
  const searchLabel=library.querySelector('label[for="uxLogoSearch"]');
  if(searchLabel)searchLabel.before(shortcuts);
 }


 if(!general){
   const groupsContainer=document.getElementById('uxLogoGroups');
   const search=document.getElementById('uxLogoSearch');
   const select=document.getElementById('uxLogoCategory');
   const results=document.getElementById('uxLogoResults');
   const empty=document.getElementById('uxLogoEmpty');
   const ORDER=['Robotics Teams','FIRST Logos','School Logos','Public Images'];
   const PUBLIC_CATEGORIES=new Set(['Robotics','Science','Nature','Sports','School','Seasonal']);
   let assets=[];
   let busy=false;
   const TIGER_PICTURES=new Set([
    'logos/school-logos/images.jpeg',
    'logos/school-logos/SE-Logo_medium.png'
   ]);
   let tigerPicturesOnly=false;
   const tigerShortcuts=library.querySelector('.studio-tiger-shortcuts');
   function markTigerShortcut(active){
    tigerShortcuts?.querySelectorAll('[data-tiger-shortcut]').forEach(button=>{
     button.setAttribute('aria-pressed',String(button.dataset.tigerShortcut===active));
    });
   }
   function validPath(path){
     if(typeof path!=='string'||!path.startsWith('logos/'))return false;
     const parts=path.split('/');
     return parts.length>=2&&!parts.some(p=>!p||p==='.'||p==='..'||p.includes('\\'))&&/\.(png|jpe?g|webp|avif)$/i.test(path);
   }
   // Public artwork is a separate allowlist; an arbitrary file or external URL cannot enter the gallery.
   function validPublicPath(path){
     return typeof path==='string'&&/^approved-art\/images\/[a-z0-9-]+\.(?:svg|png|jpe?g|webp)$/.test(path);
   }
   function validItemPath(item){
     return item.category==='Public Images'?validPublicPath(item.path):validPath(item.path);
   }
   async function approvedPng(blob,color='original'){
     if(!blob.size||blob.size>8*1024*1024)throw Error('Artwork is empty or larger than 8 MB');
     const url=URL.createObjectURL(blob);
     try{
       const im=new Image();
       await new Promise((resolve,reject)=>{
         im.onload=resolve;im.onerror=()=>reject(Error('Could not decode artwork'));
         im.src=url;
       });
       if(!im.naturalWidth||!im.naturalHeight)throw Error('Artwork has invalid dimensions');
       const scale=Math.min(1,1200/Math.max(im.naturalWidth,im.naturalHeight));
       const cv=document.createElement('canvas');
       cv.width=Math.max(1,Math.round(im.naturalWidth*scale));
       cv.height=Math.max(1,Math.round(im.naturalHeight*scale));
       const ctx=cv.getContext('2d');ctx.drawImage(im,0,0,cv.width,cv.height);
       if(color!=='original'){
         const rgb=teamColors[color];if(!rgb)throw Error('Unsupported public image color');
         // Only tint already-visible pixels. Source alpha/transparency remains intact.
         ctx.globalCompositeOperation='source-in';
         ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.fillRect(0,0,cv.width,cv.height);
         ctx.globalCompositeOperation='source-over';
       }
       return await new Promise((resolve,reject)=>cv.toBlob(
         image=>image?resolve(image):reject(Error('Could not convert artwork')),'image/png'));
     }finally{URL.revokeObjectURL(url)}
   }
   // Remove only white/near-white regions connected to image edges.
   // This preserves enclosed white lettering and details inside logos.
   async function cleanSchoolBackground(blob){
     const bitmap=await createImageBitmap(blob);
     const maxSide=1400,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
     const cv=document.createElement('canvas');
     cv.width=Math.max(1,Math.round(bitmap.width*scale));cv.height=Math.max(1,Math.round(bitmap.height*scale));
     const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(bitmap,0,0,cv.width,cv.height);bitmap.close?.();
     const w=cv.width,h=cv.height,pixels=cx.getImageData(0,0,w,h),d=pixels.data;
     const checked=new Uint8Array(w*h),stack=[];
     const candidate=i=>{const k=i*4;return d[k+3]>0&&d[k]>235&&d[k+1]>235&&d[k+2]>235};
     function seed(i){if(!checked[i]&&candidate(i)){checked[i]=1;stack.push(i)}}
     for(let x=0;x<w;x++){seed(x);seed((h-1)*w+x)}
     for(let y=0;y<h;y++){seed(y*w);seed(y*w+w-1)}
     while(stack.length){
       const i=stack.pop(),k=i*4;d[k+3]=0;
       const x=i%w,y=(i/w)|0;
       if(x>0)seed(i-1);if(x<w-1)seed(i+1);if(y>0)seed(i-w);if(y<h-1)seed(i+w);
     }
     cx.putImageData(pixels,0,0);
     return new Promise(resolve=>cv.toBlob(out=>resolve(out||blob),'image/png'));
   }
   // Logos in the library have two source styles:
   //  - Orange-backed badges and the dark Titanium mark: dark ink is the artwork.
   //  - Tungsten/Chromium/Iridium (including alternate marks): WHITE ink is the artwork.
   // Their background/negative space must stay transparent in all output colors.
   const lightInkTeamFiles=new Set([
     'chromium-tigers.png','iridium-tigers.png','tungsten-tigers.png',
     'logo-2.png','logo-3.png','logo-4.png'
   ]);
   const teamColors={
     black:[0,0,0],
     orange:[245,130,32],
     white:[255,255,255]
   };
   const teamPreviewCache=new Map();
   const sourceInk=path=>lightInkTeamFiles.has(path.split('/').pop())?'light':'dark';
   const opacity=(value,min,max)=>Math.max(0,Math.min(1,(value-min)/(max-min)));
   async function recolorTeamLogo(blob,path,color='black'){
     const rgb=teamColors[color];
     if(!rgb)throw Error('Unknown team logo color');
     const bitmap=await createImageBitmap(blob),cv=document.createElement('canvas');
     const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
     cv.width=Math.max(1,Math.round(bitmap.width*scale));cv.height=Math.max(1,Math.round(bitmap.height*scale));
     const cx=cv.getContext('2d',{willReadFrequently:true});
     cx.drawImage(bitmap,0,0,cv.width,cv.height);bitmap.close?.();
     const pixels=cx.getImageData(0,0,cv.width,cv.height),d=pixels.data;
     const light=sourceInk(path)==='light';
     let visible=0;
     for(let i=0;i<d.length;i+=4){
       const r=d[i],g=d[i+1],b=d[i+2],alpha=d[i+3];
       if(alpha===0)continue;
       const luminance=.299*r+.587*g+.114*b;
       // Orange is a fill color in the dark-source team marks, not artwork.
       const orange=!light&&r>105&&r>g*1.2&&g>b*1.12;
       const ink=light?opacity(luminance,55,210):(orange?0:opacity(190-luminance,0,135));
       const a=Math.round(alpha*ink);
       d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=a;
       if(a>10)visible++;
     }
     if(visible<20)throw Error('No visible artwork in this team logo');
     cx.putImageData(pixels,0,0);
     return await new Promise((resolve,reject)=>cv.toBlob(out=>out?resolve(out):reject(Error('Could not render logo')),'image/png'));
   }
   async function teamPreview(path,img,color='black'){
     img.dataset.requestedColor=color;
     const cacheKey=path+'|'+color;
     let pending=teamPreviewCache.get(cacheKey);
     if(!pending){
       pending=(async()=>{
         const response=await fetch(imageUrl(path),{cache:'force-cache'});
         if(!response.ok)throw Error('Logo unavailable ('+response.status+')');
         const converted=await recolorTeamLogo(await response.blob(),path,color);
         return URL.createObjectURL(converted);
       })();
       teamPreviewCache.set(cacheKey,pending);
       pending.catch(()=>teamPreviewCache.delete(cacheKey));
     }
     const src=await pending;
     // A slow request for Black must not overwrite a later Orange or White choice.
     if(img.isConnected&&img.dataset.requestedColor===color)img.src=src;
   }
   const imageUrl=path=>path.split('/').map(encodeURIComponent).join('/');
   const publicBlobCache=new Map(),publicPreviewCache=new Map();
   function publicBlob(path,color){
     const key=path+'|'+color;
     if(!publicBlobCache.has(key)){
       const pending=fetch(imageUrl(path),{cache:'force-cache'})
         .then(response=>{if(!response.ok)throw Error('Artwork unavailable ('+response.status+')');return response.blob()})
         .then(blob=>approvedPng(blob,color));
       publicBlobCache.set(key,pending);pending.catch(()=>publicBlobCache.delete(key));
     }
     return publicBlobCache.get(key);
   }
   async function publicPreview(path,img,color){
     img.dataset.requestedColor=color;
     if(color==='original'){img.src=imageUrl(path);return}
     // Clear the previous color immediately so a slow conversion never leaves a stale preview.
     img.removeAttribute('src');
     const key=path+'|'+color;
     if(!publicPreviewCache.has(key)){
       const pending=publicBlob(path,color).then(blob=>URL.createObjectURL(blob));
       publicPreviewCache.set(key,pending);pending.catch(()=>publicPreviewCache.delete(key));
     }
     const src=await publicPreviewCache.get(key);
     if(img.isConnected&&img.dataset.requestedColor===color)img.src=src;
   }
   const mimetype=path=>/\.png$/i.test(path)?'image/png':/\.jpe?g$/i.test(path)?'image/jpeg':/\.webp$/i.test(path)?'image/webp':'image/avif';
   function showGallery(){
     groupsContainer.replaceChildren();
     const query=search.value.trim().toLowerCase(),category=select.value;
     const filtered=assets.filter(item=>(category==='All'||item.category===category)&&
      (!tigerPicturesOnly||TIGER_PICTURES.has(item.path))&&
      (item.name+' '+item.category+' '+(item.subcategory||'')+' '+item.tags.join(' ')).toLowerCase().includes(query));
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
         picture.alt='';picture.loading='lazy';
         if(item.category==='Robotics Teams')teamPreview(item.path,picture,'black').catch(()=>{button.classList.add('studio-logo-broken')});
         else picture.src=imageUrl(item.path);
         picture.addEventListener('error',()=>{picture.hidden=true;button.classList.add('studio-logo-broken')});
         const label=document.createElement('span');label.textContent=item.name;
         const detail=document.createElement('small');
         detail.textContent=item.category==='Robotics Teams'?'Black logo · transparent background':
           item.category==='Public Images'?(item.subcategory+' · '+item.license.toUpperCase()+' · reviewed'):groupName;
         button.append(picture,label,detail);
         if(item.category==='Robotics Teams'){
           const wrap=document.createElement('div');wrap.className='team-logo-choice';wrap.dataset.logoColor='black';
           const colorLabel=document.createElement('label');colorLabel.textContent='Logo color';
           const picker=document.createElement('select');picker.setAttribute('aria-label',item.name+' logo color');
           picker.className='team-logo-color';picker.dataset.path=item.path;
           [['black','Black'],['orange','Orange'],['white','White']].forEach(([value,name])=>{const opt=document.createElement('option');opt.value=value;opt.textContent=name;picker.append(opt)});
           picker.addEventListener('change',()=>{
             wrap.dataset.logoColor=picker.value;
             detail.textContent=picker.selectedOptions[0].text+' logo · transparent background';
             picture.hidden=false;button.classList.remove('studio-logo-broken');
             teamPreview(item.path,picture,picker.value).catch(()=>{
               button.classList.add('studio-logo-broken');
               detail.textContent='Unable to render '+picker.value+' logo';
             });
           });
           colorLabel.append(picker);wrap.append(button,colorLabel);grid.append(wrap);
          }else if(item.category==='Public Images'&&item.recolorable){
           const wrap=document.createElement('div');wrap.className='public-art-choice';wrap.dataset.artColor='original';
           const colorLabel=document.createElement('label');colorLabel.textContent='Artwork color';
           const picker=document.createElement('select');picker.className='public-art-color';
           picker.setAttribute('aria-label',item.name+' artwork color');
           [['original','Original'],['black','Black'],['orange','Orange'],['white','White']].forEach(([value,name])=>{
             const option=document.createElement('option');option.value=value;option.textContent=name;picker.append(option);
           });
           picker.addEventListener('change',()=>{
             wrap.dataset.artColor=picker.value;
             detail.textContent=item.subcategory+' · '+item.license.toUpperCase()+' · '+picker.selectedOptions[0].text;
             picture.hidden=false;button.classList.remove('studio-logo-broken');
             publicPreview(item.path,picture,picker.value).catch(()=>{
               picture.hidden=true;button.classList.add('studio-logo-broken');
               detail.textContent='Unable to render '+picker.value+' artwork';
             });
           });
           colorLabel.append(picker);wrap.append(button,colorLabel);grid.append(wrap);
         }else grid.append(button)
       }
       group.append(grid);groupsContainer.append(group)
     }
     empty.hidden=filtered.length!==0;
     results.textContent=filtered.length+' of '+assets.length+' image'+(assets.length===1?'':'s')+' shown';
   }
   async function loadGallery(){
     results.textContent='Loading image gallery…';
     const unavailable=[];
     let logoAssets=[],publicAssets=[];
     try{
       const response=await fetch('logos/catalog.json',{cache:'no-store'});
       if(!response.ok)throw Error('Team-logo catalog unavailable');
       const manifest=await response.json();
       if(manifest.version!==1||!Array.isArray(manifest.images))throw Error('Invalid team-logo catalog');
       const paths=new Set();
       logoAssets=manifest.images.filter(item=>{
         if(!item||!validPath(item.path)||typeof item.name!=='string'||!item.name.trim()||
            !ORDER.slice(0,3).includes(item.category)||paths.has(item.path))return false;
         paths.add(item.path);return true
       }).slice(0,300).map(item=>({
         path:item.path,name:item.name.slice(0,100),category:item.category,
         tags:Array.isArray(item.tags)?item.tags.filter(x=>typeof x==='string').slice(0,10):[]
       }));
     }catch(error){unavailable.push('team logos')}
     try{
       const response=await fetch('approved-art/catalog.json',{cache:'no-store'});
       if(!response.ok)throw Error('Approved artwork catalog unavailable');
       const manifest=await response.json();
       if(manifest.version!==1||!Array.isArray(manifest.images))throw Error('Invalid approved artwork catalog');
       const paths=new Set(),ids=new Set();
       publicAssets=manifest.images.filter(item=>{
         if(!item||item.approved!==true||!validPublicPath(item.path)||typeof item.name!=='string'||
            !item.name.trim()||!PUBLIC_CATEGORIES.has(item.category)||
            !['cc0','pdm'].includes(item.license)||typeof item.id!=='string'||
            !/^[a-z0-9-]+$/.test(item.id)||paths.has(item.path)||ids.has(item.id)||
            typeof item.source!=='string'||!item.source.trim()||
            typeof item.creator!=='string'||!item.creator.trim()||
            typeof item.sourceUrl!=='string'||!item.sourceUrl.startsWith('https://')||
            !Array.isArray(item.tags)||item.tags.some(t=>typeof t!=='string'))return false;
         paths.add(item.path);ids.add(item.id);return true
       }).slice(0,200).map(item=>({
         path:item.path,name:item.name.slice(0,90),category:'Public Images',subcategory:item.category,
         license:item.license,recolorable:item.recolorable===true&&/\.svg$/.test(item.path),tags:item.tags.slice(0,10)
       }));
     }catch(error){unavailable.push('public images')}
     assets=[...logoAssets,...publicAssets];
     showGallery();
     if(unavailable.length)results.textContent+=' · Unavailable: '+unavailable.join(', ');
   }
   search.addEventListener('input',()=>{tigerPicturesOnly=false;markTigerShortcut('');showGallery()});
   select.addEventListener('change',()=>{tigerPicturesOnly=false;markTigerShortcut('');showGallery()});
   tigerShortcuts?.addEventListener('click',event=>{
    const button=event.target.closest('[data-tiger-shortcut]');if(!button)return;
    const type=button.dataset.tigerShortcut;
    if(type==='pictures'){select.value='School Logos';search.value='tiger';tigerPicturesOnly=true}
    else if(type==='teams'){select.value='Robotics Teams';search.value='tiger';tigerPicturesOnly=false}
    else if(type==='all'){select.value='All';search.value='';tigerPicturesOnly=false}
    else return;
    markTigerShortcut(type);
    showGallery();
   });
   groupsContainer.addEventListener('click',async e=>{
     const card=e.target.closest('button[data-path]');if(!card||busy)return;
     const entry=assets.find(x=>x.path===card.dataset.path);if(!entry||!validItemPath(entry))return;
     if(api.getState().layers.length>=12){results.textContent='Maximum 12 image layers. Remove one first.';return}
     busy=true;card.disabled=true;results.textContent='Adding '+entry.name+'…';
     try{
       const response=await fetch(imageUrl(entry.path),{cache:'force-cache'});
       if(!response.ok)throw Error('Could not load image ('+response.status+')');
       let blob=await response.blob();
       if(!blob.size||blob.size>8*1024*1024)throw Error('Image is empty or larger than 8 MB');
       if(entry.category==='School Logos')blob=await cleanSchoolBackground(blob);
       const publicColor=entry.category==='Public Images'&&entry.recolorable?(card.closest('.public-art-choice')?.querySelector('.public-art-color')?.value||'original'):'original';
        if(entry.category==='Public Images')blob=await approvedPng(blob,publicColor);
       const color=entry.category==='Robotics Teams'?(card.closest('.team-logo-choice')?.querySelector('.team-logo-color')?.value||'black'):'black';
       if(entry.category==='Robotics Teams')blob=await recolorTeamLogo(blob,entry.path,color);
       // Let the existing file-import pipeline validate, normalize, and create an editable layer.
       const suffix=entry.category==='Robotics Teams'?' '+color:entry.category==='Public Images'?' '+publicColor:'';
        const file=new File([blob],(entry.name+suffix).replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,55)+'.'+(entry.category!=='FIRST Logos'?'png':entry.path.split('.').pop().toLowerCase()),{type:entry.category!=='FIRST Logos'?'image/png':mimetype(entry.path)});
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
 if(logoTab)logoTab.append(layersSection);else left.insertBefore(layersSection,advanced);
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

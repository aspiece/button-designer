/* Student-only view of a locally approved, CC0/PDM artwork catalog. No live external image search. */
(() => {
 'use strict';
 if (window.ButtonStudioEdition === 'general') return;
 const host=document.querySelector('.studio-logo-library');
 const upload=document.getElementById('uxUpload');
 const api=window.ButtonStudioUX;
 if (!host || !upload || !api || typeof window.addImages !== 'function') return;
 const section=document.createElement('section');
 section.className='studio-approved-art';
 section.setAttribute('aria-label','Approved public-use art');
 section.innerHTML='<div class="studio-approved-heading"><h3>Kid-friendly public-use art</h3><span class="studio-approved-pill">Reviewed collection</span></div><p>Search preselected classroom artwork. No live internet image results are shown. Artwork here is CC0 or public domain; new images require adult review before publishing.</p><label for="approvedArtSearch">Search approved artwork</label><input id="approvedArtSearch" type="search" placeholder="Robot, planet, soccer, nature…" autocomplete="off"><label for="approvedArtCategory">Art category</label><select id="approvedArtCategory"><option value="All">All categories</option><option value="Robotics">Robotics</option><option value="Science">Science</option><option value="Nature">Nature</option><option value="Sports">Sports</option><option value="School">School</option><option value="Seasonal">Seasonal</option></select><p id="approvedArtStatus" role="status" aria-live="polite">Loading approved art…</p><div id="approvedArtGrid" class="studio-logo-grid"></div><p id="approvedArtEmpty" hidden>No approved artwork matches. Try another word or category.</p><p class="studio-approved-note">Want another image? Ask your coach to review and add it to the collection. Images you upload from your device are not part of the reviewed library.</p>';
 host.insertBefore(section, upload);
 const search=section.querySelector('#approvedArtSearch');
 const category=section.querySelector('#approvedArtCategory');
 const grid=section.querySelector('#approvedArtGrid');
 const status=section.querySelector('#approvedArtStatus');
 const empty=section.querySelector('#approvedArtEmpty');
 const CATEGORIES=new Set(['Robotics','Science','Nature','Sports','School','Seasonal']);
 const VALID_PATH=/^approved-art\/images\/[a-z0-9-]+\.(?:svg|png|jpg|jpeg|webp)$/;
 let approved=[],busy=false;
 function valid(item){
  return item && item.approved===true && (item.license==='cc0'||item.license==='pdm') &&
   VALID_PATH.test(item.path) && typeof item.name==='string' && item.name.length<=90 &&
   CATEGORIES.has(item.category) && typeof item.source==='string' && item.source.trim().length>0 &&
   typeof item.sourceUrl==='string' && /^https:\/\//.test(item.sourceUrl) &&
   Array.isArray(item.tags) && item.tags.every(t=>typeof t==='string');
 }
 function pathUrl(path){return path.split('/').map(encodeURIComponent).join('/');}
 function render(){
  const q=search.value.trim().toLowerCase(),cat=category.value;
  const list=approved.filter(item=>(cat==='All'||item.category===cat) &&
   (item.name+' '+item.category+' '+item.tags.join(' ')).toLowerCase().includes(q));
  grid.replaceChildren();
  for(const item of list){
   const card=document.createElement('button');card.type='button';card.className='studio-logo-card studio-approved-card';
   card.dataset.artId=item.id;card.setAttribute('aria-label','Add '+item.name+' to your button, '+item.license.toUpperCase()+' artwork');
   const image=document.createElement('img');image.alt='';image.loading='lazy';image.src=pathUrl(item.path);
   image.addEventListener('error',()=>{image.hidden=true;card.classList.add('studio-logo-broken')});
   const name=document.createElement('span');name.textContent=item.name;
   const details=document.createElement('small');details.textContent=item.category+' · '+item.license.toUpperCase();
   card.append(image,name,details);grid.append(card)
  }
  empty.hidden=list.length>0;
  status.textContent=list.length+' of '+approved.length+' approved images shown';
 }
 async function convertToPng(blob){
  if(blob.size<1||blob.size>8*1024*1024)throw Error('Image is empty or too large');
  const objectUrl=URL.createObjectURL(blob);
  try {
   const image=new Image();
   await new Promise((resolve,reject)=>{
    image.onload=resolve;image.onerror=()=>reject(Error('Could not decode artwork'));image.src=objectUrl
   });
   const scale=Math.min(1,1200/Math.max(image.naturalWidth,image.naturalHeight));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
   canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
   return await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(Error('Could not convert artwork')),'image/png'));
  }finally{URL.revokeObjectURL(objectUrl)}
 }
 grid.addEventListener('click',async event=>{
  const card=event.target.closest('button[data-art-id]');
  if(!card||busy)return;
  const item=approved.find(x=>x.id===card.dataset.artId);
  if(!item)return;
  if(api.getState().layers.length>=12){status.textContent='Maximum 12 image layers. Remove one first.';return}
  busy=true;card.disabled=true;status.textContent='Adding '+item.name+'…';
  try{
   const response=await fetch(pathUrl(item.path),{cache:'force-cache'});
   if(!response.ok)throw Error('Artwork unavailable ('+response.status+')');
   const png=await convertToPng(await response.blob());
   const name=item.name.replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,60)||'Approved artwork';
   window.addImages([new File([png],name+'.png',{type:'image/png'})]);
   status.textContent=item.name+' sent to your button as an editable layer.';
  }catch(error){
   status.textContent='Unable to add '+item.name+': '+error.message
  }finally{busy=false;card.disabled=false}
 });
 search.addEventListener('input',render);
 category.addEventListener('change',render);
 (async()=>{
  try{
   const response=await fetch('approved-art/catalog.json',{cache:'no-store'});
   if(!response.ok)throw Error('Approved catalog is unavailable');
   const catalog=await response.json();
   if(catalog.version!==1||!Array.isArray(catalog.images))throw Error('Invalid catalog');
   const seen=new Set();
   approved=catalog.images.filter(x=>{
    if(!valid(x)||typeof x.id!=='string'||!/^[a-z0-9-]+$/.test(x.id)||seen.has(x.id))return false;
    seen.add(x.id);return true
   }).slice(0,200);
   render();
  }catch(error){status.textContent='Approved artwork unavailable. Team logos and device uploads still work.';empty.hidden=true}
 })();
})();

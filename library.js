/* Reusable GitHub design library — reads publicly approved assets, never writes without a teacher's GitHub commit. */
(() => {
 'use strict';
 const root=document.querySelector('.app > section.panel:first-child');
 const templates=root?.querySelector('.template-section');
 if(!root||!templates)return;
 const panel=document.createElement('section');panel.className='shared-library';panel.id='sharedLibrary';
 panel.setAttribute('aria-label','Reusable designs from the GitHub repository');
 panel.innerHTML='<div class="shared-library-title"><h3>Saved team designs</h3><span id="libCount">Loading…</span></div><p>Open an approved button to edit it, or add it to a classroom print sheet. Designs live in the Fenton Robotics GitHub repository.</p><label for="libSearch">Search saved designs</label><input id="libSearch" type="search" placeholder="Find a design…" autocomplete="off"><div class="shared-library-grid" id="libGrid"></div><p id="libStatus" role="status" aria-live="polite"></p><details class="shared-publish"><summary>Save a new design for future projects</summary><p>Prepare an editable project, then a teacher can add it to the public GitHub library. Publishing does <strong>not</strong> happen automatically from the student browser.</p><label for="libDesignName">Design name</label><input id="libDesignName" type="text" maxlength="80" placeholder="Fenton Tigers 2026"><label for="libDesignDesc">Short description (optional)</label><input id="libDesignDesc" type="text" maxlength="160" placeholder="Orange button for team events"><button id="libPrepare" type="button" class="shared-save">Download project for shared library</button><p>To publish: open <a href="https://github.com/aspiece/button-designer/tree/main/designs" target="_blank" rel="noopener">the designs folder on GitHub</a>, select <strong>Add file → Upload files</strong>, upload the JSON or finished PNG, then commit. The catalog refreshes automatically after the workflow runs. Only publish approved artwork: this repository is public.</p></details>';
 templates.after(panel);
 const el=id=>document.getElementById(id);
 const grid=el('libGrid'),status=el('libStatus');
 let entries=[],busy=false,loaded=false;
 const validPath=path=>typeof path==='string'&&/^designs\/[a-z0-9_-]+\.(json|png)$/.test(path);
 function message(s){status.textContent=s}
 function card(entry){
  const outer=document.createElement('article');outer.className='shared-card';outer.dataset.id=entry.id;
  const thumb=document.createElement('div');thumb.className='shared-card-thumb';
  thumb.style.background=entry.background||'#fff';
  if(entry.kind==='image'){
   const img=document.createElement('img');img.src=entry.file;img.alt='';img.loading='lazy';thumb.append(img)
  }else{
   const symbol=document.createElement('span');symbol.className='shared-card-symbol';
   symbol.textContent=entry.centerLogo==='paw'?'🐾':entry.centerLogo==='t'?'T':entry.centerLogo==='f'?'F':'◯';
   symbol.style.color=entry.background==='#111111'?'#f58220':'#111111';thumb.append(symbol)
  }
  const title=document.createElement('strong');title.textContent=entry.name;
  const description=document.createElement('p');description.textContent=entry.description||'Reusable robotics button';
  const buttons=document.createElement('div');buttons.className='shared-card-actions';
  const edit=document.createElement('button');edit.type='button';edit.dataset.action='edit';edit.textContent=entry.kind==='project'?'Open & edit':'Use PNG on canvas';
  const print=document.createElement('button');print.type='button';print.dataset.action='print';print.textContent='Add to print sheet';
  buttons.append(edit,print);outer.append(thumb,title,description,buttons);return outer
 }
 function show(query=''){
  grid.replaceChildren();const term=query.toLowerCase().trim();
  const visible=entries.filter(entry=>(entry.name+' '+entry.description).toLowerCase().includes(term));
  for(const e of visible)grid.append(card(e));
  el('libCount').textContent=entries.length+' saved';
  if(loaded)message(visible.length? 'Choose a design to reuse.':'No matching saved designs.')
 }
 async function getData(entry){
  if(!validPath(entry.file))throw Error('Unapproved catalog file path');
  const response=await fetch(entry.file,{cache:'no-store'});
  if(!response.ok)throw Error('Could not load '+entry.name+' ('+response.status+')');
  if(entry.kind==='project'){
   const json=await response.json();
   if(!json||typeof json!=='object'||!json.values||typeof json.values!=='object'||!Array.isArray(json.layers||[]))throw Error('Invalid project file');
   return json
  }
  const blob=await response.blob();
  if(blob.size>10000000||!blob.size||blob.type!=='image/png')throw Error('Expected a PNG under 10 MB');
  return blob
 }
 async function use(entry,action){
  if(busy)return;busy=true;
  message('Opening '+entry.name+'…');
  try{
   const data=await getData(entry);
   if(action==='edit'){
    if(entry.kind==='project'){
     if(!confirm('Open "'+entry.name+'"? This will replace your current canvas. Download an editable project first if you want to keep your changes.')){message('Canceled.');return}
     restoreProject(data);
     setMessage('Loaded saved design: '+entry.name+'. You can edit and save your own copy.');
     document.querySelector('.previewPanel')?.scrollIntoView({behavior:'smooth',block:'start'})
    }else{
     const file=new File([data],entry.id+'.png',{type:'image/png'});
     addImages([file]);setMessage('Added saved PNG as a movable image. PNG artwork is flattened; use JSON projects for individual text editing.')
    }
    message('Opened '+entry.name)
   }else if(action==='print'){
    const app=window.ButtonStudioPrint;
    if(!app)throw Error('Print Studio is unavailable');
    if(entry.kind==='project')await app.addProject(data,entry.name);
    else await app.addPNG(data,entry.name);
    message('Added '+entry.name+' to the classroom print sheet.')
   }
  }catch(error){message('Could not reuse this button: '+error.message)}
  finally{busy=false}
 }
 grid.addEventListener('click',e=>{
  const button=e.target.closest('button[data-action]');if(!button)return;
  const id=button.closest('.shared-card')?.dataset.id;
  const entry=entries.find(i=>i.id===id);if(entry)use(entry,button.dataset.action)
 });
 el('libSearch').addEventListener('input',e=>show(e.target.value));
 el('libPrepare').addEventListener('click',()=>{
  const name=el('libDesignName').value.trim();
  if(!name){message('Enter a short design name before downloading.');el('libDesignName').focus();return}
  const description=el('libDesignDesc').value.trim();
  const slug=name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
  if(!slug){message('Use letters or numbers in your design name.');return}
  try{
   const project={version:2,name,description,...state()};
   const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   downloadUrl(url,slug+'.json');
   setTimeout(()=>URL.revokeObjectURL(url),30000);
   message('Project downloaded. A teacher can upload the JSON to the public designs/ folder to share it with future classes.')
  }catch(error){message('Could not prepare design: '+error.message)}
 });
 async function load(){
  try{
   const response=await fetch('designs/catalog.json',{cache:'no-store'});
   if(!response.ok)throw Error('Catalog not found');
   const catalog=await response.json();
   if(catalog.version!==1||!Array.isArray(catalog.designs))throw Error('Unsupported catalog');
   entries=catalog.designs.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&x.name.length<120&&validPath(x.file)&&(x.kind==='project'||x.kind==='image')).slice(0,150);
   loaded=true;show();
  }catch(err){el('libCount').textContent='Unavailable';message('Could not load saved designs. Check the GitHub Pages library or refresh the page. '+err.message)}
 }
 load();
})();

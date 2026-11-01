/* Reuse existing editor controls in the third column; never create duplicate handlers. */
(() => {
 'use strict';
 const panel=document.getElementById('propertiesPanel');
 const api=window.ButtonStudioUX;
 if(!panel||!api)return;
 const move=(id,to)=>{
  const source=document.getElementById(id),destination=document.getElementById(to);
  if(source&&destination)destination.append(source);
  return source;
 };
 move('quickPanel','propertiesEditorContent');
 // Move the entire image-layer section, including its live list, as one node.
 // The editor retains the list reference for asynchronous image updates.
 const layerSection=document.querySelector('.studio-layers');
 if(layerSection)document.getElementById('propertiesImageLayers').replaceChildren(layerSection);
 const warnings=move('designWarnings','propertiesWarnings');
 // Save and print belong to the Print tab, not the always-visible properties panel.
 // Reparent the original controls to retain all existing save/export handlers.
 const saveActions=document.querySelector('.previewPanel .top-tools');
 const saveDestination=document.getElementById('printSaveActions');
 if(saveActions&&saveDestination)saveDestination.append(saveActions);

 // Phase 3 creates the actual Print Studio button in the Print panel. Keep its
 // original click handler and associated help text, but make it the first action.
 const printButton=document.getElementById('openPrintStudio');
 const printIntro=printButton?.previousElementSibling;
 const printDestination=document.getElementById('printStudioAction');
 if(printDestination){
  if(printIntro?.classList.contains('hint')&&printIntro.textContent.includes('Open the print workspace')){
   printDestination.append(printIntro);
  }
  if(printButton)printDestination.prepend(printButton);
 }
 // The existing dynamic selected-item editor replaces the old image-only controls.
 // Their DOM nodes remain in place for the editor's programmatic commands.
 for(const selector of ['#logoSize','#cropLogo','#centerLogo','#removeLogo']){
  const element=document.querySelector(selector);
  const block=element?.closest('.group, .buttons');
  if(block){block.hidden=true;block.style.display='none'}
 }
 const buttons=[...panel.querySelectorAll('[data-prop-select]')];
 for(const button of buttons){
  const name=button.textContent.trim();
  button.setAttribute('aria-label','Edit '+name.toLowerCase());
  button.addEventListener('click',()=>api.selectElement(button.dataset.propSelect));
 }
 api.onUpdate(()=>{
  const current=api.getState().selected;
  for(const button of buttons)button.setAttribute('aria-pressed',String(current?.kind===button.dataset.propSelect));
 });
 const status=document.getElementById('propertiesCheckSummary');
 function updateChecks(){
  const hasWarning=Boolean(warnings?.textContent.trim());
  status.dataset.attention=String(hasWarning);
  status.textContent=hasWarning?'Check the design notes below before printing.':'No design warnings right now.';
 }
 if(warnings)new MutationObserver(updateChecks).observe(warnings,{childList:true,subtree:true,characterData:true});
 updateChecks();
 // The full panel stays in the desktop right column. Narrow layouts use the same
 // live controls in a single accessible, dismissible drawer instead of a long page.
 const narrow=window.matchMedia('(max-width:1119px)');
 const editButton=document.getElementById('mobileEditButton');
 const layersButton=document.getElementById('mobileLayersButton');
 const closeButton=document.getElementById('propertiesClose');
 const drawerTitle=document.getElementById('propertiesDrawerTitle');
 const backdrop=document.createElement('div');
 backdrop.id='propertiesBackdrop';
 backdrop.hidden=true;
 backdrop.setAttribute('aria-hidden','true');
 document.body.append(backdrop);
 let isOpen=false,view='edit',returnFocus=null;

 function syncDrawer(){
  const compact=narrow.matches;
  if(!compact)isOpen=false;
  panel.inert=compact&&!isOpen;
  panel.dataset.drawerOpen=String(compact&&isOpen);
  panel.dataset.mobileView=view;
  if(compact){
   panel.setAttribute('role','dialog');
   panel.setAttribute('aria-modal','true');
   panel.setAttribute('aria-labelledby','propertiesDrawerTitle');
   drawerTitle.textContent=view==='layers'?'Layers':'Edit Selected';
  }else{
   panel.removeAttribute('role');
   panel.removeAttribute('aria-modal');
   panel.removeAttribute('aria-labelledby');
   drawerTitle.textContent='Properties & Layers';
  }
  const active=compact&&isOpen;
  backdrop.hidden=!active;
  document.body.classList.toggle('properties-drawer-open',active);
  editButton?.setAttribute('aria-expanded',String(active&&view==='edit'));
  layersButton?.setAttribute('aria-expanded',String(active&&view==='layers'));
 }
 function openDrawer(which,opener){
  if(!narrow.matches)return;
  const wasOpen=isOpen;
  view=which;
  isOpen=true;
  if(opener)returnFocus=opener;
  syncDrawer();
  // Place focus inside the dialog; keyboard navigation remains inside until closed.
  if(!wasOpen||document.activeElement===editButton||document.activeElement===layersButton){
   closeButton?.focus({preventScroll:true});
  }
 }
 function closeDrawer(restoreFocus=true){
  if(!isOpen)return;
  const focusedInside=panel.contains(document.activeElement);
  isOpen=false;
  syncDrawer();
  if(restoreFocus&&focusedInside&&returnFocus?.isConnected){
   returnFocus.focus({preventScroll:true});
  }
 }
 editButton?.addEventListener('click',()=>openDrawer('edit',editButton));
 layersButton?.addEventListener('click',()=>openDrawer('layers',layersButton));
 closeButton?.addEventListener('click',()=>closeDrawer());
 backdrop.addEventListener('click',()=>closeDrawer());
 // Choosing a text or image layer should immediately show its editing controls.
 panel.addEventListener('click',e=>{
  if(!narrow.matches||!isOpen||view!=='layers')return;
  if(e.target.closest('#propertiesLayers [data-prop-select], #propertiesLayers .studio-layer-select')){
   openDrawer('edit',editButton);
  }
 });
 document.addEventListener('keydown',e=>{
  if(!narrow.matches||!isOpen)return;
  if(e.key==='Escape'){e.preventDefault();closeDrawer();return}
  if(e.key!=='Tab')return;
  const focusable=[...panel.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],summary,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length&&!el.inert);
  if(!focusable.length){e.preventDefault();panel.focus();return}
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){e.preventDefault();first.focus()}
 });
 // A student can switch to the gallery or Print without leaving an overlay open.
 document.querySelectorAll('[data-edit-tab]').forEach(button=>{
  button.addEventListener('click',()=>closeDrawer(false));
 });
 narrow.addEventListener('change',syncDrawer);
 api.onUpdate(()=>{
  const current=api.getState().selected;
  const label={top:'top text',bottom:'bottom text',middle:'center text',background:'background',image:'image',mark:'logo'}[current?.kind];
  if(editButton)editButton.setAttribute('aria-label',label?'Edit selected '+label:'Edit selected item');
 });
 syncDrawer();
})();


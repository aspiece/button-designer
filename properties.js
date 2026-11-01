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
 // The Properties panel remains focused on editing and layer management.
})();

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
 move('uxLayersList','propertiesImageLayers');
 // Move the entire image-layer list section so its title, count, and ordering work together.
 const layerSection=document.querySelector('.studio-layers');
 if(layerSection)document.getElementById('propertiesImageLayers').replaceChildren(layerSection);
 const warnings=move('designWarnings','propertiesWarnings');
 const fileActions=move('downloadPng','propertiesSaveActions');
 // Keep the original control container (and its listeners) together inside one disclosure.
 const originalTopTools=document.querySelector('.previewPanel .top-tools');
 if(originalTopTools)document.getElementById('propertiesSaveActions').append(originalTopTools);
 // If a button was individually moved, return it to the original group so no action is duplicated.
 if(fileActions&&originalTopTools&&!originalTopTools.contains(fileActions))originalTopTools.prepend(fileActions);
 const printButton=move('openPrintStudio','propertiesPrintAction');
 const printIntro=document.querySelector('#printTools > .hint');
 if(printIntro)document.getElementById('propertiesPrintAction').append(printIntro);
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
 // Preserve a useful Print Studio route even if future print tools are reorganized.
 if(!printButton)status.textContent='Print Studio is available in the Print tab.';
})();

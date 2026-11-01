// End-to-end browser smoke: current Fenton edition, keyboard editor, sheets and general edition.
const {chromium}=require('playwright-core');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.avif':'image/avif','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400).end();return}
 const file=path.resolve(root,'.'+pathname,pathname.endsWith('/')?'index.html':'');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end('Missing file');return}res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data)})
});
function checkLetter(bytes,label){
 assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4',label+' PDF header');
 assert.ok(bytes.toString('latin1').includes('/MediaBox [0 0 612 792]'),label+' PDF uses actual-size US Letter (612 by 792 pt)');
 assert.ok(bytes.length>1000,label+' has embedded artwork');
}
async function main(){
 await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:850}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.template-card').count(),14,'Fenton gallery has 14 templates');
  assert.equal(await page.inputValue('#finishedSize'),'2.25','Standard finished size');
  assert.equal(await page.inputValue('#cutSize'),'2.625','Standard paper cut size');
  assert.equal(await page.locator('#uxBeginner').getAttribute('aria-pressed'),'true','Beginner mode is default');
  assert.equal(await page.locator('#advancedTools').isVisible(),false,'Advanced settings begin hidden');
  assert.ok(await page.locator('#beginTopText').isVisible(),'Main curved text visible to beginners');
  assert.ok(await page.locator('#beginBottomText').isVisible(),'Bottom curved text visible to beginners');
  assert.equal(await page.locator('#centerLogoChoice').count(),0,'Obsolete center logo control removed');
  assert.equal(await page.locator('#centerSize').count(),0,'Obsolete center size control removed');
  const gallery=JSON.parse(fs.readFileSync(path.join(root,'logos','catalog.json'),'utf8'));
  const publicArt=JSON.parse(fs.readFileSync(path.join(root,'approved-art','catalog.json'),'utf8'));
  const totalGalleryImages=gallery.images.length+publicArt.images.length;
  await page.waitForFunction(count=>document.querySelectorAll('#uxLogoGroups .studio-logo-card').length===count,totalGalleryImages,{timeout:20000});
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card').count(),totalGalleryImages,'Single gallery loads team and approved public images');

  // Desktop uses three genuine columns, and all property actions reuse existing controls.
  assert.equal(await page.locator('#propertiesPanel').count(),1,'Properties panel exists once');
  assert.equal(await page.locator('#mobilePropertiesActions').isVisible(),false,'Desktop keeps the persistent right column without mobile buttons');
  assert.equal(await page.locator('#propertiesPanel').isVisible(),true,'Desktop Properties and Layers remain expanded');
  assert.equal(await page.locator('#propertiesEditor').isVisible(),true,'Desktop shows selected item editing');
  assert.equal(await page.locator('#propertiesLayers').isVisible(),true,'Desktop shows all layers');
  assert.equal(await page.locator('#quickPanel').count(),1,'Existing context controls are not duplicated');
  assert.equal(await page.locator('#propertiesPanel #quickPanel').count(),1,'Selected-item editor moved to properties');
  assert.equal(await page.locator('#propertiesPanel .studio-layers').count(),1,'Existing layer manager moved to properties');
  assert.equal(await page.locator('#propertiesPanel #designWarnings').count(),1,'Actual design warnings moved to properties');
  assert.equal(await page.locator('#propertiesPanel #openPrintStudio, #propertiesPanel #saveProject').count(),0,'No printing or saving controls clutter the properties panel');
  assert.equal(await page.locator('#printTools #openPrintStudio').count(),1,'Actual Print Studio action belongs to Print tab');
  assert.equal(await page.locator('#printTools #saveProject').count(),1,'Original Save control belongs to Print tab');
  assert.equal(await page.locator('#printTools #exportProject').count(),1,'Editable project export belongs to Print tab');
  assert.equal(await page.locator('#printTools #importProject').count(),1,'Editable project import belongs to Print tab');
  assert.equal(await page.locator('#printTools #downloadPng').count(),1,'PNG download belongs to Print tab');
  assert.equal(await page.locator('#printSaveMenu').count(),1,'Save & Export section belongs to Print tab');
  assert.equal(await page.locator('#propertiesFinish, #propertiesSaveMenu, #propertiesPrintAction').count(),0,'Obsolete finish section is removed');
  assert.equal(await page.locator('#openPrintStudio').isVisible(),false,'Print Studio is hidden while editing');
  assert.equal(await page.locator('#saveProject').isVisible(),false,'Save actions are hidden while editing');
  const desktopLayout=await page.evaluate(()=>{
    const r=id=>document.querySelector(id).getBoundingClientRect();
    const left=r('#designTools'),center=r('.previewPanel'),right=r('#propertiesPanel');
    return {left:left.x,center:center.x,right:right.x,rightEnd:right.right,viewport:innerWidth};
  });
  assert.ok(desktopLayout.left<desktopLayout.center&&desktopLayout.center<desktopLayout.right&&desktopLayout.rightEnd<=desktopLayout.viewport,'Desktop layout has left, middle, right columns');
  await page.locator('[data-prop-select="top"]').click();
  assert.equal(await page.locator('[data-prop-select="top"]').getAttribute('aria-pressed'),'true','Top text is selected from layer list');
  assert.equal(await page.locator('#quickText').count(),1,'Text editor appears in right column');
  await page.locator('#quickText').fill('PANEL TEST');
  assert.equal(await page.inputValue('#headline'),'PANEL TEST','Right-side text editor updates real button text');
  await page.locator('[data-prop-select="background"]').click();
  assert.equal(await page.locator('#quickBackground').count(),1,'Background color editor appears in properties');
  assert.equal(await page.locator('[data-prop-select="background"]').getAttribute('aria-pressed'),'true','Background selection visible');
  assert.equal(await page.locator('#printSaveMenu').count(),1,'Save & Export actions use one Print-tab disclosure');

  await page.locator('#beginTopText').fill('FENTON ROBOTICS');
  await page.locator('#beginBottomText').fill('TIGER PRIDE');
  assert.equal(await page.inputValue('#headline'),'FENTON ROBOTICS','Main beginner field updates canvas control');
  assert.equal(await page.inputValue('#subline'),'TIGER PRIDE','Bottom beginner field updates canvas control');
  assert.ok((await page.locator('#beginTopCount').textContent()).includes('15 / 28'),'Character counter updates');
  await page.locator('#beginTopText').fill('1234567890123456789012345678');
  assert.ok((await page.locator('#beginTopCount').textContent()).includes('Maximum reached'),'Length limit is visible');
  assert.ok((await page.locator('#designWarnings').textContent()).match(/shrinks|border ring/),'Long arc text warns about print');
  await page.locator('#beginTopText').fill('FENTON ROBOTICS');

  // Return to the editor's normal unselected state before testing layer cycling.
  await page.evaluate(()=>window.ButtonStudioUX.selectElement(null));
  const canvas=page.locator('#editorCanvas');await canvas.focus();
  await canvas.press('Enter');assert.equal(await page.evaluate(()=>window.ButtonStudioUX.getState().selected.kind),'background','Enter selects background');
  await canvas.press('Enter');assert.equal(await page.evaluate(()=>window.ButtonStudioUX.getState().selected.kind),'top','Enter cycles to top text');
  const beforeMove=await page.evaluate(()=>uxText.top.angle);
  await canvas.press('ArrowRight');const afterMove=await page.evaluate(()=>uxText.top.angle);
  assert.ok(afterMove>beforeMove,'Arrow key moves curved text');
  await canvas.press('Shift+ArrowRight');
  assert.ok((await page.evaluate(()=>uxText.top.angle))-afterMove>.01,'Shift+arrow increases movement');
  await canvas.press(']');assert.equal(await page.evaluate(()=>window.ButtonStudioUX.getState().selected.kind),'bottom','Bracket cycles layers');
  const before=await page.evaluate(()=>({top:{...uxText.top},bottom:{...uxText.bottom}}));
  await page.locator('.template-card[data-template="orangeRing"]').click();
  assert.equal(await page.inputValue('#headline'),'FENTON ROBOTICS','Switching templates retains main text');
  assert.equal(await page.inputValue('#subline'),'TIGER PRIDE','Switching templates retains bottom text');
  assert.deepEqual(await page.evaluate(()=>({top:{...uxText.top},bottom:{...uxText.bottom}})),before,'Switching templates retains text positions');
  await page.click('#uxUndo');assert.ok((await page.locator('#historyFeedback').textContent()).includes('Undo'),'Undo status is separate and visible');
  await page.click('#uxRedo');assert.ok((await page.locator('#historyFeedback').textContent()).includes('Redo'),'Redo status is separate and visible');

  await page.click('#uxAdvanced');
  assert.ok(await page.locator('#advancedTools').isVisible(),'Advanced mode shows precise settings');
  assert.ok(await page.locator('label[for="borderColor"]').count(),'Border color select has a label');
  await page.locator('#bgColor').evaluate(el=>{el.value='#ffffff';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#textColor').evaluate(el=>{el.value='#f58220';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.ok((await page.locator('#designWarnings').textContent()).includes('Low text contrast'),'WCAG contrast warning appears in design preview');

  await page.click('#tab-logos');
  await page.waitForFunction(()=>{
    const gallery=document.querySelector('#logosTools .studio-logo-library');
    const rect=gallery?.getBoundingClientRect();
    return !!rect&&rect.top>=0&&rect.top<innerHeight/2;
  },null,{timeout:5000});
  assert.equal(await page.locator('#uxLogoSearch').isVisible(),true,'Logos tab opens directly to the searchable gallery');
  assert.equal(await page.locator('#openPrintStudio').isVisible(),false,'Print Studio is not shown in Logos');
  assert.equal(await page.locator('#saveProject').isVisible(),false,'Save actions are not shown in Logos');
  assert.ok(await page.locator('#logosTools .studio-logo-library').evaluate(el=>el.compareDocumentPosition(document.querySelector('#uxLogoGroups'))===16||el.contains(document.querySelector('#uxLogoGroups'))),'Gallery entries stay inside Logos tab');
  // A single searchable gallery presents logos and reviewed public art as categories.
  assert.equal(publicArt.images.length,20,'Gallery includes 18 starter illustrations and two coach-approved Fenton tiger mascots');
  assert.equal(await page.locator('#uxLogoSearch').count(),1,'One gallery search box');
  assert.equal(await page.locator('#uxLogoCategory').count(),1,'One gallery category dropdown');
  assert.equal(await page.locator('#approvedArtSearch, #approvedArtCategory, .studio-approved-art').count(),0,'No duplicate public-art panel');

  // Student-requested tiger pictures are one tap away, separate from team emblems.
  assert.equal(await page.locator('.studio-tiger-shortcuts').count(),1,'One prominent tiger artwork shortcut group');
  await page.locator('[data-tiger-shortcut="pictures"]').click();
  assert.equal(await page.inputValue('#uxLogoSearch'),'tiger','Tiger pictures search is set automatically');
  assert.equal(await page.inputValue('#uxLogoCategory'),'All','Tiger pictures includes both school logos and curated mascot art');
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card').count(),4,'Tiger pictures shows both existing school illustrations and two new mascot designs');
  assert.equal(await page.locator('.studio-logo-card[data-path="logos/school-logos/images.jpeg"]').count(),1,'Roaring tiger illustration is immediately findable');
  assert.equal(await page.locator('.studio-logo-card[data-path="logos/school-logos/SE-Logo_medium.png"]').count(),1,'Tiger head illustration is immediately findable');
  assert.equal(await page.locator('.studio-logo-card[data-path="approved-art/images/fenton-tiger-roar.svg"]').count(),1,'New roaring Fenton mascot is immediately findable');
  assert.equal(await page.locator('.studio-logo-card[data-path="approved-art/images/fenton-tiger-flame.svg"]').count(),1,'New flame-stripe Fenton mascot is immediately findable');
  for(const id of ['fenton-tiger-roar','fenton-tiger-flame']){
    const img=page.locator(`.studio-logo-card[data-path="approved-art/images/${id}.svg"] img`);
    await img.evaluate(async element=>{if(!element.complete)await new Promise((resolve,reject)=>{element.addEventListener('load',resolve,{once:true});element.addEventListener('error',reject,{once:true});})});
    assert.ok(await img.evaluate(el=>el.naturalWidth>100),id+' is a real visible image, not an empty placeholder');
  }
  assert.equal(await page.locator('[data-tiger-shortcut="pictures"]').getAttribute('aria-pressed'),'true','Tiger pictures shortcut announces selection');
  await page.locator('[data-tiger-shortcut="teams"]').click();
  assert.equal(await page.inputValue('#uxLogoCategory'),'Robotics Teams','Team shortcut switches to robotics logos');
  assert.ok(await page.locator('#uxLogoGroups .studio-logo-card').count()>4,'Team shortcut shows multiple tiger team logos');
  await page.locator('[data-tiger-shortcut="all"]').click();
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card').count(),totalGalleryImages,'All images restores the complete gallery');
  await page.locator('[data-tiger-shortcut="pictures"]').click();
  await page.locator('#uxLogoSearch').fill('microscope');
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card').count(),1,'Manual search clears tiger-only filter and finds the microscope');
  await page.locator('[data-tiger-shortcut="all"]').click();
  await page.selectOption('#uxLogoCategory','Public Images');
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card').count(),20,'Public Images filter shows all 20 reviewed illustrations');
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-group').count(),1,'Public Images has one grouped section');
  await page.locator('#uxLogoSearch').fill('Science');
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card').count(),3,'Public art topic remains searchable within shared gallery');
  await page.locator('#uxLogoSearch').fill('microscope');
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card').count(),1,'Keyword search finds public illustration');
  await page.locator('#uxLogoSearch').fill('');
  const beforePublicLayer=await page.evaluate(()=>layers.length);
  await page.locator('#uxLogoGroups .studio-logo-card[data-path="approved-art/images/robot.svg"]').click();
  await page.waitForFunction(previous=>window.ButtonStudioUX.getState().layers.length>previous||document.getElementById('uxLogoResults').textContent.startsWith('Could not add'),beforePublicLayer,{timeout:15000});
  assert.ok((await page.evaluate(()=>layers.length))>beforePublicLayer,'Public artwork imported: '+await page.locator('#uxLogoResults').textContent());
  assert.ok((await page.evaluate(()=>layers.at(-1).data)).startsWith('data:image/png'),'SVG public art is converted into editable PNG layer');
  assert.ok((await page.locator('#uxLogoResults').textContent()).includes('Robot'),'Shared gallery reports insertion');
  assert.equal(await page.locator('#propertiesPanel #quickImageSize').count(),1,'Selected public artwork is editable in the new properties panel');
  assert.equal(await page.locator('#propertiesPanel .studio-layer-row').count(),1,'Image layer appears in right-hand layer manager');

  assert.equal(await page.locator('#uxLogoGroups .public-art-choice').count(),20,'Each curated SVG including two Fenton mascots has a color picker');
  const robot=page.locator('.public-art-choice').filter({has:page.locator('button[data-path="approved-art/images/robot.svg"]')});
  assert.deepEqual(await robot.locator('.public-art-color option').allTextContents(),['Original','Black','Orange','White'],'Public art offers original + the three team colors');
  // Pixel-level verification: same tint is visible in card preview, editable layer and PDF source.
  async function sampleArtwork(imageData){
    return await page.evaluate(async data=>{
      const im=new Image();im.src=data;await im.decode();
      const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;
      const ctx=cv.getContext('2d');ctx.drawImage(im,0,0);
      const bytes=ctx.getImageData(0,0,cv.width,cv.height).data;
      let sample=null,opaque=0,clear=0;
      for(let i=0;i<bytes.length;i+=4){
        if(bytes[i+3]===0)clear++;
        if(bytes[i+3]===255){opaque++;if(!sample)sample=Array.from(bytes.slice(i,i+3))}
      }
      return {sample,opaque,clear};
    },imageData);
  }
  for(const [color,expected] of [['black',[0,0,0]],['orange',[245,130,32]],['white',[255,255,255]]]){
    await robot.locator('.public-art-color').selectOption(color);
    await page.waitForFunction(shade=>{
      const wrap=document.querySelector('.public-art-choice:has(button[data-path="approved-art/images/robot.svg"])');
      const img=wrap?.querySelector('img');return wrap?.dataset.artColor===shade&&img?.dataset.requestedColor===shade&&img.src.startsWith('blob:')&&img.complete&&img.naturalWidth>0;
    },color,{timeout:15000});
    const previewImage=await robot.locator('img').evaluate(img=>img.src);
    const preview=await sampleArtwork(previewImage);
    assert.deepEqual(preview.sample,expected,color+' preview uses selected color');
    assert.ok(preview.opaque>0&&preview.clear>0,color+' preview preserves transparency');
    const previous=await page.evaluate(()=>layers.length);
    await robot.locator('button[data-path]').click();
    await page.waitForFunction(old=>layers.length>old,previous,{timeout:15000});
    const imported=await sampleArtwork(await page.evaluate(()=>layers.at(-1).data));
    assert.deepEqual(imported.sample,expected,color+' button layer uses selected color');
    assert.ok(imported.opaque>0&&imported.clear>0,color+' imported layer retains transparency');
    assert.ok((await page.evaluate(()=>layers.at(-1).name)).includes(color),color+' survives in the layer name');
  }
  await robot.locator('.public-art-color').selectOption('original');
  assert.equal(await robot.locator('img').getAttribute('src'),'approved-art/images/robot.svg','Original restores full-color artwork preview');
  assert.equal(await robot.getAttribute('data-art-color'),'original','Original remains the default mode');

  await page.selectOption('#uxLogoCategory','Robotics Teams');
  assert.ok((await page.locator('#uxLogoGroups .studio-logo-card').count())>0,'Existing team logos remain accessible');
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card[data-path^="approved-art/"]').count(),0,'Team filter excludes public images');

  const beforeTeamLayer=await page.evaluate(()=>layers.length);
  await page.locator('.studio-logo-card[data-path="logos/tiger-paws-24471.png"]').first().click();
  // Wait for the new team logo, not merely any earlier public-art image.
  await page.waitForFunction(previous=>window.ButtonStudioUX.getState().layers.length>previous,beforeTeamLayer,{timeout:15000});
  // Two images have been imported. Select the first explicitly before testing motion,
  // rather than relying on a cycling order influenced by asynchronous layer updates.
  await page.evaluate(()=>window.ButtonStudioUX.selectImage(0));
  assert.deepEqual(await page.evaluate(()=>window.ButtonStudioUX.getState().selected),{kind:'image',index:0},'First image layer is selected');
  const initialImageX=await page.evaluate(()=>layers[0].x);
  await canvas.focus();
  await canvas.press('Shift+ArrowRight');
  assert.ok((await page.evaluate(()=>layers[0].x))>initialImageX,'Keyboard moves selected image');

  // Students can actually add a tiger picture; it becomes an editable image layer.
  await page.locator('[data-tiger-shortcut="pictures"]').click();
  const beforeTiger=await page.evaluate(()=>layers.length);
  await page.locator('.studio-logo-card[data-path="logos/school-logos/SE-Logo_medium.png"]').click();
  await page.waitForFunction(previous=>layers.length>previous||document.getElementById('uxLogoResults').textContent.startsWith('Could not add'),beforeTiger,{timeout:15000});
  assert.equal(await page.evaluate(()=>layers.length),beforeTiger+1,'Tiger head artwork imports onto the button');
  assert.ok((await page.evaluate(()=>layers.at(-1).name)).includes('Tiger Head'),'Imported tiger is labeled clearly');
  assert.equal(await page.locator('#propertiesPanel #quickImageSize').count(),1,'Tiger is editable through existing image size controls');

  // Verify the two newly approved vector designs can be recolored and imported
  // without losing transparency, or affecting Print Studio's raster pipeline.
  for(const id of ['fenton-tiger-roar','fenton-tiger-flame']){
    await page.locator('[data-tiger-shortcut="pictures"]').click();
    const selector=`.studio-logo-card[data-path="approved-art/images/${id}.svg"]`;
    const choice=page.locator('.public-art-choice').filter({has:page.locator(selector)});
    assert.equal(await choice.locator('.public-art-color').count(),1,id+' includes recolor control');
    await choice.locator('.public-art-color').selectOption('orange');
    await page.waitForFunction(id=>{
      const img=document.querySelector(`.studio-logo-card[data-path="approved-art/images/${id}.svg"] img`);
      return !!img&&img.dataset.requestedColor==='orange'&&img.complete&&img.naturalWidth>0&&img.src.startsWith('blob:');
    },id,{timeout:15000});
    const previous=await page.evaluate(()=>layers.length);
    await page.locator(selector).click();
    await page.waitForFunction(old=>layers.length>old||document.getElementById('uxLogoResults').textContent.startsWith('Could not add'),previous,{timeout:15000});
    assert.equal(await page.evaluate(()=>layers.length),previous+1,id+' imports onto the editable button');
    assert.ok((await page.evaluate(()=>layers.at(-1).data)).startsWith('data:image/png'),id+' is converted to printable PNG pixels');
    assert.ok((await page.evaluate(()=>layers.at(-1).name)).includes('orange'),id+' keeps its selected orange variant');
  }

  await page.locator('#tab-print').click();
  assert.equal(await page.locator('#legacyPrint').count(),0,'Fenton print tools are directly visible');
  assert.equal(await page.locator('#openPrintStudio').isVisible(),true,'Print Studio is the primary Print-tab action');
  assert.equal(await page.locator('#printSaveMenu summary').isVisible(),true,'Save & Export is available in Print');
  assert.equal(await page.locator('#uxLogoSearch').isVisible(),false,'Image gallery is hidden in Print tab');
  await page.locator('#printSaveMenu summary').click();
  assert.equal(await page.locator('#saveProject').isVisible(),true,'Save is available when Save & Export expands');
  assert.equal(await page.locator('#exportProject').isVisible(),true,'Project export is available in Print');
  const [editableProject]=await Promise.all([page.waitForEvent('download'),page.locator('#exportProject').click()]);
  const saved=JSON.parse(fs.readFileSync(await editableProject.path(),'utf8'));
  assert.ok(saved&&typeof saved==='object','Existing editable project export still downloads valid JSON');
  await page.locator('#printSaveMenu summary').click();
  await page.selectOption('#copies','6');
  assert.ok((await page.locator('#sheetStatus').textContent()).includes('6 of 6 buttons shown'),'Legacy preview agrees with six-button selection');
  assert.deepEqual(await page.evaluate(()=>{const p=sheetDisplayLayout(selectedCut(),6);return [p.cols,p.rows]}),[2,3],'Six circles use full-height 2×3 grid');
  const [legacyPdf]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadPdf').click()]);
  checkLetter(fs.readFileSync(await legacyPdf.path()),'Six-button sheet');

  await page.selectOption('#copies','9');
  assert.ok((await page.locator('#sheetStatus').textContent()).includes('9 of 9 buttons shown'),'Nine buttons selectable and previewed');
  assert.deepEqual(await page.evaluate(()=>{const p=sheetDisplayLayout(selectedCut(),9);return [p.cols,p.rows]}),[3,3],'Nine circles use 3×3 grid');
  const [ninePdf]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadPdf').click()]);
  checkLetter(fs.readFileSync(await ninePdf.path()),'Nine-button sheet');

  await page.click('#openPrintStudio');
  assert.equal(await page.inputValue('#psCopies'),'9','Print Studio quantity synchronizes with editor');
  assert.ok((await page.locator('#psWarnings').textContent()).includes('Low text contrast'),'Print Studio shows non-blocking contrast warning');
  assert.ok((await page.locator('#propertiesCheckSummary').textContent()).includes('Check the design notes'),'Right-column design check reflects contrast warning');

  await page.selectOption('#psCopies','6');
  assert.equal(await page.locator('#psPage').textContent(),'Page 1 of 1','Six buttons fit on one page');
  const [studioPdf]=await Promise.all([page.waitForEvent('download'),page.click('#psDownloadSingle')]);
  checkLetter(fs.readFileSync(await studioPdf.path()),'Print Studio');
  await page.click('#psMixedTab');await page.click('#psAddCurrent');
  await page.waitForFunction(()=>document.querySelectorAll('.ps-queue-row').length===1,null,{timeout:15000});
  const [mixedPdf]=await Promise.all([page.waitForEvent('download'),page.click('#psDownloadMixed')]);
  checkLetter(fs.readFileSync(await mixedPdf.path()),'Classroom sheet');
  await page.click('#psClose');
  await page.screenshot({path:path.join(__dirname,'browser-preview.png')});

  // Short mobile screens show the entire editable button without scrolling past
  // the header, toolbar, status, or into the image. Controls remain below it.
  const phone=await context.newPage(),phoneErrors=[];
  phone.on('pageerror',err=>phoneErrors.push(err.message));
  for(const [width,height] of [[320,568],[360,640],[375,500],[390,667],[700,500]]){
    await phone.setViewportSize({width,height});
    await phone.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
    const m=await phone.evaluate(()=>{
      const rect=selector=>{const e=document.querySelector(selector);const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width}};
      return {canvas:rect('#editorCanvas'),wrap:rect('.canvasWrap'),
        tools:rect('.studio-toolbar'),tabs:rect('.editor-tabs'),header:rect('header'),
        docWidth:document.documentElement.scrollWidth,viewWidth:innerWidth,viewHeight:innerHeight,
        heading:rect('.previewPanel h2'),
        flexDebug:{appDisplay:getComputedStyle(document.querySelector('.app')).display,
          wrapperParent:document.getElementById('previewWorkspace').parentElement?.id||document.getElementById('previewWorkspace').parentElement?.tagName,
          children:[...document.querySelector('.app').children].map(node=>({tag:node.tagName,id:node.id,className:node.className,order:getComputedStyle(node).order,top:Math.round(node.getBoundingClientRect().top)}))}
      };
    });
    assert.ok(m.canvas.width>=110,`Canvas stays usable on ${width}×${height}: ${JSON.stringify(m)}`);
    assert.ok(m.canvas.bottom<=m.viewHeight-8,`Full button visible without vertical scrolling on ${width}×${height}: ${JSON.stringify(m)}`);
    assert.ok(m.tools.top>=m.canvas.bottom,`Editing toolbar follows mobile preview at ${width}×${height}`);
    assert.ok(m.canvas.top>=m.heading.bottom,`Preview title precedes canvas at ${width}×${height}`);
    assert.ok(m.header.bottom<m.tabs.top,`Header and tabs do not overlap at ${width}×${height}`);
    assert.ok(m.docWidth<=m.viewWidth,`No horizontal overflow at ${width}×${height}: ${JSON.stringify(m)}`);
    const mobileLayout=await phone.evaluate(()=>({
      previewBottom:document.querySelector('.previewPanel').getBoundingClientRect().bottom,
      buttonsTop:document.querySelector('#mobilePropertiesActions').getBoundingClientRect().top,
      drawerOpen:document.querySelector('#propertiesPanel').dataset.drawerOpen,
      inert:document.querySelector('#propertiesPanel').inert,
      backdropHidden:document.querySelector('#propertiesBackdrop').hidden
    }));
    assert.ok(mobileLayout.buttonsTop>=mobileLayout.previewBottom,'On phones, edit buttons are immediately below the preview');
    assert.equal(mobileLayout.drawerOpen,'false','Mobile drawer starts closed');
    assert.equal(mobileLayout.inert,true,'Closed drawer is not keyboard focusable');
    assert.equal(mobileLayout.backdropHidden,true,'Closed drawer has no backdrop');
    assert.ok(await phone.locator('#mobileEditButton').isVisible(),'Edit Selected action appears on phones');
    assert.ok(await phone.locator('#mobileLayersButton').isVisible(),'Layers action appears on phones');
    assert.equal(await phone.locator('#propertiesPanel').isVisible(),false,'Expanded properties do not push gallery down on phones');

    assert.equal(await phone.locator('#uxUndo').count(),1,'Undo is kept on mobile');
    assert.equal(await phone.locator('#tab-logos').isVisible(),true,'Gallery tab is accessible on mobile');
    if(width===360){
      await phone.locator('#mobileEditButton').click();
      const drawerDebug=await phone.evaluate(()=>{const p=document.getElementById('propertiesPanel'),css=getComputedStyle(p),r=p.getBoundingClientRect();return {state:p.dataset.drawerOpen,view:p.dataset.mobileView,inert:p.inert,visible:css.visibility,display:css.display,transform:css.transform,left:r.left,top:r.top,width:r.width,height:r.height,body:document.body.className,matched:matchMedia('(max-width:1119px)').matches,overlay:document.getElementById('propertiesBackdrop').hidden}});
      assert.ok(await phone.locator('#propertiesPanel').isVisible(),'Edit action opens the existing editing panel: '+JSON.stringify(drawerDebug));
      assert.equal(await phone.locator('#propertiesPanel').getAttribute('role'),'dialog','Mobile panel is an accessible dialog');
      assert.equal(await phone.locator('#propertiesPanel').getAttribute('aria-modal'),'true','Mobile drawer is modal');
      assert.ok(await phone.locator('#propertiesEditor').isVisible(),'Edit opens selected-item properties');
      assert.equal(await phone.locator('#propertiesLayers').isVisible(),false,'Layers are initially hidden while editing');
      assert.equal(await phone.locator('#mobileEditButton').getAttribute('aria-expanded'),'true','Edit button reports open state');
      assert.equal(await phone.locator('#propertiesBackdrop').isVisible(),true,'Opened drawer has dismissible backdrop');
      await phone.keyboard.press('Escape');
      assert.equal(await phone.locator('#propertiesPanel').isVisible(),false,'Escape closes the drawer');
      assert.equal(await phone.locator('#mobileEditButton').getAttribute('aria-expanded'),'false','Escape resets edit button state');
      assert.equal(await phone.evaluate(()=>document.activeElement?.id),'mobileEditButton','Escape restores focus to drawer opener');

      await phone.locator('#mobileLayersButton').click();
      assert.ok(await phone.locator('#propertiesLayers').isVisible(),'Layers action opens the real layer list');
      assert.equal(await phone.locator('#propertiesEditor').isVisible(),false,'Layers view hides selected-item editor');
      await phone.locator('#propertiesLayers [data-prop-select="top"]').click();
      assert.ok(await phone.locator('#propertiesEditor').isVisible(),'Selecting a layer switches back to its editing controls');
      assert.equal(await phone.locator('#quickText').isVisible(),true,'Selected text is editable inside the drawer');
      await phone.locator('#quickText').fill('MOBILE PANEL');
      assert.equal(await phone.inputValue('#headline'),'MOBILE PANEL','Drawer controls edit the actual canvas text');
      await phone.locator('#propertiesClose').click();
      assert.equal(await phone.locator('#propertiesPanel').isVisible(),false,'Close button dismisses the drawer');
      assert.equal(await phone.evaluate(()=>document.activeElement?.id),'mobileEditButton','Close restores focus after editing');
      await phone.locator('#mobileLayersButton').click();
      await phone.locator('#propertiesBackdrop').click({position:{x:5,y:5}});
      assert.equal(await phone.locator('#propertiesPanel').isVisible(),false,'Tapping backdrop dismisses layer drawer');
      await phone.locator('#mobileEditButton').click();
      await phone.locator('#propertiesClose').focus();
      await phone.keyboard.press('Shift+Tab');
      assert.equal(await phone.locator('#propertiesPanel').isVisible(),true,'Keyboard focus remains inside the open drawer');
      assert.equal(await phone.evaluate(()=>document.querySelector('#propertiesPanel').contains(document.activeElement)),true,'Keyboard focus stays trapped in the dialog');
      await phone.keyboard.press('Escape');

      await phone.locator('#tab-logos').click();
      await phone.waitForFunction(()=>{
        const box=document.querySelector('#logosTools .studio-logo-library')?.getBoundingClientRect();
        return box&&box.top>=0&&box.top<150;
      },null,{timeout:5000});
      assert.equal(await phone.locator('#uxLogoSearch').isVisible(),true,'Mobile Logos jumps to the image search');
      assert.equal(await phone.locator('#openPrintStudio').isVisible(),false,'Mobile Logos excludes Print Studio');
      await phone.locator('#tab-print').click();
      await phone.waitForFunction(()=>{
        const box=document.querySelector('#printPrimaryActions')?.getBoundingClientRect();
        return box&&box.top>=0&&box.top<150;
      },null,{timeout:5000});
      assert.equal(await phone.locator('#openPrintStudio').isVisible(),true,'Mobile Print jumps to printing actions');
    }
  }
  // The same preview-first behavior applies beyond phone sizes: tablets,
  // compact laptops, wide desktops and short browser windows.
  for(const [width,height] of [[701,500],[768,600],[930,650],[1024,600],[1280,720],[1440,800],[1920,1080]]){
    await phone.setViewportSize({width,height});
    await phone.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
    const m=await phone.evaluate(()=>{
      const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width}};
      return {header:rect('header'),tabs:rect('.editor-tabs'),heading:rect('.previewPanel h2'),
        canvas:rect('#editorCanvas'),tools:rect('.studio-toolbar'),
        docWidth:document.documentElement.scrollWidth,viewWidth:innerWidth,viewHeight:innerHeight};
    });
    assert.ok(m.canvas.width>=140,`Canvas is large enough at ${width}×${height}: ${JSON.stringify(m)}`);
    assert.ok(m.canvas.bottom<=m.viewHeight-8,`Button preview entirely visible at ${width}×${height}: ${JSON.stringify(m)}`);
    assert.ok(m.tools.top>=m.canvas.bottom,`Undo/Redo follows button preview at ${width}×${height}`);
    assert.ok(m.canvas.top>=m.heading.bottom,`Heading is above canvas at ${width}×${height}`);
    assert.ok(m.header.bottom<m.tabs.top,`Header remains clear of tab bar at ${width}×${height}`);
    assert.ok(m.docWidth<=m.viewWidth,`No horizontal scrolling at ${width}×${height}: ${JSON.stringify(m)}`);
    if(width>=701&&width<=1119){
      assert.ok(await phone.locator('#mobileEditButton').isVisible(),'Tablet has on-demand editing controls');
      assert.equal(await phone.locator('#propertiesPanel').isVisible(),false,'Tablet properties do not consume preview space when closed');
      await phone.locator('#mobileLayersButton').click();
      await phone.waitForFunction(()=>{
        const rect=document.getElementById('propertiesPanel').getBoundingClientRect();
        return rect.right<=innerWidth+1&&rect.width<innerWidth;
      },null,{timeout:3000});
      const tabletDrawer=await phone.evaluate(()=>({
        edge:document.getElementById('propertiesPanel').getBoundingClientRect().right,
        width:document.getElementById('propertiesPanel').getBoundingClientRect().width,
        viewWidth:innerWidth
      }));
      assert.ok(tabletDrawer.edge<=tabletDrawer.viewWidth+1&&tabletDrawer.width<tabletDrawer.viewWidth,'Tablet drawer opens at right without covering entire screen');
      await phone.keyboard.press('Escape');
      assert.equal(await phone.locator('#propertiesPanel').isVisible(),false,'Tablet drawer closes on Escape');
    }else{
      assert.equal(await phone.locator('#mobileEditButton').isVisible(),false,'Desktop keeps dedicated right column');
      assert.equal(await phone.locator('#propertiesEditor').isVisible(),true,'Desktop editing panel remains visible');
    }
  }
  for(const [width,height] of [[1024,600],[1440,800]]){
    await phone.setViewportSize({width,height});
    await phone.goto('http://127.0.0.1:8765/studio/',{waitUntil:'networkidle'});
    const m=await phone.evaluate(()=>({
      canvasBottom:document.querySelector('#editorCanvas').getBoundingClientRect().bottom,
      toolbarTop:document.querySelector('.studio-toolbar').getBoundingClientRect().top,
      viewportHeight:innerHeight,viewWidth:innerWidth,docWidth:document.documentElement.scrollWidth
    }));
    assert.ok(m.canvasBottom<=m.viewportHeight-8,`General edition preview fits ${width}×${height}: ${JSON.stringify(m)}`);
    assert.ok(m.toolbarTop>=m.canvasBottom,`General edition toolbar follows preview at ${width}×${height}`);
    assert.ok(m.docWidth<=m.viewWidth,`General edition has no horizontal overflow at ${width}×${height}`);
  }
  await phone.setViewportSize({width:360,height:640});
  await phone.goto('http://127.0.0.1:8765/studio/',{waitUntil:'networkidle'});
  const generalPhone=await phone.evaluate(()=>({
    canvasBottom:document.getElementById('editorCanvas').getBoundingClientRect().bottom,
    toolbarTop:document.querySelector('.studio-toolbar').getBoundingClientRect().top,
    canvasBottomForOrder:document.getElementById('editorCanvas').getBoundingClientRect().bottom,
    viewportHeight:innerHeight,docWidth:document.documentElement.scrollWidth,viewWidth:innerWidth
  }));
  assert.ok(generalPhone.canvasBottom<=generalPhone.viewportHeight-8,'General edition button preview also fits a phone viewport');
  assert.ok(generalPhone.toolbarTop>=generalPhone.canvasBottomForOrder,'General edition has its editing toolbar below the preview');
  assert.ok(generalPhone.docWidth<=generalPhone.viewWidth,'General edition avoids horizontal overflow');
  assert.deepEqual(phoneErrors,[],'No JavaScript errors on mobile Fenton and General editions');
  await phone.close();

  const general=await context.newPage(),generalErrors=[];general.on('pageerror',err=>generalErrors.push(err.message));
  await general.goto('http://127.0.0.1:8765/studio/',{waitUntil:'networkidle'});
  assert.equal(await general.locator('.template-card').count(),6,'General edition keeps six neutral templates');
  assert.equal(await general.locator('.studio-logo-card').count(),0,'General edition has no Fenton artwork');
  assert.equal(await general.locator('#uxLogoCategory').count(),0,'General edition does not load the Fenton category gallery');
  const genericHeadline=await general.inputValue('#headline');
  await general.locator('.template-card[data-template="paw"]').click();
  assert.equal(await general.inputValue('#headline'),genericHeadline,'General edition also preserves user text');
  await general.click('#openPrintStudio');
  const [generalPdf]=await Promise.all([general.waitForEvent('download'),general.click('#psDownloadSingle')]);
  checkLetter(fs.readFileSync(await generalPdf.path()),'General edition');
  assert.deepEqual(generalErrors,[],'No JavaScript errors in General edition');
  assert.deepEqual(errors,[],'No JavaScript errors in Fenton edition');
  await context.close();
  console.log('PASS: browser smoke (14 templates, text retention/counters, keyboard, contrast, six/nine sheets, actual-size PDFs, mixed sheets, General edition)');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(error=>{console.error(error);process.exitCode=1});

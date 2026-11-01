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
  assert.equal(await page.locator('#quickPanel').count(),1,'Existing context controls are not duplicated');
  assert.equal(await page.locator('#propertiesPanel #quickPanel').count(),1,'Selected-item editor moved to properties');
  assert.equal(await page.locator('#propertiesPanel .studio-layers').count(),1,'Existing layer manager moved to properties');
  assert.equal(await page.locator('#propertiesPanel #designWarnings').count(),1,'Actual design warnings moved to properties');
  assert.equal(await page.locator('#propertiesPanel #openPrintStudio').count(),1,'Actual Print Studio button moved to properties');
  assert.equal(await page.locator('#propertiesPanel #saveProject').count(),1,'Save control is in right column');
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
  assert.equal(await page.locator('#propertiesSaveMenu').count(),1,'Save/Export actions are in one disclosure');

  await page.locator('#beginTopText').fill('FENTON ROBOTICS');
  await page.locator('#beginBottomText').fill('TIGER PRIDE');
  assert.equal(await page.inputValue('#headline'),'FENTON ROBOTICS','Main beginner field updates canvas control');
  assert.equal(await page.inputValue('#subline'),'TIGER PRIDE','Bottom beginner field updates canvas control');
  assert.ok((await page.locator('#beginTopCount').textContent()).includes('15 / 28'),'Character counter updates');
  await page.locator('#beginTopText').fill('1234567890123456789012345678');
  assert.ok((await page.locator('#beginTopCount').textContent()).includes('Maximum reached'),'Length limit is visible');
  assert.ok((await page.locator('#designWarnings').textContent()).match(/shrinks|border ring/),'Long arc text warns about print');
  await page.locator('#beginTopText').fill('FENTON ROBOTICS');

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
  // A single searchable gallery presents logos and reviewed public art as categories.
  assert.equal(publicArt.images.length,18,'Starter public art includes 18 reviewed illustrations');
  assert.equal(await page.locator('#uxLogoSearch').count(),1,'One gallery search box');
  assert.equal(await page.locator('#uxLogoCategory').count(),1,'One gallery category dropdown');
  assert.equal(await page.locator('#approvedArtSearch, #approvedArtCategory, .studio-approved-art').count(),0,'No duplicate public-art panel');
  await page.selectOption('#uxLogoCategory','Public Images');
  assert.equal(await page.locator('#uxLogoGroups .studio-logo-card').count(),18,'Public Images filter shows only reviewed art');
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

  assert.equal(await page.locator('#uxLogoGroups .public-art-choice').count(),18,'Each curated SVG has a color picker');
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

  await page.locator('#tab-print').click();
  assert.equal(await page.locator('#legacyPrint').count(),0,'Fenton print tools are directly visible');
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
        heading:rect('.previewPanel h2')};
    });
    assert.ok(m.canvas.width>=110,`Canvas stays usable on ${width}×${height}: ${JSON.stringify(m)}`);
    assert.ok(m.canvas.bottom<=m.viewHeight-8,`Full button visible without vertical scrolling on ${width}×${height}: ${JSON.stringify(m)}`);
    assert.ok(m.tools.top>=m.canvas.bottom,`Editing toolbar follows mobile preview at ${width}×${height}`);
    assert.ok(m.canvas.top>=m.heading.bottom,`Preview title precedes canvas at ${width}×${height}`);
    assert.ok(m.header.bottom<m.tabs.top,`Header and tabs do not overlap at ${width}×${height}`);
    assert.ok(m.docWidth<=m.viewWidth,`No horizontal overflow at ${width}×${height}: ${JSON.stringify(m)}`);
    const propertyPosition=await phone.evaluate(()=>({
      previewBottom:document.querySelector('.previewPanel').getBoundingClientRect().bottom,
      propertyTop:document.querySelector('#propertiesPanel').getBoundingClientRect().top
    }));
    assert.ok(propertyPosition.propertyTop>=propertyPosition.previewBottom,'On phones, properties stack beneath the preview');

    assert.equal(await phone.locator('#uxUndo').count(),1,'Undo is kept on mobile');
    assert.equal(await phone.locator('#tab-logos').isVisible(),true,'Gallery tab is accessible on mobile');
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

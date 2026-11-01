// End-to-end browser smoke: current Fenton edition, keyboard editor, sheets and general edition.
const {chromium}=require('playwright-core');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.avif':'image/avif'};
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
  await page.waitForFunction(count=>document.querySelectorAll('.studio-logo-card').length===count,gallery.images.length,{timeout:20000});
  assert.equal(await page.locator('.studio-logo-card').count(),gallery.images.length,'Approved image catalog loads');

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

  await page.locator('.studio-logo-card[data-path="logos/tiger-paws-24471.png"]').first().click();
  await page.waitForFunction(()=>window.ButtonStudioUX.getState().layers.length>0,null,{timeout:15000});
  const initialImageX=await page.evaluate(()=>layers[0].x);
  await canvas.focus();
  // The last-added image is selected; use brackets to reach it again through the cycle.
  await canvas.press(']');await canvas.press('[');
  assert.equal(await page.evaluate(()=>window.ButtonStudioUX.getState().selected.kind),'image','Keyboard can select picture layer');
  await canvas.press('Shift+ArrowRight');
  assert.ok((await page.evaluate(()=>layers[0].x))>initialImageX,'Keyboard moves selected image');

  await page.locator('#tab-print').click();
  await page.locator('#legacyPrint > summary').click();
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

  const general=await context.newPage(),generalErrors=[];general.on('pageerror',err=>generalErrors.push(err.message));
  await general.goto('http://127.0.0.1:8765/studio/',{waitUntil:'networkidle'});
  assert.equal(await general.locator('.template-card').count(),6,'General edition keeps six neutral templates');
  assert.equal(await general.locator('.studio-logo-card').count(),0,'General edition has no Fenton artwork');
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

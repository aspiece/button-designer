// Browser smoke tests for a school-use installation. Requires playwright-core and Chrome.
const { chromium } = require('playwright-core');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.png':'image/png','.avif':'image/avif','.svg':'image/svg+xml','.css':'text/css'};
const server = http.createServer((req,res)=>{
  let url;
  try{url=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400).end();return}
  const target=path.resolve(root,'.'+url,(url.endsWith('/')?'index.html':''));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(target,(err,data)=>{
    if(err){res.writeHead(404).end('Missing file');return}
    res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream','cache-control':'no-store'});res.end(data)
  })
});
async function main(){
await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
let browser;
try{
browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:850}});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
assert.equal(await page.locator('.template-card').count(),6,'Visual template gallery');
assert.equal(await page.locator('.studio-logo-card').count(),10,'Ten named Fenton logo thumbnails');
assert.equal(await page.locator('#uxBeginner').getAttribute('aria-pressed'),'true','Beginner mode is default');
assert.equal(await page.locator('#advancedTools').isVisible(),false,'Advanced settings are initially hidden');
await page.locator('#uxLogoSearch').fill('31558');
assert.equal(await page.locator('.studio-logo-card:visible').count(),1,'Search filters logos by number');
await page.locator('#uxLogoSearch').fill('');
assert.equal(await page.locator('.studio-logo-card:visible').count(),10,'Clearing search restores logos');
await page.click('#uxAdvanced');
assert.equal(await page.locator('#advancedTools').isVisible(),true,'Advanced mode reveals settings');
assert.equal(await page.locator('canvas#editorCanvas').isVisible(),true,'Canvas is visible');
const expected={paw:['#f58220','paw'],tiger:['#111111','paw'],titanium:['#111111','t'],blank:['#ffffff','none'],orange:['#f58220','none'],black:['#111111','none']};
for(const [template,[bg,logo]] of Object.entries(expected)){
 await page.selectOption('#theme',template);
 assert.equal(await page.inputValue('#bgColor'),bg,template+' background');
 assert.equal(await page.inputValue('#centerLogoChoice'),logo,template+' center logo');
}
await page.selectOption('#theme','paw');
await page.selectOption('#borderStyle','dashed');
await page.selectOption('#borderColor','#ffffff');
assert.equal(await page.inputValue('#borderColor'),'#ffffff');
await page.selectOption('#teamLogo','tiger-paws-24471');
await page.waitForFunction(()=>document.querySelectorAll('#imageLayer option').length===1&&document.querySelector('#imageLayer option')?.textContent.includes('tiger paws'),null,{timeout:12000});
assert.equal(await page.locator('#cropLogo').isEnabled(),true,'Crop enabled for team logo');
await page.click('#cropLogo');
assert.equal(await page.locator('#cropOverlay').evaluate(el=>el.classList.contains('active')),true);
await page.click('#applyCrop');
await page.waitForFunction(()=>!document.getElementById('cropOverlay').classList.contains('active'));
const [save]=await Promise.all([page.waitForEvent('download'),page.click('#exportProject')]);
assert.ok(save.suggestedFilename().endsWith('.json'));
const json=JSON.parse(fs.readFileSync(await save.path(),'utf8'));
assert.equal(json.layers.length,1,'Editable project includes logo layer');
await page.selectOption('#cutSize','2.5');
await page.selectOption('#copies','6');
const [pdf]=await Promise.all([page.waitForEvent('download'),page.click('#downloadPdf')]);
assert.ok(pdf.suggestedFilename().endsWith('.pdf'));
const pdfData=fs.readFileSync(await pdf.path());
assert.equal(pdfData.subarray(0,8).toString('ascii'),'%PDF-1.4');
assert.ok(pdfData.length>1000,'PDF contains artwork');
// Phase-one interaction tests: gallery, click-to-edit, drag, contextual controls and undo/redo.
await page.click('#uxBeginner');
assert.equal(await page.locator('#advancedTools').isVisible(),false,'Beginner mode hides precision controls');
await page.locator('.template-card[data-template="black"]').click();
assert.equal(await page.inputValue('#theme'),'black','Gallery changes template');
assert.equal(await page.locator('.template-card[data-template="black"]').getAttribute('aria-pressed'),'true','Selected gallery card marked');
await page.click('#uxUndo');
assert.equal(await page.inputValue('#theme'),'paw','Undo restores prior template');
await page.click('#uxRedo');
assert.equal(await page.inputValue('#theme'),'black','Redo restores chosen template');
await page.locator('.template-card[data-template="paw"]').click();
const canvas=page.locator('#editorCanvas');
let b=await canvas.boundingBox();
await page.mouse.click(b.x+b.width*.5,b.y+b.height*.139);
assert.equal(await page.locator('#quickText').isVisible(),true,'Click curved text shows contextual editor');
await page.locator('#quickText').fill('GO FENTON');
await page.locator('#quickText').evaluate(el=>el.blur());
assert.equal(await page.inputValue('#headline'),'GO FENTON','Contextual edit updates design text');
await page.click('#uxUndo');
assert.notEqual(await page.inputValue('#headline'),'GO FENTON','Undo restores edited text');
await page.click('#uxRedo');
assert.equal(await page.inputValue('#headline'),'GO FENTON','Redo restores edited text');
b=await canvas.boundingBox();
await page.mouse.click(b.x+b.width*.5,b.y+b.height*.5);
assert.equal(await page.locator('#quickImageSize').isVisible(),true,'Tap artwork to select its layer');
const xBefore=await page.evaluate(()=>layers[0].x);
await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);
await page.mouse.down();await page.mouse.move(b.x+b.width*.62,b.y+b.height*.51,{steps:5});await page.mouse.up();
const xAfter=await page.evaluate(()=>layers[0].x);
assert.ok(xAfter>xBefore+.04,'Image can be dragged on the canvas');
await page.click('#uxUndo');
assert.ok(Math.abs((await page.evaluate(()=>layers[0].x))-xBefore)<.01,'Undo restores image position');
// Phase 2: add a logo from its thumbnail, select via layers, and reorder.
await page.locator('.studio-logo-card[data-logo="tiger-cubs-29168"]').click();
await page.waitForFunction(()=>window.ButtonStudioUX?.getState().layers.length===2,null,{timeout:12000});
assert.equal(await page.locator('.studio-layer-select').count(),2,'Visual layer list shows both pictures');
await page.locator('.studio-layer-select').last().click();
assert.equal(await page.locator('.studio-layer-select[aria-pressed="true"]').count(),1,'Layer selection is highlighted');
const priorNames=await page.evaluate(()=>window.ButtonStudioUX.getState().layers.map(l=>l.name).join('|'));
await page.locator('.studio-layer-row').last().locator('button[data-action="forward"]').click();
const newNames=await page.evaluate(()=>window.ButtonStudioUX.getState().layers.map(l=>l.name).join('|'));
assert.notEqual(newNames,priorNames,'Layer order changes');
await page.screenshot({path:path.join(__dirname,'browser-preview.png')});
await page.setViewportSize({width:375,height:812});
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+4);
assert.equal(overflow,false,'No horizontal overflow at phone width');
assert.deepEqual(errors,[],'No browser JavaScript exceptions');
console.log('PASS: Phase 2 logo library, search, modes, layers; plus templates, image editing, undo, PDF and mobile');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close()});

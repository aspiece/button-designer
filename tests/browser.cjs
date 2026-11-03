// Run on Node 22 with playwright-core and system Chrome.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const { chromium }=require('playwright-core');
const ROOT=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
async function run(){
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  let name=decodeURIComponent(url.pathname).replace(/^\/+/,'')||'index.html';
  const abs=path.resolve(ROOT,name);
  if(!abs.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
  fs.readFile(abs,(err,data)=>{
   if(err){res.writeHead(404).end('Not found: '+name);return}
   res.writeHead(200,{'Content-Type':mime[path.extname(abs)]||'application/octet-stream'});
   res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const port=server.address().port;
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.template-card').count(),14,'Fourteen neutral templates');
  assert.equal(await page.locator('.editor-tabs [role="tab"]').count(),3,'Modern three-tab interface');
  assert.equal(await page.locator('#propertiesPanel').count(),1,'Properties panel');
  await page.waitForFunction(()=>document.querySelectorAll('#uxLogoGroups .studio-logo-card').length===42,null,{timeout:20000});
  assert.equal(await page.locator('button[data-path^="logos/"]').count(),0,'No Fenton/Team/FIRST logos');
  await page.locator('#tab-logos').click();
  await page.locator('#uxLogoSearch').fill('robot');
  const art=page.locator('button[data-path="approved-art/images/robot.svg"]');
  assert.ok(await art.isVisible(),'Public-use robot in gallery');
  await art.click();
  await page.waitForFunction(()=>window.ButtonStudioUX.getState().layers.length===1,null,{timeout:20000});
  await page.locator('#tab-design').click();
  await page.locator('.template-card[data-template="blue"]').click();
  await page.locator('#tab-print').click();
  await page.locator('#openPrintStudio').click();
  const [pdf]=await Promise.all([page.waitForEvent('download'),page.locator('#psDownloadSingle').click()]);
  const data=fs.readFileSync(await pdf.path());
  assert.equal(data.toString('ascii',0,8),'%PDF-1.4','Valid print-ready PDF');
  assert.ok(data.toString('latin1').includes('/MediaBox [0 0 612 792]'),'US Letter dimensions');
  assert.deepEqual(errors,[],'No browser JavaScript errors');
  await page.setViewportSize({width:360,height:640});
  await page.reload({waitUntil:'networkidle'});
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  assert.ok(width<=360,'No horizontal overflow on mobile');
  await context.close();
  console.log('PASS: standalone button editor, 42 public images, printable PDF, mobile layout');
 } finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(err=>{console.error(err);process.exitCode=1});

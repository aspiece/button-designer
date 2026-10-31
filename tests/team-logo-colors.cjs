// Verify every robotics-team logo in Black, Orange and White with real browser pixels.
const {chromium}=require('playwright-core');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.avif':'image/avif'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:8768');
  let file;
  try {
    const rel=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    file=path.resolve(root,rel.endsWith('/')||rel===''?path.join(rel,'index.html'):rel);
    if(!file.startsWith(root+path.sep))throw Error('Forbidden');
  } catch(e){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(data)});
});
const colors={black:[0,0,0],orange:[245,130,32],white:[255,255,255]};
async function auditPixel(page,logo,color,fromLayer=false){
  return await page.evaluate(async ({logo,color,fromLayer,expected})=>{
    const matches=[...document.querySelectorAll('.team-logo-choice')];
    const wrap=matches.find(n=>n.querySelector('button[data-path]')?.dataset.path===logo.path);
    let img;
    if(fromLayer){
      const state=window.ButtonStudioUX.getState();
      const last=state.layers[state.layers.length-1];
      if(!last||!last.name.toLowerCase().includes(color))throw Error('Layer color filename mismatch');
      img=new Image();img.src=last.data;await img.decode();
    } else {
      img=wrap?.querySelector('img');
      if(!img||!img.src.startsWith('blob:')||img.dataset.requestedColor!==color)throw Error('Wrong preview URL or selected color');
      await img.decode();
    }
    const canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,0);
    const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let visible=0,wrong=0,near=0,opaque=0;
    for(let i=0;i<d.length;i+=4){
      if(d[i+3]<40)continue;
      visible++;
      if(d[i+3]>245)opaque++;
      const diff=Math.max(Math.abs(d[i]-expected[0]),Math.abs(d[i+1]-expected[1]),Math.abs(d[i+2]-expected[2]));
      if(diff>5)wrong++;else near++;
    }
    return {visible,wrong,near,opaque,total:canvas.width*canvas.height};
  },{logo,color,fromLayer,expected:colors[color]});
}
(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(8768,'127.0.0.1',resolve));
    browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:1320,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8768/',{waitUntil:'networkidle'});
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'logos/catalog.json'),'utf8'));
    const logos=manifest.images.filter(x=>x.category==='Robotics Teams');
    assert.equal(logos.length,14,'Expected all 14 unique team logos');
    await page.locator('[data-edit-tab="logos"]').click();
    await page.selectOption('#uxLogoCategory','Robotics Teams');
    await page.waitForFunction(n=>document.querySelectorAll('.team-logo-choice').length===n,logos.length);
    let total=0,inserted=0;
    for(const logo of logos){
      const card=page.locator('.team-logo-choice').filter({has:page.locator('button[data-path="'+logo.path+'"]')});
      assert.equal(await card.count(),1,'One gallery card for '+logo.name);
      for(const color of Object.keys(colors)){
        await card.locator('select').selectOption(color);
        await page.waitForFunction(({path,color})=>{
          const wrap=[...document.querySelectorAll('.team-logo-choice')].find(x=>x.querySelector('button[data-path]')?.dataset.path===path);
          const img=wrap?.querySelector('img');return img?.dataset.requestedColor===color && img?.src.startsWith('blob:') && img.complete;
        },{path:logo.path,color},{timeout:20000});
        const inspected=await auditPixel(page,logo,color);
        assert(inspected.visible>80,logo.name+' '+color+': no visible pixels');
        assert.equal(inspected.wrong,0,logo.name+' '+color+': unexpected RGB values');
        assert(inspected.visible<inspected.total*.94,logo.name+' '+color+': nontransparent background suspected');
        total++;
        // Also audit what students actually add, clearing the canvas after every nine layers.
        if(inserted>=9){
          await page.reload({waitUntil:'networkidle'});
          await page.locator('[data-edit-tab="logos"]').click();
          await page.selectOption('#uxLogoCategory','Robotics Teams');
          inserted=0;
        }
        const current=page.locator('.team-logo-choice').filter({has:page.locator('button[data-path="'+logo.path+'"]')});
        await current.locator('select').selectOption(color);
        const before=await page.evaluate(()=>window.ButtonStudioUX.getState().layers.length);
        await current.locator('button.studio-logo-card').click();
        await page.waitForFunction(n=>window.ButtonStudioUX.getState().layers.length===n+1,before,{timeout:20000});
        const layerResult=await auditPixel(page,logo,color,true);
        assert(layerResult.visible>80,logo.name+' '+color+': added layer is empty');
        assert.equal(layerResult.wrong,0,logo.name+' '+color+': layer is wrong color');
        inserted++;
        console.log('PASS',logo.name,color,'preview',inspected.visible,'layer',layerResult.visible);
      }
    }
    assert.equal(errors.length,0,'Unexpected page errors: '+errors.join(', '));
    console.log('All',total,'team logo + color combinations passed preview and inserted-layer checks');
  }finally{
    await browser?.close();
    server.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});

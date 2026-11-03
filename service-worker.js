/* Offline shell for standalone Button Studio. Student projects are never transmitted or cached. */
const VERSION = 'button-studio-standalone-v1';
const SHELL = VERSION + '-shell';
const RUNTIME = VERSION + '-runtime';
const ROOT = new URL(self.registration.scope);
const FILES = [
  './', './index.html', './phase1.js', './phase2.js', './phase3.js',
  './properties.js', './pwa.js', './phase1.css', './phase2.css',
  './phase3.css', './properties.css', './pwa.css', './general.css',
  './manifest.json', './icons/icon-192.png', './icons/icon-512.png',
  './approved-art/catalog.json'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES.map(p=>new URL(p,ROOT).href))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('button-studio-')&&![SHELL,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function remember(request,response){
 if(!response||!response.ok||response.type==='opaque')return;
 const c=await caches.open(RUNTIME);
 await c.put(request,response.clone());
 const keys=await c.keys();
 if(keys.length>100)await Promise.all(keys.slice(0,keys.length-100).map(key=>c.delete(key)));
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(request.mode==='navigate'||['script','style','image','font'].includes(request.destination)||/\.json$/.test(url.pathname)){
  event.respondWith((async()=>{
   try{const network=await fetch(request);if(network.ok)event.waitUntil(remember(request,network));return network}
   catch(_){
    const fallback=await caches.match(request);
    if(fallback)return fallback;
    if(request.mode==='navigate')return (await caches.match(new URL('./',ROOT).href))||Response.error();
    return Response.error();
   }
  })());
 }
});

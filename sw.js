const V='fulbito-be0d2ab530';const BASE='/personal-coach';
const CORE=["/personal-coach/", "/personal-coach/index.html", "/personal-coach/manifest.json", "/personal-coach/apple-touch-icon.png", "/personal-coach/_expo/static/css/native-tabs.module-78b0f59737571f455720970791a36bdd.css", "/personal-coach/_expo/static/js/web/entry-f60880963abf3ba4c19727d96170184e.js"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>fetch(u).then(r=>r.ok?c.put(u,r):null).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match(BASE+'/index.html')));return}
e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res})))});

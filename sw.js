const V='fulbito-bc6075f768';const BASE='/personal-coach';
const CORE=["/personal-coach/", "/personal-coach/index.html", "/personal-coach/manifest.json", "/personal-coach/apple-touch-icon.png", "/personal-coach/_expo/static/css/native-tabs.module-78b0f59737571f455720970791a36bdd.css", "/personal-coach/_expo/static/js/web/entry-5d48c38221a03efa1a46a187046a6387.js"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match(BASE+'/index.html')));return}
e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res})))});

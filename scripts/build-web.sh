#!/usr/bin/env bash
# Construye la versión web instalable (PWA) en la carpeta indicada. Uso: scripts/build-web.sh <carpeta> [/base]
set -euo pipefail
OUT="${1:?carpeta de salida}"
BASE="${2:-}"
# La ruta base se escribe temporalmente en app.json (solo afecta a la web) y se restaura al terminar.
cp app.json /tmp/app.json.bak
trap 'cp /tmp/app.json.bak app.json' EXIT
if [ -n "$BASE" ]; then
  python3 - "$BASE" <<'PY2'
import json, sys
a = json.load(open('app.json')); a['expo'].setdefault('experiments', {})['baseUrl'] = sys.argv[1]
json.dump(a, open('app.json', 'w'), indent=2, ensure_ascii=False)
PY2
fi
EXPO_OFFLINE=1 CI=1 npx expo export --platform web --output-dir "$OUT" >/dev/null
python3 - "$OUT" "$BASE" <<'PY'
import json, sys, re, hashlib, os
from PIL import Image
out, base = sys.argv[1], sys.argv[2]
icon = Image.open('assets/icon.png').convert('RGB')
for size, name in ((180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
    icon.resize((size, size), Image.LANCZOS).save(os.path.join(out, name))
manifest = {
    'name': 'Fulbito', 'short_name': 'Fulbito', 'description': 'Entrena, juega y mejora.',
    'start_url': base + '/', 'scope': base + '/', 'display': 'standalone', 'orientation': 'any',
    'background_color': '#23272E', 'theme_color': '#23272E', 'lang': 'es',
    'icons': [{'src': base + '/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': base + '/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}],
}
json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), ensure_ascii=False)
# Service worker: guarda la app para abrirla sin internet. Versión = huella del contenido.
files = []
for root, _, names in os.walk(out):
    for n in names:
        p = os.path.join(root, n)
        files.append(os.path.relpath(p, out))
h = hashlib.sha1()
for f in sorted(files):
    h.update(f.encode()); h.update(open(os.path.join(out, f), 'rb').read())
version = h.hexdigest()[:10]
core = ['', 'index.html', 'manifest.json', 'apple-touch-icon.png'] + [f for f in files if f.startswith('_expo/')]
sw = f"""const V='fulbito-{version}';const BASE='{base}';
const CORE={json.dumps([base + '/' + c for c in core])};
self.addEventListener('install',e=>{{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))}});
self.addEventListener('fetch',e=>{{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
if(r.mode==='navigate'){{e.respondWith(fetch(r).catch(()=>caches.match(BASE+'/index.html')));return}}
e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res}})))}});
"""
open(os.path.join(out, 'sw.js'), 'w').write(sw)
html = open(os.path.join(out, 'index.html')).read()
inject = f'''<link rel="manifest" href="{base}/manifest.json" /><link rel="apple-touch-icon" href="{base}/apple-touch-icon.png" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /><meta name="apple-mobile-web-app-title" content="Fulbito" /><meta name="theme-color" content="#23272E" /><style>html,body{{overscroll-behavior:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;touch-action:manipulation;-webkit-text-size-adjust:100%}}body{{-webkit-user-select:none;user-select:none}}input,textarea{{-webkit-user-select:text;user-select:text;font-size:16px!important}}</style><script>if('serviceWorker' in navigator){{window.addEventListener('load',function(){{navigator.serviceWorker.register('{base}/sw.js')}})}}</script>'''
html = re.sub(r'<meta name="viewport"[^>]*>', '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />', html)
html = re.sub(r'<title>.*?</title>', '<title>Fulbito</title>', html)
html = html.replace('</head>', inject + '</head>', 1)
open(os.path.join(out, 'index.html'), 'w').write(html)
shutil_ok = True
PY
touch "$OUT/.nojekyll"
cp "$OUT/index.html" "$OUT/404.html"

/* 우리 가계부 — 화면 파일을 폰에 저장해 두고 바로 엽니다.
 * · 화면(index.html 등): 저장본으로 먼저 열고, 뒤에서 새 버전을 받아 둡니다
 *   → GitHub에 올린 수정은 "다음에 앱을 열 때" 반영됩니다.
 * · 가계부 데이터(Apps Script): 저장하지 않고 항상 서버로 보냅니다.
 */
var CACHE = 'gagyebu-v1';
var SHELL = ['./', './index.html', './manifest.json',
             './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                           .map(function(k){ return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;                                   // 기록 저장 등은 그대로 서버로
  var url = new URL(req.url);
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return; // 데이터는 저장하지 않음

  e.respondWith(caches.open(CACHE).then(function(cache){
    return cache.match(req, { ignoreSearch: true }).then(function(hit){
      var net = fetch(req).then(function(res){
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    });
  }));
});

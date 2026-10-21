/**
 * 우리 가계부 — 서비스워커
 * 화면 파일(index.html, 아이콘 등)만 기기에 담아둡니다. 가계부 데이터(구글 시트)는 절대 담지 않습니다.
 * 화면은 '인터넷 먼저': 연결돼 있으면 늘 최신 화면, 끊겼을 때만 담아둔 화면을 씁니다.
 * → GitHub에 index.html을 고쳐 올리면 다음에 앱을 열 때 바로 반영됩니다.
 */
var CACHE = 'ledger-v1';
var ASSETS = ['./', './index.html', './manifest.json',
              './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                             .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;                                   // 시트 저장(POST)은 건드리지 않음
  if(new URL(req.url).origin !== self.location.origin) return;       // 구글·폰트 등 바깥 주소도 건드리지 않음

  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});

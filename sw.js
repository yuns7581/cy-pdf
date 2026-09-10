/* 現場工具箱 Service Worker  C1.6
   ─────────────────────────────────────────────
   改版流程：改完 index.html 之後，把下面 CACHE 的版本號一起改掉。
   不改的話舊快取不會失效，你會以為更新沒生效。            */
const CACHE = 'cy-toolbox-C1.6';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

/* 安裝：強制繞過瀏覽器 HTTP 快取抓最新的一份。
   C1.2 用 cache.addAll()，它會走 HTTP 快取，
   結果在早就開過舊版的電腦上會把舊檔存進 SW 快取。 */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        return fetch(new Request(u, { cache: 'reload' }))
          .then(function (r) { if (r && r.ok) return c.put(u, r); })
          .catch(function () { /* 單一檔案失敗不擋整個安裝 */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  /* 網頁本身走「網路優先」：有訊號一定拿到最新版，
     沒訊號才回退快取。這是離線可用與版本正確的平衡點。 */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        e.waitUntil(caches.open(CACHE).then(function (c) {
          return c.put('./index.html', copy);
        }));
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (h) {
          return h || caches.match('./');
        });
      })
    );
    return;
  }

  /* 其他靜態資源走「快取優先」，同時在背景更新下一次的內容。 */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          e.waitUntil(caches.open(CACHE).then(function (c) {
            return c.put(req, copy);
          }));
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

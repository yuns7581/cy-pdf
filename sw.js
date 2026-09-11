/* 現場工具箱 Service Worker  C1.9
   ─────────────────────────────────────────────
   改版流程：改完 index.html 之後，把下面 CACHE 的版本號一起改掉。
   不改的話舊快取不會失效，你會以為更新沒生效。            */
const CACHE = 'cy-toolbox-C1.9';

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


/* ============ 分享目標：Android 分享選單把檔案 POST 進來 ============
   沒有伺服器，所以由 SW 攔下這個 POST，把檔案寫進 cy_handoff，
   再 303 轉址到對應頁面讓它取用。必須先寫完再回應，否則頁面會撲空。 */
function hoSave(files) {
  return new Promise(function (res) {
    if (typeof indexedDB === 'undefined') return res(0);
    var r;
    try { r = indexedDB.open('cy_handoff', 1); } catch (e) { return res(0); }
    r.onupgradeneeded = function (e) {
      var d = e.target.result;
      if (!d.objectStoreNames.contains('q')) d.createObjectStore('q', { keyPath: 'id', autoIncrement: true });
    };
    r.onsuccess = function () {
      var d = r.result;
      var tx = d.transaction('q', 'readwrite'), st = tx.objectStore('q');
      st.clear();
      files.forEach(function (f) { st.add({ name: f.name, type: f.type, blob: f }); });
      tx.oncomplete = function () { res(files.length); };
      tx.onerror = function () { res(0); };
    };
    r.onerror = function () { res(0); };
  });
}

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'POST' || !/\/share-target$/.test(u.pathname)) return;
  e.respondWith((async function () {
    var to = './index.html#to=share';
    try {
      var fd = await e.request.formData();
      var files = fd.getAll('file').filter(function (f) { return f && f.name; });
      if (files.length) {
        await hoSave(files);
        var allPdf = files.every(function (f) {
          return f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
        });
        if (allPdf) to = './viewer.html#open=1';
      }
    } catch (err) { /* 讀不到就照樣進工具箱，由頁面顯示訊息 */ }
    return Response.redirect(to, 303);
  })());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  /* 網頁本身走「網路優先」：有訊號一定拿到最新版，沒訊號才回退快取。
     index.html 與 viewer.html 兩頁共用這條路徑，各自存自己的快取。 */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        e.waitUntil(caches.open(CACHE).then(function (c) {
          return c.put(req, copy);          /* 用 req 當鍵：index 與 viewer 各自一份 */
        }));
        return res;
      }).catch(function () {
        return caches.match(req).then(function (h) {
          return h || caches.match('./index.html').then(function (h2) {
            return h2 || caches.match('./');
          });
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

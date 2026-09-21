/* 月半越南團旅 — Service Worker
   目的：山區網路不穩時，網頁本身（殼）永遠打得開；資料則由 localStorage 快取 + 雲端同步負責。
   策略：
   - 網頁本身（index.html）：網路優先，但只等 2.5 秒。訊號時有時無的地方，超過就先給快取那份，
     網路那份回來後仍會寫進快取，下一次打開就是新的。完全斷線時立刻回退快取。
   - config.js、manifest、圖示等：快取優先、背景更新（幾乎不變，不值得每次等）。
   - 只快取成功的回應（res.ok）：飯店 Wi-Fi 的登入頁、404 這類東西不能被存成網頁本身。 */
var CACHE = 'sapa-tour-v3';   /* 換 logo／改標題／改策略時要進版，舊快取才會被清掉 */
var SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
var NET_WAIT = 2500;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* 首頁可能帶各種參數（?v=317 之類），統一存成 index.html 一份，比對時也忽略參數 */
function keyOf(req) { return req.mode === 'navigate' ? new Request('./index.html') : req; }
function fromCache(req) { return caches.match(keyOf(req), { ignoreSearch: true }); }
function putIfOk(req, res) {
  if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(keyOf(req), copy); }); }
  return res;
}
function fallbackFor(req) {
  return fromCache(req).then(function (r) { return r || (req.mode === 'navigate' ? caches.match('./index.html') : null); });
}
/* 網路 vs 快取賽跑：網路在時限內回來就用網路；逾時且有快取就先用快取；沒快取就繼續等網路。 */
function raceNetworkCache(req) {
  return new Promise(function (resolve) {
    var settled = false;
    function settle(r) { if (!settled && r) { settled = true; resolve(r); } }
    fetch(req).then(function (res) {
      if (res && res.ok) { putIfOk(req, res); settle(res); return; }
      /* 404／500 這種：有快取就給快取，沒有才把錯誤頁給出去 */
      fromCache(req).then(function (r) { settle(r || res); });
    }).catch(function () { fallbackFor(req).then(function (r) { settle(r || Response.error()); }); });
    setTimeout(function () { if (settled) return; fromCache(req).then(function (r) { if (r) settle(r); }); }, NET_WAIT);
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase 等外部資源不攔截
  if (url.searchParams.has('cb')) { e.respondWith(fetch(req)); return; } // 「更新」前的探測：一定要真的問伺服器，不能拿快取回答

  if (url.pathname.indexOf('/icons/') >= 0) {
    e.respondWith(fromCache(req).then(function (r) { return r || fetch(req).then(function (res) { return putIfOk(req, res); }); }));
    return;
  }
  if (req.mode === 'navigate') { e.respondWith(raceNetworkCache(req)); return; }
  /* config.js、manifest 等其他同源檔案：快取優先、背景更新。
     這些檔案幾乎不變，卻是擋在畫面前面的阻塞資源，不值得每次都等網路。 */
  e.respondWith(fromCache(req).then(function (cached) {
    var net = fetch(req).then(function (res) { return putIfOk(req, res); }).catch(function () { return null; });
    return cached || net.then(function (r) { return r || Response.error(); });
  }));
});

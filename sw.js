// オフラインでも遊べるように、素材とモデルをキャッシュする
//   ファイルを更新したら VERSION を上げる（古いキャッシュは自動で消える）
const VERSION = "tongue-game-1.0.0";
const CORE = [
  "./", "index.html", "css/style.css", "manifest.webmanifest",
  "js/app.js", "js/ui.js", "js/vision.js", "js/rf.js", "js/train-worker.js", "js/storage.js", "js/audio.js", "js/mock.js",
  "assets/beatmaps/track6.json", "assets/beatmaps/track_tyuto.json",
  "assets/audio/elise2.m4a", "assets/audio/my_track.mp3",
  "assets/img/up2.png", "assets/img/down2.png", "assets/img/left2.png", "assets/img/right2.png", "assets/img/front2.png",
  "assets/img/no.png", "assets/img/shoulder_l2.png", "assets/img/shoulder_r2.png", "assets/img/shoulder_no.png",
  "assets/img/up_ex.png", "assets/img/down_ex.png", "assets/img/left_ex.png", "assets/img/right_ex.png", "assets/img/front_ex.png",
  "assets/img/face2_ex.png", "assets/img/pose.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  // HTML・JS・JSON は「通信できればネット、だめならキャッシュ」（更新がすぐ反映される）
  const fresh = sameOrigin && (req.mode === "navigate" || /\.(html|js|css|json|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/"));
  if (fresh) {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // 画像・音・MediaPipe（版を固定しているもの）は「キャッシュ優先」
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});

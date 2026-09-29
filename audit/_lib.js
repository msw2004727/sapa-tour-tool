/* 測試共用設定。
   解決三件事：playwright 要從哪裡載入、standalone.html 在哪裡、測試開的瀏覽器不能連到外面。
   每支測試都從這裡拿，換一台電腦、換一個資料夾位置都不用改程式。 */
const path = require('path');
const url = require('path') && require('url');

function loadPlaywright() {
  /* 依序嘗試：專案自己裝的 → 全域的 → Claude 容器內建的 */
  const candidates = ['playwright', 'playwright-core', '/opt/node-tools/node_modules/playwright'];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* 換下一個 */ }
  }
  throw new Error('找不到 playwright。請先在專案資料夾執行：npm install && npx playwright install chromium');
}

/* 安全（v3.22）：測試開的每一個瀏覽器都連不到外面，只放行 file:// 與本機伺服器（swtest.js 自己起的 127.0.0.1）。
   原因：standalone.html 會載入 config.js，裡面是正式 Firebase 的設定。在有網路的電腦上，
   「會存檔」的測試（membersave.js、synctest.js、resettest.js…）會真的寫進正式資料庫。
   Firebase 資料庫走 WebSocket，所以 HTTP 與 WebSocket 兩種都要擋。
   測試自己用 page.route() 設的規則優先於這裡，hardening.js 模擬 SDK 載入的那幾段不受影響。 */
const LOCAL = /^(https?|wss?):\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/;
const OUTSIDE = (u) => /^(https?|wss?):$/.test(u.protocol) && !LOCAL.test(u.href);
let blocked = 0;
async function guard(ctx) {
  if (ctx.__guarded) return ctx;   /* browser.newPage() 內部也會走 newContext()，不要註冊兩次 */
  ctx.__guarded = true;
  await ctx.route(OUTSIDE, (r) => { blocked++; return r.abort(); });
  if (ctx.routeWebSocket) await ctx.routeWebSocket(OUTSIDE, (ws) => { blocked++; ws.close(); });
  return ctx;
}
const pw = loadPlaywright();
const chromium = {
  launch: async (...a) => {
    const b = await pw.chromium.launch(...a);
    const newContext = b.newContext.bind(b), newPage = b.newPage.bind(b);
    b.newContext = async (...o) => guard(await newContext(...o));
    b.newPage = async (...o) => { const p = await newPage(...o); await guard(p.context()); return p; };
    return b;
  }
};

const ROOT = path.resolve(__dirname, '..');
const FILE = url.pathToFileURL(path.join(ROOT, 'standalone.html')).href;

module.exports = {
  chromium,
  ROOT,
  FILE,
  /* 目前為止擋掉了幾個對外連線（給測試自我檢查用） */
  outboundBlocked: () => blocked,
  /* 用專案根目錄組出絕對路徑，例如 at('audit/_bigphoto.jpg') */
  at: (p) => path.join(ROOT, p)
};

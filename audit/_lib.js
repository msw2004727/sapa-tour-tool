/* 測試共用設定。
   解決三件事：playwright 要從哪裡載入、standalone.html 在哪裡、測試開的瀏覽器不能連到外面。
   每支測試都從這裡拿，換一台電腦、換一個資料夾位置都不用改程式。 */
const path = require('path');
const fs = require('fs');
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
/* 測試用的一團假資料（v3.23）：網站程式不再內建任何一團的資料，測試需要一團「進行中」的沙壩團，
   所以每個測試瀏覽器載入網頁之前先放進 window.__SEED__（內容見 audit/fixture-trip.js，團員名字是代號）。
   想測「全新、什麼都沒有」的樣子：browser.newContext({ noSeed: true })。 */
const FIXTURE = path.join(__dirname, 'fixture-trip.js');
async function guard(ctx, noSeed) {
  if (ctx.__guarded) return ctx;   /* browser.newPage() 內部也會走 newContext()，不要註冊兩次 */
  ctx.__guarded = true;
  await ctx.route(OUTSIDE, (r) => { blocked++; return r.abort(); });
  if (ctx.routeWebSocket) await ctx.routeWebSocket(OUTSIDE, (ws) => { blocked++; ws.close(); });
  if (!noSeed) await ctx.addInitScript({ path: FIXTURE });
  return ctx;
}
const pw = loadPlaywright();

/* 雲端工作階段（claude.ai/code）的 Chromium 是事先裝好的，放在 PLAYWRIGHT_BROWSERS_PATH（通常是 /opt/pw-browsers），
   編號固定、而且不能再下載。專案沒有鎖檔，全新工作階段 npm install 會裝到更新的 Playwright，
   它要的瀏覽器編號不在那裡，launch 直接丟「Executable doesn't exist」（2026-09 實測：裝到 1.63.0，預裝的是 1194）。
   只有遇到這個錯誤才改用預裝的那一個（該目錄的 chromium 是指向它的連結）；沒遇到這個錯誤的環境，行為完全不變。 */
let fellBack = false;
async function launchBrowser(...a) {
  try { return await pw.chromium.launch(...a); }
  catch (e) {
    const dir = process.env.PLAYWRIGHT_BROWSERS_PATH;
    const alt = dir && path.join(dir, 'chromium');
    if (!/Executable doesn't exist/.test(String(e && e.message)) || !alt || !fs.existsSync(alt)) throw e;
    if (!fellBack) { fellBack = true; console.error('[_lib] 這個 Playwright 要的瀏覽器不在 ' + dir + '，改用預裝的 ' + alt); }
    const o = Object.assign({}, a[0]);
    delete o.channel;
    o.executablePath = alt;
    return pw.chromium.launch(o);
  }
}
const chromium = {
  launch: async (...a) => {
    const b = await launchBrowser(...a);
    const newContext = b.newContext.bind(b), newPage = b.newPage.bind(b);
    b.newContext = async (o, ...rest) => {
      const noSeed = !!(o && o.noSeed);
      if (o && 'noSeed' in o) { o = Object.assign({}, o); delete o.noSeed; }
      return guard(await newContext(o, ...rest), noSeed);
    };
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

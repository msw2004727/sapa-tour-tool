/* 測試共用設定。
   解決兩件事：playwright 要從哪裡載入、standalone.html 在哪裡。
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

const ROOT = path.resolve(__dirname, '..');
const FILE = url.pathToFileURL(path.join(ROOT, 'standalone.html')).href;

module.exports = {
  chromium: loadPlaywright().chromium,
  ROOT,
  FILE,
  /* 用專案根目錄組出絕對路徑，例如 at('audit/_bigphoto.jpg') */
  at: (p) => path.join(ROOT, p)
};

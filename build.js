#!/usr/bin/env node
/* 組裝腳本（跨平台，Windows / Mac / Linux 都能跑）
   用法：node build.js
   ---------------------------------------------------------------
   src/ 會依檔名順序接成三個檔案：
     index.html       ← 正式版，GitHub Pages 直接吃根目錄這一個
     standalone.html  ← 跟 index.html 完全一樣，測試腳本都指向它
     sapa-tool.html   ← artifact 預覽版（沒有 doctype 與 head，由 claude.ai 包）
   ---------------------------------------------------------------
   接的順序不能亂（後面的檔案會用到前面定義的東西）：
     01 樣式 → 02 骨架 → 03 常數/圖示 → 03b 預設資料
     → 04 核心/首頁 → 05 工具頁 → 06 表單 → 07 事件/啟動
*/
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const p = (...a) => path.join(ROOT, ...a);
const read = (f) => fs.readFileSync(p(f), 'utf8');

/* src/ 底下的檔名刻意用編號開頭，排序就是組裝順序，一眼看得出來 */
const JS_FILES = [
  'src/03-data.js',
  'src/03b-seed.js',
  'src/04-core.js',
  'src/05-tools.js',
  'src/06-sheets.js',
  'src/07-actions.js'
];

/* 直接首尾相接（每個檔案本來就以換行結尾），不要多插空行——
   這樣產出的位元組會跟舊的 build.sh 完全一致，方便跟線上版本對拍。 */
const JS = JS_FILES.map(read).join('').replace(/\n+$/, '');
const STYLE = read('src/01-style.html');
const BODY = read('src/02-body.html');

/* --- 1) artifact 預覽版 --- */
fs.writeFileSync(p('sapa-tool.html'), STYLE + BODY + '<script>\n' + JS + '\n</script>\n', 'utf8');

/* --- 2) 正式版 --- */
const HEAD = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#2F4479">
<meta name="robots" content="noindex,nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="月半越南團旅">
<meta name="description" content="我們是一群在越南吃吃喝喝團體自由行的旅遊好咖">
<meta property="og:type" content="website">
<meta property="og:site_name" content="月半越南團旅">
<meta property="og:title" content="月半越南團旅">
<meta property="og:description" content="我們是一群在越南吃吃喝喝團體自由行的旅遊好咖">
<meta property="og:url" content="https://750hd.com/">
<meta property="og:image" content="https://750hd.com/icons/og-logo.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1000">
<meta property="og:image:height" content="1000">
<meta property="og:image:alt" content="月半越南團旅">
<meta property="og:locale" content="zh_TW">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="月半越南團旅">
<meta name="twitter:description" content="我們是一群在越南吃吃喝喝團體自由行的旅遊好咖">
<meta name="twitter:image" content="https://750hd.com/icons/og-logo.jpg">
<link rel="manifest" href="./manifest.webmanifest">
<link rel="icon" type="image/png" href="./icons/icon-192.png">
<link rel="apple-touch-icon" href="./icons/icon-192.png">
`;

const SW_REG = `/* PWA：離線快取（https 或本機 localhost 才註冊；artifact 預覽環境不註冊） */
if('serviceWorker' in navigator && (location.protocol==='https:'||/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname)) && !(window.claude&&window.claude.use)){
  window.addEventListener('load',function(){ navigator.serviceWorker.register('./sw.js').catch(function(){}); });
}`;

const html = HEAD + STYLE + '</head>\n<body>\n' + BODY +
  '<script src="./config.js"></script>\n<script>\n' + JS + '\n' + SW_REG + '\n</script>\n</body>\n</html>\n';

fs.writeFileSync(p('index.html'), html, 'utf8');

/* --- 3) 單檔版（測試腳本都讀這個） --- */
fs.writeFileSync(p('standalone.html'), html, 'utf8');

/* --- 4) 語法檢查：接起來之後真的 parse 得過嗎 --- */
/* 暫存檔放系統的 temp 目錄，不要放專案裡：有些受限的環境不准在專案資料夾刪檔，
   放在裡面的話 build 會在「清暫存檔」那一步炸掉，看起來像組裝失敗其實不是。 */
const tmp = path.join(os.tmpdir(), 'sapa-build-check-' + process.pid + '.js');
const rmTmp = () => { try { fs.unlinkSync(tmp); } catch (e) { /* 刪不掉就算了，不影響結果 */ } };
fs.writeFileSync(tmp, JS, 'utf8');
try {
  execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
} catch (e) {
  rmTmp();
  console.error('✗ 組裝後的 JS 有語法錯誤：\n' + (e.stderr || e.stdout || e.message).toString());
  process.exit(1);
}
rmTmp();

/* --- 5) 重複定義檢查 --- */
/* 之前踩過一次：用字串切片改檔案時起點終點搞反，整段函式被複製了兩份，
   JS 不會報錯、後面的定義覆蓋前面的，結果是「舊版函式反而生效」。
   只有 build 後檔案突然變大才看得出來，所以這裡直接擋。 */
const names = {};
let dup = [];
for (const m of JS.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) {
  names[m[1]] = (names[m[1]] || 0) + 1;
}
for (const k in names) if (names[k] > 1) dup.push(k + ' ×' + names[k]);
if (dup.length) {
  console.error('✗ 有函式被定義了不只一次（多半是改檔案時複製到重複區段）：\n  ' + dup.join('\n  '));
  process.exit(1);
}

const ver = (JS.match(/var APP_VERSION\s*=\s*'([^']+)'/) || [])[1] || '?';
console.log(`build ok: v${ver} · ${fs.statSync(p('index.html')).size} bytes`);

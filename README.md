# 月半越南團旅

越南沙壩 33 人團體旅遊的隨身工具網站。手機優先的單檔 PWA，全團即時同步。

**線上版：https://750hd.com**（GitHub Pages 直接服務這個 repo 的根目錄）

## 快速開始

```bash
npm install
npx playwright install chromium

node build.js        # 組裝 src/ → index.html
npm run serve        # http://localhost:8080
npm run test:quick   # 快速回歸測試
```

## 這個專案怎麼組起來的

沒有框架、沒有打包工具。`src/` 底下 8 個檔案依**檔名順序**接起來，塞進一個 HTML，就是整個 App。

```
src/01-style.html   →  <style>
src/02-body.html    →  <body> 骨架
src/03-data.js   ┐
src/03b-seed.js  │
src/04-core.js   ├─→  <script>
src/05-tools.js  │
src/06-sheets.js │
src/07-actions.js┘
```

產出三個檔案：

| 檔案 | 用途 | 進 git？ |
|---|---|---|
| `index.html` | 網站本體，GitHub Pages 服務的就是這個 | ✅ |
| `standalone.html` | 同上，測試腳本讀這個 | ❌ |
| `sapa-tool.html` | artifact 預覽版（沒有 doctype 與 head） | ❌ |

⚠️ **不要直接編輯 `index.html`** — 它是產出物，下次 `node build.js` 就被蓋掉了。

## 主要功能

領隊即時廣播與集合倒數、雙軌行程（重點字卡／詳細介紹）、集合點名、房號與分組、
越幣點鈔速算、越語溝通圖卡 54 句、計程車回飯店卡、走散卡、緊急聯絡、
12 張出發前與在地知識小卡、旅遊提醒記事本、行程卡片底圖、深淺色主題、三段字級、PWA 離線。

## 文件

- [`CLAUDE.md`](CLAUDE.md) — **開發前必讀**：架構、資料模型、工作流程、踩過的雷
- [`notes/01-設計說明與待確認資料.md`](notes/01-設計說明與待確認資料.md) — v1.0～v3.13 每一版的設計決策
- [`notes/03-改版日誌_v3.14起.md`](notes/03-改版日誌_v3.14起.md) — v3.14 之後
- [`notes/04-部署與Firebase設定.md`](notes/04-部署與Firebase設定.md) — 從零建 Firebase 專案、部署、領隊上線清單

## 授權

MIT（見 `LICENSE`）。行程、名單等內容資料不在授權範圍。

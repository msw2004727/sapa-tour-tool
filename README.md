# 沙壩隨身團務 ⛰️

越南沙壩（Sa Pa）旅遊團的手機隨身工具網頁。免下載 App、免註冊，從 LINE 點開就能看：
領隊即時廣播與集合倒數、五日行程、房號與分桌、集合點名、航班資訊、沙壩在地救命卡（計程車卡、越幣速算、越語圖卡、緊急求助）與旅遊提醒記事本。

專為 50 歲以上長輩設計：大字、大按鈕、三段字體、深淺色主題、純 inline SVG 圖示（山區網路不穩也不會破圖）、離線可看最後一版。

## 這個專案怎麼運作

| 檔案 | 用途 |
|---|---|
| `index.html` | 整個網頁（HTML + CSS + JS 單檔） |
| `config.js` | **唯一需要修改的檔案**：選擇單機或 Firebase 同步 |
| `manifest.webmanifest`、`sw.js`、`icons/` | 加入主畫面（PWA）與離線快取 |
| `firebase.rules.json` | Firebase Realtime Database 建議規則 |

兩種模式：

- **單機模式（預設）**：資料只存在各自手機，領隊改的東西別人看不到。適合先試玩。
- **Firebase 同步模式**：領隊在管理模式改廣播、行程、分組、房號、點名、記事本，全團手機即時更新。免費方案就夠一團用。

## 一、部署到 GitHub Pages（已完成的話可跳過）

1. Fork 或上傳這個 repo。
2. Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main`／`/ (root)`。
3. 一兩分鐘後網址會是 `https://<你的帳號>.github.io/<repo 名稱>/`。

## 二、開啟全團即時同步（Firebase，約 10 分鐘）

1. 到 <https://console.firebase.google.com> 用 Google 帳號登入 →「建立專案」→ 名稱隨意（例如 `sapa-tour`）→ Google Analytics 可以關掉。
2. 左側「建構」→ **Realtime Database** →「建立資料庫」→ 位置選 **asia-southeast1（新加坡）** → 安全性規則先選「**測試模式**」。
3. 進入資料庫的「規則」分頁，把內容換成本專案的 `firebase.rules.json`，按「發布」。
   （測試模式 30 天後會自動鎖住，換成這份規則就不會。）
4. 專案總覽 → 齒輪「專案設定」→ 往下捲到「你的應用程式」→ 點 **`</>`（Web）** → 應用程式暱稱隨意 → 不用勾 Hosting → 註冊。
5. 畫面會出現 `const firebaseConfig = { apiKey: "...", ... }`，把每一個值貼進 `config.js` 對應欄位，並把 `sync` 改成 `'firebase'`：

   ```js
   window.SAPA_CONFIG = {
     sync: 'firebase',
     firebase: {
       apiKey: 'AIza...',
       authDomain: 'sapa-tour.firebaseapp.com',
       databaseURL: 'https://sapa-tour-default-rtdb.asia-southeast1.firebasedatabase.app',
       projectId: 'sapa-tour',
       storageBucket: 'sapa-tour.appspot.com',
       messagingSenderId: '1234567890',
       appId: '1:1234567890:web:abcdef'
     },
     path: 'trip'
   };
   ```

6. Commit `config.js` 後重新整理網頁，上方狀態列出現「**已連線 · 領隊一改，全團自動更新**」就成功了。

> 這組 Firebase 設定值本來就是設計成放在前端的，公開沒關係；真正的門檻在資料庫規則。目前規則是「知道網址的人都能讀寫」，對一個 5 天的私人團足夠；若要更嚴，可再加 Firebase 匿名登入 + 規則限制。

## 三、領隊上線前要做的事

1. 打開網頁 → 右上角 🔒 → 輸入 PIN（預設 **8888**）進入管理模式。
2. **工具 → 團務設定**：改掉 PIN、填入緊急聯絡人電話（原始碼刻意不含電話）、確認出發日期與航班時間。
3. **工具 → 飯店資料**：填河內飯店的中越文名稱、地址、電話、Wi-Fi、早餐時間；沙壩飯店同樣確認。
4. **房號**：點每張卡片填房號，或換飯店時用「批次改房號」。
5. **分組 → ✈️ 航空公司**：點每個人設定長榮／華航（卡片會出現圓形徽章）。
6. **提醒**：依實際情況增刪「出發前準備」清單與各頁提醒。
7. 把網址貼到 LINE 群組並置頂，提醒長輩「⋯ → 用瀏襽器開啟 → 加入主畫面」。
8. 建議在**團務設定 → 匯出備份檔**留一份 JSON。

出團中：首頁「修改廣播」或「現在＋15 分」改集合時間；行程頁「設為當前站」會連動首頁地點；工具 → 集合點名。

## 四、資料放在哪裡

- 名單、行程、分組、記事本等共用資料：Firebase `trip/` 節點（或單機模式下的 localStorage）。
- 「我是誰」、字體大小、深淺色、行前準備勾選：只存在各自手機。
- 原始碼內建：33 人姓名（電話留白）、航班時間、示範行程、越語圖卡、鈔票面額。

## 五、想換成自己的後端？

`index.html` 裡的 `Store.connectFirebase` 就是整個同步層（約 20 行）：訂閱 `trip/` 的變化 → `Store.applyRemote(docs)`；寫入用 `Store.push(key, data)`。
換成 Python FastAPI（輪詢 `GET /state`、`PUT /doc/{key}`）或 Supabase 都只要改這一段。

## 授權

MIT

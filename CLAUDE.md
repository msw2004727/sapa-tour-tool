# CLAUDE.md — 月半越南團旅

給 Claude Code 的專案說明。**開始動手前請整份讀完**，特別是「絕對不要踩的雷」那一節，裡面每一條都是實際出過事才寫下來的。

---

## 一、這是什麼

越南沙壩 33 人團體旅遊的隨身工具網站，手機優先的單檔 PWA。

| 項目 | 內容 |
|---|---|
| 正式網址 | https://750hd.com （Cloudflare 網域 → GitHub Pages） |
| GitHub | `msw2004727/sapa-tour-tool`，分支 `main` |
| 目前版本 | v3.17 |
| 旅遊日期 | 2026-09-24 ～ 09-28（5 天 4 夜） |
| 使用者 | 33 位團員（**多數是長輩**）；主辦人是小麥，用 PIN 進入管理模式 |
| 性質 | **團體自由行，沒有領隊、沒有導遊** |
| 技術 | 純 Vanilla JS，無框架、無打包工具、無 npm 執行期相依 |
| 後端 | Firebase Realtime Database（專案 `sapa-tour`，新加坡 asia-southeast1） |

### 使用者是長輩，這會改變很多判斷

這不是一般的 Web App。設計時的優先順序是：

1. **看得懂 > 好看**：短標籤永遠不換行，字級可三段放大（標準／大／特大）
2. **點得到 > 緊湊**：觸控目標至少 44px
3. **不要嚇到他們**：不用 emoji 當功能圖示（各家手機字型差很多，長輩看到的圖案不一致），一律用 inline SVG
4. **設計基準是 iPhone SE 一代的 320px 寬**，不是 375px
5. **畫面上不能出現「領隊」**：這團是自由行。管理功能叫「管理模式／管理專區」，廣播叫「即時廣播」，說明文字要找人時寫「主辦人」。`audit/wording.js` 會擋。

寫任何 UI 之前先想：一位 70 歲、在越南山區、可能沒戴老花眼鏡的人看得懂嗎？

---

## 二、這個 repo 同時裝了原始碼與產出物

`index.html` 是**組裝出來的產出物**（30 萬字元單檔），真正的原始碼在 `src/`。

- **絕對不要直接編輯根目錄的 `index.html`** — 下次 `node build.js` 會整個蓋掉
- 要改功能就改 `src/` 底下對應的檔案，然後 `node build.js`
- 根目錄之所以放著 `index.html`、`config.js`、`icons/` 這些，是因為 **GitHub Pages 直接吃 repo 根目錄**，750hd.com 就是這個 repo 的根目錄

> 歷史注記：v3.16 以前 repo 裡**只有** `index.html`，原始碼只存在開發環境的容器裡。2026-09-21 才把 `src/`、`audit/`、`notes/` 一起放進 repo。

---

## 三、資料夾結構

```
sapa-tour-tool/            ← 這整個資料夾就是 GitHub repo
│
│  ── 以下是網站本體，GitHub Pages 直接服務根目錄 ──
├── index.html             組裝產出（不要手改）
├── config.js              唯一需要手動設定的檔案（Firebase 連線）
├── manifest.webmanifest / sw.js / icons/    PWA
├── CNAME / .nojekyll      GitHub Pages
├── firebase.rules.json    目前套用的資料庫規則
├── firebase.rules.auth.json   想收緊時才換上的版本
│
│  ── 以下是開發用 ──
├── CLAUDE.md              你正在讀的這份
├── README.md
├── build.js               組裝腳本：node build.js
├── package.json
│
├── src/                   ★ 原始碼，改東西都在這裡
│   ├── 01-style.html      全站 CSS（含三套主題的 token）
│   ├── 02-body.html       HTML 骨架（標頭、LCD 面板、#view、底部分頁）
│   ├── 03-data.js         APP_VERSION、inline SVG 圖示、常數、越語圖卡 54 句
│   ├── 03b-seed.js        33 人名單與 30 站行程的預設資料（不是程式邏輯）
│   ├── 04-core.js         Store（同步層）、VIEWS（各分頁）、首頁卡片、工具函式
│   ├── 05-tools.js        工具分頁的內容（知識小卡、越幣速算、圖卡…）
│   ├── 06-sheets.js       所有底部表單 sheetXxx()
│   └── 07-actions.js      ACT 事件物件、全域事件代理、啟動流程
│
├── audit/                 ★ 可重複執行的回歸測試（見第六節）
├── notes/                 設計說明、優化計劃書、改版日誌
├── brand/                 logo 原圖、iOS 教學的原始截圖
├── shots/                 測試產生的截圖（不進 git）
└── standalone.html        build 產出，測試腳本都讀這一個（不進 git）
```

> `src/` 的檔名刻意用編號開頭，**排序就是組裝順序**。`03b-seed.js` 夾在 03 與 04 之間是刻意的：它必須在 `03-data.js` 之後、`04-core.js` 之前載入。
>
> 資料夾叫 `notes/` 而不是 `docs/`，是為了避開 GitHub Pages「從 /docs 資料夾發布」那個慣例，免得日後改設定時打架。

---

## 四、日常工作流程

```bash
# 首次設定（只要做一次）
npm install
npx playwright install chromium

# 改完 src/ 之後
node build.js            # 或 npm run build
npm run test:quick       # 快檢：regress + sheetfit（約 1 分鐘）
npm test                 # 全部 10 支測試（約 5 分鐘）

# 在瀏覽器看
npm run serve            # http://localhost:8080
```

`build.js` 會做四件事，任何一項失敗就中止：組裝 → 語法檢查（`node --check`）→ **重複函式定義檢查** → 印出版本與位元組數。

> 位元組數要留意。如果改了幾行字，檔案卻突然大了好幾 KB，多半是哪裡複製重複了。

### 改版時記得進版

`src/03-data.js` 第 2 行的 `APP_VERSION` 要跟著改。工具頁最下方會顯示；也可以在資料庫 `settings/minVersion` 填版本號，讓舊版手機跳「有新版本」提示。

---

## 五、部署

GitHub Pages 直接服務 repo 根目錄，推上 `main` 後約 50–75 秒生效。

```bash
node build.js                 # 先重新組裝
npm run test:quick            # 至少跑個快檢
git add -A
git commit -m "v3.17 ..."
git push origin main
```

`index.html` **要進 git**（它就是網站本身）。`standalone.html`、`sapa-tool.html`、`shots/*.png` 不進，`.gitignore` 已經擋掉。

### 驗證部署

```bash
git fetch origin
git diff origin/main -- index.html --stat    # 應該沒有輸出
```

然後開 `https://750hd.com/?v=<版本號>` 確認。

> **Service Worker 會騙你。** 剛推上去的前幾十秒，瀏覽器可能仍被 SW 餵到舊版。驗證時先 unregister SW＋清 caches 再重載，或直接看 `APP_VERSION` 的值。

### 在 Cowork 作業時（小麥目前主要的作業方式）

Cowork 的容器**沒有 GitHub 憑證，不能 `git push`**，而且對話結束後容器會被回收。所以流程是：

1. **開工先 clone**：`git clone https://github.com/msw2004727/sapa-tour-tool.git`。GitHub 是唯一正本，不要沿用上次留下的資料夾。
2. 改 `src/` → `node build.js` → 跑測試。
3. **部署靠瀏覽器上傳**：用 Claude in Chrome 開 `https://github.com/msw2004727/sapa-tour-tool/upload/main/<資料夾>`，一個資料夾上傳一趟（根目錄的檔案用 `/upload/main`）。
   - 要上傳哪些檔案：`git status --porcelain` 列出的**全部**。
   - **`src/` 的修改與 `index.html` 一定要一起上傳。** 只上傳 `index.html` 的話，網站會更新但 GitHub 上的原始碼還是舊的，下次有人從原始碼 build 就會把改動蓋回去——這正是把原始碼放進 repo 之後最容易出的事。
   - `file_upload` 只收 `/mnt/user-data/uploads/` 底下的檔案（`outputs/` 會被拒絕），要先複製過去。
   - commit 訊息要用原生 setter 塞進輸入框再觸發 `input` 事件；用鍵盤打字會把中文打壞。
4. **驗證**：另外重新 clone 一份，逐檔 `cmp` 比對，再 `node build.js` 之後 `git status` 必須乾淨；最後開 `https://750hd.com/?v=<版本>` 看 `APP_VERSION`。

### 在雲端工作階段改這個專案

`claude.ai/code` 的雲端工作階段會自己 clone 這個 repo，不需要本機檔案。注意兩件事：

1. 改完**一定要 `node build.js`**，否則推上去的 `index.html` 還是舊的 —— 這是這個專案最容易犯的錯，因為原始碼與產出物在同一個 repo 裡。
2. 測試要跑 Playwright，雲端環境需要先 `npm install && npx playwright install chromium`。若裝不起來，至少要人工確認 `node build.js` 有過，並把「沒跑測試」講出來。

---

## 六、測試

全部是 Playwright，讀 `standalone.html`（`file://`），所以**改完一定要先 `node build.js` 再跑測試**，否則測到的是舊版。

| 檔案 | 測什麼 |
|---|---|
| `audit/regress.js` | 全畫面回歸：320/375/390px × 標準/大/特大 × 淺/深色，走過所有分頁與主要表單。檢查橫向捲動、短標籤斷行、雙重跳脫、JS 錯誤。加 `--shots` 輸出截圖 |
| `audit/sheetfit.js` | **矮螢幕**（320×568 / 375×600 / 390×667）表單不被壓扁 |
| `audit/zonetest.js` | 首頁三區（現在／稍後／隨時查）的分區規則、逐卡釘死、跨區 ↑↓ |
| `audit/hltest.js` | 卡片高亮提醒的狀態機與版面 |
| `audit/dbgtest.js` | 行程底圖：上傳→裁切→壓縮→存檔→渲染→對比度→容量 |
| `audit/functest.js` | 功能面雜項斷言（PIN、返回鍵、地圖連結、知識小卡…） |
| `audit/synctest.js` | 離線佇列、重播、PIN 遷移、版本提示 |
| `audit/membersave.js` | 編輯團員存檔 → 重新整理的端對端回歸 |
| `audit/insttest.js` | 「安裝 App」按鈕在 320px 特大字下不溢出 |
| `audit/wording.js` | 所有畫面與原始碼不出現「領隊」；住宿卡的「LINE聯繫」按鈕 |

`audit/_lib.js` 負責找 playwright 與算出 `standalone.html` 的位置，測試裡不要再寫死路徑。

### 寫測試的原則（這個專案吃過虧）

**測試必須先證明它抓得到 bug。** 修好之後，把修正還原回去重跑一次，確認測試真的會紅。如果有 bug 跟沒 bug 都通過，那支測試沒有價值。

`audit/sheetfit.js` 就是這樣驗證的：把修正拿掉會立刻報 `zb1 155>36`。

**斷言要先確認前提成立。** 例如測「首頁不顯示說明文字」時，要先斷言「那一天的行程確實有 5 句說明」，否則資料本來就空的話會假通過。

---

## 七、絕對不要踩的雷

### 1. 視覺測試的 viewport 高度要貼近真實手機

曾經所有截圖都用 900–1400px 高的 viewport，**等於系統性地繞過所有「內容比螢幕高」的情境**。結果是一個在真手機上整個糊成一團的表單，在我這邊怎麼測都正常。

`.sheet-b` 是 `flex-direction:column; overflow-y:auto`。直向 flex 的子項預設 `flex-shrink:1`，平常靠 `min-height:auto` 保護；**但只要子項自己設了 `min-height`，那個保護就失效**，表單一高過螢幕就被壓扁。

現在有 `.sheet-b>*{flex:none}` 這條通則擋著。新增表單區塊時不要破壞它。

### 2. 用字串切片改檔案時，一定要先確認起點在終點之前

曾經用「從 A 字串切到 B 字串」的方式替換一整段，但 **B 在檔案裡出現得比 A 早**，切出來的結果把兩個函式整段複製了一份。JS 不會報錯，後面的定義覆蓋前面的，於是**舊版函式反而生效**。

只有 build 後檔案突然多了 11KB 才發現。現在 `build.js` 有重複定義檢查擋這件事。

### 3. 容器裡的 `overflow:hidden` 裁切，回歸測試抓不到

`regress.js` 檢查的是「換行」與「整頁橫向捲動」。`.lcd` 面板內部超出被 `overflow:hidden` 無聲切掉的狀況它抓不到。要量 `scrollWidth − clientWidth` 才看得見（`insttest.js` 就是這樣做的）。

### 4. 後代選擇器會咬到不該咬的東西

`.f label{display:block}` 本來是給欄位標題用的，結果把欄位裡那顆 `<label class="btn">選照片</label>` 也打回方塊，SVG 置中失效。現在是 `.f>label`。

寫 CSS 時預設用直接子代 `>`，除非真的要涵蓋所有後代。

### 5. `closeSheet()` 會把 `SHEET` 設成 null

存檔函式若在 `closeSheet()` 之後又讀 `SHEET.id`，會丟 `TypeError`。而因為表單是在拋錯**之前**就關掉的，畫面看起來像存檔成功（表單消失、沒有紅字），實際上資料從沒寫出去，一重新整理就打回原狀。

**存檔一開始就把 `SHEET.id` 存進區域變數。**

### 6. Canvas 的 `toBlob('image/webp')` 在舊 Safari 會默默吐出 PNG

不是報錯，是安靜地給你別的格式。一定要檢查回傳 blob 的真實 `type`，不符就退回 JPEG。`dbgEncode()` 已經處理，有專門的測試（把 `toBlob` 攔截成永遠回 PNG）。

### 7. `.app` 不能用 `overflow-x:hidden`

那會隱含 `overflow-y:auto`，把 `.app` 變成自己的捲動容器，**全站的 `position:sticky` 會通通失效**。要用 `overflow-x:clip`。

### 8. `dayInfo()` 在出發前狀態下 `idx` 也是 1

判斷「只有首尾兩天」這類條件時要加 `!before`，否則出發前會被誤判成第 1 天。

### 9. 存檔的寫法要選對

| 方法 | 行為 | 用在哪 |
|---|---|---|
| `Store.save(key)` | 整份文件覆寫 | 改動涉及整份資料時（例如新增行程） |
| `Store.savePath(key,path,val)` | 只送出那一條路徑 | **兩支手機可能同時改不同項目時一定要用這個**（點名、分組、單一成員、底圖） |

33 人的名單整份覆寫，兩人同時改不同人的話後寫的會蓋掉前一個。

### 10. LINE 對分享預覽（OG）的快取很硬

同一個網址第一次被貼進 LINE 之後，之後改 og 標籤未必會馬上反映。測試時在網址後加參數（`?v=2`）重新貼一次。

另外 **LINE 是把預覽圖裁成右側小方塊**，所以 og:image 必須是方形（現在是 1000×1000 的 logo），`twitter:card` 要用 `summary` 不是 `summary_large_image`。

---

## 八、資料模型

8 份文件，存在 Firebase Realtime Database 的 `trip/` 底下，每份帶一個 `_ts`：

```js
DOC_KEYS = ['settings','broadcast','itinerary','members','groups','rollcall','notebook','photos']
```

| 文件 | 內容 | 大小（實測） |
|---|---|---|
| `settings` | 團名、日期、PIN 雜湊、飯店、航空公司、卡片分區與高亮、防呆標籤… | 2.5 KB |
| `broadcast` | 即時廣播（時間、地點、叮嚀、`idle` 自由活動旗標） | 0.1 KB |
| `itinerary` | 30 站行程 | 7.4 KB |
| `members` | 33 人（姓名、房號、航空公司、徽章、備註） | 4 KB |
| `groups` | 分組情境與指派 | 1.1 KB |
| `rollcall` | 集合點名 | 0.1 KB |
| `notebook` | 旅遊提醒記事本（含出發前勾選清單） | 2.7 KB |
| `photos` | 行程卡片底圖 `items[行程id]={src,op,kb}` | 滿載 352 KB |

**總計目前約 18 KB，底圖全放滿也只到 370 KB。** `localStorage` 上限 5 MB，還有十倍餘裕。

### 同步機制的兩個重點

1. **根節點監聽**：`db.ref(root).on('value')`。初次同步會下載整包，之後 Firebase 走**差異推送**，改一個欄位只傳那個欄位（這點以前判斷錯過，不要再用「整包重下」當理由做設計取捨）。
2. **離線操作佇列**：寫入先進 `Store.q`，離線時累積、連線後 FIFO 送出。`applyRemote()` 收到雲端快照時，會**先把佇列裡還沒送出的本機修改重新疊上去**，不是直接覆蓋。纜車上沒訊號時主辦人改的廣播，下山後不會被舊快照蓋掉。

### 存在手機自己的（不同步）

`localStorage['sapa-prefs']`：字級 `fs`、主題 `theme`、我是誰 `meId`、管理模式 `leader`、行程頁的閱讀模式 `planMode`、勾選清單 `checks`、卡片展開狀態 `cards`。

> **注意這裡的耦合風險。** `planMode` 曾經被拿去當首頁顯示說明文字的條件，結果同一個人在手機與電腦上看到不一樣的首頁 — 因為那是每台裝置各自記的。分頁自己的 UI 狀態不要拿去控制別的分頁。

---

## 九、主辦人上線待辦（出發前）

1. **改掉 PIN**（目前仍是 `8888`）：右上角 🔒 → 8888 → 工具 → 團務設定
2. **填緊急聯絡人電話**：原始碼刻意不含電話，要在管理模式輸入才會存進雲端
3. **填河內飯店資料**與沙壩飯店的 Wi-Fi 名稱／密碼、早餐時間
4. **補上餐廳的 Google 地圖地點**（午晚餐目前留白）
5. **分房號**與**設定每人航空公司**
6. 核對駐越南辦事處急難電話是否異動；更新匯率（目前 1 TWD ≈ 820 VND）
7. 把網址貼到 LINE 群組置頂，提醒長輩用「加到主畫面」的圖文教學
8. **請團上懂越語的人複核越語圖卡那 54 句**，特別是「我對海鮮／花生過敏」這種講錯有實質風險的句子（越南文是 AI 寫的，尚未經人工複核）

## 十、安全性現況

- `config.js` 裡的 Firebase 金鑰是**前端公開金鑰**，本來就會出現在網頁原始碼裡，不是秘密。真正的防線是資料庫規則。
- 目前規則等同「**知道網址的人可讀寫**」（`firebase.rules.json`）。對一個 5 天的私人團可以接受，網址只在 LINE 群組流通。
- 想收緊的話：`config.js` 的 `auth` 改成 `'anon'`，套用 `firebase.rules.auth.json`（`.write` 改成 `auth != null`），只有開過網頁的裝置能寫。**這個切換還沒做，由小麥決定。**
- 管理 PIN 存的是 SHA-256 雜湊（`settings.pinHash`），不是明文。PIN 只是防誤觸，不是資安機制。

---

## 十一、延伸閱讀

| 檔案 | 內容 |
|---|---|
| `notes/01-設計說明與待確認資料.md` | v1.0～v3.13 每一版的設計決策、為什麼這樣做、踩過的坑。**要改既有功能前先在這裡搜一下** |
| `notes/02-優化計劃書.md` | v2.0 那次通盤審查的 27 項清單 |
| `notes/03-改版日誌_v3.14起.md` | v3.14 之後的改版 |
| `notes/04-部署與Firebase設定.md` | 從零建 Firebase 專案的 10 分鐘步驟、部署細節、上線清單（原本的 repo README） |

---

## 十二、跟小麥溝通的方式

- **一律用繁體中文回覆**
- 他是自學的開發者，說明要白話、不要術語堆疊；但他看得懂 code，也會實際驗收
- 表格用 Markdown 表格
- **不要宣稱測過沒測過的東西。** 做不到就直說（例如 iOS 推播、LINE 的「開啟 LINE 傳送」按鈕都需要真手機才驗得了）
- 講到「後端」時預設用 Python（Flask / FastAPI），不要用 Node.js —— 不過這個專案沒有後端
- 交付檔案不要用「秘密」「聊天」這種敏感字眼命名

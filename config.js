/* =====================================================================
   沙壩隨身團務 — 設定檔（整個專案「唯一」需要你動手改的檔案）
   ---------------------------------------------------------------------
   sync:
     'local'    → 單機模式：資料只存在各自手機
     'firebase' → 全團即時同步：領隊一改，所有人手機自動更新
   firebase: 到 Firebase 主控台 → 專案設定 → 「你的應用程式」→ SDK 設定
             把 firebaseConfig 裡的值貼進來（步驟見 README.md）
   ===================================================================== */
window.SAPA_CONFIG = {
  sync: 'firebase',
  firebase: {
    apiKey: 'AIzaSyCYskPDCF5E8igBoyWDMYLjcpsT8YdVZUY',
    authDomain: 'sapa-tour.firebaseapp.com',
    databaseURL: 'https://sapa-tour-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'sapa-tour',
    storageBucket: 'sapa-tour.firebasestorage.app',
    messagingSenderId: '301019651563',
    appId: '1:301019651563:web:984b972fea9f6593ee8dae'
  },
  path: 'trip',               // 資料庫裡的根節點名稱，一團一個（第二團可改成 trip2）
  auth: '',                   // '' = 不登入（知道網址就能讀寫）；'anon' = 匿名登入（搭配 firebase.rules.auth.json，只有登入過的裝置能寫）
  firebaseVersion: '10.14.1'  // Firebase SDK 版本，正常不用改
};

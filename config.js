/* =====================================================================
   沙壩隨身團務 — 設定檔（整個專案「唯一」需要你動手改的檔案）
   ---------------------------------------------------------------------
   sync:
     'local'    → 單機模式：資料只存在各自手機（未接後端時的預設）
     'firebase' → 全團即時同步：領隊一改，所有人手機自動更新
   firebase: 到 Firebase 主控台 → 專案設定 → 「你的應用程式」→ SDK 設定
             把 firebaseConfig 裡的值貼進來（步驟見 README.md）
   ===================================================================== */
window.SAPA_CONFIG = {
  sync: 'local',
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',          // 例：https://xxxx-default-rtdb.asia-southeast1.firebasedatabase.app
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  path: 'trip',               // 資料庫裡的根節點名稱，一團一個（第二團可改成 trip2）
  firebaseVersion: '10.14.1'  // Firebase SDK 版本，正常不用改
};

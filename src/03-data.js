/* ===== 圖示：100% inline SVG，無外部字型／CDN ===== */
var APP_VERSION = '3.27';
var ICONS = {
  megaphone:'<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6a8 8 0 0 1 0 12"/>',
  pin:'<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  key:'<circle cx="7.5" cy="15.5" r="3.5"/><path d="M10 13l10-10M15 5l3 3M12 8l3 3"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5a5 5 0 0 1 6 5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  edit:'<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M13 7l4 4"/>',
  up:'<path d="M6 15l6-6 6 6"/>',
  down:'<path d="M6 9l6 6 6-6"/>',
  check:'<path d="M5 12l4 4L19 7"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  coat:'<path d="M9 3l3 2 3-2 5 3-2 4-1.5-.5V21h-9V9.5L6 10 4 6z"/><path d="M12 5v16"/>',
  shoes:'<path d="M3 17h18v2H3z"/><path d="M3 17V9h6l2 3h5a4 4 0 0 1 4 4v1"/>',
  toilet:'<circle cx="12" cy="4.5" r="2"/><path d="M8 9h8l-1.2 6H13v6h-2v-6H9.2z"/>',
  rain:'<path d="M7 15a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 8a3.5 3.5 0 0 1 0 7"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  meal:'<path d="M7 3v18M5 3v5a2 2 0 0 0 4 0V3"/><path d="M16 3c-2 2-2 6 0 8v10"/>',
  ticket:'<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  mountain:'<path d="M3 20l6-11 4 6 2-3 6 8z"/>',
  bus:'<rect x="4" y="4" width="16" height="14" rx="3"/><path d="M4 11h16M8 18v2M16 18v2M8 15h.01M16 15h.01"/>',
  cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17h.01"/>',
  refresh:'<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  shuffle:'<path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
  taxi:'<path d="M5 11l2-5h10l2 5"/><rect x="3" y="11" width="18" height="7" rx="2"/><path d="M7 18v2M17 18v2M7 14h.01M17 14h.01"/>',
  wifi:'<path d="M5 10a10 10 0 0 1 14 0"/><path d="M8 13a6 6 0 0 1 8 0"/><path d="M12 17h.01"/>',
  plug:'<path d="M9 3v6"/><path d="M15 3v6"/><path d="M6 9h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6z"/><path d="M12 18v3"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  bed:'<path d="M3 18V8"/><path d="M3 12h18v6"/><path d="M3 12V9a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  ban:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  flag:'<path d="M5 21V4h11l-1 4 1 4H5"/>',
  clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 12l2 2 4-4"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  thermo:'<path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  walk:'<circle cx="13" cy="4" r="1.8"/><path d="M9 21l2.5-7L9 12l1-5 4 1 2 3 3 1"/><path d="M8 13l-2 3 1 5"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  cup:'<path d="M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 3v2M11 3v2"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  auto:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
  book:'<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  heart:'<path d="M19.5 12.6 12 20l-7.5-7.4a4.6 4.6 0 0 1 6.5-6.5l1 1 1-1a4.6 4.6 0 0 1 6.5 6.5z"/>',
  plane:'<path d="M10 14L3 11l1-2 7 1 5-6h3l-3 7 4 4-1 2-5-2-3 4H9z"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  share:'<path d="M12 16V3"/><path d="M8.5 6.5 12 3l3.5 3.5"/><path d="M8 10H5v11h14V10h-3"/>',
  install:'<path d="M12 3v10"/><path d="M8 9l4 4 4-4"/><rect x="4" y="16" width="16" height="5" rx="1.5"/>',
  dots:'<circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/>',
  dotsh:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  boxplus:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 9v6M9 12h6"/>',
  /* 備份與還原：逆時針箭頭繞著時鐘 */
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 4.5V9h4.5"/><path d="M12 7.5V12l3 2"/>',
  /* 購物袋：分組「逛街」分類用 */
  bag:'<path d="M5.2 8h13.6l-1.1 12H6.3z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  /* 「把訊息傳到聊天室」：對話框 + 往外送出的箭頭。自己畫的，不是任何 App 的商標 */
  lineshare:'<path d="M3 5h11v9H8l-5 4V5z"/><path d="M15.5 3.5H21V9"/><path d="M21 3.5l-7 7"/>'
};
function ic(n, cls){ return '<svg class="i'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[n]||'')+'</svg>'; }

/* 行程防呆標籤字典 */
var TAGS = {
  coat:{icon:'coat',label:'厚外套'}, shoes:{icon:'shoes',label:'防滑鞋'}, toilet:{icon:'toilet',label:'有洗手間'},
  rain:{icon:'rain',label:'雨具'}, meal:{icon:'meal',label:'用餐'}, ticket:{icon:'ticket',label:'帶護照'},
  alt:{icon:'mountain',label:'高海拔'}, bus:{icon:'bus',label:'長途車'}, cash:{icon:'cash',label:'備現金'},
  walk:{icon:'walk',label:'步行多'}, camera:{icon:'camera',label:'拍照點'}, pill:{icon:'thermo',label:'易暈車坐前排'},
  bed:{icon:'bed',label:'入住'}
};
var TAG_ICONS = ['coat','shoes','toilet','rain','meal','ticket','mountain','bus','cash','walk','camera','thermo','bed','cup','wifi','taxi','clock','flag','star','alert','info','pin','phone','key','plane','book','check','users','calendar'];
/* 長輩卡片徽章：彩色 inline SVG（不用 emoji，各手機顯示才會一致） */
var BADGES = [
  {id:'lead',label:'總隊長 / 車長',svg:'<path d="M2.6 8.4l3.6 2.6 4.2-5.6a1.9 1.9 0 0 1 3.2 0l4.2 5.6 3.6-2.6a1 1 0 0 1 1.6 1L20.8 18H3.2L1 9.4a1 1 0 0 1 1.6-1z" fill="#E0A82E"/><rect x="3" y="18.6" width="18" height="2.6" rx="1.1" fill="#B8860F"/>'},
  {id:'group',label:'小組長',svg:'<rect x="4.4" y="3" width="2.2" height="18" rx="1.1" fill="#6B7280"/><path d="M7.4 4.2h11.4a.7.7 0 0 1 .55 1.13L17 8.2l2.35 2.87a.7.7 0 0 1-.55 1.13H7.4z" fill="#E03B2F"/>'},
  {id:'star',label:'壽星',svg:'<rect x="3" y="12" width="18" height="8.6" rx="2.2" fill="#EC5C8D"/><rect x="3" y="15.4" width="18" height="1.7" fill="#FAB6CE"/><rect x="11.1" y="6.4" width="1.8" height="5.6" rx=".9" fill="#F5C542"/><path d="M12 2.6c1.6 1.5 2.2 2.4 2.2 3.2a2.2 2.2 0 1 1-4.4 0c0-.8.6-1.7 2.2-3.2z" fill="#F5822B"/>'},
  {id:'veg',label:'素食',svg:'<path d="M4 20C4 11 9.5 4 20 4c0 10.5-7 16-16 16z" fill="#2F9E4F"/><path d="M4.8 19.4C8.2 14 12.2 10.6 17 8.2" stroke="#EAF7EE" stroke-width="1.7" stroke-linecap="round" fill="none"/>'},
  {id:'warm',label:'需溫熱水',svg:'<path d="M3.4 9h13.2v7a4 4 0 0 1-4 4H7.4a4 4 0 0 1-4-4z" fill="#EA7317"/><path d="M17.2 10.6h1.4a2.3 2.3 0 0 1 0 4.6h-1.4" fill="none" stroke="#EA7317" stroke-width="1.8"/><path d="M7.6 6.6c0-1 1.2-1.4 1.2-2.5M12 6.6c0-1 1.2-1.4 1.2-2.5" stroke="#F7B071" stroke-width="1.7" stroke-linecap="round" fill="none"/>'},
  {id:'pill',label:'易暈車',svg:'<g transform="rotate(-45 12 12)"><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" fill="#6D4CB0"/><path d="M12 8.5h6a3.5 3.5 0 0 1 0 7h-6z" fill="#C9B7EC"/></g>'},
  {id:'bag',label:'行李協助',svg:'<rect x="9" y="3.2" width="6" height="4.6" rx="1.5" fill="none" stroke="#1A66D0" stroke-width="1.9"/><rect x="3" y="7.4" width="18" height="12.6" rx="2.2" fill="#1A66D0"/><rect x="11.1" y="9.4" width="1.8" height="8.7" rx=".9" fill="#A9CBF5"/>'},
  {id:'photo',label:'攝影',svg:'<path d="M9.2 4h5.6l1.3 2.2H20a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.2a2 2 0 0 1 2-2h3.9z" fill="#00796B"/><circle cx="12" cy="13" r="4.1" fill="#FFFFFF"/><circle cx="12" cy="13" r="2.3" fill="#00796B"/>'}
];
/* 舊資料相容：先前存的是 emoji 字元 */
var BADGE_FROM_EMOJI = {'👑':'lead','🚩':'group','🌟':'star','🥗':'veg','🍵':'warm','💊':'pill','🧳':'bag','📸':'photo'};
var BGS = [['bg-white','白'],['bg-yellow','鵝黃'],['bg-pink','粉紅'],['bg-green','草綠'],['bg-blue','淺藍']];
var BDS = [['bd-grey','一般'],['bd-gold','金框'],['bd-red','紅虛線'],['bd-black','粗黑框']];
/* ===== 分組的大分類（v3.25；原本的「航空公司」頁籤併進「交通」分類）=====
   分組頁最上面固定四個大分類，每個情境（sc.cat）屬於其中一類。分類決定兩件事：
   ① 新增情境時的預設：名稱建議、預設的組別名稱與組數、臨時標籤開不開；
   ② 每一組多出來的欄位：交通有搭乘時間與上車地點、餐飲有桌次與用餐時間、逛街有集合時間與地點、旅伴有組長。
   gf＝每一組的欄位 {k:存在情境裡的陣列名, l:標籤, t:型態, pfx:顯示在組別下面那行的前綴, ph:輸入提示}；
   sf＝整個情境的欄位（存在情境本身）；gn＝預設組別名稱（# 換成第幾組，@ 換成 A、B、C…）；
   pre＝名稱建議，按一下就帶入名稱，還可以順便帶預設值：sf＝情境欄位（例：晚餐的用餐時間 18:00，已經填了就不蓋掉）、
   per＝每組大約幾人（新增時組數還沒動過就依團員人數排，例：兩人一組、33 人 → 17 組）。 */
var SCN_CATS = [
  {id:'transport',label:'交通',icon:'bus',gn:'@ 車',dn:2,tags:0,pre:[{n:'航班'},{n:'接駁車'},{n:'火車'},{n:'高鐵'},{n:'遊覽車'}],
   blurb:'依「搭什麼交通」分組。每一組可以填搭乘時間與上車地點，團員在首頁就看得到自己搭哪一組、什麼時候、在哪裡集合。',
   gf:[{k:'times',l:'搭乘時間',t:'time',pfx:'搭乘 '},{k:'backs',l:'回程時間（選填）',t:'time',pfx:'回程 '},{k:'notes',l:'上車／集合地點',t:'text',pfx:'',ph:'例：桃園第二航廈、飯店大廳'},{k:'shorts',l:'徽章短名（選填，留白就用名稱前 2 個字）',t:'short',pfx:'',ph:'例：長榮'}],
   sf:[]},
  {id:'meal',label:'餐飲',icon:'meal',gn:'第 # 桌',dn:4,tags:1,pre:[{n:'早餐',sf:{time:'07:30'},per:10},{n:'午餐',sf:{time:'12:00'},per:10},{n:'晚餐',sf:{time:'18:00'},per:10},{n:'用餐分桌',per:10}],
   blurb:'依「坐哪一桌」分組。每一組就是一桌（桌次），還可以填用餐時間與餐廳，並在團員身上貼「素食、已點餐」這類臨時標籤。',
   gf:[{k:'notes',l:'桌位說明（選填）',t:'text',pfx:'',ph:'例：靠窗、素食桌'}],
   sf:[{k:'time',l:'用餐時間（選填）',t:'time',pfx:'用餐 '},{k:'place',l:'餐廳／地點（選填）',t:'text',pfx:'',ph:'例：Sapa Xưa 餐廳'}]},
  {id:'shop',label:'逛街',icon:'bag',gn:'第 # 隊',dn:2,tags:0,pre:[{n:'自由逛街'},{n:'夜市'},{n:'購物'}],
   blurb:'自由活動時分成幾隊。每一隊可以填要去哪裡、幾點回來集合，彼此有個照應。',
   gf:[{k:'notes',l:'要去哪裡（選填）',t:'text',pfx:'',ph:'例：夜市、廣場'},{k:'times',l:'回來集合時間（選填）',t:'time',pfx:'集合 '}],
   sf:[]},
  {id:'mate',label:'旅伴',icon:'users',gn:'第 # 組',dn:3,tags:0,pre:[{n:'健行分組'},{n:'同房旅伴'},{n:'兩人一組',per:2}],
   blurb:'把大家分成幾組互相照應，例如健行分組、兩人一組。每一組可以指定一位組長。',
   gf:[{k:'leaders',l:'組長（選填）',t:'text',pfx:'組長 ',ph:'例：團員05'},{k:'notes',l:'備註（選填）',t:'text',pfx:'',ph:'例：走比較慢的路線'}],
   sf:[]}
];
var SCN_MAX = 20;   /* 一個情境最多幾組（兩人一組的旅伴分組也放得下） */
/* 交通組別的小圓徽章顏色（依第幾組輪流用，白字對比都 ≥ 4.5:1）。第 1、2 組維持原本航空公司的綠色、紅色 */
var TR_COLORS = ['#0A7A4C','#C4184F','#2F5DA8','#B45309','#7A3FA0','#0F766E','#475569','#8A5A00'];
/* 舊格式（v3.24 以前）的航空公司：名稱與航廈在 settings.airlines，去回程起飛時間在 settings.flights.eva／ci，
   每位團員屬於哪一家在 members[].airline。這是「舊資料轉成航班情境」時的預設值 */
var TR_LEGACY = {eva:{short:'長榮',name:'長榮航空',note:'桃園第二航廈'},ci:{short:'華航',name:'中華航空',note:'桃園第一航廈'}};
var MEAL_TAGS = ['素食','不吃牛','不吃辣','要溫水','已點餐','已上菜','還沒到','要打包'];

/* ===== 推播通知（v3.24 預留，目前關閉中）=====
   小麥決定：成本考量，先不做推播（發送端要 Firebase Blaze 綁信用卡，或另外架 Cloudflare Worker）。
   管理專區只預留畫面：總開關與各情境開關一律灰色、不能按，欄位也是停用的。真的要做時，這份清單就是
   「什麼情況要推播」的規格：id 之後會是 settings.push.types 的欄位名稱（設計與路線見 notes/03 第十三節）。 */
var PUSH_TYPES = [
  {id:'bc',  name:'廣播更新',     sub:'主辦人改了集合時間、地點或叮嚀時，馬上通知'},
  {id:'cd',  name:'集合倒數',     sub:'集合前的幾分鐘，再提醒一次'},
  {id:'next',name:'下一站提醒',   sub:'下一站快到時提醒'},
  {id:'day', name:'每日早安摘要', sub:'每天早上列出今天的行程'},
  {id:'morn',name:'明早時程',     sub:'主辦人更新明早起床、早餐、出發時間時通知'},
  {id:'pre', name:'出發前提醒',   sub:'出發前一晚，提醒帶護照與行動電源'}
];
/* ===== 雲端同步的文件 ===== */
/* photos 獨立成一份文件：底圖不能塞在 itinerary 裡，
   因為新增／編輯行程會用 Store.save('itinerary') 整份覆寫，那樣每改一個字都要重傳所有圖。 */
/* tools（v3.23）：工具頁的內容（知識小卡、外語圖卡、外幣、計程車卡、當地急救電話），範本在 03a-tpl.js */
var DOC_KEYS = ['settings','broadcast','itinerary','members','groups','rollcall','notebook','photos','tools'];
var DOC_NAMES = {settings:'團務設定',broadcast:'廣播',itinerary:'行程',members:'名單',groups:'分組',rollcall:'點名',notebook:'記事本',photos:'底圖',tools:'工具內容'};

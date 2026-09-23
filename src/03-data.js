/* ===== 圖示：100% inline SVG，無外部字型／CDN ===== */
var APP_VERSION = '3.20';
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
/* 航空公司小圓徽章：同團分搭兩家航空時，機場分航廈集合用 */
var AIRLINES = {eva:{label:'長榮',name:'長榮航空',note:'桃園第二航廈',term:'T2',cls:'eva'},ci:{label:'華航',name:'中華航空',note:'桃園第一航廈',term:'T1',cls:'ci'}};
var MEAL_TAGS = ['素食','不吃牛','不吃辣','要溫水','已點餐','已上菜','還沒到','要打包'];

/* 越南鈔票（顏色為近似值，重點是提醒「同色系」的混淆組） */
var NOTES = [
  {v:500000,label:'500k',color:'#4BB3C6',note:'藍綠色 ⚠'},
  {v:200000,label:'200k',color:'#B65A3C',note:'紅棕色'},
  {v:100000,label:'100k',color:'#3E8E5B',note:'綠色'},
  {v:50000,label:'50k',color:'#C2678F',note:'粉紫色'},
  {v:20000,label:'20k',color:'#4C86C4',note:'藍色 ⚠'},
  {v:10000,label:'10k',color:'#B8862D',note:'黃褐色'}
];

/* 越語圖卡：出示給對方看為主，讀音只是輔助 */
/* 溝通圖卡分類：先點分類、再點圖卡（張數多了才不會滑不完） */
var PHRASE_CATS = [
  {id:'hi',   e:'🙏', name:'基本禮貌',  sub:'你好、謝謝、聽不懂'},
  {id:'eat',  e:'🍜', name:'點餐與飲食', sub:'溫水、不要香菜、過敏'},
  {id:'shop', e:'🛒', name:'購物與殺價', sub:'多少錢、便宜一點、刷卡'},
  {id:'go',   e:'🚕', name:'交通與問路', sub:'載我去、計費表、廁所'},
  {id:'stay', e:'🏨', name:'飯店',      sub:'退房、寄行李、沒熱水'},
  {id:'sick', e:'🤒', name:'身體不適',   sub:'頭暈、肚子痛、藥局'},
  {id:'sos',  e:'🧭', name:'走散與緊急', sub:'走散卡、報警、救護車'}
];
/* say = 空耳中文：照著念就有七八分像，長輩不用學越南文也講得出口 */
var PHRASES = [
  /* --- 基本禮貌 --- */
  {cat:'hi',e:'👋',zh:'你好',vi:'Xin chào.',say:'新 照'},
  {cat:'hi',e:'🙏',zh:'謝謝',vi:'Cảm ơn.',say:'感 恩'},
  {cat:'hi',e:'🙇',zh:'對不起',vi:'Xin lỗi.',say:'新 羅依'},
  {cat:'hi',e:'🙅',zh:'不用了，謝謝',vi:'Không cần, cảm ơn.',say:'空 艮，感 恩'},
  {cat:'hi',e:'❓',zh:'我聽不懂',vi:'Tôi không hiểu.',say:'兜依 空 修'},
  {cat:'hi',e:'✍️',zh:'請寫在這裡',vi:'Xin viết ra đây.',say:'新 越 匝 呆'},
  {cat:'hi',e:'🐢',zh:'請說慢一點',vi:'Xin nói chậm lại.',say:'新 諾依 讚 賴'},
  {cat:'hi',e:'⭕',zh:'好 / 不是',vi:'Vâng. / Không.',say:'翁 / 空'},
  /* --- 點餐與飲食 --- */
  {cat:'eat',e:'🍵',zh:'溫開水，不加冰',vi:'Cho tôi xin nước ấm, không đá.',say:'糗 兜依 新 呢 暗，空 達'},
  {cat:'eat',e:'♨️',zh:'請給我熱水',vi:'Cho tôi xin nước nóng.',say:'糗 兜依 新 呢 弄'},
  {cat:'eat',e:'🌿',zh:'請不要放香菜',vi:'Xin đừng cho rau mùi.',say:'新 登 糗 繞 妹'},
  {cat:'eat',e:'🌶️',zh:'不要辣',vi:'Không cay.',say:'空 該'},
  {cat:'eat',e:'🧂',zh:'請不要加味精',vi:'Xin đừng cho bột ngọt.',say:'新 登 糗 撥 諾'},
  {cat:'eat',e:'🥗',zh:'我吃素（全素）',vi:'Tôi ăn chay. Không thịt, không cá, không nước mắm.',say:'兜依 安 齋'},
  {cat:'eat',e:'🦐',zh:'我對海鮮過敏（蝦、蟹、魷魚、螺），請不要放進菜裡',vi:'Tôi bị dị ứng hải sản (tôm, cua, mực, ốc). Xin đừng cho vào món ăn.',say:'兜依 逼 基 恩 嗨 賞'},
  {cat:'eat',e:'🥜',zh:'我對花生過敏，請不要放進菜裡',vi:'Tôi bị dị ứng lạc (đậu phộng). Xin đừng cho vào món ăn.',say:'兜依 逼 基 恩 辣'},
  {cat:'eat',e:'🐄',zh:'我不吃牛肉',vi:'Tôi không ăn thịt bò.',say:'兜依 空 安 提 播'},
  {cat:'eat',e:'👥',zh:'兩人份',vi:'Cho hai người ăn.',say:'糗 嗨 額 安'},
  {cat:'eat',e:'👍',zh:'有什麼推薦的？',vi:'Có món gì ngon?',say:'果 蒙 記 濃'},
  {cat:'eat',e:'🥢',zh:'請再給我一雙筷子',vi:'Cho tôi thêm một đôi đũa.',say:'糗 兜依 添 莫 堆 度'},
  {cat:'eat',e:'🥡',zh:'請幫我打包',vi:'Cho tôi mang về.',say:'糗 兜依 芒 為'},
  {cat:'eat',e:'🧾',zh:'買單，謝謝',vi:'Tính tiền. Cảm ơn!',say:'丁 電，感 恩'},
  /* --- 購物與殺價 --- */
  {cat:'shop',e:'💰',zh:'多少錢？',vi:'Bao nhiêu tiền?',say:'包 妞 電'},
  {cat:'shop',e:'😮',zh:'太貴了，便宜一點',vi:'Đắt quá! Bớt chút đi.',say:'達 瓜！播 竹 低'},
  {cat:'shop',e:'👀',zh:'我看看就好，謝謝',vi:'Tôi chỉ xem thôi, cảm ơn.',say:'兜依 機 顯 拖依，感 恩'},
  {cat:'shop',e:'💳',zh:'可以刷卡嗎？',vi:'Tôi trả bằng thẻ được không?',say:'兜依 匝 幫 鐵 得 空'},
  {cat:'shop',e:'🎨',zh:'有別的顏色嗎？',vi:'Có màu khác không?',say:'果 毛 卡 空'},
  {cat:'shop',e:'👕',zh:'可以試穿嗎？',vi:'Tôi mặc thử được không?',say:'兜依 麥 圖 得 空'},
  {cat:'shop',e:'🛍️',zh:'請幫我裝袋',vi:'Cho tôi cái túi.',say:'糗 兜依 蓋 堆'},
  {cat:'shop',e:'✅',zh:'我要這個',vi:'Tôi lấy cái này.',say:'兜依 雷 蓋 耐'},
  /* --- 交通與問路 --- */
  {cat:'go',e:'🚕',zh:'請載我去這裡',vi:'Làm ơn đưa tôi đến đây.',say:'藍 恩 度 兜依 頂 呆'},
  {cat:'go',e:'🧮',zh:'請開計費表',vi:'Xin bật đồng hồ tính tiền.',say:'新 拔 動 賀 丁 電'},
  {cat:'go',e:'💵',zh:'到這裡多少錢？',vi:'Đến đây bao nhiêu tiền?',say:'頂 呆 包 妞 電'},
  {cat:'go',e:'🛑',zh:'請在這裡停',vi:'Dừng ở đây.',say:'仲 兒 呆'},
  {cat:'go',e:'⏱️',zh:'還要多久？',vi:'Còn bao lâu nữa?',say:'共 包 撈 呢'},
  {cat:'go',e:'📍',zh:'這個地方在哪裡？',vi:'Chỗ này ở đâu?',say:'主 耐 兒 鬥'},
  {cat:'go',e:'📱',zh:'請幫我叫一台車',vi:'Gọi giúp tôi một chiếc taxi.',say:'軌 族 兜依 莫 這 taxi'},
  {cat:'go',e:'🚻',zh:'洗手間在哪裡？',vi:'Nhà vệ sinh ở đâu?',say:'呀 唯 星 兒 鬥'},
  /* --- 飯店 --- */
  {cat:'stay',e:'🏨',zh:'我住在這間飯店',vi:'Tôi ở khách sạn này.',say:'兜依 兒 卡 上 耐'},
  {cat:'stay',e:'🕙',zh:'幾點要退房？',vi:'Mấy giờ phải trả phòng?',say:'埋 者 費 匝 峰'},
  {cat:'stay',e:'🧳',zh:'可以寄放行李嗎？',vi:'Tôi gửi hành lý ở đây được không?',say:'兜依 規 漢 里 兒 呆 得 空'},
  {cat:'stay',e:'🚿',zh:'房間沒有熱水',vi:'Phòng tôi không có nước nóng.',say:'峰 兜依 空 果 呢 弄'},
  {cat:'stay',e:'📶',zh:'Wi-Fi 密碼是什麼？',vi:'Mật khẩu wifi là gì?',say:'麥 靠 wifi 拉 記'},
  {cat:'stay',e:'🧻',zh:'請再給我一條毛巾',vi:'Cho tôi thêm một cái khăn tắm.',say:'糗 兜依 添 莫 蓋 看 膽'},
  {cat:'stay',e:'❄️',zh:'冷氣壞了',vi:'Điều hòa bị hỏng.',say:'丟 華 逼 紅'},
  /* --- 身體不適 --- */
  {cat:'sick',e:'🤒',zh:'我不舒服',vi:'Tôi không khỏe.',say:'兜依 空 傀'},
  {cat:'sick',e:'😵',zh:'我頭暈',vi:'Tôi bị chóng mặt.',say:'兜依 逼 中 麥'},
  {cat:'sick',e:'🤢',zh:'我肚子痛',vi:'Tôi bị đau bụng.',say:'兜依 逼 到 崩'},
  {cat:'sick',e:'💊',zh:'附近有藥局嗎？',vi:'Gần đây có nhà thuốc không?',say:'亙 呆 果 呀 拖 空'},
  {cat:'sick',e:'🩺',zh:'我需要看醫生',vi:'Tôi cần đi khám bác sĩ.',say:'兜依 艮 低 康 拔 西'},
  {cat:'sick',e:'🆘',zh:'請幫我叫救護車 115',vi:'Tôi không khỏe. Xin gọi cấp cứu 115 giúp tôi.',say:'（出示此卡）'},
  /* --- 走散與緊急 --- */
  {cat:'sos',e:'🧑‍🤝‍🧑',zh:'走散了，請幫我打電話',vi:'Tôi bị lạc đoàn. Xin gọi giúp tôi số điện thoại bên dưới.',say:'（出示此卡並指向下方電話）',lost:true},
  {cat:'sos',e:'🇹🇼',zh:'我是台灣來的旅客',vi:'Tôi là khách du lịch Đài Loan.',say:'兜依 拉 卡 租 力 呆 巒'},
  {cat:'sos',e:'👮',zh:'請幫我報警 113',vi:'Xin gọi công an 113 giúp tôi.',say:'新 軌 工 安 113 族 兜依'},
  {cat:'sos',e:'🗺️',zh:'請幫我看地圖，我迷路了',vi:'Tôi bị lạc đường. Xin xem giúp bản đồ này.',say:'兜依 逼 辣 冷。新 顯 族 半 抖 耐'}
];

/* ===== 預設示範資料（正式使用時由管理者在管理模式修改，或由雲端資料覆蓋） ===== */
/* photos 獨立成一份文件：底圖不能塞在 itinerary 裡，
   因為新增／編輯行程會用 Store.save('itinerary') 整份覆寫，那樣每改一個字都要重傳所有圖。 */
var DOC_KEYS = ['settings','broadcast','itinerary','members','groups','rollcall','notebook','photos'];
var DOC_NAMES = {settings:'團務設定',broadcast:'廣播',itinerary:'行程',members:'名單',groups:'分組',rollcall:'點名',notebook:'記事本',photos:'底圖'};

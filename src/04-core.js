/* ===== 工具函式 ===== */
var VN='Asia/Ho_Chi_Minh', TW='Asia/Taipei';
function el(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function pad(n){ return (n<10?'0':'')+n; }
function uid(){ return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function tzParts(tz){
  var d=new Date();
  try{
    var f=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    var o={}; f.formatToParts(d).forEach(function(p){o[p.type]=p.value;});
    var h=parseInt(o.hour,10); if(h===24) h=0;
    return {date:o.year+'-'+o.month+'-'+o.day,h:h,m:parseInt(o.minute,10),hm:pad(h)+':'+o.minute};
  }catch(e){
    return {date:d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),h:d.getHours(),m:d.getMinutes(),hm:pad(d.getHours())+':'+pad(d.getMinutes())};
  }
}
function parseDate(s){ var p=(s||'').split('-').map(Number); if(p.length<3||isNaN(p[0])) return NaN; return Date.UTC(p[0],p[1]-1,p[2]); }
function ymd(t){ if(isNaN(t)) return ''; var d=new Date(t); return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate()); }
var WD=['日','一','二','三','四','五','六'];
/* 2026-09-24 → 9/24（四） */
function mdw(s){ var t=parseDate(s); if(isNaN(t)) return ''; var d=new Date(t); return (d.getUTCMonth()+1)+'/'+d.getUTCDate()+'（'+WD[d.getUTCDay()]+'）'; }
function dayDate(n){ var t=parseDate(S().settings.startDate); if(isNaN(t)) return ''; return mdw(ymd(t+(n-1)*86400000)); }
function dayInfo(){
  var st=S().settings, vn=tzParts(VN), days=st.days||5;
  var start=parseDate(st.startDate), today=parseDate(vn.date);
  var diff=isNaN(start)?0:Math.round((today-start)/86400000);
  if(st.dayOverride>0) return {idx:Math.min(st.dayOverride,days),status:'override',days:days,diff:diff};
  if(isNaN(start)) return {idx:1,status:'on',days:days,diff:0};
  if(diff<0) return {idx:1,status:'before',days:days,diff:diff};
  if(diff>=days) return {idx:days,status:'after',days:days,diff:diff};
  return {idx:diff+1,status:'on',days:days,diff:diff};
}
function fmtDur(min){
  if(min>=1440){ var dd=Math.floor(min/1440), hh=Math.floor((min%1440)/60); return dd+' 天'+(hh?' '+hh+' 小時':''); }
  if(min>=60) return Math.floor(min/60)+' 小時 '+(min%60?(min%60)+' 分':'');
  return min+' 分鐘';
}
/* 集合日期：優先用領隊在廣播裡選的 b.date；舊廣播沒有日期時，出發前一律當成第 1 天（出發日），
   旅程中／結束後當成今天——這樣既有的廣播不用重存也能算對。 */
function bcDate(){
  var b=S().broadcast||{}, st=S().settings;
  if(b.date&&!isNaN(parseDate(b.date))) return b.date;
  if(dayInfo().status==='before'&&!isNaN(parseDate(st.startDate))) return st.startDate;
  return tzParts(VN).date;
}
/* 距離集合還有幾分鐘（負數＝已經過了）；沒設集合時間就回 null。跨日靠 bcDate() 補上天數差。 */
function bcDiffMin(){
  var b=S().broadcast; if(!b||!b.time||b.time.indexOf(':')<0) return null;
  var vn=tzParts(VN), p=b.time.split(':').map(Number);
  var d0=parseDate(vn.date), d1=parseDate(bcDate());
  var days=(isNaN(d0)||isNaN(d1))?0:Math.round((d1-d0)/86400000);
  return days*1440+(p[0]*60+p[1])-(vn.h*60+vn.m);
}
function countdown(){
  var diff=bcDiffMin(); if(diff===null) return null;
  var bd=bcDate(), pre=(bd===tzParts(VN).date)?'':(mdw(bd)+' · ');
  if(diff>0) return {text:pre+'還有 '+fmtDur(diff),late:false};
  if(diff===0) return {text:'集合時間到了！',late:true};
  if(diff>-240) return {text:'已過 '+fmtDur(-diff),late:true};
  return null;
}
/* 標頭用的短倒數：跨日 15天／2天8h、1 小時以上 12h22、不足 1 小時 45分、過了就 已過 5分 */
function countdownShort(){
  var b=S().broadcast;
  if(!b||b.idle) return {text:'自由活動',cls:'none'};
  var diff=bcDiffMin();
  if(diff===null) return {text:'待公布',cls:'none'};
  function hm(n){ var d=Math.floor(n/1440), h=Math.floor((n%1440)/60), m=n%60;
    if(d>0) return d+'天'+((d<3&&h>0)?h+'h':'');
    return h>0 ? h+'h'+pad(m) : m+'分'; }
  if(diff>0) return {text:hm(diff), cls:(diff<=30?'late':'')};
  if(diff===0) return {text:'時間到',cls:'late'};
  if(diff>-240) return {text:'已過 '+hm(-diff),cls:'late'};
  return {text:'待公布',cls:'none'};
}
/* ===== 廣播轉成一段可以貼進 LINE 群組的文字 =====
   推播（Web Push）在 iOS 上要先加主畫面、還要按同意，估計只有三分之一的人收得到；
   LINE 群組是 33 個人都在的地方，所以領隊改完廣播後最可靠的作法還是貼一則到群組。
   這段只負責排版，實際傳送由 ACT.lineSend / ACT.copyShare 處理。 */
function appUrl(){ try{ if(location.protocol.indexOf('http')===0) return location.origin+location.pathname; }catch(e){} return 'https://750hd.com/'; }
function bcShareText(){
  var b=S().broadcast||{}, L=[];
  /* 標題只留重點：貼到群組時前面不再掛團名，倒數也不寫
     （群組訊息會留在對話紀錄裡，「還有幾小時」過幾分鐘就是錯的） */
  if(b.idle||!b.time){
    L.push('📢 '+(b.idle?'自由活動':'集合時間待公布'));
    L.push('');
    L.push(b.idle?'目前沒有集合安排，有事請直接聯絡領隊。':'集合時間還沒確定，確定後會再通知大家。');
  }else{
    L.push('📢 '+(b.label||'集合')+'通知');
    L.push('');
    L.push('🕒 '+mdw(bcDate())+b.time);
    L.push('📍 '+(b.location||'集合地點待公布'));
    if(b.tip){ L.push(''); L.push('⚠️ '+b.tip); }
  }
  L.push('');
  L.push('完整行程、房號、分組👇');
  L.push(appUrl());
  return L.join('\n');
}
function toast(msg){ var t=el('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._tm); t._tm=setTimeout(function(){t.classList.remove('show');},2200); }
function telHref(p){ return 'tel:'+String(p||'').replace(/[^\d+]/g,''); }
/* 從 LINE 內建瀏覽器開啟？（iOS 是 " Line/13.x"，Android 是 "Line/13.x/IAB"） */
function isInLine(){ try{ return /\bLine\//i.test(navigator.userAgent||''); }catch(e){ return false; } }
/* 已經「加入主畫面」後開啟就不必再提示 */
function isStandalone(){ try{ return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true; }catch(e){ return false; } }
/* 顯示「加入主畫面」提示的條件：從 LINE 開啟，或這支手機第一次打開 */
function showTip(){ if(P.tipDismissed) return false; if(isStandalone()) return false; return isInLine()||FIRST_VISIT; }
/* ===== 安裝成 App =====
   Chrome / Edge / Samsung 這類瀏覽器會先丟一個 beforeinstallprompt 事件，
   接住它就能在使用者按按鈕時直接叫出系統安裝視窗。
   iOS Safari 沒有這個事件（Apple 不提供），只能教使用者自己按分享鍵，
   所以 installApp 會依照瀏覽器分流：能直接裝就直接裝，不能就開圖文教學。 */
var INSTALL_PROMPT=null;
window.addEventListener('beforeinstallprompt',function(e){ try{ e.preventDefault(); }catch(x){} INSTALL_PROMPT=e; });
window.addEventListener('appinstalled',function(){ INSTALL_PROMPT=null; try{ toast('安裝完成，之後從主畫面的圖示打開'); }catch(x){} });
/* 瀏覽器環境判斷。只用來決定「教學要教哪一套」，判斷錯了頂多教學不對版，不影響功能 */
function uaEnv(){
  var u=''; try{ u=navigator.userAgent||''; }catch(e){}
  var ios=/iPad|iPhone|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return {
    ios:ios,
    android:/Android/.test(u),
    line:isInLine(),
    /* LINE / FB / IG / 微信 的內建瀏覽器都不能安裝，要先跳去 Safari 或 Chrome */
    inapp:isInLine()||/FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|KAKAOTALK/i.test(u)
  };
}
/* 地圖連結：預設只做「搜尋這個地點」，開起來就是地圖上的位置，要不要導航、用什麼交通方式由使用者自己決定 */
function mapHref(place){ return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place); }
/* 需要直接給路線時才用這個（目前只有住宿卡的「走回飯店」） */
function mapDirHref(place,mode){ return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place)+'&travelmode='+(mode||'walking'); }
function mapBtn(place,cls){ if(!place) return ''; return '<a class="map-btn'+(cls?' '+cls:'')+'" href="'+mapHref(place)+'" target="_blank" rel="noopener" aria-label="在 Google 地圖上看「'+esc(place)+'」的位置" title="Google 地圖看位置">'+ic('pin')+'</a>'; }
function fmtPhone(p){ return String(p||'').replace(/^(\+886|\+84|\+\d{1,3})(\d{3})(\d{3})(\d+)$/,'$1 $2 $3 $4'); }

/* ===== 本機偏好（每支手機各自保存；LINE 內建瀏覽器可能清空，所以全部都是可有可無的便利設定） ===== */
var P={fs:'md',theme:'',meId:'',leader:false,tipDismissed:false,checks:{},cards:{},tab:'home',planMode:'simple',planDay:0,roomsSeg:'rooms',tool:'menu',phCat:'',q:'',money:[],nbPage:''};
var FIRST_VISIT=false;
try{ FIRST_VISIT=!localStorage.getItem('sapa-prefs'); }catch(e){}
(function(){ try{ var p=JSON.parse(localStorage.getItem('sapa-prefs')||'{}'); ['fs','theme','meId','leader','tipDismissed','planMode','checks','cards'].forEach(function(k){ if(p[k]!==undefined) P[k]=p[k]; }); }catch(e){} })();
function savePrefs(){ try{ localStorage.setItem('sapa-prefs',JSON.stringify({fs:P.fs,theme:P.theme,meId:P.meId,leader:P.leader,tipDismissed:P.tipDismissed,planMode:P.planMode,checks:P.checks||{},cards:P.cards||{}})); }catch(e){} }

/* ===== 資料層：本機快取優先，雲端（claude db）可用時即時同步 =====
   之後若改接自家後端（例如 Python FastAPI）或 Firebase，只需替換 connect()/push() 兩個函式。 */
function loadScript(src){ return new Promise(function(res,rej){ var t=document.createElement('script'); t.src=src; t.async=true; t.onload=res; t.onerror=rej; document.head.appendChild(t); }); }
/* 純 JS SHA-256（PIN 只存雜湊，不存明文；file:// 沒有 crypto.subtle 也能用） */
function sha256(str){
  function R(n,x){return (x>>>n)|(x<<(32-n));}
  var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var bytes=unescape(encodeURIComponent(str)), l=bytes.length, words=[];
  for(var i=0;i<l;i++) words[i>>2]|=bytes.charCodeAt(i)<<(24-(i%4)*8);
  words[l>>2]|=0x80<<(24-(l%4)*8); words[((l+8>>6)<<4)+15]=l*8;
  var w=new Array(64);
  for(var j=0;j<words.length;j+=16){
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(var t=0;t<64;t++){
      if(t<16) w[t]=words[j+t]|0;
      else { var s0=R(7,w[t-15])^R(18,w[t-15])^(w[t-15]>>>3), s1=R(17,w[t-2])^R(19,w[t-2])^(w[t-2]>>>10); w[t]=(w[t-16]+s0+w[t-7]+s1)|0; }
      var S1=R(6,e)^R(11,e)^R(25,e), ch=(e&f)^(~e&g), t1=(h+S1+ch+K[t]+w[t])|0;
      var S0=R(2,a)^R(13,a)^R(22,a), mj=(a&b)^(a&c)^(b&c), t2=(S0+mj)|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0; H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
  }
  return H.map(function(x){ return ('00000000'+(x>>>0).toString(16)).slice(-8); }).join('');
}
function pinHash(pin){ return sha256('sapa-tour:'+String(pin||'')); }
/* 驗 PIN：優先比對雜湊；舊資料只有明文 pin 時也接受，並在領隊解鎖後自動升級成雜湊 */
function pinOK(input){ var st=S().settings||{};
  if(st.pinHash) return pinHash(input)===st.pinHash;
  return String(input)===String(st.pin||'8888'); }
function pinMigrate(){ var st=S().settings||{}; if(!st.pinHash){ st.pinHash=pinHash(st.pin||'8888'); delete st.pin; Store.save('settings'); } }

/* 巢狀路徑讀寫（給局部同步用）：path 形如 'present/x123' 或 'scenarios/0/assign/x9' */
function setPath(obj,path,val){ var ps=path.split('/'), o=obj; for(var i=0;i<ps.length-1;i++){ var k=ps[i]; if(o[k]==null||typeof o[k]!=='object') o[k]=(/^\d+$/.test(ps[i+1])?[]:{}); o=o[k]; } var last=ps[ps.length-1]; if(val===null||val===undefined){ if(Array.isArray(o)) o[last]=null; else delete o[last]; } else o[last]=clone(val); }

var Store={
  s:clone(DEFAULTS), mode:'local', lastSync:null, push:null, pushOp:null, backend:'', q:[], flushing:false, remoteTs:{},
  init:function(){
    try{ var c=JSON.parse(localStorage.getItem('sapa-data')||'null'); if(c&&c.docs){ DOC_KEYS.forEach(function(k){ if(c.docs[k]) Store.s[k]=c.docs[k]; }); if(c.at) Store.lastSync=new Date(c.at); if(c.q&&c.q.length) Store.q=c.q; } }catch(e){}
  },
  cache:function(){ try{ localStorage.setItem('sapa-data',JSON.stringify({docs:Store.s,at:Date.now(),q:Store.q})); }catch(e){} },
  /* 雲端快照進來：先套用雲端，再把「這支手機還沒送出去的修改」重新疊上去，離線期間的修改不會被舊快照蓋掉 */
  applyRemote:function(docs){
    var got=false;
    DOC_KEYS.forEach(function(k){ var r=docs[k]; if(r&&typeof r==='object'){ Store.s[k]=clone(r); Store.remoteTs[k]=r._ts||0; got=true; } });
    Store.q.forEach(function(op){ var d=Store.s[op.key]; if(!d||typeof d!=='object'){ d=Store.s[op.key]={}; }
      if(op.path){ setPath(d,op.path,op.val); if((d._ts||0)<op.ts) d._ts=op.ts; }
      else if(op.ts>=(d._ts||0)) Store.s[op.key]=clone(op.val); });
    /* 3.14 以前底圖是「每天一張」存在 settings.dayBg，改成每個行程一張之後那份資料沒人在用了。
       由領隊的裝置清掉一次就好，免得 33 支手機每次開 App 都白白下載那幾十 KB。 */
    if(P.leader&&Store.s.settings&&Store.s.settings.dayBg){ delete Store.s.settings.dayBg; Store.savePath('settings','dayBg',null); }
    Store.mode='cloud'; Store.lastSync=new Date(); Store.cache(); render(); Store.checkVersion(); Store.flush(); return got;
  },
  checkVersion:function(){ var st=Store.s.settings||{}; var min=st.minVersion; if(!min||Store._verToasted) return;
    if(String(min)>String(APP_VERSION)){ Store._verToasted=true; var t=el('toast'); t.innerHTML='有新版本 '+esc(min)+'，<a href="#" data-act="reloadApp" style="color:inherit;text-decoration:underline">點此重新載入</a>'; t.classList.add('show'); t.style.pointerEvents='auto'; clearTimeout(t._tm); t._tm=setTimeout(function(){ t.classList.remove('show'); t.style.pointerEvents=''; },8000); } },
  /* 依 config.js 決定後端：firebase（正式版）→ claude db（預覽版）→ 單機 */
  connect:function(){
    var cfg=window.SAPA_CONFIG||{};
    if(cfg.sync==='firebase'&&cfg.firebase&&cfg.firebase.databaseURL) return Store.connectFirebase(cfg);
    if(window.claude&&typeof window.claude.use==='function') return Store.connectClaude();
    Store.mode='local'; renderSync();
  },
  connectFirebase:function(cfg){
    Store.mode='connecting'; Store.backend='firebase'; renderSync();
    var v=cfg.firebaseVersion||'10.14.1', base='https://www.gstatic.com/firebasejs/'+v+'/', root=cfg.path||'trip';
    var chain=loadScript(base+'firebase-app-compat.js').then(function(){ return loadScript(base+'firebase-database-compat.js'); });
    if(cfg.auth==='anon') chain=chain.then(function(){ return loadScript(base+'firebase-auth-compat.js'); });
    chain.then(function(){
      firebase.initializeApp(cfg.firebase);
      var ready=Promise.resolve();
      if(cfg.auth==='anon'&&firebase.auth) ready=firebase.auth().signInAnonymously().catch(function(){ toast('匿名登入失敗，改用唯讀模式'); });
      return ready;
    }).then(function(){
      var db=firebase.database();
      db.ref(root).on('value',function(snap){ var got=Store.applyRemote(snap.val()||{}); if(!got&&P.leader) toast('雲端尚無資料，領隊第一次修改後會自動建立'); },function(err){ Store.mode='offline'; renderSync(); });
      db.ref('.info/connected').on('value',function(sn){ if(Store.mode==='cloud'||Store.mode==='offline'){ Store.mode=sn.val()?'cloud':'offline'; renderSync(); if(sn.val()) Store.flush(); } });
      Store.pushOp=function(op){ if(op.path){ var u={}; u[op.key+'/'+op.path]=op.val; u[op.key+'/_ts']=op.ts; return db.ref(root).update(u); } return db.ref(root+'/'+op.key).set(op.val); };
      Store.push=true; Store.flush();
    }).catch(function(){ Store.mode='local'; renderSync(); toast('連不上雲端，先用單機模式'); });
  },
  connectClaude:function(){
    Store.mode='connecting'; Store.backend='claude'; renderSync();
    window.claude.use('db').then(function(db){
      if(!db){ Store.mode='local'; renderSync(); return; }
      db.collection('trip').onSnapshot(function(snap){
        var docs={}; snap.docs.forEach(function(d){ if(d.exists) docs[d.id]=d.data(); });
        var got=Store.applyRemote(docs); if(!got&&P.leader) toast('雲端尚無資料，領隊第一次修改後會自動建立');
      },function(err){ Store.mode='offline'; renderSync(); });
      /* claude db 沒有路徑更新，一律整份寫 */
      Store.pushOp=function(op){ return db.doc('trip/'+op.key).set(clone(Store.s[op.key])); };
      Store.push=true; Store.flush();
    }).catch(function(){ Store.mode='local'; renderSync(); });
  },
  /* 每一次修改都是一個 op：整份（path=''）或局部（path='present/x1'）。先存本機、排進佇列，連上線就依序送出 */
  enqueue:function(op){
    var q=Store.q, last=q[q.length-1];
    if(last&&last.key===op.key&&last.path===op.path&&!last.sending){ q[q.length-1]=op; } else q.push(op);
    Store.cache(); clearTimeout(Store._ft); Store._ft=setTimeout(Store.flush,300);
  },
  flush:function(){
    if(!Store.push||Store.flushing||!Store.q.length) return;
    var op=Store.q[0]; op.sending=true; Store.flushing=true;
    Promise.resolve().then(function(){ return Store.pushOp(op); })
      .then(function(){ Store.q.shift(); Store.flushing=false; Store.lastSync=new Date(); if(Store.mode!=='cloud') Store.mode='cloud'; Store.cache(); renderSync(); Store.flush(); })
      .catch(function(e){ op.sending=false; Store.flushing=false; Store.mode='offline'; renderSync(); toast('雲端儲存失敗，已先存在這支手機，連上線會自動補送'); });
  },
  save:function(key){
    var d=Store.s[key]; if(d&&typeof d==='object') d._ts=Date.now();
    Store.cache(); render();
    Store.enqueue({key:key,path:'',val:clone(d),ts:(d&&d._ts)||Date.now()});
  },
  /* 局部寫入：只送改到的那一格，兩支手機同時操作不會互相蓋掉 */
  savePath:function(key,path,val){
    var d=Store.s[key]; if(!d||typeof d!=='object') d=Store.s[key]={};
    setPath(d,path,val); d._ts=Date.now();
    Store.cache(); render();
    Store.enqueue({key:key,path:path,val:(val===undefined?null:clone(val)),ts:d._ts});
  },
  pushAll:function(){ DOC_KEYS.forEach(function(k){ Store.save(k); }); },
  exportJSON:function(){ return JSON.stringify({app:'sapa-tour-tool',version:APP_VERSION,exportedAt:new Date().toISOString(),docs:Store.s},null,2); },
  importJSON:function(text){ var o=JSON.parse(text); var docs=o&&o.docs?o.docs:o; var n=0; DOC_KEYS.forEach(function(k){ if(docs[k]&&typeof docs[k]==='object'){ Store.s[k]=clone(docs[k]); n++; } }); if(!n) throw new Error('檔案格式不對'); Store.pushAll(); return n; }
};
setInterval(function(){ if(Store.q.length&&!Store.flushing) Store.flush(); },20000);
function S(){ return Store.s; }
function members(){ return (S().members&&S().members.items)||[]; }
function member(id){ return members().filter(function(m){return m.id===id;})[0]; }
function getMe(){ return P.meId?member(P.meId):null; }
function items(){ return (S().itinerary&&S().itinerary.items)||[]; }
function scenario(id){ var g=S().groups||{scenarios:[]}; var want=id||P.scn||g.activeId; var sc=(g.scenarios||[]).filter(function(x){return x.id===want;})[0]; return sc||(id?null:(g.scenarios||[])[0]); }
function groupNameOf(scnId,mid){ var sc=scenario(scnId); if(!sc) return ''; var gi=sc.assign&&sc.assign[mid]; if(gi===undefined||gi===null||gi<0) return ''; return sc.names[gi]||('第 '+(gi+1)+' 組'); }
/* 首頁「我的資訊」分組列：領隊可以把特定分組情境從首頁關掉（分組頁籤不受影響，只是不出現在首頁） */
function homeScnHidden(id){ return !!((S().settings.hiddenScn||{})[id]); }
function homeScnToggle(id){ var st=S().settings; if(!st.hiddenScn) st.hiddenScn={}; if(st.hiddenScn[id]) delete st.hiddenScn[id]; else st.hiddenScn[id]=true; Store.save('settings'); sheetHomeScn(); }
function contacts(){ var st=S().settings; if(st.contacts&&st.contacts.length) return st.contacts.filter(function(c){return c&&(c.phone||c.line);}); var out=[]; if(st.leaderPhone) out.push({name:st.leaderName||'領隊',label:'',phone:st.leaderPhone}); if(st.guidePhone) out.push({name:st.guideName||'導遊',label:'',phone:st.guidePhone}); return out; }
function nbPages(){ var n=S().notebook; return (n&&n.pages)||[]; }
function nbPage(id){ var ps=nbPages(); return ps.filter(function(p){return p.id===(id||P.nbPage);})[0]||ps[0]; }
function checkStats(pg){ var items=(pg.items||[]).filter(function(i){return i.kind!=='head';}); var ck=(P.checks||{})[pg.id]||{}; var done=items.filter(function(i){return ck[i.id];}).length; return {done:done,total:items.length}; }
function hotel(){ var st=S().settings; return (st.hotels||[]).filter(function(h){return h.id===st.currentHotelId;})[0]||(st.hotels||[])[0]||{}; }

/* ===== 畫面渲染 ===== */
var TABS=[['plan','行程','calendar'],['rooms','房號','key'],['groups','分組','users'],['tools','工具','grid']];
function render(){
  document.documentElement.setAttribute('data-fs',P.fs);
  if(P.theme) document.documentElement.setAttribute('data-theme',P.theme);
  else document.documentElement.removeAttribute('data-theme');
  renderHeader(); renderSync(); renderTabs();
  var fn=VIEWS[P.tab]||VIEWS.home, y=window.scrollY||0;
  try{ el('view').innerHTML=fn(); }catch(e){ el('view').innerHTML='<div class="card"><b>畫面顯示發生問題</b><div class="muted">'+esc(e.message)+'</div><button class="btn block" style="margin-top:.6rem" data-act="resetLocal">清除這支手機的快取重新載入</button></div>'; }
  el('leaderBar').hidden=!P.leader;
  var q=el('memberSearch'); if(q&&P.q){ q.value=P.q; }
  if(y) window.scrollTo(0,y);
  try{ document.documentElement.style.setProperty('--stick',((document.querySelector('.top')||{}).offsetHeight||0)+'px'); }catch(e){}
  tick();
}
function renderHeader(){
  var st=S().settings, di=dayInfo(), days=di.days||st.days||5;
  el('hdTrip').textContent=st.tripName||'旅遊團';
  el('btnTrip').hidden=!P.leader;
  /* 狀態藥丸：六種階段，全部是不換行的短標籤 */
  var t,cls='';
  if(di.status==='before'){
    var d=-di.diff;
    if(d>1){ t='倒數 '+d+' 天'; }
    else if(d===1){ t='明天出發'; cls='warm'; }
    else { t='今天出發'; cls='warm'; }
  } else if(di.status==='after'){
    t=(di.diff<=7?'旅程圓滿結束':'旅程已結束'); cls=(di.diff<=7?'done':'');
  } else if(di.idx>=days){
    t='最後一天'; cls='warm';
  } else if(di.idx===1){
    t='今天出發'; cls='warm';
  } else {
    t='第 '+di.idx+'/'+days+' 天';
  }
  var dc=el('hdDay'); dc.textContent=t; dc.className='day-chip'+(cls?' '+cls:'');
  var tb=el('btnTheme');
  if(!P.theme){ tb.innerHTML=ic('auto'); tb.title='目前：跟隨系統'; tb.setAttribute('aria-label','主題：跟隨系統'); }
  else if(P.theme==='light'){ tb.innerHTML=ic('sun'); tb.title='目前：淺色'; tb.setAttribute('aria-label','主題：淺色'); }
  else { tb.innerHTML=ic('moon'); tb.title='目前：深色'; tb.setAttribute('aria-label','主題：深色'); }
  var b=el('btnLeader'); b.innerHTML=P.leader?badgeSVG('lead'):ic('lock'); b.classList.toggle('on',!!P.leader);
  var lb=el('leaderBarIcon'); if(lb&&!lb.innerHTML) lb.innerHTML=badgeSVG('lead');
}
function isDark(){ if(P.theme) return P.theme==='dark'; var h=document.documentElement.getAttribute('data-theme'); if(h==='dark'||h==='light') return h==='dark'; try{ return window.matchMedia('(prefers-color-scheme: dark)').matches; }catch(e){ return false; } }
/* 系統深淺色改變時，若目前是「跟隨系統」就重畫（CSS 會自己換色，這裡只是同步標題列的圖示） */
(function(){ try{ var m=window.matchMedia('(prefers-color-scheme: dark)');
  var f=function(){ if(!P.theme && el('btnTheme')) renderHeader(); };
  if(m.addEventListener) m.addEventListener('change',f); else if(m.addListener) m.addListener(f);
}catch(e){} })();

/* ===== 首頁可收合卡片 =====
   領隊在 settings.cards 決定團員的預設狀態；團員自己點過的存在 P.cards。
   領隊改預設時 ts 會更新，團員的選擇隨之失效，重新套用新預設。 */
var CARD_DEF={prep:{o:1,ts:0},flight:{o:1,ts:0},morning:{o:1,ts:0},hotel:{o:0,ts:0}};
function cardLead(id){
  var c=(S().settings.cards||{})[id]||{}, d=CARD_DEF[id]||{o:1,ts:0};
  var unset=(typeof c.o==='undefined');
  /* hl（高亮提醒）跟 o（展開預設）各自獨立：領隊只開高亮時 o 仍然沿用預設值 */
  return {o:(unset?d.o:c.o)?1:0, ts:(unset?(d.ts||0):(c.ts||0)), hl:c.hl?1:0, hts:c.hts||0};
}
/* 這張卡現在要不要對「我」發光。
   領隊開了才會亮；團員自己把卡片收起來就等於「我知道了」，對他這一輪熄燈。
   領隊關掉再開一次會產生新的 hts，收起來過的人會重新亮一次。
   沒有時間到自動熄滅這件事——只有領隊關、或團員自己收起來，燈才會滅。 */
function cardHL(id){
  var L=cardLead(id); if(!L.hl) return false;
  var M=(P.cards||{})[id];
  return !(M && M.hseen===L.hts);
}
/* auto：領隊沒設定過時（ts=0）依旅程階段自動決定展開或收起 */
function cardOpen(id){ var L=cardLead(id), M=(P.cards||{})[id];
  if(M&&M.ts===L.ts) return !!M.o;
  if(L.ts===0) return !!cardAutoOpen(id);
  return !!L.o; }
function cardToggle(id){
  var L=cardLead(id); if(!P.cards) P.cards={};
  var willOpen=!cardOpen(id);
  var rec=P.cards[id]||{}; rec.o=willOpen?1:0; rec.ts=L.ts;
  /* 高亮中的卡片被團員收起來 → 記下這一輪的 hts，對他熄燈 */
  if(!willOpen && L.hl) rec.hseen=L.hts;
  P.cards[id]=rec; savePrefs(); render();
}
function cardSetLead(id){ var st=S().settings; if(!st.cards) st.cards={}; var L=cardLead(id);
  var c=st.cards[id]||(st.cards[id]={});
  c.o=L.o?0:1; c.ts=Date.now();
  Store.save('settings'); toast(c.o?'團員預設：展開':'團員預設：收起'); }
/* 高亮提醒開關（只有領隊看得到）。要亮幾張由領隊自己決定，不限制張數。 */
function cardSetHL(id){ var st=S().settings; if(!st.cards) st.cards={};
  var c=st.cards[id]||(st.cards[id]={});
  if(c.hl){ c.hl=0; } else { c.hl=1; c.hts=Date.now(); }
  Store.save('settings'); toast(c.hl?'已開啟高亮提醒，全團都會看到':'已關閉高亮提醒'); }
/* ===== 首頁卡片要放在哪一區 =====
   原本這段規則是寫死在 VIEWS.home 裡的 if/else，現在抽出來，領隊可以在
   「領隊專區 → 首頁卡片位置」調整條件，或整個改成手動指定。
   回傳 now / later / ref / hide 四種。 */
var ZONE_DEF={mode:'auto',prepUntil:'start',flightSoon:'auto',morningSoon:'trip'};
var ZONE_MANUAL_DEF={prep:'later',flight:'ref',morning:'later',hotel:'ref'};
/* 今日行程不可收合、不可搬移，但可以高亮 */
function cardFoldable(id){ return id!=='today'; }
function cardMovable(id){ return id!=='today'; }
function zoneCfg(){
  var z=S().settings.zones||{}, o={};
  for(var k in ZONE_DEF) o[k]=(z[k]===undefined||z[k]===null)?ZONE_DEF[k]:z[k];
  o.manual={}; for(var m in ZONE_MANUAL_DEF) o.manual[m]=((z.manual||{})[m]||ZONE_MANUAL_DEF[m]);
  return o;
}
/* 每張卡各自決定要不要跟著行程自動跑。
   'auto' ＝ 照下面的條件；其他值 ＝ 釘死在那一區，連旅程結束後也維持。
   z.mode 只用來讀舊資料：'auto'（或沒有）代表全部自動、'manual' 是舊版的全域手動、
   'card' 是新版逐卡設定。setPin() 會在第一次改動時把舊資料固化成 'card'。 */
function cardPin(id){
  var z=S().settings.zones||{}, m=(z.manual||{})[id];
  if(z.mode==='card') return m||'auto';
  if(z.mode==='manual') return m||ZONE_MANUAL_DEF[id]||'auto';
  return 'auto';
}
function setPin(id,v){
  var st=S().settings; if(!st.zones) st.zones={};
  var z=st.zones;
  if(z.mode!=='card'){
    /* 從舊的全域模式搬過來：先把每張卡「現在的位置」固化，免得動一張其他張跟著跳 */
    var m={}; ['prep','hotel','flight','morning'].forEach(function(x){ m[x]=cardPin(x); });
    z.manual=m; z.mode='card';
  }
  if(!z.manual) z.manual={};
  z.manual[id]=v;
}
function cardZone(id,di){
  /* 今日行程是首頁主要內容，鎖在「現在」不讓搬走；旅程結束後這張卡本來就不產生 */
  if(id==='today') return (di&&di.status==='after')?'hide':'now';
  var pin=cardPin(id);
  if(pin!=='auto') return pin;
  var z=zoneCfg();
  var before=(di.status==='before'), after=(di.status==='after'), idx=di.idx, days=di.days;
  /* 旅程結束後：回程航班最重要，擺到最上面；只留住宿備查，其餘收起 */
  if(after) return id==='flight'?'now':(id==='hotel'?'ref':'hide');
  if(id==='prep') return z.prepUntil==='off'?'hide':(z.prepUntil==='end'?'later':(before?'later':'hide'));
  if(id==='flight'){
    var soon = z.flightSoon==='always' ? true
             : z.flightSoon==='never'  ? false
             : z.flightSoon==='ends'   ? (!before&&(idx===1||idx===days))   /* before 的 idx 也是 1，要排除掉 */
             : (before||idx===1||idx===days);
    return soon?'later':'ref';
  }
  if(id==='morning') return z.morningSoon==='always'?'later':(z.morningSoon==='never'?'ref':(before?'ref':'later'));
  return 'ref';   /* hotel 及其他 */
}
var ZONE_ORDER_DEF=['today','prep','hotel','flight','morning'];
/* 同一分區裡的先後。領隊可調（自動／手動模式都生效）；位置仍由 cardZone() 決定。 */
function zoneOrder(){
  var o=(S().settings.zones||{}).order, out=[];
  if(o&&o.length) out=o.filter(function(x){ return ZONE_ORDER_DEF.indexOf(x)>=0 && out.indexOf(x)<0; });
  ZONE_ORDER_DEF.forEach(function(x){ if(out.indexOf(x)<0) out.push(x); });   /* 補齊漏掉的，順序設定壞掉也不會少卡片 */
  return out;
}
/* 看板上的 ↑↓ 可以穿過分區標題：在該區第一張再按 ↑ 就跳到上一區的最後一張之後。
   跨區＝把那張卡從「自動」改成釘死在新分區。「不顯示」不在 ↑↓ 的路線上，
   要收起來只能用下拉，避免長輩一路按 ↓ 把卡片按不見。 */
var ZONE_VIS=['now','later','ref'];
function zoneMove(id,dir){
  var di=dayInfo(), ord=zoneOrder(), z=cardZone(id,di), zi=ZONE_VIS.indexOf(z);
  if(zi<0) return;
  var sib=ord.filter(function(x){ return cardZone(x,di)===z; });
  var i=sib.indexOf(id), j=i+dir; if(i<0) return;
  var st=S().settings; if(!st.zones) st.zones={};
  if(j>=0&&j<sib.length){
    var a=ord.indexOf(id), b=ord.indexOf(sib[j]);
    ord[a]=sib[j]; ord[b]=id;
  }else{
    if(!cardMovable(id)) return;              /* 今日行程只能在現在區內換先後 */
    var nz=ZONE_VIS[zi+dir]; if(!nz) return;
    setPin(id,nz);                            /* 先釘住，cardZone 才會回報新分區 */
    ord.splice(ord.indexOf(id),1);
    var grp=ord.filter(function(x){ return cardZone(x,di)===nz; }), at;
    if(grp.length){ at = dir<0 ? ord.indexOf(grp[grp.length-1])+1 : ord.indexOf(grp[0]); }
    else{ /* 目標區是空的：排在所有更上面的區之後 */
      at=0; ord.forEach(function(x,k){ var xi=ZONE_VIS.indexOf(cardZone(x,di));
        if(xi>=0&&xi<ZONE_VIS.indexOf(nz)) at=k+1; });
    }
    ord.splice(at,0,id);
  }
  st.zones.order=ord;
  Store.save('settings'); render(); sheetCardZones(); nowCrowdCheck();
}
/* 「現在」區塞太多張，浮起的重點就散了。只提醒、不阻止。 */
function nowCrowdCheck(){
  var di=dayInfo(), n=zoneOrder().filter(function(x){ return cardZone(x,di)==='now'; }).length;
  if(n>=3) toast('「現在」區已經有 '+n+' 張卡，重點會分散');
}
/* 領隊沒設定過展開預設時，依卡片性質自動決定。foldCard 與設定面板共用同一個答案。 */
function cardAutoOpen(id,di){
  if(id==='hotel') return 0;
  if(id==='morning'){ var mo=S().settings.morning||{}; return (mo.wake||mo.depart)?1:0; }
  if(id==='flight') return cardZone('flight',di||dayInfo())!=='ref'?1:0;
  return 1;
}
function cardDefOpen(id,di){ var L=cardLead(id); return L.ts===0?!!cardAutoOpen(id,di):!!L.o; }
var ZONE_NAMES={today:'今日行程',prep:'出發前準備',flight:'航班資訊',morning:'明早時程',hotel:'目前住宿'};
var ZONE_LABELS={now:'現在',later:'稍後',ref:'隨時查',hide:'不顯示'};
function foldCard(id,icon,title,sub,sum,inner){
  /* 展開預設與高亮提醒的開關已經搬到「領隊專區 → 首頁卡片位置」，
     卡片上不再掛那條金色列，團員與領隊看到的卡片長得一樣乾淨。 */
  var open=cardOpen(id);
  var card='<section class="ccard'+(open?' open':'')+'">'+
    '<button class="chead" data-act="cardFold" data-id="'+id+'" aria-expanded="'+(open?'true':'false')+'">'+
      '<span class="ttl">'+ic(icon)+esc(title)+'</span>'+
      '<span class="sm">'+esc(open?sub:sum)+'</span>'+
      '<span class="cv">'+(open?'▲':'▼')+'</span>'+
    '</button>'+
    (open?'<div class="cbody">'+inner+'</div>':'')+
  '</section>';
  return wrapHL(id,card);
}
/* 發光那一圈畫在外層：卡片本身有 overflow:hidden，光暈畫在裡面會被裁掉 */
function wrapHL(id,html){
  if(!html||!cardHL(id)) return html;
  return '<div class="hlw"><span class="hl-tag">'+ic('star')+'提醒 ON</span>'+html+'</div>';
}
function zlab(t){ return '<div class="zlab"><span>'+t+'</span><i></i></div>'; }
function grp(key,label,cards){ cards=cards.filter(Boolean); if(!cards.length) return ''; return '<div class="zsec g-'+key+'">'+zlab(label)+cards.join('')+'</div>'; }
function renderSync(){
  /* 連線狀態（點＋字）併進標頭第二列，跟越南／台灣時間同一行；狀態字固定用簡短版本 */
  var state='', txt='';
  if(Store.mode==='cloud'){ state=(navigator.onLine===false?'off':'on'); txt=navigator.onLine===false?'離線':'已連線'; }
  else if(Store.mode==='connecting'){ txt='連線中'; }
  else if(Store.mode==='offline'){ state='off'; txt='離線'; }
  else { txt='單機'; }
  var dot=el('hdDot'), sy=el('hdSyncTx');
  dot.className='dot'+(state?' '+state:'');
  sy.textContent=txt;
  sy.title='沙壩隨身團務 v'+APP_VERSION+(Store.q.length?'（'+Store.q.length+' 筆修改待送出）':'');
  /* 選過名字的人：下面單獨一列問候；沒選名字時這列整個隱藏（連線狀態已經在上面那排看得到） */
  var me=getMe(), bar=el('syncBar');
  if(me){
    var h=tzParts(VN).h, g=(h<11?'早安':(h<18?'午安':'晚安'));
    bar.hidden=false;
    bar.innerHTML='<span class="me">'+esc(g)+'，'+esc(me.name)+'</span>';
  } else { bar.hidden=true; bar.innerHTML=''; }
}
function renderTabs(){
  var cur=(P.tab==='notes')?'tools':P.tab;
  function one(t){ return '<button class="tab'+(cur===t[0]?' on':'')+'" data-act="tab" data-tab="'+t[0]+'" aria-label="'+t[1]+'">'+ic(t[2])+'<span>'+t[1]+'</span></button>'; }
  var mid=Math.ceil(TABS.length/2);
  var home='<button class="tab-home'+(P.tab==='home'?' on':'')+'" data-act="tab" data-tab="home" aria-label="首頁"><span class="dome">'+ic('home')+'</span><span class="lb">首頁</span></button>';
  el('tabbar').innerHTML=TABS.slice(0,mid).map(one).join('')+home+TABS.slice(mid).map(one).join('');
}
function tick(){
  var vn=tzParts(VN), tw=tzParts(TW);
  el('clockVN').textContent=vn.hm; el('clockTW').textContent=tw.hm;
  var c=el('countdown'); if(c){ var cd=countdown(); c.hidden=!cd; if(cd){ c.innerHTML=ic('clock')+esc(cd.text); c.classList.toggle('late',cd.late); } }
  var hc=el('hdCountdown');
  if(hc){ var s2=countdownShort();
    hc.hidden=false;
    hc.innerHTML='<span class="k">'+(s2.cls==='none'?'集合':'集合倒數')+'</span>'+esc(s2.text);
    hc.className='cd'+(s2.cls?' '+s2.cls:'');
  }
}
setInterval(tick,15000);

/* ===== 各分頁 ===== */
var VIEWS={};
/* 防呆標籤：優先用領隊自訂的 settings.tags，沒有就退回內建 TAGS */
function tagList(){ var t=S().settings.tags; if(t&&t.length) return t;
  return Object.keys(TAGS).map(function(k){ return {id:k,icon:TAGS[k].icon,label:TAGS[k].label}; }); }
function tagDef(id){ var l=tagList(); for(var i=0;i<l.length;i++) if(l[i].id===id) return l[i]; return TAGS[id]?{id:id,icon:TAGS[id].icon,label:TAGS[id].label}:null; }
function tagsHTML(tags,place){ var out=(tags||[]).map(function(t){ var d=tagDef(t); return d?'<span class="tag">'+ic(d.icon)+esc(d.label)+'</span>':''; }).join('');
  if(place) out+='<a class="tag map" href="'+mapHref(place)+'" target="_blank" rel="noopener" aria-label="在 Google 地圖上看「'+esc(place)+'」的位置">'+ic('pin')+'地圖位置</a>';
  return out?'<div class="tags">'+out+'</div>':''; }
/* 徽章：吃新的 id，也吃舊資料存的 emoji 字元 */
function badgeDef(v){ if(!v) return null; var k=BADGE_FROM_EMOJI[v]||v;
  for(var i=0;i<BADGES.length;i++) if(BADGES[i].id===k) return BADGES[i];
  return null; }
function badgeSVG(v,cls){ var d=badgeDef(v); if(!d) return '';
  return '<svg class="bdg'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" role="img" aria-label="'+esc(d.label)+'"><title>'+esc(d.label)+'</title>'+d.svg+'</svg>'; }
function memberCard(m,opt){
  opt=opt||{}; if(!m) return '';
  var cls='mc '+(m.bg||'bg-white')+' '+(m.border||'bd-grey')+(opt.sm?' sm':'')+(P.meId===m.id?' me':'')+(opt.pk?' pk':'');
  var right='';
  if(opt.right==='room') right=m.room?('<div class="rt">'+ic('key')+' '+esc(m.room)+'</div>'):'';
  else if(opt.right==='groups'){ var g1=groupNameOf('meal',m.id), g2=groupNameOf('shuttle',m.id); right='<div class="rt">'+(m.room?esc(m.room)+' 房<br>':'')+esc([g1,g2].filter(Boolean).join(' · '))+'</div>'; }
  var tag=opt.tag||'button';
  return '<'+tag+' class="'+cls+'" data-act="'+(opt.act||'memberTap')+'" data-id="'+m.id+'"'+(opt.extra||'')+'>'+
    '<span class="em'+(badgeDef(m.emoji)?'':' none')+'">'+badgeSVG(m.emoji)+'</span>'+
    '<span class="tx"><span class="nm">'+esc(m.name)+'</span>'+(!opt.sm&&m.remark?'<span class="rk">'+esc(m.remark)+'</span>':'')+
    ((opt.mtags&&opt.mtags.length)?'<span class="mtags">'+opt.mtags.slice(0,3).map(function(x){return '<span class="mtag">'+esc(x)+'</span>';}).join('')+(opt.mtags.length>3?'<span class="mtag more">+'+(opt.mtags.length-3)+'</span>':'')+'</span>':'')+
    '</span>'+(opt.noAir?'':airlineBadge(m.airline))+right+'</'+tag+'>';
}
function airDef(k){ var d=AIRLINES[k]; if(!d) return null; var o=((S().settings||{}).airlines||{})[k]||{};
  return {cls:d.cls, short:(o.short||d.label), name:(o.name||d.name), note:(o.note===undefined||o.note===null?d.note:o.note)}; }
function airlineBadge(a,lg){ var d=airDef(a); if(!d) return ''; return '<span class="al '+d.cls+(lg?' lg':'')+'" title="'+esc(d.name)+'">'+esc(d.short)+'</span>'; }
/* 分組情境：固定不可刪除、臨時標籤 */
var FIXED_SCN={meal:1};
function scnFixed(sc){ return !!(sc && (sc.fixed || FIXED_SCN[sc.id])); }
function scnUseTags(sc){ if(!sc) return false; return sc.useTags===undefined||sc.useTags===null ? sc.id==='meal' : !!sc.useTags; }
function scnTagOpts(sc){ var t=sc&&sc.tagOpts; return (t&&t.length)?t:MEAL_TAGS.slice(); }
function mtagsOf(sc,id){ return (sc&&sc.mtags&&sc.mtags[id])||[]; }

/* --- 首頁 --- */
VIEWS.home=function(){
  var s=S(), b=s.broadcast||{}, st=s.settings, di=dayInfo(), h=[];
  if(showTip()) h.push('<div class="tip-banner">'+ic('info')+'<span>把這個網頁裝成 App，之後一鍵打開，名字也不用再選一次。</span><button class="tb-go" data-act="installApp">看教學</button><button data-act="tipClose" aria-label="關閉">'+ic('x')+'</button></div>');
  var before=(di.status==='before'), after=(di.status==='after'), day=di.idx;
  /* 出發前：領隊還沒廣播時，改顯示第 1 天第一站（例：05:30 桃園機場集合），不會是一大塊「待公布」 */
  var pre=null;
  if(before&&!b.time&&!b.idle){ var d1=items().filter(function(x){return x.day===1&&!x.isCanceled;})[0]; if(d1) pre={time:d1.time,title:d1.title}; }
  if(after){
    h.push('<section class="hero done" aria-label="旅程結束">'+
      '<div class="lab">'+ic('heart')+'旅程圓滿結束</div>'+
      '<div class="time" style="font-size:1.9rem">感謝同行，一路平安</div>'+
      '<div class="loc"><span>'+esc(st.tripName||'')+' · '+esc(dayDate(1))+' – '+esc(dayDate(di.days))+'。照片與心得歡迎丟到群組分享；出發前準備清單已收起。</span></div>'+
      (P.leader?'<div class="ctl"><button class="btn" data-act="editBroadcast">'+ic('edit')+'仍要發廣播</button><button class="btn" data-act="settings">'+ic('gear')+'團務設定</button></div>':'')+
    '</section>');
  } else if(pre){
    h.push('<section class="hero pre" aria-label="出發集合">'+
      '<div class="lab">'+ic('plane')+'出發集合'+'<span class="upd">'+esc(dayDate(1))+'</span></div>'+
      '<div class="time">'+esc(pre.time)+'<small>集合</small></div>'+
      '<div class="loc'+(pre.title.length>12?' long':'')+'">'+ic('pin')+'<span>'+esc(pre.title)+'</span></div>'+
      ((st.flights||{}).note?'<div class="tip">'+ic('info')+'<span>'+esc(st.flights.note)+'</span></div>':'')+
      (P.leader?'<div class="ctl"><button class="btn" data-act="editBroadcast">'+ic('megaphone')+'改成即時廣播</button><button class="btn" data-act="editItem" data-id="'+esc(items().filter(function(x){return x.day===1;})[0].id)+'">'+ic('edit')+'改集合資訊</button></div>':'')+
    '</section>');
  } else {
  /* 置頂即時廣播（永遠展開，不可收合） */
  var tm=(b.time||'');
  h.push('<section class="hero" aria-label="領隊即時廣播">'+
    '<div class="lab">'+ic('megaphone')+'領隊即時廣播'+(b.updatedAt?'<span class="upd">'+esc(b.updatedAt)+' 更新</span>':'')+'</div>'+
    (tm?'<div class="time">'+esc(tm)+'<small>'+esc(b.label||'集合')+'</small></div>'
       :'<div class="time" style="font-size:1.9rem">'+(b.idle?'自由活動':'集合時間待公布')+'</div>')+
    '<div class="count" id="countdown" hidden></div>'+
    (tm||!b.idle
      ?'<div class="loc'+((b.location||'').length>12?' long':'')+'">'+ic('pin')+'<span>'+esc(b.location||'集合地點待公布')+'</span></div>'
      :'<div class="loc"><span>目前沒有集合安排，請等領隊下次廣播通知。</span></div>')+
    (b.tip?'<div class="tip">'+ic('thermo')+'<span>'+esc(b.tip)+'</span></div>':'')+
    (P.leader?'<div class="ctl"><button class="btn" data-act="editBroadcast">'+ic('edit')+'修改廣播</button><button class="btn" data-act="tool" data-tool="rollcall">'+ic('clipboard')+'點名</button><button class="btn" data-act="bumpTime" data-min="15">現在＋15分</button><button class="btn" data-act="bumpTime" data-min="30">現在＋30分</button></div>'+(tm||b.location||b.tip?'<div class="hero-foot"><button class="clr" data-act="clearBroadcast">'+ic('trash')+'清空廣播</button><button class="clr shr" data-act="shareBroadcast" aria-label="把這則廣播貼到 LINE 群組">'+ic('lineshare')+'LINE</button></div>':''):'')+
  '</section>');
  }
  /* 我的資訊：不分出發前後，固定顯示航空公司／報到航廈／房號，再加上「我被分配到的每一個分組」；
     領隊可在「領隊專區→首頁分組顯示」把不想曝光的分組情境關掉。報到航廈跟著航空公司走，
     領隊在「分組→航空公司→航空公司與航廈設定」改，不是寫死在程式裡。 */
  var me=getMe();
  if(me){
    var ad=airDef(me.airline);
    var strip=[];
    strip.push('<button data-act="tab" data-tab="groups" data-scn="airline"><span class="k">航空公司</span><span class="v s">'+(ad?airlineBadge(me.airline)+' '+esc(ad.short):'待設定')+'</span></button>');
    strip.push('<button data-act="tab" data-tab="groups" data-scn="airline"><span class="k">報到航廈</span><span class="v s">'+esc(ad&&ad.note?ad.note.replace(/^桃園/,''):'—')+'</span></button>');
    strip.push('<button data-act="tab" data-tab="rooms"><span class="k">我的房號</span><span class="v">'+esc(me.room||'待分配')+'</span></button>');
    (S().groups.scenarios||[]).forEach(function(sc){
      if(homeScnHidden(sc.id)) return;
      var gi=sc.assign&&sc.assign[me.id];
      if(gi===undefined||gi===null||gi<0) return;
      var gname=sc.names[gi]||('第 '+(gi+1)+' 組');
      strip.push('<button data-act="tab" data-tab="groups" data-scn="'+esc(sc.id)+'"><span class="k">'+esc(sc.name)+'</span><span class="v s">'+esc(gname)+'</span></button>');
    });
    h.push('<div class="me-strip">'+strip.join('')+'</div>');
  } else {
    h.push('<button class="btn big block" data-act="pickMe">'+ic('search')+'<span class="b2">點這裡選你的名字<small>首頁就會顯示你的航空公司、房號、分組</small></span></button>');
  }


  /* 分區交給 cardZone()，同一區裡的先後交給 zoneOrder()（領隊可調）。 */
  var Z={now:[],later:[],ref:[]};
  var BUILD={
    today:function(){ return wrapHL('today',todayCard(di,day)); },
    prep:prepCard, hotel:hotelCard, flight:flightCard, morning:morningCard
  };
  zoneOrder().forEach(function(id){
    var z=cardZone(id,di); if(z==='hide'||!Z[z]) return;
    var html=BUILD[id](); if(html) Z[z].push(html);
  });
  h.push(grp('now','現在',Z.now));
  h.push(grp('later','稍後',Z.later));
  h.push(grp('ref','隨時查',Z.ref));

  return h.join('');
};

/* 今日行程（主卡） */
function todayCard(di,day){
  var todays=items().filter(function(x){return x.day===day;});
  /* 首頁這張主卡刻意不放底圖（小麥指定）：底圖只出現在「行程」分頁的每一站卡片上 */
  return '<section class="card">'+
    '<div class="card-h"><h2>'+ic('calendar')+(di.status==='before'?'第 1 天預告':'今日行程')+'</h2><span class="sub">第 '+day+' 天 · '+esc(dayDate(day))+'</span></div>'+
    '<div class="stack">'+todays.map(function(x){
      return '<div style="display:flex;gap:.6rem;align-items:baseline;'+(x.isCanceled?'opacity:.55;text-decoration:line-through;':'')+'">'+
        '<b style="font-variant-numeric:tabular-nums;min-width:3.2rem;color:'+(x.isCurrent?'var(--terrace)':'var(--indigo)')+'">'+esc(x.time)+'</b>'+
        '<span style="font-weight:'+(x.isCurrent?'900':'600')+';flex:1;min-width:0">'+esc(x.title)+(x.isCurrent?' <span class="chip" style="min-height:1.5rem;padding:.05rem .5rem;font-size:.75rem;background:var(--terrace-2);color:var(--terrace)">進行中</span>':'')+(x.isCanceled?' <span class="muted">取消</span>':'')+'</span>'+mapBtn(x.place)+'</div>';
    }).join('')+(todays.length?'':'<div class="muted">這天還沒有行程</div>')+'</div>'+
    '<button class="btn block soft" style="margin-top:.7rem" data-act="tab" data-tab="plan">看完整行程與注意事項 '+ic('arrow')+'</button></section>';
}

/* 出發前準備（可收合） */
function prepCard(){
  var prep=nbPages().filter(function(p){return p.type==='check';})[0];
  if(!prep) return '';
  var cs=checkStats(prep), pct=cs.total?Math.round(cs.done/cs.total*100):0;
  var done=(cs.done>=cs.total&&cs.total);
  var inner='<div class="prep-top"><span class="n">'+cs.done+'</span><span class="d">/ '+cs.total+' 項已備妥</span>'+
      '<span class="sp"></span><span class="pc">'+pct+'%</span></div>'+
    '<div class="prog"><i style="width:'+pct+'%"></i></div>';
  if(done){
    inner+='<div class="prep-done">'+ic('check')+'<span>全部備妥，可以安心出發了。</span></div>';
  }
  /* 首頁只顯示進度，實際打勾一律在完整清單頁面進行，避免長輩誤以為首頁這幾項就是全部 */
  inner+='<button class="btn block '+(done?'soft':'pri')+'" style="margin-top:.6rem" data-act="nbGo" data-id="'+prep.id+'">'+
      (done?'重看完整清單':'前往清單逐項打勾（還有 '+(cs.total-cs.done)+' 項）')+' '+ic('arrow')+'</button>'+
    '<div class="prep-note">'+ic('info')+'<span>勾選只存在你自己的手機，清單內容由領隊更新。</span></div>';
  return foldCard('prep','check',(prep.title||'出發前準備'),(done?'全部備妥':'已備 '+cs.done+' / '+cs.total),(done?'全部備妥':cs.done+' / '+cs.total+' 已備妥'),inner);
}

/* 明早時程（可收合） */
function morningCard(){
  var mo=S().settings.morning||{};
  var sum=(mo.wake||mo.depart)?('晨喚 '+(mo.wake||'--')+' · 出發 '+(mo.depart||'--')):'待公布';
  var inner='<div class="mo"><div><div class="k">晨喚</div><div class="v">'+esc(mo.wake||'--')+'</div></div><div><div class="k">早餐</div><div class="v">'+esc(mo.breakfast||'--')+'</div></div><div><div class="k">行李出房</div><div class="v">'+esc(mo.luggage||'--')+'</div></div><div><div class="k">出發</div><div class="v">'+esc(mo.depart||'--')+'</div></div></div>'+
    (mo.note?'<div class="mo-note">'+esc(mo.note)+'</div>':'')+
    (P.leader?'<div class="row" style="margin-top:.7rem"><button class="btn sm" data-act="editMorning">'+ic('edit')+'修改明早時程</button></div>':'');
  return foldCard('morning','sun','明早時程','領隊每晚更新',sum,inner);
}

/* 目前住宿（可收合） */
function hotelCard(){
  var ho=hotel(), cs=contacts();
  var sum=(ho.name||'').replace(/\s*[–—-]\s*.*$/,'')||'待公布';
  var inner='<div style="font-size:1.1rem;font-weight:900;margin-bottom:.5rem">'+esc(ho.name||'')+'</div>'+
    '<dl class="kv"><dt>Wi-Fi</dt><dd>'+esc(ho.wifi||'—')+'</dd>'+(ho.wifiPass?'<dt>密碼</dt><dd>'+esc(ho.wifiPass)+'</dd>':'')+'<dt>早餐</dt><dd>'+esc(ho.breakfast||'—')+'</dd>'+(ho.leaderRoom?'<dt>領隊房號</dt><dd>'+esc(ho.leaderRoom)+'</dd>':'')+'</dl>'+
    '<div class="row" style="margin-top:.7rem">'+(ho.addrVi||ho.nameVi||ho.name?'<a class="btn" href="'+mapDirHref((ho.nameVi||ho.name)+' '+(ho.addrVi||''))+'" target="_blank" rel="noopener">'+ic('pin')+'走回飯店</a>':'')+'<button class="btn warn" data-act="fullTaxi">'+ic('taxi')+'計程車回飯店卡</button>'+(cs[0]&&cs[0].phone?'<a class="btn" href="'+telHref(cs[0].phone)+'">'+ic('phone')+'撥給'+esc(cs[0].name)+'</a>':'')+'</div>';
  return foldCard('hotel','bed','目前住宿',(ho.nights||''),sum,inner);
}

/* 航班資訊（可收合） */
function flightCard(){
  var st=S().settings, f=st.flights||{}, days=st.days||5;
  function col(key,name,term){ var x=f[key]||{}; return '<div class="fl-col"><div class="fl-h">'+airlineBadge(key)+esc(name)+'</div>'+
    '<div class="fl-r"><b>'+esc(x.out||'--:--')+'</b><span class="k">去程 · 桃園 '+esc(term)+' 起飛</span></div>'+
    '<div class="fl-r"><b>'+esc(x.back||'--:--')+'</b><span class="k">回程 · 河內起飛</span></div></div>'; }
  function alN(k){ var d=airDef(k)||{}; return d.name||''; }
  function alT(k){ var d=airDef(k)||{}, n=d.note||'', mm=n.match(/第([一二三四五六七八九])/);
    if(mm) return 'T'+('一二三四五六七八九'.indexOf(mm[1])+1);
    mm=n.match(/T\s*([1-9])/i); if(mm) return 'T'+mm[1];
    return (AIRLINES[k]||{}).term||''; }
  var inner='<div class="fl">'+col('eva',alN('eva'),alT('eva'))+col('ci',alN('ci'),alT('ci'))+'</div>'+
    (f.note&&!(dayInfo().status==='before'&&!(S().broadcast||{}).time)?'<div class="warn-box" style="margin-top:.6rem">'+ic('clock')+'<span>'+esc(f.note)+'</span></div>':'');
  var ci=(f.ci||{}).out||'--:--', eva=(f.eva||{}).out||'--:--';
  return foldCard('flight','plane','航班資訊',dayDate(1).split('（')[0]+'–'+dayDate(days).split('（')[0],eva+' / '+ci+' 起飛',inner);
}

/* ===== 行程卡片底圖（每個行程項目一張）=====
   圖存在獨立的 photos 文件（不是 itinerary），因為新增／編輯行程是整份覆寫，
   放一起的話改一個字就要重傳所有圖。上傳時已經裁切＋縮到 360×203＋轉 WebP，
   這裡只負責畫出來。 */
function photoMap(){ var p=S().photos||{}; return p.items||(p.items={}); }
function itemBg(id){ var b=photoMap()[id]; return (b&&b.src)?b:null; }
function bgOp(b){ var n=Number(b&&b.op); return (n>=1&&n<=40)?n:9; }
/* 資料 URI 只有 base64 字元，放進行內 style 的 url('') 不用跳脫 */
function bgStyle(b){ return b?(' style="--dbg:url(\''+b.src+'\');--dop:'+(bgOp(b)/100)+'"'):''; }
/* 首頁「今日行程」主卡不放底圖：那張卡是一整天的清單，挑哪一張都是猜的，
   而且它會跟高亮的金色底、頂部彩條疊在一起。底圖只出現在「行程」分頁的每一站卡片上。 */
/* 全部底圖合計多大（設定面板顯示用，也是容量的煞車） */
function photoTotal(){
  var m=photoMap(), n=0, kb=0;
  Object.keys(m).forEach(function(k){ if(m[k]&&m[k].src){ n++; kb+=m[k].src.length/1024; } });
  return {n:n, kb:Math.round(kb)};
}
/* --- 旅遊提醒記事本 --- */
VIEWS.notes=function(){
  var ps=nbPages(), pg=nbPage(), h=[];
  h.push('<div style="display:flex;align-items:center;gap:.5rem"><button class="btn sm" data-act="tab" data-tab="tools">‹ 工具</button><b style="font-size:1.15rem">旅遊提醒記事本</b></div>');
  h.push('<div class="nb-tabs">'+ps.map(function(p){ var cs=p.type==='check'?checkStats(p):null; return '<button class="chip pick'+(pg&&p.id===pg.id?' on':'')+'" data-act="nbTab" data-id="'+p.id+'">'+esc(p.icon||'')+' '+esc(p.title)+(cs?' <span style="opacity:.75">'+cs.done+'/'+cs.total+'</span>':'')+'</button>'; }).join('')+(P.leader?'<button class="chip pick" data-act="nbEditPage" data-id="">'+ic('plus')+'頁籤</button>':'')+'</div>');
  if(!pg) return h.join('')+'<div class="card muted">記事本還沒有內容'+(P.leader?'，點上方「＋頁籤」開始':'')+'</div>';
  var isCheck=pg.type==='check', cs=isCheck?checkStats(pg):null;
  h.push('<div class="nb-title"><h2>'+esc(pg.icon||'')+' '+esc(pg.title)+'</h2>'+(P.leader?'<button class="btn sm" data-act="nbEditPage" data-id="'+pg.id+'">'+ic('edit')+'頁籤設定</button>':'')+'</div>');
  if(isCheck){
    h.push('<div class="card" style="padding:.7rem .9rem"><div style="display:flex;align-items:baseline;gap:.4rem"><span style="font-size:1.6rem;font-weight:900;font-variant-numeric:tabular-nums">'+cs.done+'</span><span style="font-weight:800">/ '+cs.total+' 已備妥</span><span style="flex:1"></span>'+(cs.done?'<button class="btn sm" data-act="nbUncheckAll" data-id="'+pg.id+'">全部重設</button>':'')+'</div><div class="prog"><i style="width:'+(cs.total?Math.round(cs.done/cs.total*100):0)+'%"></i></div><div class="muted" style="margin-top:.4rem">勾選只存在你自己的手機。</div></div>');
  } else {
    if(P.leader) h.push('<div class="muted">內容會即時同步到全團手機</div>');
  }
  var items=pg.items||[], ck=(P.checks||{})[pg.id]||{};
  h.push('<div class="it-wrap">'+items.map(function(it){
    var edit=P.leader?'<button class="btn sm edit" data-act="nbEditItem" data-pg="'+pg.id+'" data-id="'+it.id+'" aria-label="編輯">'+ic('edit')+'</button>':'';
    var body;
    if(it.kind==='head') body='<div class="nb-head">'+esc(it.text)+'</div>';
    else if(isCheck) body='<button class="ck-row'+(ck[it.id]?' on':'')+'" data-act="nbCheck" data-pg="'+pg.id+'" data-id="'+it.id+'"><span class="box">'+ic('check')+'</span><span class="tx">'+esc(it.text)+'</span></button>';
    else body='<div class="note-item">'+esc(it.text)+'</div>';
    return edit?'<div class="it-row">'+body+edit+'</div>':body;
  }).join('')+'</div>');
  if(P.leader) h.push('<div class="row"><button class="btn" data-act="nbEditItem" data-pg="'+pg.id+'" data-id="">'+ic('plus')+'新增一條</button><button class="btn" data-act="nbEditItem" data-pg="'+pg.id+'" data-id="" data-head="1">'+ic('plus')+'新增小標題</button></div>');
  return h.join('');
};

/* --- 行程 --- */
VIEWS.plan=function(){
  var di=dayInfo(), st=S().settings, days=st.days||5;
  if(!P.planDay) P.planDay=di.idx;
  var h=[];
  var fit=days<=6;
  h.push('<div class="dayrow'+(fit?' fit':'')+'" style="--days:'+days+'">'+Array.apply(null,{length:days}).map(function(_,i){ var n=i+1, today=(di.idx===n&&di.status==='on'); return '<button data-act="planDay" data-day="'+n+'" class="'+(P.planDay===n?'on':'')+(today?' today':'')+'" aria-label="第 '+n+' 天 '+esc(dayDate(n))+(today?' 今天':'')+'">'+(fit?'第'+n+'天':'第 '+n+' 天')+'<small>'+esc(fit?dayDate(n).split('（')[0]:dayDate(n))+(today?(fit?'':' 今天'):'')+'</small>'+(today?'<i class="td"></i>':'')+'</button>'; }).join('')+'</div>');
  h.push('<div class="seg"><button class="'+(P.planMode==='simple'?'on':'')+'" data-act="planMode" data-mode="simple">'+ic('grid')+'重點字卡</button><button class="'+(P.planMode==='detail'?'on':'')+'" data-act="planMode" data-mode="detail">'+ic('book')+'詳細介紹</button></div>');
  var list=items().filter(function(x){return x.day===P.planDay;});
  var hotelFor=(st.hotels||[]).filter(function(x){ return (x.nights||'').indexOf(String(P.planDay))>=0; })[0];
  h.push('<div class="day-title"><b>第 '+P.planDay+' 天</b><span class="muted">'+esc(dayDate(P.planDay))+(hotelFor?' · 夜宿 '+esc(hotelFor.name.split(' ')[0]):'')+'</span></div>');
  list.forEach(function(x,i){
    var xb=itemBg(x.id);
    var cls='stop'+(x.isCurrent&&!x.isCanceled?' cur':'')+(x.isCanceled?' off':'')+(xb?' has-bg':'');
    h.push('<article class="'+cls+'"'+bgStyle(xb)+'>'+
      (x.isCurrent&&!x.isCanceled?'<span class="badge">進行中</span>':'')+(x.isCanceled?'<span class="badge off">因天候取消</span>':'')+
      '<div class="t-time">'+esc(x.time)+(x.end?'<span>– '+esc(x.end)+'</span>':'')+'</div>'+
      '<div><h3 class="t-title">'+esc(x.title)+'</h3><p class="t-desc">'+esc(x.desc||'')+'</p>'+tagsHTML(x.tags,x.place)+
      (P.planMode==='detail'&&x.detail?'<div class="t-detail">'+esc(x.detail)+'</div>':'')+'</div>'+
      (P.leader?'<div class="lead-ctl">'+
        '<button class="btn sm" data-act="moveItem" data-id="'+x.id+'" data-dir="-1"'+(i===0?' disabled':'')+'>'+ic('up')+'上移</button>'+
        '<button class="btn sm" data-act="moveItem" data-id="'+x.id+'" data-dir="1"'+(i===list.length-1?' disabled':'')+'>'+ic('down')+'下移</button>'+
        '<button class="btn sm'+(x.isCurrent?' ok':'')+'" data-act="setCurrent" data-id="'+x.id+'">'+ic('pin')+'當前站</button>'+
        '<button class="btn sm'+(x.isCanceled?' warn':'')+'" data-act="cancelItem" data-id="'+x.id+'">'+ic('ban')+(x.isCanceled?'恢復':'取消')+'</button>'+
        '<button class="btn sm" data-act="editItem" data-id="'+x.id+'">'+ic('edit')+'編輯</button></div>':'')+
    '</article>');
  });
  if(!list.length) h.push('<div class="card muted">這天還沒有行程'+(P.leader?'，點下方新增':'')+'</div>');
  if(P.leader) h.push('<button class="btn block" data-act="editItem" data-id="">'+ic('plus')+'新增這一天的行程</button>');
  return h.join('');
};

/* 飯店 Wi-Fi（領隊可編輯） */
function wifiCard(ho){
  var n=(ho.wifi||'').trim(), pw=(ho.wifiPass||'').trim();
  var nt=(ho.wifiNote===undefined||ho.wifiNote===null?'連不上請到櫃台問，或跟領隊說。':ho.wifiNote).trim();
  return '<section class="wifi-card">'+
    '<div class="wf-h">'+ic('wifi')+'<b>飯店 Wi-Fi</b>'+(P.leader?'<span class="sp"></span><button class="btn sm" data-act="editHotel" data-id="'+esc(ho.id||'')+'">'+ic('edit')+'編輯</button>':'')+'</div>'+
    '<div class="wf-row"><span class="wf-k">名稱</span><span class="wf-v">'+(n?esc(n):'待公布')+'</span>'+(n?'<button class="btn sm" data-act="copyTxt" data-v="'+esc(n)+'">複製</button>':'')+'</div>'+
    '<div class="wf-row"><span class="wf-k">密碼</span><span class="wf-v">'+(pw?esc(pw):'待公布')+'</span>'+(pw?'<button class="btn sm" data-act="copyTxt" data-v="'+esc(pw)+'">複製</button>':'')+'</div>'+
    (nt?'<div class="wf-note'+(P.leader?' ed':'')+'"'+(P.leader?' data-act="editHotel" data-id="'+esc(ho.id||'')+'"':'')+'>'+esc(nt)+(P.leader?ic('edit'):'')+'</div>':'')+
  '</section>';
}

/* --- 房號 / 名單 --- */
VIEWS.rooms=function(){
  var h=[], st=S().settings, ho=hotel();
  h.push('<div class="seg"><button class="'+(P.roomsSeg==='rooms'?'on':'')+'" data-act="roomsSeg" data-seg="rooms">'+ic('key')+'房號總表</button><button class="'+(P.roomsSeg==='list'?'on':'')+'" data-act="roomsSeg" data-seg="list">'+ic('users')+'全員名單</button></div>');
  if(P.roomsSeg==='rooms'){
    h.push('<div class="card" style="padding:.7rem .9rem"><div style="font-weight:900;font-size:1.05rem">'+esc(ho.name||'')+'</div><div class="muted">'+esc(ho.nights||'')+(ho.leaderRoom?' · 領隊 '+esc(ho.leaderRoom)+' 房':'')+(members().some(function(m){return m.room;})?'':' · 房號待領隊分配')+'</div>'+
      (P.leader?'<div class="row" style="margin-top:.6rem"><button class="btn sm" data-act="editRooms">'+ic('edit')+'批次改房號</button><button class="btn sm" data-act="pickHotel">'+ic('bed')+'切換入住飯店</button></div>':'')+'</div>');
    h.push(wifiCard(ho));
    var byRoom={}, none=[];
    members().forEach(function(m){ if(m.room){ (byRoom[m.room]=byRoom[m.room]||[]).push(m); } else none.push(m); });
    var keys=Object.keys(byRoom).sort(function(a,b){ return a.localeCompare(b,undefined,{numeric:true}); });
    var me=getMe();
    h.push('<div class="rooms">'+keys.map(function(r){
      return '<div class="room'+(me&&me.room===r?' me-room':'')+'"><h3>'+ic('key')+esc(r)+' 房</h3>'+byRoom[r].map(function(m){return memberCard(m,{sm:true,noAir:true});}).join('')+'</div>';
    }).join('')+'</div>');
    if(me&&!me.room) h.push('<div class="card me-wait">'+ic('key')+'<span>'+esc(me.name)+'，你的房號公布後會顯示在這裡，並且排在最前面。</span></div>');
    if(none.length){ var meFirst=none.slice().sort(function(a,b){ return (b.id===(me||{}).id)-(a.id===(me||{}).id); });
      h.push('<h2 class="sec">尚未分配房號<span class="n" style="margin-left:auto;font-size:.85rem;color:var(--ink-3)">'+none.length+' 人</span></h2><div class="mlist two">'+meFirst.map(function(m){return memberCard(m,{sm:true,noAir:true});}).join('')+'</div>'); }
  } else {
    h.push('<div class="search">'+ic('search')+'<input id="memberSearch" type="search" placeholder="找我的名字…" autocomplete="off" aria-label="搜尋團員"></div>');
    h.push('<div id="memberList">'+memberListHTML()+'</div>');
    if(P.leader) h.push('<button class="btn block" data-act="editMember" data-id="">'+ic('plus')+'新增團員</button>');
  }
  return h.join('');
};

var AIR_NOTE_DEF='提醒：桃園機場長榮多在第二航廈、華航多在第一航廈，出發前請再對一次航班上的航廈；兩航廈之間有免費電車，約 5 分鐘。';
function airNote(){ var v=S().settings.airNote; return (v===undefined||v===null)?AIR_NOTE_DEF:v; }

/* 航空公司分流：不是隨機分組，而是每個人固定的屬性；卡片本身不掛徽章（徽章只在全員名單顯示），這裡改用分類區塊呈現 */
function airlineView(){
  var me=getMe(), ae=airDef('eva')||{}, ac=airDef('ci')||{};
  var cols=[['eva',ae.name],['ci',ac.name],['','尚未設定']], h=[];
  h.push('<div class="hint-lead">'+ic('info')+(P.leader?'點團員即可設定航空公司；點各區塊右上角的鉛筆可設定該航空公司的報到航廈與名稱，此頁會依航空公司自動分類顯示':'團員已依照航空公司分類顯示；機場集合請看自己排在哪一區')+'</div>');
  if(P.leader) h.push('<div class="row"><button class="btn" data-act="editAirlines">'+ic('edit')+'航空公司與航廈設定</button></div>');
  cols.forEach(function(c){
    var list=members().filter(function(m){ return (m.airline||'')===c[0]; });
    if(!c[0]&&!list.length) return;
    var mine=me&&list.some(function(m){return m.id===me.id;});
    h.push('<section class="grp'+(mine?' me-grp':'')+'"><h3>'+(c[0]?airlineBadge(c[0]):'')+esc(c[1])+'<span class="n">'+list.length+' 人</span>'+(P.leader&&c[0]?'<button class="btn sm edit" data-act="editAirlines" aria-label="設定'+esc(c[1])+'的航廈與名稱">'+ic('edit')+'</button>':'')+'</h3><div class="gm">'+list.map(function(m){return memberCard(m,{sm:true,pk:P.leader,act:P.leader?'setAirlineAsk':'memberTap',noAir:true});}).join('')+(list.length?'':'<div class="muted">（尚無）</div>')+'</div></section>');
  });
  var an=airNote();
  if(an||P.leader) h.push('<div class="card muted air-note" style="line-height:1.5">'+ic('plane')+'<span>'+(an?esc(an):'（提醒已留白，團員看不到這段）')+'</span>'+(P.leader?'<button class="btn sm" data-act="editAirNote">'+ic('edit')+'編輯</button>':'')+'</div>');
  return h.join('');
}
function memberListHTML(){
  var q=(P.q||'').trim();
  var list=members().filter(function(m){ return !q||m.name.indexOf(q)>=0||(m.remark||'').indexOf(q)>=0||(m.room||'').indexOf(q)>=0; });
  return '<div class="mlist">'+list.map(function(m){return memberCard(m,{right:'groups'});}).join('')+'</div>'+
    '<div class="muted" style="text-align:center;margin-top:.5rem">共 '+members().length+' 人'+(q?'，符合 '+list.length+' 人':'')+'</div>';
}

/* --- 分組 --- */
VIEWS.groups=function(){
  var g=S().groups, h=[], me=getMe();
  var isAir=P.scn==='airline';
  var sc=isAir?null:scenario();
  var curId=isAir?'airline':(sc?sc.id:'');
  h.push('<div class="chips">'+(g.scenarios||[]).map(function(x){ return '<button class="chip pick'+(x.id===curId?' on':'')+'" data-act="scn" data-id="'+x.id+'">'+esc(x.name)+'</button>'; }).join('')+
    '<button class="chip pick'+(isAir?' on':'')+'" data-act="scn" data-id="airline">'+ic('plane')+'航空公司</button>'+
    (P.leader?'<button class="chip pick" data-act="editScenario" data-id="">'+ic('plus')+'情境</button>':'')+'</div>');
  if(isAir) return h.join('')+airlineView();
  if(!sc) return h.join('')+'<div class="card muted">尚無分組情境</div>';
  var useTag=scnUseTags(sc), anyTag=useTag&&Object.keys(sc.mtags||{}).some(function(k){return (sc.mtags[k]||[]).length;});
  if(P.leader) h.push('<div class="row"><button class="btn pri" data-act="shuffle">'+ic('shuffle')+'一鍵隨機分組</button><button class="btn" data-act="clearGroups">'+ic('refresh')+'一鍵清除分組</button><button class="btn" data-act="editScenario" data-id="'+sc.id+'">'+ic('edit')+'組數／名稱</button>'+(useTag?'<button class="btn" data-act="manageTagOpts">'+ic('edit')+'管理標籤</button>':'')+(anyTag?'<button class="btn" data-act="clearTags">'+ic('flag')+'清空所有標籤</button>':'')+'</div><div class="hint-lead">'+ic('info')+(useTag?'點任一位團員可移到別組，也可以貼上「素食、已點餐」等臨時標籤':'隨機分組會讓同房的人在同一組；點任一位團員可移到別組')+'</div>');
  var buckets=[], un=[]; for(var i=0;i<sc.count;i++) buckets.push([]);
  members().forEach(function(m){ var gi=sc.assign?sc.assign[m.id]:undefined; if(gi===undefined||gi===null||gi<0||gi>=sc.count) un.push(m); else buckets[gi].push(m); });
  buckets.forEach(function(b,i){
    var mine=me&&b.some(function(m){return m.id===me.id;});
    h.push('<section class="grp'+(mine?' me-grp':'')+'"><h3>'+ic('flag')+esc(sc.names[i]||('第 '+(i+1)+' 組'))+'<span class="n">'+b.length+' 人</span></h3><div class="gm">'+b.map(function(m){return memberCard(m,{sm:true,pk:P.leader,act:P.leader?'moveMember':'memberTap',mtags:useTag?mtagsOf(sc,m.id):null,noAir:true});}).join('')+(b.length?'':'<div class="muted">（空）</div>')+'</div></section>');
  });
  if(un.length) h.push('<section class="grp"><h3>'+ic('users')+'尚未分組<span class="n">'+un.length+' 人</span></h3><div class="gm">'+un.map(function(m){return memberCard(m,{sm:true,pk:P.leader,act:P.leader?'moveMember':'memberTap',mtags:useTag?mtagsOf(sc,m.id):null,noAir:true});}).join('')+'</div></section>');
  return h.join('');
};

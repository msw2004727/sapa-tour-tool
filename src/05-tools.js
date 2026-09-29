/* ===== 工具分頁 ===== */
function backBar(title){ return '<div style="display:flex;align-items:center;gap:.5rem"><button class="btn sm" data-act="tool" data-tool="menu">‹ 工具</button><b style="font-size:1.15rem">'+title+'</b></div>'; }
VIEWS.tools=function(){
  switch(P.tool){
    case 'money': return toolMoney();
    case 'phrases': return toolPhrases();
    case 'sos': return toolSOS();
    case 'card': return toolCard();
    case 'rollcall': return P.leader?toolRollcall():toolMenu();
    default: return toolMenu();
  }
};
/* ===== 工具頁內容（v3.23）=====
   內容全部來自雲端的 tools 文件（範本在 03a-tpl.js），主辦人在管理模式可以編輯、清空、套用範本。
   團員看不到「還沒設定」的工具（外幣沒設、圖卡是空的）；主辦人看得到，點進去就能設定。 */
function tlCards(sec){ return tlArr('cards').filter(function(c){ return c&&typeof c==='object'&&(!sec||(c.sec==='local'?'local':'pre')===sec); }); }
function tlCard(id){ return tlCards().filter(function(c){ return c.id===id; })[0]||null; }
function tlPhrases(){ return tlArr('phrases').filter(function(p){ return p&&typeof p==='object'; }); }
function tlCats(){ return tlArr('cats').filter(function(c){ return c&&typeof c==='object'&&c.id; }); }
function tlMoney(){ var m=tl().money; return (m&&typeof m==='object')?m:{}; }
function tlLab(){ var b=tl().lab; return (b&&typeof b==='object')?b:{}; }
function moneyNotes(){ return (Array.isArray(tlMoney().notes)?tlMoney().notes:[]).filter(function(n){ return n&&Number(n.v)>0; }); }
function moneyOK(){ return Number(tlMoney().rate)>0&&moneyNotes().length>0; }
function nbHas(id){ return nbPages().some(function(p){ return p&&p.id===id; }); }
/* 顏色會放進 style 屬性，只收 #RGB／#RRGGBB，其他一律灰色（雲端資料誰都寫得進去，不能讓它跳出屬性） */
function safeColor(c){ return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(c||''))?c:'#9AA3B2'; }
/* 數字加千分位；小數最多兩位 */
function fmtNum(v){ var n=Number(v)||0, neg=n<0, s=String(Math.round(Math.abs(n)*100)/100), p=s.split('.');
  p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,','); return (neg?'-':'')+p.join('.'); }
/* 外幣 ↔ 台幣：dir 'twd'＝「1 外幣 ≈ rate 台幣」，其他（'fx'）＝「1 台幣 ≈ rate 外幣」 */
function fxToTwd(v){ var m=tlMoney(), r=Number(m.rate)||0; if(!r) return 0; return m.dir==='twd'?v*r:v/r; }
function twdToFx(v){ var m=tlMoney(), r=Number(m.rate)||0; if(!r) return 0; return m.dir==='twd'?v/r:v*r; }
function fmtTwd(v){ return (v>=10||v===0)?fmtNum(Math.round(v)):fmtNum(Math.round(v*10)/10); }
/* 反過來算的結果只要「大約」：大數字取到千、中等取到十 */
function fmtFx(v){ var a=Math.abs(v); if(a>=100000) v=Math.round(v/1000)*1000; else if(a>=1000) v=Math.round(v/10)*10; else if(a>=10) v=Math.round(v); return fmtNum(v); }
function moneyUnit(){ var m=tlMoney(); return m.unit||m.name||'外幣'; }
function rateText(){ var m=tlMoney(); if(!(Number(m.rate)>0)) return ''; return m.dir==='twd'?('1 '+moneyUnit()+' ≈ '+fmtNum(m.rate)+' 台幣'):('1 台幣 ≈ '+fmtNum(m.rate)+' '+moneyUnit()); }
/* 全螢幕卡的小標：外語在前、中文在後，例如「KHÁCH SẠN · 飯店」；沒填外語就只有中文 */
function fkLab(fl,zh){ return fl?fl+' · '+zh:zh; }
function langHead(){ var t=tl(); return (t.langTag?t.langTag+' · ':'')+(t.lang||'外語'); }
function toolMenu(){
  var h=[], L=P.leader, t=tl(), lang=t.lang||'', m=tlMoney(), ho=hotel();
  /* 裝成 App 的入口放在這裡：工具頁是團員最常回來的一頁，
     已經從主畫面開啟（standalone）就不用再出現 */
  var instBtn=isStandalone()?'':'<button class="inst-btn" data-act="installApp">'+ic(uaEnv().ios?'share':'install')+(uaEnv().ios?'加到主畫面':'安裝 App')+'</button>';
  var q=[], hasHotel=!!(ho.name||ho.nameVi||ho.addrVi);
  if(L||hasHotel) q.push('<button class="btn big warn" data-act="fullTaxi">'+ic('taxi')+'<span class="b2">計程車回飯店卡<small>'+(hasHotel?'全螢幕'+(lang?esc(lang):'')+'，直接出示給司機':'還沒有飯店資料')+'</small></span></button>');
  if(L||moneyOK()) q.push('<button class="btn big" data-act="tool" data-tool="money">'+ic('cash')+'<span class="b2">外幣點鈔速算<small>'+(moneyOK()?(m.name?esc(m.name)+' · ':'')+'按鈔票就算台幣，不用打字':'還沒設定外幣，點進去設定')+'</small></span></button>');
  if(L||tlPhrases().length) q.push('<button class="btn big" data-act="tool" data-tool="phrases">'+ic('chat')+'<span class="b2">外語點餐與溝通圖卡<small>'+(tlPhrases().length?(lang?esc(lang)+' · ':'')+'點餐、問路、買東西…':'還沒有圖卡，點進去新增')+'</small></span></button>');
  q.push('<button class="btn big" data-act="tool" data-tool="sos">'+ic('alert')+'<span class="b2">緊急求助與走失卡<small>聯絡電話、當地急救、駐外館處</small></span></button>');
  /* 清空後（或全新）主辦人第一眼就知道可以一鍵套用範本 */
  if(L&&!toolsCount(t)) h.push('<div class="hint-lead">'+ic('info')+'工具頁目前是空的：可以到最下面管理專區的「工具頁範本」一鍵套用通用版或越南範本，再改成這次的內容。</div>');
  h.push('<h2 class="sec">'+ic('grid')+'現場馬上用'+instBtn+'</h2><div class="stack">'+q.join('')+'</div>');
  if(L&&toolsCount(t)) h.push('<div class="row tl-lead"><button class="btn sm" data-act="tlClearAsk" data-sec="quick">'+ic('trash')+'清空這一區</button></div>');
  TOOL_SECS.forEach(function(sec){
    var cs=tlCards(sec.id), tiles=cs.map(function(c){ return '<button class="tcard" data-act="tlCard" data-id="'+esc(c.id)+'">'+ic(ICONS[c.icon]?c.icon:'info')+'<b>'+esc(c.title||'（沒有標題）')+'</b>'+(c.sub?'<small>'+esc(c.sub)+'</small>':'')+'</button>'; });
    /* 記事本固定掛在「出發前先看」最後一格；團員那邊記事本是空的就不放 */
    if(sec.id==='pre'&&(L||nbPages().length)) tiles.push('<button class="tcard" data-act="tab" data-tab="notes">'+ic('book')+'<b>提醒記事本</b><small>小常識、行前準備</small></button>');
    if(!tiles.length&&!L) return;
    h.push('<h2 class="sec">'+ic(sec.icon)+esc(sec.name)+'</h2>'+(tiles.length?'<div class="tool-grid">'+tiles.join('')+'</div>':''));
    if(L) h.push('<div class="row tl-lead"><button class="btn sm" data-act="tlCardEdit" data-id="" data-sec="'+sec.id+'">'+ic('plus')+'新增小卡</button>'+(cs.length?'<button class="btn sm" data-act="tlClearAsk" data-sec="'+sec.id+'">'+ic('trash')+'清空這一區</button>':'')+'</div>');
  });
  if(L){
    h.push('<h2 class="sec">'+badgeSVG('lead')+'管理專區</h2><div class="stack">'+
      '<button class="btn big" data-act="tool" data-tool="rollcall">'+ic('clipboard')+'<span class="b2">集合點名<small>誰還沒到</small></span></button>'+
      '<button class="btn big" data-act="editBroadcast">'+ic('megaphone')+'<span class="b2">修改廣播<small>時間、地點、叮嚀</small></span></button>'+
      '<button class="btn big" data-act="settings">'+ic('gear')+'<span class="b2">團務設定<small>日期、時區、PIN、電話</small></span></button>'+
      '<button class="btn big" data-act="pickHotel">'+ic('bed')+'<span class="b2">飯店資料<small>入住切換、Wi-Fi</small></span></button>'+
      '<button class="btn big" data-act="tplList">'+ic('book')+'<span class="b2">工具頁範本<small>一鍵換成通用版或越南範本</small></span></button>'+
      '<button class="btn big" data-act="editTags">'+ic('flag')+'<span class="b2">防呆標籤<small>自訂增減、改名</small></span></button>'+
      '<button class="btn big" data-act="homeScnVis">'+ic('users')+'<span class="b2">首頁分組顯示<small>哪些分組情境出現在首頁</small></span></button>'+
      '<button class="btn big" data-act="cardZones">'+ic('grid')+'<span class="b2">首頁卡片位置<small>卡片何時移到稍後／隨時查／收起</small></span></button>'+
      '<button class="btn big" data-act="simPick">'+ic('clock')+'<span class="b2">時間模擬<small>預覽旅途中、回國後的畫面，只在這支手機</small></span></button>'+
      '<button class="btn big" data-act="pushInfo">'+ic('bell')+'<span class="b2">推播通知<small>目前關閉中（成本考量），先預留開關</small></span></button>'+
      '<button class="btn big" data-act="prevList">'+ic('refresh')+'<span class="b2">還原上一版<small>資料突然變少、清空工具頁之前自動留下的</small></span></button>'+
      '<button class="btn big" data-act="bkList">'+ic('history')+'<span class="b2">備份與還原<small>一鍵清空、還原之前自動留下的備份</small></span></button>'+
    '</div><div class="row"><button class="btn dng" data-act="clearAsk">'+ic('trash')+'一鍵清空內容</button><button class="btn" data-act="leaderLock">'+ic('lock')+'鎖定管理模式</button></div>');
  }
  h.push('<div class="ver">月半團旅 v'+APP_VERSION+' · '+(Store.backend==='firebase'?'雲端同步':(Store.backend==='claude'?'預覽同步':'單機'))+'</div>');
  return h.join('');
}
/* ===== 知識小卡的簡易標記 =====
   一行一種東西，主辦人在一個大文字框裡寫：
     ## 小標題        ### 重點框的標題（開一個新的框）
     - 條列           1. 步驟（數字照順序自動編）
     ! 警示           名稱｜說明（對照表，半形 | 也可以）
     **粗體**         空一行＝分段；其他就是一般文字
   先整段跳脫再只放回 <b>，所以雲端資料裡就算有人塞 <script> 也只會顯示成文字。 */
function mdIn(s){ return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'); }
function mdLine(s){ var m;
  s=String(s).replace(/\s+$/,''); if(!s.trim()) return {t:'_'};
  s=s.replace(/^\s+/,'');
  if((m=/^#{3,}\s*(.*)$/.exec(s))) return {t:'h3',x:m[1]};
  if((m=/^#{1,2}\s*(.*)$/.exec(s))) return {t:'h2',x:m[1]};
  if((m=/^[!！]\s*(.+)$/.exec(s))) return {t:'w',x:m[1]};
  if((m=/^(?:[-•・]\s*|\*\s+)(.+)$/.exec(s))) return {t:'ul',x:m[1]};
  if((m=/^\d{1,2}(?:\.\s+|、\s*|[)）]\s*)(.+)$/.exec(s))) return {t:'ol',x:m[1]};
  if((m=/^([^｜|]+?)\s*[｜|]\s*(.+)$/.exec(s))) return {t:'kv',k:m[1],x:m[2]};
  return {t:'p',x:s}; }
function mdCard(src){
  var out=[], box=null, run=null;
  function endRun(){ if(!run) return; var h;
    if(run.t==='ul') h='<ul class="dots">'+run.a.map(function(x){ return '<li>'+mdIn(x.x)+'</li>'; }).join('')+'</ul>';
    else if(run.t==='ol') h='<ol class="steps">'+run.a.map(function(x){ return '<li>'+mdIn(x.x)+'</li>'; }).join('')+'</ol>';
    else if(run.t==='kv') h='<dl class="kv2">'+run.a.map(function(x){ return '<dt>'+mdIn(x.k)+'</dt><dd>'+mdIn(x.x)+'</dd>'; }).join('')+'</dl>';
    else h='<p>'+run.a.map(function(x){ return mdIn(x.x); }).join('<br>')+'</p>';
    box.push({w:false,h:h}); run=null; }
  /* 一個框裡只有警示的話，就不要再包一層框 */
  function endBox(){ endRun(); if(box&&box.length){ var allW=box.every(function(b){ return b.w; }), inner=box.map(function(b){ return b.h; }).join('');
      out.push(allW?inner:'<div class="info-card">'+inner+'</div>'); } box=null; }
  String(src||'').split(/\r?\n/).forEach(function(line){ var L=mdLine(line);
    if(L.t==='_'){ endRun(); return; }
    if(L.t==='h2'){ endBox(); if(L.x) out.push('<h2 class="sec">'+mdIn(L.x)+'</h2>'); return; }
    if(L.t==='h3'){ endBox(); box=[]; if(L.x) box.push({w:false,h:'<div class="ic-h">'+ic('info')+'<span>'+mdIn(L.x)+'</span></div>'}); return; }
    if(!box) box=[];
    if(L.t==='w'){ endRun(); box.push({w:true,h:'<div class="warn-box">'+ic('alert')+'<span>'+mdIn(L.x)+'</span></div>'}); return; }
    if(run&&run.t!==L.t) endRun();
    if(!run) run={t:L.t,a:[]};
    run.a.push(L); });
  endBox();
  return out.join('');
}
function toolCard(){
  var c=tlCard(P.card); if(!c) return toolMenu();
  var body=mdCard(c.body);
  return backBar(esc(c.title||'（沒有標題）'))+
    (P.leader?'<div class="row tl-lead"><button class="btn sm" data-act="tlCardEdit" data-id="'+esc(c.id)+'">'+ic('edit')+'編輯這張卡</button></div>':'')+
    (body?'<div class="kc">'+body+'</div>':'<div class="card muted">這張卡還沒有內容'+(P.leader?'，按上面的「編輯這張卡」開始寫':'')+'</div>');
}
/* 外幣點鈔速算 */
function toolMoney(){
  var m=tlMoney(), L=P.leader, ok=moneyOK(), u=moneyUnit();
  var head=backBar('外幣點鈔速算')+(L?'<div class="row tl-lead"><button class="btn sm" data-act="moneyEdit">'+ic('edit')+(ok?'外幣設定':'設定外幣')+'</button></div>':'');
  if(!ok) return head+'<div class="card muted">'+(L?'還沒設定這次要用的外幣。按上面的「設定外幣」，選一種常用貨幣就能帶入面額與參考匯率，也可以自己填。':'主辦人還沒設定這次的外幣。')+'</div>';
  var total=P.money.reduce(function(a,b){ return a+b; },0);
  return head+
    (m.warn?'<div class="warn-box">'+ic('alert')+'<span>'+mdIn(m.warn)+'</span></div>':'')+
    '<div class="total"><div class="muted">已點 '+P.money.length+' 張 · 合計</div><div class="v">'+fmtNum(total)+' '+esc(u)+'</div><div class="t">≈ NT$ '+fmtTwd(fxToTwd(total))+'</div><div class="r">'+esc(rateText())+(L?'（<a href="#" data-act="moneyEdit">可修改</a>）':'')+'</div></div>'+
    '<div class="notes">'+moneyNotes().map(function(n){ var v=Number(n.v)||0; return '<button class="note" data-act="noteTap" data-v="'+v+'"><span class="sw" style="background:'+safeColor(n.color)+'"></span><span class="nt">'+fmtNum(v)+'<small>'+esc(n.note||'')+'</small></span><span class="nv">≈ NT$ '+fmtTwd(fxToTwd(v))+'</span></button>'; }).join('')+'</div>'+
    '<div class="row"><button class="btn" data-act="moneyUndo">退一張</button><button class="btn" data-act="moneyClear">全部清除</button></div>'+
    '<section class="card"><div class="card-h"><h2>'+ic('refresh')+'反過來算：我想付台幣</h2></div><div class="f"><label>台幣金額</label><input class="in" id="twdIn" type="number" inputmode="numeric" placeholder="例如 300"></div><div class="total" style="margin-top:.6rem"><div class="v" id="twdOut">—</div><div class="muted">'+esc(u)+'（大約）</div></div></section>'+
    (nbHas('money')?'<button class="btn block soft" data-act="nbGo" data-id="money">'+ic('book')+'更多金錢與購物小技巧</button>':'');
}
/* 外語圖卡：兩層，先選類別（P.phCat 空字串＝還在類別清單），再看該類的圖卡。
   類別被刪掉的圖卡不會消失，集中在「未分類」 */
function phCatsAll(){ var cs=tlCats().slice(), ids={}; cs.forEach(function(c){ ids[c.id]=1; });
  if(tlPhrases().some(function(p){ return !ids[p.cat]; })) cs.push({id:'_',e:'📁',name:'未分類',sub:'所屬類別已經刪掉的圖卡'});
  return cs; }
function phInCat(cid){ var ids={}; tlCats().forEach(function(c){ ids[c.id]=1; }); return tlPhrases().filter(function(p){ return cid==='_'?!ids[p.cat]:p.cat===cid; }); }
function phById(id){ return tlPhrases().filter(function(p){ return p.id===id; })[0]||null; }
function toolPhrases(){
  var L=P.leader, cats=phCatsAll(), cat=cats.filter(function(c){ return c.id===P.phCat; })[0];
  if(!cat) return backBar('外語溝通圖卡')+
    (L?'<div class="row tl-lead"><button class="btn sm" data-act="langEdit">'+ic('edit')+'外語設定</button><button class="btn sm" data-act="phCatEdit" data-id="">'+ic('plus')+'新增類別</button></div>':'')+
    (cats.length?'<div class="muted">先選類別，再點你要說的那一句。點下去會放大成全螢幕，直接把手機拿給對方看。</div>'+
      '<div class="stack">'+cats.map(function(c){
        var row='<button class="ph" data-act="phCat" data-cat="'+esc(c.id)+'"><span class="e">'+esc(c.e||'')+'</span>'+
          '<span class="tx"><span class="zh">'+esc(c.name||'')+'</span><br><span class="vi">'+esc(c.sub||'')+'</span></span>'+
          '<span class="phn">'+phInCat(c.id).length+' 句</span>'+ic('arrow')+'</button>';
        return (L&&c.id!=='_')?'<div class="it-row">'+row+'<button class="btn sm edit" data-act="phCatEdit" data-id="'+esc(c.id)+'" aria-label="編輯類別">'+ic('edit')+'</button></div>':row;
      }).join('')+'</div>'
    :'<div class="card muted">'+(L?'還沒有圖卡。可以按「新增類別」自己建，或到管理專區「工具頁範本」套用通用版、越南範本。':'主辦人還沒放圖卡。')+'</div>')+
    (L&&tlPhrases().length?'<div class="row tl-lead"><button class="btn sm" data-act="phClearAsk">'+ic('trash')+'清空全部圖卡</button></div>':'');
  var list=phInCat(cat.id);
  return '<div style="display:flex;align-items:center;gap:.5rem"><button class="btn sm" data-act="phCat" data-cat="">‹ 類別</button><b style="font-size:1.15rem">'+c_e(cat)+esc(cat.name||'')+'</b></div>'+
    (list.some(function(p){ return p.say&&p.say.charAt(0)!=='（'; })?'<div class="muted" style="margin-top:.5rem">綠色那行是空耳中文，照著念就有七八分像。</div>':'')+
    '<div class="stack">'+list.map(function(p){
      var row='<button class="ph" data-act="phrase" data-id="'+esc(p.id)+'"><span class="e">'+esc(p.e||'')+'</span>'+
        '<span class="tx"><span class="zh">'+esc(p.zh||'')+'</span><br><span class="vi">'+esc(p.fl||'')+'</span>'+
        (p.say&&p.say.charAt(0)!=='（'?'<br><span class="say-s">'+esc(p.say)+'</span>':'')+'</span>'+ic('arrow')+'</button>';
      return L?'<div class="it-row">'+row+'<button class="btn sm edit" data-act="phEdit" data-id="'+esc(p.id)+'" aria-label="編輯">'+ic('edit')+'</button></div>':row;
    }).join('')+(list.length?'':'<div class="card muted">這一類還沒有圖卡</div>')+'</div>'+
    (L&&cat.id!=='_'?'<div class="row"><button class="btn" data-act="phEdit" data-id="" data-cat="'+esc(cat.id)+'">'+ic('plus')+'新增一句</button></div>':'');
}
function c_e(c){ return c.e?'<span style="margin-right:.3rem">'+esc(c.e)+'</span>':''; }
function phraseFull(p){
  var t=tl();
  return '<div class="fh"><b>出示給對方看</b><button class="btn sm" data-act="fullClose">'+ic('x')+'關閉</button></div>'+
    (p.e?'<div style="font-size:3rem;text-align:center">'+esc(p.e)+'</div>':'')+
    (p.fl?'<div class="fk">'+esc(langHead())+'</div><div class="vi xl">'+esc(p.fl)+'</div>':'')+
    '<div class="fk">中文意思</div><div class="zh">'+esc(p.zh||'')+'</div>'+
    (p.say?'<div class="fk">空耳中文 · 照著念</div><div class="say">'+esc(p.say)+'</div>':'')+
    (p.lost?'<div class="fk">'+esc(fkLab(tlLab().call,'請幫我打這些電話'))+'</div>'+contactLinks():'')+
    '<div class="foot">'+(t.thanks?esc(t.thanks)+' ':'')+'謝謝您的幫忙。</div>';
}
/* 走散卡：圖卡裡標成「走散卡」的第一張；被刪光了也要有一張（長輩走散時最需要它） */
var LOST_DEF={e:'🧑‍🤝‍🧑',zh:'走散了，請幫我打電話',fl:'I am separated from my group. Please call the phone number below for me.',say:'（出示此卡並指向下方電話）',lost:1};
function lostPhrase(){ return tlPhrases().filter(function(p){ return p.lost; })[0]||LOST_DEF; }
function contactLinks(){ return contacts().map(function(c){ return !c.phone?'':'<a class="ph-big" href="'+telHref(c.phone)+'">'+ic('phone')+'<span>'+esc(fmtPhone(c.phone))+'<small style="display:block;font-size:.85rem;color:#666;font-weight:800">'+esc(c.name)+(c.label?' · '+esc(c.label):'')+'</small></span></a>'; }).join(''); }
var FULL_LOCK=false;
function lockBar(){ return '<div class="lockbar" id="lockBar">'+(FULL_LOCK
  ?'<button class="btn sm pri" data-act="fullUnlock" id="unlockBtn">'+ic('lock')+'按住 2 秒解鎖</button><span>畫面已鎖定，不怕誤觸</span>'
  :'<button class="btn sm" data-act="fullLock">'+ic('unlock')+'鎖定畫面</button><span>把手機亮度調到最亮，遞給對方看</span>')+'</div>'; }
function taxiFull(){
  var t=tl(), tx=(t.taxi&&typeof t.taxi==='object')?t.taxi:{}, lb=tlLab(), ho=hotel(), has=!!(ho.name||ho.nameVi||ho.addrVi);
  var ctl=FULL_LOCK?'':'<span class="fh-b">'+(P.leader?'<button class="btn sm" data-act="taxiEdit">'+ic('edit')+'編輯</button>':'')+'<button class="btn sm" data-act="fullClose">'+ic('x')+'關閉</button></span>';
  return '<div class="fh"><b>出示給計程車司機</b>'+ctl+'</div>'+lockBar()+
    (tx.fl?'<div class="vi xl">'+esc(tx.fl)+'</div>':'')+(tx.zh?'<div class="zh">'+esc(tx.zh)+'</div>':'')+
    (has?'':'<div class="fk">'+(P.leader?'還沒有飯店資料：到管理專區「飯店資料」填入':'主辦人還沒填飯店資料')+'</div>')+
    '<div class="fk">'+esc(fkLab(lb.hotel,'飯店'))+'</div><div class="vi">'+esc(ho.nameVi||ho.name||'')+'</div>'+
    '<div class="fk">'+esc(fkLab(lb.addr,'地址'))+'</div><div class="vi">'+esc(ho.addrVi||'')+'</div>'+
    (ho.phone?'<div class="fk">'+esc(fkLab(lb.phone,'飯店電話'))+'</div><a class="ph-big" href="'+telHref(ho.phone)+'">'+ic('phone')+esc(fmtPhone(ho.phone))+'</a>':'')+
    '<div class="fk">'+esc(fkLab(lb.call,'緊急聯絡'))+'</div>'+contactLinks()+
    (tx.tip?'<div class="foot">'+esc(tx.tip)+'</div>':'');
}
/* 緊急求助 */
function toolSOS(){
  var st=S().settings, L=P.leader, lines=tlArr('sos').filter(function(x){ return x&&(x.name||x.phone); });
  function row(t,s2,p,cls,ln,edit){ return '<div class="em-row"><div class="t"><b>'+esc(t)+'</b><span>'+esc(s2)+'</span></div>'+(p?'<a class="btn '+(cls||'')+'" href="'+telHref(p)+'">'+ic('phone')+esc(fmtPhone(p))+'</a>':(ln?'':'<span class="muted">'+(L?'<a href="#" data-act="'+(edit||'settings')+'">請填入</a>':'尚未填入')+'</span>'))+(ln?'<a class="btn line" href="'+esc(ln)+'" target="_blank" rel="noopener">'+ic('chat')+'加 LINE</a>':'')+'</div>'; }
  /* 3.22 以前駐外館處電話放在團務設定；還沒搬進下面清單的舊資料照樣顯示 */
  var legacy=st.embassyPhone&&!lines.some(function(x){ return x.phone===st.embassyPhone; });
  return backBar('緊急求助')+
    '<button class="btn big warn" data-act="lostCard">'+ic('alert')+'<span class="b2">我走散了：出示這張卡<small>'+esc(tl().lang||'外語')+'，請路人幫忙打電話</small></span></button>'+
    '<h2 class="sec">'+ic('phone')+'緊急聯絡人</h2><div class="stack">'+
    contacts().map(function(c){ return row(c.name,c.label||'',c.phone,'pri',c.line||''); }).join('')+
    (contacts().length?'':'<div class="card muted">尚未設定聯絡人'+(L?'，請到團務設定填入':'')+'</div>')+
    '</div><h2 class="sec">'+ic('alert')+'當地與官方專線</h2><div class="stack">'+
    lines.map(function(x){ return row(x.name||'',x.sub||'',x.phone||'','','','sosEdit'); }).join('')+
    (legacy?row('駐外館處','急難救助專線',st.embassyPhone):'')+
    (lines.length||legacy?'':'<div class="card muted">'+(L?'還沒有當地的報警、救護車電話，按下面的「編輯當地電話」填入。':'主辦人還沒填當地的急救電話。')+'</div>')+
    row('外交部急難救助專線','境外撥打，24 小時（付費）','+886800085095')+
    '</div>'+
    (L?'<button class="btn block" data-act="sosEdit">'+ic('edit')+'編輯當地電話</button>':'')+
    (nbHas('lost')?'<button class="btn block soft" data-act="nbGo" data-id="lost">'+ic('book')+'萬一走散，這樣做</button>':'');
}
/* 集合點名（管理者） */
function toolRollcall(){
  var rc=S().rollcall||{present:{}}, ms=members(), b=S().broadcast||{};
  var present=ms.filter(function(m){return rc.present&&rc.present[m.id];});
  var missing=ms.filter(function(m){return !(rc.present&&rc.present[m.id]);});
  var label=rc.label||((b.time||'')+' '+(b.location||'')).trim();
  return backBar('集合點名')+
    '<section class="card rc-sticky"><div class="rc-head"><span class="big">'+present.length+'</span><span style="font-weight:900;font-size:1.2rem">/ '+ms.length+' 已到</span><span class="sp" style="flex:1"></span>'+(rc.startedAt?'<span class="muted">'+esc(rc.startedAt)+' 開始</span>':'')+'</div>'+
    '<div class="f" style="margin-top:.5rem"><label>這次集合</label><input class="in" id="rcLabel" value="'+esc(label)+'" placeholder="例：15:30 纜車站大廳"></div>'+
    (missing.length&&missing.length<ms.length?'<div class="missing" style="margin-top:.6rem">還沒到 '+missing.length+' 人'+(missing.length<=8?'：'+missing.map(function(m){ return m.phone?'<a href="'+telHref(m.phone)+'">'+esc(m.name)+ic('phone')+'</a>':'<span style="display:inline-block;margin-right:.5rem">'+esc(m.name)+'</span>'; }).join(''):'，往下捲找空圈圈')+'</div>':'')+
    (missing.length===0&&ms.length?'<div class="missing ok" style="margin-top:.6rem">'+ic('check')+'全員到齊，出發！</div>':'')+
    '<div class="row" style="margin-top:.6rem"><button class="btn ok" data-act="rcAll">全部到齊</button><button class="btn" data-act="rcReset">重新點名</button></div></section>'+
    '<div class="hint-lead">'+ic('info')+'點名字＝已到，再點一次取消。車長也可以用自己的手機一起點。</div>'+
    '<div class="rc">'+ms.map(function(m){ var on=rc.present&&rc.present[m.id]; return '<button class="'+(on?'on':'')+'" data-act="rcToggle" data-id="'+m.id+'" aria-pressed="'+(on?'true':'false')+'"><span class="ck">'+ic('check')+'</span><span style="flex:1;min-width:0">'+esc(m.name)+'</span>'+badgeSVG(m.emoji)+memBadge(m)+'</button>'; }).join('')+'</div>';
}


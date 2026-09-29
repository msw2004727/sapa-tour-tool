/* v3.22 一鍵清空・自動備份與還原
   安全：這支測試會真的按「清空」，所以一開始就把所有 http(s) 連線擋掉——在有網路的電腦上跑也碰不到正式資料庫。
   雲端那一層換成假的：會照 Firebase 的習慣把空陣列／空物件拿掉，也可以設定成「規則擋下」。
   真正的 Firebase 規則另外用官方模擬器驗過（見改版日誌 v3.22）。
   用法：node audit/resettest.js [--shots] */
const {chromium,FILE,at,outboundBlocked}=require('./_lib');
const SHOTS=process.argv.includes('--shots');
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x).slice(0,300));} else console.log('  ✓',n); };
const wait=(p,ms)=>p.waitForTimeout(ms);
const shot=async(p,name)=>{ if(SHOTS) await p.screenshot({path:at(`shots/reset-${name}.png`)}); };

/* 裝在頁面裡的假雲端（每次載入頁面都會重裝；__cloud 要跨重新整理時由測試自己搬） */
const FAKE=()=>{
  window.__cloud={bk:{},updates:[],ops:[],deny:false};
  window.fbNorm=function norm(v){ if(v===null||v===undefined) return undefined;
    if(Array.isArray(v)){ var a=v.map(norm).filter(function(x){ return x!==undefined; }); return a.length?a:undefined; }
    if(typeof v==='object'){ var o={},n=0; Object.keys(v).forEach(function(k){ var x=norm(v[k]); if(x!==undefined){ o[k]=x; n++; } }); return n?o:undefined; }
    return v; };
  window.cloudOn=function(){
    Store.mode='cloud'; Store.push=true; Store.root='trip'; Store.flushing=false;
    Store.pushOp=function(op){ __cloud.ops.push(JSON.parse(JSON.stringify(op))); return Promise.resolve(); };
    Store.fetchBackups=function(){ return Promise.resolve(JSON.parse(JSON.stringify(__cloud.bk))); };
    Store.pushMulti=function(u){ __cloud.updates.push(JSON.parse(JSON.stringify(u)));
      if(__cloud.deny) return Promise.reject({code:'PERMISSION_DENIED',message:'PERMISSION_DENIED: Permission denied'});
      Object.keys(u).forEach(function(p){ if(p.indexOf('backups/trip/')===0){ var id=p.slice(13); if(u[p]===null) delete __cloud.bk[id]; else __cloud.bk[id]=JSON.parse(JSON.stringify(u[p])); } });
      return Promise.resolve(); };
  };
  /* 雲端把剛剛整批寫進去的所有文件推回來（跟 Firebase 一樣，空陣列／空物件不見了） */
  window.cloudEcho=function(){ var u=__cloud.updates[__cloud.updates.length-1], d={};
    Object.keys(u).forEach(function(p){ if(p.indexOf('trip/')===0) d[p.slice(5)]=fbNorm(u[p])||{}; });
    Store.applyRemote(d); return d; };
  window.sleep=function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
  /* 按鈕內容被按鈕框切掉（容器裡的裁切，一般的溢出檢查抓不到，CLAUDE.md 第 3 條） */
  window.clipped=function(root){ return [].slice.call((root||document).querySelectorAll('.btn')).filter(function(b){ return b.offsetParent&&b.scrollWidth>b.clientWidth+1; }).map(function(b){ return b.textContent.trim().slice(0,14); }); };
  /* 在目前開著的表單輸入 PIN 並按下確認鈕 */
  window.confirmWith=async function(pin,act){ var i=document.querySelector('#sheetRoot input[name=pin]'); if(i) i.value=pin;
    document.querySelector('#sheetRoot [data-act="'+act+'"]').click(); await sleep(350); };
  /* 空白狀態下逐頁檢查，標準跟 regress.js 一樣：分頁畫面查橫向捲動、短標籤斷行、雙重跳脫；
     表單與全螢幕卡查有沒有撐破畫面。另外全部都查禁用字。 */
  window.walkAll=function(sel){
    const bad=[]; let n=0;
    const look=(name,view)=>{ n++;
      const o=[]; if(view) document.querySelectorAll(sel).forEach(el=>{ const t=el.textContent.trim(); if(!t) return; const h1=el.getBoundingClientRect().height, pv=el.style.whiteSpace; el.style.whiteSpace='nowrap'; const h2=el.getBoundingClientRect().height; el.style.whiteSpace=pv; if(h1>h2*1.35) o.push(t.slice(0,12)); });
      const ov=document.documentElement.scrollWidth>document.documentElement.clientWidth;
      const sh=document.querySelector('.sheet'), sov=sh?sh.scrollWidth>sh.clientWidth+1:false;
      const dbl=(document.body.innerHTML.match(/&amp;(amp|#39|quot|lt);/g)||[]).length;
      const word=/領隊|導遊/.test(document.body.innerText);
      if(o.length||ov||sov||dbl||word) bad.push({name,wrap:o,ov,sov,dbl,word}); };
    const views={home:()=>{P.tab='home';}, plan1:()=>{P.tab='plan';P.planDay=1;}, plan5:()=>{P.tab='plan';P.planDay=5;P.planMode='detail';},
      rooms:()=>{P.tab='rooms';P.roomsSeg='rooms';}, list:()=>{P.tab='rooms';P.roomsSeg='list';}, groups:()=>{P.tab='groups';P.scn='';},
      airline:()=>{P.tab='groups';P.cat='transport';P.scn='';}, catMeal:()=>{P.tab='groups';P.cat='meal';P.scn='';},
      catShop:()=>{P.tab='groups';P.cat='shop';P.scn='';}, catMate:()=>{P.tab='groups';P.cat='mate';P.scn='';}, tools:()=>{P.tab='tools';P.tool='menu';}, sos:()=>{P.tab='tools';P.tool='sos';},
      rollcall:()=>{P.tab='tools';P.tool='rollcall';}, money:()=>{P.tab='tools';P.tool='money';}, notes:()=>{P.tab='notes';}};
    for(const leader of [false,true]){ P.leader=leader;
      for(const k in views){ views[k](); render(); look((leader?'管理 ':'團員 ')+k,true); } }
    P.leader=true;
    const sheets={settings:()=>ACT.settings(), broadcast:()=>ACT.editBroadcast(), item:()=>sheetItem(''), member:()=>sheetMember(''),
      hotel:()=>sheetHotel(), hotelNew:()=>sheetHotelEdit(''), scenario:()=>sheetScenario(''), scnMeal:()=>sheetScenario('','meal'), scnShop:()=>sheetScenario('','shop'), scnMate:()=>sheetScenario('','mate'), homeScn:()=>sheetHomeScn(), tags:()=>sheetTags(),
      zones:()=>sheetCardZones(), prev:()=>sheetPrev(), pickMe:()=>sheetPickMe(), rooms:()=>sheetRooms(), morning:()=>sheetMorning(),
      nbPage:()=>sheetNbPage(''), backups:()=>sheetBackups(), share:()=>sheetShare(), leaderMenu:()=>sheetLeaderMenu()};
    for(const k in sheets){ sheets[k](); look('表單 '+k); closeSheet(); }
    openFull(taxiFull()); look('計程車卡'); closeFull();
    openFull(phraseFull(lostPhrase())); look('走散卡'); closeFull();
    P.tab='home'; render();
    return {n,bad};
  };
};
/* 空白狀態下逐頁檢查用的短標籤（跟 regress.js 同一套） */
const SHORT='.tab span,.tab-home .lb,.chip,.btn:not(.wrap) .b2>span:first-child,.tcard b,.chead .ttl,.day-chip,.lcd .lg1,.lcd .lg2,.wf-k,.ic-h,h2.sec,.dayrow button,.me-strip .k,.seg button,.fl-h,.kv dt,.prep-lab,.catbar button span';

(async()=>{
  const b=await chromium.launch();

  console.log('[0] 安全：測試用的瀏覽器連不到正式資料庫');
  const g0=await (async()=>{ const q=await b.newPage(); const n0=outboundBlocked(); await q.goto(FILE); await wait(q,300);
    const r=await q.evaluate(async()=>{ const out={};
      try{ await fetch('https://sapa-tour-default-rtdb.asia-southeast1.firebasedatabase.app/trip.json'); out.http='通了'; }catch(e){ out.http='擋下'; }
      out.ws=await new Promise(res=>{ try{ const s=new WebSocket('wss://sapa-tour-default-rtdb.asia-southeast1.firebasedatabase.app/.ws?v=5'); s.onopen=()=>res('通了'); s.onclose=()=>res('擋下'); s.onerror=()=>res('擋下'); setTimeout(()=>res('逾時'),5000); }catch(e){ res('擋下'); } });
      return out; });
    await q.close(); return {r,n:outboundBlocked()-n0}; })();
  ck('用 HTTP 連正式資料庫：被擋下',g0.r.http==='擋下',g0);
  ck('用 WebSocket 連正式資料庫：被擋下',g0.r.ws==='擋下',g0);
  ck('是測試環境自己擋的（audit/_lib.js），不是剛好沒網路',g0.n>=2,g0.n);

  const ctx=await b.newContext({viewport:{width:320,height:568}});
  /* 安全第一：所有對外連線一律擋掉（包含 Firebase SDK 與資料庫） */
  let outbound=0; await ctx.route(/^https?:\/\//,r=>{ outbound++; return r.abort(); });
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.addInitScript(FAKE);
  await p.goto(FILE); await wait(p,600);
  await p.evaluate(()=>{ localStorage.removeItem('sapa-bk'); P.tipDismissed=true; P.fs='xl'; savePrefs();
    S().photos.items={d1a:{src:'data:image/webp;base64,AAAA',op:9,kb:1}}; render(); });

  console.log('[1] 管理專區的按鈕');
  const a1=await p.evaluate(()=>{ P.leader=false; P.tab='tools'; P.tool='menu'; render();
    const guest={clear:!!document.querySelector('[data-act="clearAsk"]'),bk:!!document.querySelector('[data-act="bkList"]')};
    P.leader=true; render();
    const c=document.querySelector('[data-act="clearAsk"]'), k=document.querySelector('[data-act="bkList"]');
    return {guest,clear:c&&c.textContent.trim(),bk:k&&k.textContent.trim(),oldBtn:!!document.querySelector('[data-act="resetDemo"]'),oldAct:typeof ACT.resetDemo+'/'+typeof ACT.resetConfirm}; });
  ck('團員模式看不到清空與備份按鈕',!a1.guest.clear&&!a1.guest.bk,a1.guest);
  ck('管理專區有「一鍵清空內容」',a1.clear==='一鍵清空內容',a1.clear);
  ck('管理專區有「備份與還原」',/備份與還原/.test(a1.bk||''),a1.bk);
  ck('舊的「重置為初始資料」按鈕與動作都拿掉了',!a1.oldBtn&&a1.oldAct==='undefined/undefined',a1);
  const clip1=await p.evaluate(()=>{ return clipped(document.getElementById('view')).filter(t=>/還原上一版|備份與還原|一鍵清空/.test(t)); });
  ck('320px 特大字：「還原上一版」「備份與還原」「一鍵清空內容」按鈕內容沒有被切掉',clip1.length===0,clip1);
  await shot(p,'1-tools');

  console.log('[2] 清空表單：警語、實際數字、PIN 欄位');
  const a2=await p.evaluate(()=>{ document.querySelector('[data-act="clearAsk"]').click();
    const s=document.querySelector('.sheet'), t=s?s.innerText:'';
    return {title:document.getElementById('sheetTitle').textContent,t,focus:(document.activeElement||{}).name||'',pin:!!(s&&s.querySelector('input[name=pin]')),n:{m:members().length,i:items().length}}; });
  ck('前提：現在有 33 位團員、30 站行程（測試本身有效）',a2.n.m===33&&a2.n.i===30,a2.n);
  ck('表單標題是「一鍵清空內容」',a2.title==='一鍵清空內容',a2.title);
  ck('警語：全團手機會同步變空白',/全團每一支手機都會同步變成空白/.test(a2.t));
  ck('列出實際數字：行程 30 站、團員 33 人、底圖 1 張',/行程（30 站）/.test(a2.t)&&/團員名單（33 人）/.test(a2.t)&&/底圖（1 張）/.test(a2.t),a2.t.slice(0,260));
  ck('說明會保留管理 PIN',/會保留[\s\S]*管理 PIN/.test(a2.t));
  ck('說明清空前會自動備份、去哪裡還原',/自動備份/.test(a2.t)&&/備份與還原/.test(a2.t));
  ck('有 PIN 欄位，而且沒有自動跳出鍵盤（不會遮住警語）',a2.pin&&a2.focus!=='pin',a2.focus);
  ck('表單沒有「領隊」「導遊」字樣',!/領隊|導遊/.test(a2.t));
  const clip2=await p.evaluate(()=>{ const b=document.querySelector('.sheet-b'); b.scrollTop=b.scrollHeight; return clipped(document.querySelector('.sheet')); });
  ck('320px 特大字：清空表單裡的按鈕內容沒有被切掉',clip2.length===0,clip2);
  await shot(p,'2-clear-sheet');

  console.log('[3] 沒輸入／輸入錯誤 PIN：不清空');
  const a3=await p.evaluate(async()=>{ cloudOn();
    document.querySelector('[data-act="clearGo"]').click(); await sleep(100);
    const e1=document.getElementById('sheetErr'), r1={shown:!e1.hidden,text:e1.textContent};
    await confirmWith('1234','clearGo');
    const e2=document.getElementById('sheetErr'), i2=document.querySelector('#sheetRoot input[name=pin]');
    const r2={shown:!!e2&&!e2.hidden,text:e2?e2.textContent:'（表單已經被關掉）',left:i2?i2.value:'（表單已經被關掉）'};
    return {r1,r2,updates:__cloud.updates.length,m:members().length}; });
  ck('沒輸入 PIN：表單裡寫「請先輸入管理 PIN」',a3.r1.shown&&/請先輸入管理 PIN/.test(a3.r1.text),a3.r1);
  ck('PIN 錯誤：寫「PIN 不正確，沒有清空」並清掉欄位',a3.r2.shown&&/PIN 不正確，沒有清空/.test(a3.r2.text)&&a3.r2.left==='',a3.r2);
  ck('兩次都沒有送任何東西到雲端，名單還在',a3.updates===0&&a3.m===33,a3);
  await shot(p,'3-wrong-pin');

  console.log('[4] 沒連上雲端、還有修改沒送出：不清空');
  const a4=await p.evaluate(async()=>{ Store.mode='offline'; await confirmWith('8888','clearGo');
    const off={t:document.getElementById('sheetErr').textContent,btn:document.querySelector('[data-act="clearGo"]')}; off.btnOk=!off.btn.disabled&&/確定清空/.test(off.btn.textContent); delete off.btn;
    Store.mode='cloud'; Store.q=[{key:'broadcast',path:'',val:{},ts:1}]; await confirmWith('8888','clearGo');
    const pend={t:document.getElementById('sheetErr').textContent}; Store.q=[];
    return {off,pend,updates:__cloud.updates.length,m:members().length}; });
  ck('沒連上雲端：說明要連網路、資料都沒有變動',/要連上雲端/.test(a4.off.t)&&/沒有變動/.test(a4.off.t),a4.off);
  ck('失敗後按鈕恢復，可以再按一次',a4.off.btnOk,a4.off);
  ck('還有修改沒送出：請稍等幾秒再按',/正在送上雲端/.test(a4.pend.t)&&/沒有變動/.test(a4.pend.t),a4.pend);
  ck('兩種情況都沒有寫雲端、名單還在',a4.updates===0&&a4.m===33,a4);

  console.log('[5] 雲端規則擋下（還沒貼新規則時）：全部不動');
  const a5=await p.evaluate(async()=>{ __cloud.deny=true; await confirmWith('8888','clearGo'); __cloud.deny=false;
    return {t:document.getElementById('sheetErr').textContent,tried:__cloud.updates.length,m:members().length,i:items().length,trip:S().settings.tripName,local:bkLocalList().length,bulk:!!Store._bulk}; });
  ck('有送出一次整批寫入（測試本身有效）',a5.tried===1,a5);
  ck('被擋之後畫面上的資料完全沒變',a5.m===33&&a5.i===30&&a5.trip==='沙壩雲海五日',a5);
  ck('說明是規則擋下、資料都沒有變動、要換 v3.22 規則',/規則/.test(a5.t)&&/沒有變動/.test(a5.t)&&/v3\.22/.test(a5.t),a5.t);
  ck('被擋時手機裡不會留下一份沒有用的備份',a5.local===0&&!a5.bulk,a5);

  console.log('[6] 輸入正確 PIN：清空');
  const a6=await p.evaluate(async()=>{ P.meId=members()[0].id; savePrefs(); const n0=__cloud.updates.length;
    await confirmWith('8888','clearGo'); await sleep(100);
    const u=__cloud.updates[__cloud.updates.length-1], keys=Object.keys(u).sort();
    const bkKey=keys.filter(k=>k.indexOf('backups/trip/')===0)[0], bk=bkKey&&u[bkKey];
    return {sent:__cloud.updates.length-n0,keys,bkKey,
      bk:bk&&{m:bk.docs.members.items.length,i:bk.docs.itinerary.items.length,ph:Object.keys(bk.docs.photos.items||{}).length,trip:bk.docs.settings.tripName,reason:bk.reason,ver:bk.ver,sum:bk.sum},
      members:u['trip/members'],itinerary:u['trip/itinerary'],settings:u['trip/settings'],
      sheet:!!document.querySelector('.sheet'),tab:P.tab,meId:P.meId,hero:(document.querySelector('.hero')||{}).textContent||'',
      day:document.getElementById('hdDay').textContent,toast:document.getElementById('toast').textContent,
      local:bkLocalList().map(x=>x.id),now:{m:members().length,i:items().length},pin:pinOK('8888'),ver:APP_VERSION,docs:DOC_KEYS.length}; });
  ck('只送出一次整批寫入：9 份文件（v3.23 多了工具內容）＋1 份備份在同一筆',a6.docs===9&&a6.sent===1&&a6.keys.length===10&&a6.keys.filter(k=>k.indexOf('trip/')===0).length===9&&a6.keys.indexOf('trip/tools')>=0,a6.keys);
  ck('備份是清空前的完整內容（33 人、30 站、底圖、團名）',a6.bk&&a6.bk.m===33&&a6.bk.i===30&&a6.bk.ph===1&&a6.bk.trip==='沙壩雲海五日'&&a6.bk.reason==='clear'&&a6.bk.ver===a6.ver,a6.bk);
  ck('名單、行程只剩 _ts 與 _cleared（新規則認得的標記）',JSON.stringify(Object.keys(a6.members).sort())==='["_cleared","_ts"]'&&JSON.stringify(Object.keys(a6.itinerary).sort())==='["_cleared","_ts"]',{m:a6.members,i:a6.itinerary});
  ck('設定只留 PIN 雜湊與最低版本（全部清到最乾淨）',JSON.stringify(Object.keys(a6.settings).sort())==='["_cleared","_ts","minVersion","pinHash"]'&&a6.settings.minVersion===a6.ver,a6.settings);
  ck('清空後原本的 PIN 照樣能用',a6.pin);
  ck('表單關掉、回到首頁',!a6.sheet&&a6.tab==='home',a6);
  ck('首頁顯示「尚未建立旅程」',/尚未建立旅程/.test(a6.hero)&&/目前沒有旅程資料/.test(a6.hero),a6.hero);
  ck('標頭不會顯示「今天出發」，改成「日期未定」',a6.day==='日期未定',a6.day);
  ck('這支手機的「我是誰」一起清掉',a6.meId==='',a6.meId);
  ck('提示已清空、說明備份在哪裡',/已清空/.test(a6.toast)&&/備份與還原/.test(a6.toast),a6.toast);
  ck('這支手機也留了同一份備份',a6.local.length===1&&('backups/trip/'+a6.local[0])===a6.bkKey,a6.local);
  ck('手機裡的資料已經是空的',a6.now.m===0&&a6.now.i===0,a6.now);
  const firstBk=a6.bkKey;
  await shot(p,'4-home-empty-leader');

  console.log('[7] 雲端推回來、重新整理之後');
  const a7=await p.evaluate(()=>{ localStorage.removeItem('sapa-prev-members'); document.getElementById('toast').textContent='';
    /* 模擬「另一支還是 33 人、開著管理模式的手機」收到清空後的快照 */
    const full=bkLocalList()[0].docs; DOC_KEYS.forEach(k=>{ Store.s[k]=clone(full[k]); }); P.leader=true; const before=members().length;
    const d=cloudEcho(); return {before,after:members().length,echo:d.members,prev:!!localStorage.getItem('sapa-prev-members'),toast:document.getElementById('toast').textContent}; });
  ck('前提：另一支手機原本有 33 人（測試本身有效）',a7.before===33,a7.before);
  ck('推回來的名單連 items 都沒有（跟 Firebase 一樣）',a7.echo&&!('items' in a7.echo),a7.echo);
  ck('另一支手機收到後也變成 0 人',a7.after===0,a7.after);
  ck('清空不會被當成「資料突然變少」另外留一份、跳提示',!a7.prev&&!/突然從/.test(a7.toast),a7);
  const saved=await p.evaluate(()=>JSON.stringify(__cloud));
  await p.reload(); await wait(p,600);
  const a7b=await p.evaluate(()=>({m:members().length,i:items().length,trip:S().settings.tripName||'',hero:(document.querySelector('.hero')||{}).textContent||'',cleared:!!S().members._cleared}));
  ck('重新整理後還是空的，沒有被程式內建的沙壩資料補回來',a7b.m===0&&a7b.i===0&&!a7b.trip&&a7b.cleared&&/尚未建立旅程/.test(a7b.hero),a7b);
  const a7c=await p.evaluate(()=>{ P.leader=false; render(); const h=document.querySelector('.hero'); return {hero:h?h.textContent:'',ctl:!!(h&&h.querySelector('.ctl')),cards:document.querySelectorAll('.ccard').length,sos:!!document.querySelector('.sos-row')}; });
  ck('團員看到的空白首頁：只有說明與緊急求助，沒有一排「待公布」卡片',/尚未建立旅程/.test(a7c.hero)&&!a7c.ctl&&a7c.cards===0&&a7c.sos,a7c);
  await shot(p,'5-home-empty-guest');

  console.log('[8] 清空後新增第一位團員、第一站（抓「畫面說已儲存、其實沒存到」）');
  const a8=await p.evaluate(async(s)=>{ window.__cloud=JSON.parse(s); cloudOn(); __cloud.ops=[]; P.leader=true;
    delete S().members.items; delete S().itinerary.items;   /* 雲端推回來的原樣：沒有 items */
    ACT.editMember({getAttribute:()=>''}); document.querySelector('#sheetRoot [name=name]').value='王小明'; ACT.saveMember();
    P.planDay=1; ACT.editItem({getAttribute:()=>''}); document.querySelector('#sheetRoot [name=title]').value='機場集合'; ACT.saveItem();
    await sleep(800);
    const opM=__cloud.ops.filter(o=>o.key==='members').pop(), opI=__cloud.ops.filter(o=>o.key==='itinerary').pop();
    return {m:members().map(x=>x.name),i:items().map(x=>x.title),opM,opI}; },saved);
  ck('新增的團員真的在名單裡',JSON.stringify(a8.m)==='["王小明"]',a8.m);
  ck('新增的行程真的在行程裡',JSON.stringify(a8.i)==='["機場集合"]',a8.i);
  ck('送上雲端的是整份名單、有這位團員、拿掉了清空標記',a8.opM&&a8.opM.path===''&&a8.opM.val.items.length===1&&a8.opM.val.items[0].name==='王小明'&&!('_cleared' in a8.opM.val),a8.opM);
  ck('送上雲端的行程同樣正確',a8.opI&&a8.opI.path===''&&a8.opI.val.items.length===1&&!('_cleared' in a8.opI.val),a8.opI);

  console.log('[9] 空白狀態下所有分頁與表單（320px 特大字、淺色＋深色）');
  const a9=await p.evaluate(async(sel)=>{ const S0=JSON.stringify({m:S().members,i:S().itinerary});
    S().members={_ts:1,_cleared:1}; S().itinerary={_ts:1,_cleared:1};   /* 回到剛清空的樣子 */
    await sleep(0); const out={};
    P.theme=''; out.light=walkAll(sel);   /* 15 個分頁（分組有四個分類）× 團員／管理 ＋ 21 張表單 ＋ 2 張全螢幕卡 ＝ 53 */
    P.theme='dark'; out.dark=walkAll(sel);
    P.theme=''; P.fs='md'; out.md=walkAll(sel); P.fs='xl';
    const o=JSON.parse(S0); S().members=o.m; S().itinerary=o.i; render(); return out; },SHORT).catch(e=>({err:String(e)}));
  if(a9.err) ck('空白狀態逐頁檢查可以執行',false,a9.err);
  else for(const k of ['light','dark','md']){ ck(`空白狀態 ${k}：${a9[k].n} 個畫面都沒有溢出、斷行、雙重跳脫、禁用字`,a9[k].n===53&&!a9[k].bad.length,a9[k].bad.slice(0,4)); }

  console.log('[10] 備份清單與還原');
  const a10=await p.evaluate(async()=>{ ACT.bkList(); await sleep(250);
    return {t:document.querySelector('.sheet').innerText,rows:document.querySelectorAll('.bk-row').length}; });
  ck('320px 特大字：備份清單的按鈕內容沒有被切掉',await p.evaluate(()=>clipped(document.querySelector('.sheet')).length===0));
  ck('備份清單列出清空前那一份（存在雲端＋這支手機）',a10.rows===1&&/清空前的備份/.test(a10.t)&&/存在雲端＋這支手機/.test(a10.t)&&/行程 30 站/.test(a10.t)&&/團員 33 人/.test(a10.t),a10.t.slice(0,300));
  await shot(p,'6-backups');
  const a11=await p.evaluate(async()=>{ document.querySelector('.bk-row [data-act="bkAsk"]').click(); await sleep(100);
    const title=document.getElementById('sheetTitle').textContent, txt=document.querySelector('.sheet').innerText, clip=clipped(document.querySelector('.sheet'));
    await confirmWith('0000','bkGo'); const wrong={err:document.getElementById('sheetErr').textContent,m:members().length};
    const n0=__cloud.updates.length; await confirmWith('8888','bkGo'); await sleep(100);
    const u=__cloud.updates[__cloud.updates.length-1], bks=Object.keys(u).filter(k=>k.indexOf('backups/')===0);
    return {title,txt,clip,wrong,sent:__cloud.updates.length-n0,newBk:bks.map(k=>u[k]&&u[k].reason),newSum:bks.map(k=>u[k]&&u[k].sum),m:members().length,i:items().length,trip:S().settings.tripName,ph:Object.keys(photoMap()).length,
      sentM:u['trip/members'],toast:document.getElementById('toast').textContent,cloudBk:Object.keys(__cloud.bk).length}; });
  ck('還原表單的按鈕內容沒有被切掉',!a11.clip.length,a11.clip);
  ck('還原表單：說明會整個取代、還原前會先備份現在的內容',/還原這份備份/.test(a11.title)&&/整個取代/.test(a11.txt)&&/現在的內容/.test(a11.txt)&&!/領隊|導遊/.test(a11.txt),a11.txt.slice(0,200));
  ck('還原 PIN 錯誤：不還原',/PIN 不正確，沒有還原/.test(a11.wrong.err)&&a11.wrong.m===1,a11.wrong);
  ck('還原成功：33 人、30 站、團名、底圖都回來',a11.m===33&&a11.i===30&&a11.trip==='沙壩雲海五日'&&a11.ph===1,a11);
  ck('還原也是一次整批寫入，名單帶著 items 寫回（規則收得下）',a11.sent===1&&a11.sentM&&a11.sentM.items&&a11.sentM.items.length===33&&!('_cleared' in a11.sentM),a11.sent);
  ck('還原前先把「王小明＋機場集合」那份內容自動備份',a11.newBk.length===1&&a11.newBk[0]==='restore'&&a11.newSum[0].members===1&&a11.newSum[0].itinerary===1,a11.newSum);
  ck('雲端現在有 2 份備份（清空前、還原前）',a11.cloudBk===2,a11.cloudBk);
  ck('提示還原成功',/已還原/.test(a11.toast),a11.toast);

  console.log('[11] 雲端最多留 3 份，多的淘汰最舊的');
  const a12=await p.evaluate(async(first)=>{ const counts=[];
    for(let r=0;r<3;r++){
      sheetClear(); await confirmWith('8888','clearGo'); counts.push(Object.keys(__cloud.bk).length);
      BK_VIEW=bkMerge(__cloud.bk,bkLocalList()); const e=BK_VIEW.filter(x=>x.reason==='clear')[0];
      sheetRestore(e.id); await confirmWith('8888','bkGo'); counts.push(Object.keys(__cloud.bk).length); }
    return {counts,local:bkLocalList().length,firstGone:!__cloud.bk[first.slice(13)],m:members().length}; },firstBk);
  ck('雲端備份從來沒有超過 3 份',Math.max.apply(null,a12.counts)===3,a12.counts);
  ck('最早那一份已經被淘汰',a12.firstGone,a12);
  ck('這支手機也最多只留 3 份',a12.local===3,a12.local);
  ck('反覆清空、還原之後資料仍然完整（33 人）',a12.m===33,a12.m);

  console.log('[12] 其他情況');
  const a13=await p.evaluate(async()=>{ sheetClear(); await confirmWith('8888','clearGo'); closeSheet();
    document.getElementById('toast').textContent=''; ACT.clearAsk();
    const blank={sheet:!!document.querySelector('.sheet'),toast:document.getElementById('toast').textContent};
    const n0=__cloud.updates.length; SIM_OFF=5000; document.getElementById('toast').textContent=''; BK_VIEW=bkMerge(__cloud.bk,bkLocalList());
    ACT.clearAsk(); const sim={sheet:!!document.querySelector('.sheet'),toast:document.getElementById('toast').textContent}; SIM_OFF=0;
    return {blank,sim,sent:__cloud.updates.length-n0}; });
  ck('已經是空白時按清空：直接說不需要，不開表單',!a13.blank.sheet&&/已經是空白/.test(a13.blank.toast),a13.blank);
  ck('時間模擬中不能清空',!a13.sim.sheet&&/時間模擬中不能清空/.test(a13.sim.toast)&&a13.sent===0,a13.sim);
  const a14=await p.evaluate(async()=>{ const n0=__cloud.updates.length; Store.backend=''; Store.mode='local';
    BK_VIEW=bkMerge({},bkLocalList()); const e=BK_VIEW.filter(x=>x.sum&&x.sum.members===33)[0];
    sheetRestore(e.id); await confirmWith('8888','bkGo'); const r1=members().length;
    sheetClear(); await confirmWith('8888','clearGo'); const r2=members().length;
    Store.backend='firebase'; return {r1,r2,cloud:__cloud.updates.length-n0,local:bkLocalList().length}; });
  ck('單機模式：還原、清空都只在手機裡做，不碰雲端',a14.r1===33&&a14.r2===0&&a14.cloud===0,a14);

  console.log(`  （這支測試擋掉了 ${outbound} 個對外連線，沒有任何資料離開這台電腦）`);
  ck('全程無 JS 錯誤',errs.length===0,errs.slice(0,3));
  await ctx.close(); await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

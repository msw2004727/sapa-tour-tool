/* v3.18 旅途強化：第 2～14 項逐一驗證
   （PIN 維持 8888 是小麥的決定，不在此列）
   2 資料突然變少自動留上一版＋可還原   3 連線有時限、訊號回來會重連
   5 沒廣播時首頁顯示下一站            6 日期／下一站變了自動重畫、回前景重連
   7 離線提示條顯示資料時間            8 頂列字級跟著放大、「未連線」
   9 對比度                             10 最小字級與命中區
   11 空間不足時說實話、佇列會合併      12 新版本提示不自動消失、版本比對正確
   13 首頁固定緊急求助列                14 不再載 Google Fonts
   （4 的 Service Worker 逾時另在 audit/swtest.js） */
const {chromium,FILE,at}=require('./_lib');
const fs=require('fs');
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x));} else console.log('  ✓',n); };
const wait=(p,ms)=>p.waitForTimeout(ms);

(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:375,height:667}});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(FILE); await wait(p,500);

  console.log('[14] 字型：不再另外下載');
  const html=fs.readFileSync(at('index.html'),'utf8');
  ck('index.html 沒有 fonts.googleapis 連結',html.indexOf('fonts.googleapis')<0);
  ck('字型堆疊以系統字為先',/font-family:-apple-system,"PingFang TC"/.test(html));

  console.log('[12] 版本提示');
  const v=await p.evaluate(()=>({a:verCmp('3.9','3.16'),b:verCmp('3.18','3.18'),c:verCmp('4.0','3.99'),d:verCmp('3.17.1','3.17')}));
  ck('3.9 < 3.16（不是字串比較）',v.a<0,v);
  ck('相同版本 = 0',v.b===0,v);
  ck('4.0 > 3.99',v.c>0,v);
  ck('3.17.1 > 3.17',v.d>0,v);
  await p.evaluate(()=>{ S().settings.minVersion='9.99'; Store._verDismissed=false; Store.checkVersion(); });
  ck('有新版本時提示列出現',await p.evaluate(()=>!document.getElementById('verBar').hidden));
  await wait(p,9000);
  ck('9 秒後提示列還在（不會自己消失）',await p.evaluate(()=>!document.getElementById('verBar').hidden));
  ck('提示列有「更新」與「稍後」',await p.evaluate(()=>/更新/.test(document.getElementById('verBar').textContent)&&/稍後/.test(document.getElementById('verBar').textContent)));
  await p.click('#verBar [data-act="verLater"]'); await wait(p,200);
  ck('按「稍後」會收起',await p.evaluate(()=>document.getElementById('verBar').hidden));
  await p.evaluate(()=>{ S().settings.minVersion='1.0'; Store._verDismissed=false; Store.checkVersion(); });
  ck('版本沒過期時不出現',await p.evaluate(()=>document.getElementById('verBar').hidden));
  await p.evaluate(()=>{ delete S().settings.minVersion; });

  console.log('[8] 頂列文字與「未連線」');
  const lcd=await p.evaluate(()=>{
    const m=()=>({sy:parseFloat(getComputedStyle(document.querySelector('.lcd .sy')).fontSize),n:parseFloat(getComputedStyle(document.querySelector('.lcd .n')).fontSize),chip:parseFloat(getComputedStyle(document.getElementById('hdDay')).fontSize)});
    document.documentElement.setAttribute('data-fs','md'); const a=m();
    document.documentElement.setAttribute('data-fs','xl'); const c=m();
    document.documentElement.setAttribute('data-fs','md');
    Store.mode='local'; renderSync(); const txt=document.getElementById('hdSyncTx').textContent;
    return {md:a,xl:c,txt,title:document.getElementById('hdSyncTx').title};
  });
  ck('狀態字在特大字級下有變大',lcd.xl.sy>lcd.md.sy,lcd);
  ck('越南時間在特大字級下有變大',lcd.xl.n>lcd.md.n,lcd);
  ck('天數藥丸在特大字級下有變大',lcd.xl.chip>lcd.md.chip,lcd);
  ck('標準字級下狀態字 ≥ 11px',lcd.md.sy>=11,lcd.md);
  ck('單機模式顯示「未連線」而不是「單機」',lcd.txt==='未連線',lcd.txt);
  ck('title 用站名',/月半越南團旅/.test(lcd.title),lcd.title);
  ck('320px 特大字時頂列不被裁切',await (async()=>{ const q=await ctx.newPage(); await q.setViewportSize({width:320,height:568}); await q.goto(FILE); await wait(q,400);
    const r=await q.evaluate(()=>{ document.documentElement.setAttribute('data-fs','xl'); const e=document.querySelector('.lcd'); return {clip:e.scrollWidth-e.clientWidth}; }); await q.close(); return r.clip<=0; })());

  console.log('[7] 離線提示條');
  const off=await p.evaluate(()=>{
    Store.mode='offline'; Store.lastSync=new Date(Date.now()-3*3600*1000); Store.q=[{key:'broadcast',path:'',val:{},ts:1}]; renderSync();
    const bar=document.getElementById('offBar'); const r={shown:!bar.hidden,text:bar.textContent};
    Store.mode='cloud'; Store.q=[]; renderSync(); r.hiddenWhenOnline=bar.hidden; return r;
  });
  ck('離線時提示條出現',off.shown,off);
  ck('寫出資料更新時間',/資料更新於 \d\d:\d\d/.test(off.text),off.text);
  ck('超過一小時會標出幾小時前',/3 小時前/.test(off.text),off.text);
  ck('有待送修改時會說幾筆',/1 筆修改/.test(off.text),off.text);
  ck('連上線就收起',off.hiddenWhenOnline);

  console.log('[5] 沒廣播時首頁顯示下一站');
  const nx=await p.evaluate(()=>{
    P.leader=false; P.tab='home'; S().settings.dayOverride=2; const b=S().broadcast; b.time=''; b.idle=false; b.location='';
    const list=items().filter(x=>x.day===2&&!x.isCanceled); list.forEach(x=>x.isCurrent=false);
    /* 情境 A：全部排在未來 → 下一站是第一站 */
    list.forEach((x,i)=>x.time=(20+Math.min(i,3))+':'+(i<4?'00':'30')); render();
    const A={label:document.querySelector('.hero .lab').textContent+' '+document.querySelector('.hero .time').textContent,time:document.querySelector('.hero .time').textContent,loc:document.querySelector('.hero .loc').textContent,hasWait:/待公布/.test(document.querySelector('.hero').textContent)};
    /* 情境 B：有人標了當前站 → 進行中 */
    list[1].isCurrent=true; render();
    const B={label:document.querySelector('.hero .lab').textContent+' '+document.querySelector('.hero .time').textContent,loc:document.querySelector('.hero .loc').textContent};
    list[1].isCurrent=false;
    /* 情境 C：全部已過 → 今天行程已結束 */
    list.forEach(x=>x.time='00:01'); render();
    const C={time:document.querySelector('.hero .time').textContent};
    /* 情境 D：有廣播時照舊顯示廣播 */
    b.time='15:30'; b.location='飯店大廳'; render();
    const D={label:document.querySelector('.hero .lab').textContent,loc:document.querySelector('.hero .loc').textContent};
    b.time=''; b.location='';
    return {A,B,C,D,first:list[0].title,second:list[1].title};
  });
  ck('A 沒廣播時最大的那塊不是「待公布」',!nx.A.hasWait,nx.A);
  ck('A 標示「下一站」並顯示第一站',/下一站/.test(nx.A.label)&&nx.A.loc.indexOf(nx.first)>=0,nx.A);
  ck('A 顯示那一站的時間 20:00',/20:00/.test(nx.A.time),nx.A.time);
  ck('B 有當前站時標示「進行中」並顯示該站',/進行中/.test(nx.B.label)&&nx.B.loc.indexOf(nx.second)>=0,nx.B);
  ck('C 全部過了顯示「今天行程已結束」',/今天行程已結束/.test(nx.C.time),nx.C);
  ck('D 有廣播時仍是即時廣播',/即時廣播/.test(nx.D.label)&&/飯店大廳/.test(nx.D.loc),nx.D);
  await p.evaluate(()=>{ location.reload(); }); await wait(p,600);

  console.log('[6] 日期或下一站變了會自動重畫；回到前景會重連');
  const t6=await p.evaluate(async()=>{
    P.leader=false; P.tab='home'; S().settings.dayOverride=2; render(); tick();
    const before=document.getElementById('hdDay').textContent;
    S().settings.dayOverride=3;                 /* 只改資料，不呼叫 render */
    const stillOld=document.getElementById('hdDay').textContent===before;
    tick();                                      /* 計時器跑到 → 應該自己重畫 */
    const after=document.getElementById('hdDay').textContent;
    /* 表單開著時不能重畫（會把打到一半的字沖掉） */
    S().settings.dayOverride=4; openSheet({title:'t',body:'<input id="tin">'}); document.getElementById('tin').focus(); tick();
    const notRepainted=document.getElementById('hdDay').textContent===after; closeSheet();
    let reconnectCalled=0; const orig=Store.reconnect; Store.reconnect=()=>{reconnectCalled++;};
    Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}); document.dispatchEvent(new Event('visibilitychange'));
    Store.reconnect=orig; S().settings.dayOverride=0; render();
    return {before,stillOld,after,notRepainted,reconnectCalled};
  });
  ck('改了資料但沒重畫前，畫面還是舊的（測試本身有效）',t6.stillOld,t6);
  ck('tick() 發現天數變了就重畫',/第 3/.test(t6.after),t6);
  ck('表單開著、正在輸入時不重畫',t6.notRepainted,t6);
  ck('回到前景會嘗試重連',t6.reconnectCalled===1,t6);

  console.log('[13] 首頁固定的緊急求助列');
  const sos=await p.evaluate(()=>{
    S().settings.contacts=[{name:'甲',label:'台灣電話',phone:'+886900000000',line:'https://line.me/ti/p/X1'}]; P.tab='home'; S().settings.dayOverride=2; render();
    const row=document.querySelector('.sos-row'); if(!row) return {none:true};
    const inRef=!!row.closest('.g-ref');
    const tel=row.querySelector('a[href^="tel:"]'), ln=row.querySelector('a.btn.line'), go=row.querySelector('[data-act="tool"][data-tool="sos"]');
    const hs=[...row.querySelectorAll('a,button')].map(e=>Math.round(e.getBoundingClientRect().height));
    S().settings.dayOverride=0; render(); const beforeTrip=!!document.querySelector('.sos-row');
    const th=Math.round(row.querySelector('.t').getBoundingClientRect().height);
    const clipped=[...row.querySelectorAll('a,button')].some(e=>e.scrollWidth>e.clientWidth+3);
    return {inRef,tel:tel&&tel.getAttribute('href'),ln:ln&&ln.getAttribute('href'),go:!!go,hs,th,clipped,beforeTrip,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  ck('首頁有緊急求助列',!sos.none,sos);
  ck('放在「隨時查」區',sos.inRef,sos);
  ck('有打電話按鈕',sos.tel==='tel:+886900000000',sos.tel);
  ck('有 LINE 按鈕',sos.ln==='https://line.me/ti/p/X1',sos.ln);
  ck('有進入緊急求助頁的按鈕',sos.go);
  ck('按鈕高度 ≥ 44px',sos.hs.every(h=>h>=44),sos.hs);
  ck('出發前也有',sos.beforeTrip);
  ck('沒有橫向溢出',!sos.overflow);
  ck('標題是橫的一行，沒被擠成直排',sos.th<=40,sos.th);
  ck('按鈕文字沒有被切掉',!sos.clipped,sos);
  for(const [w,fs] of [[320,'xl'],[375,'lg']]){ const q=await ctx.newPage(); await q.setViewportSize({width:w,height:600}); await q.goto(FILE); await wait(q,300);
    const r=await q.evaluate(fs=>{ P.fs=fs; document.documentElement.setAttribute('data-fs',fs); S().settings.contacts=[{name:'麥松華',phone:'+886912920024',line:'https://line.me/ti/p/X'}]; S().settings.dayOverride=2; P.tab='home'; render();
      const row=document.querySelector('.sos-row'); return {th:Math.round(row.querySelector('.t').getBoundingClientRect().height),clipped:[...row.querySelectorAll('a,button')].some(e=>e.scrollWidth>e.clientWidth+3),ov:document.documentElement.scrollWidth>innerWidth}; },fs);
    await q.close(); ck(w+'px '+fs+'：緊急求助列不擠不切不溢出',r.th<=48&&!r.clipped&&!r.ov,r); }

  console.log('[10] 最小字級與命中區（標準字級）');
  const m10=await p.evaluate(()=>{
    P.fs='md'; document.documentElement.setAttribute('data-fs','md'); const out={};
    const fs=(sel)=>{ const e=document.querySelector(sel); return e?parseFloat(getComputedStyle(e).fontSize):null; };
    P.tab='home'; S().settings.dayOverride=2; render(); out.tab=fs('.tab span'); out.dayChip=fs('#hdDay');
    const mb=document.querySelector('.map-btn'); out.mapBtn=mb?Math.round(mb.getBoundingClientRect().height):null;
    P.tab='plan'; P.planDay=2; render(); out.dayrowSmall=fs('.dayrow button small'); const tm=document.querySelector('a.tag.map'); out.tagMap=tm?Math.round(tm.getBoundingClientRect().height):null;
    P.tab='rooms'; P.roomsSeg='list'; render(); out.rt=fs('.mc .rt'); members()[0].airline='eva'; render(); out.al=fs('.al'); const al=document.querySelector('.al'); out.alBox=al?Math.round(al.getBoundingClientRect().width):null;
    P.tab='tools'; P.tool='menu'; render(); out.tcardSmall=fs('.tcard small'); out.ver=fs('.ver');
    const ib=document.querySelector('.inst-btn'); out.instH=ib?Math.round(ib.getBoundingClientRect().height):null;
    return out;
  });
  ck('底部分頁文字 ≥ 14px',m10.tab>=14,m10.tab);
  ck('房號／桌次那行 ≥ 14px',m10.rt>=14,m10.rt);
  ck('工具卡小字 ≥ 14px',m10.tcardSmall>=14,m10.tcardSmall);
  ck('日期列小字 ≥ 12.5px（五等分日期列，天數字才是主角）',m10.dayrowSmall>=12.5,m10.dayrowSmall);
  ck('版本字 ≥ 14px',m10.ver>=14,m10.ver);
  ck('航空徽章字 ≥ 11.5px 且圓圈 ≥ 32px（縮寫徽章，本來就小）',m10.al>=11.5&&m10.alBox>=32,{al:m10.al,box:m10.alBox});
  ck('首頁地圖圖示 ≥ 44px',m10.mapBtn>=44,m10.mapBtn);
  ck('行程頁地圖標籤 ≥ 44px',m10.tagMap>=44,m10.tagMap);
  ck('安裝 App 按鈕 ≥ 36px',m10.instH>=36,m10.instH);

  console.log('[9] 對比度');
  const c9=await p.evaluate(()=>{
    const srgb=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);};
    const lum=v=>{const m=String(v).match(/(\d+),\s*(\d+),\s*(\d+)/); return .2126*srgb(+m[1])+.7152*srgb(+m[2])+.0722*srgb(+m[3]);};
    const rat=(a,b)=>{const x=Math.max(a,b),y=Math.min(a,b);return +((x+.05)/(y+.05)).toFixed(2);};
    P.tab='home'; S().settings.dayOverride=2; S().broadcast.time='15:00'; render();
    const out={};
    for(const th of ['light','dark']){
      document.documentElement.setAttribute('data-theme',th);
      const hero=document.querySelector('.hero'); const hb=lum(getComputedStyle(hero).backgroundColor), ht=lum(getComputedStyle(hero.querySelector('.lab')).color);
      const card=document.querySelector('.card')||document.querySelector('.ccard'); const cb=lum(getComputedStyle(card).backgroundColor);
      const sub=document.querySelector('.card-h .sub')||document.querySelector('.chead .sm'); const st=lum(getComputedStyle(sub).color);
      const lcd=document.querySelector('.lcd'), lb=document.querySelector('.lcd .lb');
      out[th]={hero:rat(hb,ht),grey:rat(cb,st),lcd:rat(lum(getComputedStyle(lb).color),lum(getComputedStyle(document.querySelector('.top-r2')).backgroundColor))};
    }
    document.documentElement.removeAttribute('data-theme'); S().broadcast.time='';
    return out;
  });
  ck('淺色：廣播卡白字對比 ≥ 4.5',c9.light.hero>=4.5,c9.light);
  ck('深色：廣播卡白字對比 ≥ 4.5',c9.dark.hero>=4.5,c9.dark);
  ck('淺色：灰色小字對比 ≥ 4.5',c9.light.grey>=4.5,c9.light);
  ck('深色：灰色小字對比 ≥ 4.5',c9.dark.grey>=4.5,c9.dark);
  ck('淺色：頂列標籤對比 ≥ 4.5（相對於深藍帶，實際面板更深）',c9.light.lcd>=4.5,c9.light);

  console.log('[11] 空間不足與佇列合併');
  const q11=await p.evaluate(()=>{
    const orig=localStorage.setItem.bind(localStorage); const out={};
    /* 只擋「整包」（含底圖）的大寫入，模擬快滿 */
    S().photos.items={x:{src:'data:image/webp;base64,'+'A'.repeat(4000),op:9,kb:3}};
    localStorage.setItem=(k,v)=>{ if(k==='sapa-data'&&v.indexOf('AAAA')>=0) throw new Error('QuotaExceededError'); return orig(k,v); };
    out.slimOK=Store.cache(); out.slimFlag=!!JSON.parse(localStorage.getItem('sapa-data')).slim; out.toast1=document.getElementById('toast').textContent;
    /* 全部擋掉 */
    localStorage.setItem=(k,v)=>{ if(k==='sapa-data') throw new Error('QuotaExceededError'); return orig(k,v); };
    Store.q=[{key:'broadcast',path:'',val:{a:1},ts:1}]; out.fullOK=Store.cache(); out.cacheOK=Store.cacheOK; out.toast2=document.getElementById('toast').textContent;
    out.qSaved=!!localStorage.getItem('sapa-q');
    localStorage.setItem=orig; localStorage.removeItem('sapa-q'); S().photos.items={}; Store.q=[];
    /* 佇列合併 */
    Store.push=null;
    Store.enqueue({key:'itinerary',path:'items/0/title',val:'a',ts:1});
    Store.enqueue({key:'itinerary',path:'items/1/title',val:'b',ts:2});
    Store.enqueue({key:'broadcast',path:'',val:{t:1},ts:3});
    Store.enqueue({key:'itinerary',path:'',val:{items:[]},ts:4});   /* 整份 → 前兩筆局部應被吸收 */
    Store.enqueue({key:'itinerary',path:'items/2/title',val:'c',ts:5});
    Store.enqueue({key:'itinerary',path:'items/2/title',val:'d',ts:6}); /* 同一格再改 → 取代 */
    out.q=Store.q.map(o=>o.key+':'+o.path+':'+JSON.stringify(o.val)); Store.q=[]; Store.cache();
    return out;
  });
  ck('整包存不下時退而不存底圖，仍算成功',q11.slimOK&&q11.slimFlag,q11);
  ck('退讓時有提示',/儲存空間/.test(q11.toast1),q11.toast1);
  ck('完全存不下時回傳失敗且 cacheOK=false',q11.fullOK===false&&q11.cacheOK===false,q11);
  ck('完全存不下時有明確警告',/儲存空間不足/.test(q11.toast2),q11.toast2);
  ck('完全存不下時至少把待送佇列另存',q11.qSaved);
  ck('佇列合併正確（整份吸收局部、同格取代）',JSON.stringify(q11.q)===JSON.stringify(['broadcast::{"t":1}','itinerary::{"items":[]}','itinerary:items/2/title:"d"']),q11.q);

  console.log('[2] 資料突然變少：自動留上一版、可還原');
  const g2=await p.evaluate(()=>{
    P.leader=true; localStorage.removeItem('sapa-prev-members'); const n0=members().length;
    const wiped={_ts:Date.now(),items:[]};
    Store.applyRemote({members:wiped});
    const afterWipe=members().length, snap=JSON.parse(localStorage.getItem('sapa-prev-members')||'null');
    const toast=document.getElementById('toast').textContent;
    const list=Store.prevSnapshots();
    Store.push=null; Store.q=[]; const ok=Store.restorePrev('members'); const restored=members().length; const queued=Store.q.map(o=>o.key+':'+o.path);
    const gone=!localStorage.getItem('sapa-prev-members');
    /* 小幅減少（刪 1 人）不該觸發 */
    const one={_ts:Date.now(),items:members().slice(1)}; Store.applyRemote({members:one}); const noSnap=!localStorage.getItem('sapa-prev-members');
    P.leader=false; Store.q=[];
    return {n0,afterWipe,snapN:snap&&snap.n,toast,list,ok,restored,queued,gone,noSnap};
  });
  ck('名單被清空時畫面確實變 0（測試本身有效）',g2.afterWipe===0,g2);
  ck('自動留下上一版（33 筆）',g2.snapN===g2.n0&&g2.n0>=30,g2);
  ck('管理者看到提示',/突然從/.test(g2.toast),g2.toast);
  ck('管理專區清單列得出來',g2.list.length===1&&g2.list[0].key==='members',g2.list);
  ck('還原後名單回來並排入同步',g2.ok&&g2.restored===g2.n0&&g2.queued[0]==='members:',g2);
  ck('還原後備份清掉',g2.gone);
  ck('只少一筆不會觸發',g2.noSnap);
  await p.evaluate(()=>{ location.reload(); }); await wait(p,600);
  ck('管理專區有「還原上一版」按鈕',await p.evaluate(()=>{ P.leader=true; P.tab='tools'; P.tool='menu'; render(); const b=document.querySelector('[data-act="prevList"]'); P.leader=false; return !!b; }));

  console.log('[3] 連線：有時限、失敗後訊號回來會重連');
  const q=await ctx.newPage(); let sdkReq=0; let block=true;
  await q.route(/gstatic\.com\/firebasejs/,r=>{ sdkReq++; if(block) return r.abort(); return r.continue(); });
  await q.addInitScript(()=>{ window.SAPA_CONFIG={sync:'firebase',firebase:{apiKey:'x',databaseURL:'https://example-default-rtdb.firebaseio.com',projectId:'x'},path:'trip',auth:''}; });
  await q.goto(FILE); await wait(q,1500);
  const s3a=await q.evaluate(()=>({mode:Store.mode,txt:document.getElementById('hdSyncTx').textContent,off:!document.getElementById('offBar').hidden}));
  ck('SDK 載不到時很快退回未連線（不會卡在連線中）',s3a.mode==='local'&&s3a.txt==='未連線',s3a);
  ck('此時離線提示條出現',s3a.off,s3a);
  const before=sdkReq;
  await q.evaluate(()=>{ Store._lastTry=0; window.dispatchEvent(new Event('online')); }); await wait(q,1200);
  ck('online 事件後會再嘗試載入 SDK',sdkReq>before,{before,after:sdkReq});
  const before2=sdkReq;
  await q.evaluate(()=>{ Store._lastTry=0; Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}); document.dispatchEvent(new Event('visibilitychange')); }); await wait(q,1200);
  ck('回到前景也會再嘗試',sdkReq>before2,{before2,after:sdkReq});
  const before3=sdkReq;
  await q.evaluate(()=>{ window.dispatchEvent(new Event('online')); window.dispatchEvent(new Event('online')); }); await wait(q,800);
  ck('5 秒內不會重複狂試',sdkReq===before3,{before3,after:sdkReq});
  /* 逾時：讓 SDK 請求永遠不回 → 8 秒左右要放棄 */
  const q2=await ctx.newPage(); await q2.route(/gstatic\.com\/firebasejs/,r=>{ /* hang */ });
  await q2.addInitScript(()=>{ window.SAPA_CONFIG={sync:'firebase',firebase:{apiKey:'x',databaseURL:'https://example-default-rtdb.firebaseio.com',projectId:'x'},path:'trip',auth:''}; });
  await q2.goto(FILE,{waitUntil:'domcontentloaded'}); await wait(q2,1000);
  const mid=await q2.evaluate(()=>Store.mode);
  await wait(q2,8500);
  const end=await q2.evaluate(()=>Store.mode);
  ck('SDK 一直不回時先是連線中（測試本身有效）',mid==='connecting',mid);
  ck('約 8 秒後放棄，不會永遠連線中',end==='local',end);
  await q.close(); await q2.close();

  console.log('[驗收追加] 獨立驗收找到的問題，修正後補測');
  /* R2：第一次載入「卡住」時，重試必須真的發出新請求（不同網址參數），而不是被瀏覽器合併 */
  const q3=await ctx.newPage(); let reqs=[]; let hang=true;
  await q3.route(/gstatic\.com\/firebasejs/,r=>{ reqs.push(r.request().url()); if(hang) return; r.abort(); });
  await q3.addInitScript(()=>{ window.SAPA_CONFIG={sync:'firebase',firebase:{apiKey:'x',databaseURL:'https://example-default-rtdb.firebaseio.com',projectId:'x'},path:'trip',auth:''}; });
  await q3.goto(FILE,{waitUntil:'domcontentloaded'}); await wait(q3,9000);
  const afterTimeout=await q3.evaluate(()=>({mode:Store.mode,scripts:document.querySelectorAll('script[src*="firebasejs"]').length}));
  ck('卡住 8 秒後放棄，並把卡住的 <script> 拆掉',afterTimeout.mode==='local'&&afterTimeout.scripts===0,afterTimeout);
  const n1=reqs.length; hang=false;
  await q3.evaluate(()=>{ Store._lastTry=0; window.dispatchEvent(new Event('online')); }); await wait(q3,1200);
  ck('重試真的發出新的 SDK 請求（帶不同參數）',reqs.length>n1&&/[?&]r=2/.test(reqs[reqs.length-1]),{n1,now:reqs.length,last:reqs[reqs.length-1]});
  await q3.close();
  /* R5(d)：sapa-q 是最新的完整佇列，要以它為準 */
  const q5=await p.evaluate(()=>{ localStorage.setItem('sapa-data',JSON.stringify({docs:{},at:Date.now(),q:[{key:'broadcast',path:'',val:{},ts:1}]})); localStorage.setItem('sapa-q',JSON.stringify([{key:'broadcast',path:'',val:{},ts:1},{key:'settings',path:'x',val:1,ts:2}])); Store.q=[]; Store.init(); const r=Store.q.map(o=>o.key); Store.q=[]; Store.cache(); return r; });
  ck('重新啟動時以 sapa-q（較新、較完整）為準',JSON.stringify(q5)===JSON.stringify(['broadcast','settings']),q5);
  /* R8：表單關掉之後，下一次 tick 要補畫 */
  const r8=await p.evaluate(()=>{ P.tab='home'; S().settings.dayOverride=2; render(); tick(); openSheet({title:'t',body:'<input id="tin2">'}); document.getElementById('tin2').focus(); S().settings.dayOverride=4; tick(); const during=document.getElementById('hdDay').textContent; closeSheet(); tick(); const after=document.getElementById('hdDay').textContent; S().settings.dayOverride=0; render(); return {during,after}; });
  ck('表單開著時沒改（測試本身有效）',/第 2/.test(r8.during),r8);
  ck('表單關掉後下一次 tick 補畫成第 4 天',/第 4/.test(r8.after),r8);
  /* R1：連續變少要留最完整的那份 */
  const r1=await p.evaluate(()=>{ localStorage.removeItem('sapa-prev-members'); P.leader=true; const n0=members().length; const ten=members().slice(0,10); Store.applyRemote({members:{_ts:1,items:ten}}); Store.applyRemote({members:{_ts:2,items:ten.slice(0,2)}}); const snap=JSON.parse(localStorage.getItem('sapa-prev-members')); Store.restorePrev('members'); Store.q=[]; P.leader=false; return {n0,kept:snap.n,restored:members().length}; });
  ck('33→10→2 連續變少，留下的是 33 那份',r1.kept===r1.n0&&r1.restored===r1.n0,r1);
  /* D3：被雲端拒絕的修改不能卡住後面的 */
  const d3=await p.evaluate(async()=>{ const sent=[]; Store.push=true; Store.pushOp=op=>{ if(op.key==='members') return Promise.reject({code:'PERMISSION_DENIED'}); sent.push(op.key); return Promise.resolve(); };
    Store.q=[{key:'members',path:'',val:{items:[]},ts:1},{key:'broadcast',path:'',val:{},ts:2}]; Store.flushing=false; Store.flush(); await new Promise(r=>setTimeout(r,600));
    const r={sent,left:Store.q.map(o=>o.key),toast:document.getElementById('toast').textContent}; Store.push=null; Store.pushOp=null; Store.q=[]; return r; });
  ck('被拒絕的那筆被略過、後面那筆照常送出',JSON.stringify(d3.sent)===JSON.stringify(['broadcast'])&&d3.left.length===0,d3);
  ck('略過時有說明',/被雲端拒絕/.test(d3.toast),d3.toast);
  /* R7：離線時按更新不能清快取 */
  const r7=await p.evaluate(async()=>{ let cleared=0; const orig=caches.keys; caches.keys=()=>{cleared++; return Promise.resolve([]);}; Object.defineProperty(navigator,'onLine',{value:false,configurable:true}); ACT.reloadApp(); await new Promise(r=>setTimeout(r,300)); const t=document.getElementById('toast').textContent; caches.keys=orig; Object.defineProperty(navigator,'onLine',{value:true,configurable:true}); return {cleared,t}; });
  ck('沒網路時按「更新」不清快取，且有提示',r7.cleared===0&&/沒有網路/.test(r7.t),r7);
  ck('verCmp 容忍 v 前綴',await p.evaluate(()=>verCmp('v3.19','3.18')>0));
  /* D7：成功存到手機後，備援的 sapa-q 要清掉 */
  ck('成功快取後 sapa-q 會被清掉',await p.evaluate(()=>{ localStorage.setItem('sapa-q','[{"key":"x","path":"","val":{},"ts":1}]'); Store.q=[]; Store.cache(); return localStorage.getItem('sapa-q')===null; }));
  /* D8：空間滿時只存到 sapa-q，之後離線連開兩次（中間沒改東西）未送出的修改不能消失 */
  const d8=await p.evaluate(()=>{ localStorage.setItem('sapa-data',JSON.stringify({docs:{},at:Date.now(),q:[]})); localStorage.setItem('sapa-q','[{"key":"broadcast","path":"","val":{},"ts":1}]');
    Store.q=[]; Store.init(); const a=Store.q.map(o=>o.key);           /* 第一次離線開啟 */
    Store.q=[]; Store.init(); const b=Store.q.map(o=>o.key);           /* 第二次離線開啟：沒有任何 cache() 以外的動作 */
    const r={a,b,inData:(JSON.parse(localStorage.getItem('sapa-data')).q||[]).map(o=>o.key)}; Store.q=[]; Store.cache(); return r; });
  ck('D8：sapa-q 的修改在第二次離線開啟後仍在（已寫回 sapa-data）',d8.a.join()==='broadcast'&&d8.b.join()==='broadcast',d8);
  ck('深色主題的橘色按鈕仍是白字（對比 ≥ 4.5）',await p.evaluate(()=>{ document.documentElement.setAttribute('data-theme','dark'); P.tab='home'; S().settings.dayOverride=2; S().settings.contacts=[{name:'甲',phone:'+886900000000'}]; render(); const e=document.querySelector('.sos-row .btn.warn'); const c=getComputedStyle(e).color; document.documentElement.removeAttribute('data-theme'); return /255, 255, 255/.test(c); }));
  /* 沒有聯絡人時緊急求助列仍有字 */
  ck('沒有聯絡人時緊急求助列顯示「緊急求助頁」按鈕',await p.evaluate(()=>{ S().settings.contacts=[]; P.tab='home'; S().settings.dayOverride=2; render(); const r=document.querySelector('.sos-row'); return !!r&&/緊急求助頁/.test(r.textContent); }));
  /* U8：320/xl 版面 */
  const u8=await (async()=>{ const q=await ctx.newPage(); await q.setViewportSize({width:320,height:568}); await q.goto(FILE); await wait(q,300);
    const r=await q.evaluate(()=>{ P.fs='xl'; P.tipDismissed=true; S().settings.dayOverride=2; S().broadcast.time=''; P.tab='home'; render(); const out={};
      const lab=document.querySelector('.hero .lab'); out.labH=Math.round(lab.getBoundingClientRect().height);
      /* v3.19：日期放不下時整段換到第二行（不截斷）；要檢查的是「今天行程」這幾個字本身沒有被拆成兩行 */
      const tn=[...lab.childNodes].find(n=>n.nodeType===3&&n.textContent.trim()); if(tn){ const rg=document.createRange(); rg.selectNodeContents(tn); out.labRects=rg.getClientRects().length; }
      const up=lab.querySelector('.upd'); out.updClip=up?up.scrollWidth-up.clientWidth:0;
      P.tab='tools'; P.tool='menu'; render(); const g=document.querySelector('.tool-grid'); out.toolOv=g.scrollWidth-g.clientWidth; out.pageOv=document.documentElement.scrollWidth-innerWidth;
      P.tab='home'; S().settings.dayOverride=0; P.cards={prep:{o:1,ts:9e12},flight:{o:1,ts:9e12}}; render();
      const pb=document.querySelector('[data-act="nbGo"]'); out.prepClip=pb?pb.scrollWidth-pb.clientWidth:0; const fh=document.querySelector('.fl-h'); out.flClip=fh?fh.scrollWidth-fh.clientWidth:0;
      const t=document.getElementById('toast'); t.textContent='連不上雲端，先顯示手機裡的資料；有訊號時會自動再連'; t.classList.add('show'); out.toastW=Math.round(t.getBoundingClientRect().width); out.toastH=Math.round(t.getBoundingClientRect().height); t.classList.remove('show');
      return out; });
    await q.close(); return r; })();
  ck('320/xl：今天行程標籤本身不折行、日期不截斷',u8.labRects===1&&u8.updClip<=1,{labRects:u8.labRects,updClip:u8.updClip,labH:u8.labH});
  ck('320/xl：工具格線不溢出',u8.toolOv<=0&&u8.pageOv<=0,u8);
  ck('320/xl：出發前準備按鈕文字不被切',u8.prepClip<=3,u8.prepClip);
  ck('320/xl：航班欄標題不被切',u8.flClip<=3,u8.flClip);
  ck('320/xl：toast 用寬版換行，不是窄窄一條',u8.toastW>=240&&u8.toastH<=120,u8);

  ck('全程無 JS 錯誤',errs.length===0,errs.slice(0,3));
  await ctx.close(); await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

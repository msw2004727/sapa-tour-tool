/* 時光機：把手機時鐘撥到旅遊前／中／後的各個時間點，記錄首頁長什麼樣子。
   用 Playwright 的 clock 假造「現在」，資料用預設行程＋線上那則「9/24 05:30 機場集合」廣播。
   node audit/timeline.js            → 印出每個時間點的首頁摘要
   node audit/timeline.js --shots    → 另存 375px 截圖到 shots/timeline/
   最後一段是斷言（v3.19）：出發日的台灣時間、過期廣播、最後一天、App 開著過夜、「現在＋N 分」、時間模擬。 */
const {chromium,FILE,at}=require('./_lib');
const fs=require('fs');
const SHOTS=process.argv.includes('--shots');
if(SHOTS) fs.mkdirSync(at('shots/timeline'),{recursive:true});

/* 時間一律寫台灣時間（+08:00），比較好對照 */
const POINTS=[
  ['出發前 3 天（今天）',        '2026-09-21T14:00'],
  ['出發前一晚',                 '2026-09-23T21:00'],
  ['出發日 04:30（出門前）',      '2026-09-24T04:30'],
  ['出發日 05:20（快集合）',      '2026-09-24T05:20'],
  ['出發日 05:40（集合過 10 分）', '2026-09-24T05:40'],
  ['出發日 07:00（辦登機）',      '2026-09-24T07:00'],
  ['第1天 12:30（剛到河內）',     '2026-09-24T12:30'],
  ['第1天 22:00（沙壩晚上）',     '2026-09-24T22:00'],
  ['第2天 06:30（早餐）',         '2026-09-25T06:30'],
  ['第2天 10:00（纜車中）',       '2026-09-25T10:00'],
  ['第3天 15:00',                '2026-09-26T15:00'],
  ['第4天 23:00（夜臥火車上）',   '2026-09-27T23:00'],
  ['第5天 07:00（河內早餐後）',   '2026-09-28T07:00'],
  ['第5天 18:00（已回到台灣）',   '2026-09-28T18:00'],
  ['回國隔天',                   '2026-09-29T10:00'],
  ['回國一週後',                 '2026-10-05T10:00'],
];
const BC={time:'05:30',label:'集合',location:'桃園機場第二航廈',tip:'',idle:false,updatedAt:'18:03',date:'2026-09-24'};

(async()=>{
  const b=await chromium.launch(); const rows=[];
  for(const withBc of [true,false]){
    for(const [name,t] of POINTS){
      const ctx=await b.newContext({viewport:{width:375,height:740},timezoneId:'Asia/Taipei'});
      const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
      await p.clock.install({time:new Date(t+':00+08:00')});
      await p.route(/gstatic\.com/,r=>r.abort());
      await p.goto(FILE); await p.waitForTimeout(300);
      const r=await p.evaluate(bc=>{
        S().broadcast=bc?Object.assign({},bc):{time:'',label:'集合',location:'',tip:'',idle:false,updatedAt:''};
        S().settings.dayOverride=0; P.leader=false; P.meId=(members()[0]||{}).id; P.tab='home'; render(); tick();
        const q=s=>document.querySelector(s), tx=s=>((q(s)||{}).textContent||'').replace(/\s+/g,' ').trim();
        const zone=z=>[...document.querySelectorAll('.zone-'+z+' .card-h h2, .zone-'+z+' .chead .t, [data-zone="'+z+'"] .chead .t')].map(e=>e.textContent.trim());
        const di=dayInfo(), ns=nextStop(di);
        const today=[...document.querySelectorAll('.zsec')].map(g=>({z:((g.querySelector('.zlab')||{}).textContent||'').replace(/\s+/g,'').slice(0,4),cards:[...g.children].filter(c=>!c.classList.contains('zlab')).map(c=>{const h=c.querySelector('.card-h h2,.chead');return (h?h.textContent:c.textContent).replace(/\s+/g,' ').trim().slice(0,14);})}));
        const cur=[...document.querySelectorAll('.tl .cur, .today .cur, .badge.cur, .t-now')].map(e=>e.textContent.trim());
        P.tab='plan'; P.planDay=0; render(); const planDay=tx('.dayrow button.on')+' 頂列='+tx('#hdDay'); P.tab='home'; render();
        return {status:di.status,idx:di.idx,vn:tzParts(VN).hm,tw:tzParts(TW).hm,
          heroLab:tx('.hero .lab'),heroTime:tx('.hero .time'),heroLoc:tx('.hero .loc'),count:q('#countdown')&&!q('#countdown').hidden?tx('#countdown'):'',
          lcd:tx('#hdCountdown'),next:ns?ns.kind+' '+ns.time+' '+ns.title:'—',zones:today,cur,planDay,greet:tx('#syncBar')};
      },withBc?BC:null);
      r.name=name; r.t=t; r.bc=withBc; r.errs=errs; rows.push(r);
      if(SHOTS) await p.screenshot({path:at('shots/timeline/'+(withBc?'bc':'nobc')+'-'+t.replace(/[:T]/g,'')+'.png'),fullPage:false});
      await ctx.close();
    }
  }
  await b.close();
  if(SHOTS) fs.writeFileSync(at('shots/timeline/timeline.json'),JSON.stringify(rows,null,1));
  for(const r of rows){
    console.log(`\n■ ${r.bc?'[有機場廣播]':'[沒廣播]'} ${r.name}  (台灣 ${r.tw} / 越南 ${r.vn})  狀態=${r.status}${r.status==='on'?' 第'+r.idx+'天':''}`);
    console.log(`  大字卡：${r.heroLab} ｜ ${r.heroTime} ｜ ${r.heroLoc}${r.count?' ｜ 倒數：'+r.count:''}`);
    console.log(`  頂列：${r.lcd} ｜ nextStop：${r.next} ｜ 行程頁預設：${r.planDay} ｜ ${r.greet}`);
    console.log(`  分區：${r.zones.map(z=>z.z+'='+z.cards.join('/')).join('  ')}`);
    if(r.errs.length) console.log('  JS 錯誤：',r.errs);
  }

  /* ===== 斷言 ===== */
  let fails=0; const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x));} else console.log('  ✓',n); };
  const R=(bc,name)=>rows.find(r=>r.bc===bc&&r.name.startsWith(name));
  console.log('\n[斷言 1] 出發日集合用台灣時間算');
  ck('出發前一晚：還有 8 小時 30 分（以前會多算 1 小時）',/還有 8 小時 30 分/.test(R(true,'出發前一晚').count),R(true,'出發前一晚').count);
  ck('05:20：還有 10 分鐘',/還有 10 分鐘/.test(R(true,'出發日 05:20').count),R(true,'出發日 05:20').count);
  ck('05:40：已過 10 分鐘',/已過 10 分鐘/.test(R(true,'出發日 05:40').count),R(true,'出發日 05:40').count);
  ck('大字卡標出「台灣時間」',/台灣時間/.test(R(true,'出發日 05:20').heroTime),R(true,'出發日 05:20').heroTime);
  ck('沒廣播時 05:40 的下一站是 06:00 分頭辦登機',/^下一站|06:00/.test(R(false,'出發日 05:40').heroTime)&&/分頭辦登機/.test(R(false,'出發日 05:40').heroLoc),R(false,'出發日 05:40'));
  ck('07:00 時下一站已經是 11:15 河內機場會合',/河內機場會合/.test(R(false,'出發日 07:00').heroLoc),R(false,'出發日 07:00').heroLoc);
  ck('第 1 天到越南之後不再標台灣時間',!/台灣時間/.test(R(false,'第1天 12:30').heroTime),R(false,'第1天 12:30').heroTime);
  console.log('[斷言 2] 過期的機場廣播不會霸佔首頁');
  for(const n of ['第1天 12:30','第2天 10:00','第3天 15:00','第5天 07:00'])
    ck(n+'：大字卡是今天行程，不是機場廣播',/今天行程/.test(R(true,n).heroLab)&&!/桃園/.test(R(true,n).heroLoc),R(true,n).heroLab+' '+R(true,n).heroLoc);
  ck('集合前廣播仍然顯示（05:20）',/即時廣播/.test(R(true,'出發日 05:20').heroLab));
  console.log('[斷言 3] 最後一天、回國後');
  ck('第 5 天晚上：不再叫人看「明早時程」',/回家路上平安/.test(R(true,'第5天 18:00').heroLoc),R(true,'第5天 18:00').heroLoc);
  ck('第 5 天不顯示明早時程卡',!R(true,'第5天 07:00').zones.some(z=>z.cards.some(c=>/明早時程/.test(c))),R(true,'第5天 07:00').zones);
  ck('第 4 天仍顯示明早時程卡',R(true,'第4天 23:00').zones.some(z=>z.cards.some(c=>/明早時程/.test(c))));
  ck('回國隔天：旅程圓滿結束',/旅程圓滿結束/.test(R(true,'回國隔天').heroLab));
  ck('全部時間點沒有 JS 錯誤',rows.every(r=>!r.errs.length),rows.filter(r=>r.errs.length).map(r=>r.name));

  const b2=await chromium.launch();
  const mk=async(t,url,w)=>{ const ctx=await b2.newContext({viewport:{width:w||375,height:740},timezoneId:'Asia/Taipei'}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.clock.install({time:new Date(t+':00+08:00')}); await p.route(/gstatic\.com/,r=>r.abort()); await p.goto(url||FILE); await p.waitForTimeout(300); return {ctx,p,errs}; };

  console.log('[斷言 4] App 開著過夜：行程頁自己換到今天');
  { const {ctx,p,errs}=await mk('2026-09-24T22:00');
    await p.evaluate(()=>{ P.tab='plan'; P.planDay=0; render(); tick(); });
    const d1=await p.evaluate(()=>P.planDay);
    await p.clock.fastForward('09:00:00');   /* 隔天 07:00 */
    await p.evaluate(()=>{ tick(); });
    const d2=await p.evaluate(()=>({pd:P.planDay,on:(document.querySelector('.dayrow button.on')||{}).textContent}));
    ck('前一晚停在第 1 天（測試前提）',d1===1,d1);
    ck('隔天早上行程頁自動換成第 2 天',d2.pd===2&&/第\s?2\s?天/.test(d2.on||''),d2);
    ck('無 JS 錯誤',!errs.length,errs); await ctx.close(); }

  console.log('[斷言 5] 「現在＋N 分」寫對時區');
  { const {ctx,p}=await mk('2026-09-24T05:00');
    const r=await p.evaluate(()=>{ S().broadcast={time:'',label:'集合',location:'x',tip:'',idle:false}; P.leader=true; const b=document.createElement('button'); b.setAttribute('data-min','15'); ACT.bumpTime(b); return {t:S().broadcast.time,d:S().broadcast.date,diff:bcDiffMin()}; });
    ck('出發日台灣 05:00 按＋15：05:15、倒數 15 分',r.t==='05:15'&&r.diff===15,r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T10:00');
    const r=await p.evaluate(()=>{ S().broadcast={time:'',label:'集合',location:'x',tip:'',idle:false}; P.leader=true; const b=document.createElement('button'); b.setAttribute('data-min','30'); ACT.bumpTime(b); return {t:S().broadcast.time,d:S().broadcast.date,diff:bcDiffMin()}; });
    ck('第 2 天台灣 10:00（越南 09:00）按＋30：09:30、倒數 30 分',r.t==='09:30'&&r.diff===30&&r.d==='2026-09-25',r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T00:50');
    const r=await p.evaluate(()=>{ S().broadcast={time:'',label:'集合',location:'x',tip:'',idle:false}; const b=document.createElement('button'); b.setAttribute('data-min','30'); ACT.bumpTime(b); return {t:S().broadcast.time,d:S().broadcast.date,diff:bcDiffMin()}; });
    ck('越南 23:50 按＋30：跨午夜變隔天 00:20',r.t==='00:20'&&r.d==='2026-09-25'&&r.diff===30,r); await ctx.close(); }

  { const {ctx,p}=await mk('2026-09-24T08:50');
    const r=await p.evaluate(()=>{ S().broadcast={time:'',label:'集合',location:'x',tip:'',idle:false}; const b=document.createElement('button'); b.setAttribute('data-min','15'); ACT.bumpTime(b); return {t:S().broadcast.time,tz:S().broadcast.tz,diff:bcDiffMin()}; });
    ck('出發日台灣 08:50 按＋15（兩種寫法都會被誤判的時段）：倒數仍是 15 分',r.diff===15,r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T10:00');
    const r=await p.evaluate(()=>{ P.leader=true; ACT.clearBroadcastGo(); const a=bcActive(); return {a,date:S().broadcast.date}; });
    ck('清空廣播（自由活動）會帶今天日期，隔天自動失效',r.a===true&&r.date==='2026-09-25',r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-24T08:50');
    const r=await p.evaluate(()=>{ P.leader=true; S().broadcast={time:'',label:'集合',location:'x',tip:'',idle:false}; ACT.editBroadcast();
      const c=document.querySelector('#sheetRoot [data-act="chipTimeFromNow"][data-min="15"]'); ACT.chipTimeFromNow(c); ACT.saveBroadcast(); return {t:S().broadcast.time,tz:S().broadcast.tz,diff:bcDiffMin()}; });
    ck('廣播表單裡的「現在＋15分」在同一時段也算對',r.diff===15,r);
    const r2=await p.evaluate(()=>{ ACT.editBroadcast(); el('sheetRoot').querySelector('[name="location"]').value='只改地點'; ACT.saveBroadcast(); return {tz:S().broadcast.tz,diff:bcDiffMin()}; });
    ck('之後只改地點再存檔，時區不會掉',r2.diff===15,r2); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-26T07:00');
    const r=await p.evaluate(()=>{ S().broadcast={time:'',label:'',location:'',tip:'',idle:true,date:'2026-09-25'}; render(); tick(); return {lcd:document.getElementById('hdCountdown').textContent,hero:document.querySelector('.hero .lab').textContent}; });
    ck('前一天的自由活動：頂列與大字卡都不再顯示',!/自由活動/.test(r.lcd)&&/今天行程/.test(r.hero),r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T10:00',null,320);
    const r=await p.evaluate(()=>{ P.fs='xl'; document.documentElement.setAttribute('data-fs','xl'); S().broadcast={time:'',label:'',location:'',tip:'',idle:false}; render(); const u=document.querySelector('.hero .lab .upd'); return {sw:u.scrollWidth,cw:u.clientWidth,t:u.textContent}; });
    ck('大字卡的日期不被截斷（320 特大字）',r.sw<=r.cw+1,r); await ctx.close(); }
  console.log('[斷言 5b] 線上那則「沒有日期」的舊廣播、被釘住的出發前準備');
  { const {ctx,p}=await mk('2026-09-26T05:00');   /* 第 3 天清晨：舊寫法會以為今天 05:30 又要機場集合 */
    const r=await p.evaluate(()=>{ S().broadcast={_ts:Date.UTC(2026,8,9,10,3),idle:false,label:'機場集合',location:'桃園機場(各自航廈)',time:'05:30',tip:'',updatedAt:'18:03'};
      S().settings.zones={manual:{flight:'now',hotel:'auto',morning:'auto',prep:'now'},mode:'card',order:['prep','flight','today','hotel','morning'],prepUntil:'start'};
      render(); tick(); return {bd:bcDate(),on:bcActive(),hero:document.querySelector('.hero .lab').textContent,prep:cardZone('prep',dayInfo()),flight:cardZone('flight',dayInfo())}; });
    ck('出發前存的無日期廣播被當成 9/24',r.bd==='2026-09-24',r);
    ck('第 3 天清晨不會再冒出機場集合',!r.on&&/今天行程/.test(r.hero),r);
    ck('出發前準備就算被釘在「現在」，出發後也收起來',r.prep==='hide',r);
    ck('航班卡第 3 天沒有要搭的飛機：就算被釘住也收起（v3.20）',r.flight==='hide',r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T21:00');
    const r=await p.evaluate(()=>{ S().broadcast={_ts:Date.now(),idle:false,label:'大廳集合',location:'飯店大廳',time:'07:00',tip:'',updatedAt:'20:00'}; return {bd:bcDate(),diff:bcDiffMin()}; });
    ck('旅途中晚上存的「07:00」（無日期）指的是隔天早上',r.bd==='2026-09-26'&&r.diff===660,r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-21T14:00');
    const r=await p.evaluate(()=>{ S().settings.zones={manual:{prep:'now'},mode:'card',prepUntil:'start'}; return cardZone('prep',dayInfo()); });
    ck('出發前，被釘住的出發前準備照樣在「現在」',r==='now',r); await ctx.close(); }
  console.log('[斷言 7] 航班卡：去程時只看去程、回程時只看回程（v3.20）');
  const PIN={manual:{flight:'now',hotel:'auto',morning:'auto',prep:'now'},mode:'card',order:['prep','flight','today','hotel','morning'],prepUntil:'start'};
  const flightAt=async(t)=>{ const {ctx,p,errs}=await mk(t);
    const r=await p.evaluate(pin=>{ S().settings.zones=pin; S().settings.flights={eva:{out:'09:00',back:'12:05'},ci:{out:'08:20',back:'11:30'},note:'全體 05:30 在桃園機場集合'};
      S().broadcast={time:'',label:'',location:'',tip:'',idle:false}; P.meId=members()[0].id; members()[0].airline='ci'; P.cards={flight:{o:1,ts:9e12}}; P.tab='home'; render();
      const c=[...document.querySelectorAll('.ccard')].find(x=>x.querySelector('[data-id="flight"]'));
      const strip=[...document.querySelectorAll('.me-strip .k')].map(e=>e.textContent);
      const card=c?c.innerText.replace(/\s+/g,' '):'';
      if(cardOpen('flight')) cardToggle('flight'); render();   /* 收起來時的摘要 */
      const c2=[...document.querySelectorAll('.ccard')].find(x=>x.querySelector('[data-id="flight"]'));
      return {zone:cardZone('flight',dayInfo()),phase:(typeof flightPhase==='function'?flightPhase():null),card,sum:c2?c2.querySelector('.chead').innerText.replace(/\s+/g,' '):'',strip}; },PIN);
    await ctx.close(); return Object.assign(r,{errs}); };
  const F0=await flightAt('2026-09-21T14:00'), F1=await flightAt('2026-09-24T12:30'), F2=await flightAt('2026-09-25T10:00'), F3=await flightAt('2026-09-26T10:00'),
        F4=await flightAt('2026-09-27T10:00'), F5=await flightAt('2026-09-28T07:00'), F6=await flightAt('2026-09-29T10:00');
  for(const [n,F] of [['出發前',F0],['第 1 天',F1]]){
    ck(n+'：標題是「去程航班」、有 08:20 與 09:00',/去程航班/.test(F.card)&&/08:20/.test(F.card)&&/09:00/.test(F.card),F.card);
    ck(n+'：看不到回程時間與「回程」字樣',!/回程|11:30|12:05/.test(F.card),F.card);
    ck(n+'：我的資訊有「報到航廈」',F.strip.includes('報到航廈'),F.strip); }
  ck('出發前：收起時的摘要寫出哪家航空（華航 08:20・長榮 09:00）',/華航 08:20・長榮 09:00/.test(F0.sum),F0.sum);
  ck('第 1 天：去程報到說明照常顯示（出發前沒廣播時它在首頁大字卡）',/全體 05:30 在桃園機場集合/.test(F1.card),F1.card);
  for(const [n,F] of [['第 2 天',F2],['第 3 天',F3]])
    ck(n+'：沒有要搭的飛機，航班卡收起（即使被釘在現在）',F.zone==='hide'&&!F.card,F);
  for(const [n,F] of [['第 4 天',F4],['第 5 天',F5],['回國後',F6]]){
    ck(n+'：標題是「回程航班」、有 11:30 與 12:05',/回程航班/.test(F.card)&&/11:30/.test(F.card)&&/12:05/.test(F.card),F.card);
    ck(n+'：看不到去程時間、桃園航廈與機場集合說明',!/去程|08:20|09:00|桃園|05:30/.test(F.card),F.card);
    ck(n+'：我的資訊不再顯示桃園「報到航廈」',!F.strip.includes('報到航廈'),F.strip); }
  ck('第 4 天：被釘在「現在」照樣在現在',F4.zone==='now',F4.zone);
  ck('回程摘要先飛的在前（華航 11:30・長榮 12:05）',/華航 11:30・長榮 12:05/.test(F5.sum)&&!/08:20|09:00/.test(F5.sum),F5.sum);
  ck('航班卡各時間點無 JS 錯誤',[F0,F1,F2,F3,F4,F5,F6].every(F=>!F.errs.length));
  { const {ctx,p}=await mk('2026-09-28T07:00');
    const r=await p.evaluate(()=>{ S().settings.flights={eva:{out:'09:00',back:''},ci:{out:'08:20',back:''}}; P.cards={flight:{o:1,ts:9e12}}; P.tab='home'; render();
      const c=[...document.querySelectorAll('.ccard')].find(x=>x.querySelector('[data-id="flight"]')); return c?c.innerText.replace(/\s+/g,' '):''; });
    ck('回程時間還沒填：寫「待公布」而不是「--:--」',/待公布/.test(r)&&!/--:--/.test(r),r); await ctx.close(); }

  console.log('[斷言 8] 廣播表單的日期預設與「時間已過」防呆（v3.20）');
  const AIR={date:'2026-09-24',time:'05:30',label:'機場集合',location:'桃園機場',tip:'',idle:false,updatedAt:'18:03',_ts:1};
  { const {ctx,p}=await mk('2026-09-23T21:00');
    const r=await p.evaluate(b=>{ S().broadcast=Object.assign({},b); P.leader=true; ACT.editBroadcast(); return el('sheetRoot').querySelector('[name="date"]').value; },AIR);
    ck('上一則還有效（出發前一晚）：日期沿用 9/24',r==='2026-09-24',r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T06:30');   /* 第 2 天早上，機場集合早就過了 */
    const r=await p.evaluate(b=>{ S().broadcast=Object.assign({},b); P.leader=true; ACT.editBroadcast();
      const def=el('sheetRoot').querySelector('[name="date"]').value;
      setTimeField('time','08:00'); el('sheetRoot').querySelector('[name="location"]').value='飯店大廳';
      ACT.saveBroadcast(); const saved={date:S().broadcast.date,time:S().broadcast.time,active:bcActive(),diff:bcDiffMin(),hero:(document.querySelector('.hero .lab')||{}).textContent};
      return {def,saved}; },AIR);
    ck('上一則已過期：日期預設帶今天 9/25（不是 9/24）',r.def==='2026-09-25',r.def);
    ck('只改時間就存：廣播有效、全團看得到（越南 05:30 → 08:00 還有 150 分）',r.saved.date==='2026-09-25'&&r.saved.time==='08:00'&&r.saved.active&&r.saved.diff===150&&/即時廣播/.test(r.saved.hero),r.saved);
    await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T07:30');
    const r=await p.evaluate(b=>{ S().broadcast=Object.assign({},b); P.leader=true; ACT.editBroadcast();
      el('sheetRoot').querySelector('[name="date"]').value='2026-09-24'; setTimeField('time','08:00'); el('sheetRoot').querySelector('[name="location"]').value='飯店大廳';
      ACT.saveBroadcast(); return {b:Object.assign({},S().broadcast),open:!!SHEET,toast:document.getElementById('toast').textContent,q:Store.q.length}; },AIR);
    ck('日期還留在前一天：不存、表單不關',r.open&&r.b.location==='桃園機場'&&r.b.date==='2026-09-24'&&r.b.time==='05:30',r);
    ck('有提示「已經過了」並教怎麼改',/已經過了/.test(r.toast)&&/明天/.test(r.toast),r.toast);
    ck('被擋下時沒有送出任何修改',r.q===0,r.q); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T20:00');
    const r=await p.evaluate(b=>{ S().broadcast=Object.assign({},b); P.leader=true; ACT.editBroadcast();
      el('sheetRoot').querySelector('[data-act="chipSet"][data-target="date"]:nth-child(2)').click();   /* 「明天」 */
      setTimeField('time','08:00'); ACT.saveBroadcast(); return {date:S().broadcast.date,active:bcActive(),diff:bcDiffMin(),open:!!SHEET}; },AIR);
    ck('晚上按「明天」再存：9/26 08:00、倒數 13 小時',r.date==='2026-09-26'&&r.active&&r.diff===780&&!r.open,r); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-25T10:10');
    const r=await p.evaluate(()=>{ S().broadcast={time:'',label:'',location:'',tip:'',idle:false}; P.leader=true; ACT.editBroadcast();
      setTimeField('time','09:00'); ACT.saveBroadcast(); return {time:S().broadcast.time,open:!!SHEET}; });
    ck('剛過 10 分鐘的集合（還在 30 分鐘寬限內）照樣能存',r.time==='09:00'&&!r.open,r); await ctx.close(); }

  { const {ctx,p}=await mk('2026-09-25T09:00');   /* 越南 08:00；上一則 07:00 集合已過 60 分鐘，但還算有效 */
    const r=await p.evaluate(()=>{ S().broadcast={date:'2026-09-25',time:'07:00',label:'大廳集合',location:'飯店大廳',tip:'',idle:false,updatedAt:'06:00',_ts:1}; P.leader=true;
      const act=bcActive(); ACT.editBroadcast(); el('sheetRoot').querySelector('[name="location"]').value='飯店門口'; ACT.saveBroadcast();
      return {act,loc:S().broadcast.location,open:!!SHEET,q:Store.q.length}; });
    ck('上一則過了 60 分鐘但還有效：只改地點也能存（不會被「時間已過」擋）',r.act&&r.loc==='飯店門口'&&!r.open&&r.q===1,r); await ctx.close(); }
  for(const [w,fs] of [[320,'lg'],[320,'xl'],[375,'xl'],[390,'xl']]){ const {ctx,p}=await mk('2026-09-23T20:00',null,w);
    const r=await p.evaluate(fs=>{ P.fs=fs; document.documentElement.setAttribute('data-fs',fs); S().settings.zones={manual:{flight:'now'},mode:'card',prepUntil:'start'};
      render(); if(cardOpen('flight')) cardToggle('flight'); render();
      const c=[...document.querySelectorAll('.ccard')].find(x=>x.querySelector('[data-id="flight"]')); const sm=c.querySelector('.chead .sm');
      const segs=[...sm.querySelectorAll('.nw')].map(e=>({t:e.textContent,cut:e.scrollWidth-e.clientWidth,r:Math.round(e.getBoundingClientRect().right)}));
      return {txt:sm.textContent,cut:sm.scrollWidth-sm.clientWidth,segs,vw:innerWidth}; },fs);
    ck(w+'/'+fs+'：航班摘要兩家都看得到、沒有被「…」切掉',/華航 08:20/.test(r.txt)&&/長榮 09:00/.test(r.txt)&&r.cut<=3&&r.segs.every(g=>g.cut<=1&&g.r<=r.vw),r); await ctx.close(); }   /* 行尾的「・」可能凸出 2px，但 .sm 是 overflow:visible，不會被切 */

  console.log('[斷言 6] 時間模擬：只在這支手機、不存檔');
  { const {ctx,p,errs}=await mk('2026-09-21T14:00');
    await p.evaluate(()=>{ localStorage.setItem('sapa-data',JSON.stringify({docs:Store.s,at:1,q:[]})); });
    const before=await p.evaluate(()=>localStorage.getItem('sapa-data'));
    await p.evaluate(()=>{ P.leader=true; P.tab='tools'; P.tool='menu'; render(); });
    ck('管理專區有「時間模擬」按鈕',await p.evaluate(()=>!!document.querySelector('[data-act="simPick"]')));
    await p.evaluate(()=>ACT.simPick());
    ck('模擬表單有 9 個以上的預設時間點',await p.evaluate(()=>document.querySelectorAll('#sheetRoot [data-act="simSet"][data-val]').length>=9));
    await Promise.all([p.waitForNavigation(),p.evaluate(()=>{ document.querySelector('#sheetRoot [data-act="simSet"][data-val$="T09:00"]').click(); })]);
    await p.waitForTimeout(300);
    const s1=await p.evaluate(()=>({di:dayInfo(),bar:!document.getElementById('simBar').hidden,txt:document.getElementById('simBar').textContent,url:location.search}));
    ck('進入模擬後 App 以為是第 2 天',s1.di.status==='on'&&s1.di.idx===2,s1);
    ck('頂端有紫色模擬提示列',s1.bar&&/時間模擬/.test(s1.txt)&&/不會存檔/.test(s1.txt),s1.txt);
    const w=await p.evaluate(()=>{ const q0=Store.q.length; S().broadcast.location='模擬中亂改'; Store.save('broadcast'); Store.savePath('rollcall','present/m01',true); return {q0,q1:Store.q.length,toast:document.getElementById('toast').textContent}; });
    ck('模擬中存檔不進送出佇列',w.q1===w.q0,w);
    ck('有提示「不會存檔」',/不會存檔/.test(w.toast),w.toast);
    ck('手機裡的資料沒被動到',await p.evaluate(b=>localStorage.getItem('sapa-data')===b,before));
    await p.reload(); await p.waitForTimeout(300);
    ck('重新整理仍在模擬（同一個分頁）',await p.evaluate(()=>SIM_OFF!==0&&dayInfo().idx===2));
    await Promise.all([p.waitForNavigation(),p.evaluate(()=>ACT.simEnd())]); await p.waitForTimeout(300);
    const s2=await p.evaluate(()=>({off:SIM_OFF,di:dayInfo().status,bar:document.getElementById('simBar').hidden,ss:sessionStorage.getItem('sapa-sim'),loc:S().broadcast.location}));
    ck('結束後回到真實時間（出發前）、提示列消失',s2.off===0&&s2.di==='before'&&s2.bar&&s2.ss===null,s2);
    ck('模擬時亂改的廣播沒有留下來',s2.loc!=='模擬中亂改',s2.loc);
    ck('無 JS 錯誤',!errs.length,errs); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-21T14:00');
    await p.evaluate(()=>{ P.leader=true; ACT.simPick(); });
    await Promise.all([p.waitForNavigation(),p.evaluate(()=>{ document.querySelector('#sheetRoot [data-act="simSet"][data-val$="T05:45"]').click(); })]); await p.waitForTimeout(300);
    const r=await p.evaluate(()=>({t:tzParts(TW).hm,ss:sessionStorage.getItem('sapa-sim')}));
    ck('預設「05:45 集合遲到」真的是 05:45（分鐘沒被吃掉）',r.t==='05:45'&&r.ss.endsWith('05:45'),r);
    const w=await p.evaluate(()=>{ Store.q=[{key:'broadcast',path:'',val:{},ts:1}]; let sent=0; const o=Store.flush; Store.flushing=false; Store.flush(); return {q:Store.q.length}; });
    ck('模擬中佇列不送出（結束後才送）',w.q===1,w);
    const rp=await p.evaluate(()=>{ localStorage.setItem('sapa-prev-members',JSON.stringify({at:Date.now(),n:9,doc:{items:[]}})); const ok=Store.restorePrev('members'); return {ok,kept:!!localStorage.getItem('sapa-prev-members')}; });
    ck('模擬中「還原上一版」不動備份',rp.ok===false&&rp.kept,rp);
    await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-21T14:00',FILE+'?sim=2026-09-26T10:00'); await p.goto(FILE+'?sim=%E4%BA%82'); await p.waitForTimeout(200); await p.goto(FILE); await p.waitForTimeout(200);
    ck('壞掉的 ?sim= 會清掉之前的模擬',await p.evaluate(()=>SIM_OFF===0&&sessionStorage.getItem('sapa-sim')===null)); await ctx.close(); }
  for(const bad of ['亂碼','2026-02-30T10:00','2026-09-25T25:00']){ const {ctx,p,errs}=await mk('2026-09-21T14:00',FILE+'?sim='+encodeURIComponent(bad));
    ck('?sim='+bad+' 不會進入模擬也不會出錯',await p.evaluate(()=>SIM_OFF===0&&document.getElementById('simBar').hidden)&&!errs.length,errs); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-21T14:00',FILE+'?sim=2026-09-29T10:00');
    ck('網址帶 ?sim= 也能直接進入模擬（回國後）',await p.evaluate(()=>dayInfo().status==='after'&&!document.getElementById('simBar').hidden)); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-21T14:00');
    await p.evaluate(()=>{ P.leader=true; ACT.settings&&ACT.settings(); });
    const t=await p.evaluate(()=>document.getElementById('sheetRoot').textContent);
    ck('團務設定的「手動指定第幾天」有全團警語',/全團每一支手機/.test(t),t.slice(0,80)); await ctx.close(); }
  { const {ctx,p}=await mk('2026-09-23T20:00');
    await p.evaluate(()=>{ P.leader=true; ACT.editBroadcast(); });
    ck('廣播表單說明出發日幾點前填台灣時間',await p.evaluate(()=>/09:00 以前填台灣時間/.test(document.getElementById('sheetRoot').textContent))); await ctx.close(); }
  await b2.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

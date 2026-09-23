/* 高亮提醒功能自我驗收 */
const {chromium,FILE,at}=require('./_lib');
const F=FILE;
let fails=0;
function ck(name,cond,extra){ if(!cond){fails++;console.log('  ✗',name,extra===undefined?'':JSON.stringify(extra));} else console.log('  ✓',name); }
(async()=>{
  const b=await chromium.launch();

  // ---- 1. 邏輯：管理者開關、團員收合熄燈、重新開啟再亮 ----
  console.log('[1] 狀態機');
  let ctx=await b.newContext({viewport:{width:390,height:900}});
  let p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F); await p.waitForTimeout(400);
  let r=await p.evaluate(()=>{
    const out={};
    P.leader=true; P.cards={}; S().settings.cards={}; S().settings.dayOverride=2;
    out.defaultOff=!cardHL('prep');                    // 預設不亮
    cardSetHL('prep');
    out.onAfterLeader=cardHL('prep');                  // 管理者開 → 亮
    out.otherUntouched=!cardHL('flight');              // 不影響別張
    const hts1=cardLead('prep').hts;
    out.expandUnchanged=cardLead('prep').o===1;        // 展開預設沒被動到
    // 團員收合 → 熄燈
    P.leader=false; render();
    while(cardOpen('prep',1)) cardToggle('prep',1);
    out.offAfterCollapse=!cardHL('prep');
    out.stillLeaderOn=!!cardLead('prep').hl;           // 管理者那邊仍是開的
    // v3.21：團員自己再展開 → 恢復發光（長輩誤觸收起，打開還要看得到提醒）
    cardToggle('prep',1);
    out.relitAfterReopen=cardHL('prep');
    // 再收起來 → 又熄
    cardToggle('prep',1);
    out.offAgainAfterCollapse=!cardHL('prep');
    cardToggle('prep',1);
    // 管理者關掉再開 → 換新 hts → 重新亮
    P.leader=true; cardSetHL('prep'); cardSetHL('prep');
    out.relit=cardHL('prep');
    out.newHts=cardLead('prep').hts!==hts1;
    // 管理者關掉 → 熄
    cardSetHL('prep');
    out.offAfterLeaderOff=!cardHL('prep');
    // 多張同時亮（不限制張數）
    cardSetHL('prep'); cardSetHL('flight'); cardSetHL('hotel');
    out.multi=[cardHL('prep'),cardHL('flight'),cardHL('hotel')].filter(Boolean).length;
    // 高亮不改變展開狀態
    out.hotelStillCollapsed=cardLead('hotel').o===0;
    return out;
  });
  Object.entries(r).forEach(([k,v])=>{
    if(k==='multi') ck('三張可同時亮',v===3,v);
    else ck(k,v===true,v);
  });
  ck('無 JS 錯誤',errs.length===0,errs.slice(0,2));

  // ---- 2. 畫面：DOM 結構、光暈、標籤 ----
  console.log('[2] 畫面');
  const dom=await p.evaluate(()=>{
    P.leader=false; P.cards={};
    S().settings.dayOverride=0; S().settings.startDate='2026-09-24';
    S().settings.cards={prep:{o:1,ts:1,hl:1,hts:1},flight:{o:1,ts:1,hl:1,hts:1},hotel:{o:0,ts:1,hl:1,hts:1},morning:{o:1,ts:1,hl:1,hts:1}};
    render();
    const w=document.querySelectorAll('.hlw'), t=document.querySelectorAll('.hl-tag');
    const one=w[0], card=one&&one.querySelector(':scope > .ccard');
    const cs=card?getComputedStyle(card):null;
    const bef=one?getComputedStyle(one,'::before'):null;
    const tag=t[0]?getComputedStyle(t[0]):null;
    return {wrappers:w.length, tags:t.length,
      tagText:t[0]?t[0].textContent.trim():'',
      cardIsDirectChild:!!card,
      bg:cs?cs.backgroundColor:'', border:cs?cs.borderColor:'',
      anim:bef?bef.animationName:'', glow:bef?(bef.boxShadow||'').length>10:false,
      tagTop:t[0]?Math.round(t[0].getBoundingClientRect().top):0,
      cardTop:card?Math.round(card.getBoundingClientRect().top):0};
  });
  ck('四張都有外框層',dom.wrappers===4,dom.wrappers);
  ck('四張都有提醒標籤',dom.tags===4,dom.tags);
  ck('標籤文字＝提醒 ON',dom.tagText==='提醒 ON',dom.tagText);
  ck('卡片是外框層的直接子層',dom.cardIsDirectChild);
  ck('底色被換成淡金（壓過分區樣式）',dom.bg==='rgb(255, 251, 236)',dom.bg);
  ck('邊框變金色',dom.border.indexOf('240, 198, 74')>=0,dom.border);
  ck('呼吸動畫有掛上',dom.anim==='hlbreath',dom.anim);
  ck('光暈 box-shadow 存在',dom.glow);
  ck('標籤在卡片上緣之上',dom.tagTop<dom.cardTop,{tag:dom.tagTop,card:dom.cardTop});

  // ---- 3. 標籤不會被上面的東西壓到 / 不出血 ----
  console.log('[3] 版面（三種寬度 × 三種字級 × 深淺色）');
  for(const w of [320,375,390]) for(const fs of ['md','lg','xl']) for(const dark of [false,true]){
    const c2=await b.newContext({viewport:{width:w,height:900},colorScheme:dark?'dark':'light'});
    const p2=await c2.newPage(); const e2=[]; p2.on('pageerror',e=>e2.push(String(e)));
    await p2.goto(F); await p2.waitForTimeout(350);
    const m=await p2.evaluate(f=>{
      P.fs=f; P.leader=false; P.cards={}; P.tab='home';
      S().settings.dayOverride=0; S().settings.startDate='2026-09-24';
      S().settings.cards={prep:{o:1,ts:1,hl:1,hts:1},flight:{o:1,ts:1,hl:1,hts:1},hotel:{o:0,ts:1,hl:1,hts:1},morning:{o:1,ts:1,hl:1,hts:1}};
      render();
      if(document.querySelectorAll('.hl-tag').length!==4) return {ov:false,clash:0,cut:0,bad:99};
      const out={ov:document.documentElement.scrollWidth>document.documentElement.clientWidth,clash:0,cut:0,bad:0};
      document.querySelectorAll('.hl-tag').forEach(t=>{
        const tr=t.getBoundingClientRect();
        if(tr.left<2||tr.right>document.documentElement.clientWidth-2) out.cut++;
        // 標籤不可壓到上一個兄弟元素（區段標題或前一張卡）
        const wrap=t.parentElement, prev=wrap.previousElementSibling;
        if(prev){ const pr=prev.getBoundingClientRect(); if(tr.top<pr.bottom-1) out.clash++; }
        // 標籤不可蓋住卡片標題
        const ttl=wrap.querySelector('.chead .ttl');
        if(ttl){ const b2=ttl.getBoundingClientRect(); if(tr.bottom>b2.top+1) out.bad++; }
      });
      return out;
    },fs);
    const tag=`${w}/${fs}/${dark?'dark':'light'}`;
    if(m.ov||m.cut||m.clash||m.bad){ fails++; console.log('  ✗',tag,JSON.stringify(m)); }
    if(e2.length){ fails++; console.log('  ✗ JS ERR',tag,e2[0]); }
    await c2.close();
  }
  console.log('  ✓ 版面檢查完成');

  // ---- 4. 截圖 ----
  for(const dark of [false,true]){
    const c3=await b.newContext({viewport:{width:390,height:900},colorScheme:dark?'dark':'light',deviceScaleFactor:2});
    const p3=await c3.newPage(); await p3.goto(F); await p3.waitForTimeout(350);
    await p3.evaluate(L=>{
      P.leader=L; P.cards={}; P.tab='home'; P.tipDismissed=true;
      S().settings.dayOverride=0; S().settings.startDate='2026-09-24';
      S().settings.cards={prep:{o:1,ts:1,hl:1,hts:1},flight:{o:1,ts:1,hl:1,hts:1},hotel:{o:0,ts:1,hl:1,hts:1},morning:{o:1,ts:1,hl:1,hts:1}};
      render();
      if(document.querySelectorAll('.hl-tag').length!==4) return {ov:false,clash:0,cut:0,bad:99};
    },dark);           // 深色那張順便用管理者視角看兩顆開關
    await p3.waitForTimeout(1300);
    await p3.screenshot({path:at(`shots/hl-${dark?'leader-dark':'member-light'}.png`),fullPage:true});
    await c3.close();
  }
  // ---- 5. v3.21：實際點畫面操作（管理者開關 → 團員點標題收起／打開） ----
  console.log('[5] 實際點擊：收起不亮、打開再亮、預設收起的卡照樣亮、今日行程不可收合');
  { const c5=await b.newContext({viewport:{width:375,height:800},timezoneId:'Asia/Taipei'}); const p5=await c5.newPage(); const e5=[]; p5.on('pageerror',e=>e5.push(String(e)));
    await p5.clock.install({time:new Date('2026-09-23T20:00:00+08:00')}); await p5.route(/gstatic/,r=>r.abort()); await p5.goto(F); await p5.waitForTimeout(300);
    const glow=()=>p5.evaluate(()=>[...document.querySelectorAll('.hlw')].map(w=>{ const h=w.querySelector('[data-id]'); return h?h.getAttribute('data-id'):'today'; }).sort().join(','));
    /* 管理者從「首頁卡片位置」表單逐張打開高亮 */
    await p5.evaluate(()=>{ S().settings.cards={}; S().settings.zones={}; P.cards={}; P.leader=true; P.tab='home'; render(); sheetCardZones(); });
    const ids=await p5.evaluate(()=>[...document.querySelectorAll('#sheetRoot [data-act="zCardHl"]')].map(b=>b.getAttribute('data-id')));
    for(const id of ids) await p5.click('#sheetRoot [data-act="zCardHl"][data-id="'+id+'"]');
    const onAll=await p5.evaluate(()=>['today','prep','flight','hotel','morning'].filter(id=>cardLead(id).hl));
    await p5.evaluate(()=>{ closeSheet(); P.leader=false; render(); });
    ck('表單裡每張卡都有高亮開關、按了都會打開',ids.length===5&&onAll.length===5,{ids,onAll});
    ck('打開後五張都發光（住宿卡預設收起也照亮）',await glow()==='flight,hotel,morning,prep,today',await glow());
    await p5.click('[data-act="cardFold"][data-id="flight"]');   /* 團員收起航班卡 */
    ck('團員收起航班卡：只有它不亮',await glow()==='hotel,morning,prep,today',await glow());
    await p5.click('[data-act="cardFold"][data-id="flight"]');   /* 再打開 */
    ck('再打開：航班卡恢復發光',await glow()==='flight,hotel,morning,prep,today',await glow());
    await p5.click('[data-act="cardFold"][data-id="hotel"]'); await p5.click('[data-act="cardFold"][data-id="hotel"]');   /* 住宿卡打開再收起 */
    ck('預設收起的住宿卡：打開後收起才熄',!/hotel/.test(await glow()),await glow());
    const persisted=await p5.evaluate(()=>JSON.parse(localStorage.getItem('sapa-prefs')).cards.hotel.hseen!==undefined);
    await p5.reload(); await p5.waitForTimeout(300);
    await p5.evaluate(()=>{ S().settings.cards={today:{hl:1,hts:1},prep:{hl:1,hts:1},flight:{hl:1,hts:1},hotel:{hl:1,hts:1},morning:{hl:1,hts:1}}; render(); });
    ck('收起的狀態存在這支手機，重新整理後仍記得',persisted);
    /* 小麥指定：每一張可收合的卡，收起再展開後都要繼續發光 */
    const each=await p5.evaluate(()=>{ S().settings.cards={today:{hl:1,hts:1},prep:{hl:1,hts:1},flight:{hl:1,hts:1},hotel:{hl:1,hts:1},morning:{hl:1,hts:1}}; P.cards={}; render(); return true; });
    for(const id of ['prep','flight','hotel','morning']){
      const r=[]; for(let k=0;k<4;k++){ await p5.click('[data-act="cardFold"][data-id="'+id+'"]');
        r.push(await p5.evaluate(i=>({open:cardOpen(i),hl:cardHL(i),wrap:!!document.querySelector('[data-act="cardFold"][data-id="'+i+'"]').closest('.hlw')}),id)); }
      /* 連續點 4 次標題：每次展開的狀態都必須在發光 */
      ck(id+'：每次重新展開都繼續發光（點 4 次）',r.filter(x=>x.open).length===2&&r.filter(x=>x.open).every(x=>x.hl&&x.wrap),r);
    }
    ck('今日行程沒有收合鈕，永遠照開關發光',await p5.evaluate(()=>!document.querySelector('[data-act="cardFold"][data-id="today"]')&&cardHL('today')));
    /* 管理者關掉再打開 → 收起過的人也重新亮 */
    await p5.evaluate(()=>{ P.cards={hotel:{o:0,ts:cardLead('hotel').ts,hseen:1}}; render(); });
    const before=await glow();
    await p5.evaluate(()=>{ P.leader=true; cardSetHL('hotel'); cardSetHL('hotel'); P.leader=false; render(); });
    ck('管理者關掉再打開：收起過的人重新發光',!/hotel/.test(before)&&/hotel/.test(await glow()),{before,after:await glow()});
    ck('無 JS 錯誤',!e5.length,e5.slice(0,2)); await c5.close(); }

  // ---- 6. v3.21：航班卡去程看過 ≠ 回程看過 ----
  console.log('[6] 航班卡：去程收起過，第 4 天回程卡重新發光');
  { const c6=await b.newContext({viewport:{width:375,height:800},timezoneId:'Asia/Taipei'}); const p6=await c6.newPage(); const e6=[]; p6.on('pageerror',e=>e6.push(String(e)));
    await p6.clock.install({time:new Date('2026-09-24T12:00:00+08:00')}); await p6.route(/gstatic/,r=>r.abort()); await p6.goto(F); await p6.waitForTimeout(300);
    const r6a=await p6.evaluate(()=>{ S().settings.cards={flight:{hl:1,hts:1}}; S().settings.zones={manual:{flight:'now'},mode:'card',prepUntil:'start'}; P.cards={}; P.leader=false; P.tab='home'; render();
      const a=cardHL('flight'); cardToggle('flight'); const b2=cardHL('flight'); return {a,b:b2,seen:P.cards.flight.hseen}; });
    ck('第 1 天去程卡：亮 → 收起後不亮',r6a.a&&!r6a.b,r6a);
    await p6.clock.fastForward(72*3600*1000); await p6.evaluate(()=>{ render(); });   /* 第 4 天 12:00 */
    const r6b=await p6.evaluate(()=>{ const c=[...document.querySelectorAll('.ccard')].find(x=>x.querySelector('[data-id="flight"]'));
      return {phase:flightPhase(),hl:cardHL('flight'),inWrap:!!(c&&c.closest('.hlw')),title:c?c.querySelector('.chead .ttl').textContent:''}; });
    ck('第 4 天回程卡：就算去程收起過也重新發光',r6b.phase==='back'&&r6b.hl&&r6b.inWrap&&/回程/.test(r6b.title),r6b);
    const r6c=await p6.evaluate(()=>{ if(cardOpen('flight')) cardToggle('flight'); else { cardToggle('flight'); cardToggle('flight'); } return {hl:cardHL('flight'),seen:P.cards.flight.hseen}; });
    ck('回程卡收起：不亮（記的是回程那把鑰匙）',!r6c.hl&&/\|back$/.test(String(r6c.seen)),r6c);
    ck('無 JS 錯誤',!e6.length,e6.slice(0,2)); await c6.close(); }

  await ctx.close(); await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

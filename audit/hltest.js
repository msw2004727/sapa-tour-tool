/* 高亮提醒功能自我驗收 */
const {chromium,FILE,at}=require('./_lib');
const F=FILE;
let fails=0;
function ck(name,cond,extra){ if(!cond){fails++;console.log('  ✗',name,extra===undefined?'':JSON.stringify(extra));} else console.log('  ✓',name); }
(async()=>{
  const b=await chromium.launch();

  // ---- 1. 邏輯：領隊開關、團員收合熄燈、重新開啟再亮 ----
  console.log('[1] 狀態機');
  let ctx=await b.newContext({viewport:{width:390,height:900}});
  let p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F); await p.waitForTimeout(400);
  let r=await p.evaluate(()=>{
    const out={};
    P.leader=true; P.cards={}; S().settings.cards={}; S().settings.dayOverride=2;
    out.defaultOff=!cardHL('prep');                    // 預設不亮
    cardSetHL('prep');
    out.onAfterLeader=cardHL('prep');                  // 領隊開 → 亮
    out.otherUntouched=!cardHL('flight');              // 不影響別張
    const hts1=cardLead('prep').hts;
    out.expandUnchanged=cardLead('prep').o===1;        // 展開預設沒被動到
    // 團員收合 → 熄燈
    P.leader=false; render();
    while(cardOpen('prep',1)) cardToggle('prep',1);
    out.offAfterCollapse=!cardHL('prep');
    out.stillLeaderOn=!!cardLead('prep').hl;           // 領隊那邊仍是開的
    // 團員自己再展開 → 這一輪已 dismiss，不再亮
    cardToggle('prep',1);
    out.stayOffAfterReopen=!cardHL('prep');
    // 領隊關掉再開 → 換新 hts → 重新亮
    P.leader=true; cardSetHL('prep'); cardSetHL('prep');
    out.relit=cardHL('prep');
    out.newHts=cardLead('prep').hts!==hts1;
    // 領隊關掉 → 熄
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
    },dark);           // 深色那張順便用領隊視角看兩顆開關
    await p3.waitForTimeout(1300);
    await p3.screenshot({path:at(`shots/hl-${dark?'leader-dark':'member-light'}.png`),fullPage:true});
    await c3.close();
  }
  await ctx.close(); await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

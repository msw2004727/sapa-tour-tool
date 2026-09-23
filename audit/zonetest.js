/* 首頁卡片分區：預設規則、逐卡自動／釘死、跨區 ↑↓、舊資料相容、設定面板 */
const {chromium,FILE,at}=require('./_lib');
const F=FILE;
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x));} else console.log('  ✓',n); };
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:760}});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F); await p.waitForTimeout(400);

  console.log('[1] 預設規則（全部自動）');
  const table=await p.evaluate(()=>{
    const st=S().settings; st.zones={}; st.days=5;
    const ids=['today','prep','flight','morning','hotel'], rows={};
    const snap=l=>{ const di=dayInfo(); rows[l]={}; ids.forEach(i=>rows[l][i]=cardZone(i,di)); };
    st.startDate='2026-09-24'; st.dayOverride=0; snap('出發前');
    for(let d=1;d<=5;d++){ st.dayOverride=d; snap('第'+d+'天'); }
    st.dayOverride=0; st.startDate='2026-08-01'; snap('結束後');
    st.startDate='2026-09-24'; return rows;
  });
  console.table(table);
  const exp={
    '出發前':{today:'now',prep:'later',flight:'later',morning:'ref',hotel:'ref'},
    '第1天':{today:'now',prep:'hide',flight:'later',morning:'later',hotel:'ref'},
    '第2天':{today:'now',prep:'hide',flight:'hide',morning:'later',hotel:'ref'},   /* v3.20：沒有要搭飛機的日子航班卡收起 */
    '第3天':{today:'now',prep:'hide',flight:'hide',morning:'later',hotel:'ref'},
    '第4天':{today:'now',prep:'hide',flight:'later',morning:'later',hotel:'ref'},  /* v3.20：搭夜臥火車回河內那天起顯示回程 */
    '第5天':{today:'now',prep:'hide',flight:'later',morning:'hide',hotel:'ref'},   /* v3.19：最後一天沒有「明早」 */
    '結束後':{today:'hide',prep:'hide',flight:'now',morning:'hide',hotel:'ref'},
  };
  Object.keys(exp).forEach(k=>ck('預設 '+k,JSON.stringify(table[k])===JSON.stringify(exp[k]),{got:table[k],want:exp[k]}));

  console.log('[2] 自動條件（只影響還在自動的卡片）');
  const r2=await p.evaluate(()=>{
    const st=S().settings, out={};
    const at=d=>{ st.dayOverride=d; const di=dayInfo();
      return {prep:cardZone('prep',di),flight:cardZone('flight',di),morning:cardZone('morning',di)}; };
    st.startDate='2026-09-24';
    st.zones={prepUntil:'end'};      out.prepEnd_d3=at(3).prep;
    st.zones={prepUntil:'off'};      out.prepOff_before=at(0).prep;
    st.zones={flightSoon:'ends'};    out.ends_before=at(0).flight; out.ends_d1=at(1).flight; out.ends_d3=at(3).flight; out.ends_d4=at(4).flight;
    st.zones={flightSoon:'always'};  out.always_d3=at(3).flight; out.always_d4=at(4).flight;
    st.zones={flightSoon:'never'};   out.never_d1=at(1).flight;
    st.zones={morningSoon:'always'}; out.mAlways_before=at(0).morning;
    st.zones={morningSoon:'never'};  out.mNever_d2=at(2).morning;
    st.zones={}; st.dayOverride=0; return out;
  });
  ck('prepUntil=end → 第3天仍在稍後',r2.prepEnd_d3==='later',r2.prepEnd_d3);
  ck('prepUntil=off → 出發前也不顯示',r2.prepOff_before==='hide',r2.prepOff_before);
  ck('flightSoon=ends → 出發前退到隨時查',r2.ends_before==='ref',r2.ends_before);
  ck('flightSoon=ends → 第1天在稍後',r2.ends_d1==='later',r2.ends_d1);
  ck('flightSoon=ends → 第3天收起（沒有要搭飛機）',r2.ends_d3==='hide',r2.ends_d3);
  ck('flightSoon=ends → 第4天回程在稍後',r2.ends_d4==='later',r2.ends_d4);
  ck('flightSoon=always → 第3天仍收起',r2.always_d3==='hide',r2.always_d3);
  ck('flightSoon=always → 第4天在稍後',r2.always_d4==='later',r2.always_d4);
  ck('flightSoon=never → 第1天在隨時查',r2.never_d1==='ref',r2.never_d1);
  ck('morningSoon=always → 出發前就在稍後',r2.mAlways_before==='later',r2.mAlways_before);
  ck('morningSoon=never → 第2天在隨時查',r2.mNever_d2==='ref',r2.mNever_d2);

  console.log('[3] 逐卡：釘死一張，其他仍然自動');
  const r3=await p.evaluate(()=>{
    const st=S().settings; st.startDate='2026-09-24'; st.zones={};
    setPin('flight','now');                       /* 只釘航班 */
    const out={};
    [[0,'出發前'],[2,'第2天'],[5,'第5天']].forEach(([d,l])=>{ st.dayOverride=d; const di=dayInfo();
      out[l]={flight:cardZone('flight',di),prep:cardZone('prep',di),morning:cardZone('morning',di)}; });
    st.dayOverride=0; st.startDate='2026-08-01'; const di2=dayInfo();
    out['結束後']={flight:cardZone('flight',di2),prep:cardZone('prep',di2)};
    out.mode=(st.zones||{}).mode;
    st.startDate='2026-09-24'; st.zones={}; return out;
  });
  ck('釘死的航班在有飛機的日子都在現在；第 2 天照樣收起',['出發前','第5天'].every(k=>r3[k].flight==='now')&&r3['第2天'].flight==='hide',r3);
  ck('沒釘的出發前準備照常自動（出發前 later、第2天 hide）',r3['出發前'].prep==='later'&&r3['第2天'].prep==='hide',r3);
  ck('沒釘的明早時程照常自動（出發前 ref、第2天 later）',r3['出發前'].morning==='ref'&&r3['第2天'].morning==='later',r3);
  ck('釘死在旅程結束後仍然有效',r3['結束後'].flight==='now',r3['結束後']);
  ck('第一次釘卡會把設定升級成逐卡模式',r3.mode==='card',r3.mode);

  console.log('[4] 舊資料相容');
  const r4=await p.evaluate(()=>{
    /* v3.20：第 2、3 天航班卡本來就收起，改用第 4 天（有回程航班）才看得出釘選有沒有生效 */
    const st=S().settings; st.startDate='2026-09-24'; st.dayOverride=4; const out={};
    /* 舊的全域自動：manual 裡的殘值不算數 */
    st.zones={mode:'auto',manual:{flight:'now',prep:'now'}};
    out.legacyAuto={flight:cardZone('flight',dayInfo()),prep:cardZone('prep',dayInfo())};
    /* 舊的全域手動：沿用舊的預設值 */
    st.zones={mode:'manual',manual:{flight:'now'}};
    out.legacyManual={flight:cardZone('flight',dayInfo()),hotel:cardZone('hotel',dayInfo()),prep:cardZone('prep',dayInfo())};
    /* 從舊手動改一張卡 → 其他卡的位置不可以跟著跳 */
    const before={hotel:cardZone('hotel',dayInfo()),morning:cardZone('morning',dayInfo())};
    setPin('flight','ref');
    out.stable=(cardZone('hotel',dayInfo())===before.hotel)&&(cardZone('morning',dayInfo())===before.morning);
    st.zones={}; st.dayOverride=0; return out;
  });
  ck('舊的全域自動：manual 殘值被忽略（第 4 天航班走自動＝稍後，不是 now）',r4.legacyAuto.flight==='later'&&r4.legacyAuto.prep==='hide',r4.legacyAuto);
  ck('舊的全域手動：設過的照設定',r4.legacyManual.flight==='now',r4.legacyManual);
  /* v3.19：出發前準備「顯示到出發」優先於位置設定，所以旅途中（這裡是第 4 天）一律收起 */
  ck('舊的全域手動：沒設過的用舊預設（住宿=隨時查）；出發前準備旅途中收起',
     r4.legacyManual.hotel==='ref'&&r4.legacyManual.prep==='hide',r4.legacyManual);
  ck('從舊手動改一張卡，其他卡不會跟著跳',r4.stable,r4.stable);

  console.log('[5] 跨區 ↑↓');
  const r5=await p.evaluate(()=>{
    const st=S().settings; st.zones={}; st.dayOverride=0; st.startDate='2026-09-24';
    P.leader=true; P.tab='home'; render();
    const di=()=>dayInfo();
    const out={before:cardZone('flight',di())};
    /* 稍後區：出發前準備 → 航班。先把航班移到該區第一張，再按一次 ↑ 就該跨進「現在」 */
    zoneMove('flight',-1); closeSheet();
    out.mid={zone:cardZone('flight',di()),pin:cardPin('flight')};
    zoneMove('flight',-1); closeSheet();
    out.crossed={zone:cardZone('flight',di()),pin:cardPin('flight')};
    /* 現在區的排序：航班應該排在今日行程之前（因為是往上跨進來放在最後…再往上換一次） */
    const nowList=()=>zoneOrder().filter(x=>cardZone(x,di())==='now');
    out.nowList=nowList();
    zoneMove('flight',-1); closeSheet();
    out.nowListAfterUp=nowList();
    /* 再往下兩次應該回到稍後 */
    zoneMove('flight',1); closeSheet();
    zoneMove('flight',1); closeSheet();
    out.backDown={zone:cardZone('flight',di()),pin:cardPin('flight')};
    /* 隨時查最後一張不能再往下（不會掉進「不顯示」） */
    const refList=zoneOrder().filter(x=>cardZone(x,di())==='ref');
    const last=refList[refList.length-1];
    const zBefore=cardZone(last,di());
    zoneMove(last,1); closeSheet();
    out.noFallIntoHide={id:last,same:cardZone(last,di())===zBefore};
    st.zones={}; P.leader=false; render();
    return out;
  });
  ck('原本航班在稍後',r5.before==='later',r5.before);
  ck('同區內往上：還在稍後、仍是自動',r5.mid.zone==='later'&&r5.mid.pin==='auto',r5.mid);
  ck('再往上一次：跨進現在',r5.crossed.zone==='now',r5.crossed);
  ck('跨區之後自動變成釘死',r5.crossed.pin==='now',r5.crossed);
  ck('跨進來先排在今日行程之後',r5.nowList.join('/')==='today/flight',r5.nowList);
  ck('再按 ↑ 可以排到今日行程之前',r5.nowListAfterUp.join('/')==='flight/today',r5.nowListAfterUp);
  ck('往下兩次回到稍後並釘在稍後',r5.backDown.zone==='later'&&r5.backDown.pin==='later',r5.backDown);
  ck('隨時查最後一張不會被 ↓ 推進「不顯示」',r5.noFallIntoHide.same,r5.noFallIntoHide);

  console.log('[6] 首頁真的照設定畫');
  const r6=await p.evaluate(()=>{
    const st=S().settings; st.zones={}; st.dayOverride=4; st.startDate='2026-09-24';   /* 第 4 天：有回程航班卡 */
    setPin('flight','now'); setPin('hotel','now'); setPin('morning','hide');
    P.leader=false; P.tab='home'; P.cards={}; render();
    const z=k=>{ const e=document.querySelector('.zsec.g-'+k); return e?[...e.querySelectorAll('h2,.chead .ttl')].map(x=>x.textContent.trim()):null; };
    const out={now:z('now'),later:z('later'),ref:z('ref')};
    st.zones={}; render();
    out.reset=z('now');
    return out;
  });
  ck('三張卡一起出現在現在區',r6.now&&r6.now.length===3,r6.now);
  ck('被設成不顯示的明早時程不見了',!(r6.later||[]).concat(r6.ref||[]).some(t=>t.indexOf('明早')>=0),{later:r6.later,ref:r6.ref});
  ck('全部恢復自動後現在區只剩今日行程',r6.reset&&r6.reset.length===1,r6.reset);

  console.log('[7] 設定面板');
  const r7=await p.evaluate(()=>{
    /* 用「出發前」：這時五張卡都看得到，沒有卡片落在「不顯示」 */
    const st=S().settings; st.zones={}; st.dayOverride=0; st.startDate='2026-09-24';
    P.leader=true; render(); sheetCardZones();
    const q=s=>document.querySelectorAll('.sheet '+s).length;
    const a={cond:q('select[data-k="prepUntil"],select[data-k="flightSoon"],select[data-k="morningSoon"]'),
             cards:q('.zb-c'), zsel:q('select[data-k^="z."]'), lock:q('.zb-lock'),
             def:q('[data-act="zCardDef"]'), hl:q('[data-act="zCardHl"]'), mode:q('select[data-k="mode"]')};
    /* 釘死一張 → 它的條件下拉要消失 */
    const s1=document.querySelector('.sheet select[data-k="z.flight"]');
    s1.value='ref'; s1.dispatchEvent(new Event('change',{bubbles:true}));
    const bn={cond:q('select[data-k="prepUntil"],select[data-k="flightSoon"],select[data-k="morningSoon"]'),
              pin:cardPin('flight')};
    /* 改回自動 → 條件下拉回來 */
    const s2=document.querySelector('.sheet select[data-k="z.flight"]');
    s2.value='auto'; s2.dispatchEvent(new Event('change',{bubbles:true}));
    const back={cond:q('select[data-k="flightSoon"]'),pin:cardPin('flight')};
    document.querySelector('.sheet [data-act="zoneReset"]').click();
    const rst={zones:JSON.stringify(S().settings.zones)};
    closeSheet(); return {a,bn,back,rst};
  });
  ck('沒有全域模式下拉了',r7.a.mode===0,r7.a.mode);
  ck('三個自動條件都在',r7.a.cond===3,r7.a.cond);
  ck('五張卡都列出來',r7.a.cards===5,r7.a.cards);
  ck('四張可搬的卡各有位置下拉',r7.a.zsel===4,r7.a.zsel);
  ck('今日行程標成「固定」',r7.a.lock===1,r7.a.lock);
  ck('今日行程沒有展開開關（4 顆展開、5 顆高亮）',r7.a.def===4&&r7.a.hl===5,{def:r7.a.def,hl:r7.a.hl});
  ck('釘死航班後它的條件下拉消失',r7.bn.cond===2&&r7.bn.pin==='ref',r7.bn);
  ck('改回自動後條件下拉回來',r7.back.cond===1&&r7.back.pin==='auto',r7.back);
  ck('「全部恢復自動」把設定清空',r7.rst.zones==='{}',r7.rst);

  console.log('[8] 排序保護與首頁開關列');
  const r8=await p.evaluate(()=>{
    const st=S().settings; st.zones={order:['flight']};
    const repaired=zoneOrder();
    st.zones={}; P.leader=true; P.tab='home'; render();
    return {repaired, lead:document.querySelectorAll('.lead-sw').length,
            def:document.querySelectorAll('.ccard [data-act="cardDef"]').length};
  });
  ck('殘缺的順序設定會補齊五張',r8.repaired.length===5,r8.repaired);
  ck('首頁沒有金色開關列',r8.lead===0,r8.lead);
  ck('卡片上沒有展開開關',r8.def===0,r8.def);
  ck('全程無 JS 錯誤',errs.length===0,errs.slice(0,2));

  await ctx.close(); await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

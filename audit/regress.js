/* 回歸測試：320/375/390 × 標準/大/特大 × 淺/深，走過所有分頁與主要表單
   檢查：橫向捲動、短標籤斷行、JS 錯誤、雙重跳脫（&amp; &#39;）、關鍵元素存在
   用法：node audit/regress.js [--shots] */
const {chromium,FILE,at}=require('./_lib');
const SHOTS=process.argv.includes('--shots');
const SHORT='.tab span,.tab-home .lb,.chip,.btn:not(.wrap) .b2>span:first-child,.tcard b,.chead .ttl,.day-chip,.lcd,.wf-k,.ic-h,h2.sec,.dayrow button,.me-strip .k,.seg button,.fl-h,.kv dt,.prep-lab';
const VIEWS=[
  ['home-guest',()=>{P.leader=false;P.meId='';P.tab='home';P.tipDismissed=true;render();}],
  ['home-me',()=>{P.meId=members()[0].id;P.tab='home';render();}],
  ['home-on',()=>{S().settings.dayOverride=2;P.tab='home';render();}],
  ['home-hl',()=>{P.leader=false;S().settings.cards={prep:{o:1,ts:1,hl:1,hts:1},flight:{o:1,ts:1,hl:1,hts:1},hotel:{o:0,ts:1,hl:1,hts:1}};S().settings.dayOverride=2;P.cards={};P.tab='home';render();}],
  ['L-home-hl',()=>{P.leader=true;render();}],
  ['home-hl-off',()=>{P.leader=false;S().settings.cards={};S().settings.dayOverride=0;render();}],
  ['home-after',()=>{S().settings.dayOverride=0;S().settings.startDate='2026-08-01';P.tab='home';render();}],
  ['plan',()=>{S().settings.startDate='2026-09-24';P.tab='plan';P.planDay=2;P.planMode='simple';render();}],
  ['plan-detail',()=>{P.planMode='detail';render();}],
  ['rooms',()=>{P.tab='rooms';P.roomsSeg='rooms';render();}],
  ['list',()=>{P.roomsSeg='list';render();}],
  ['groups',()=>{P.tab='groups';P.scn='meal';render();}],
  ['airline',()=>{P.scn='airline';render();}],
  ['tools',()=>{P.tab='tools';P.tool='menu';render();}],
  ['money',()=>{P.tool='money';render();}],
  ['phrases',()=>{P.tool='phrases';P.phCat='';render();}],
  ['phrases-eat',()=>{P.tool='phrases';P.phCat='eat';render();}],
  ['phrases-sos',()=>{P.tool='phrases';P.phCat='sos';render();}],
  ['sos',()=>{P.tool='sos';render();}],
  ['esim',()=>{P.tool='esim';render();}],
  ['tips',()=>{P.tool='tips';render();}],
  ['power',()=>{P.tool='power';render();}],
  ['entry',()=>{P.tool='entry';render();}],
  ['weather',()=>{P.tool='weather';render();}],
  ['exchange',()=>{P.tool='exchange';render();}],
  ['phoneset',()=>{P.tool='phoneset';render();}],
  ['grab',()=>{P.tool='grab';render();}],
  ['health',()=>{P.tool='health';render();}],
  ['market',()=>{P.tool='market';render();}],
  ['basics',()=>{P.tool='basics';render();}],
  ['notes',()=>{P.tab='notes';render();}],
  ['L-home',()=>{P.leader=true;P.tab='home';render();}],
  ['L-plan',()=>{P.tab='plan';render();}],
  ['L-groups',()=>{P.tab='groups';P.scn='meal';render();}],
  ['L-tools',()=>{P.tab='tools';P.tool='menu';render();}],
  ['L-rollcall',()=>{P.tool='rollcall';render();}],
];
const SHEETS=[
  ['settings',()=>ACT.settings()],['broadcast',()=>ACT.editBroadcast()],['item',()=>{P.tab='plan';render();document.querySelector('[data-act="editItem"]').click();}],
  ['member',()=>{P.tab='rooms';P.roomsSeg='list';render();document.querySelector('.mlist .mc').click();}],
  ['hotel',()=>sheetHotelEdit('sapa')],['scenario',()=>sheetScenario('meal')],['airlines',()=>ACT.editAirlines()],
  ['move',()=>{P.tab='groups';P.scn='meal';render();document.querySelector('.grp .gm .mc').click();}],
  ['tagopts',()=>{P.tab='groups';P.scn='meal';render();sheetTagOpts();}],
  ['tagoptEdit',()=>{P.tab='groups';P.scn='meal';render();sheetTagOptEdit('已點餐');}],
  ['homeScn',()=>ACT.homeScnVis()],
  ['share',()=>sheetShare()],
  ['zones-auto',()=>{S().settings.zones={};sheetCardZones();}],
  ['zones-pinned',()=>{S().settings.zones={mode:'card',manual:{flight:'now',hotel:'now',prep:'ref',morning:'hide'}};sheetCardZones();}],
  ['install-ios',()=>{uaEnv=()=>({ios:true,android:false,line:false,inapp:false});sheetInstall();}],
  ['install-android',()=>{uaEnv=()=>({ios:false,android:true,line:false,inapp:false});sheetInstall();}],
  ['install-line',()=>{uaEnv=()=>({ios:true,android:false,line:true,inapp:true});sheetInstall();}],
  ['install-desktop',()=>{uaEnv=()=>({ios:false,android:false,line:false,inapp:false});sheetInstall();}],
];
(async()=>{
  const b=await chromium.launch(); let fails=0;
  for(const w of [320,375,390]) for(const fs of ['md','lg','xl']) for(const dark of [false,true]){
    if(w!==320 && fs!=='md' && dark) continue; // 縮減組合
    const ctx=await b.newContext({viewport:{width:w,height:800},colorScheme:dark?'dark':'light',deviceScaleFactor:2});
    const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(FILE); await p.waitForTimeout(500);
    await p.evaluate(f=>{P.fs=f;savePrefs();render();},fs);
    const tag=`${w}/${fs}/${dark?'dark':'light'}`;
    for(const [name,fn] of VIEWS){
      await p.evaluate(fn); await p.waitForTimeout(120);
      const r=await p.evaluate(sel=>{
        const o=[]; document.querySelectorAll(sel).forEach(el=>{ const t=el.textContent.trim(); if(!t) return; const h1=el.getBoundingClientRect().height, pv=el.style.whiteSpace; el.style.whiteSpace='nowrap'; const h2=el.getBoundingClientRect().height; el.style.whiteSpace=pv; if(h1>h2*1.35) o.push(t.slice(0,14)); });
        const html=document.getElementById('view').innerHTML;
        const dbl=(html.match(/&amp;(amp|#39|quot|lt);/g)||[]).length;
        const cut=[...document.querySelectorAll('.fl-r b')].filter(e=>e.scrollWidth>e.clientWidth+1).length;
        return {wrap:o,ov:document.documentElement.scrollWidth>document.documentElement.clientWidth,dbl,cut};
      },SHORT);
      const bad=r.ov||r.wrap.length||r.dbl||r.cut;
      if(bad){ fails++; console.log('FAIL',tag,name,JSON.stringify(r)); }
      if(SHOTS&&w===320&&fs==='md'&&!dark) await p.screenshot({path:at(`shots/r-${name}.png`),fullPage:true});
    }
    for(const [name,fn] of SHEETS){
      await p.evaluate(()=>{P.leader=true;});
      await p.evaluate(fn); await p.waitForTimeout(150);
      const r=await p.evaluate(()=>{ const s=document.querySelector('.sheet'); return {open:!!s,ov:s?s.scrollWidth>s.clientWidth+1:false}; });
      if(!r.open||r.ov){ fails++; console.log('FAIL sheet',tag,name,JSON.stringify(r)); }
      if(SHOTS&&w===320&&fs==='md'&&!dark) await p.screenshot({path:at(`shots/r-sheet-${name}.png`)});
      await p.evaluate(()=>closeSheet());
    }
    if(errs.length){ fails++; console.log('JS ERR',tag,errs.slice(0,3)); }
    await ctx.close();
  }
  await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

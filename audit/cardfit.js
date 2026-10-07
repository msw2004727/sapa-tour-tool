/* v3.32 首頁兩張卡的排版：
   一、「第 1 天預告／今日行程」：有時間與沒時間的列排版凌亂（沒填時間的列時間欄只剩一條空白細線、標題起點對不齊、
       有地圖鈕的列比較高）。現在：每列等高（至少 44px，有沒有地圖鈕都一樣高）、時間欄同寬、沒填時間的列用小圓點佔位、
       標題左邊界一致、長標題換行不撐出卡片。
   二、「去程／回程交通」：原本固定兩欄，只有一班時只佔一半、另一半空白。現在：一班就佔滿整列（時間與說明同一行）、
       兩班並排等寬、三班時第三班佔滿整列；320px 以下配大字級本來就是單欄，仍然正常。
   fixture 的行程每一站都有時間、交通固定兩班，所以以前的測試完全量不到這兩種情況；這支測試自己造資料（全部虛構）。
   用法：node audit/cardfit.js（要先 node build.js） */
const {chromium,FILE}=require('./_lib');

/* 放進頁面的量測函式（前綴 t，不跟程式撞名；用 toString 傳進去，所以裡面不能用外面的變數） */
const tDay=function(fs,theme){
  /* 這天的行程換成 10 站：4 站有時間、6 站沒時間（夾在一起），3 站有地圖位置，最後一站標題超長 */
  const di=dayInfo(); const m=/第\s*(\d+)\s*天/.exec((document.querySelector('.card-h .sub')||{}).textContent||''); const n=m?Number(m[1]):1;
  const all=items(); const mine=all.filter(function(x){ return x.day===n; });
  const T=['03:00','05:00','07:25','10:25','','','','','',''];
  const TT=['公司集合','桃園國際機場集合','桃園機場(長榮航空BR-257)','CNX清邁國際機場','中餐_Siripanna Chiangmai自助餐','蘭納風格蘭谷莊園','晚餐:紅橋餐廳','清邁夜市','清邁凱景機場大酒店','這是一個很長很長的行程名稱用來測試換行ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKL'];
  const PL={0:1,7:1,9:1};
  while(mine.length<10){ const x={id:'tcf'+mine.length,day:n,time:'',title:'',place:''}; all.push(x); mine.push(x); }
  mine.forEach(function(x,i){ if(i<10){ x.time=T[i]; x.title=TT[i]; x.place=PL[i]?'某地點':''; x.isCurrent=false; x.isCanceled=false; } else { x.day=99; } });
  P.fs=fs; P.theme=theme; document.documentElement.setAttribute('data-fs',fs); P.tab='home'; render();
  const rows=[].slice.call(document.querySelectorAll('.pv-row'));
  const card=document.querySelector('.pv')&&document.querySelector('.pv').closest('.card');
  const cr=card?card.getBoundingClientRect():null;
  const root=parseFloat(getComputedStyle(document.documentElement).fontSize);
  const rowH=rows.map(function(r){ return r.getBoundingClientRect().height; });
  const lefts=rows.map(function(r){ return r.querySelector('.pv-t').getBoundingClientRect().left; });
  const single=rows.filter(function(r){ const t=r.querySelector('.pv-t'); const lh=parseFloat(getComputedStyle(t).lineHeight)||parseFloat(getComputedStyle(t).fontSize)*1.35; return t.getBoundingClientRect().height<=lh*1.6; });
  const sh=single.map(function(r){ return r.getBoundingClientRect().height; });
  const singlePin=single.filter(function(r){ return !!r.querySelector('.map-btn'); }).length;
  const pills=[].slice.call(document.querySelectorAll('.pv-row .tm'));
  const none=pills.filter(function(e){ return e.classList.contains('none'); });
  const bad=pills.filter(function(e){ return !e.classList.contains('none')&&!e.textContent.trim(); }).length;
  const dot=none.length?parseFloat(getComputedStyle(none[0],'::before').width):0;
  const out=rows.filter(function(r){ const q=r.getBoundingClientRect(); return cr&&(q.right>cr.right+0.5||q.left<cr.left-0.5); }).length;
  const pins=[].slice.call(document.querySelectorAll('.pv-row .map-btn')).map(function(e){ return e.getBoundingClientRect().height; });
  const ovf=rows.filter(function(r){ const t=r.querySelector('.pv-t'); return t.scrollWidth>t.clientWidth+1; }).length;
  const vw=window.innerWidth;
  return {title:(document.querySelector('.card-h h2')||{}).textContent.trim(),day:n,rows:rows.length,timed:pills.length-none.length,untimed:none.length,pins:pins.length,
    minRow:Math.min.apply(null,rowH),minNeed:root*2.75-1,leftSpread:Math.max.apply(null,lefts)-Math.min.apply(null,lefts),
    singleN:single.length,singlePin:singlePin,singleSpread:sh.length?Math.max.apply(null,sh)-Math.min.apply(null,sh):0,
    emptyPills:bad,dot:dot,out:out,ovf:ovf,minPin:pins.length?Math.min.apply(null,pins):0,docOver:document.documentElement.scrollWidth>vw+1};
};

/* 交通卡：n 班（1～3） */
const tFl=function(n,fs,theme){
  S().settings.airMig=1;
  S().groups.scenarios=[{id:'tx',name:'航班',cat:'transport',card:1,count:n,names:['長榮航空','中華航空','星宇航空'].slice(0,n),times:['07:00','08:20','09:00'].slice(0,n),backs:[],notes:['桃園第二航廈','桃園第一航廈','桃園第一航廈'].slice(0,n),shorts:['長榮','華航','星宇'].slice(0,n),assign:{}}];
  P.cards=P.cards||{}; P.cards.flight=true; P.fs=fs; P.theme=theme; document.documentElement.setAttribute('data-fs',fs); P.tab='home'; render();
  const fl=document.querySelector('.fl'); if(!fl) return {err:'沒有 .fl'};
  const fr=fl.getBoundingClientRect(), cols=[].slice.call(fl.querySelectorAll('.fl-col')).map(function(c){ const r=c.getBoundingClientRect(); return {w:r.width,l:r.left,r:r.right,t:r.top}; });
  const vw=window.innerWidth;
  const first=fl.querySelector('.fl-col:last-child .fl-r'); const b=first&&first.querySelector('b'), k=first&&first.querySelector('.k');
  const sameLine=!!(b&&k&&k.getBoundingClientRect().left>=b.getBoundingClientRect().right-1&&k.getBoundingClientRect().top<b.getBoundingClientRect().bottom);
  return {n:cols.length,W:fr.width,cols:cols,stacked:vw<=360&&(fs==='lg'||fs==='xl'),sameLine:sameLine,
    out:cols.filter(function(c){ return c.r>fr.right+0.5||c.l<fr.left-0.5; }).length,docOver:document.documentElement.scrollWidth>vw+1};
};

(async()=>{
  const b=await chromium.launch();
  let bad=0, checks=0;
  const chk=(name,ok,detail)=>{ checks++; if(!ok){ bad++; console.log('  FAIL '+name+'  → '+JSON.stringify(detail)); } };
  const install=p=>p.evaluate('window.tDay='+tDay.toString()+';window.tFl='+tFl.toString());
  const W=[320,375,390,435], FS=['md','lg','xl'], TH=['','dark'];

  console.log('[1] 「第 1 天預告」與「今日行程」：有時間／沒時間的列對齊、等高');
  for(const [mode,sim,expect] of [['出發前','2026-09-22T09:00','第 1 天預告'],['旅途中','2026-09-25T09:00','今日行程']]){
    for(const w of W){
      const p=await b.newPage({viewport:{width:w,height:900}});
      const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
      await p.goto(FILE+'?sim='+sim); await p.waitForTimeout(450); await install(p);
      for(const fs of FS) for(const th of TH){
        const r=await p.evaluate(a=>window.tDay(a.fs,a.th),{fs,th});
        const tag=mode+' '+w+'px '+fs+(th?' 深色':' 淺色');
        chk(tag+' 前提：卡片標題是「'+expect+'」',r.title===expect,r.title);
        chk(tag+' 前提：10 列、4 列有時間、6 列沒時間、3 列有地圖鈕',r.rows===10&&r.timed===4&&r.untimed===6&&r.pins===3,r);
        chk(tag+' 每列高度 ≥ 44px（有地圖鈕、沒地圖鈕都是）',r.minRow>=r.minNeed,{minRow:r.minRow,need:r.minNeed});
        chk(tag+' 前提：單行的列裡，有地圖鈕的與沒地圖鈕的都有（才比得出來）',r.singlePin>=1&&r.singleN-r.singlePin>=2,{n:r.singleN,pin:r.singlePin});
        chk(tag+' 單行的列全部等高（有沒有時間、有沒有地圖鈕都一樣）',r.singleSpread<=1,{n:r.singleN,spread:r.singleSpread});
        chk(tag+' 標題左邊界全部對齊（有時間、沒時間都在同一條線上）',r.leftSpread<=0.5,r.leftSpread);
        chk(tag+' 沒有空白的時間膠囊；沒時間的列有看得見的小圓點',r.emptyPills===0&&r.dot>=6,{empty:r.emptyPills,dot:r.dot});
        chk(tag+' 每一列都在卡片裡面、整頁沒有橫向捲動（含超長標題）',r.out===0&&!r.docOver,{out:r.out,docOver:r.docOver});
        chk(tag+' 標題沒有溢出自己的框（超長單字會自己斷行）',r.ovf===0,r.ovf);
        chk(tag+' 地圖鈕 ≥ 44px',r.minPin>=44,r.minPin);
      }
      chk(mode+' '+w+'px：沒有 JS 錯誤',errs.length===0,errs);
      await p.close();
    }
  }

  console.log('[2] 「去程交通」：一班佔滿整列、兩班並排、三班時第三班佔滿');
  for(const w of W){
    const p=await b.newPage({viewport:{width:w,height:900}});
    const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(FILE+'?sim=2026-09-22T09:00'); await p.waitForTimeout(450); await install(p);
    for(const fs of FS) for(const th of TH) for(const n of [1,2,3]){
      const r=await p.evaluate(a=>window.tFl(a.n,a.fs,a.th),{n,fs,th});
      const tag='交通 '+n+' 班 '+w+'px '+fs+(th?' 深色':' 淺色');
      if(r.err){ chk(tag+' 前提：交通卡有展開',false,r); continue; }
      chk(tag+' 前提：確實有 '+n+' 張班次卡',r.n===n,r.n);
      chk(tag+' 每張卡都在容器裡、整頁沒有橫向捲動',r.out===0&&!r.docOver,{out:r.out,docOver:r.docOver});
      const full=c=>c.w>=r.W-1, half=c=>c.w<=r.W*0.55;
      if(n===1){
        chk(tag+' 只有一班：佔滿整列（不切一半）',full(r.cols[0]),{w:r.cols[0].w,W:r.W});
        if(!r.stacked&&w>=375&&fs==='md') chk(tag+' 佔滿時時間與說明在同一行',r.sameLine,r);
      } else if(r.stacked){
        chk(tag+' 窄螢幕大字級：單欄，每班都佔滿整列',r.cols.every(full),r.cols.map(c=>c.w));
      } else if(n===2){
        chk(tag+' 兩班：並排、寬度相同、同一高度',half(r.cols[0])&&half(r.cols[1])&&Math.abs(r.cols[0].w-r.cols[1].w)<=1&&Math.abs(r.cols[0].t-r.cols[1].t)<=1,r.cols);
      } else {
        chk(tag+' 三班：前兩班並排等寬、第三班佔滿整列且在下一行',half(r.cols[0])&&half(r.cols[1])&&Math.abs(r.cols[0].w-r.cols[1].w)<=1&&full(r.cols[2])&&r.cols[2].t>r.cols[0].t+10,r.cols);
      }
    }
    chk('交通 '+w+'px：沒有 JS 錯誤',errs.length===0,errs);
    await p.close();
  }

  console.log(bad?('FAIL：'+bad+' 項（共 '+checks+' 項）'):('全部通過（'+checks+' 項）'));
  await b.close();
  process.exit(bad?1:0);
})();

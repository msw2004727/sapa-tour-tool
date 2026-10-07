/* v3.31 團員名單：直瀑式單欄、姓名不被切掉也不被擠出畫面。
   起因：「尚未分配房號」是寫死的兩欄（1fr 1fr），真實的團員姓名是「英文護照名＋中文名」（例：MS HONG/MEI ER 洪美娥），
   一欄被名字撐到 300 多 px，比螢幕還寬，右欄整排被擠出去。fixture 的名字是「團員01」這種短名，所以以前的測試完全抓不到。
   同一個毛病還有：分組頁每一組的兩欄、集合點名的兩欄、房號總表的 auto-fill 多欄、「…」把中文名切掉。
   這支測試把名單換成長名字（全部虛構），在 4 種寬度 × 3 種字級 × 淺深色下，量每一個有團員姓名的畫面：
     1. 每張卡片都在螢幕裡（左右都不超出），整頁沒有橫向捲動
     2. 容器是單欄（直瀑式）：所有卡片的左邊界相同
     3. 姓名沒有被「…」切掉（scrollWidth ≤ clientWidth）
   前提也一起斷言：名字確實夠長、每個畫面確實有足夠多張卡片、320px 特大字時確實有名字換成多行（證明量到的是真的）。
   用法：node audit/namefit.js（要先 node build.js） */
const {chromium,FILE}=require('./_lib');

/* 虛構姓名。第 2 個是一整串沒有空格的超長名字，用來測 overflow-wrap:anywhere 的最後防線 */
const NAMES=['MS LIU/YA TING 劉雅婷','MR CHRISTOPHER/ALEXANDERSON-WELLINGTON 柯林頓','MS CHANG/HSIU CHUAN 張秀娟','MR TSAI/CHENG HSIUNG 蔡正雄','MS HUANG/HSIAO LAN YING 黃小蘭英','MR LEE/KUO HUA 李國華','MS CHEN/SHU FEN 陳淑芬','MR WANG/CHIEN HUNG 王建宏'];

/* 每個畫面要有幾張卡（前提） */
const VIEWS=[['rooms-assigned',10],['rooms-none',5],['list',33],['groups',30],['rollcall',33],['sheet-me',33]];

/* 放進頁面的量測函式（前綴 t，不跟程式撞名；用 toString 傳進去，所以裡面不能用外面的變數） */
const tMeasure=function(id,fs,theme,names){
  const V={
    'rooms-assigned':{sel:'.rooms .mc',box:'.rooms',go:function(){ P.leader=false; P.tab='rooms'; P.roomsSeg='rooms'; }},
    'rooms-none':{sel:'#view .mlist .mc',box:'#view .mlist',go:function(){ P.leader=false; P.tab='rooms'; P.roomsSeg='rooms'; }},
    'list':{sel:'#view .mlist .mc',box:'#view .mlist',go:function(){ P.leader=false; P.tab='rooms'; P.roomsSeg='list'; P.q=''; }},
    'groups':{sel:'.grp .gm .mc',box:'.grp .gm',go:function(){ P.leader=false; P.tab='groups'; P.cat='meal'; P.scn='meal'; }},
    'rollcall':{sel:'.rc button',box:'.rc',go:function(){ P.leader=true; P.tab='tools'; P.tool='rollcall'; }},
    'sheet-me':{sel:'#meList .mc',box:'#meList',go:function(){ P.leader=false; P.tab='home'; },sheet:true}
  }[id];
  members().forEach(function(m,i){ if(names) m.name=names[i%names.length]; m.room=(i%3===0)?'':String(101+(i%10)); });
  P.fs=fs; P.theme=theme; document.documentElement.setAttribute('data-fs',fs);
  V.go(); render();
  if(V.sheet) sheetPickMe();
  const vw=window.innerWidth;
  const nameEl=function(c){ return c.querySelector('.nm')||c.querySelector('.rcn'); };
  const cards=[].slice.call(document.querySelectorAll(V.sel));
  const out=cards.filter(function(c){ const r=c.getBoundingClientRect(); return r.right>vw+1||r.left<-1; }).length;
  const trunc=cards.filter(function(c){ const n=nameEl(c); return n&&n.scrollWidth>n.clientWidth+1; }).length;
  const wrapped=cards.filter(function(c){ const n=nameEl(c); if(!n) return false; const cs=getComputedStyle(n); const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.2; return n.getBoundingClientRect().height>lh*1.5; }).length;
  const boxes=[].slice.call(document.querySelectorAll(V.box));
  let cols=0; boxes.forEach(function(bx){ const xs={}; [].slice.call(bx.children).forEach(function(ch){ const r=ch.getBoundingClientRect(); if(r.height>0) xs[Math.round(r.left)]=1; }); cols=Math.max(cols,Object.keys(xs).length); });
  const longest=cards.reduce(function(a,c){ const n=nameEl(c); return Math.max(a,n?n.textContent.trim().length:0); },0);
  const res={n:cards.length,out:out,trunc:trunc,wrapped:wrapped,cols:cols,boxes:boxes.length,longest:longest,docOver:document.documentElement.scrollWidth>vw+1};
  if(V.sheet) closeSheet();
  return res;
};

(async()=>{
  const b=await chromium.launch();
  let bad=0, checks=0;
  const chk=(name,ok,detail)=>{ checks++; if(!ok){ bad++; console.log('  FAIL '+name+'  → '+JSON.stringify(detail)); } };
  const install=p=>p.evaluate('window.tMeasure='+tMeasure.toString());

  console.log('[1] 長姓名：4 種寬度 × 3 種字級 × 淺深色 × 6 個畫面');
  let sawWrapAtNarrow=false;
  for(const w of [320,375,390,435]){
    const p=await b.newPage({viewport:{width:w,height:800}});
    const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(FILE); await p.waitForTimeout(400);
    await install(p);
    for(const fs of ['md','lg','xl']) for(const theme of ['','dark']) for(const [id,min] of VIEWS){
      const r=await p.evaluate(a=>window.tMeasure(a.id,a.fs,a.theme,a.names),{id,fs,theme,names:NAMES});
      const tag=id+' '+w+'px '+fs+(theme?' 深色':' 淺色');
      chk(tag+' 前提：卡片夠多（≥ '+min+'）',r.n>=min,r);
      chk(tag+' 前提：名字夠長（≥ 20 字）',r.longest>=20,r);
      chk(tag+' 每張卡片都在螢幕裡',r.out===0,r);
      chk(tag+' 整頁沒有橫向捲動',!r.docOver,r);
      chk(tag+' 直瀑式單欄',r.boxes>0&&r.cols===1,r);
      chk(tag+' 姓名沒有被「…」切掉',r.trunc===0,r);
      if(w===320&&fs==='xl'&&r.wrapped>0) sawWrapAtNarrow=true;
    }
    chk(w+'px：沒有 JS 錯誤',errs.length===0,errs);
    await p.close();
  }
  chk('前提：320px 特大字時確實有姓名換成多行（證明量到的是真的）',sawWrapAtNarrow,'沒有任何姓名換行');

  console.log('[2] 短名字（fixture 原本的「團員01」）也一樣是單欄、沒有出界');
  {
    const p=await b.newPage({viewport:{width:320,height:800}});
    await p.goto(FILE); await p.waitForTimeout(400);
    await install(p);
    for(const [id,min] of [['rooms-none',5],['groups',30],['rollcall',33]]){
      const r=await p.evaluate(a=>window.tMeasure(a.id,'xl','',null),{id});
      const sample=await p.evaluate(()=>{ const c=document.querySelector('.mc .nm')||document.querySelector('.rc .rcn'); return c?c.textContent.trim():''; });
      chk('短名 '+id+' 前提：卡片夠多、名字確實是短名（'+sample+'）',r.n>=min&&sample.length>0&&sample.length<=8,{r,sample});
      chk('短名 '+id+' 單欄、沒有出界、沒有被切',r.boxes>0&&r.cols===1&&r.out===0&&r.trunc===0,r);
    }
    await p.close();
  }

  console.log(bad?('FAIL：'+bad+' 項（共 '+checks+' 項）'):('全部通過（'+checks+' 項）'));
  await b.close();
  process.exit(bad?1:0);
})();

/* v3.25 分組的大分類：交通、餐飲、逛街、旅伴。
   原本的「航空公司」頁籤併進「交通」分類，交通、餐飲、逛街、旅伴每一類的每一組各有不同的預設欄位
   （交通有搭乘時間與上車地點、餐飲有桌次與用餐時間…），情境的編輯表單改成一組一列。
   這支測試實際點畫面上的按鈕走過每一種操作，並確認：
   - 四個大分類、新增情境在分類裡面、每一類的預設名稱與欄位、預設值
   - 逐列編輯：新增、刪除、上移、下移之後，每個人的分組跟著重新對應（沒有人被分到別組去）
   - 舊資料（v3.24 以前的航空公司、去回程起飛時間、每個人的 airline）自動轉成「航班」情境：
     所有手機算出來一樣、還沒人修改時什麼都不寫、第一次修改時才存進去，刪掉後不會再冒出來
   - 首頁的交通卡、「我的資訊」、名單與點名上的小圓徽章、團員資料卡
   - 320／375／390 × 標準／大／特大字 × 淺色／深色不溢出、不斷行
   - 全新（什麼都沒有）與雲端把空陣列拿掉之後的樣子；資料裡塞 HTML 只會顯示成文字
   用法：node audit/scntest.js [--shots] */
const {chromium,FILE,at,outboundBlocked}=require('./_lib');
const SHOTS=process.argv.includes('--shots');
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x).slice(0,420));} else console.log('  ✓',n); };
const T0=new Date('2026-09-20T10:00:00+08:00');   /* 出發前（跟其他測試一樣固定時鐘） */
const shot=async(p,name)=>{ if(SHOTS) await p.screenshot({path:at(`shots/scn-${name}.png`)}); };
const HELP=()=>{
  window.tsleep=function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
  /* 點畫面上的按鈕（跟真人一樣走事件代理），找不到就回 false */
  window.ttap=function(sel,root){ var e=(root||document).querySelector(sel); if(!e||e.disabled) return false; e.click(); return true; };
  window.tset=function(name,v){ var e=document.querySelector('#sheetRoot [name="'+name+'"]'); if(!e) return false; e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return true; };
  window.trows=function(){ var out=[]; for(var i=0;;i++){ var e=document.querySelector('#sheetRoot [name="g_name_'+i+'"]'); if(!e) break; out.push(e.value); } return out; };
  /* 某個情境每一組有哪些人（組別 → 團員 id 陣列） */
  window.tgroups=function(id){ var sc=scenario(id), o={}; members().forEach(function(m){ var gi=scnGi(sc,m.id); if(gi>=0) (o[gi]=o[gi]||[]).push(m.id); }); return o; };
  window.tops=function(){ return Store.q.map(function(o){ return o.key+':'+(o.path||'(whole)'); }); };
  /* 在分組頁按「新增情境」（就是分類裡面那顆），開出那一類的新增表單 */
  window.topen=function(cat){ P.leader=true; P.tab='groups'; P.cat=cat; P.scn=''; render(); return ttap('#view [data-act="editScenario"][data-id=""]'); };
  /* 把一列填好：字串欄位用 tset，時間欄用 setTimeField（跟畫面上的下拉選單一樣寫進隱藏欄位） */
  window.tfill=function(i,o){ Object.keys(o).forEach(function(k){
    var name=(k==='name')?'g_name_'+i:'g_'+k+'_'+i;
    if(k==='times'||k==='backs') setTimeField(name,o[k]); else tset(name,o[k]); }); };
  window.tview=function(){ return document.getElementById('view').innerText.replace(/\s+/g,' '); };
};
async function open(b,opt,size){
  const ctx=await b.newContext(Object.assign({viewport:size||{width:375,height:760}},opt||{}));
  const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(String(e)));
  await p.addInitScript(HELP);
  await p.clock.install({time:T0});
  await p.goto(FILE); await p.waitForTimeout(350);
  return {ctx,p,errs};
}
/* 舊資料：前 10 位搭長榮（eva）、接著 10 位搭華航（ci）——跟 v3.24 以前雲端上的資料一樣 */
const LEGACY_AIR=()=>{ members().forEach(function(m,i){ m.airline=i<10?'eva':(i<20?'ci':''); }); };
(async()=>{
  const b=await chromium.launch();
  /* 每一節包起來：中途崩潰（例如少了預期的按鈕）算一個失敗，後面的節照樣跑，才看得到完整的紅燈 */
  const sect=async(title,fn)=>{ console.log(title); try{ await fn(); }catch(e){ fails++; console.log('  ✗ 這一節中途崩潰：',String(e).split('\n')[0].slice(0,300)); } };

  await sect('\n[0] 安全：測試瀏覽器連不到外面',async()=>{
  { const {ctx,p}=await open(b);
    const r=await p.evaluate(()=>({mode:Store.mode}));
    ck('Firebase 的 SDK 被擋下，停在單機（不會寫進正式資料庫）',r.mode!=='cloud'&&outboundBlocked()>0,Object.assign(r,{blocked:outboundBlocked()}));
    await ctx.close(); }

  });

  await sect('\n[1] 四個大分類：交通、餐飲、逛街、旅伴；新增情境在分類裡面',async()=>{
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(()=>{ var o={}; P.leader=false; P.tab='groups'; P.cat=''; P.scn=''; render();
      var bar=function(){ return [].map.call(document.querySelectorAll('#view .catbar button'),function(x){ return x.textContent.trim()+(x.classList.contains('on')?'*':''); }); };
      var chips=function(){ return [].map.call(document.querySelectorAll('#view .chips .chip'),function(x){ return x.textContent.trim(); }); };
      o.guestBar=bar(); o.guestChips=chips(); o.guestBtns=document.querySelectorAll('#view [data-act="editScenario"],#view [data-act="shuffle"],#view [data-act="clearGroups"]').length;
      o.cats=scnAll().map(function(s){ return s.id+':'+scnCat(s); });
      P.leader=true; render(); o.leaderAdd={};
      ['transport','meal','shop','mate'].forEach(function(c){ ttap('#view .catbar [data-cat="'+c+'"]');
        var add=document.querySelector('#view [data-act="editScenario"][data-id=""]');
        o.leaderAdd[c]={on:bar().filter(function(x){ return /\*$/.test(x); }).join(),chips:chips(),addCat:add&&add.getAttribute('data-cat'),addText:add&&add.textContent.trim(),empty:/還沒有情境/.test(tview())}; });
      /* 首頁「我的資訊」點接駁車那格：分類跟著情境走 */
      P.leader=false; P.meId=members()[0].id; P.tab='home'; P.cat=''; P.scn=''; render();
      var cell=[].filter.call(document.querySelectorAll('.me-strip button'),function(x){ return /接駁車/.test(x.textContent); })[0];
      o.stripCell=!!cell; if(cell) cell.click();
      o.afterStrip={tab:P.tab,cat:curCat(),scn:(curScn()||{}).id,bar:bar()};
      return o; });
    ck('團員看到四個分類，順序是 交通、餐飲、逛街、旅伴；一開始停在舊資料的 activeId（用餐）所屬的「餐飲」',r.guestBar.join()==='交通,餐飲*,逛街,旅伴',r.guestBar);
    ck('團員看不到「新增情境／隨機分組／清除分組」這些管理按鈕',r.guestBtns===0,r.guestBtns);
    ck('舊資料的情境自動歸類：用餐→餐飲、接駁車→交通、健行分流→旅伴、航班（舊航空公司）→交通',JSON.stringify(r.cats)==='["meal:meal","shuttle:transport","hike:mate","air:transport"]',r.cats);
    ck('管理者：每個分類裡都有「新增情境」，而且帶著自己的分類（點了才是新增那一類的情境）',['transport','meal','shop','mate'].every(c=>r.leaderAdd[c].addCat===c&&r.leaderAdd[c].addText==='新增情境'),r.leaderAdd);
    ck('分類裡看到的情境：交通＝接駁車、航班；餐飲＝用餐分桌；逛街＝沒有；旅伴＝健行分流',r.leaderAdd.transport.chips.join()==='接駁車,航班,新增情境'&&r.leaderAdd.meal.chips.join()==='用餐分桌,新增情境'&&r.leaderAdd.shop.chips.join()==='新增情境'&&r.leaderAdd.mate.chips.join()==='健行分流,新增情境',r.leaderAdd);
    ck('沒有情境的分類寫「還沒有情境」，其他分類沒有這句',r.leaderAdd.shop.empty&&!r.leaderAdd.meal.empty&&!r.leaderAdd.transport.empty,r.leaderAdd);
    ck('點分類：畫面上亮起的分類跟著換',['transport','meal','shop','mate'].every((c,i)=>r.leaderAdd[c].on===['交通','餐飲','逛街','旅伴'][i]+'*'),r.leaderAdd);
    ck('首頁「我的資訊」點「接駁車」：直接跳到分組頁的交通分類、接駁車情境',r.stripCell&&r.afterStrip.tab==='groups'&&r.afterStrip.cat==='transport'&&r.afterStrip.scn==='shuttle'&&r.afterStrip.bar.join()==='交通*,餐飲,逛街,旅伴',r.afterStrip);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await shot(p,'1-categories'); await ctx.close(); }

  });

  await sect('\n[2] 依分類預設：每一類新增時的組別名稱、組數、欄位、臨時標籤、預設值',async()=>{
  { const {ctx,p,errs}=await open(b);
    const want={
      transport:{title:'新增「交通」情境',rows:['A 車','B 車'],has:['g_times_0','g_backs_0','g_notes_0','g_shorts_0','card'],no:['g_leaders_0','sf_time','sf_place'],pre:['航班','接駁車','火車','高鐵','遊覽車'],tags:'0'},
      meal:{title:'新增「餐飲」情境',rows:['第 1 桌','第 2 桌','第 3 桌','第 4 桌'],has:['g_notes_0','sf_time','sf_place'],no:['g_times_0','g_backs_0','g_shorts_0','g_leaders_0','card'],pre:['早餐','午餐','晚餐','用餐分桌'],tags:'1'},
      shop:{title:'新增「逛街」情境',rows:['第 1 隊','第 2 隊'],has:['g_notes_0','g_times_0'],no:['g_backs_0','g_shorts_0','g_leaders_0','sf_time','sf_place','card'],pre:['自由逛街','夜市','購物'],tags:'0'},
      mate:{title:'新增「旅伴」情境',rows:['第 1 組','第 2 組','第 3 組'],has:['g_leaders_0','g_notes_0'],no:['g_times_0','g_backs_0','g_shorts_0','sf_time','sf_place','card'],pre:['健行分組','同房旅伴','兩人一組'],tags:'0'}
    };
    for(const c of Object.keys(want)){
      const r=await p.evaluate(c=>{ var okOpen=topen(c); var sh=document.getElementById('sheetRoot');
        var o={okOpen:okOpen,title:(sh.querySelector('#sheetTitle')||{}).textContent,rows:trows(),
          names:[].map.call(sh.querySelectorAll('[name]'),function(e){ return e.name; }),
          pre:[].map.call(sh.querySelectorAll('[data-act="scnPreset"]'),function(e){ return e.textContent; }),
          tags:(sh.querySelector('[name="useTags"]')||{}).value,card:(sh.querySelector('[name="card"]')||{}).value,
          switcher:sh.querySelectorAll('[data-act="scnCat"]').length,blurb:(sh.querySelector('.muted')||{}).textContent,
          nameFocus:document.activeElement&&document.activeElement.name};
        return o; },c);
      const W=want[c];
      ck(c+'：從分類裡的「新增情境」進來，標題寫出是哪一類',r.okOpen&&r.title===W.title,r.title);
      ck(c+'：預設的組別名稱＝'+W.rows.join('、'),JSON.stringify(r.rows)===JSON.stringify(W.rows),r.rows);
      ck(c+'：這一類專屬的欄位都有',W.has.every(n=>r.names.includes(n)),r.names);
      ck(c+'：別的分類的欄位不會出現',W.no.every(n=>!r.names.includes(n)),r.names);
      ck(c+'：名稱建議＝'+W.pre.join('、'),JSON.stringify(r.pre)===JSON.stringify(W.pre),r.pre);
      ck(c+'：臨時標籤預設'+(W.tags==='1'?'開':'關'),r.tags===W.tags,r.tags);
      ck(c+'：新增時沒有「換分類」那排（分類就是剛剛點進來的那一類），有這一類的說明文字',r.switcher===0&&r.blurb&&r.blurb.length>10,{s:r.switcher,b:r.blurb});
      await p.evaluate(()=>closeSheet());
    }
    /* 交通「首頁交通資訊」預設：已經有別的情境列在首頁了就不重複；全新的第一個預設列出 */
    const rc=await p.evaluate(()=>{ topen('transport'); var a=document.querySelector('#sheetRoot [name="card"]').value; closeSheet();
      scnReal().forEach(function(s){ delete s.card; }); S().settings.airMig=1; render(); topen('transport'); var b2=document.querySelector('#sheetRoot [name="card"]').value; closeSheet(); return {withCardScn:a,noCardScn:b2}; });
    ck('交通首頁交通資訊卡預設：已經有情境列在卡上就「不列出」，沒有的話新增的第一個「列出」',rc.withCardScn==='0'&&rc.noCardScn==='1',rc);
    /* 名稱建議：按一下帶入名稱，還會依分類順便帶預設值 */
    const pr=await p.evaluate(()=>{ var o={}; topen('meal'); var nm=function(){ return document.querySelector('#sheetRoot [name="name"]').value; }, tm=function(){ return document.querySelector('#sheetRoot [name="sf_time"]').value; };
      ttap('#sheetRoot [data-act="scnPreset"][data-val="晚餐"]'); o.dinner={name:nm(),time:tm(),rows:trows().length};
      ttap('#sheetRoot [data-act="scnPreset"][data-val="早餐"]'); o.breakfast={name:nm(),time:tm()};      /* 時間已經有了（18:00）就不蓋掉 */
      setTimeField('sf_time','19:30'); ttap('#sheetRoot [data-act="scnPreset"][data-val="午餐"]'); o.lunchKeep={name:nm(),time:tm()};
      setTimeField('sf_time',''); ttap('#sheetRoot [data-act="scnPreset"][data-val="午餐"]'); o.lunch={name:nm(),time:tm()};
      ttap('#sheetRoot [data-act="scnPreset"][data-val="用餐分桌"]'); o.plain={name:nm(),time:tm()};
      closeSheet();
      /* 旅伴：兩人一組 → 依團員人數排出 17 組；已經動過就不重排 */
      topen('mate'); ttap('#sheetRoot [data-act="scnPreset"][data-val="兩人一組"]'); o.pairs={name:nm(),n:trows().length,first:trows()[0],last:trows()[16],focus:document.activeElement&&document.activeElement.name};
      ttap('#sheetRoot [data-act="scnPreset"][data-val="健行分組"]'); o.afterOther={name:nm(),n:trows().length};    /* 這個建議沒有人數，組數不動 */
      closeSheet();
      topen('mate'); tset('g_name_0','我改過'); ttap('#sheetRoot [data-act="scnPreset"][data-val="兩人一組"]'); o.touched={name:nm(),n:trows().length,first:trows()[0]}; closeSheet();
      topen('mate'); tfill(1,{leaders:'團員05'}); ttap('#sheetRoot [data-act="scnPreset"][data-val="兩人一組"]'); o.touched2={n:trows().length}; closeSheet();
      topen('shop'); ttap('#sheetRoot [data-act="scnPreset"][data-val="夜市"]'); o.shop={name:nm(),n:trows().length,hasTime:!!document.querySelector('#sheetRoot [name="sf_time"]')}; closeSheet();
      topen('transport'); ttap('#sheetRoot [data-act="scnPreset"][data-val="高鐵"]'); o.rail={name:nm(),n:trows().length}; closeSheet();
      /* 編輯已存在的情境：不出現名稱建議、也不會被重排 */
      P.tab='groups'; P.cat='meal'; P.scn='meal'; render(); ttap('#view [data-act="editScenario"][data-id="meal"]'); o.editChips=document.querySelectorAll('#sheetRoot [data-act="scnPreset"]').length; closeSheet();
      return o; });
    ck('餐飲的名稱建議「晚餐」：帶入名稱、用餐時間 18:00；桌數 4（33 人 ÷ 每桌 10 人）',pr.dinner.name==='晚餐'&&pr.dinner.time==='18:00'&&pr.dinner.rows===4,pr.dinner);
    ck('已經有用餐時間就不蓋掉（再按「早餐」名稱變、時間還是 18:00；手動改成 19:30 後按「午餐」也不變）；時間空的時候「午餐」帶 12:00',pr.breakfast.name==='早餐'&&pr.breakfast.time==='18:00'&&pr.lunchKeep.name==='午餐'&&pr.lunchKeep.time==='19:30'&&pr.lunch.time==='12:00',pr);
    ck('沒有預設時間的建議（用餐分桌）只換名稱，不動時間',pr.plain.name==='用餐分桌'&&pr.plain.time==='12:00',pr.plain);
    ck('旅伴的名稱建議「兩人一組」：依團員人數排出 17 組（33 人 ÷ 2），名稱是第 1～17 組',pr.pairs.name==='兩人一組'&&pr.pairs.n===17&&pr.pairs.first==='第 1 組'&&pr.pairs.last==='第 17 組',pr.pairs);
    ck('再按沒有人數的建議（健行分組）：只換名稱，組數不動',pr.afterOther.name==='健行分組'&&pr.afterOther.n===17,pr.afterOther);
    ck('已經動過組別（改過名稱、或填了欄位）：按「兩人一組」只換名稱，不重排組數，免得已經填的字不見',pr.touched.name==='兩人一組'&&pr.touched.n===3&&pr.touched.first==='我改過'&&pr.touched2.n===3,{a:pr.touched,b:pr.touched2});
    ck('逛街、交通的名稱建議只換名稱（沒有預設值、組數維持預設）',pr.shop.name==='夜市'&&pr.shop.n===2&&!pr.shop.hasTime&&pr.rail.name==='高鐵'&&pr.rail.n===2,{shop:pr.shop,rail:pr.rail});
    ck('編輯已經存在的情境：沒有名稱建議（不會被重排組數）',pr.editChips===0,pr.editChips);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[3] 每一類各建一個情境：存進資料、顯示在分組頁、首頁跟著出現',async()=>{
  { const {ctx,p,errs}=await open(b);
    /* 交通：高鐵，兩組，每組有搭乘時間、回程時間、上車地點、徽章短名 */
    const t1=await p.evaluate(()=>{ topen('transport'); tset('name','高鐵');
      tfill(0,{name:'甲班',times:'08:10',backs:'17:00',notes:'台北車站東三門',shorts:'甲'}); tfill(1,{name:'乙班',times:'09:10',backs:'18:00',notes:'左營站',shorts:'乙'});
      ttap('#sheetRoot [data-act="saveScenario"]');
      var sc=scnReal().filter(function(s){ return s.name==='高鐵'; })[0];
      return {sc:sc&&JSON.parse(JSON.stringify(sc)),open:!!SHEET,cat:curCat(),cur:(curScn()||{}).name,q:tops(),
        meta:[].map.call(document.querySelectorAll('#view .grp .grp-meta'),function(e){ return e.textContent; }),
        heads:[].map.call(document.querySelectorAll('#view .grp h3 .tn'),function(e){ return e.textContent; }),
        badges:[].map.call(document.querySelectorAll('#view .grp h3 .al'),function(e){ return e.textContent+'/'+e.style.backgroundColor; })}; });
    ck('交通：存進 groups（分類、名稱、組數、各組名稱與時間、上車地點、徽章短名）',t1.sc&&t1.sc.cat==='transport'&&t1.sc.count===2&&JSON.stringify(t1.sc.names)==='["甲班","乙班"]'&&JSON.stringify(t1.sc.times)==='["08:10","09:10"]'&&JSON.stringify(t1.sc.backs)==='["17:00","18:00"]'&&JSON.stringify(t1.sc.notes)==='["台北車站東三門","左營站"]'&&JSON.stringify(t1.sc.shorts)==='["甲","乙"]',t1.sc);
    ck('交通：新增前已有情境列在首頁交通卡，所以這個預設不列出（沒有 card 欄位）；臨時標籤預設關',!t1.sc.card&&t1.sc.useTags===0,t1.sc);
    ck('存完表單關掉、留在交通分類、停在剛建的「高鐵」，只送出一筆整份 groups 存檔',!t1.open&&t1.cat==='transport'&&t1.cur==='高鐵'&&t1.q.join()==='groups:(whole)',t1);
    ck('分組頁：每一組下面一行說明「搭乘 08:10 · 回程 17:00 · 上車地點」',t1.meta.join('|')==='搭乘 08:10 · 回程 17:00 · 台北車站東三門|搭乘 09:10 · 回程 18:00 · 左營站',t1.meta);
    ck('分組頁：交通的組別標題前面是小圓徽章（短名、第 1 組綠、第 2 組紅）',t1.badges.join('|')==='甲/rgb(10, 122, 76)|乙/rgb(196, 24, 79)'&&t1.heads.slice(0,2).join()==='甲班,乙班',{b:t1.badges,h:t1.heads});
    /* 把兩位團員放進去：點名字 → 跳出「這位放哪一組」→ 點組別 */
    const t2=await p.evaluate(()=>{ var ids=[members()[25].id,members()[26].id]; var out={sheet:[]};
      P.cat='transport'; P.scn=scnReal().filter(function(s){ return s.name==='高鐵'; })[0].id; render();
      ttap('#view .grp .gm .mc[data-id="'+ids[0]+'"]'); out.sheet=[].map.call(document.querySelectorAll('#sheetRoot [data-act="setGroup"]'),function(e){ return e.textContent.replace(/\s+/g,' ').trim(); });
      ttap('#sheetRoot [data-act="setGroup"][data-g="0"]');
      ttap('#view .grp .gm .mc[data-id="'+ids[1]+'"]'); ttap('#sheetRoot [data-act="setGroup"][data-g="1"]');
      out.g=tgroups(P.scn); out.ids=ids; out.q=tops().slice(-2);
      P.leader=false; P.meId=ids[0]; P.tab='home'; render();
      out.strip=[].map.call(document.querySelectorAll('.me-strip button'),function(e){ return e.querySelector('.k').textContent+'='+e.querySelector('.v').textContent.replace(/\s+/g,' ').trim(); });
      P.meId=ids[1]; render(); out.strip2=[].map.call(document.querySelectorAll('.me-strip button'),function(e){ return e.querySelector('.k').textContent+'='+e.querySelector('.v').textContent.replace(/\s+/g,' ').trim(); });
      return out; });
    ck('移動團員的表單：交通的每一組帶著小圓徽章與搭乘時間、上車地點',t2.sheet.length===3&&/甲.*甲班.*搭乘 08:10 · 回程 17:00 · 台北車站東三門/.test(t2.sheet[0])&&/乙班/.test(t2.sheet[1])&&/移出分組/.test(t2.sheet[2]),t2.sheet);
    ck('點了才分組：只送出局部寫入 scenarios/N/assign/<團員>',t2.q.every(x=>/^groups:scenarios\/\d+\/assign\/x?m\d+$/.test(x)),t2.q);
    ck('兩位團員分到不同的組',JSON.stringify(t2.g)===JSON.stringify({0:[t2.ids[0]],1:[t2.ids[1]]}),t2.g);
    ck('首頁「我的資訊」：高鐵（名稱＋組別）、高鐵集合（搭乘時間＋上車地點）',t2.strip.includes('高鐵=甲班')&&t2.strip.includes('高鐵集合=08:10 台北車站東三門'),t2.strip);
    ck('另一位看到自己那組的時間與地點',t2.strip2.includes('高鐵=乙班')&&t2.strip2.includes('高鐵集合=09:10 左營站'),t2.strip2);
    /* 打開「首頁交通資訊」：這時首頁交通卡多了一組高鐵，台灣時間的分界（最晚一班去程）跟著改成 09:10 */
    const t3=await p.evaluate(()=>{ P.leader=true; var sc=scnReal().filter(function(s){ return s.name==='高鐵'; })[0]; var before=twCutoff();
      P.tab='groups'; P.cat='transport'; P.scn=sc.id; render(); ttap('#view [data-act="editScenario"][data-id="'+sc.id+'"]');
      var sel=document.querySelector('#sheetRoot [name="card"]'); var was=sel.value; sel.value='1'; ttap('#sheetRoot [data-act="saveScenario"]');
      var on=twCutoff(); P.tab='home'; P.meId=members()[0].id; P.leader=false; P.cards={flight:{o:1,ts:9e12}}; render();
      var card=[].filter.call(document.querySelectorAll('.ccard'),function(x){ return x.querySelector('[data-id="flight"]'); })[0];
      var txt=card?card.innerText.replace(/\s+/g,' '):'';
      P.leader=true; P.tab='groups'; P.cat='transport'; P.scn=sc.id; render(); ttap('#view [data-act="editScenario"][data-id="'+sc.id+'"]');
      document.querySelector('#sheetRoot [name="card"]').value='0'; ttap('#sheetRoot [data-act="saveScenario"]');
      return {before:before,was:was,on:on,off:twCutoff(),card:txt}; });
    ck('勾「列在首頁交通資訊」：台灣時間的分界改成最晚一班去程（09:10），拿掉又回到 09:00',t3.was==='0'&&t3.before==='09:00'&&t3.on==='09:10'&&t3.off==='09:00',t3);
    ck('首頁去程交通卡列出四組：華航 08:20、長榮 09:00、甲班 08:10、乙班 09:10（兩個情境都有時間，名稱前面加情境名）',/去程交通/.test(t3.card)&&/高鐵・甲班/.test(t3.card)&&/08:10/.test(t3.card)&&/高鐵・乙班/.test(t3.card)&&/09:10/.test(t3.card)&&/航班・長榮航空/.test(t3.card),t3.card);

    /* 餐飲：晚餐，桌次預設第 1～4 桌，用餐時間、餐廳 */
    const m1=await p.evaluate(()=>{ topen('meal'); tset('name','晚餐'); setTimeField('sf_time','18:30'); tset('sf_place','山城餐廳'); tfill(0,{notes:'靠窗'});
      ttap('#sheetRoot [data-act="saveScenario"]');
      var sc=scnReal().filter(function(s){ return s.name==='晚餐'; })[0];
      return {sc:sc&&JSON.parse(JSON.stringify(sc)),top:(document.querySelector('#view .grp-meta.top')||{}).textContent,meta:[].map.call(document.querySelectorAll('#view .grp .grp-meta'),function(e){ return e.textContent; }),
        tagBtn:!!document.querySelector('#view [data-act="manageTagOpts"]'),heads:[].map.call(document.querySelectorAll('#view .grp h3 .tn'),function(e){ return e.textContent; }),shuffle:!!document.querySelector('#view [data-act="shuffle"]')}; });
    ck('餐飲：桌次＝第 1～4 桌、用餐時間 18:30、餐廳、桌位說明，臨時標籤預設開',m1.sc&&m1.sc.cat==='meal'&&JSON.stringify(m1.sc.names)==='["第 1 桌","第 2 桌","第 3 桌","第 4 桌"]'&&m1.sc.time==='18:30'&&m1.sc.place==='山城餐廳'&&JSON.stringify(m1.sc.notes)==='["靠窗","","",""]'&&m1.sc.useTags===1,m1.sc);
    ck('餐飲：畫面上有「用餐 18:30 · 山城餐廳」（整個情境一行）、第 1 桌的桌位說明「靠窗」、桌次標題、管理標籤與隨機分組',m1.top==='用餐 18:30 · 山城餐廳'&&m1.meta.join('|')==='靠窗'&&m1.heads.slice(0,4).join()==='第 1 桌,第 2 桌,第 3 桌,第 4 桌'&&m1.tagBtn&&m1.shuffle,m1);
    /* 逛街：夜市，每隊要去哪裡、回來集合時間 */
    const s1=await p.evaluate(()=>{ topen('shop'); tset('name','夜市'); tfill(0,{notes:'夜市入口',times:'20:30'}); tfill(1,{notes:'廣場',times:'20:45'});
      ttap('#sheetRoot [data-act="saveScenario"]'); var sc=scnReal().filter(function(s){ return s.name==='夜市'; })[0];
      return {sc:sc&&JSON.parse(JSON.stringify(sc)),cat:curCat(),meta:[].map.call(document.querySelectorAll('#view .grp .grp-meta'),function(e){ return e.textContent; }),tagBtn:!!document.querySelector('#view [data-act="manageTagOpts"]')}; });
    ck('逛街：存成 shop，各隊「要去哪裡」「回來集合時間」；畫面顯示「夜市入口 · 集合 20:30」；臨時標籤預設關（沒有管理標籤）',s1.sc&&s1.sc.cat==='shop'&&s1.cat==='shop'&&s1.sc.useTags===0&&JSON.stringify(s1.sc.names)==='["第 1 隊","第 2 隊"]'&&s1.meta.join('|')==='夜市入口 · 集合 20:30|廣場 · 集合 20:45'&&!s1.tagBtn,s1);
    /* 旅伴：兩人一組，組長 */
    const a1=await p.evaluate(()=>{ topen('mate'); tset('name','兩人一組'); tfill(0,{leaders:'團員05',notes:'走比較慢'});
      ttap('#sheetRoot [data-act="saveScenario"]'); var sc=scnReal().filter(function(s){ return s.name==='兩人一組'; })[0];
      return {sc:sc&&JSON.parse(JSON.stringify(sc)),cat:curCat(),meta:[].map.call(document.querySelectorAll('#view .grp .grp-meta'),function(e){ return e.textContent; })}; });
    ck('旅伴：組長與備註存進去，畫面顯示「組長 團員05 · 走比較慢」，沒填的組不多一行',a1.sc&&a1.sc.cat==='mate'&&a1.cat==='mate'&&a1.sc.count===3&&JSON.stringify(a1.sc.leaders)==='["團員05","",""]'&&a1.meta.join('|')==='組長 團員05 · 走比較慢',a1);
    /* 相容：v3.24 的手機讀得到新存的情境（count、names、assign 都還在） */
    const cp=await p.evaluate(()=>scnReal().every(function(s){ return typeof s.count==='number'&&Array.isArray(s.names)&&s.names.length===s.count&&s.id&&s.name&&(s.assign===undefined||typeof s.assign==='object'); }));
    ck('新存的情境仍有舊版讀得懂的 id、name、count、names、assign（舊手機不會壞掉）',cp);
    const bad=await p.evaluate(()=>document.getElementById('view').innerText.indexOf('畫面顯示發生問題')>=0);
    ck('各分類畫面沒有跳出「畫面顯示發生問題」',!bad&&errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[4] 逐列編輯：新增、刪除、上移、下移，每個人的分組跟著重新對應',async()=>{
  { const {ctx,p,errs}=await open(b);
    const base=await p.evaluate(()=>{ var g=tgroups('meal'); return {sizes:Object.keys(g).map(function(k){ return g[k].length; }),g:g}; });
    ck('前提：用餐分桌 4 桌，各 9、9、9、6 人',base.sizes.join()==='9,9,9,6',base.sizes);
    const d1=await p.evaluate(()=>{ P.leader=true; P.tab='groups'; P.cat='meal'; P.scn='meal'; render(); ttap('#view [data-act="editScenario"][data-id="meal"]');
      var o={rows0:trows(),cnt:[].map.call(document.querySelectorAll('#sheetRoot .scn-row'),function(r){ var c=r.querySelector('.scn-cnt'); return c?c.textContent.replace(/[^\d]/g,''):''; }),
        title:document.querySelector('#sheetTitle').textContent,cats:document.querySelectorAll('#sheetRoot [data-act="scnCat"]').length,del:!!document.querySelector('#sheetRoot [data-act="delScenario"]'),
        up0:document.querySelector('#sheetRoot [data-act="scnRowMove"][data-i="0"][data-dir="-1"]').disabled,down3:document.querySelector('#sheetRoot [data-act="scnRowMove"][data-i="3"][data-dir="1"]').disabled};
      ttap('#sheetRoot [data-act="scnRowDel"][data-i="1"]'); o.rows1=trows(); o.openAfterDel=!!SHEET; o.qAfterDel=tops();
      ttap('#sheetRoot [data-act="saveScenario"]'); o.g=tgroups('meal'); o.names=scenario('meal').names.slice(); o.count=scenario('meal').count; o.q=tops(); return o; });
    ck('編輯情境：標題、四個分類、刪除鈕；每列寫出目前有幾人（9、9、9、6）；第一列不能上移、最後一列不能下移',d1.title==='編輯情境'&&d1.cats===4&&d1.del&&d1.cnt.join()==='9,9,9,6'&&d1.up0&&d1.down3,d1);
    ck('刪掉第 2 桌：畫面上只剩三列，按儲存之前什麼都沒寫（佇列是空的）',d1.rows1.join()==='第 1 桌,第 3 桌,第 4 桌'&&d1.openAfterDel&&d1.qAfterDel.length===0,d1);
    ck('儲存後：第 1 桌的人還在第 1 桌；原本第 3、4 桌的人自動換成第 2、3 組；原本第 2 桌的人回到尚未分組（沒有人跑到別桌）',JSON.stringify(d1.g[0])===JSON.stringify(base.g[0])&&JSON.stringify(d1.g[1])===JSON.stringify(base.g[2])&&JSON.stringify(d1.g[2])===JSON.stringify(base.g[3])&&Object.keys(d1.g).length===3&&d1.count===3&&d1.names.join()==='第 1 桌,第 3 桌,第 4 桌',{names:d1.names,sizes:Object.keys(d1.g).map(k=>d1.g[k].length)});
    ck('存檔是一筆整份 groups',d1.q.join()==='groups:(whole)',d1.q);
    const d2=await p.evaluate(()=>{ var before=tgroups('meal'); ttap('#view [data-act="editScenario"][data-id="meal"]'); ttap('#sheetRoot [data-act="scnRowMove"][data-i="0"][data-dir="1"]'); var rows=trows();
      ttap('#sheetRoot [data-act="saveScenario"]'); var after=tgroups('meal'); return {before:before,rows:rows,after:after,names:scenario('meal').names.slice()}; });
    ck('把第 1 列往下移：順序變成 第 3 桌、第 1 桌、第 4 桌，兩桌的人跟著換位置',d2.rows.join()==='第 3 桌,第 1 桌,第 4 桌'&&JSON.stringify(d2.after[0])===JSON.stringify(d2.before[1])&&JSON.stringify(d2.after[1])===JSON.stringify(d2.before[0])&&JSON.stringify(d2.after[2])===JSON.stringify(d2.before[2]),d2);
    const d3=await p.evaluate(()=>{ var before=tgroups('meal'); ttap('#view [data-act="editScenario"][data-id="meal"]'); ttap('#sheetRoot [data-act="scnRowMove"][data-i="1"][data-dir="-1"]'); ttap('#sheetRoot [data-act="scnRowMove"][data-i="0"][data-dir="1"]');
      ttap('#sheetRoot [data-act="scnRowAdd"]'); var rows=trows(); var focus=document.activeElement&&document.activeElement.name;
      var newCnt=document.querySelectorAll('#sheetRoot .scn-row')[3].querySelector('.scn-cnt');
      ttap('#sheetRoot [data-act="saveScenario"]'); var after=tgroups('meal'); var sc=scenario('meal');
      return {before:before,rows:rows,focus:focus,newCnt:!!newCnt,after:after,names:sc.names.slice(),count:sc.count}; });
    ck('先上移再下移回原位、再新增一組：新列取沒用過的預設名稱「第 2 桌」（不跟現有的重複）、游標放進新列的名稱欄、新列沒有人數提示',d3.rows.join()==='第 3 桌,第 1 桌,第 4 桌,第 2 桌'&&d3.focus==='g_name_3'&&!d3.newCnt,d3);
    ck('新增的一組是空的，其他三組的人沒有動',d3.count===4&&!d3.after[3]&&['0','1','2'].every(k=>JSON.stringify(d3.after[k])===JSON.stringify(d3.before[k])),d3);
    /* 取消不存 */
    const d4=await p.evaluate(()=>{ var before=JSON.stringify(scenario('meal')); var q0=tops().length; ttap('#view [data-act="editScenario"][data-id="meal"]');
      ttap('#sheetRoot [data-act="scnRowDel"][data-i="0"]'); tset('name','不會存'); ttap('#sheetRoot [data-act="sheetClose"]');
      return {same:before===JSON.stringify(scenario('meal')),open:!!SHEET,q:tops().length-q0}; });
    ck('改到一半按取消：資料完全沒變、也沒有送出任何修改',d4.same&&!d4.open&&d4.q===0,d4);
    /* 名稱空白、情境名稱空白 */
    const d5=await p.evaluate(()=>{ ttap('#view [data-act="editScenario"][data-id="meal"]'); tset('g_name_1',''); ttap('#sheetRoot [data-act="saveScenario"]'); var names=scenario('meal').names.slice();
      ttap('#view [data-act="editScenario"][data-id="meal"]'); var q0=tops().length; tset('name',''); var r=ttap('#sheetRoot [data-act="saveScenario"]'); var blocked={open:!!SHEET,toast:document.getElementById('toast').textContent,q:tops().length-q0}; ttap('#sheetRoot [data-act="sheetClose"]');
      return {names:names,blocked:blocked}; });
    ck('某一組的名稱留白：存成該類的預設名稱（第 2 桌）',d5.names[1]==='第 2 桌',d5.names);
    ck('情境名稱留白按儲存：表單不關、跳出提示、什麼都不送出',d5.blocked.open&&/請輸入情境名稱/.test(d5.blocked.toast)&&d5.blocked.q===0,d5.blocked);
    /* 組數上下限：最多 20 組、至少 1 組 */
    const d6=await p.evaluate(()=>{ topen('mate'); for(var i=0;i<25;i++) ttap('#sheetRoot [data-act="scnRowAdd"]'); var n=trows().length; var toast=document.getElementById('toast').textContent;
      var names=trows(); var uniq=new Set(names).size;
      for(var j=0;j<30;j++) ttap('#sheetRoot [data-act="scnRowDel"][data-i="0"]'); var left=trows().length; var toast2=document.getElementById('toast').textContent; var delDisabled=document.querySelector('#sheetRoot [data-act="scnRowDel"][data-i="0"]').disabled;
      closeSheet(); return {n:n,toast:toast,uniq:uniq,left:left,toast2:toast2,delDisabled:delDisabled}; });
    ck('一個情境最多 20 組（按第 21 次跳出提示），每一組的預設名稱都不重複',d6.n===20&&/最多 20 組/.test(d6.toast)&&d6.uniq===20,d6);
    ck('至少要有 1 組：只剩一列時刪除鈕停用',d6.left===1&&d6.delDisabled,d6);
    /* 換分類：留在同一個表單裡，已經填的字不會不見，看不到的欄位也保留 */
    const d7=await p.evaluate(()=>{ P.tab='groups'; P.cat='transport'; P.scn='air'; render(); ttap('#view [data-act="editScenario"][data-id="air"]');
      tset('name','航班改名'); tset('g_notes_0','桃園 T2（未存）'); var before=[].map.call(document.querySelectorAll('#sheetRoot [name]'),function(e){ return e.name; });
      ttap('#sheetRoot [data-act="scnCat"][data-cat="shop"]');
      var mid={title:document.querySelector('#sheetTitle').textContent,name:document.querySelector('#sheetRoot [name="name"]').value,rows:trows(),note0:document.querySelector('#sheetRoot [name="g_notes_0"]').value,
        hasBacks:!!document.querySelector('#sheetRoot [name="g_backs_0"]'),hasCard:!!document.querySelector('#sheetRoot [name="card"]'),on:[].filter.call(document.querySelectorAll('#sheetRoot [data-act="scnCat"]'),function(e){ return e.classList.contains('on'); }).map(function(e){ return e.getAttribute('data-cat'); }).join(),
        histOK:HIST.sheet===true};
      ttap('#sheetRoot [data-act="scnCat"][data-cat="transport"]');
      var back={backs:document.querySelector('#sheetRoot [name="g_backs_0"]').value,shorts:document.querySelector('#sheetRoot [name="g_shorts_0"]').value,note0:document.querySelector('#sheetRoot [name="g_notes_0"]').value,name:document.querySelector('#sheetRoot [name="name"]').value,card:document.querySelector('#sheetRoot [name="card"]').value};
      closeSheet(); return {mid:mid,back:back,before:before.length}; });
    ck('編輯航班時換到「逛街」：標題、名稱、組別、已經改的字都還在；交通專屬欄位（回程時間、首頁交通卡）消失',d7.mid.title==='編輯情境'&&d7.mid.name==='航班改名'&&d7.mid.rows.join()==='長榮航空,中華航空'&&d7.mid.note0==='桃園 T2（未存）'&&!d7.mid.hasBacks&&!d7.mid.hasCard&&d7.mid.on==='shop'&&d7.mid.histOK,d7.mid);
    ck('再換回「交通」：剛剛看不到的回程時間、徽章短名、首頁交通卡設定原樣回來',d7.back.backs==='12:05'&&d7.back.shorts==='長榮'&&d7.back.note0==='桃園 T2（未存）'&&d7.back.name==='航班改名'&&d7.back.card==='1',d7.back);
    const d8=await p.evaluate(()=>{ P.tab='groups'; P.cat='mate'; P.scn='hike'; render(); ttap('#view [data-act="editScenario"][data-id="hike"]'); ttap('#sheetRoot [data-act="scnCat"][data-cat="shop"]'); ttap('#sheetRoot [data-act="saveScenario"]');
      var sc=scenario('hike'); return {cat:sc.cat,cur:curCat(),names:sc.names.slice(),count:sc.count,inShop:scnAll().filter(function(s){ return scnCat(s)==='shop'; }).map(function(s){ return s.id; }).join(),inMate:scnAll().filter(function(s){ return scnCat(s)==='mate'; }).length}; });
    ck('把「健行分流」從旅伴改成逛街：存進去、跑到逛街分類，組別名稱不變',d8.cat==='shop'&&d8.inShop==='hike'&&d8.inMate===0&&d8.names.join()==='健走組,咖啡悠閒組',d8);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[5] 舊資料自動轉成「航班」情境：什麼都不遺失、什麼都不亂寫',async()=>{
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(()=>{ members().forEach(function(m,i){ m.airline=i<10?'eva':(i<20?'ci':''); });
      var a=scnLegacy(), o={}; o.sc=a&&JSON.parse(JSON.stringify(a)); a=a||{assign:{}};
      o.same=JSON.stringify(scnLegacy())===JSON.stringify(scnLegacy());
      o.q0=Store.q.length; ['home','plan','rooms','groups','tools','notes'].forEach(function(t){ P.tab=t; render(); }); P.tab='groups'; P.cat='transport'; render();
      o.q1=Store.q.length; o.realIds=scnReal().map(function(s){ return s.id; }); o.mig=S().settings.airMig; o.all=scnAll().map(function(s){ return s.id+(s._inj?'*':''); });
      o.g0=Object.keys(a.assign).filter(function(k){ return a.assign[k]===0; }).length; o.g1=Object.keys(a.assign).filter(function(k){ return a.assign[k]===1; }).length;
      return o; });
    ck('舊資料轉出來：分類交通、名稱「航班」、列在首頁交通卡、兩組＝長榮航空、中華航空',r.sc&&r.sc.cat==='transport'&&r.sc.name==='航班'&&r.sc.card===1&&r.sc.count===2&&r.sc.names.join()==='長榮航空,中華航空',r.sc);
    ck('徽章短名、集合地點、去程／回程時間原樣搬過來（長榮 09:00／12:05、華航 08:20／11:30）',!!r.sc&&r.sc.shorts.join()==='長榮,華航'&&r.sc.notes.join()==='桃園第二航廈,桃園第一航廈'&&r.sc.times.join()==='09:00,08:20'&&r.sc.backs.join()==='12:05,11:30',r.sc);
    ck('每位團員原本的 airline 對應到組：eva 前 10 位→第 1 組、ci 接著 10 位→第 2 組',r.g0===10&&r.g1===10,r);
    ck('只有畫面轉換：逛過每個分頁之後沒有送出任何修改、雲端的 groups 裡沒有 air、沒有搬家記號',r.q0===0&&r.q1===0&&r.realIds.join()==='meal,shuttle,hike'&&r.mig===undefined,r);
    ck('轉出來的情境排在最後（跟以前航空公司頁籤排在最後一樣）',r.all.join()==='meal,shuttle,hike,air*',r.all);
    ck('同一份資料算兩次結果一樣（每一支手機看到的都相同）',r.same);
    /* 兩支手機（兩個瀏覽器）算出來一樣 */
    const {ctx:ctx2,p:p2}=await open(b);
    const other=await p2.evaluate(()=>{ members().forEach(function(m,i){ m.airline=i<10?'eva':(i<20?'ci':''); }); return JSON.stringify(scnLegacy()); });
    ck('另一支手機（同樣的舊資料）轉出來的情境一模一樣',other===JSON.stringify(r.sc),{a:other.length,b:JSON.stringify(r.sc).length});
    await ctx2.close();
    /* 舊資料的自訂內容 */
    const c1=await p.evaluate(()=>{ var st=S().settings, orig=JSON.parse(JSON.stringify(st.airlines)); st.airlines={eva:{short:'長',name:'長榮客機',note:'T2 報到'},ci:{short:'華',name:'華航客機',note:''}}; st.airNote='請帶護照';
      var a=scnLegacy()||{names:[],shorts:[],notes:[]}; var o={names:a.names.join(),shorts:a.shorts.join(),notes:a.notes.join('|'),note:a.note}; delete st.airNote; o.noNote=(scnLegacy()||{}).note; st.airlines=orig; return o; });
    ck('自訂過的名稱、短名、集合說明、提醒都帶過來（沒改過的內建機場說明不帶）',c1.names==='長榮客機,華航客機'&&c1.shorts==='長,華'&&c1.notes==='T2 報到|'&&c1.note==='請帶護照'&&c1.noNote===undefined,c1);
    /* 沒有舊資料就不轉 */
    const c2=await p.evaluate(()=>{ var st=S().settings, keep={a:st.airlines,f:st.flights}; delete st.airlines; st.flights={note:'x',backPort:'y'}; members().forEach(function(m){ m.airline=''; }); var a=scnLegacy();
      st.airlines=keep.a; st.flights=keep.f; return a; });
    ck('沒有航空公司資料、也沒人有 airline：不會憑空冒出航班',c2===null,c2);
    await p.evaluate(()=>{ members().forEach(function(m,i){ m.airline=i<10?'eva':(i<20?'ci':''); }); });
    /* 首頁：航班格、集合地點格 */
    const h1=await p.evaluate(()=>{ P.leader=false; P.meId=members()[0].id; P.tab='home'; P.cat=''; P.scn=''; render();
      return {strip:[].map.call(document.querySelectorAll('.me-strip button'),function(e){ return e.querySelector('.k').textContent+'='+e.querySelector('.v').textContent.replace(/\s+/g,' ').trim(); }),
        badge:(document.querySelector('.me-strip .al')||{}).textContent,wide:document.querySelectorAll('.me-strip button.w2').length}; });
    ck('第 1 位（長榮）的首頁：航班＝長榮、航班集合＝桃園第二航廈、我的房號、用餐分桌、接駁車（航班那格只出現一次，順序跟以前一樣：航空公司、報到航廈、房號、其他分組）',h1.strip.join('|')==='航班=長榮 長榮|航班集合=桃園第二航廈|我的房號=待分配|用餐分桌=第 1 桌|接駁車=A 車',h1.strip);
    ck('集合地點短（桃園第二航廈）：那格維持一格寬，不佔兩格',h1.wide===0,h1.wide);
    /* 第一次修改：搬家 */
    const m1=await p.evaluate(()=>{ var beforeAll=JSON.stringify(scnAll().map(function(s){ var c=JSON.parse(JSON.stringify(s)); delete c._inj; return c; }));
      var id=members()[25].id; P.leader=true; P.tab='groups'; P.cat='transport'; P.scn='air'; render();
      ttap('#view .grp .gm .mc[data-id="'+id+'"]'); ttap('#sheetRoot [data-act="setGroup"][data-g="0"]');
      var afterAll=JSON.stringify(scnAll().map(function(s){ var c=JSON.parse(JSON.stringify(s)); delete c._inj; return c; }));
      var real=scnReal().filter(function(s){ return s.id==='air'; })[0]||{names:[],assign:{}};
      return {id:id,realIds:scnReal().map(function(s){ return s.id; }),mig:S().settings.airMig,q:tops(),inj:!!real._inj,cat:real.cat,card:real.card,names:real.names,assign:Object.keys(real.assign).length,
        idxOK:Store.q.some(function(o){ return o.path==='scenarios/'+scnReal().indexOf(real)+'/assign/'+id; }),
        same:beforeAll.replace(/"assign":\{[^}]*\}/g,'"assign":{}')===afterAll.replace(/"assign":\{[^}]*\}/g,'"assign":{}'),
        wholeHasAir:(function(){ var w=Store.q.filter(function(o){ return o.key==='groups'&&o.path===''; })[0]; return !!(w&&w.val.scenarios.some(function(s){ return s.id==='air'&&!s._inj; })); })(),
        strayInj:JSON.stringify(Store.q).indexOf('_inj')>=0}; });
    ck('第一次分組：舊航班情境真的存進 groups（不留暫時標記）、記下搬家記號 settings.airMig',m1.realIds.join()==='meal,shuttle,hike,air'&&m1.mig===1&&!m1.inj&&m1.cat==='transport'&&m1.card===1&&m1.wholeHasAir&&!m1.strayInj,m1);
    ck('送出的順序：先整份 groups（含航班）、再搬家記號、最後才是局部寫入 scenarios/3/assign/<團員>',m1.q.join()==='groups:(whole),settings:airMig,groups:scenarios/3/assign/'+m1.id&&m1.idxOK,m1.q);
    ck('搬家前後分組頁上看到的情境一模一樣（順序、名稱、時間、集合地點都沒變）',m1.same,m1);
    ck('舊的 20 位團員的分組帶過去、加上剛放進去的 1 位＝21 位',m1.assign===21,m1.assign);
    /* 另一支手機收到雲端的新資料：不會再轉一次、也沒有重複 */
    const o2=await p.evaluate(()=>{ var docs=JSON.parse(JSON.stringify(Store.s)); Store.q=[]; Store.applyRemote(docs); return {ids:scnAll().map(function(s){ return s.id+(s._inj?'*':''); }),n:scnAll().filter(function(s){ return s.id==='air'; }).length}; });
    ck('收到雲端快照（已搬家）之後：只有一個航班、不再是暫時的',o2.ids.join()==='meal,shuttle,hike,air'&&o2.n===1,o2);
    /* 不動 airline：編輯團員資料存檔不會把舊欄位蓋掉 */
    const s1=await p.evaluate(()=>{ var m=members()[0]; sheetMember(m.id); tset('name','團員01（改）'); ACT.saveMember(); var mm=members()[0]; return {airline:mm.airline,name:mm.name}; });
    ck('編輯團員資料存檔：不會動到舊的 airline 欄位（搬家前後都一樣）',s1.airline==='eva'&&s1.name==='團員01（改）',s1);
    /* 刪掉之後不會再冒出來（搬家記號）、重新整理也一樣 */
    const del=await p.evaluate(()=>{ P.leader=true; P.tab='groups'; P.cat='transport'; P.scn='air'; render(); ttap('#view [data-act="editScenario"][data-id="air"]');
      var btn=document.querySelector('#sheetRoot [data-act="delScenario"]'); ttap('#sheetRoot [data-act="delScenario"]'); var armed={still:!!scenario('air'),open:!!SHEET,label:btn.textContent};
      ttap('#sheetRoot [data-act="delScenario"]'); return {armed:armed,gone:!scenario('air'),ids:scnAll().map(function(s){ return s.id; }),mig:S().settings.airMig,q:tops().slice(-1)}; });
    ck('刪除要按兩次（第一次只變成「再按一次確定刪除…」），第二次才真的刪',del.armed.still&&del.armed.open&&/再按一次確定刪除/.test(del.armed.label)&&del.gone,del);
    ck('刪掉後不會又冒出來（搬家記號還在）',del.ids.join()==='meal,shuttle,hike'&&del.mig===1&&del.q.join()==='groups:(whole)',del);
    await p.reload(); await p.waitForTimeout(400);
    const rl=await p.evaluate(()=>({ids:scnAll().map(function(s){ return s.id; }),mig:S().settings.airMig}));
    ck('重新整理之後（資料從這支手機的快取讀回來）還是沒有航班',rl.ids.join()==='meal,shuttle,hike'&&rl.mig===1,rl);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }
  { /* 還沒搬家就刪：只記下搬家記號，不動 groups */
    const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(()=>{ members().forEach(function(m,i){ m.airline=i<10?'eva':''; }); P.leader=true; P.tab='groups'; P.cat='transport'; P.scn='air'; render(); ttap('#view [data-act="editScenario"][data-id="air"]');
      ttap('#sheetRoot [data-act="delScenario"]'); ttap('#sheetRoot [data-act="delScenario"]');
      return {ids:scnAll().map(function(s){ return s.id; }),real:scnReal().map(function(s){ return s.id; }),mig:S().settings.airMig,q:tops(),cur:curCat()}; });
    ck('還沒搬家（只存在畫面上）就刪掉：只送出設定（搬家記號），groups 一個字都沒動；停在交通分類',r.ids.join()==='meal,shuttle,hike'&&r.real.join()==='meal,shuttle,hike'&&r.mig===1&&r.q.join()==='settings:(whole)'&&r.cur==='transport',r);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[6] 名單、點名、團員資料卡：小圓徽章來自交通分類',async()=>{
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(()=>{ members().forEach(function(m,i){ m.airline=i<10?'eva':(i<20?'ci':''); }); var o={};
      P.leader=false; P.tab='rooms'; P.roomsSeg='list'; P.q=''; render();
      var card=function(id){ return document.querySelector('#view .mc[data-id="'+id+'"]'); };
      var b1=card(members()[0].id).querySelector('.al'), b2=card(members()[10].id).querySelector('.al');
      o.rosterBadges=[b1&&b1.textContent+'/'+b1.style.backgroundColor, b2&&b2.textContent+'/'+b2.style.backgroundColor, !!card(members()[25].id).querySelector('.al')];
      o.right=card(members()[0].id).querySelector('.rt').textContent.replace(/\s+/g,' ').trim();
      P.roomsSeg='rooms'; render(); o.roomsCards=document.querySelectorAll('#view .mc .al').length;
      P.tab='groups'; P.cat='meal'; P.scn='meal'; render(); o.groupCards=document.querySelectorAll('#view .gm .mc .al').length;
      P.cat='transport'; P.scn='air'; render(); o.trCards=document.querySelectorAll('#view .gm .mc .al').length; o.trHeads=document.querySelectorAll('#view .grp h3 .al').length;
      P.leader=true; P.tab='tools'; P.tool='rollcall'; render(); P.leader=false; var rc=document.querySelector('#view .rc [data-id="'+members()[0].id+'"] .al'); o.rollcall=rc&&rc.textContent;
      /* 團員資料卡 */
      P.tab='rooms'; P.roomsSeg='list'; render(); sheetMemberView(members()[10].id); var t=document.getElementById('sheetRoot').innerText.replace(/\s+/g,' '); o.viewCi=t; closeSheet();
      sheetMemberView(members()[25].id); o.viewNone=document.getElementById('sheetRoot').innerText.replace(/\s+/g,' '); closeSheet(); return o; });
    ck('名單：長榮的人是綠色「長榮」、華航的人是紅色「華航」，沒分到的人沒有徽章',r.rosterBadges[0]==='長榮/rgb(10, 122, 76)'&&r.rosterBadges[1]==='華航/rgb(196, 24, 79)'&&r.rosterBadges[2]===false,r.rosterBadges);
    ck('名單右邊那行小字：房號之外是「餐飲的桌次 · 接駁車的組別」（不重複徽章那個交通）',/第 1 桌 · A 車/.test(r.right)&&!/長榮/.test(r.right),r.right);
    ck('房號頁、分組頁（餐飲）的團員卡片沒有徽章；交通分組頁的卡片沒有、組別標題才有',r.roomsCards===0&&r.groupCards===0&&r.trCards===0&&r.trHeads===2,r);
    ck('集合點名：名字旁邊有徽章',r.rollcall==='長榮',r.rollcall);
    ck('團員資料卡：航班一列＝華航名稱＋搭乘與回程時間＋集合地點；也列出用餐分桌、接駁車',/航班 華航 中華航空 · 搭乘 08:20 · 回程 11:30 · 桃園第一航廈/.test(r.viewCi)&&/用餐分桌 第 \d 桌/.test(r.viewCi)&&/接駁車 [AB] 車/.test(r.viewCi),r.viewCi);
    ck('沒分到航班的人：資料卡寫「航班 尚未設定」',/航班 尚未設定/.test(r.viewNone),r.viewNone);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[7] 首頁交通卡（原本的航班卡）：去程、回程、待公布、空的時候',async()=>{
  for(const [when,label,expect] of [['2026-09-21T14:00','出發前','去'],['2026-09-24T12:30','第 1 天','去'],['2026-09-27T10:00','第 4 天','回']]){
    const {ctx,p,errs}=await (async()=>{ const ctx=await b.newContext({viewport:{width:375,height:760}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e))); await p.addInitScript(HELP); await p.clock.install({time:new Date(when+':00+08:00')}); await p.goto(FILE); await p.waitForTimeout(350); return {ctx,p,errs}; })();
    const r=await p.evaluate(()=>{ members().forEach(function(m,i){ m.airline=i<10?'eva':(i<20?'ci':''); }); S().broadcast={time:'',label:'',location:'',tip:'',idle:false}; S().settings.zones={manual:{flight:'now'},mode:'card',prepUntil:'start'}; P.cards={flight:{o:1,ts:9e12}}; P.meId=members()[0].id; P.tab='home'; render();
      var c=[].filter.call(document.querySelectorAll('.ccard'),function(x){ return x.querySelector('[data-id="flight"]'); })[0];
      return {txt:c?c.innerText.replace(/\s+/g,' '):'',cols:c?[].map.call(c.querySelectorAll('.fl-col'),function(e){ return e.innerText.replace(/\s+/g,' '); }):[]}; });
    if(expect==='去'){
      ck(label+'：去程交通，先出發的在前（華航 08:20 → 長榮 09:00），每組寫「去程出發 · 集合地點」',/去程交通/.test(r.txt)&&r.cols.length===2&&/中華航空.*08:20.*去程出發 · 桃園第一航廈/.test(r.cols[0])&&/長榮航空.*09:00.*去程出發 · 桃園第二航廈/.test(r.cols[1]),r);
    } else {
      ck(label+'：回程交通，先出發的在前（華航 11:30 → 長榮 12:05），寫「回程出發 · 河內內排機場」，看不到去程時間',/回程交通/.test(r.txt)&&/中華航空.*11:30.*回程出發 · 河內內排機場/.test(r.cols[0])&&/長榮航空.*12:05/.test(r.cols[1])&&!/08:20|09:00|去程/.test(r.txt),r);
    }
    ck(label+'：沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }
  { const {ctx,p,errs}=await open(b,{noSeed:true});
    const r=await p.evaluate(()=>{ S().settings.startDate='2026-09-24'; S().settings.days=5; P.meId=''; P.tab='home'; render();
      var has=function(){ return [].some.call(document.querySelectorAll('.ccard'),function(x){ return x.querySelector('[data-id="flight"]'); }); };
      var o={emptyNoCard:has(),cutoff:twCutoff()};
      /* 沒有任何時間、但有去程集合說明：卡片只剩那段說明 */
      S().settings.flights={note:'05:30 在機場集合'}; S().broadcast={time:'07:00'}; render(); o.noteOnly=has(); return o; });
    ck('全新（沒有任何交通）：首頁沒有交通卡；台灣時間分界用預設 09:00',!r.emptyNoCard&&r.cutoff==='09:00',r);
    ck('沒有交通時間、只有去程集合說明：卡片仍顯示那段說明',r.noteOnly,r);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[8] 團務設定：交通改到分組，這裡只留回程出發地與去程集合說明',async()=>{
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(()=>{ P.leader=true; sheetSettings(); var sh=document.getElementById('sheetRoot'); var names=[].map.call(sh.querySelectorAll('[name]'),function(e){ return e.name; });
      var o={names:names,txt:sh.innerText.replace(/\s+/g,' '),go:!!sh.querySelector('[data-act="tab"][data-cat="transport"]')};
      tset('backPort','成田機場'); tset('flight_note','05:30 在第二航廈集合'); ACT.saveSettings(); var f=S().settings.flights;
      o.flights={eva:f.eva,ci:f.ci,note:f.note,backPort:f.backPort}; sheetSettings(); ttap('#sheetRoot [data-act="tab"][data-cat="transport"]');
      o.after={tab:P.tab,cat:curCat(),sheet:!!SHEET}; return o; });
    ck('團務設定不再有各家航空的起飛時間欄位（eva_out、ci_back…），仍有回程出發地與去程集合說明',!r.names.some(n=>/^(eva|ci)_/.test(n))&&r.names.includes('backPort')&&r.names.includes('flight_note'),r.names);
    ck('團務設定有「前往分組 → 交通」的按鈕，文字不再提航空公司',r.go&&!/航空公司/.test(r.txt),r.txt.slice(0,200));
    ck('存檔時保留舊格式的 eva／ci 起飛時間（搬家之前還要拿它轉成航班），只更新集合說明與回程出發地',r.flights.eva&&r.flights.eva.out==='09:00'&&r.flights.ci&&r.flights.ci.back==='11:30'&&r.flights.note==='05:30 在第二航廈集合'&&r.flights.backPort==='成田機場',r.flights);
    ck('按「前往分組 → 交通」：關掉設定表單、跳到分組頁的交通分類',r.after.tab==='groups'&&r.after.cat==='transport'&&!r.after.sheet,r.after);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[9] 全新（什麼都沒有）與雲端把空陣列拿掉之後',async()=>{
  { const {ctx,p,errs}=await open(b,{noSeed:true});
    const r=await p.evaluate(()=>{ var o={}; P.leader=false; P.tab='groups'; P.cat=''; P.scn=''; render();
      o.bar=[].map.call(document.querySelectorAll('#view .catbar button'),function(x){ return x.textContent.trim()+(x.classList.contains('on')?'*':''); }).join();
      o.txt=tview(); o.n=scnAll().length;
      var mm={id:'m1',name:'甲'}; members().push(mm); P.meId='m1'; P.tab='home'; render(); o.stripBefore=[].map.call(document.querySelectorAll('.me-strip .k'),function(e){ return e.textContent; }); P.tab='groups'; render();
      P.leader=true; render(); o.leaderTxt=tview();
      /* 雲端回來的空殼：groups 是 {_ts,_cleared}，沒有 scenarios（連名單也是空殼，等一下要再放一位團員） */
      Store.applyRemote({groups:{_ts:1,_cleared:1},settings:{_ts:1,_cleared:1,pinHash:'x'},members:{_ts:1,_cleared:1}});
      o.afterCleared={n:scnAll().length,hasArr:Array.isArray(S().groups.scenarios)};
      /* 新增第一個情境：東西要真的掛在文件上（Firebase 不存空陣列，這是 v3.22 修過的那種洞） */
      topen('transport'); o.cardDefault=document.querySelector('#sheetRoot [name="card"]').value; tset('name','遊覽車'); tfill(0,{name:'一號車',times:'07:30',notes:'飯店大廳'});
      ttap('#sheetRoot [data-act="saveScenario"]');
      var w=Store.q.filter(function(x){ return x.key==='groups'; }).slice(-1)[0];
      o.saved={n:(S().groups.scenarios||[]).length,cleared:S().groups._cleared,opN:w&&w.val.scenarios&&w.val.scenarios.length,opCleared:w&&w.val._cleared,opPath:w&&w.path,cur:(curScn()||{}).name};
      /* 第一個交通情境（預設列在首頁交通卡）建好了但這個人還沒分組：首頁那格寫「待設定」，主辦人才知道漏了 */
      members().push({id:'m1',name:'甲'}); P.meId='m1'; P.leader=false; P.tab='home'; render(); o.stripAfter=[].map.call(document.querySelectorAll('.me-strip button'),function(e){ return e.querySelector('.k').textContent+'='+e.querySelector('.v').textContent.replace(/\s+/g,' ').trim(); });
      return o; });
    ck('全新：四個分類都在、沒有任何情境、也沒有憑空出現的航班',r.bar==='交通*,餐飲,逛街,旅伴'&&r.n===0&&/「交通」還沒有情境/.test(r.txt)&&/主辦人還沒有建立/.test(r.txt),{bar:r.bar,n:r.n,txt:r.txt.slice(0,160)});
    ck('管理者看到的說明教他按「新增情境」，並舉例（航班、接駁車、火車）',/按上面的「新增情境」建立，例如：航班、接駁車、火車/.test(r.leaderTxt),r.leaderTxt.slice(0,200));
    ck('清空後（雲端回來的空殼）：情境是空的，空陣列有掛回 groups 上',r.afterCleared.n===0&&r.afterCleared.hasArr,r.afterCleared);
    ck('全新的第一個交通情境預設列在首頁交通卡',r.cardDefault==='1',r.cardDefault);
    ck('新增第一個情境：真的存進 groups（掛在文件上、拿掉「已清空」標記、整份存檔含 1 個情境）',r.saved.n===1&&r.saved.cleared===undefined&&r.saved.opN===1&&r.saved.opCleared===undefined&&r.saved.opPath==='',r.saved);
    ck('存完停在剛建的情境',r.saved.cur==='遊覽車',r.saved);
    ck('全新、還沒有任何交通情境時，首頁「我的資訊」只有房號（沒有憑空冒出「待設定」）',r.stripBefore.join()==='我的房號',r.stripBefore);
    ck('第一個交通情境建好後、這個人還沒分組：首頁多一格「遊覽車＝待設定」',r.stripAfter.join('|')==='遊覽車=待設定|我的房號=待分配',r.stripAfter);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }
  { /* 雲端資料的樣子：Firebase 會把空字串、空物件拿掉，陣列缺洞會變成物件 */
    const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(()=>{ var g=S().groups; g.scenarios.push({id:'weird',name:'怪資料',cat:'transport',count:3,names:{0:'甲',2:'丙'},times:{1:'08:00'},notes:{2:'大廳'}});
      P.leader=true; P.tab='groups'; P.cat='transport'; P.scn='weird'; render();
      var o={heads:[].map.call(document.querySelectorAll('#view .grp h3 .tn'),function(e){ return e.textContent; }).slice(0,3),meta:[].map.call(document.querySelectorAll('#view .grp .grp-meta'),function(e){ return e.textContent; }),bad:/畫面顯示發生問題/.test(tview())};
      ttap('#view [data-act="editScenario"][data-id="weird"]'); o.rows=trows(); closeSheet();
      var sc=g.scenarios.filter(function(s){ return s.id==='weird'; })[0]; delete sc.assign; delete sc.count; P.scn='weird'; render(); o.noCount=/畫面顯示發生問題/.test(tview()); o.noCountHasGroups=document.querySelectorAll('#view .grp').length; o.noCountOnlyUn=/^尚未分組/.test((document.querySelector('#view .grp h3')||{}).textContent||'');
      return o; });
    ck('names、times、notes 缺洞（Firebase 拿掉空值後變成物件）：缺的名稱用預設（第 2 組要用 B 車）、缺的欄位當空白，不會壞掉',r.heads.join()==='甲,B 車,丙'&&r.meta.join('|')==='搭乘 08:00|大廳'&&!r.bad&&r.rows.join()==='甲,B 車,丙',r);
    ck('連 count、assign 都沒有的情境：畫面不壞，沒有組別、所有人都在「尚未分組」',!r.noCount&&r.noCountHasGroups===1&&r.noCountOnlyUn,r);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[10] 一鍵隨機分組：交通不放（人是固定的，不是抽籤）；其他分類照舊',async()=>{
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(()=>{ var o={}; P.leader=true; P.tab='groups';
      P.cat='transport'; P.scn='air'; render(); o.trShuffle=!!document.querySelector('#view [data-act="shuffle"]'); o.trClear=!!document.querySelector('#view [data-act="clearGroups"]'); o.trEdit=!!document.querySelector('#view [data-act="editScenario"][data-id="air"]');
      P.cat='meal'; P.scn='meal'; render(); o.mealShuffle=!!document.querySelector('#view [data-act="shuffle"]');
      /* 旅伴 17 組（兩人一組）隨機分：每組人數差不超過 1 個房間單位 */
      topen('mate'); tset('name','兩人一組'); for(var i=0;i<14;i++) ttap('#sheetRoot [data-act="scnRowAdd"]'); ttap('#sheetRoot [data-act="saveScenario"]');
      var sc=scenario(); o.cnt=sc.count; ttap('#view [data-act="shuffle"]'); var g=tgroups(sc.id); var sizes=Object.keys(g).map(function(k){ return g[k].length; });
      o.sizes=sizes; o.total=sizes.reduce(function(a,b2){ return a+b2; },0); o.q=tops().slice(-1);
      /* 交通的分組（直接呼叫）：還沒搬家的航班要先存進去再分，不會壞 */
      P.cat='transport'; P.scn='air'; var before=scnAll().some(function(s){ return s._inj; }); ACT.shuffle(); o.afterTr={inj:scnAll().some(function(s){ return s._inj; }),before:before,assigned:Object.keys(scenario('air').assign||{}).length};
      return o; });
    ck('交通分類沒有「一鍵隨機分組」，但有「編輯情境」與「一鍵清除分組」；餐飲分類仍有隨機分組',!r.trShuffle&&r.trClear&&r.trEdit&&r.mealShuffle,r);
    ck('旅伴 17 組隨機分：33 人都有分到、每組 1～3 人',r.cnt===17&&r.total===33&&Math.max(...r.sizes)-Math.min(...r.sizes)<=1,r);
    ck('隨機分組是一筆整份 groups 存檔',r.q.join()==='groups:(whole)',r.q);
    ck('（防呆）直接對還沒搬家的航班分組：會先存進去再分，33 人都分到',r.afterTr.before&&!r.afterTr.inj&&r.afterTr.assigned===33,r.afterTr);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[11] 資料裡塞 HTML：所有地方只顯示成文字',async()=>{
  { const {ctx,p,errs}=await open(b);
    const X='<img src=x onerror="window.__xss=1">';
    const r=await p.evaluate(X=>{ window.__xss=0; var o={};
      topen('transport'); tset('name','車'+X); tset('note','提醒'+X); tfill(0,{name:'甲'+X,notes:'地點'+X,shorts:'<b>',times:'07:30'}); tfill(1,{name:'乙',times:'08:00'});
      ttap('#sheetRoot [data-act="saveScenario"]');
      var sc=scenario(); o.saved=sc.name.indexOf('<img')>=0;
      o.viewImg=document.querySelectorAll('#view img,#view script').length; o.tview=tview().indexOf('<img')>=0; o.badge=[].map.call(document.querySelectorAll('#view .grp h3 .al'),function(e){ return e.textContent; }).join();
      /* 首頁「我的資訊」、名單、資料卡、移動表單、編輯表單 */
      var ids=[members()[3].id]; ttap('#view .grp .gm .mc[data-id="'+ids[0]+'"]'); o.moveImg=document.querySelectorAll('#sheetRoot img,#sheetRoot script').length; ttap('#sheetRoot [data-act="setGroup"][data-g="0"]');
      P.leader=false; P.meId=ids[0]; P.tab='home'; render(); o.homeImg=document.querySelectorAll('#view img,#view script').length;
      P.tab='rooms'; P.roomsSeg='list'; render(); o.rosterImg=document.querySelectorAll('#view img,#view script').length; sheetMemberView(ids[0]); o.viewCardImg=document.querySelectorAll('#sheetRoot img,#sheetRoot script').length; closeSheet();
      P.leader=true; P.tab='groups'; P.cat='transport'; P.scn=sc.id; render(); ttap('#view [data-act="editScenario"][data-id="'+sc.id+'"]'); o.editImg=document.querySelectorAll('#sheetRoot img,#sheetRoot script').length;
      o.editValue=document.querySelector('#sheetRoot [name="g_notes_0"]').value===('地點'+X); o.editName=document.querySelector('#sheetRoot [name="name"]').value===('車'+X);
      o.editRowName=document.querySelector('#sheetRoot [name="g_name_0"]').value===('甲'+X); o.editShort=document.querySelector('#sheetRoot [name="g_shorts_0"]').value==='<b>'; o.editNote=document.querySelector('#sheetRoot [name="note"]').value===('提醒'+X); closeSheet();
      P.tab='home'; P.leader=false; P.cards={flight:{o:1,ts:9e12}}; S().settings.zones={manual:{flight:'now'},mode:'card'}; render(); o.cardImg=document.querySelectorAll('#view img,#view script').length;
      /* 首頁交通卡：勾了列出之後 */
      sc.card=1; S().settings.days=5; render(); o.cardImg2=document.querySelectorAll('#view img,#view script').length;
      /* 餐飲、逛街、旅伴的欄位 */
      P.leader=true; topen('meal'); tset('name','餐'+X); tset('sf_place','店'+X); tfill(0,{name:'桌'+X,notes:'備'+X}); ttap('#sheetRoot [data-act="saveScenario"]');
      var t1=document.querySelectorAll('#view img,#view script').length; var mealId=scenario().id;
      ttap('#view [data-act="editScenario"][data-id="'+mealId+'"]'); o.mealRound=[document.querySelector('#sheetRoot [name="sf_place"]').value===('店'+X),document.querySelector('#sheetRoot [name="g_name_0"]').value===('桌'+X),document.querySelector('#sheetRoot [name="g_notes_0"]').value===('備'+X)]; closeSheet();
      topen('mate'); tset('name','伴'+X); tfill(0,{name:'組'+X,leaders:'長'+X,notes:'備'+X}); ttap('#sheetRoot [data-act="saveScenario"]'); var t2=document.querySelectorAll('#view img,#view script').length; var mateId=scenario().id;
      ttap('#view [data-act="editScenario"][data-id="'+mateId+'"]'); o.mateRound=[document.querySelector('#sheetRoot [name="g_leaders_0"]').value===('長'+X),document.querySelector('#sheetRoot [name="g_name_0"]').value===('組'+X)]; closeSheet();
      o.others=[t1,t2]; o.xss=window.__xss; return o; },X);
    ck('餐飲、旅伴的餐廳、桌名、桌位說明、組長、組名，重新打開編輯表單都跟原本一模一樣',r.mealRound.every(Boolean)&&r.mateRound.every(Boolean),{m:r.mealRound,a:r.mateRound});
    ck('資料存進去的是原始字串（沒有被改掉），畫面與表單欄位裡都只是文字（情境名稱、組別名稱、上車地點、徽章短名、提醒重新打開都跟原本一模一樣）',r.saved&&r.tview&&r.editValue&&r.editName&&r.editRowName&&r.editShort&&r.editNote,r);
    ck('分組頁、移動表單、首頁、名單、資料卡、編輯表單、首頁交通卡：都沒有變成真的 <img>／<script>',r.viewImg===0&&r.moveImg===0&&r.homeImg===0&&r.rosterImg===0&&r.viewCardImg===0&&r.editImg===0&&r.cardImg===0&&r.cardImg2===0&&r.others.join()==='0,0',r);
    ck('沒有任何一段腳本被執行（window.__xss 還是 0）',r.xss===0,r.xss);
    ck('徽章短名塞 <b> 也只是文字',r.badge.indexOf('<b>')>=0||r.badge.indexOf('<b')>=0,r.badge);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[12] 讀取不會偷偷改資料；轉換出來的暫時情境不會被存進去',async()=>{
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(()=>{ members().forEach(function(m,i){ m.airline=i<10?'eva':''; });
      var before=JSON.stringify(Store.s); ['home','plan','rooms','groups','tools','notes'].forEach(function(t){ P.tab=t; render(); });
      P.tab='groups'; ['transport','meal','shop','mate'].forEach(function(c){ P.cat=c; P.scn=''; render(); });
      P.leader=true; render(); sheetScenario('air'); closeSheet(); sheetMemberView(members()[0].id); closeSheet(); sheetHomeScn(); closeSheet();
      var after=JSON.stringify(Store.s); return {same:before===after,q:Store.q.length,inj:JSON.stringify(Store.s).indexOf('_inj')>=0}; });
    ck('逛過所有分頁、分類、表單（不按儲存）：資料一個字都沒變、沒有排任何存檔',r.same&&r.q===0&&!r.inj,r);
    /* 首頁分組顯示：航班也在清單裡，關掉後首頁不列（分組頁照常） */
    const h=await p.evaluate(()=>{ P.leader=true; sheetHomeScn(); var rows=[].map.call(document.querySelectorAll('#sheetRoot .it-row b'),function(e){ return e.textContent; });
      ttap('#sheetRoot [data-act="toggleHomeScn"][data-id="air"]'); closeSheet(); P.leader=false; P.meId=members()[0].id; P.tab='home'; render();
      var stripK=[].map.call(document.querySelectorAll('.me-strip .k'),function(e){ return e.textContent; }); P.tab='groups'; P.cat='transport'; P.scn='air'; render();
      return {rows:rows,stripK:stripK,inGroups:document.querySelectorAll('#view .grp').length,hidden:S().settings.hiddenScn}; });
    ck('管理專區「首頁分組顯示」也列出航班；關掉後首頁「我的資訊」不再顯示它，分組頁還在',h.rows.includes('航班')&&!h.stripK.some(k=>/航班/.test(k))&&h.inGroups>0&&h.hidden&&h.hidden.air===true,h);
    ck('沒有 JS 錯誤',errs.length===0,errs);
    await ctx.close(); }

  });

  await sect('\n[13] 版面：320／375／390 × 標準／大／特大 × 淺色／深色',async()=>{
  const SIZES=[[320,'md',false],[320,'lg',false],[320,'xl',false],[320,'xl',true],[375,'md',true],[375,'xl',false],[390,'xl',true]];
  for(const [w,fs,dark] of SIZES){
    const ctx=await b.newContext({viewport:{width:w,height:740},colorScheme:dark?'dark':'light'}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.addInitScript(HELP); await p.clock.install({time:T0}); await p.goto(FILE); await p.waitForTimeout(350);
    const tag=`${w}/${fs}/${dark?'深':'淺'}`;
    const r=await p.evaluate(fs=>{ P.fs=fs; members().forEach(function(m,i){ m.airline=i<10?'eva':(i<20?'ci':''); }); S().settings.airlines.eva.note='桃園第二航廈北側 3 號門旁的團體報到櫃檯'; P.meId=members()[0].id; P.leader=true;
      /* 兩個很長的名稱：交通組別、情境名稱 */
      var hair=scenario('hike'); var o={bad:[]};
      var view=function(name,setup){ setup(); render();
        var ov=document.documentElement.scrollWidth>document.documentElement.clientWidth;
        var wrap=[]; document.querySelectorAll('.catbar button span,.me-strip .k,.chip,.grp h3 .n').forEach(function(el){ var t=el.textContent.trim(); if(!t) return; var h1=el.getBoundingClientRect().height, pv=el.style.whiteSpace; el.style.whiteSpace='nowrap'; var h2=el.getBoundingClientRect().height; el.style.whiteSpace=pv; if(h1>h2*1.35) wrap.push(t); });
        var strip=[].filter.call(document.querySelectorAll('.me-strip button'),function(e){ return e.scrollWidth>e.clientWidth+1; }).length;
        var bar=[].map.call(document.querySelectorAll('.catbar button'),function(e){ var r=e.getBoundingClientRect(); return Math.round(r.height); });
        var fb=/畫面顯示發生問題/.test(tview());
        if(ov||wrap.length||strip||fb||bar.some(function(h){ return h<44; })) o.bad.push({name:name,ov:ov,wrap:wrap,strip:strip,fb:fb,bar:bar}); };
      view('home',function(){ P.tab='home'; P.cat=''; P.scn=''; }); o.wide=document.querySelectorAll('.me-strip button.w2').length;
      ['transport','meal','shop','mate'].forEach(function(c){ view('groups-'+c,function(){ P.tab='groups'; P.cat=c; P.scn=(c==='transport'?'air':(c==='meal'?'meal':(c==='mate'?'hike':''))); }); });
      view('groups-shuttle',function(){ P.tab='groups'; P.cat='transport'; P.scn='shuttle'; });
      view('roster',function(){ P.tab='rooms'; P.roomsSeg='list'; });
      /* 編輯表單 */
      var sheetBad=[]; var sheet=function(name,fn){ fn(); var sh=document.querySelector('.sheet'); var sb=sh.querySelector('.sheet-b'), R=sb.getBoundingClientRect(), bad=[];
        sb.querySelectorAll('*').forEach(function(e){ var r=e.getBoundingClientRect(); if(r.width&&(r.right>R.right+1||r.left<R.left-1)) bad.push(e.tagName+'.'+e.className); });
        var ins=[].map.call(sb.querySelectorAll('.scn-rh .in'),function(e){ return Math.round(e.getBoundingClientRect().width); });
        var btns=[].map.call(sb.querySelectorAll('.scn-rh .btn'),function(e){ var r=e.getBoundingClientRect(); return [Math.round(r.width),Math.round(r.height)]; });
        var sels=[].map.call(sb.querySelectorAll('.scn-row .tf select'),function(e){ return Math.round(e.getBoundingClientRect().width); });
        var lab=[].map.call(sb.querySelectorAll('.scn-row .f>label'),function(e){ return e.scrollWidth>e.clientWidth+1; }).some(Boolean);
        if(sb.scrollWidth>sb.clientWidth+1||sh.scrollWidth>sh.clientWidth+1||bad.length||Math.min.apply(null,ins)<110||btns.some(function(x){ return x[0]<40||x[1]<44; })||(sels.length&&Math.min.apply(null,sels)<2.9*parseFloat(getComputedStyle(document.documentElement).fontSize))||lab) sheetBad.push({name:name,sw:sb.scrollWidth+'>'+sb.clientWidth,bad:bad.slice(0,4),ins:ins,btns:btns.slice(0,3),sels:sels.slice(0,4),lab:lab});
        closeSheet(); };
      sheet('edit-air',function(){ sheetScenario('air'); });
      sheet('new-transport',function(){ sheetScenario('','transport'); });
      sheet('new-meal',function(){ sheetScenario('','meal'); });
      sheet('new-mate',function(){ sheetScenario('','mate'); });
      sheet('move',function(){ P.tab='groups'; P.cat='transport'; P.scn='air'; render(); sheetMoveMember2(members()[0].id); });
      o.sheetBad=sheetBad; return o; },fs);
    ck(tag+'：首頁、四個分類、名單都沒有溢出／斷行／被切；分類按鈕 ≥ 44px',r.bad.length===0,r.bad);
    ck(tag+'：很長的集合地點（20 個字）那格佔兩格寬，不擠成又窄又高的一條',r.wide===1,r.wide);
    ck(tag+'：編輯表單沒有橫向溢出，名稱欄 ≥ 110px、按鈕 ≥ 44px 高、時間下拉 ≥ 2.9 個字寬（數字不被小箭頭壓住）',r.sheetBad.length===0,r.sheetBad);
    ck(tag+'：沒有 JS 錯誤',errs.length===0,errs);
    if(w===320&&fs==='xl'&&!dark){ await p.evaluate(()=>{ P.leader=true; P.tab='groups'; P.cat='transport'; P.scn='air'; render(); sheetScenario('air'); }); await shot(p,'editor-320-xl'); }
    await ctx.close(); }

  });

  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  await b.close();
  process.exit(fails?1:0);
})();

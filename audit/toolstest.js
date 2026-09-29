/* v3.23 工具頁通用化：知識小卡、外語圖卡、外幣速算、計程車卡、緊急電話都變成「資料」，主辦人可以編輯、清空、套用範本；
   時間也改成「目的地時區」。這支測試實際點畫面上的按鈕走過每一種編輯，並確認：
   - 簡易標記的每一種寫法都變成對的東西，而且雲端資料裡的 <script>、壞掉的顏色值不會變成網頁的一部分
   - 清空、刪除、套用範本之前都會留一份上一版，救得回來
   - 清空後從雲端回來（Firebase 把空陣列拿掉）再新增，東西真的掛在文件上
   - 時差、夏令時間、美國／紐西蘭這種跟台灣差很多的目的地，出發日算得對
   - 全新（沒有任何資料）時是空殼，工具頁是通用版，畫面上不會出現越南的字
   用法：node audit/toolstest.js [--shots] */
const {chromium,FILE,at,outboundBlocked}=require('./_lib');
const SHOTS=process.argv.includes('--shots');
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x).slice(0,300));} else console.log('  ✓',n); };
const T0=new Date('2026-09-20T10:00:00+08:00');   /* 出發前（跟其他測試一樣固定時鐘） */
const shot=async(p,name)=>{ if(SHOTS) await p.screenshot({path:at(`shots/tools-${name}.png`)}); };
const HELP=()=>{
  window.sleep=function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
  /* 點畫面上的按鈕（跟真人一樣走事件代理），找不到就回 false */
  window.tap=function(sel,root){ var e=(root||document).querySelector(sel); if(!e) return false; e.click(); return true; };
  window.setv=function(name,v){ var e=document.querySelector('#sheetRoot [name="'+name+'"]'); if(!e) return false; e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return true; };
  window.txt=function(sel){ var e=document.querySelector(sel); return e?e.innerText:''; };
  window.lastOp=function(){ return Store.q.filter(function(o){ return o.key==='tools'; }).slice(-1)[0]||null; };
};
async function open(b,opt){
  const ctx=await b.newContext(Object.assign({viewport:{width:375,height:740}},opt||{}));
  const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(String(e)));
  await p.addInitScript(HELP);
  await p.clock.install({time:T0});
  await p.goto(FILE); await p.waitForTimeout(400);
  return {ctx,p,errs};
}
(async()=>{
  const b=await chromium.launch();

  console.log('\n[0] 安全：測試瀏覽器連不到外面');
  { const {ctx,p}=await open(b);
    const r=await p.evaluate(()=>({mode:Store.mode,backend:Store.backend}));
    ck('Firebase 的 SDK 被擋下，停在單機（不會寫進正式資料庫）',r.mode!=='cloud'&&outboundBlocked()>0,Object.assign(r,{blocked:outboundBlocked()}));
    await ctx.close(); }

  console.log('\n[1] 全新（沒有任何資料）：空殼＋通用版工具頁');
  { const {ctx,p,errs}=await open(b,{noSeed:true});
    const r=await p.evaluate(()=>{ P.tab='tools'; P.tool='menu'; render();
      var o={m:members().length,i:items().length,trip:S().settings.tripName||'',nb:nbPages().length,
        cards:tlCards().length,ph:tlPhrases().length,money:moneyOK(),sos:tlArr('sos').length,lang:tl().lang,
        big:[].map.call(document.querySelectorAll('#view .btn.big .b2'),function(e){ return e.firstChild.textContent; }),
        tiles:document.querySelectorAll('#view .tcard').length, hero:''};
      P.tab='home'; render(); o.hero=txt('#view .hero'); return o; });
    ck('名單、行程、記事本都是空的，也沒有團名',r.m===0&&r.i===0&&r.nb===0&&!r.trip,r);
    ck('首頁顯示「尚未建立旅程」',/尚未建立旅程/.test(r.hero),r.hero);
    ck('工具頁是通用版：知識小卡 11 張、英文圖卡 55 句、外語是英語',r.cards===11&&r.ph===55&&r.lang==='英語',r);
    ck('外幣、當地電話留給主辦人填（還沒設定）',!r.money&&r.sos===0,r);
    ck('團員只看到用得上的工具：沒有飯店就不放計程車卡、沒設外幣就不放速算',r.big.join()==='外語點餐與溝通圖卡,緊急求助與走失卡',r.big);
    ck('知識小卡 11 張都在，記事本是空的就不放那一格',r.tiles===11,r.tiles);
    const html=await p.evaluate(()=>document.documentElement.outerHTML);
    ck('網頁原始碼裡沒有內建名單（v3.22 以前的 m01～m33）',!/\{id:'m0?1',name:/.test(html)&&!/Pao's Sapa/.test(html),html.match(/\{id:'m0?1',name:[^}]{0,20}/));
    /* 通用版不該出現越南：一般團員看得到的每一頁（範本名稱「越南範本」只在管理專區的範本清單裡） */
    const vn=await p.evaluate(()=>{ var bad=[], re=/越南|越文|越盾|越語|越幣|沙壩|河內|[ơưđạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;   /* 最後那組是越南文才有的字母 */
      function look(n){ var t=document.body.innerText; var m=t.match(re); if(m) bad.push(n+':'+m[0]); }
      P.leader=false; P.tab='tools'; P.tool='menu'; render(); look('menu');
      tlCards().forEach(function(c){ P.tool='card'; P.card=c.id; render(); look(c.id); });
      P.tool='phrases'; P.phCat=''; render(); look('phrases');
      tlCats().forEach(function(c){ P.phCat=c.id; render(); look('ph-'+c.id); });
      P.tool='sos'; render(); look('sos');
      openFull(taxiFull()); look('taxi'); closeFull(); openFull(phraseFull(lostPhrase())); look('lost'); closeFull();
      P.tab='home'; render(); look('home'); return bad; });
    ck('通用版的團員畫面沒有任何越南的字',!vn.length,vn);
    const lt=await p.evaluate(()=>({lcd:txt('.lcd'),tz:LTZ()}));
    ck('標頭寫「當地」不是「越南」；沒選時區就跟台灣一樣',/當地/.test(lt.lcd)&&!/越南/.test(lt.lcd)&&lt.tz==='Asia/Taipei',lt);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[2] 簡易標記：每一種寫法、以及跳脫');
  { const {ctx,p}=await open(b);
    const r=await p.evaluate(()=>{
      var h=document.createElement('div'); h.innerHTML=mdCard([
        '### 一句話結論','要**簽證**。','第二行','','第二段',
        '## 出發前核對','- 護照','・效期','1. 第一步','2、第二步','! 注意','外幣｜超過 1 萬美元','黃金 | 要申報',
        '## 只有警示','! 單獨一個警示'].join('\n'));
      var boxes=h.querySelectorAll(':scope>.info-card'), secs=h.querySelectorAll(':scope>h2.sec');
      return {boxes:boxes.length, secs:[].map.call(secs,function(e){ return e.textContent; }),
        icH:(h.querySelector('.info-card>.ic-h')||{}).textContent, bold:(h.querySelector('p b')||{}).textContent,
        br:h.querySelector('p').innerHTML.indexOf('<br>')>=0, paras:boxes[0]?boxes[0].querySelectorAll('p').length:0,
        ul:[].map.call(h.querySelectorAll('ul.dots li'),function(e){ return e.textContent; }), ol:[].map.call(h.querySelectorAll('ol.steps li'),function(e){ return e.textContent; }),
        dt:[].map.call(h.querySelectorAll('dl.kv2 dt'),function(e){ return e.textContent; }), dd:[].map.call(h.querySelectorAll('dl.kv2 dd'),function(e){ return e.textContent; }),
        warnIn:boxes[1]?boxes[1].querySelectorAll('.warn-box').length:0, loneWarn:!!h.querySelector(':scope>.warn-box') };
    });
    ck('### 開一個重點框，框裡有標題',r.icH==='一句話結論',r);
    ck('## 變成小標題（兩個）',r.secs.join()==='出發前核對,只有警示',r.secs);
    ck('**粗體**、同一段換行用 <br>、空一行分成兩段',r.bold==='簽證'&&r.br&&r.paras===2,r);
    ck('「- 」「・」都是條列',r.ul.join()==='護照,效期',r.ul);
    ck('「1. 」「2、」都是步驟（數字自動編）',r.ol.join()==='第一步,第二步',r.ol);
    ck('全形｜、半形 | 都是對照表',r.dt.join()==='外幣,黃金'&&r.dd.join()==='超過 1 萬美元,要申報',r);
    ck('! 是警示；框裡只有警示時不再包一層框',r.warnIn===1&&r.loneWarn,r);
    const x=await p.evaluate(()=>{ var h=document.createElement('div');
      h.innerHTML=mdCard('## <img src=x onerror="window.__xss=1">\n- <script>window.__xss=2<\/script>\n! **<b onclick=alert(1)>粗</b>**\n名稱<i>｜說明');
      return {img:h.querySelectorAll('img').length, script:h.querySelectorAll('script').length, onclick:h.querySelectorAll('[onclick]').length, i:h.querySelectorAll('i').length, text:h.textContent.indexOf('<img')>=0}; });
    ck('標記裡的 HTML 全部當成文字（img、script、onclick 都不會變成元素）',!x.img&&!x.script&&!x.onclick&&!x.i&&x.text,x);
    await ctx.close(); }

  console.log('\n[3] 知識小卡：新增、編輯、預覽、排序、刪除（點畫面）');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.leader=true; P.tab='tools'; P.tool='menu'; render();
      o.before=tlCards('local').length;
      tap('#view [data-act="tlCardEdit"][data-sec="local"]'); await sleep(50);
      o.sheet=txt('#sheetTitle');
      setv('title','測試小卡'); setv('sub','小字'); tap('#sheetRoot .sw[data-group="icon"] [data-val="cup"]');
      var ta=document.getElementById('mdBody'); ta.focus(); ta.setSelectionRange(0,0);
      tap('#sheetRoot [data-act="mdIns"][data-v="## "]'); document.execCommand('insertText',false,'小標');
      tap('#sheetRoot [data-act="mdIns"][data-v="- "]'); document.execCommand('insertText',false,'第一條');
      tap('#sheetRoot [data-act="mdIns"][data-v="! "]'); document.execCommand('insertText',false,'小心');
      await sleep(250);
      o.body=ta.value; o.prev=(document.querySelector('#mdPrev h2.sec')||{}).textContent+'/'+(document.querySelector('#mdPrev li')||{}).textContent+'/'+(document.querySelector('#mdPrev .warn-box')||{}).textContent;
      tap('#sheetRoot [data-act="tlCardSave"]'); await sleep(50);
      var c=tlCards('local').slice(-1)[0]; o.saved=c&&{title:c.title,sub:c.sub,icon:c.icon,sec:c.sec};
      o.after=tlCards('local').length; o.tile=[].some.call(document.querySelectorAll('#view .tcard b'),function(e){ return e.textContent==='測試小卡'; });
      o.op=!!(lastOp()&&lastOp().val.cards.some(function(x){ return x.title==='測試小卡'; }));
      /* 打開這張卡 */
      tap('#view .tcard[data-id="'+c.id+'"]'); await sleep(50);
      o.view=txt('#view .kc'); o.editBtn=!!document.querySelector('#view [data-act="tlCardEdit"][data-id="'+c.id+'"]');
      /* 編輯：換到「出發前先看」、往前移 */
      tap('#view [data-act="tlCardEdit"][data-id="'+c.id+'"]'); await sleep(50);
      tap('#sheetRoot .sw[data-group="sec"] [data-val="pre"]'); setv('title','改過的小卡');
      tap('#sheetRoot [data-act="tlCardSave"]'); await sleep(50);
      o.moved=tlCard(c.id).sec+'/'+tlCards('pre').slice(-1)[0].id===c.id+'';
      o.movedOK=tlCard(c.id).sec==='pre'&&tlCards('pre').slice(-1)[0].id===c.id&&tlCards('local').length===o.before;
      var pre0=tlCards('pre').map(function(x){ return x.id; });
      tap('#view [data-act="tlCardEdit"][data-id="'+c.id+'"]'); await sleep(50);
      tap('#sheetRoot [data-act="tlCardMove"][data-dir="-1"]'); await sleep(50);
      var pre1=tlCards('pre').map(function(x){ return x.id; });
      o.orderOK=pre1[pre1.length-2]===c.id&&pre1[pre1.length-1]===pre0[pre0.length-2];
      o.sheetStill=!!document.getElementById('mdBody');
      /* 刪除：第一次按只換字，第二次才刪 */
      tap('#sheetRoot [data-act="tlCardDel"]'); await sleep(30);
      o.del1=!!tlCard(c.id)&&/再按一次/.test(txt('#sheetRoot [data-act="tlCardDel"]'));
      tap('#sheetRoot [data-act="tlCardDel"]'); await sleep(50);
      o.del2=!tlCard(c.id)&&P.tool==='menu';
      var prev=JSON.parse(localStorage.getItem('sapa-prev-tools')||'null'); o.prev2=!!(prev&&prev.doc.cards.some(function(x){ return x.id===c.id; }));
      return o; });
    ck('「新增小卡」打開編輯器',r.sheet==='新增小卡',r.sheet);
    ck('插入鈕會另起一行放好符號',r.body==='## 小標\n- 第一條\n! 小心',r.body);
    ck('預覽跟著打字更新（小標題、條列、警示）',r.prev==='小標/第一條/小心',r.prev);
    ck('存檔：標題、小字、圖示、區塊都對，而且整份送出',r.saved&&r.saved.title==='測試小卡'&&r.saved.sub==='小字'&&r.saved.icon==='cup'&&r.saved.sec==='local'&&r.op,r);
    ck('工具頁多一格',r.after===r.before+1&&r.tile,r);
    ck('打開後顯示成品，主辦人有「編輯這張卡」',/小標/.test(r.view)&&/第一條/.test(r.view)&&r.editBtn,r);
    ck('換區塊：移到「出發前先看」的最後面',r.movedOK,r);
    ck('往前移：只跟同一區的小卡交換，表單留著沒關',r.orderOK&&r.sheetStill,r);
    ck('刪除要按兩次',r.del1&&r.del2,r);
    ck('刪除前在這支手機留了上一版（還原上一版救得回來）',r.prev2,r);
    const k=await p.evaluate(async()=>{ var id=tlCards('pre')[0].id; P.leader=false; P.tool='card'; P.card=id; render();
      return {edit:!!document.querySelector('#view [data-act="tlCardEdit"]'), menuAdd:(P.tool='menu',render(),!!document.querySelector('#view [data-act="tlCardEdit"]'))}; });
    ck('團員看不到編輯、新增的按鈕',!k.edit&&!k.menuAdd,k);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[4] 清空一區、還原上一版；清空後（Firebase 拿掉空陣列）再新增');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.leader=true; P.tab='tools'; P.tool='menu'; render();
      o.pre0=tlCards('pre').length; o.loc0=tlCards('local').length;
      tap('#view [data-act="tlClearAsk"][data-sec="pre"]'); await sleep(50);
      o.list=[].map.call(document.querySelectorAll('#sheetRoot .clr-list li'),function(e){ return e.textContent; }).length;
      tap('#sheetRoot [data-act="tlClearGo"]'); await sleep(50);
      o.pre1=tlCards('pre').length; o.loc1=tlCards('local').length;
      o.h2=[].map.call(document.querySelectorAll('#view h2.sec'),function(e){ return e.textContent; });
      o.restore=Store.restorePrev('tools'); o.pre2=tlCards('pre').length;
      /* 清空現場馬上用 */
      tap('#view [data-act="tlClearAsk"][data-sec="quick"]'); await sleep(50); tap('#sheetRoot [data-act="tlClearGo"]'); await sleep(50);
      o.quick={ph:tlPhrases().length,cats:tlCats().length,money:moneyOK(),sos:tlArr('sos').length,taxi:(tl().taxi||{}).fl||'',lang:tl().lang||''};
      o.cardsKept=tlCards().length;
      P.leader=false; P.tool='menu'; render();
      o.memberBig=[].map.call(document.querySelectorAll('#view .btn.big .b2'),function(e){ return e.firstChild.textContent; });
      P.tool='sos'; render(); o.sos=txt('#view'); 
      tap('#view [data-act="lostCard"]'); await sleep(30); o.lost=txt('.full'); closeFull();
      /* 雲端推回來的樣子：清空的文件只剩 _ts 與 _cleared，陣列全部不見 */
      Store.applyRemote({tools:{_ts:Date.now()+5,_cleared:Date.now()}});
      P.leader=true; P.tab='tools'; P.tool='menu'; render();
      o.emptyMenu=[].map.call(document.querySelectorAll('#view h2.sec'),function(e){ return e.textContent; });
      tap('#view [data-act="tlCardEdit"][data-sec="pre"]'); await sleep(30); setv('title','第一張'); setv('body','- 內容');
      tap('#sheetRoot [data-act="tlCardSave"]'); await sleep(30);
      var op=lastOp(); o.first={inDoc:(S().tools.cards||[]).length, inOp:op&&op.val.cards&&op.val.cards.length, cleared:'_cleared' in S().tools};
      return o; });
    ck('清空「出發前先看」：確認表單列出那 '+r.pre0+' 張',r.list===r.pre0,r);
    ck('只清掉那一區，「在地小知識」還在',r.pre1===0&&r.loc1===r.loc0,r);
    ck('主辦人還看得到空的那一區（可以新增）',r.h2.some(function(x){ return /出發前先看/.test(x); }),r.h2);
    ck('「還原上一版」把清掉的小卡救回來',r.restore&&r.pre2===r.pre0,r);
    ck('清空「現場馬上用」：圖卡、外幣、當地電話、計程車句子、外語都清掉，小卡不動',!r.quick.ph&&!r.quick.cats&&!r.quick.money&&!r.quick.sos&&!r.quick.taxi&&!r.quick.lang&&r.cardsKept===r.pre0+r.loc0,r);
    ck('清空後團員還有計程車卡（有飯店）與緊急求助',r.memberBig.join()==='計程車回飯店卡,緊急求助與走失卡',r.memberBig);
    ck('緊急求助頁還在：外交部急難救助專線',/外交部急難救助專線/.test(r.sos),r.sos.slice(0,80));
    ck('圖卡被清光，走散卡還是打得開（內建英文那張，附聯絡電話）',/走散了/.test(r.lost)&&/I am separated/.test(r.lost),r.lost.slice(0,80));
    ck('雲端清空後（陣列都不見了）主辦人看得到空的區塊',r.emptyMenu.some(function(x){ return /在地小知識/.test(x); }),r.emptyMenu);
    ck('清空後新增第一張：真的掛在文件上、跟著整份送出、拿掉清空標記',r.first.inDoc===1&&r.first.inOp===1&&!r.first.cleared,r.first);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[5] 外幣點鈔速算：常用貨幣、兩種匯率寫法、防呆、顏色跳脫');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.tab='tools'; P.tool='money'; P.leader=false; render();
      /* 假資料是越南盾：1 台幣 ≈ 820 盾 */
      tap('#view [data-act="noteTap"][data-v="500000"]'); tap('#view [data-act="noteTap"][data-v="20000"]'); await sleep(30);
      o.vnd=txt('#view .total'); var i=document.getElementById('twdIn'); i.value='300'; i.dispatchEvent(new Event('input',{bubbles:true})); o.vndBack=txt('#twdOut');
      /* 主辦人換成日圓（1 日圓 ≈ 0.21 台幣） */
      P.leader=true; render(); tap('#view [data-act="moneyEdit"]'); await sleep(50);
      tap('#sheetRoot [data-act="moneyPreset"][data-id="jpy"]'); await sleep(30);
      o.form={name:document.querySelector('[name=m_name]').value,dir:document.querySelector('[name=m_dir]').value,rate:document.querySelector('[name=m_rate]').value,rows:document.querySelectorAll('#sheetRoot .mn-row').length};
      /* 把最後一列（10）改成 2000：存檔時要重新排成大的在上面 */
      setv('n_v_5','2000');
      tap('#sheetRoot [data-act="moneySave"]'); await sleep(50);
      var m=tlMoney(); o.saved={name:m.name,unit:m.unit,dir:m.dir,rate:m.rate,notes:m.notes.map(function(n){ return n.v; }).join(','),sheet:!!document.querySelector('.sheet')};
      o.tapped=P.money.length;
      tap('#view [data-act="noteTap"][data-v="10000"]'); tap('#view [data-act="noteTap"][data-v="500"]'); await sleep(30);
      o.jpy=txt('#view .total'); i=document.getElementById('twdIn'); i.value='300'; i.dispatchEvent(new Event('input',{bubbles:true})); o.jpyBack=txt('#twdOut');
      o.rateLine=txt('#view .total .r');
      /* 防呆：匯率空白、面額全空 */
      tap('#view [data-act="moneyEdit"]'); await sleep(30); setv('m_rate',''); tap('#sheetRoot [data-act="moneySave"]'); await sleep(30);
      o.noRate={open:!!document.querySelector('.sheet'),toast:txt('#toast'),rate:tlMoney().rate};
      setv('m_rate','0.2'); for(var k=0;k<SHEET.mn;k++) setv('n_v_'+k,''); tap('#sheetRoot [data-act="moneySave"]'); await sleep(30);
      o.noNotes={open:!!document.querySelector('.sheet'),toast:txt('#toast'),n:tlMoney().notes.length};
      closeSheet();
      /* 雲端資料裡的顏色壞掉或被塞東西 */
      tlMoney().notes[0].color='red;"><img src=x onerror="window.__xss=1">'; render();
      o.xss={img:document.querySelectorAll('#view .notes img').length,bg:document.querySelector('#view .note .sw').getAttribute('style')};
      /* 清空外幣：按兩次；團員就看不到速算 */
      tap('#view [data-act="moneyEdit"]'); await sleep(30); tap('#sheetRoot [data-act="moneyWipe"]'); await sleep(20);
      o.wipe1=moneyOK(); tap('#sheetRoot [data-act="moneyWipe"]'); await sleep(30); o.wipe2=moneyOK();
      P.leader=false; P.tool='menu'; render(); o.menuMoney=!!document.querySelector('#view [data-tool="money"]');
      P.leader=true; render(); o.menuMoneyL=txt('#view [data-tool="money"]');
      return o; });
    ck('越南盾：500,000＋20,000 盾 ≈ NT$ 634',/520,000 盾/.test(r.vnd)&&/NT\$ 634/.test(r.vnd),r.vnd);
    ck('越南盾反算：300 台幣 ≈ 246,000 盾',r.vndBack==='246,000',r.vndBack);
    ck('按「日圓」帶入名稱、匯率方向、面額',r.form.name==='日圓'&&r.form.dir==='twd'&&r.form.rate==='0.21'&&r.form.rows===7,r.form);
    ck('存檔：面額由大到小排好、表單關閉、剛剛點的鈔票歸零',r.saved.name==='日圓'&&r.saved.dir==='twd'&&r.saved.notes==='10000,5000,2000,1000,500,100'&&!r.saved.sheet&&r.tapped===0,r.saved);
    ck('日圓：10,000＋500 圓 ≈ NT$ 2,205',/10,500 日圓/.test(r.jpy)&&/NT\$ 2,205/.test(r.jpy),r.jpy);
    ck('日圓反算：300 台幣 ≈ 1,430 日圓（大約）',r.jpyBack==='1,430',r.jpyBack);
    ck('匯率那行寫成「1 日圓 ≈ 0.21 台幣」',/1 日圓 ≈ 0\.21 台幣/.test(r.rateLine),r.rateLine);
    ck('沒填匯率：不存、表單留著、提示原因',r.noRate.open&&/匯率/.test(r.noRate.toast)&&r.noRate.rate===0.21,r.noRate);
    ck('面額全空：不存、提示原因',r.noNotes.open&&/面額/.test(r.noNotes.toast)&&r.noNotes.n===6,r.noNotes);
    ck('壞掉的顏色值不會跳出 style（沒有多出 img，換成灰色）',!r.xss.img&&/#9AA3B2/i.test(r.xss.bg),r.xss);
    ck('清空外幣要按兩次',r.wipe1&&!r.wipe2,r);
    ck('沒設外幣：團員看不到速算，主辦人看到「還沒設定」',!r.menuMoney&&/還沒設定外幣/.test(r.menuMoneyL),r);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[6] 外語圖卡：外語設定、類別、圖卡、走散卡、未分類');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.leader=true; P.tab='tools'; P.tool='phrases'; P.phCat=''; render();
      tap('#view [data-act="langEdit"]'); await sleep(30); setv('lang','日語'); setv('langTag','日本語'); setv('thanks','ありがとうございます'); tap('#sheetRoot [data-act="langSave"]'); await sleep(30);
      tap('#view [data-act="phCatEdit"][data-id=""]'); await sleep(30); setv('name','溫泉'); setv('e','♨️'); tap('#sheetRoot [data-act="phCatSave"]'); await sleep(30);
      var cat=tlCats().slice(-1)[0]; o.cat=cat.name;
      tap('#view [data-act="phCat"][data-cat="'+cat.id+'"]'); await sleep(30);
      tap('#view [data-act="phEdit"][data-id=""]'); await sleep(30);
      setv('zh','請問溫泉在哪裡？'); setv('fl','温泉はどこですか？'); setv('say','翁森 哇 多口 跌斯卡');
      tap('#sheetRoot [data-act="phSave"]'); await sleep(30);
      var ph=tlPhrases().slice(-1)[0]; o.ph={zh:ph.zh,fl:ph.fl,cat:ph.cat===cat.id,lost:!!ph.lost};
      o.list=txt('#view .stack');
      tap('#view [data-act="phrase"][data-id="'+ph.id+'"]'); await sleep(30); o.full=txt('.full'); closeFull();
      /* 標成走散卡：緊急求助頁的走散按鈕改打開它 */
      tap('#view [data-act="phEdit"][data-id="'+ph.id+'"]'); await sleep(30);
      var lk=document.querySelector('#sheetRoot [name=lost]'); o.lostSheet=!!lk; if(lk) lk.checked=true; tap('#sheetRoot [data-act="phSave"]'); await sleep(30);
      o.lostFlag=!!phById(ph.id).lost;
      /* 原本那張走散卡先拿掉標記，才會輪到新的這張 */
      tlPhrases().forEach(function(x){ if(x.id!==ph.id) delete x.lost; });
      P.tool='sos'; render(); tap('#view [data-act="lostCard"]'); await sleep(30); o.lost=txt('.full'); closeFull();
      /* 刪類別（按兩次）：圖卡一起刪，留上一版 */
      localStorage.removeItem('sapa-prev-tools');
      P.tool='phrases'; P.phCat=''; render(); tap('#view [data-act="phCatEdit"][data-id="'+cat.id+'"]'); await sleep(30);
      tap('#sheetRoot [data-act="phCatDel"]'); await sleep(20); o.del1=tlCats().some(function(c){ return c.id===cat.id; });
      tap('#sheetRoot [data-act="phCatDel"]'); await sleep(30);
      o.del2={cat:tlCats().some(function(c){ return c.id===cat.id; }),ph:!!phById(ph.id),prev:!!localStorage.getItem('sapa-prev-tools')};
      /* 類別被別人刪了、圖卡還在：集中到「未分類」 */
      var eat=tlPhrases().filter(function(x){ return x.cat==='eat'; }).length;
      tl().cats=tlCats().filter(function(c){ return c.id!=='eat'; }); render();
      o.orphan=txt('#view .stack'); tap('#view [data-act="phCat"][data-cat="_"]'); await sleep(30);
      o.orphanN=document.querySelectorAll('#view [data-act="phrase"]').length; o.eat=eat;
      /* 刪一句：按兩次 */
      var first=document.querySelector('#view [data-act="phEdit"]').getAttribute('data-id');
      tap('#view [data-act="phEdit"][data-id="'+first+'"]'); await sleep(30); tap('#sheetRoot [data-act="phDel"]'); await sleep(20); o.pd1=!!phById(first);
      tap('#sheetRoot [data-act="phDel"]'); await sleep(30); o.pd2=!!phById(first);
      return o; });
    ck('新增類別',r.cat==='溫泉',r.cat);
    ck('新增圖卡：中文、外語、類別都對',r.ph.zh==='請問溫泉在哪裡？'&&r.ph.fl==='温泉はどこですか？'&&r.ph.cat&&!r.ph.lost,r.ph);
    ck('清單上有空耳中文那一行',/翁森/.test(r.list),r.list);
    ck('全螢幕：外語標示「日本語 · 日語」、最下面先寫外語的謝謝',/日本語 · 日語/.test(r.full)&&/ありがとうございます 謝謝您的幫忙/.test(r.full),r.full.slice(0,120));
    ck('關掉全螢幕圖卡、馬上按編輯：表單有打開（沒被上一頁事件關掉）',r.lostSheet,r);
    ck('勾「走散卡」之後，緊急求助頁的走散按鈕打開它，而且附聯絡電話',r.lostFlag&&/温泉はどこですか/.test(r.lost)&&/請幫我打這些電話/.test(r.lost),r.lost.slice(0,120));
    ck('刪類別要按兩次；刪掉時圖卡一起刪、留上一版',r.del1&&!r.del2.cat&&!r.del2.ph&&r.del2.prev,r);
    ck('類別不見的圖卡集中在「未分類」，一句都沒少',/未分類/.test(r.orphan)&&r.orphanN===r.eat,r);
    ck('刪一句要按兩次',r.pd1&&!r.pd2,r);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[7] 計程車卡、當地電話（含 v3.22 以前的駐外館處電話搬家）');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.leader=false; P.tab='tools'; P.tool='menu'; render();
      tap('#view [data-act="fullTaxi"]'); await sleep(30); o.memberEdit=!!document.querySelector('.full [data-act="taxiEdit"]'); o.vn=txt('.full'); closeFull();
      P.leader=true; render(); tap('#view [data-act="fullTaxi"]'); await sleep(30);
      tap('.full [data-act="taxiEdit"]'); await sleep(50); o.fullClosed=!document.querySelector('.full'); o.sheet=txt('#sheetTitle');
      setv('fl','このホテルまでお願いします。'); setv('lab_hotel','ホテル'); setv('lab_addr',''); tap('#sheetRoot [data-act="taxiSave"]'); await sleep(30);
      tap('#view [data-act="fullTaxi"]'); await sleep(30); o.jp=txt('.full'); closeFull();
      /* 假資料是 v3.22 的設定：駐外館處電話放在團務設定 */
      o.legacy0=S().settings.embassyPhone;
      tlArr('sos'); tl().sos=tl().sos.filter(function(x){ return x.phone!==S().settings.embassyPhone; });
      P.tool='sos'; render(); o.sosLegacy=/駐外館處/.test(txt('#view'));
      tap('#view [data-act="sosEdit"]'); await sleep(30);
      o.prefill=[].some.call(document.querySelectorAll('#sheetRoot input[name^="s_phone_"]'),function(e){ return e.value===o.legacy0; });
      setv('s_name_0','警察'); setv('s_phone_0','110'); setv('s_sub_0','24 小時');
      tap('#sheetRoot [data-act="sosSave"]'); await sleep(30);
      o.after={sos:tl().sos.map(function(x){ return x.name+':'+x.phone; }),emb:S().settings.embassyPhone,setOp:Store.q.some(function(q){ return q.key==='settings'; })};
      o.page=txt('#view');
      /* v3.22 就有的問題：防呆標籤存檔後應該回到清單，結果清單直接消失 */
      sheetTags(); await sleep(30); sheetTagEdit(tagList()[0].id); await sleep(30); tap('#sheetRoot [data-act="saveTag"]'); await sleep(200);
      o.tagList=txt('#sheetTitle'); closeSheet(); await sleep(100);
      return o; });
    ck('團員的計程車卡沒有編輯鈕；越南範本的句子在上面',!r.memberEdit&&/Làm ơn đưa tôi/.test(r.vn)&&/KHÁCH SẠN · 飯店/.test(r.vn),r);
    ck('主辦人按「編輯」：全螢幕關掉、打開表單',r.fullClosed&&r.sheet==='計程車回飯店卡',r);
    ck('改完：新句子、外語小標「ホテル · 飯店」、清掉的小標只剩中文',/このホテルまで/.test(r.jp)&&/ホテル · 飯店/.test(r.jp)&&/\n地址\n/.test(r.jp),r.jp.slice(0,200));
    ck('v3.22 的駐外館處電話照樣顯示，編輯時自動帶進清單',r.sosLegacy&&r.prefill,r);
    ck('存檔後改放在工具內容，團務設定那一欄拿掉（也送上雲端）',r.after.sos.indexOf('警察:110')>=0&&r.after.sos.indexOf('駐外館處:'+r.legacy0)>=0&&r.after.emb===undefined&&r.after.setOp,r.after);
    ck('緊急求助頁列出新的電話',/警察/.test(r.page)&&/110/.test(r.page),r.page.slice(0,200));
    ck('防呆標籤存檔後回到標籤清單（v3.22 會直接消失）',r.tagList==='防呆標籤',r.tagList);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[8] 工具頁範本');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.leader=true; P.tab='tools'; P.tool='menu'; render();
      tap('#view [data-act="tplList"]'); await sleep(30); o.rows=document.querySelectorAll('#sheetRoot .bk-row').length;
      tap('#sheetRoot [data-act="tplGo"][data-id="generic"]'); await sleep(20); o.t1=tl().lang;
      tap('#sheetRoot [data-act="tplGo"][data-id="generic"]'); await sleep(30);
      o.gen={lang:tl().lang,cards:tlCards().map(function(c){ return c.id; }).join(),ph:tlPhrases().length,money:moneyOK(),prev:!!localStorage.getItem('sapa-prev-tools')};
      o.opFull=!!(lastOp()&&lastOp().path===''&&lastOp().val.cards.length===11);
      /* 改一個字不影響範本本身 */
      tl().cards[0].title='改過'; o.tplSafe=TPL.generic.tools.cards[0].title;
      tap('#view [data-act="tplList"]'); await sleep(30); tap('#sheetRoot [data-act="tplGo"][data-id="vietnam"]'); tap('#sheetRoot [data-act="tplGo"][data-id="vietnam"]'); await sleep(30);
      o.vn={lang:tl().lang,ph:tlPhrases().length,money:tlMoney().name,sos:tlArr('sos').length};
      return o; });
    ck('範本清單有通用版、越南範本',r.rows===2,r.rows);
    ck('套用要按兩次',r.t1==='越南語',r.t1);
    ck('套用通用版：英語、11 張小卡（叫車與交通取代 Grab）、55 句、外幣留白，而且先留上一版',r.gen.lang==='英語'&&/ride/.test(r.gen.cards)&&!/grab/.test(r.gen.cards)&&r.gen.ph===55&&!r.gen.money&&r.gen.prev,r.gen);
    ck('整份送出',r.opFull,r);
    ck('改內容不會改到程式裡的範本',r.tplSafe==='入境與通關',r.tplSafe);
    ck('再套回越南範本：越南語 55 句、越南盾、4 支當地電話',r.vn.lang==='越南語'&&r.vn.ph===55&&r.vn.money==='越南盾'&&r.vn.sos===4,r.vn);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[9] 目的地時區：時差、夏令時間、美國與紐西蘭的出發日');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={}, st=S().settings;
      var lcd=function(){ return txt('.lcd').replace(/\s+/g,' '); };
      o.vn={lcd:lcd(),tz:LTZ()};
      st.tz='Asia/Tokyo'; render();
      o.tokyo={lcd:lcd(),slot:new Date(slotMs('2026-09-25','09:00')).toISOString(),now:nowPlusSlot(30)};
      /* 巴黎：夏天 +2、冬天 +1；3/29 那天 01:00 UTC 切換 */
      st.tz='Europe/Paris';
      o.paris=[slotMs('2026-07-01','12:00'),slotMs('2026-12-01','12:00'),slotMs('2026-03-29','01:30'),slotMs('2026-03-29','12:00')].map(function(t){ return new Date(t).toISOString().slice(0,16); });
      /* 美西：台灣已經是出發日早上，當地還是前一天傍晚 → 第 1 天 */
      st.tz='America/Los_Angeles'; st.startDate='2026-09-24'; st.dayOverride=0;
      return o; });
    await p.clock.setSystemTime(new Date('2026-09-24T08:00:00+08:00'));
    const us=await p.evaluate(()=>{ var d=dayInfo(); return {status:d.status,idx:d.idx,local:tzParts(LTZ()).date}; });
    await p.evaluate(()=>{ S().settings.tz='Pacific/Auckland'; });
    await p.clock.setSystemTime(new Date('2026-09-23T22:00:00+08:00'));
    const nz=await p.evaluate(()=>{ var d=dayInfo(); return {status:d.status,local:tzParts(LTZ()).date}; });
    const bad=await p.evaluate(()=>{ S().settings.tz='Mars/Base'; var e=null; try{ render(); }catch(x){ e=String(x); } return {tz:LTZ(),e:e,lcd:txt('.lcd')}; });
    ck('假資料設成越南時區：標頭「當地」比台灣慢 1 小時',r.vn.tz==='Asia/Ho_Chi_Minh'&&/當地 09:00/.test(r.vn.lcd)&&/台灣 10:00/.test(r.vn.lcd),r.vn);
    ck('換成日本：當地比台灣快 1 小時',/當地 11:00/.test(r.tokyo.lcd)&&/台灣 10:00/.test(r.tokyo.lcd),r.tokyo.lcd);
    ck('日本 9/25 09:00 ＝ UTC 00:00',r.tokyo.slot==='2026-09-25T00:00:00.000Z',r.tokyo.slot);
    ck('「現在＋30 分」寫成日本時間 11:30',r.tokyo.now.hm==='11:30'&&r.tokyo.now.date==='2026-09-20',r.tokyo.now);
    ck('巴黎夏令時間：夏天 12:00＝10:00Z、冬天 12:00＝11:00Z、切換那天前後都對',r.paris.join()==='2026-07-01T10:00,2026-12-01T11:00,2026-03-29T00:30,2026-03-29T10:00',r.paris);
    ck('美西：台灣出發日早上（當地還是前一天）算第 1 天',us.status==='on'&&us.idx===1&&us.local==='2026-09-23',us);
    ck('紐西蘭：台灣出發前一晚（當地已經是出發日）還算出發前',nz.status==='before'&&nz.local==='2026-09-24',nz);
    ck('資料裡的時區壞掉：當成跟台灣一樣，畫面照常',bad.tz==='Asia/Taipei'&&!bad.e,bad);
    const s=await p.evaluate(async()=>{ S().settings.tz='Asia/Ho_Chi_Minh'; P.leader=true; render(); ACT.settings(); await sleep(30);
      var sel=document.querySelector('#sheetRoot select[name=tz]'), o={n:sel.options.length,vn:[].filter.call(sel.options,function(x){ return x.value==='Asia/Ho_Chi_Minh'; })[0].textContent,picked:sel.value};
      sel.value='Asia/Seoul'; tap('#sheetRoot [data-act="saveSettings"]'); await sleep(30); o.saved=S().settings.tz;
      ACT.settings(); await sleep(30); document.querySelector('#sheetRoot select[name=tz]').value=''; tap('#sheetRoot [data-act="saveSettings"]'); await sleep(30);
      o.cleared=('tz' in S().settings); return o; });
    ck('團務設定的時區選單：目前的時區選好了，括號寫出時差',s.picked==='Asia/Ho_Chi_Minh'&&/越南（比台灣慢 1 小時）/.test(s.vn)&&s.n>20,s);
    ck('選韓國存檔；選「跟台灣一樣」就把欄位拿掉',s.saved==='Asia/Seoul'&&s.cleared===false,s);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[10] 一鍵清空也清工具頁；還原 v3.22 的舊備份時工具頁換回越南範本');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      var nd=blankDocs(Date.now()); o.blank=JSON.stringify(nd.tools);
      var sum=bkSum(S()); o.sum=bkSumText(sum);
      P.leader=true; sheetClear(); o.clearList=txt('#sheetRoot .clr-list'); closeSheet();
      /* 3.22 的備份：沒有 tools */
      var old=clone(S()); delete old.tools; var rd=restoreDocs({ver:'3.22',docs:old},Date.now());
      var ot=rd.tools||{}; o.old={lang:ot.lang,ph:(ot.phrases||[]).length,cleared:!!ot._cleared};
      /* 3.23 的備份，工具頁本來就是清空的：照原樣還原成空的 */
      var nw=clone(S()); nw.tools={_ts:1,_cleared:1}; var rd2=restoreDocs({ver:'3.23',docs:nw},Date.now());
      var nt=rd2.tools||{}; o.nw={cleared:!!nt._cleared,ph:(nt.phrases||[]).length};
      /* 真的清空（單機模式）：工具頁變空殼，團員那邊只剩緊急求助 */
      /* 測試瀏覽器連不到雲端，但 config.js 設的是 firebase：這裡當成單機模式（雲端那條路 resettest.js 有測） */
      Store.backend=''; var done=null; bulkWrite(function(T){ return blankDocs(T); },'clear',function(e){ done=e||'ok'; }); await sleep(50);
      o.done=done; o.after=JSON.stringify(S().tools);
      P.leader=false; P.tab='tools'; P.tool='menu'; render();
      o.memberBig=[].map.call(document.querySelectorAll('#view .btn.big .b2'),function(e){ return e.firstChild.textContent; });
      o.memberH2=[].map.call(document.querySelectorAll('#view h2.sec'),function(e){ return e.textContent; });
      P.leader=true; render(); o.leaderH2=[].map.call(document.querySelectorAll('#view h2.sec'),function(e){ return e.textContent; });
      return o; });
    ck('清空後的工具內容只剩 _ts 與 _cleared',/^\{"_ts":\d+,"_cleared":\d+\}$/.test(r.blank),r.blank);
    ck('備份摘要多了知識小卡與外語圖卡的數量',/知識小卡 11 張/.test(r.sum)&&/外語圖卡 55 句/.test(r.sum),r.sum);
    ck('清空確認表單列出工具頁內容',/工具頁內容：知識小卡（11 張）、外語圖卡（55 句）/.test(r.clearList),r.clearList);
    ck('還原 v3.22 的備份（沒有工具內容）：工具頁換回越南範本',r.old.lang==='越南語'&&r.old.ph===55&&!r.old.cleared,r.old);
    ck('還原 v3.23 的備份：工具頁照備份（空的就是空的）',r.nw.cleared&&r.nw.ph===0,r.nw);
    ck('一鍵清空（單機）成功，工具頁也清成空殼',r.done==='ok'&&/^\{"_ts":\d+,"_cleared":\d+\}$/.test(r.after),r);
    ck('清空後團員的工具頁只剩緊急求助，其他區塊不出現',r.memberBig.join()==='緊急求助與走失卡'&&r.memberH2.length===1,r);
    ck('主辦人看得到三個區塊與管理專區（可以新增、套用範本）',/出發前先看/.test(r.leaderH2.join())&&/在地小知識/.test(r.leaderH2.join())&&/管理專區/.test(r.leaderH2.join()),r.leaderH2);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[11] 版面：320px 特大字，主辦人的工具頁、小卡編輯器不撐破');
  { const {ctx,p,errs}=await open(b,{viewport:{width:320,height:568}});
    const r=await p.evaluate(async()=>{ P.fs='xl'; P.leader=true; P.tab='tools'; P.tool='menu'; render(); var o={};
      o.menu=document.documentElement.scrollWidth>document.documentElement.clientWidth;
      o.clip=[].slice.call(document.querySelectorAll('#view .btn')).filter(function(b){ return b.offsetParent&&b.scrollWidth>b.clientWidth+1; }).map(function(b){ return b.textContent.trim().slice(0,12); });
      /* 主辦人打了很長的標題與一行很長的英文網址 */
      var c=tlCards()[0]; c.title='這是一個超級長的小卡標題'; c.body='### '+'很長的重點框標題'.repeat(4)+'\nhttps://example.com/'+'a'.repeat(80)+'\n長項目'.repeat(3)+'｜說明';
      render(); o.long=document.documentElement.scrollWidth>document.documentElement.clientWidth;
      /* .app 本身會裁掉溢出，整頁量不出來（CLAUDE.md 第 3 條），要量每一格自己 */
      o.tileOut=[].slice.call(document.querySelectorAll('#view .tcard')).filter(function(t){ var b=t.querySelector('b'); return b&&b.getBoundingClientRect().right>t.getBoundingClientRect().right+1; }).length;
      /* 特大字在 320px 是單欄、夠寬；標準字是雙欄，每格只有約 140px，長標題最容易撐出去 */
      P.fs='md'; render(); o.tileOutMd=[].slice.call(document.querySelectorAll('#view .tcard')).filter(function(t){ var b=t.querySelector('b'); return b&&b.getBoundingClientRect().right>t.getBoundingClientRect().right+1; }).length; P.fs='xl';
      P.tool='card'; P.card=c.id; render(); o.cardOv=document.documentElement.scrollWidth>document.documentElement.clientWidth;
      o.boxOut=[].slice.call(document.querySelectorAll('#view .kc .info-card')).filter(function(b){ return b.scrollWidth>b.clientWidth+1; }).length;
      sheetCardEdit(c.id); await sleep(50); var s=document.querySelector('.sheet'); o.sheetOv=s.scrollWidth>s.clientWidth+1;
      closeSheet(); sheetMoney(); await sleep(30); s=document.querySelector('.sheet'); o.moneyOv=s.scrollWidth>s.clientWidth+1;
      closeSheet(); return o; });
    await shot(p,'320xl');
    ck('工具頁（主辦人、特大字）沒有橫向捲動、按鈕字沒被切',!r.menu&&!r.clip.length,r);
    ck('很長的標題、網址、對照表：工具頁與小卡頁都不撐破（每一格、每一框自己量）',!r.long&&!r.cardOv&&!r.tileOut&&!r.tileOutMd&&!r.boxOut,r);
    ck('小卡編輯器、外幣設定表單不撐破',!r.sheetOv&&!r.moneyOv,r);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

const {chromium,FILE,at}=require('./_lib');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:375,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(FILE);await p.waitForTimeout(500);
const out={};
// PIN 解鎖（明文舊資料）
await p.evaluate(()=>{P.leader=false;render();document.getElementById('btnLeader').click();});await p.waitForTimeout(200);
for(const k of ['8','8','8','8']){ await p.evaluate(k=>document.querySelector('[data-act="pinKey"][data-k="'+k+'"]').click(),k); }
await p.waitForTimeout(300);
out.leader=await p.evaluate(()=>P.leader); out.hash=await p.evaluate(()=>!!S().settings.pinHash&&!S().settings.pin);
// 錯誤 PIN
await p.evaluate(()=>{P.leader=false;render();document.getElementById('btnLeader').click();});await p.waitForTimeout(200);
for(const k of ['1','2','3','4']){ await p.evaluate(k=>document.querySelector('[data-act="pinKey"][data-k="'+k+'"]').click(),k); }
await p.waitForTimeout(300); out.wrongStaysLocked=await p.evaluate(()=>!P.leader);
await p.evaluate(()=>closeSheet());
// 返回鍵關 sheet
await p.evaluate(()=>{P.leader=true;render();});
const h0=await p.evaluate(()=>history.length);
await p.evaluate(()=>ACT.editBroadcast());await p.waitForTimeout(200);
out.sheetOpen=await p.evaluate(()=>!!document.querySelector('.sheet'));
await p.goBack();await p.waitForTimeout(300);
out.sheetClosedByBack=await p.evaluate(()=>!document.querySelector('.sheet'));
out.stillOnPage=await p.evaluate(()=>!!document.getElementById('tabbar'));
// Esc 關 sheet
await p.evaluate(()=>ACT.settings());await p.waitForTimeout(200);
await p.keyboard.press('Escape');await p.waitForTimeout(200);
out.escClosed=await p.evaluate(()=>!document.querySelector('.sheet'));
// 計程車卡鎖定
await p.evaluate(()=>ACT.fullTaxi());await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('[data-act="fullLock"]').click());await p.waitForTimeout(200);
out.lockedNoClose=await p.evaluate(()=>!document.querySelector('[data-act="fullClose"]')&&!!document.getElementById('unlockBtn'));
await p.keyboard.press('Escape');await p.waitForTimeout(100);
out.escIgnoredWhenLocked=await p.evaluate(()=>!!document.querySelector('.full'));
// 長按 2 秒解鎖
const box=await p.evaluate(()=>{const r=document.getElementById('unlockBtn').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
await p.mouse.move(box.x,box.y);await p.mouse.down();await p.waitForTimeout(2200);await p.mouse.up();await p.waitForTimeout(200);
out.unlocked=await p.evaluate(()=>!!document.querySelector('[data-act="fullClose"]'));
await p.evaluate(()=>closeFull());
// 分組局部寫入 + 標籤上限 +N
await p.evaluate(()=>{P.tab='groups';P.scn='meal';render();const sc=scenario('meal');const id=members()[0].id;['素食','不吃牛','要溫水','已點餐','還沒到'].forEach(v=>{Store.savePath('groups',scnPath(sc)+'/mtags/'+id,(mtagsOf(sc,id).concat([v])));});});
await p.waitForTimeout(200);
out.tagCard=await p.evaluate(()=>document.querySelector('.grp .gm .mc .mtags').textContent);
out.queueOps=await p.evaluate(()=>Store.q.map(o=>o.key+':'+o.path).slice(-2));
// 用餐分桌標籤：管理清單／編輯改名（含成員身上同步改名）／刪除（含從成員身上移除）／新增
await p.evaluate(()=>ACT.manageTagOpts());await p.waitForTimeout(150);
out.tagOptsListed=await p.evaluate(()=>Array.from(document.querySelectorAll('#sheetRoot .it-row b')).map(e=>e.textContent));
await p.evaluate(()=>document.querySelector('[data-act="editTagOpt"][data-v="已點餐"]').click());await p.waitForTimeout(150);
await p.evaluate(()=>{document.querySelector('[name=label]').value='已上齊';ACT.saveTagOpt();});await p.waitForTimeout(150);
out.tagOptRenamed=await p.evaluate(()=>{const o=scnTagOpts(scenario('meal'));return o.indexOf('已上齊')>=0&&o.indexOf('已點餐')<0;});
out.memberTagRenamed=await p.evaluate(()=>{const sc=scenario('meal'),id=members()[0].id,a=mtagsOf(sc,id);return a.indexOf('已上齊')>=0&&a.indexOf('已點餐')<0;});
await p.evaluate(()=>ACT.manageTagOpts());await p.waitForTimeout(150);
await p.evaluate(()=>document.querySelector('[data-act="editTagOpt"][data-v="不吃牛"]').click());await p.waitForTimeout(150);
await p.evaluate(()=>ACT.delTagOpt());await p.waitForTimeout(150);
out.tagOptDeleted=await p.evaluate(()=>scnTagOpts(scenario('meal')).indexOf('不吃牛')<0);
out.memberTagDeleted=await p.evaluate(()=>{const sc=scenario('meal'),id=members()[0].id;return mtagsOf(sc,id).indexOf('不吃牛')<0;});
await p.evaluate(()=>ACT.manageTagOpts());await p.waitForTimeout(150);
await p.evaluate(()=>document.querySelector('[data-act="editTagOpt"][data-v=""]').click());await p.waitForTimeout(150);
await p.evaluate(()=>{document.querySelector('[name=label]').value='加點飲料';ACT.saveTagOpt();});await p.waitForTimeout(150);
out.tagOptAdded=await p.evaluate(()=>scnTagOpts(scenario('meal')).indexOf('加點飲料')>=0);
await p.evaluate(()=>closeSheet());
// 首頁「出發前準備」卡不能直接打勾，只能導去完整清單頁面打勾
await p.evaluate(()=>{P.leader=false;P.tab='home';render();});await p.waitForTimeout(150);
out.prepNoInlineCheck=await p.evaluate(()=>document.querySelectorAll('[data-act="nbCheck"]').length===0);
out.prepGoBtnText=await p.evaluate(()=>{const b=document.querySelector('[data-act="nbGo"]');return b?b.textContent:'MISSING';});
await p.evaluate(()=>document.querySelector('[data-act="nbGo"]').click());await p.waitForTimeout(150);
out.prepGoNavigatesToNotes=await p.evaluate(()=>P.tab==='notes');
out.prepFullListCheckable=await p.evaluate(()=>document.querySelectorAll('[data-act="nbCheck"]').length>0);
// 編輯既有團員存檔：saveMember() 裡呼叫 closeSheet() 會把 SHEET 設成 null，
// 後面的判斷分支不能再讀 SHEET.id（曾經因此整段 TypeError、完全沒存到、重新整理後打回原狀），這裡做回歸測試
await p.evaluate(()=>{P.leader=true;P.tab='rooms';P.roomsSeg='list';render();});await p.waitForTimeout(150);
out.editMemberNoThrow=await p.evaluate(()=>{
  try{
    var m=members()[0];
    ACT.editMember({getAttribute:function(){return m.id;}});
    document.querySelector('[name=room]').value='609';
    document.querySelector('[name=remark]').value='測試備註';
    ACT.saveMember();
    window.__editTestId=m.id;
    return true;
  }catch(e){ window.__editErr=String(e); return false; }
});
out.editMemberErr=await p.evaluate(()=>window.__editErr||null);
out.editQueueHasOp=await p.evaluate(()=>Store.q.length>0);
out.editCachedRoom=await p.evaluate(()=>{ var c=JSON.parse(localStorage.getItem('sapa-data')); var id=window.__editTestId; var it=(c.docs.members.items||[]).filter(function(x){return x.id===id;})[0]; return it&&it.room; });
// 房號／分組頁籤的團員卡片不顯示航空公司徽章，只有全員名單保留
await p.evaluate(()=>{ var m=members()[0]; Store.savePath('members','items/'+members().indexOf(m),Object.assign({},m,{airline:'eva'})); });
await p.evaluate(()=>{P.tab='rooms';P.roomsSeg='rooms';render();});await p.waitForTimeout(150);
out.roomsCardNoAirline=await p.evaluate(()=>document.querySelectorAll('#view .mc .al').length===0);
await p.evaluate(()=>{P.roomsSeg='list';render();});await p.waitForTimeout(150);
out.rosterCardHasAirline=await p.evaluate(()=>document.querySelectorAll('#view .mc .al').length>0);
await p.evaluate(()=>{P.tab='groups';P.scn='meal';render();});await p.waitForTimeout(150);
out.groupsCardNoAirline=await p.evaluate(()=>document.querySelectorAll('#view .mc .al').length===0);
await p.evaluate(()=>{P.scn='airline';render();});await p.waitForTimeout(150);
out.airlineViewCardNoAirline=await p.evaluate(()=>document.querySelectorAll('#view .grp .gm .mc .al').length===0);
out.airlineViewHeaderHasBadge=await p.evaluate(()=>document.querySelectorAll('#view .grp h3 .al').length>0);
// 標頭第二列：越南／台灣／集合倒數／連線狀態同一行，順序固定為 越南→台灣→集合→連線狀態（v2.7 起）；
// 沒選名字時問候列整個隱藏（連線狀態已經在上面那排），選了名字才顯示問候
await p.evaluate(()=>{P.meId='';render();});await p.waitForTimeout(100);
out.headerOrder=await p.evaluate(()=>document.querySelector('.lcd').textContent.replace(/\s+/g,' ').trim());
out.headerSeq=await p.evaluate(()=>Array.from(document.querySelector('.lcd').children).filter(function(c){return c.className!=='dv';}).map(function(c){return c.id||c.className;}).join('>'));
out.syncBarHiddenNoName=await p.evaluate(()=>document.getElementById('syncBar').hidden);
await p.evaluate(()=>{P.meId=members()[0].id;render();});await p.waitForTimeout(100);
out.syncBarShownWithName=await p.evaluate(()=>{ var b=document.getElementById('syncBar'); return !b.hidden && b.textContent.indexOf(members()[0].name)>=0; });
out.hdSyncStillVisibleWithName=await p.evaluate(()=>document.getElementById('hdSyncTx').textContent.length>0);
await p.evaluate(()=>{P.meId='';render();});
// v2.4：常用工具移除、我的資訊欄位不分階段統一並加入「我的分組」、換一個名字併入卡片列、
// 管理者可在「首頁分組顯示」個別開關某個分組情境是否出現在首頁
await p.evaluate(()=>{P.leader=false;P.tab='home';P.meId='';render();});await p.waitForTimeout(100);
out.quickToolsSecGone=await p.evaluate(()=>Array.from(document.querySelectorAll('#view h2.sec')).every(function(h){return h.textContent.indexOf('常用工具')<0;}));
out.quickToolsBtnGone=await p.evaluate(()=>document.querySelectorAll('#view [data-act="tool"][data-tool="money"]').length===0);
await p.evaluate(()=>{ var sc=scenario('meal'); sc.assign=sc.assign||{}; sc.assign[members()[0].id]=0; P.meId=members()[0].id; render(); });await p.waitForTimeout(100);
out.meStripHasAirline=await p.evaluate(()=>document.querySelector('.me-strip').textContent.indexOf('航空公司')>=0);
out.meStripHasTerminal=await p.evaluate(()=>document.querySelector('.me-strip').textContent.indexOf('報到航廈')>=0);
out.meStripHasRoom=await p.evaluate(()=>document.querySelector('.me-strip').textContent.indexOf('我的房號')>=0);
out.meStripHasMealGroup=await p.evaluate(()=>{ var sc=scenario('meal'); var gname=sc.names[0]||'第 1 組'; return document.querySelector('.me-strip').textContent.indexOf(gname)>=0; });
await p.evaluate(()=>{P.leader=true;render();ACT.homeScnVis();});await p.waitForTimeout(150);
out.homeScnRowCount=await p.evaluate(()=>document.querySelectorAll('#sheetRoot .it-row').length);
out.scnCount=await p.evaluate(()=>(S().groups.scenarios||[]).length);
out.homeScnAllOnByDefault=await p.evaluate(()=>document.querySelectorAll('#sheetRoot .it-row .tgl:not(.on)').length===0);
await p.evaluate(()=>document.querySelector('#sheetRoot [data-act="toggleHomeScn"][data-id="meal"]').click());await p.waitForTimeout(150);
out.homeScnMealNowOff=await p.evaluate(()=>{ var b=document.querySelector('#sheetRoot [data-act="toggleHomeScn"][data-id="meal"]'); return !!b&&!b.classList.contains('on'); });
await p.evaluate(()=>closeSheet());
await p.evaluate(()=>{P.tab='home';render();});await p.waitForTimeout(100);
out.mealHiddenFromHome=await p.evaluate(()=>{ var sc=scenario('meal'); var gname=sc.names[0]||'第 1 組'; return document.querySelector('.me-strip').textContent.indexOf(gname)<0; });
await p.evaluate(()=>ACT.homeScnVis());await p.waitForTimeout(150);
await p.evaluate(()=>document.querySelector('#sheetRoot [data-act="toggleHomeScn"][data-id="meal"]').click());await p.waitForTimeout(150);
await p.evaluate(()=>closeSheet());
await p.evaluate(()=>{P.tab='home';render();});await p.waitForTimeout(100);
out.mealShownAgainAfterToggleBack=await p.evaluate(()=>{ var sc=scenario('meal'); var gname=sc.names[0]||'第 1 組'; return document.querySelector('.me-strip').textContent.indexOf(gname)>=0; });
await p.evaluate(()=>{P.leader=false;P.meId='';render();});
// v2.5：我的資訊卡片拿掉「換一個名字」；報到航廈可在「分組→航空公司→航空公司與航廈設定」設定，不寫死
out.meStripNoRename=await p.evaluate(()=>!document.querySelector('.me-strip [data-act="pickMe"]'));
await p.evaluate(()=>{P.leader=true;P.tab='groups';P.scn='airline';render();});await p.waitForTimeout(100);
out.airlineSettingsBtnLabel=await p.evaluate(()=>{ var b=document.querySelector('[data-act="editAirlines"]'); return b?b.textContent:'BUTTON NOT FOUND'; });
out.airlineSectionEditBtnCount=await p.evaluate(()=>document.querySelectorAll('.grp h3 [data-act="editAirlines"]').length);
await p.evaluate(()=>ACT.editAirlines());await p.waitForTimeout(100);
out.airlineSheetMentionsTerminal=await p.evaluate(()=>{ var t=document.getElementById('sheetRoot').textContent; return t.indexOf('報到航廈')>=0 && t.indexOf('不是寫死的')>=0; });
await p.evaluate(()=>{ document.querySelector('[name=eva_note]').value='桃園第三航廈（regress）'; ACT.saveAirlines(); });await p.waitForTimeout(100);
await p.evaluate(()=>{ var m=members()[0]; m.airline='eva'; P.meId=m.id; P.tab='home'; render(); });await p.waitForTimeout(100);
out.terminalReflectsEditedNote=await p.evaluate(()=>document.querySelector('.me-strip').textContent.indexOf('第三航廈（regress）')>=0);
await p.evaluate(()=>{P.leader=false;P.meId='';render();});
// v2.6：集合倒數支援跨日（廣播多了日期欄位；舊廣播沒日期時，出發前自動當成出發日）
out.cdCases=await p.evaluate(()=>{
  function at(min){ var vn=tzParts(VN); var t=vn.h*60+vn.m+min; var d=Math.floor(t/1440); t=((t%1440)+1440)%1440;
    return {date:ymd(parseDate(vn.date)+d*86400000), time:pad(Math.floor(t/60))+':'+pad(t%60)}; }
  var b=S().broadcast, o={};
  function set(min){ var x=at(min); b.idle=false; b.date=x.date; b.time=x.time; }
  set(90);              o.in90min=countdownShort();
  set(15);              o.in15min=countdownShort();
  set(2*1440+8*60+30);  o.in2d8h=countdownShort().text;
  set(15*1440+30);      o.in15d=countdownShort().text;
  set(-60);             o.past1h=countdownShort();
  set(-300);            o.past5h=countdownShort().text;
  set(15*1440+30);      o.heroText=countdown().text;
  return o;
});
out.cdLegacyNoDate=await p.evaluate(()=>{
  // 舊廣播只有時間沒有日期：旅程還沒開始就當成出發日那天，不用重存也算得出來
  var st=S().settings, b=S().broadcast, vn=tzParts(VN);
  st.dayOverride=0; st.days=5; st.startDate=ymd(parseDate(vn.date)+10*86400000);
  b.idle=false; b.time='05:30'; delete b.date;
  return {status:dayInfo().status, inferredDate:bcDate(), startDate:st.startDate, short:countdownShort().text};
});
out.cdSheetHasDate=await p.evaluate(()=>{
  P.leader=true; ACT.editBroadcast();
  var d=document.querySelector('#sheetRoot [name="date"]');
  var chips=Array.from(document.querySelectorAll('#sheetRoot [data-act="chipSet"][data-target="date"]')).map(function(c){return c.textContent;});
  var v=d?d.value:''; closeSheet();
  return {hasDateField:!!d, prefilled:v, chips:chips};
});
out.cdBumpSetsDate=await p.evaluate(()=>{
  var b=S().broadcast; delete b.date;
  ACT.bumpTime({getAttribute:function(){return '30';}});
  return {date:b.date, time:b.time, diff:bcDiffMin()};
});
await p.evaluate(()=>{P.leader=false;P.meId='';render();});
// v2.8：行程的地圖鈕改成「搜尋地點」而不是預設走路導航；住宿卡的「走回飯店」仍維持路線
out.mapLinks=await p.evaluate(()=>{
  P.leader=false; P.tab='home'; render();
  var home=document.querySelector('#view .map-btn');
  P.tab='plan'; P.planDay=1; P.planMode='simple'; render();
  var tag=document.querySelector('#view .tag.map');
  return {
    homeBtn: home ? home.getAttribute('href').split('?')[0] : 'NONE',
    planTag: tag ? tag.getAttribute('href').split('?')[0] : 'NONE',
    planTagText: tag ? tag.textContent.trim() : 'NONE',
    searchFn: mapHref('沙壩市場'),
    dirFn: mapDirHref('沙壩市場')
  };
});
out.hotelWalkStillDir=await p.evaluate(()=>{
  P.tab='home'; P.cards={hotel:{o:1,ts:0}}; render();   // 住宿卡預設收合，先展開才看得到按鈕
  var a=Array.from(document.querySelectorAll('#view a.btn')).filter(function(x){return x.textContent.indexOf('走回飯店')>=0;})[0];
  return a ? a.getAttribute('href').indexOf('/maps/dir/')>=0 : 'BUTTON NOT FOUND';
});
await p.evaluate(()=>{P.leader=false;P.meId='';P.tab='home';render();});
// v2.9：行程頁的模式切換由「長輩字卡」更名為「重點字卡」
out.planSegLabels=await p.evaluate(()=>{
  P.tab='plan'; P.planDay=1; render();
  return Array.from(document.querySelectorAll('#view .seg button')).map(function(b){return b.textContent.trim();});
});
await p.evaluate(()=>{P.tab='home';render();});
// v3.0：溝通圖卡改成兩層（分類 → 圖卡），每張都要有空耳中文
out.phrases=await p.evaluate(()=>{
  P.tab='tools'; P.tool='phrases'; P.phCat=''; render();
  var cats=Array.from(document.querySelectorAll('#view [data-act="phCat"]'));
  var total=PHRASES.length;
  var noSay=PHRASES.filter(function(p){return !p.say;}).length;
  var noCat=PHRASES.filter(function(p){return !p.cat||!PHRASE_CATS.some(function(c){return c.id===p.cat;});}).length;
  var counts=PHRASE_CATS.map(function(c){return c.name+':'+PHRASES.filter(function(p){return p.cat===c.id;}).length;});
  return {catBtns:cats.length, catCount:PHRASE_CATS.length, total:total, missingSay:noSay, badCat:noCat, perCat:counts,
          cardsHiddenOnCatList:document.querySelectorAll('#view [data-act="phrase"]').length};
});
out.phraseDrill=await p.evaluate(()=>{
  document.querySelector('#view [data-act="phCat"][data-cat="eat"]').click();
  var rows=document.querySelectorAll('#view [data-act="phrase"]').length;
  var hasSay=document.querySelectorAll('#view .say-s').length;
  var back=!!document.querySelector('#view [data-act="phCat"][data-cat=""]');
  return {cat:P.phCat, rows:rows, sayShown:hasSay, hasBackBtn:back};
});
out.phraseBackToCats=await p.evaluate(()=>{
  document.querySelector('#view [data-act="phCat"][data-cat=""]').click();
  return {cat:P.phCat, catBtns:document.querySelectorAll('#view [data-act="phCat"]').length};
});
out.phraseFullOpens=await p.evaluate(()=>{
  document.querySelector('#view [data-act="phCat"][data-cat="sick"]').click();
  document.querySelectorAll('#view [data-act="phrase"]')[1].click();
  var f=document.querySelector('.full');
  var txt=f?f.textContent:'';
  closeFull();
  return {opened:!!f, hasSayLabel:txt.indexOf('空耳中文')>=0};
});
await p.evaluate(()=>{P.tab='home';P.tool='menu';P.phCat='';render();});
// v3.1：8 張新知識小卡都要能開、有內容、有返回鍵，且都掛在工具選單上
out.knowledgeCards=await p.evaluate(()=>{
  var ids=['entry','weather','exchange','phoneset','grab','health','market','basics'];
  var menuHas=[], opened=[], tooShort=[], noBack=[];
  P.tab='tools'; P.tool='menu'; render();
  ids.forEach(function(id){ if(!document.querySelector('#view [data-act="tool"][data-tool="'+id+'"]')) menuHas.push(id); });
  ids.forEach(function(id){
    P.tool=id; render();
    var v=document.getElementById('view');
    var t=v.textContent.replace(/\s+/g,'');
    opened.push(id+':'+t.length);
    if(t.length<400) tooShort.push(id);
    if(!v.querySelector('[data-act="tool"][data-tool="menu"]')) noBack.push(id);
  });
  P.tool='menu'; render();
  return {missingFromMenu:menuHas, charCounts:opened, tooShort:tooShort, missingBackBtn:noBack};
});
await p.evaluate(()=>{P.tab='home';P.tool='menu';render();});
// 版本字樣
await p.evaluate(()=>{P.tab='tools';P.tool='menu';render();});
out.ver=await p.evaluate(()=>document.querySelector('.ver').textContent);
console.log(JSON.stringify(out,null,1),errs.length?errs:'no errors');
await b.close();})();

/* ===== 事件處理 ===== */
/* 「現在＋N 分」：先算出絕對時間，再決定要寫成台灣時間還是當地時間（出發日搭機前人在台灣）。
   跨過午夜時日期跟著進位，不然倒數會變成「已過」。 */
function wallAt(ms,tz){ var p=tzParts(tz,ms); return {date:p.date,hm:p.hm}; }
function nowPlusSlot(min){ var ms=Math.floor(nowMs()/60000)*60000+min*60000, tw=wallAt(ms,TW), lt=wallAt(ms,LTZ());
  /* 挑「寫下去之後倒數算得回同一個時間」的那種寫法；出發日（例：越南）08:01～09:00 兩種都對不上（大家在飛機上），
     這時寫當地時間並另外記 tz:'VN'（舊名字，意思是「當地時間」），倒數照 tz 算 */
  if(slotMs(tw.date,tw.hm)===ms) return tw; if(slotMs(lt.date,lt.hm)===ms) return lt; lt.tz='VN'; return lt; }
function nowPlus(min){ return nowPlusSlot(min).hm; }
function nowPlusDate(min){ return nowPlusSlot(min).date; }
function stamp(){ return nowPlus(0); }
/* 刪除、清空這類按鈕：第一次按只把字換成「再按一次…」，第二次才真的做 */
function sure(t,label){ if(t.getAttribute('data-sure')==='1') return true; t.setAttribute('data-sure','1'); t.innerHTML=ic('alert')+esc(label); return false; }
/* 下載一段文字成檔案（匯出備份檔、下載某一份自動備份） */
function dlText(name,text){ try{ var blob=new Blob([text],{type:'application/json'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },500); return true; }catch(e){ return false; } }
/* 清空與還原共用：驗 PIN → 按鈕變「處理中」→ 整批寫入。
   失敗的原因寫在表單裡（toast 兩秒就不見，來不及看），而且一律說明「資料都沒有變動」。 */
function bulkMsg(e,verb){
  if(e==='sim') return '時間模擬中不能'+verb+'，請先結束模擬';
  if(e==='offline') return verb+'要連上雲端才能做，請到有網路的地方再試一次。資料都沒有變動';
  if(e==='pending') return (Store.q.length?'還有 '+Store.q.length+' 筆修改':'剛剛的修改')+'正在送上雲端，請等幾秒再按一次。資料都沒有變動';
  if(e==='denied') return '雲端規則擋下了這次'+verb+'，所有資料都沒有變動。請確認 Firebase 規則已經換成 v3.22 的新版';
  if(e==='nospace') return '手機空間不足，沒辦法先備份，所以沒有'+verb+'。可以先下載備份檔再試';
  return verb+'沒有成功，所有資料都沒有變動，請稍後再試';
}
function bulkAsk(t,verb,make,reason,done){
  var box=el('sheetErr'), inp=el('sheetRoot').querySelector('[name=pin]'), pin=inp?inp.value.trim():'';
  function err(msg){ if(box){ box.innerHTML=ic('alert')+'<span>'+esc(msg)+'</span>'; box.hidden=false; } toast(msg); }
  if(!pin){ err('請先輸入管理 PIN'); if(inp) inp.focus(); return; }
  if(!pinOK(pin)){ err('PIN 不正確，沒有'+verb); if(inp) inp.value=''; return; }
  var label=t.innerHTML; t.disabled=true; t.innerHTML=verb+'中…';
  bulkWrite(make,reason,function(e,bk){
    if(!e) return done(bk);
    if(t.isConnected){ t.disabled=false; t.innerHTML=label; }
    err(bulkMsg(e,verb));
  });
}
var ACT={
  tab:function(t){ P.tab=t.getAttribute('data-tab');
    /* 首頁「我的資訊」的格子帶 data-scn（直接跳到那個情境）；設定表單的按鈕帶 data-cat（跳到那個分類） */
    if(t.getAttribute('data-scn')){ P.scn=t.getAttribute('data-scn'); P.cat=''; } else if(t.getAttribute('data-cat')){ P.cat=t.getAttribute('data-cat'); P.scn=''; }
    if(P.tab==='tools') P.tool='menu'; closeSheet(); render(); window.scrollTo(0,0); },
  planDay:function(t){ P.planDay=Number(t.getAttribute('data-day')); render(); },
  planMode:function(t){ P.planMode=t.getAttribute('data-mode'); savePrefs(); render(); },
  roomsSeg:function(t){ P.roomsSeg=t.getAttribute('data-seg'); render(); },
  scn:function(t){ P.scn=t.getAttribute('data-id'); P.cat=''; render(); },
  cat:function(t){ P.cat=t.getAttribute('data-cat'); P.scn=''; render(); },
  tool:function(t){ P.tab='tools'; P.tool=t.getAttribute('data-tool'); P.phCat=''; closeSheet(); render(); window.scrollTo(0,0); },
  phCat:function(t){ P.phCat=t.getAttribute('data-cat')||''; render(); window.scrollTo(0,0); },
  tipClose:function(){ P.tipDismissed=true; savePrefs(); render(); },
  /* 能直接叫系統安裝視窗就直接叫（Chrome 系列），叫不出來才開圖文教學（iOS Safari、LINE 內建瀏覽器） */
  installApp:function(){
    if(isStandalone()){ toast('這支手機已經裝好了'); return; }
    var p=INSTALL_PROMPT;
    if(p&&p.prompt){
      INSTALL_PROMPT=null;
      try{
        p.prompt();
        if(p.userChoice&&p.userChoice.then) p.userChoice.then(function(r){
          if(r&&r.outcome==='accepted') toast('安裝中，稍後看主畫面');
          else INSTALL_PROMPT=p;   /* 使用者按取消：留著讓他等一下還能再按 */
        },function(){ INSTALL_PROMPT=p; });
        return;
      }catch(x){ INSTALL_PROMPT=null; }
    }
    sheetInstall();
  },
  fontCycle:function(){ P.fs=P.fs==='md'?'lg':(P.fs==='lg'?'xl':'md'); savePrefs(); render(); toast('字體：'+({md:'標準',lg:'大',xl:'特大'})[P.fs]); },
  leaderToggle:function(){ if(P.leader) sheetLeaderMenu(); else sheetPin(); },
  leaderLock:function(){ P.leader=false; savePrefs(); closeSheet(); if(P.tool==='rollcall') P.tool='menu'; render(); toast('已鎖定，回到團員模式'); },
  pinKey:function(t){ var k=t.getAttribute('data-k'); if(k==='C') SHEET.pin=''; else if(k==='⌫') SHEET.pin=SHEET.pin.slice(0,-1); else if(SHEET.pin.length<4) SHEET.pin+=k;
    var d=el('pinDisp'); var s=SHEET.pin; d.textContent=[0,1,2,3].map(function(i){return s[i]?'●':'＿';}).join(' ');
    if(s.length===4){ if(pinOK(s)){ P.leader=true; savePrefs(); closeSheet(); render(); toast('已進入管理模式'); pinMigrate(); } else { toast('PIN 不正確'); SHEET.pin=''; setTimeout(function(){ if(el('pinDisp')) el('pinDisp').textContent='＿ ＿ ＿ ＿'; },400); } } },
  sheetBg:function(t,ev){ if(ev.target===t) closeSheet(); },
  sheetClose:function(){ closeSheet(); },
  fullClose:function(){ if(FULL_LOCK) return; closeFull(); },
  fullTaxi:function(){ FULL_LOCK=false; openFull(taxiFull()); },
  fullLock:function(){ FULL_LOCK=true; openFull(taxiFull()); toast('已鎖定，關閉前請按住解鎖鍵 2 秒'); },
  fullUnlock:function(){ /* 由長按處理，點一下不放行 */ toast('請按住 2 秒'); },
  phrase:function(t){ var p=phById(t.getAttribute('data-id')); if(p) openFull(phraseFull(p)); },
  lostCard:function(){ openFull(phraseFull(lostPhrase())); },
  /* ===== 工具頁內容（v3.23）===== */
  tlCard:function(t){ P.tab='tools'; P.tool='card'; P.card=t.getAttribute('data-id')||''; closeSheet(); render(); window.scrollTo(0,0); },
  tlCardEdit:function(t){ sheetCardEdit(t.getAttribute('data-id')||'',t.getAttribute('data-sec')||''); },
  mdIns:function(t){ mdInsert(t.getAttribute('data-v'),t.getAttribute('data-inline')==='1'); },
  mdBold:function(){ mdWrap('**'); },
  tlCardSave:function(){ var id=SHEET.id, title=sv('title'); if(!title){ toast('請輸入標題'); return; }
    var c=id?tlCard(id):null; if(!c){ c={id:uid()}; tlArr('cards').push(c); }
    c.sec=sv('sec')==='local'?'local':'pre'; c.title=title; c.sub=sv('sub'); c.icon=ICONS[sv('icon')]?sv('icon'):'info';
    var b=el('sheetRoot').querySelector('[name=body]'); c.body=b?b.value.replace(/\s+$/,''):'';
    closeSheet(); Store.save('tools'); toast(id?'小卡已儲存':'已新增小卡'); },
  tlCardDel:function(t){ if(!sure(t,'再按一次刪除')) return; var id=SHEET.id; Store.keepPrev('tools');
    tl().cards=tlArr('cards').filter(function(c){ return !(c&&c.id===id); }); if(P.tool==='card'&&P.card===id) P.tool='menu';
    closeSheet(); Store.save('tools'); toast('已刪除小卡'); },
  /* 只跟同一區的小卡交換位置；表單留著，已經打的字不會不見 */
  tlCardMove:function(t){ var c=tlCard(SHEET.id); if(!c) return; var dir=Number(t.getAttribute('data-dir')), all=tlArr('cards'), same=tlCards(c.sec==='local'?'local':'pre'), i=same.indexOf(c), j=i+dir;
    if(i<0||j<0||j>=same.length){ toast(dir<0?'已經在最前面':'已經在最後面'); return; }
    var a=all.indexOf(c), b=all.indexOf(same[j]); all[a]=same[j]; all[b]=c; Store.save('tools'); toast(dir<0?'已往前移':'已往後移'); },
  taxiEdit:function(){ closeFull(); sheetTaxi(); },
  taxiSave:function(){ var t=tl(); t.taxi={fl:sv('fl'),zh:sv('zh'),tip:sv('tip')}; t.lab={hotel:sv('lab_hotel'),addr:sv('lab_addr'),phone:sv('lab_phone'),call:sv('lab_call')};
    closeSheet(); Store.save('tools'); toast('計程車卡已儲存'); },
  langEdit:function(){ sheetLang(); },
  langSave:function(){ var t=tl(); t.lang=sv('lang'); t.langTag=sv('langTag'); t.thanks=sv('thanks'); closeSheet(); Store.save('tools'); toast('外語設定已儲存'); },
  phCatEdit:function(t){ sheetPhCat(t.getAttribute('data-id')||''); },
  phCatSave:function(){ var name=sv('name'); if(!name){ toast('請輸入類別名稱'); return; }
    var id=SHEET.id, c=id?tlCats().filter(function(x){ return x.id===id; })[0]:null; if(!c){ c={id:uid()}; tlArr('cats').push(c); }
    c.name=name; c.e=sv('e'); c.sub=sv('sub'); closeSheet(); Store.save('tools'); toast('類別已儲存'); },
  phCatDel:function(t){ if(!sure(t,'連圖卡一起刪？再按一次')) return; var id=SHEET.id, d=tl(); Store.keepPrev('tools');
    d.cats=tlArr('cats').filter(function(c){ return !(c&&c.id===id); }); d.phrases=tlArr('phrases').filter(function(p){ return !(p&&p.cat===id); });
    if(P.phCat===id) P.phCat=''; closeSheet(); Store.save('tools'); toast('已刪除類別'); },
  phCatMove:function(t){ var dir=Number(t.getAttribute('data-dir')), cs=tlArr('cats'), i=cs.findIndex(function(c){ return c&&c.id===SHEET.id; }), j=i+dir;
    if(i<0||j<0||j>=cs.length){ toast(dir<0?'已經在最前面':'已經在最後面'); return; }
    var tmp=cs[i]; cs[i]=cs[j]; cs[j]=tmp; Store.save('tools'); toast(dir<0?'已往前移':'已往後移'); },
  phEdit:function(t){ sheetPhrase(t.getAttribute('data-id')||'',t.getAttribute('data-cat')||P.phCat); },
  phSave:function(){ var zh=sv('zh'); if(!zh){ toast('請輸入中文'); return; }
    var id=SHEET.id, p=id?phById(id):null; if(!p){ p={id:uid()}; tlArr('phrases').push(p); }
    p.zh=zh; p.fl=sv('fl'); p.say=sv('say'); p.e=sv('e'); p.cat=sv('cat')||p.cat||''; if(sck('lost')) p.lost=1; else delete p.lost;
    closeSheet(); Store.save('tools'); toast('圖卡已儲存'); },
  phDel:function(t){ if(!sure(t,'再按一次刪除')) return; var id=SHEET.id; tl().phrases=tlArr('phrases').filter(function(p){ return !(p&&p.id===id); });
    closeSheet(); Store.save('tools'); toast('已刪除'); },
  phMove:function(t){ var p=phById(SHEET.id); if(!p) return; var dir=Number(t.getAttribute('data-dir')), all=tlArr('phrases');
    var cid=tlCats().some(function(c){ return c.id===p.cat; })?p.cat:'_', same=phInCat(cid), i=same.indexOf(p), j=i+dir;
    if(i<0||j<0||j>=same.length){ toast(dir<0?'已經在最上面':'已經在最下面'); return; }
    var a=all.indexOf(p), b=all.indexOf(same[j]); all[a]=same[j]; all[b]=p; Store.save('tools'); toast(dir<0?'已上移':'已下移'); },
  phClearAsk:function(){ sheetTlClear('phrases'); },
  tlClearAsk:function(t){ sheetTlClear(t.getAttribute('data-sec')); },
  tlClearGo:function(t){ var sec=t.getAttribute('data-sec'), d=tl(); Store.keepPrev('tools');
    if(sec==='quick'){ d.taxi={}; d.lab={}; d.money={}; d.cats=[]; d.phrases=[]; d.sos=[]; d.lang=''; d.langTag=''; d.thanks=''; P.money=[]; P.phCat=''; }
    else if(sec==='phrases'){ d.cats=[]; d.phrases=[]; P.phCat=''; }
    else d.cards=tlArr('cards').filter(function(c){ return !(c&&(c.sec==='local'?'local':'pre')===sec); });
    closeSheet(); Store.save('tools'); toast('已清空'); },
  sosEdit:function(){ sheetSOS(); },
  sosSave:function(){ var out=[]; for(var i=0;i<(SHEET.n||0);i++){ var n=sv('s_name_'+i), ph=sv('s_phone_'+i), sb=sv('s_sub_'+i); if(n||ph) out.push({name:n||'電話',sub:sb,phone:ph}); }
    tl().sos=out; var st=S().settings; if(st.embassyPhone){ delete st.embassyPhone; Store.save('settings'); }
    closeSheet(); Store.save('tools'); toast('當地電話已儲存'); },
  moneyEdit:function(){ sheetMoney(); },
  moneyPreset:function(t){ var p=MONEY_PRESETS.filter(function(x){ return x.id===t.getAttribute('data-id'); })[0]; if(!p) return; moneyFill(p);
    t.parentNode.querySelectorAll('.chip').forEach(function(b){ b.classList.toggle('on',b===t); }); toast('已帶入「'+p.name+'」，確認匯率後按儲存'); },
  moneyRow:function(){ moneyAddRow({}); },
  moneySave:function(){ var rate=Number(sv('m_rate')), notes=[];
    for(var i=0;i<(SHEET.mn||0);i++){ var v=Number(sv('n_v_'+i)); if(v>0) notes.push({v:v,color:hex6(sv('n_c_'+i)),note:sv('n_t_'+i)}); }
    if(!notes.length){ toast('至少要填一種面額'); return; }
    if(!(rate>0)){ toast('請填匯率'); return; }
    notes.sort(function(a,b){ return b.v-a.v; });
    tl().money={name:sv('m_name'),unit:sv('m_unit'),dir:sv('m_dir')==='twd'?'twd':'fx',rate:rate,warn:sv('m_warn'),notes:notes};
    P.money=[]; closeSheet(); Store.save('tools'); toast('外幣已儲存'); },
  moneyWipe:function(t){ if(!sure(t,'再按一次清空')) return; Store.keepPrev('tools'); tl().money={}; P.money=[]; closeSheet(); Store.save('tools'); toast('已清空外幣'); },
  tplList:function(){ sheetTpl(); },
  tplGo:function(t){ var k=t.getAttribute('data-id'); if(!TPL[k]) return; if(!sure(t,'確定？')) return;
    Store.keepPrev('tools'); Store.s.tools=clone(TPL[k].tools); P.tool='menu'; P.phCat=''; P.money=[];
    closeSheet(); Store.save('tools'); toast('已套用「'+TPL[k].name+'」'); },
  noop:function(){},
  resetLocal:function(){ try{ localStorage.removeItem('sapa-data'); }catch(e){} location.reload(); },
  /* 更新：先把 Service Worker 與快取清掉再重載，不然重載回來的還是舊版 */
  reloadApp:function(){ var done=function(){ location.reload(); };
    if(navigator.onLine===false){ toast('現在沒有網路，等有訊號再按「更新」'); return; }
    toast('正在確認網路…');
    /* 先確認真的抓得到新版，才清快取；不然在山上清掉快取又載不到，就什麼都沒了 */
    withTimeout(fetch(location.pathname.replace(/[^/]*$/,'')+'index.html?cb='+Date.now(),{cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error(r.status); }),8000)
      .then(function(){
        return Promise.all([navigator.serviceWorker?navigator.serviceWorker.getRegistrations().then(function(rs){ return Promise.all(rs.map(function(r){ return r.unregister(); })); }):null,
                            window.caches?caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); }):null]).then(done,done);
      })
      .catch(function(){ toast('現在連不到伺服器，先不更新；有訊號時再按一次'); }); },
  verLater:function(){ Store._verDismissed=true; var b=el('verBar'); if(b) b.hidden=true; },
  restorePrev:function(t){ if(!P.leader) return; if(SIM_OFF){ toast('時間模擬中不能還原，請先結束模擬'); return; } var k=t.getAttribute('data-key'); if(!k) return;
    if(Store.restorePrev(k)){ closeSheet(); toast('已還原'+DOC_NAMES[k]+'的上一版，並同步給全團'); } else toast('沒有可還原的版本'); },
  simPick:function(){ sheetSim(); },
  simSet:function(t){ var v=t.getAttribute('data-val'); if(!v){ var i=el('sheetRoot').querySelector('[name="simAt"]'); v=i&&i.value; }
    v=(v||'').slice(0,16);
    if(isNaN(simParse(v))){ toast('請先選日期和時間'); return; }
    try{ sessionStorage.setItem('sapa-sim',v); }catch(e){ toast('這支手機不支援時間模擬'); return; }
    location.replace(location.pathname+'?sim='+v); },
  simEnd:function(){ try{ sessionStorage.removeItem('sapa-sim'); }catch(e){} location.replace(location.pathname); },
  prevList:function(){ if(!P.leader) return; sheetPrev(); },
  pickMe:function(){ sheetPickMe(); },
  setMe:function(t){ P.meId=t.getAttribute('data-id')||''; savePrefs(); closeSheet(); render(); toast(P.meId?'已標記：'+member(P.meId).name:'已取消標記'); },
  memberTap:function(t){ var id=t.getAttribute('data-id'); if(P.leader) sheetMember(id); else sheetMemberView(id); },
  editMember:function(t){ sheetMember(t.getAttribute('data-id')||''); },
  saveMember:function(){ var name=sv('name'); if(!name){ toast('請輸入姓名'); return; } var ms=members(); var editId=SHEET.id; var m=editId?member(editId):null; if(!m){ m={id:uid()}; ms.push(m); }
    m.name=name; m.emoji=sv('emoji'); m.bg=sv('bg')||'bg-white'; m.border=sv('border')||'bd-grey'; m.remark=sv('remark'); m.room=sv('room'); m.phone=sv('phone'); closeSheet();
    /* 注意：closeSheet() 會把 SHEET 設成 null，判斷分支一定要用上面先存好的 editId，不能再讀 SHEET.id */
    if(editId) Store.savePath('members','items/'+ms.indexOf(m), m); else Store.save('members'); toast('已儲存'); },
  delMember:function(){ var id=SHEET.id; S().members.items=members().filter(function(m){return m.id!==id;}); closeSheet(); Store.save('members'); toast('已移出名單'); },
  editBroadcast:function(){ sheetBroadcast(); },
  saveBroadcast:function(){ var b=S().broadcast, z=el('sheetRoot').querySelector('[name="tz"]'), nd=sv('date'), nt=sv('time');
    /* 只有「現在＋N 分」按鈕帶出的時間、而且之後沒被改過，才沿用它算好的時區 */
    var ntz=(z&&z.value&&z.getAttribute('data-at')===nd+' '+nt)?z.value:'';
    /* 擋掉「集合時間已經過了」：最常見是日期欄還留著前一天，只改了時間。
       存下去的話全團首頁會把它當過期廣播藏起來，主辦人卻以為發出去了。 */
    /* 日期時間都沒改、而且目前這則還有效（例如只改地點或叮嚀）就不擋：集合時間過後 4 小時內它都還算數 */
    var same=(nd===(b.date||bcDate())&&nt===b.time&&bcActive());
    if(nt&&nd&&!same){ var ms=slotMs(nd,nt,ntz?ntz==='TW':undefined);
      if(!isNaN(ms)&&Math.round(ms/60000)-nowMin()<-30){
        toast('這個集合時間（'+mdw(nd)+' '+nt+'）已經過了，沒有存。要發明天的集合，請先按日期下面的「明天」');
        var dEl=el('sheetRoot').querySelector('[name="date"]'); if(dEl){ try{ dEl.focus(); }catch(e){} }
        return; } }
    b.date=nd; b.time=nt; if(ntz) b.tz=ntz; else delete b.tz; b.idle=false; b.label=sv('label')||'集合'; b.location=sv('location'); b.tip=sv('tip'); b.updatedAt=stamp(); closeSheet(); Store.save('broadcast'); toast('廣播已更新，全團手機會同步');
    /* 存完直接把「貼到 LINE」端到管理者面前：沒開 App 的人只能靠群組通知 */
    render(); setTimeout(sheetShare,350); },
  shareBroadcast:function(){ sheetShare(); },
  lineSend:function(){ var u='https://line.me/R/msg/text/?'+encodeURIComponent(bcShareText());
    try{ var w=window.open(u,'_blank'); if(!w) location.href=u; }catch(e){ location.href=u; } },
  copyShare:function(){ var v=bcShareText();
    try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(v); toast('已複製，貼到 LINE 群組就好'); return; } }catch(e){}
    try{ var ta=document.createElement('textarea'); ta.value=v; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast('已複製，貼到 LINE 群組就好'); }
    catch(e){ toast('請長按上面那段文字手動複製'); } },
  clearBroadcast:function(){ openSheet({title:'清空目前廣播？',body:
    '<div class="muted">清空後，首頁廣播卡會改成顯示：</div>'+
    '<div class="hero" style="margin-top:.6rem"><div class="lab">'+ic('megaphone')+'即時廣播</div><div class="time" style="font-size:1.9rem">自由活動</div><div class="loc"><span>目前沒有集合安排，請等下次廣播通知。</span></div></div>'+
    '<div class="muted" style="margin-top:.6rem">下一次設定集合時間時會自動恢復正常顯示。</div>',
    foot:'<button class="btn" data-act="sheetClose">取消</button><button class="btn warn" data-act="clearBroadcastGo">'+ic('trash')+'確定清空</button>'}); },
  clearBroadcastGo:function(){ var b=S().broadcast; b.time=''; b.label=''; b.location=''; b.tip=''; b.idle=true; b.date=tzParts(LTZ()).date; b.updatedAt=stamp();   /* 帶日期：隔天自動失效 */
    closeSheet(); Store.save('broadcast'); toast('已清空，現在顯示「自由活動」'); },
  bumpTime:function(t){ var b=S().broadcast, n=Number(t.getAttribute('data-min')), sl=nowPlusSlot(n); b.time=sl.hm; b.date=sl.date; if(sl.tz) b.tz=sl.tz; else delete b.tz; b.idle=false; b.updatedAt=stamp(); Store.save('broadcast'); toast('集合時間改為 '+b.time); },
  chipSet:function(t){ var e=el('sheetRoot').querySelector('[name="'+t.getAttribute('data-target')+'"]'); if(e){ e.value=t.getAttribute('data-val'); e.focus(); } },
  chipTimeFromNow:function(t){ var n=Number(t.getAttribute('data-min')), sl=nowPlusSlot(n); setTimeField('time',sl.hm); var d=el('sheetRoot').querySelector('[name="date"]'); if(d) d.value=sl.date;
    var z=el('sheetRoot').querySelector('[name="tz"]'); if(z){ z.value=sl.tz||''; z.setAttribute('data-at',sl.date+' '+sl.hm); } },
  pick:function(t){ var g=t.parentNode; g.querySelectorAll('button').forEach(function(b){b.classList.remove('on');}); t.classList.add('on'); var h=el('sheetRoot').querySelector('input[name="'+g.getAttribute('data-group')+'"]'); if(h) h.value=t.getAttribute('data-val'); },
  pickMulti:function(t){ t.classList.toggle('on'); var g=t.getAttribute('data-group'); var vals=[]; t.parentNode.querySelectorAll('.on').forEach(function(b){vals.push(b.getAttribute('data-val'));}); var h=el('sheetRoot').querySelector('input[name="'+g+'"]'); if(h) h.value=vals.join(','); },
  editMorning:function(){ sheetMorning(); },
  saveMorning:function(){ var m=S().settings.morning=S().settings.morning||{}; m.wake=sv('wake'); m.breakfast=sv('breakfast'); m.luggage=sv('luggage'); m.depart=sv('depart'); m.note=sv('note'); closeSheet(); Store.save('settings'); toast('明早時程已更新'); },
  moveItem:function(t){ var id=t.getAttribute('data-id'), dir=Number(t.getAttribute('data-dir')); var all=items(); var i=all.findIndex(function(x){return x.id===id;}); if(i<0) return; var day=all[i].day; var j=i+dir; while(j>=0&&j<all.length&&all[j].day!==day) j+=dir; if(j<0||j>=all.length) return; var tmp=all[i]; all[i]=all[j]; all[j]=tmp; Store.save('itinerary'); },
  setCurrent:function(t){ var id=t.getAttribute('data-id'); var cur=null; items().forEach(function(x){ x.isCurrent=(x.id===id&&!x.isCurrent)?true:false; if(x.isCurrent) cur=x; }); if(cur){ var b=S().broadcast; b.location=cur.title; b.updatedAt=stamp(); Store.save('broadcast'); } Store.save('itinerary'); toast(cur?'已設為當前站，首頁地點已連動':'已取消當前站'); },
  cancelItem:function(t){ var id=t.getAttribute('data-id'); items().forEach(function(x){ if(x.id===id){ x.isCanceled=!x.isCanceled; if(x.isCanceled) x.isCurrent=false; } }); Store.save('itinerary'); },
  editItem:function(t){ sheetItem(t.getAttribute('data-id')||''); },
  editTripName:function(){ sheetTripName(); },
  saveTripName:function(){ var v=sv('tripName'); if(!v){ toast('請輸入團名'); return; }
    S().settings.tripName=v; closeSheet(); Store.save('settings'); toast('團名已更新'); },
  tnPick:function(t){ var i=el('sheetRoot').querySelector('[name=tripName]'); if(i){ i.value=t.getAttribute('data-val'); i.dispatchEvent(new Event('input',{bubbles:true})); } },
  editTags:function(){ sheetTags(); },
  editTag:function(t){ sheetTagEdit(t.getAttribute('data-id')||''); },
  saveTag:function(){ var label=sv('label'); if(!label){ toast('請輸入標籤文字'); return; }
    var st=S().settings; if(!st.tags||!st.tags.length) st.tags=tagList().slice();
    var d=SHEET.id?st.tags.filter(function(x){return x.id===SHEET.id;})[0]:null;
    if(!d){ d={id:uid()}; st.tags.push(d); }
    d.label=label; d.icon=sv('icon')||'coat';
    closeSheet(); Store.save('settings'); sheetTags(); toast('標籤已儲存'); },
  delTag:function(){ var id=SHEET.id, st=S().settings;
    if(!st.tags||!st.tags.length) st.tags=tagList().slice();
    st.tags=st.tags.filter(function(x){return x.id!==id;});
    var touched=false; items().forEach(function(x){ if((x.tags||[]).indexOf(id)>=0){ x.tags=x.tags.filter(function(t){return t!==id;}); touched=true; } });
    closeSheet(); Store.save('settings'); if(touched) Store.save('itinerary'); sheetTags(); toast('已刪除標籤'); },
  moveTag:function(t){ var id=t.getAttribute('data-id'), dir=Number(t.getAttribute('data-dir')), st=S().settings;
    if(!st.tags||!st.tags.length) st.tags=tagList().slice();
    var i=-1; st.tags.forEach(function(x,k){ if(x.id===id) i=k; }); var j=i+dir;
    if(i<0||j<0||j>=st.tags.length) return;
    var tmp=st.tags[i]; st.tags[i]=st.tags[j]; st.tags[j]=tmp;
    Store.save('settings'); sheetTags(); },
  saveItem:function(){ var title=sv('title'); if(!title){ toast('請輸入名稱'); return; } var all=items(); var x=SHEET.id?all.filter(function(i){return i.id===SHEET.id;})[0]:null; if(!x){ x={id:uid(),tags:[]}; all.push(x); }
    x.day=Number(sv('day'))||1; x.time=sv('time'); x.title=title; x.desc=sv('desc'); x.place=sv('place'); x.detail=sv('detail'); x.tags=sv('tags')?sv('tags').split(','):[]; all.sort(function(a,b){ return a.day-b.day; }); closeSheet(); P.planDay=x.day; Store.save('itinerary'); toast('行程已儲存'); },
  delItem:function(){ var id=SHEET.id; S().itinerary.items=items().filter(function(x){return x.id!==id;});
    /* 行程刪掉了，它的底圖也要一起清掉，不然那 10 幾 KB 會永遠留在資料庫裡 */
    if(itemBg(id)){ delete photoMap()[id]; Store.savePath('photos','items/'+id,null); }
    closeSheet(); Store.save('itinerary'); toast('已刪除'); },
  dbgApply:function(){ if(!P.leader) return; dbgApply(); },
  dbgRemove:function(){ if(!P.leader) return;
    var f=el('dbgF'); if(!f) return; var id=f.getAttribute('data-id'); if(!id) return;
    delete photoMap()[id];
    Store.savePath('photos','items/'+id,null); DBG=null; render(); dbgRefresh(); toast('已移除這個行程的底圖'); },
  editRooms:function(){ sheetRooms(); },
  saveRooms:function(){ var map={}; el('sheetRoot').querySelectorAll('input[data-old]').forEach(function(i){ if(i.value.trim()) map[i.getAttribute('data-old')]=i.value.trim(); }); members().forEach(function(m){ var k=m.room||''; if(map[k]!==undefined) m.room=map[k]; }); closeSheet(); Store.save('members'); toast('房號已更新'); },
  copyTxt:function(t){ var v=t.getAttribute('data-v')||'';
    try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(v); toast('已複製：'+v); return; } }catch(e){}
    try{ var ta=document.createElement('textarea'); ta.value=v; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast('已複製：'+v); }
    catch(e){ toast('請長按文字手動複製'); } },
  pickHotel:function(){ sheetHotel(); },
  homeScnVis:function(){ sheetHomeScn(); },
  pushInfo:function(){ if(P.leader) sheetPush(); },
  toggleHomeScn:function(t){ if(!P.leader) return; homeScnToggle(t.getAttribute('data-id')); },
  setHotel:function(t){ S().settings.currentHotelId=t.getAttribute('data-id'); closeSheet(); Store.save('settings'); toast('已切換入住飯店'); },
  editHotel:function(t){ sheetHotelEdit(t.getAttribute('data-id')||''); },
  saveHotel:function(){ var st=S().settings; st.hotels=st.hotels||[]; var h=SHEET.id?st.hotels.filter(function(x){return x.id===SHEET.id;})[0]:null; if(!h){ h={id:uid()}; st.hotels.push(h); if(!st.currentHotelId) st.currentHotelId=h.id; }
    ['name','nameVi','addrVi','phone','leaderRoom','wifi','wifiPass','wifiNote','nights','breakfast'].forEach(function(k){ h[k]=sv(k); }); closeSheet(); Store.save('settings'); toast('飯店資料已儲存'); },
  delHotel:function(){ var st=S().settings; st.hotels=(st.hotels||[]).filter(function(x){return x.id!==SHEET.id;}); if(st.currentHotelId===SHEET.id) st.currentHotelId=(st.hotels[0]||{}).id||''; closeSheet(); Store.save('settings'); },
  shuffle:function(){ var sc=scnLive(scenario()); if(!sc) return; var cnt=scnCount(sc); if(!cnt) return; var units={}, list=[]; members().forEach(function(m){ var k=m.room||('_'+m.id); (units[k]=units[k]||[]).push(m.id); }); Object.keys(units).forEach(function(k){list.push(units[k]);});
    for(var i=list.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=list[i]; list[i]=list[j]; list[j]=tmp; }
    list.sort(function(a,b){return b.length-a.length;}); var sizes=[], assign={}; for(var g=0;g<cnt;g++) sizes.push(0);
    list.forEach(function(u){ var gi=0; for(var g2=1;g2<cnt;g2++) if(sizes[g2]<sizes[gi]) gi=g2; u.forEach(function(id){assign[id]=gi;}); sizes[gi]+=u.length; });
    sc.assign=assign; Store.save('groups'); toast('已隨機分成 '+cnt+' 組（同房不拆）'); },
  editScenario:function(t){ sheetScenario(t.getAttribute('data-id')||'',t.getAttribute('data-cat')||''); },
  mtagToggle:function(t){ var sc=scnLive(scenario()); if(!sc) return; var id=t.getAttribute('data-id'), v=t.getAttribute('data-v');
    var a=mtagsOf(sc,id).slice(); var i=a.indexOf(v);
    if(i>=0) a.splice(i,1); else a.push(v);
    Store.savePath('groups',scnPath(sc)+'/mtags/'+id, a.length?a:null); sheetMoveMember2(id); },
  mtagAdd:function(t){ var sc=scnLive(scenario()); if(!sc) return; var id=t.getAttribute('data-id');
    var f=el('sheetRoot').querySelector('[name=newtag]'), v=f?f.value.trim():'';
    if(!v){ toast('請先輸入標籤文字'); return; }
    var opts=scnTagOpts(sc).slice(); if(opts.indexOf(v)<0){ opts.push(v); Store.savePath('groups',scnPath(sc)+'/tagOpts',opts); }
    var a=mtagsOf(sc,id).slice(); if(a.indexOf(v)<0) a.push(v);
    Store.savePath('groups',scnPath(sc)+'/mtags/'+id, a); sheetMoveMember2(id); },
  mtagClearOne:function(t){ var sc=scnLive(scenario()); if(!sc) return; var id=t.getAttribute('data-id');
    Store.savePath('groups',scnPath(sc)+'/mtags/'+id, null); sheetMoveMember2(id); },
  clearTags:function(){ var sc=scenario(); if(!sc) return;
    openSheet({title:'清空「'+esc(sc.name)+'」的所有標籤？',body:'<div class="muted">會把這個情境裡每個人身上的臨時標籤都拿掉，分組本身不會變。</div>',
      foot:'<button class="btn" data-act="sheetClose">取消</button><button class="btn dng" data-act="clearTagsGo">確定清空</button>'}); },
  clearTagsGo:function(){ var sc=scnLive(scenario()); if(!sc) return; sc.mtags={}; closeSheet(); Store.save('groups'); toast('標籤已清空'); },
  manageTagOpts:function(){ sheetTagOpts(); },
  editTagOpt:function(t){ sheetTagOptEdit(t.getAttribute('data-v')||''); },
  saveTagOpt:function(){ var sc=scnLive(scenario()); if(!sc) return; var v=(sv('label')||'').trim(); if(!v){ toast('請輸入標籤文字'); return; }
    var old=SHEET.old||'', opts=scnTagOpts(sc).slice();
    if(old){
      if(v!==old && opts.indexOf(v)>=0){ toast('已經有這個標籤了'); return; }
      var i=opts.indexOf(old); if(i>=0) opts[i]=v;
    } else if(opts.indexOf(v)<0){ opts.push(v); }
    Store.savePath('groups',scnPath(sc)+'/tagOpts',opts);
    if(old && old!==v){
      var mt=sc.mtags||{};
      Object.keys(mt).forEach(function(id){ var a=mt[id]||[]; if(a.indexOf(old)>=0) Store.savePath('groups',scnPath(sc)+'/mtags/'+id, a.map(function(x){return x===old?v:x;})); });
    }
    closeSheet(); sheetTagOpts(); toast('標籤已儲存'); },
  delTagOpt:function(){ var sc=scnLive(scenario()); if(!sc) return; var old=SHEET.old; if(!old) return;
    var opts=scnTagOpts(sc).filter(function(x){return x!==old;});
    Store.savePath('groups',scnPath(sc)+'/tagOpts',opts);
    var mt=sc.mtags||{};
    Object.keys(mt).forEach(function(id){ var a=mt[id]||[]; if(a.indexOf(old)>=0){ var na=a.filter(function(x){return x!==old;}); Store.savePath('groups',scnPath(sc)+'/mtags/'+id, na.length?na:null); } });
    closeSheet(); sheetTagOpts(); toast('已刪除標籤'); },
  clearGroups:function(){ var sc=scenario(); if(!sc) return;
    openSheet({title:'清除「'+esc(sc.name)+'」的分組？',body:'<div class="muted">會把這個情境裡所有人的分組拿掉，全部回到「尚未分組」。其他情境不受影響，可以再按一次「一鍵隨機分組」重排。</div>',
      foot:'<button class="btn" data-act="sheetClose">取消</button><button class="btn dng" data-act="clearGroupsGo">確定清除</button>'}); },
  clearGroupsGo:function(){ var sc=scnLive(scenario()); if(!sc) return; sc.assign={}; closeSheet(); Store.save('groups'); toast('已清除分組'); },
  /* 分組情境存檔（v3.25）：一律整份 groups 存檔。每一列記著原本是第幾組（o），用它把每個人的分組重新對應到新的順序；
     刪掉的那一組的人回到「尚未分組」。注意 closeSheet() 會把 SHEET 設成 null，要用的值都先讀出來 */
  saveScenario:function(){
    var id=SHEET.id, cat=SHEET.cat, d=catDef(cat), st=scnRead(), rows=st.rows;
    if(!st.name){ toast('請輸入情境名稱'); return; }
    if(!rows.length){ toast('至少要有一組'); return; }
    var sc=id?scnLive(scenario(id)):null, isNew=!sc;
    if(id&&!sc){ toast('這個情境已經被刪掉了'); closeSheet(); return; }
    var old=isNew?{}:(sc.assign||{}), map={}, assign={};
    rows.forEach(function(r,i){ if(r.o>=0) map[r.o]=i; });
    Object.keys(old).forEach(function(mid){ var gi=Number(old[mid]); if(map[gi]!==undefined) assign[mid]=map[gi]; });
    if(isNew){ sc={id:uid()}; scnReal().push(sc); }
    sc.name=st.name; sc.cat=cat; sc.count=rows.length; sc.assign=assign;
    sc.names=rows.map(function(r,i){ return r.name||catGN(cat,i); });
    ['times','backs','notes','shorts','leaders'].forEach(function(k){
      var arr=rows.map(function(r){ var v=(r[k]==null)?'':String(r[k]); return (k==='times'||k==='backs')?trTime(v):v; });
      if(arr.some(Boolean)) sc[k]=arr; else delete sc[k]; });
    ['time','place'].forEach(function(k){ var f=d.sf.filter(function(x){ return x.k===k; })[0], v=f?(f.t==='time'?trTime(st[k]):String(st[k]||'')):'';
      if(v) sc[k]=v; else delete sc[k]; });
    if(st.note) sc.note=st.note; else delete sc.note;
    sc.useTags=(st.tags==='1')?1:0;
    if(cat==='transport'&&st.card==='1') sc.card=1; else delete sc.card;
    P.scn=sc.id; P.cat=cat; closeSheet(); Store.save('groups'); toast(isNew?'已新增「'+sc.name+'」':'已儲存'); },
  /* 刪除一個情境。還沒搬家的舊航班情境（只存在畫面上）只要記下「已經搬過了」，不然會又冒出來 */
  delScenario:function(t){ var id=SHEET.id, sc=scenario(id); if(!sc) return;
    var n=members().filter(function(m){ return scnGi(sc,m.id)>=0; }).length, name=sc.name, wasInj=!!sc._inj;
    if(!sure(t,'再按一次確定刪除'+(n?'（'+n+' 人的分組會一起清掉）':''))) return;
    P.scn=''; P.cat=scnCat(sc); closeSheet();
    if(wasInj){ S().settings.airMig=1; Store.save('settings'); }
    else { S().groups.scenarios=scnReal().filter(function(x){ return x.id!==id; }); Store.save('groups'); }
    toast('已刪除「'+name+'」'); },
  /* 表單裡的操作：先把畫面上填的字讀回 SHEET.st，改完狀態再重畫，已經填的字不會不見 */
  scnCat:function(t){ var cat=t.getAttribute('data-cat'); if(!catDef(cat)||cat===SHEET.cat) return; var id=SHEET.id, st=scnRead(); sheetScenario(id,cat,st); },
  /* 名稱建議：帶入名稱；順便帶預設的情境欄位（沒填過才帶，例：晚餐 18:00）；新增時組數沒動過就依團員人數排（例：兩人一組、33 人 → 17 組） */
  scnPreset:function(t){ var cat=SHEET.cat, d=catDef(cat), name=t.getAttribute('data-val'), p=d.pre.filter(function(x){ return x.n===name; })[0]; if(!p) return;
    var st=scnRead(), fresh=!SHEET.id&&scnRowsFresh(st,cat); st.name=name; setField('name',name);
    Object.keys(p.sf||{}).forEach(function(k){ var f=d.sf.filter(function(x){ return x.k===k; })[0]; if(!f||st[k]) return; st[k]=p.sf[k]; if(f.t==='time') setTimeField('sf_'+k,p.sf[k]); else setField('sf_'+k,p.sf[k]); });
    var n=p.per?Math.ceil(members().length/p.per):0;
    if(fresh&&n>0){ n=Math.max(1,Math.min(SCN_MAX,n)); if(n!==st.rows.length){ st.rows=[]; for(var i=0;i<n;i++) st.rows.push({o:-1,cnt:0,name:catGN(cat,i)}); scnRowsPaint(); } } },
  scnRowAdd:function(){ var st=scnRead(); if(st.rows.length>=SCN_MAX){ toast('一個情境最多 '+SCN_MAX+' 組'); return; }
    st.rows.push({o:-1,cnt:0,name:scnNewName(SHEET.cat,st.rows)}); scnRowsPaint(st.rows.length-1); },
  scnRowDel:function(t){ var st=scnRead(), i=Number(t.getAttribute('data-i')); if(st.rows.length<=1){ toast('至少要有一組'); return; } if(!(i>=0&&i<st.rows.length)) return;
    st.rows.splice(i,1); scnRowsPaint(); },
  scnRowMove:function(t){ var st=scnRead(), i=Number(t.getAttribute('data-i')), j=i+Number(t.getAttribute('data-dir')); if(!(i>=0&&i<st.rows.length&&j>=0&&j<st.rows.length)) return;
    var tmp=st.rows[i]; st.rows[i]=st.rows[j]; st.rows[j]=tmp; scnRowsPaint(); },
  moveMember:function(t){ sheetMoveMember2(t.getAttribute('data-id')); },
  setGroup:function(t){ var sc=scnLive(scenario()); if(!sc) return; var gi=Number(t.getAttribute('data-g')); var id=t.getAttribute('data-id'); closeSheet(); Store.savePath('groups',scnPath(sc)+'/assign/'+id, gi<0?null:gi); },
  settings:function(){ sheetSettings(); },
  saveSettings:function(){ var st=S().settings; st.tripName=sv('tripName')||st.tripName; st.startDate=sv('startDate'); st.days=Math.max(1,Number(sv('days'))||5); st.dayOverride=Number(sv('dayOverride'))||0; if(sv('pin')){ st.pinHash=pinHash(sv('pin')); delete st.pin; }
    var tz=sv('tz'); if(tz&&tzValid(tz)) st.tz=tz; else delete st.tz;
    /* 各項交通的時間已經搬到「分組 → 交通」；這裡只存去程集合說明與回程出發地。
       舊格式的 eva／ci 起飛時間（還沒搬家之前還在 flights 裡，舊資料轉成航班情境時要讀）原樣留著 */
    var of=st.flights||{}, nf={note:sv('flight_note'),backPort:sv('backPort')};
    Object.keys(of).forEach(function(k){ if(k!=='note'&&k!=='backPort'&&of[k]&&typeof of[k]==='object') nf[k]=of[k]; });
    st.flights=nf;
    var cs=[]; for(var i=0;i<(SHEET.nContacts||0);i++){ var ph=sv('c_phone_'+i), ln=sv('c_line_'+i); if(ph||ln) cs.push({name:sv('c_name_'+i)||'聯絡人',label:sv('c_label_'+i),phone:ph,line:ln}); } st.contacts=cs; delete st.leaderName; delete st.leaderPhone; delete st.guideName; delete st.guidePhone;
    P.planDay=0; closeSheet(); Store.save('settings'); toast('設定已儲存'); },
  themeToggle:function(){ P.theme = (!P.theme) ? 'light' : (P.theme==='light' ? 'dark' : ''); savePrefs(); render();
    toast(!P.theme?'主題：跟隨系統設定':(P.theme==='dark'?'主題：固定深色':'主題：固定淺色')); },
  cardFold:function(b){ cardToggle(b.getAttribute('data-id')); },
  cardDef:function(b){ if(!P.leader) return; cardSetLead(b.getAttribute('data-id')); },
  cardHl:function(b){ if(!P.leader) return; cardSetHL(b.getAttribute('data-id')); },
  /* 設定面板裡的兩顆小開關：改完要把面板重畫，不然開關不會跟著動 */
  zCardDef:function(b){ if(!P.leader) return; cardSetLead(b.getAttribute('data-id')); render(); sheetCardZones(); },
  zCardHl:function(b){ if(!P.leader) return; cardSetHL(b.getAttribute('data-id')); render(); sheetCardZones(); },
  zoneMove:function(b){ if(!P.leader) return; zoneMove(b.getAttribute('data-id'),Number(b.getAttribute('data-d'))); },
  cardZones:function(){ if(!P.leader) return; sheetCardZones(); },
  /* 下拉選單（select）觸發：值取自 select.value，不是 data-v */
  zoneSet:function(t){ if(!P.leader) return;
    var k=t.getAttribute('data-k'), v=t.value, st=S().settings;
    if(!st.zones) st.zones={};
    if(k.indexOf('z.')===0) setPin(k.slice(2),v);   /* 單張卡：自動 or 釘在某一區 */
    else st.zones[k]=v;                             /* 自動模式的觸發條件 */
    Store.save('settings'); render(); sheetCardZones(); nowCrowdCheck(); },
  zoneReset:function(){ if(!P.leader) return; S().settings.zones={}; Store.save('settings'); render(); sheetCardZones(); toast('全部改回自動，順序也復原了'); },
  nbTab:function(t){ P.nbPage=t.getAttribute('data-id'); render(); },
  nbGo:function(t){ P.tab='notes'; P.nbPage=t.getAttribute('data-id')||''; closeSheet(); render(); window.scrollTo(0,0); },
  nbCheck:function(t){ var pg=t.getAttribute('data-pg'), id=t.getAttribute('data-id'); P.checks=P.checks||{}; P.checks[pg]=P.checks[pg]||{}; if(P.checks[pg][id]) delete P.checks[pg][id]; else P.checks[pg][id]=true; savePrefs(); render(); },
  nbUncheckAll:function(t){ P.checks=P.checks||{}; P.checks[t.getAttribute('data-id')]={}; savePrefs(); render(); toast('已重設勾選'); },
  nbEditPage:function(t){ sheetNbPage(t.getAttribute('data-id')||''); },
  nbSavePage:function(){ var nb=S().notebook=S().notebook||{pages:[]}; nb.pages=nb.pages||[]; var pg=SHEET.id?nbPage(SHEET.id):null; if(!pg){ pg={id:uid(),items:[]}; nb.pages.push(pg); } var title=sv('title'); if(!title){ toast('請輸入頁籤名稱'); return; } pg.title=title; pg.icon=sv('icon'); pg.type=sv('type')==='check'?'check':'notes'; P.nbPage=pg.id; closeSheet(); Store.save('notebook'); },
  nbDelPage:function(){ var nb=S().notebook; nb.pages=(nb.pages||[]).filter(function(p){return p.id!==SHEET.id;}); P.nbPage=''; closeSheet(); Store.save('notebook'); toast('已刪除頁籤'); },
  nbMovePage:function(t){ var nb=S().notebook, ps=nb.pages||[], id=t.getAttribute('data-id'), dir=Number(t.getAttribute('data-dir')); var i=ps.findIndex(function(p){return p.id===id;}); var j=i+dir; if(i<0||j<0||j>=ps.length) return; var tmp=ps[i]; ps[i]=ps[j]; ps[j]=tmp; closeSheet(); Store.save('notebook'); },
  nbEditItem:function(t){ sheetNbItem(t.getAttribute('data-pg'),t.getAttribute('data-id')||'',t.getAttribute('data-head')==='1'); },
  nbSaveItem:function(){ var pg=nbPage(SHEET.pg); if(!pg) return; pg.items=pg.items||[]; var text=sv('text'); if(!text){ toast('請輸入內容'); return; } var it=SHEET.id?pg.items.filter(function(x){return x.id===SHEET.id;})[0]:null; if(!it){ it={id:uid(),kind:SHEET.head?'head':'item'}; pg.items.push(it); } it.text=text; closeSheet(); Store.save('notebook'); },
  nbDelItem:function(t){ var pg=nbPage(t.getAttribute('data-pg')); if(!pg) return; var id=t.getAttribute('data-id'); pg.items=(pg.items||[]).filter(function(x){return x.id!==id;}); closeSheet(); Store.save('notebook'); toast('已刪除'); },
  nbMove:function(t){ var pg=nbPage(t.getAttribute('data-pg')); if(!pg) return; var its=pg.items||[], id=t.getAttribute('data-id'), dir=Number(t.getAttribute('data-dir')); var i=its.findIndex(function(x){return x.id===id;}); var j=i+dir; if(i<0||j<0||j>=its.length){ toast(dir<0?'已經在最上面':'已經在最下面'); return; } var tmp=its[i]; its[i]=its[j]; its[j]=tmp; Store.save('notebook'); toast(dir<0?'已上移':'已下移'); },
  /* 一鍵清空：取代舊的「重置為初始資料」（那顆會把資料換回程式內建的沙壩行程，而且沒有密碼、沒有備份） */
  clearAsk:function(){ if(!P.leader) return;
    if(SIM_OFF){ toast('時間模擬中不能清空，請先結束模擬'); return; }
    if(stateBlank(S())){ toast('目前已經是空白的，不需要清空'); return; }
    sheetClear(); },
  clearGo:function(t){ if(!P.leader||!SHEET) return;
    bulkAsk(t,'清空',blankDocs,'clear',function(bk){
      P.meId=''; P.planDay=0; P.scn=''; P.cat=''; P.nbPage=''; P.q=''; P.tab='home'; savePrefs();
      closeSheet(); render(); window.scrollTo(0,0);
      toast(bk?'已清空。清空前的內容已自動備份（管理專區 → 備份與還原）':'已清空'); }); },
  bkList:function(){ if(!P.leader) return; sheetBackups(); },
  bkAsk:function(t){ if(!P.leader) return; sheetRestore(t.getAttribute('data-id')); },
  bkGo:function(t){ if(!P.leader||!SHEET) return; var e=bkFind(SHEET.bk);
    if(!e){ toast('找不到這份備份，請重新打開清單'); return; }
    bulkAsk(t,'還原',function(T){ return restoreDocs(e,T); },'restore',function(){
      P.planDay=0; P.scn=''; P.cat=''; P.nbPage=''; P.tab='home'; savePrefs();
      closeSheet(); render(); window.scrollTo(0,0);
      toast('已還原 '+whenText(e.at)+' 的備份，全團手機會同步'); }); },
  bkFile:function(t){ var e=bkFind(t.getAttribute('data-id')); if(!e) return;
    var d=new Date(e.at||Date.now()), name='trip-backup-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+'.json';
    /* 格式跟「匯出備份檔」一樣，可以直接用團務設定的「匯入備份檔」讀回來 */
    toast(dlText(name,JSON.stringify({app:'sapa-tour-tool',version:e.ver||APP_VERSION,exportedAt:new Date(e.at||Date.now()).toISOString(),reason:e.reason||'',docs:e.docs},null,2))?'已下載備份檔':'這個環境不支援下載'); },
  exportData:function(){ toast(dlText('trip-backup-'+tzParts(TW).date+'.json',Store.exportJSON())?'已匯出備份檔':'這個環境不支援下載'); },
  noteTap:function(t){ P.money.push(Number(t.getAttribute('data-v'))); render(); },
  moneyUndo:function(){ P.money.pop(); render(); },
  moneyClear:function(){ P.money=[]; render(); },
  rcToggle:function(t){ var rc=S().rollcall=S().rollcall||{present:{}}; rc.present=rc.present||{}; var id=t.getAttribute('data-id'); var on=!rc.present[id];
    if(!rc.startedAt) Store.savePath('rollcall','startedAt',stamp());
    var l=el('rcLabel'); if(l&&l.value.trim()!==(rc.label||'')) Store.savePath('rollcall','label',l.value.trim());
    Store.savePath('rollcall','present/'+id, on?true:null); },
  rcAll:function(){ var rc=S().rollcall=S().rollcall||{}; rc.present={}; members().forEach(function(m){rc.present[m.id]=true;}); rc.startedAt=rc.startedAt||stamp(); Store.save('rollcall'); try{ if(navigator.vibrate) navigator.vibrate([60,40,60]); }catch(e){} toast('全員到齊 '+members().length+' / '+members().length); },
  rcReset:function(){ var rc=S().rollcall=S().rollcall||{}; rc.present={}; rc.startedAt=stamp(); var l=el('rcLabel'); rc.label=l?l.value.trim():''; Store.save('rollcall'); toast('重新開始點名'); }
};
document.addEventListener('click',function(ev){
  var t=ev.target.closest('[data-act]'); if(!t) return;
  /* <select data-act> 要等 change 才動作；點一下就處理會在原生選單還開著時重畫，選項會被關掉 */
  if(t.tagName==='SELECT') return;
  var a=t.getAttribute('data-act'); if(!ACT[a]) return;
  if(t.tagName==='A'&&t.getAttribute('href')==='#') ev.preventDefault();
  if(t.hasAttribute('disabled')) return;
  ACT[a](t,ev);
});
document.addEventListener('input',function(ev){
  var t=ev.target;
  if(t.id==='memberSearch'){ P.q=t.value; var l=el('memberList'); if(l) l.innerHTML=memberListHTML(); }
  else if(t.id==='meSearch'){ var ml=el('meList'); if(ml) ml.innerHTML=meListHTML(t.value.trim()); }
  else if(t.id==='twdIn'){ var v=Number(t.value)||0; el('twdOut').textContent=v?fmtFx(twdToFx(v)):'—'; }
  else if(t.id==='mdBody'){ clearTimeout(window._mdT); window._mdT=setTimeout(mdPreview,150); }
  else if(t.id==='tnInput'){ var c=el('tnCount'); if(c) c.textContent=[].slice.call(t.value).length+' / 20 字'; }
  else if(t.id==='dbgZ'){ if(DBG){ DBG.z=(Number(t.value)||100)/100; dbgLayout(); } var zv=el('dbgZV'); if(zv) zv.textContent=t.value+'%'; }
  else if(t.id==='dbgX'||t.id==='dbgY'){ if(DBG){ if(t.id==='dbgX') DBG.px=Number(t.value)||0; else DBG.py=Number(t.value)||0; DBG.bySlider=true; dbgLayout(); } }
  else if(t.id==='dbgOp'){ var ov=el('dbgOpV'); if(ov) ov.textContent=t.value+'%';
    var pv=el('dbgPrev'); if(pv) pv.style.setProperty('--dop',(Number(t.value)||9)/100); }
  else if(t.id==='rcLabel'){ clearTimeout(window._rcT); window._rcT=setTimeout(function(){ var rc=S().rollcall; if(rc&&rc.label!==t.value.trim()) Store.savePath('rollcall','label',t.value.trim()); },700); }
});
document.addEventListener('change',function(ev){ var t=ev.target;
  /* 下拉選單型的動作（例如首頁卡片位置）走 change，不走 click */
  if(t&&t.tagName==='SELECT'&&t.getAttribute('data-act')&&ACT[t.getAttribute('data-act')]){ ACT[t.getAttribute('data-act')](t,ev); return; }
  if(t&&t.id==='dbgFile'&&t.files&&t.files[0]){ dbgOpenFile(t.files[0]); t.value=''; return; }
  if(t&&(t.id==='dbgZ'||t.id==='dbgX'||t.id==='dbgY')){ if(DBG) dbgPreview(); return; }
  if(t&&t.id==='dbgOp'){ if(DBG){ dbgPreview(); return; }   /* 裁切中只更新預覽，還沒存 */
    /* 放開才存，免得拖一次寫十幾筆 */
    var dF=el('dbgF'); if(dF){ var pid=dF.getAttribute('data-id'), b=itemBg(pid);
      if(b){ b.op=Number(t.value)||9; Store.savePath('photos','items/'+pid+'/op',b.op); render(); } }
    return; }
  if(t&&t.id==='importFile'&&t.files&&t.files[0]){ var fr=new FileReader(); fr.onload=function(){ try{ var n=Store.importJSON(fr.result); closeSheet(); toast('已匯入 '+n+' 份資料並同步'); }catch(e){ toast('匯入失敗：'+e.message); } }; fr.readAsText(t.files[0]); return; } if(t&&t.getAttribute&&t.getAttribute('data-tf')){ var n=t.getAttribute('data-tf'); var root=el('sheetRoot'); var hs=root.querySelector('select[data-tf="'+n+'"][data-part="h"]'), ms=root.querySelector('select[data-tf="'+n+'"][data-part="m"]'), h=root.querySelector('input[name="'+n+'"]'); if(hs&&ms&&h){ if(hs.value&&!ms.value) ms.value='00'; h.value=(hs.value&&ms.value)?hs.value+':'+ms.value:''; } } });
document.addEventListener('keydown',function(ev){ if(ev.key==='Escape'){ if(SHEET) closeSheet(); else if(!FULL_LOCK) closeFull(); } });
window.addEventListener('online',function(){ renderSync(); Store.reconnect(); Store.flush(); }); window.addEventListener('offline',renderSync);

/* 底圖裁切框：拖曳移動位置。用 pointer 事件，手機與桌機同一套。 */
(function(){
  var on=false,lx=0,ly=0;
  document.addEventListener('pointerdown',function(e){
    if(!DBG) return; var f=e.target.closest&&e.target.closest('#dbgFrame'); if(!f) return;
    on=true; lx=e.clientX; ly=e.clientY; try{ f.setPointerCapture(e.pointerId); }catch(x){}
  });
  document.addEventListener('pointermove',function(e){
    if(!on||!DBG) return; e.preventDefault();
    DBG.tx+=e.clientX-lx; DBG.ty+=e.clientY-ly; lx=e.clientX; ly=e.clientY; dbgLayout();
  });
  ['pointerup','pointercancel'].forEach(function(ev){ document.addEventListener(ev,function(){ if(on&&DBG) dbgPreview(); on=false; }); });
})();

/* ===== 啟動 ===== */
Store.init();
render();
Store.connect();

/* 全螢幕卡解鎖：按住 2 秒 */
(function(){ var tm=null;
  function down(e){ var b=e.target.closest&&e.target.closest('#unlockBtn'); if(!b) return; b.classList.add('hold'); tm=setTimeout(function(){ FULL_LOCK=false; openFull(taxiFull()); toast('已解鎖'); },2000); }
  function up(){ if(tm){ clearTimeout(tm); tm=null; } var b=el('unlockBtn'); if(b) b.classList.remove('hold'); }
  document.addEventListener('pointerdown',down); document.addEventListener('pointerup',up); document.addEventListener('pointercancel',up); document.addEventListener('pointerleave',up,true);
})();
/* ===== 鎖定畫面縮放 =====
   長輩連按兩下或兩指誤觸常把畫面放大後不會還原。字級請用右上角「AA」三段調整。
   viewport meta 擋住 Android；iOS Safari 會忽略 meta，所以另外攔 gesture 事件與雙擊。 */
(function(){
  ['gesturestart','gesturechange','gestureend'].forEach(function(ev){
    document.addEventListener(ev,function(e){ e.preventDefault(); },{passive:false});
  });
  /* 雙擊放大：只有「同一個位置、350ms 內的第二下」才擋，
     避免長輩快速連點兩個相鄰按鈕時第二下被吃掉 */
  var lastT=0,lastX=0,lastY=0;
  document.addEventListener('touchend',function(e){
    var t=(e.changedTouches&&e.changedTouches[0])||null; if(!t) return;
    var now=Date.now();
    if(now-lastT<=350 && Math.abs(t.clientX-lastX)<30 && Math.abs(t.clientY-lastY)<30) e.preventDefault();
    lastT=now; lastX=t.clientX; lastY=t.clientY;
  },{passive:false});
  document.addEventListener('touchmove',function(e){
    if(e.touches&&e.touches.length>1) e.preventDefault();   /* 兩指縮放 */
  },{passive:false});
})();

/* ===== 底部表單（Sheet）與全螢幕卡 ===== */
var SHEET=null;
/* Android 返回鍵 / 瀏覽器上一頁：關掉 sheet 或全螢幕卡，而不是離開網站 */
var HIST={sheet:false,full:false};
function histPush(kind){ if(HIST[kind]) return; try{ history.pushState({sapa:kind},''); HIST[kind]=true; }catch(e){} }
function histPop(kind){ if(!HIST[kind]) return; HIST[kind]=false; try{ if(history.state&&history.state.sapa===kind) history.back(); }catch(e){} }
window.addEventListener('popstate',function(){ if(HIST.full){ HIST.full=false; closeFull(); return; } if(HIST.sheet){ HIST.sheet=false; closeSheet(); } });
function openSheet(o){
  SHEET=o;
  el('sheetRoot').innerHTML='<div class="sheet-bg" data-act="sheetBg"><div class="sheet'+(o.tall?' tall':'')+'" role="dialog" aria-modal="true" aria-labelledby="sheetTitle"><div class="sheet-h"><span id="sheetTitle">'+o.title+'</span><button class="icon-btn" data-act="sheetClose" aria-label="關閉">'+ic('x')+'</button></div><div class="sheet-b">'+o.body+'</div>'+(o.foot?'<div class="sheet-f">'+o.foot+'</div>':'')+'</div></div>';
  var f=el('sheetRoot').querySelector('input:not([type=hidden]),textarea,select'); if(f&&o.focus) setTimeout(function(){ try{f.focus();}catch(e){} },50);
  histPush('sheet');
}
function closeSheet(){ el('sheetRoot').innerHTML=''; SHEET=null; histPop('sheet'); }
/* Tab 鍵只在 sheet／全螢幕卡內循環 */
document.addEventListener('keydown',function(ev){ if(ev.key!=='Tab') return; var root=el('fullRoot').firstChild||el('sheetRoot').firstChild; if(!root) return;
  var f=root.querySelectorAll('button:not([disabled]),a[href],input:not([type=hidden]):not([disabled]),select,textarea'); if(!f.length) return;
  var first=f[0], last=f[f.length-1];
  if(ev.shiftKey&&document.activeElement===first){ ev.preventDefault(); last.focus(); } else if(!ev.shiftKey&&document.activeElement===last){ ev.preventDefault(); first.focus(); } });
function sv(n){ var e=el('sheetRoot').querySelector('[name="'+n+'"]'); return e?e.value.trim():''; }
function fld(label,html){ return '<div class="f"><label>'+label+'</label>'+html+'</div>'; }
function timeField(n,v){ var p=String(v||'').split(':'); var hh=p[0]||'', mm=p[1]||''; var hs='<select class="in" data-tf="'+n+'" data-part="h" aria-label="時"><option value="">時</option>'; for(var i=0;i<24;i++){ var x=pad(i); hs+='<option value="'+x+'"'+(x===hh?' selected':'')+'>'+x+'</option>'; } hs+='</select>'; var mins=[]; for(var j=0;j<60;j+=5) mins.push(pad(j)); if(mm&&mins.indexOf(mm)<0) mins.push(mm); mins.sort(); var ms='<select class="in" data-tf="'+n+'" data-part="m" aria-label="分"><option value="">分</option>'+mins.map(function(x){return '<option value="'+x+'"'+(x===mm?' selected':'')+'>'+x+'</option>';}).join('')+'</select>'; return '<div class="tf">'+hs+'<b>:</b>'+ms+'<input type="hidden" name="'+n+'" value="'+esc(v||'')+'"></div>'; }
function setTimeField(n,v){ var root=el('sheetRoot'); var h=root.querySelector('input[name="'+n+'"]'); if(!h) return; h.value=v||''; var p=(v||'').split(':'); root.querySelectorAll('select[data-tf="'+n+'"]').forEach(function(sel){ var want=sel.getAttribute('data-part')==='h'?(p[0]||''):(p[1]||''); if(want&&!Array.prototype.some.call(sel.options,function(o){return o.value===want;})){ var o=document.createElement('option'); o.value=want; o.textContent=want; sel.appendChild(o); } sel.value=want; }); }
function inp(n,v,type,attrs){ return '<input class="in" name="'+n+'" type="'+(type||'text')+'" value="'+esc(v||'')+'" '+(attrs||'')+'>'; }
function ta(n,v){ return '<textarea class="in" name="'+n+'">'+esc(v||'')+'</textarea>'; }
function chipsFill(target,vals){ return '<div class="chips" style="margin-top:.4rem">'+vals.map(function(v){ return '<button type="button" class="chip pick" data-act="chipSet" data-target="'+target+'" data-val="'+esc(v)+'">'+esc(v)+'</button>'; }).join('')+'</div>'; }
function swatches(group,list,cur,render){ return '<div class="sw" data-group="'+group+'">'+list.map(function(x){ var v=x[0],lab=x[1]; return '<button type="button" class="'+(v===cur?'on':'')+'" data-act="pick" data-val="'+esc(v)+'" title="'+esc(lab)+'">'+(render?render(v,lab):esc(lab))+'</button>'; }).join('')+'</div><input type="hidden" name="'+group+'" value="'+esc(cur)+'">'; }
function footBtns(saveAct,extra){ return (extra||'')+'<button class="btn" data-act="sheetClose">取消</button><button class="btn pri" data-act="'+saveAct+'">儲存</button>'; }
function openFull(html){ el('fullRoot').innerHTML='<div class="full" role="dialog" aria-modal="true">'+html+'</div>'; histPush('full'); }
function closeFull(){ el('fullRoot').innerHTML=''; histPop('full'); FULL_LOCK=false; }

/* ===== 各種表單 ===== */
function sheetPin(){
  openSheet({title:'領隊模式',body:'<div class="muted" style="text-align:center">請輸入 4 位數 PIN 碼</div><div class="pin-disp" id="pinDisp">＿ ＿ ＿ ＿</div><div class="pin">'+
    ['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(function(k){ return '<button data-act="pinKey" data-k="'+k+'">'+k+'</button>'; }).join('')+'</div>',focus:false});
  SHEET.pin='';
}
function sheetLeaderMenu(){
  openSheet({title:'領隊管理',body:'<div class="stack">'+
    '<button class="btn big" data-act="tool" data-tool="rollcall">'+ic('clipboard')+'<span class="b2">集合點名</span></button>'+
    '<button class="btn big" data-act="editBroadcast">'+ic('megaphone')+'<span class="b2">修改即時廣播</span></button>'+
    '<button class="btn big" data-act="editMorning">'+ic('sun')+'<span class="b2">明早時程</span></button>'+
    '<button class="btn big" data-act="settings">'+ic('gear')+'<span class="b2">團務設定</span></button>'+
    '<button class="btn big" data-act="pickHotel">'+ic('bed')+'<span class="b2">飯店資料 / 切換入住</span></button>'+
    '<button class="btn big" data-act="leaderLock">'+ic('lock')+'<span class="b2">鎖定領隊模式</span></button></div>'});
}
function sheetBroadcast(){
  var b=S().broadcast||{}, cur=items().filter(function(x){return x.isCurrent;})[0];
  /* 集合日期：有日期才算得出跨日倒數（例如出發前先公布出發當天 05:30 的機場集合） */
  var st=S().settings, today=tzParts(VN).date, tmr=ymd(parseDate(today)+86400000);
  var picks=[[today,'今天'],[tmr,'明天']];
  if(st.startDate&&!isNaN(parseDate(st.startDate))&&st.startDate!==today&&st.startDate!==tmr) picks.push([st.startDate,'出發日 '+dayDate(1).split('（')[0]]);
  openSheet({title:'修改即時廣播',focus:true,body:
    fld('集合日期',inp('date',b.date||bcDate(),'date')+'<div class="chips" style="margin-top:.4rem">'+picks.map(function(x){ return '<button type="button" class="chip pick" data-act="chipSet" data-target="date" data-val="'+esc(x[0])+'">'+esc(x[1])+'</button>'; }).join('')+'</div>')+
    fld('集合時間（當地，24 小時制）',timeField('time',b.time)+'<div class="chips" style="margin-top:.4rem">'+[15,30,45,60].map(function(m){return '<button type="button" class="chip pick" data-act="chipTimeFromNow" data-min="'+m+'">現在＋'+m+'分</button>';}).join('')+'</div>')+
    fld('動作',inp('label',b.label||'原地集合')+chipsFill('label',['原地集合','大廳集合','上車','餐廳集合','纜車站集合']))+
    fld('集合地點（建議 12 字以內，手機才不換行）',inp('location',b.location)+(cur?'<div class="chips" style="margin-top:.4rem"><button type="button" class="chip pick" data-act="chipSet" data-target="location" data-val="'+esc(cur.title)+'">帶入目前站：'+esc(cur.title)+'</button></div>':''))+
    fld('天氣與叮嚀',ta('tip',b.tip)+chipsFill('tip',['山頂約 10 度，請備妥外套與保溫水壺','下午有雨，請帶雨具、走慢一點','請把護照放身上，等一下要辦入住','上車前請先上洗手間'])),
    foot:footBtns('saveBroadcast')});
}
function sheetMorning(){
  var m=S().settings.morning||{};
  openSheet({title:'明早時程',focus:true,body:
    '<div class="grid2">'+fld('晨喚',timeField('wake',m.wake))+fld('早餐',timeField('breakfast',m.breakfast))+fld('行李出房',timeField('luggage',m.luggage))+fld('出發',timeField('depart',m.depart))+'</div>'+
    fld('叮嚀',ta('note',m.note)+chipsFill('note',['行李放房門口，貴重物品自己帶','退房請檢查保險箱、充電線','明天走很多路，請穿好走的鞋'])),
    foot:footBtns('saveMorning')});
}
/* ===== 行程底圖（放在行程編輯表單裡，每個行程項目一張）=====
   底圖存在獨立的 photos 文件、套用後直接寫回，不跟著表單的「儲存」按鈕走——
   避免領隊改完圖又按取消，結果圖也一起不見；也避免每改一個字就要重傳圖片。 */
var DBG=null;   /* 正在裁切中的狀態：{id,img,s0,z,tx,ty,px,py} */
function dbgField(id){
  if(!id) return '<div class="f"><label>行程底圖</label><div class="muted dbg-tip">先按下面的「儲存」把這個行程建立起來，再回來編輯就能加底圖。</div></div>';
  var b=itemBg(id), op=bgOp(b), has=!!b, tot=photoTotal();
  var url=has?"url('"+b.src+"')":'none';
  return '<div class="f" id="dbgF" data-id="'+esc(id)+'">'+
    '<label>這個行程的底圖<span class="dbg-sub">一個行程一張，極淡地墊在卡片後面</span></label>'+
    '<div class="dbg-frame" id="dbgFrame"'+(has?' style="background-image:'+url+'"':'')+'>'+
      '<img id="dbgImg" alt="" hidden>'+
      '<span class="dbg-hint" id="dbgHint"'+(has?' hidden':'')+'>還沒有底圖</span>'+
    '</div>'+
    '<div id="dbgCrop" hidden>'+
      '<div class="dbg-row"><span>縮放</span><input type="range" id="dbgZ" min="100" max="300" value="100"><output id="dbgZV">100%</output></div>'+
      '<div class="dbg-row"><span>左右</span><input type="range" id="dbgX" min="-100" max="100" value="0" disabled><output id="dbgXV">置中</output></div>'+
      '<div class="dbg-row"><span>上下</span><input type="range" id="dbgY" min="-100" max="100" value="0" disabled><output id="dbgYV">置中</output></div>'+
      '<div class="muted dbg-tip">也可以直接在上面那格拖曳。放大到蓋滿整格之後，左右／上下才有得移動。按「套用」時只會存下框裡看到的那一塊。</div>'+
    '</div>'+
    '<div class="dbg-row"><span>濃度</span><input type="range" id="dbgOp" min="3" max="30" value="'+op+'"'+(has?'':' disabled')+'><output id="dbgOpV">'+op+'%</output></div>'+
    '<div class="dbg-prev" id="dbgPrev" style="--dbg:'+url+';--dop:'+(has?op/100:0)+'">'+
      '<div class="pv-t">08:00</div><div><b>番西邦峰纜車</b><span>山頂約 10 度，請備妥外套與保溫水壺</span></div>'+
    '</div>'+
    '<div class="row dbg-btns">'+
      '<label class="btn sm" style="cursor:pointer">'+ic('camera')+'選照片<input type="file" id="dbgFile" accept="image/*" hidden></label>'+
      '<button type="button" class="btn sm pri" id="dbgApply" data-act="dbgApply" hidden>'+ic('check')+'套用這一塊</button>'+
      '<button type="button" class="btn sm dng" data-act="dbgRemove"'+(has?'':' hidden')+' id="dbgDel">'+ic('trash')+'移除底圖</button>'+
    '</div>'+
    '<div class="muted dbg-size" id="dbgSize">'+(has&&b.kb?('這張約 '+b.kb+' KB'):'')+'</div>'+
    '<div class="muted dbg-size" id="dbgTot">'+dbgTotText(tot)+'</div>'+
  '</div>';
}
/* 全團容量提醒：整包資料每次開 App 都要下載一次，所以底圖總量要看得見。 */
var DBG_BUDGET=600;   /* KB，超過就變成警告字樣 */
function dbgTotText(t){
  if(!t.n) return '目前全團還沒有任何底圖。';
  return '全團共 '+t.n+' 張底圖，合計約 '+t.kb+' KB'+(t.kb>DBG_BUDGET?'（偏多了，建議控制在 '+DBG_BUDGET+' KB 以內）':'')+'。';
}
function dbgRefresh(){
  var f=el('dbgF'); if(!f) return;
  var id=f.getAttribute('data-id'), b=itemBg(id), has=!!b, op=bgOp(b);
  var url=has?"url('"+b.src+"')":'none';
  var fr=el('dbgFrame'); if(fr) fr.style.backgroundImage=url;
  var im=el('dbgImg'); if(im){ im.hidden=true; im.removeAttribute('src'); }
  if(el('dbgHint')) el('dbgHint').hidden=has;
  if(el('dbgCrop')) el('dbgCrop').hidden=true;
  if(el('dbgApply')) el('dbgApply').hidden=true;
  if(el('dbgDel')) el('dbgDel').hidden=!has;
  var o=el('dbgOp'); if(o){ o.disabled=!has; o.value=op; }
  if(el('dbgOpV')) el('dbgOpV').textContent=op+'%';
  var pv=el('dbgPrev');
  if(pv){ pv.style.setProperty('--dbg',url); pv.style.setProperty('--dop',has?op/100:0); }
  if(el('dbgSize')) el('dbgSize').textContent=(has&&b.kb)?('這張約 '+b.kb+' KB'):'';
  if(el('dbgTot')) el('dbgTot').textContent=dbgTotText(photoTotal());
}
/* 把框裡看到的那一塊畫成 420×236，轉成 WebP。
   舊版 Safari 的 canvas 不支援 WebP 編碼會「默默吐出 PNG」，所以要檢查回傳的型別，
   不對就退回 JPEG；超過容量上限就自動降品質再壓一次。 */
function dbgEncode(canvas,cb){
  var CAP=9000, TYPES=['image/webp','image/jpeg'];
  function go(ti,q){
    if(ti>=TYPES.length) return cb(null);
    canvas.toBlob(function(b){
      if(!b) return go(ti+1,0.55);
      if(b.type!==TYPES[ti]) return go(ti+1,0.55);     /* 這個瀏覽器不會編這種格式 */
      if(b.size>CAP&&q>0.32) return go(ti,q-0.1);
      var fr=new FileReader();
      fr.onload=function(){ cb(fr.result,b.size,b.type); };
      fr.readAsDataURL(b);
    },TYPES[ti],q);
  }
  go(0,0.6);
}
/* 左右／上下滑桿跟拖曳共用同一份 tx/ty：
   滑桿是「可移動範圍的百分比」，拖曳完再換算回百分比寫回滑桿，兩邊永遠同步。 */
function dbgPos(v){ return v===0?'置中':((v>0?'+':'')+v+'%'); }
function dbgLayout(){
  if(!DBG) return;
  var f=el('dbgFrame'), im=el('dbgImg');
  var fw=f.clientWidth, fh=f.clientHeight;
  DBG.s0=Math.max(fw/DBG.img.naturalWidth, fh/DBG.img.naturalHeight);
  var sc=DBG.s0*DBG.z, dw=DBG.img.naturalWidth*sc, dh=DBG.img.naturalHeight*sc;
  /* 不讓框看到圖片以外的空白 */
  var mx=Math.max(0,(dw-fw)/2), my=Math.max(0,(dh-fh)/2);
  if(DBG.bySlider){ DBG.tx=mx*DBG.px/100; DBG.ty=my*DBG.py/100; DBG.bySlider=false; }
  DBG.tx=Math.max(-mx,Math.min(mx,DBG.tx));
  DBG.ty=Math.max(-my,Math.min(my,DBG.ty));
  DBG.px=mx?Math.round(DBG.tx/mx*100):0;
  DBG.py=my?Math.round(DBG.ty/my*100):0;
  var xs=el('dbgX'), ys=el('dbgY');
  if(xs){ xs.value=DBG.px; xs.disabled=mx<1; }
  if(ys){ ys.value=DBG.py; ys.disabled=my<1; }
  if(el('dbgXV')) el('dbgXV').textContent=(mx<1?'—':dbgPos(DBG.px));
  if(el('dbgYV')) el('dbgYV').textContent=(my<1?'—':dbgPos(DBG.py));
  im.style.width=dw+'px'; im.style.height=dh+'px';
  im.style.transform='translate('+(-dw/2+DBG.tx)+'px,'+(-dh/2+DBG.ty)+'px)';
}
function dbgOpenFile(file){
  var fr=new FileReader();
  fr.onload=function(){
    var im=el('dbgImg'), cur=itemBg(el('dbgF').getAttribute('data-id'));
    im.onload=function(){
      DBG={id:el('dbgF').getAttribute('data-id'),img:im,s0:1,z:1,tx:0,ty:0,px:0,py:0};
      im.hidden=false; el('dbgHint').hidden=true;
      el('dbgFrame').style.backgroundImage='none';
      el('dbgCrop').hidden=false; el('dbgApply').hidden=false;
      el('dbgZ').value=100; el('dbgZV').textContent='100%';
      /* 第一次上傳時濃度滑桿原本是 disabled（因為那時還沒有圖），這裡一定要打開，
         不然濃度會卡在預設值調不動。 */
      var o=el('dbgOp'); if(o){ o.disabled=false; if(!cur){ o.value=bgOp(null); if(el('dbgOpV')) el('dbgOpV').textContent=o.value+'%'; } }
      el('dbgSize').textContent='調好位置後按「套用這一塊」';
      dbgLayout(); dbgPreview();
    };
    im.src=fr.result;
  };
  fr.readAsDataURL(file);
}
/* 裁切中也要看得到效果：放開手指／放開滑桿時才重畫一次小圖，拖曳過程不做，免得卡頓 */
function dbgPreview(){
  if(!DBG||!el('dbgPrev')) return;
  var f=el('dbgFrame'), fw=f.clientWidth, fh=f.clientHeight;
  var sc=DBG.s0*DBG.z, dw=DBG.img.naturalWidth*sc, dh=DBG.img.naturalHeight*sc;
  var sx=(dw/2-fw/2-DBG.tx)/sc, sy=(dh/2-fh/2-DBG.ty)/sc;
  var cv=document.createElement('canvas'); cv.width=210; cv.height=118;
  try{
    cv.getContext('2d').drawImage(DBG.img,sx,sy,fw/sc,fh/sc,0,0,210,118);
    el('dbgPrev').style.setProperty('--dbg',"url('"+cv.toDataURL('image/jpeg',0.5)+"')");
    el('dbgPrev').style.setProperty('--dop',(Number(el('dbgOp').value)||9)/100);
  }catch(e){}
}
function dbgApply(){
  if(!DBG) return;
  var f=el('dbgFrame'), fw=f.clientWidth, fh=f.clientHeight;
  var sc=DBG.s0*DBG.z, dw=DBG.img.naturalWidth*sc, dh=DBG.img.naturalHeight*sc;
  /* 框的左上角換算回原圖座標 */
  var sx=(dw/2-fw/2-DBG.tx)/sc, sy=(dh/2-fh/2-DBG.ty)/sc, sw=fw/sc, sh=fh/sc;
  var OW=360, OH=Math.round(OW*9/16);
  var cv=document.createElement('canvas'); cv.width=OW; cv.height=OH;
  var cx=cv.getContext('2d');
  cx.imageSmoothingQuality='high';
  cx.drawImage(DBG.img,sx,sy,sw,sh,0,0,OW,OH);
  el('dbgSize').textContent='壓縮中…';
  var id=DBG.id;
  dbgEncode(cv,function(uri,size,type){
    if(!uri){ toast('這張照片壓不下來，換一張試試'); el('dbgSize').textContent=''; return; }
    var op=Number(el('dbgOp').value)||9, kb=Math.round(size/1024*10)/10;
    photoMap()[id]={src:uri,op:op,kb:kb};
    Store.savePath('photos','items/'+id,photoMap()[id]);
    DBG=null; render();
    /* 只更新底圖那一區，不重開整張表單——重開會把還沒儲存的文字改動丟掉 */
    dbgRefresh();
    toast('底圖已套用（'+kb+' KB · '+(type==='image/webp'?'WebP':'JPEG')+'）');
  });
}
function sheetItem(id){
  var x=id?items().filter(function(i){return i.id===id;})[0]:{day:P.planDay||1,time:'',title:'',desc:'',detail:'',tags:[]};
  if(!x) return;
  var tagsHtml='<div class="chips">'+tagList().map(function(d){ return '<button type="button" class="chip pick'+((x.tags||[]).indexOf(d.id)>=0?' on':'')+'" data-act="pickMulti" data-group="tags" data-val="'+d.id+'">'+ic(d.icon)+esc(d.label)+'</button>'; }).join('')+'</div><input type="hidden" name="tags" value="'+esc((x.tags||[]).join(','))+'">'+
    '<button type="button" class="btn sm" style="margin-top:.5rem" data-act="editTags">'+ic('gear')+'管理標籤（增減／改名）</button>';
  openSheet({title:id?'編輯行程':'新增行程',focus:true,body:
    '<div class="grid2">'+fld('第幾天','<select class="in" name="day">'+Array.apply(null,{length:S().settings.days||5}).map(function(_,i){return '<option value="'+(i+1)+'"'+(x.day===i+1?' selected':'')+'>第 '+(i+1)+' 天</option>';}).join('')+'</select>')+fld('時間',timeField('time',x.time))+'</div>'+
    fld('景點 / 活動名稱（建議 11 字以內）',inp('title',x.title))+fld('一句話說明',inp('desc',x.desc))+fld('Google 地圖地點（留空＝不顯示地圖按鈕）',inp('place',x.place||'','text','placeholder="例：Sa Pa Stone Church"'))+fld('防呆標籤',tagsHtml)+fld('詳細介紹（詳細模式才顯示）',ta('detail',x.detail))+dbgField(id),
    foot:footBtns('saveItem',id?'<button class="btn dng" data-act="delItem">刪除</button>':'')});
  SHEET.id=id;
}
function sheetTripName(){
  var st=S().settings, v=st.tripName||'';
  openSheet({title:'團名',focus:true,body:
    fld('顯示在畫面最上方（建議 10 字以內）',inp('tripName',v,'text','maxlength="20" id="tnInput"'))+
    '<div class="muted" id="tnCount" style="text-align:right;margin-top:-.35rem">'+[].slice.call(v).length+' / 20 字</div>'+
    '<div class="chips" style="margin-top:.5rem">'+
      ['沙壩雲海五日','越南沙壩 5 日','2026 沙壩團'].map(function(x){
        return '<button type="button" class="chip pick" data-act="tnPick" data-val="'+esc(x)+'">'+esc(x)+'</button>'; }).join('')+
    '</div>'+
    '<div class="muted" style="margin-top:.6rem">太長會在標頭以「…」截斷，不會換行。窄螢幕（iPhone SE）大約放得下 10 個中文字。</div>',
    foot:footBtns('saveTripName')});
}
/* --- 防呆標籤管理（領隊） --- */
function sheetTags(){
  var list=tagList();
  openSheet({title:'防呆標籤',body:
    '<div class="muted">這些標籤會出現在每一段行程下方，提醒長輩帶什麼、注意什麼。改了全團手機同步更新。</div>'+
    '<div class="it-wrap" style="margin-top:.6rem">'+list.map(function(d,i){
      return '<div class="it-row"><div class="tagrow">'+ic(d.icon)+'<b>'+esc(d.label)+'</b></div>'+
        '<button class="btn sm" data-act="moveTag" data-id="'+d.id+'" data-dir="-1"'+(i===0?' disabled':'')+' aria-label="上移">'+ic('up')+'</button>'+
        '<button class="btn sm" data-act="moveTag" data-id="'+d.id+'" data-dir="1"'+(i===list.length-1?' disabled':'')+' aria-label="下移">'+ic('down')+'</button>'+
        '<button class="btn sm edit" data-act="editTag" data-id="'+d.id+'" aria-label="編輯">'+ic('edit')+'</button></div>';
    }).join('')+'</div>'+
    '<button class="btn block" style="margin-top:.7rem" data-act="editTag" data-id="">'+ic('plus')+'新增一個標籤</button>'});
}
function sheetTagEdit(id){
  var list=tagList(), d=id?tagDef(id):{id:'',icon:'coat',label:''};
  if(!d) return;
  var used=id?items().filter(function(x){return (x.tags||[]).indexOf(id)>=0;}).length:0;
  openSheet({title:id?'編輯標籤':'新增標籤',focus:true,body:
    fld('標籤文字（建議 4 字以內，不換行）',inp('label',d.label,'text','maxlength="8" placeholder="例：帶雨傘"'))+
    fld('圖示',swatches('icon',TAG_ICONS.map(function(k){return [k,k];}),d.icon,function(v){return ic(v);}))+
    (id?'<div class="muted">目前有 '+used+' 段行程使用這個標籤；刪除會一併從那些行程移除。</div>':''),
    foot:footBtns('saveTag',id?'<button class="btn dng" data-act="delTag">刪除</button>':'')});
  SHEET.id=id;
}
function sheetMember(id){
  var m=id?member(id):{name:'',emoji:'',bg:'bg-white',border:'bd-grey',remark:'',room:'',phone:''};
  if(!m) return;
  openSheet({title:id?'編輯長輩卡片':'新增團員',focus:true,body:
    fld('姓名或暱稱',inp('name',m.name))+
    fld('徽章',swatches('emoji',[['','無']].concat(BADGES.map(function(d){return [d.id,d.label];})),badgeDef(m.emoji)?badgeDef(m.emoji).id:'',function(v,l){ return v?badgeSVG(v,'lg'):'無'; })+
      '<div class="bdg-hint">'+BADGES.map(function(d){return '<span>'+badgeSVG(d.id)+esc(d.label)+'</span>';}).join('')+'</div>')+
    fld('底色',swatches('bg',BGS,m.bg||'bg-white',function(v,l){return '<span class="mc sm '+v+'" style="min-height:2rem;padding:.2rem .5rem;width:auto;border-width:1px">'+l+'</span>';}))+
    fld('邊框',swatches('border',BDS,m.border||'bd-grey',function(v,l){return '<span class="mc sm '+v+'" style="min-height:2rem;padding:.2rem .5rem;width:auto">'+l+'</span>';}))+
    fld('航空公司（小圓徽章）',swatches('airline',[['','無'],['eva',(airDef('eva')||{}).short],['ci',(airDef('ci')||{}).short]],m.airline||'',function(v,l){return v?airlineBadge(v,true):'<span class="al lg none">無</span>';}))+
    fld('公開備註（一行）',inp('remark',m.remark)+chipsFill('remark',['A 車車長','負責收護照','全素勿蒜','鍋邊素','需溫熱開水','容易暈車，請坐前排']))+
    '<div class="grid2">'+fld('房號',inp('room',m.room))+fld('電話（選填）',inp('phone',m.phone,'tel'))+'</div>',
    foot:footBtns('saveMember',id?'<button class="btn dng" data-act="delMember">移出</button>':'')});
  SHEET.id=id;
}
function sheetMemberView(id){
  var m=member(id); if(!m) return;
  var st=S().settings;
  openSheet({title:'團員',body:memberCard(m,{right:'groups',tag:'div',act:'noop'})+
    '<dl class="kv"><dt>航空公司</dt><dd>'+(airDef(m.airline)?airlineBadge(m.airline)+' '+esc(airDef(m.airline).name)+(airDef(m.airline).note?' · '+esc(airDef(m.airline).note):''):'尚未設定')+'</dd><dt>房號</dt><dd>'+esc(m.room||'待分配')+'</dd>'+(m.remark?'<dt>備註</dt><dd>'+esc(m.remark)+'</dd>':'')+'</dl>'+
    '<div class="stack">'+(P.meId===m.id?'<button class="btn" data-act="setMe" data-id="">取消「這是我」</button>':'<button class="btn pri" data-act="setMe" data-id="'+m.id+'">'+ic('star')+'這是我</button>')+(m.phone?'<a class="btn" href="'+telHref(m.phone)+'">'+ic('phone')+'撥打電話</a>':'')+'</div>'});
}
function sheetPickMe(){
  openSheet({title:'我是誰？',focus:true,tall:true,body:'<div class="muted">只是把你的卡片標起來方便找，不需要密碼，隨時可以改。</div><div class="search">'+ic('search')+'<input id="meSearch" type="search" placeholder="輸入姓名…" autocomplete="off"></div><div id="meList" class="mlist">'+meListHTML('')+'</div>'});
}
function meListHTML(q){ return members().filter(function(m){return !q||m.name.indexOf(q)>=0;}).map(function(m){return memberCard(m,{sm:true,act:'setMe',right:'room'});}).join('')||'<div class="muted">找不到，請問領隊</div>'; }
function sheetRooms(){
  var byRoom={}; members().forEach(function(m){ var k=m.room||''; (byRoom[k]=byRoom[k]||[]).push(m); });
  var keys=Object.keys(byRoom).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});});
  openSheet({title:'批次改房號',focus:true,body:'<div class="muted">換飯店時，把每一組的新房號填進去；留白＝不變。同房的人會一起換。</div>'+
    keys.map(function(k,i){ return '<div class="f" style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;align-items:center"><div><b>'+(k?esc(k)+' 房':'未分配')+'</b><div class="muted">'+byRoom[k].map(function(m){return esc(m.name);}).join('、')+'</div></div><input class="in" name="room_'+i+'" data-old="'+esc(k)+'" placeholder="新房號" inputmode="numeric"></div>'; }).join(''),
    foot:footBtns('saveRooms')});
}
function sheetHotel(){
  var st=S().settings;
  openSheet({title:'飯店資料',body:'<div class="muted">目前入住（首頁、計程車卡、房號頁都會跟著切換）</div><div class="chips">'+(st.hotels||[]).map(function(h){ return '<button class="chip pick'+(h.id===st.currentHotelId?' on':'')+'" data-act="setHotel" data-id="'+h.id+'">'+esc(h.name)+'</button>'; }).join('')+'</div>'+
    '<div class="stack">'+(st.hotels||[]).map(function(h){ return '<button class="btn" data-act="editHotel" data-id="'+h.id+'">'+ic('edit')+'編輯：'+esc(h.name)+'</button>'; }).join('')+'<button class="btn" data-act="editHotel" data-id="">'+ic('plus')+'新增飯店</button></div>'});
}
function sheetHotelEdit(id){
  var st=S().settings, h=(st.hotels||[]).filter(function(x){return x.id===id;})[0]||{name:'',nameVi:'',addrVi:'',phone:'',wifi:'',wifiPass:'',wifiNote:'',breakfast:'',leaderRoom:'',nights:''};
  openSheet({title:id?'編輯飯店':'新增飯店',focus:true,body:
    fld('飯店名稱（中文＋英文）',inp('name',h.name))+fld('越文全名（給司機看）',inp('nameVi',h.nameVi))+fld('越文地址',inp('addrVi',h.addrVi))+
    '<div class="grid2">'+fld('飯店電話',inp('phone',h.phone,'tel'))+fld('領隊房號',inp('leaderRoom',h.leaderRoom))+'</div>'+
    '<div class="grid2">'+fld('Wi-Fi 名稱',inp('wifi',h.wifi,'text','placeholder="例：PaosSapa-Guest"'))+fld('Wi-Fi 密碼',inp('wifiPass',h.wifiPass,'text','placeholder="例：sapa2026"'))+'</div>'+
    fld('Wi-Fi 補充說明（留白就不顯示）',inp('wifiNote',(h.wifiNote===undefined||h.wifiNote===null?'連不上請到櫃台問，或跟領隊說。':h.wifiNote),'text','placeholder="例：連不上請到櫃台問"'))+
    fld('入住晚數',inp('nights',h.nights,'text','placeholder="例：第 2、3 晚"'))+
    fld('早餐時間／地點',inp('breakfast',h.breakfast)),
    foot:footBtns('saveHotel',id?'<button class="btn dng" data-act="delHotel">刪除</button>':'')});
  SHEET.id=id;
}
function sheetScenario(id){
  var sc=id?scenario(id):{name:'',count:3,names:[]};
  var fixed=id&&scnFixed(sc), ut=id?scnUseTags(sc):false;
  openSheet({title:id?'分組情境設定':'新增分組情境',focus:true,body:
    fld('情境名稱',inp('name',sc.name,'text','placeholder="例：用餐分桌"'))+
    fld('組數','<select class="in" name="count">'+[2,3,4,5,6,7,8].map(function(n){return '<option value="'+n+'"'+(sc.count===n?' selected':'')+'>'+n+' 組</option>';}).join('')+'</select>')+
    fld('各組名稱（用「、」分隔，可留白）',inp('names',(sc.names||[]).join('、'),'text','placeholder="第 1 桌、第 2 桌、第 3 桌"'))+
    fld('臨時標籤','<select class="in" name="useTags"><option value="1"'+(ut?' selected':'')+'>開啟（可貼素食、已點餐…）</option><option value="0"'+(ut?'':' selected')+'>關閉</option></select>')+
    (fixed?'<div class="hint-lead">'+ic('lock')+'這是固定情境，可以改名稱與組數，但不能刪除。</div>':''),
    foot:footBtns('saveScenario',(id&&!fixed)?'<button class="btn dng" data-act="delScenario">刪除</button>':'')});
  SHEET.id=id;
}
function sheetMoveMember2(id){
  var sc=scenario(), m=member(id); if(!sc||!m) return;
  var cur=mtagsOf(sc,id), opts=scnTagOpts(sc);
  var body='<div class="muted">'+esc(sc.name)+'</div><div class="stack">'+
    sc.names.slice(0,sc.count).map(function(n,i){ return '<button class="btn'+(sc.assign&&sc.assign[id]===i?' pri':'')+'" data-act="setGroup" data-id="'+id+'" data-g="'+i+'">'+esc(n||('第 '+(i+1)+' 組'))+'</button>'; }).join('')+
    '<button class="btn dng" data-act="setGroup" data-id="'+id+'" data-g="-1">移出分組</button></div>';
  if(scnUseTags(sc)){
    body+='<h2 class="sec" style="margin-top:.9rem">'+ic('flag')+'臨時標籤</h2>'+
      '<div class="muted">點一下貼上或取消，只在「'+esc(sc.name)+'」看得到。</div>'+
      '<div class="chips">'+opts.map(function(t){ return '<button class="chip pick'+(cur.indexOf(t)>=0?' on':'')+'" data-act="mtagToggle" data-id="'+id+'" data-v="'+esc(t)+'">'+esc(t)+'</button>'; }).join('')+'</div>'+
      '<div class="f" style="margin-top:.6rem"><label>自己打一個標籤</label><div class="row"><input class="in" name="newtag" placeholder="例：加點一份炒飯"><button class="btn" data-act="mtagAdd" data-id="'+id+'">'+ic('plus')+'加上去</button></div></div>'+
      (cur.length?'<button class="btn block dng" data-act="mtagClearOne" data-id="'+id+'">清空 '+esc(m.name)+' 的標籤</button>':'');
  }
  openSheet({title:esc(m.name),body:body});
  SHEET.id=id;
}
/* --- 臨時標籤管理（領隊，例：用餐分桌的素食／已點餐…選項） --- */
function sheetTagOpts(){
  var sc=scenario(); if(!sc) return;
  var opts=scnTagOpts(sc);
  openSheet({title:'管理「'+esc(sc.name)+'」標籤',body:
    '<div class="muted">這些是可以貼在團員身上的標籤選項，改了全團手機同步更新。</div>'+
    '<div class="it-wrap" style="margin-top:.6rem">'+opts.map(function(t){
      return '<div class="it-row"><div class="tagrow"><b>'+esc(t)+'</b></div>'+
        '<button class="btn sm edit" data-act="editTagOpt" data-v="'+esc(t)+'" aria-label="編輯">'+ic('edit')+'</button></div>';
    }).join('')+(opts.length?'':'<div class="muted">還沒有標籤，點下面新增一個。</div>')+'</div>'+
    '<button class="btn block" style="margin-top:.7rem" data-act="editTagOpt" data-v="">'+ic('plus')+'新增一個標籤</button>'});
}
function sheetTagOptEdit(v){
  var sc=scenario(); if(!sc) return;
  var used=v?Object.keys(sc.mtags||{}).filter(function(id){ return (sc.mtags[id]||[]).indexOf(v)>=0; }).length:0;
  openSheet({title:v?'編輯標籤':'新增標籤',focus:true,body:
    fld('標籤文字',inp('label',v,'text','maxlength="10" placeholder="例：加點一份炒飯"'))+
    (v?'<div class="muted">目前有 '+used+' 位團員貼著這個標籤；刪除會一併從他們身上移除。</div>':''),
    foot:footBtns('saveTagOpt',v?'<button class="btn dng" data-act="delTagOpt">刪除</button>':'')});
  SHEET.old=v||'';
}
function sheetMoveMember(id){
  var sc=scenario(), m=member(id); if(!sc||!m) return;
  openSheet({title:'移動：'+esc(m.name),body:'<div class="muted">'+esc(sc.name)+'</div><div class="stack">'+sc.names.slice(0,sc.count).map(function(n,i){ return '<button class="btn'+(sc.assign&&sc.assign[id]===i?' pri':'')+'" data-act="setGroup" data-id="'+id+'" data-g="'+i+'">'+esc(n||('第 '+(i+1)+' 組'))+'</button>'; }).join('')+'<button class="btn dng" data-act="setGroup" data-id="'+id+'" data-g="-1">移出分組</button></div>'});
}
function sheetSettings(){
  var st=S().settings, cs=(st.contacts&&st.contacts.length?st.contacts:contacts()).slice(); while(cs.length<4) cs.push({name:'',label:'',phone:'',line:''});
  var f=st.flights||{}; f.eva=f.eva||{}; f.ci=f.ci||{};
  openSheet({title:'團務設定',focus:true,body:
    fld('團名',inp('tripName',st.tripName))+
    '<div class="grid2">'+fld('出發日期（第 1 天）',inp('startDate',st.startDate,'date'))+fld('總天數',inp('days',st.days,'number','min="1" max="15" inputmode="numeric"'))+'</div>'+
    fld('今天是第幾天','<select class="in" name="dayOverride"><option value="0">依日期自動判斷</option>'+Array.apply(null,{length:st.days||5}).map(function(_,i){return '<option value="'+(i+1)+'"'+(st.dayOverride===i+1?' selected':'')+'>手動指定：第 '+(i+1)+' 天</option>';}).join('')+'</select>')+
    '<div class="grid2">'+fld('改領隊 PIN（不改就留白）',inp('pin','','tel','maxlength="6" inputmode="numeric" placeholder="4 位數字" autocomplete="off"'))+fld('1 台幣 ≈ 幾越盾',inp('vndPerTwd',st.vndPerTwd,'number','inputmode="numeric"'))+'</div>'+
    '<div class="muted" style="margin-top:-.5rem">PIN 只會以雜湊保存，雲端看不到明文。</div>'+
    '<h2 class="sec">'+ic('plane')+'航班（起飛時間）</h2>'+
    '<div class="grid2">'+fld('長榮 去程 桃園起飛',timeField('eva_out',f.eva.out))+fld('長榮 回程 河內起飛',timeField('eva_back',f.eva.back))+fld('華航 去程 桃園起飛',timeField('ci_out',f.ci.out))+fld('華航 回程 河內起飛',timeField('ci_back',f.ci.back))+'</div>'+fld('團體報到說明（顯示在航班卡下方）',ta('flight_note',f.note))+
    '<h2 class="sec">'+ic('phone')+'緊急聯絡人（留白＝不顯示）</h2>'+
    cs.map(function(c,i){ return '<div class="f" style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">'+inp('c_name_'+i,c.name,'text','placeholder="姓名"')+inp('c_label_'+i,c.label,'text','placeholder="例：越南電話"')+'<div style="grid-column:1/-1">'+inp('c_phone_'+i,c.phone,'tel','placeholder="+84 或 +886 開頭"')+'</div><div style="grid-column:1/-1">'+inp('c_line_'+i,c.line,'url','placeholder="LINE 加好友網址（選填）"')+'</div></div>'; }).join('')+
    fld('駐越南台北經濟文化辦事處 急難救助電話',inp('embassyPhone',st.embassyPhone,'tel','placeholder="出發前請至外交部領事事務局網站確認"'))+
    '<h2 class="sec">'+ic('clipboard')+'備份與還原</h2><div class="row"><button type="button" class="btn" data-act="exportData">'+ic('down')+'匯出備份檔</button><label class="btn" style="cursor:pointer">'+ic('up')+'匯入備份檔<input type="file" id="importFile" accept="application/json,.json" hidden></label></div><div class="muted">匯出會下載一個 JSON 檔（含名單、行程、電話）；匯入會覆蓋並同步給全團。</div>',
    foot:footBtns('saveSettings')});
  SHEET.nContacts=cs.length;
}
function sheetHomeScn(){
  var list=(S().groups&&S().groups.scenarios)||[];
  openSheet({title:'首頁分組顯示',body:
    '<div class="muted">團員選好自己的名字後，首頁「我的資訊」會列出他被分配到的分組。這裡可以把不想讓大家在首頁看到的情境關掉；關掉後「分組」頁籤仍正常使用，只是不會出現在首頁。</div>'+
    '<div class="it-wrap" style="margin-top:.6rem">'+(list.length?list.map(function(sc){
      return '<div class="it-row"><div class="tagrow"><b>'+esc(sc.name)+'</b></div>'+
        '<button class="tgl'+(homeScnHidden(sc.id)?'':' on')+'" data-act="toggleHomeScn" data-id="'+esc(sc.id)+'" aria-label="切換是否顯示在首頁"></button></div>';
    }).join(''):'<div class="muted">目前還沒有分組情境。</div>')+'</div>'});
}
/* 通知團員：把廣播排版好，一鍵丟進 LINE 群組。
   「開啟 LINE 傳送」用 LINE 的分享網址（line.me/R/msg/text/），點下去會直接跳到 LINE 選聊天室，
   文字已經填好，領隊只要選群組按送出；萬一那支手機沒裝 LINE，還有「複製文字」可以退。 */
function sheetShare(){
  var txt=bcShareText();
  openSheet({title:'通知團員',body:
    '<div class="muted">廣播已經同步到大家手機了。<b>已經打開 App 的人馬上就看得到</b>；沒打開的人，建議再貼一則到 LINE 群組比較保險。</div>'+
    '<div class="share-prev">'+esc(txt)+'</div>'+
    '<div class="stack" style="margin-top:.7rem">'+
      '<button class="btn big ok" data-act="lineSend">'+ic('chat')+'<span class="b2">開啟 LINE 傳送<small>選好群組按送出，不用自己貼</small></span></button>'+
      '<button class="btn block" data-act="copyShare">'+ic('clipboard')+'複製文字</button>'+
    '</div>'+
    '<div class="muted" style="margin-top:.6rem">小提醒：貼到群組後長按訊息可以「置頂」，長輩往上滑就找得到。</div>',
    foot:'<button class="btn" data-act="sheetClose">關閉</button>'});
}
/* 加到主畫面 / 安裝 App 的圖文教學。
   小圖示是用 div 模擬瀏覽器的那一排按鈕，橘框標出「要按哪裡」，
   長輩照著比對就找得到，不必再拍螢幕問人。 */
function sheetInstall(){
  var e=uaEnv(), n=0, h=[];
  function step(title,desc,fig){ n++; return '<div class="ig-s"><span class="ig-n">'+n+'</span><div class="tx"><b>'+title+'</b>'+(desc?'<small>'+desc+'</small>':'')+(fig||'')+'</div></div>'; }
  /* 教學截圖是小麥的 iPhone 實機畫面，關鍵按鈕已在圖上畫好橘框。
     放在 icons/ 底下讓 Service Worker 用「快取優先」收，看過一次之後離線也還在；
     不內嵌成 data URI 是因為那會讓 index.html 多出 ~130KB，每個人每次更新都要吞。 */
  function shot(n,alt){ return '<img class="ig-shot" src="./icons/guide-'+n+'.jpg" alt="'+esc(alt)+'" loading="lazy">'; }
  var why='<div class="ig-why">'+ic('info')+'<span>裝起來以後：<b>不用再選一次自己的名字</b>、沒訊號也打得開、打開沒有網址列，跟一般 App 一樣。</span></div>';
  var host=''; try{ host=location.hostname||'750hd.com'; }catch(x){ host='750hd.com'; }
  var url=''; try{ url=location.href.split('#')[0]; }catch(x){}

  if(e.inapp){
    var app=e.line?'LINE':'這個 App';
    h.push(step('先跳出 '+app+' 的瀏覽器','在 '+app+' 裡面沒辦法安裝。請按畫面'+(e.ios?'右下角':'右上角')+'的「⋯」，選「用其他瀏覽器開啟」或「用預設瀏覽器開啟」。',
      '<div class="ig-fig row2"><span class="dim">'+esc(host)+'</span><span class="ig-hi">⋯</span></div>'));
    h.push('<div class="ig-alt"><button class="btn sm" data-act="copyTxt" data-v="'+esc(url)+'">'+ic('clipboard')+'複製網址</button><small>找不到「⋯」的話，複製網址後自己貼到 '+(e.ios?'Safari':'Chrome')+' 的網址列開啟，再接著做下面的步驟。</small></div>');
  }

  if(e.ios){
    h.push(step('按右下角的「⋯」','網址列右邊那顆有三個點的圓鈕。',
      shot(1,'Safari 網址列右邊的三個點按鈕被橘框標示')));
    h.push(step('點最上面的「分享」','選單跳出來後，第一項就是。',
      shot(2,'選單最上面的「分享」被橘框標示')));
    h.push(step('按右邊的「檢視較多」','如果沒看到「加入主畫面」，先點這裡把選單展開。',
      shot(3,'分享選單右下角的「檢視較多」按鈕被橘框標示')));
    h.push(step('往下滑，點「加入主畫面」','在展開後的清單最下面。',
      shot(4,'展開後的清單，最下面的「加入主畫面」被橘框標示')));
    h.push(step('右上角按「加入」','主畫面就會多一個圖示，以後直接點它進來。',
      shot(5,'加入主畫面畫面，右上角的藍色「加入」按鈕被橘框標示')));
  } else if(e.android){
    h.push(step('按右上角的「⋮」','Chrome 網址列最右邊，三個直的點。',
      '<div class="ig-fig row2"><span class="dim">'+esc(host)+'</span><span class="ig-hi ic">'+ic('dots')+'</span></div>'));
    h.push(step('選「安裝應用程式」','有的手機寫「加到主畫面」，兩個都一樣。',
      '<div class="ig-fig row2 ig-hi"><span>安裝應用程式</span>'+ic('install')+'</div>'));
    h.push(step('按「安裝」','主畫面就會多一個圖示，以後直接點它進來。',
      '<div class="ig-fig row2"><span class="dim">取消</span><span class="ig-hi go">安裝</span></div>'));
  } else {
    h.push(step('看網址列的右邊','Chrome 或 Edge 的網址列最右邊，會有一個「安裝」的小圖示。',
      '<div class="ig-fig row2"><span class="dim">'+esc(host)+'</span><span class="ig-hi ic">'+ic('install')+'</span></div>'));
    h.push(step('按下去，再按「安裝」','沒看到圖示的話，改按右上角「⋮」→「投放、儲存及分享」→「安裝網頁應用程式」。'));
  }
  openSheet({title:e.ios?'加到主畫面（照著做）':'安裝成 App（照著做）',tall:(e.ios||e.inapp),body:why+'<div class="ig">'+h.join('')+'</div>'});
}
/* 首頁卡片位置：把 cardZone() 的規則開放給領隊調整。
   下面「現在的結果」是即時算出來的，領隊改完不用回首頁就能確認。 */
function sheetCardZones(){
  var z=zoneCfg(), di=dayInfo(), ord=zoneOrder(), h=[];
  function sl(k,cur,opts,cls){ return '<select class="in'+(cls?' '+cls:'')+'" data-act="zoneSet" data-k="'+esc(k)+'">'+
    opts.map(function(o){ return '<option value="'+esc(o[0])+'"'+(cur===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select>'; }
  /* 條件只對還在「自動」的卡片有意義，其他的不佔版面 */
  var COND={
    prep:['prepUntil','出發前準備｜什麼時候收起來',[['start','出發當天收起'],['end','整趟都留著'],['off','不顯示']]],
    flight:['flightSoon','航班資訊｜什麼時候排到「稍後」',[['auto','出發前＋首尾兩天'],['ends','只有首尾兩天'],['always','整趟都在稍後'],['never','一律放隨時查']]],
    morning:['morningSoon','明早時程｜什麼時候排到「稍後」',[['trip','旅程中'],['always','整趟都在稍後'],['never','一律放隨時查']]]
  };
  var autos=['prep','flight','morning'].filter(function(id){ return cardPin(id)==='auto'; });
  h.push('<div class="muted">每張卡片可以自己決定要「自動跟著行程走」還是<b>釘死在某一區</b>。釘死的卡片旅程結束後也維持在你指定的位置。<br>看板上的 ↑↓ 可以直接穿過分區標題，跨過去就等於釘住。</div>');
  if(autos.length){
    autos.forEach(function(id){ var c=COND[id];
      h.push('<div class="f"><label>'+esc(c[1])+'</label>'+sl(c[0],z[c[0]],c[2])+'</div>'); });
  }else{
    h.push('<div class="muted">目前每張卡都被釘死了，所以沒有自動條件要設定。</div>');
  }
  var ZOPT=[['auto','自動'],['now','現在'],['later','稍後'],['ref','隨時查'],['hide','不顯示']];
  h.push('<div class="zb-wrap"><div class="zb-t">'+esc(di.status==='before'?'出發前':(di.status==='after'?'旅程結束後':'第 '+di.idx+' / '+di.days+' 天'))+'的排法</div>');
  ['now','later','ref','hide'].forEach(function(zone){
    var list=ord.filter(function(id){ return cardZone(id,di)===zone; }), vis=(ZONE_VIS.indexOf(zone)>=0);
    h.push('<div class="zb-h">'+esc(ZONE_LABELS[zone])+'<i></i></div><div class="zb'+(zone==='now'?' now':'')+(zone==='hide'?' off':'')+'">');
    if(!list.length){ h.push('<div class="zb-empty">（沒有卡片）</div>'); }
    list.forEach(function(id,i){
      var L=cardLead(id), hide=(zone==='hide'), lock=!cardMovable(id);
      /* ↑ 在最上面那一區的第一張才關掉；↓ 在最下面的可見區最後一張才關掉。
         被鎖住的今日行程只在自己這一區內換先後。 */
      var canUp = vis && !(zone==='now'&&i===0) && !(lock&&i===0);
      var canDown = vis && !(zone==='ref'&&i===list.length-1) && !(lock&&i===list.length-1);
      var showOrd = vis && (list.length>1 || (!lock && (canUp||canDown)));
      h.push('<div class="zb-c"><div class="zb-r">'+(L.hl&&!hide?'<span class="hdot"></span>':'')+
        '<span class="zb-n">'+esc(ZONE_NAMES[id])+'</span>'+
        (lock?'<span class="zb-lock">固定</span>':sl('z.'+id,cardPin(id),ZOPT,'sm'))+
        (showOrd?'<span class="ord"><button class="omv" data-act="zoneMove" data-id="'+id+'" data-d="-1"'+(canUp?'':' disabled')+' aria-label="'+esc(ZONE_NAMES[id])+'往上移">↑</button>'+
          '<button class="omv" data-act="zoneMove" data-id="'+id+'" data-d="1"'+(canDown?'':' disabled')+' aria-label="'+esc(ZONE_NAMES[id])+'往下移">↓</button></span>':'')+
        '</div>'+
        (hide?'':'<div class="zb-s">'+
          (cardFoldable(id)?'<span class="lb">團員預設展開</span>'+
            '<button class="tgl xs'+(cardDefOpen(id,di)?' on':'')+'" data-act="zCardDef" data-id="'+id+'" aria-label="切換'+esc(ZONE_NAMES[id])+'的團員預設展開"></button>':'<span class="lb">不可收合</span>')+
          '<span class="gap"></span><span class="lb">高亮提醒</span>'+
          '<button class="tgl xs'+(L.hl?' on':'')+'" data-act="zCardHl" data-id="'+id+'" aria-label="切換'+esc(ZONE_NAMES[id])+'的高亮提醒"></button></div>')+
      '</div>');
    });
    h.push('</div>');
  });
  h.push('</div>');
  openSheet({title:'首頁卡片位置',tall:true,body:h.join(''),
    foot:'<button class="btn dng" data-act="zoneReset">全部恢復自動</button><button class="btn pri" data-act="sheetClose">完成</button>'});
}
function sheetNbPage(id){
  var pg=id?nbPage(id):{icon:'📝',title:'',type:'notes'};
  var ps=nbPages(), idx=ps.indexOf(pg);
  openSheet({title:id?'頁籤設定':'新增頁籤',focus:true,body:
    '<div class="grid2">'+fld('圖示（1 個表情符號）',inp('icon',pg.icon,'text','maxlength="4"'))+fld('頁籤名稱',inp('title',pg.title,'text','placeholder="例：出發前準備"'))+'</div>'+
    fld('類型','<select class="in" name="type"><option value="notes"'+(pg.type!=='check'?' selected':'')+'>提醒文字（每條一張卡）</option><option value="check"'+(pg.type==='check'?' selected':'')+'>勾選清單（團員各自勾選）</option></select>')+
    (id?'<div class="row"><button class="btn" data-act="nbMovePage" data-id="'+id+'" data-dir="-1"'+(idx<=0?' disabled':'')+'>'+ic('up')+'頁籤往前</button><button class="btn" data-act="nbMovePage" data-id="'+id+'" data-dir="1"'+(idx>=ps.length-1?' disabled':'')+'>'+ic('down')+'頁籤往後</button></div>':''),
    foot:footBtns('nbSavePage',id?'<button class="btn dng" data-act="nbDelPage">刪除頁籤</button>':'')});
  SHEET.id=id;
}
function sheetNbItem(pgId,id,head){
  var pg=nbPage(pgId); if(!pg) return;
  var it=id?(pg.items||[]).filter(function(x){return x.id===id;})[0]:{text:'',kind:head?'head':'item'};
  if(!it) return;
  var isHead=it.kind==='head';
  openSheet({title:(id?'編輯':'新增')+(isHead?'小標題':'一條提醒'),focus:true,body:
    fld(isHead?'小標題文字':'內容（可換行；開頭放一個表情符號更好認）',isHead?inp('text',it.text):ta('text',it.text))+
    (isHead?'':'<div class="muted">例：🕐 越南比台灣慢 1 小時…</div>')+
    (id?'<div class="row"><button class="btn" data-act="nbMove" data-pg="'+pgId+'" data-id="'+id+'" data-dir="-1">'+ic('up')+'上移</button><button class="btn" data-act="nbMove" data-pg="'+pgId+'" data-id="'+id+'" data-dir="1">'+ic('down')+'下移</button><button class="btn dng" data-act="nbDelItem" data-pg="'+pgId+'" data-id="'+id+'">'+ic('trash')+'刪除</button></div>':''),
    foot:footBtns('nbSaveItem')});
  SHEET.pg=pgId; SHEET.id=id; SHEET.head=isHead;
}


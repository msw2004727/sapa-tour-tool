/* ===== 底部表單（Sheet）與全螢幕卡 ===== */
var SHEET=null;
/* Android 返回鍵 / 瀏覽器上一頁：關掉 sheet 或全螢幕卡，而不是離開網站 */
/* 自己關掉時用 history.back() 把那一筆拿掉；那次 back() 引起的 popstate 要略過（skip）。
   否則「關掉一個、馬上開另一個」（例：防呆標籤存檔後回到清單、計程車卡按編輯）時，
   back() 比新的 pushState 晚執行，popstate 會把剛開的那一個關掉（v3.22 以前就有，v3.23 修正） */
var HIST={sheet:false,full:false,skip:0};
function histPush(kind){ if(HIST[kind]) return; try{ history.pushState({sapa:kind},''); HIST[kind]=true; }catch(e){} }
function histPop(kind){ if(!HIST[kind]) return; HIST[kind]=false; try{ if(history.state&&history.state.sapa===kind){ HIST.skip++; history.back(); } }catch(e){} }
window.addEventListener('popstate',function(){ if(HIST.skip>0){ HIST.skip--; return; } if(HIST.full){ HIST.full=false; closeFull(); return; } if(HIST.sheet){ HIST.sheet=false; closeSheet(); } });
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
  openSheet({title:'管理模式',body:'<div class="muted" style="text-align:center">請輸入 4 位數 PIN 碼</div><div class="pin-disp" id="pinDisp">＿ ＿ ＿ ＿</div><div class="pin">'+
    ['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(function(k){ return '<button data-act="pinKey" data-k="'+k+'">'+k+'</button>'; }).join('')+'</div>',focus:false});
  SHEET.pin='';
}
function sheetLeaderMenu(){
  openSheet({title:'管理模式',body:'<div class="stack">'+
    '<button class="btn big" data-act="tool" data-tool="rollcall">'+ic('clipboard')+'<span class="b2">集合點名</span></button>'+
    '<button class="btn big" data-act="editBroadcast">'+ic('megaphone')+'<span class="b2">修改即時廣播</span></button>'+
    '<button class="btn big" data-act="editMorning">'+ic('sun')+'<span class="b2">明早時程</span></button>'+
    '<button class="btn big" data-act="settings">'+ic('gear')+'<span class="b2">團務設定</span></button>'+
    '<button class="btn big" data-act="pickHotel">'+ic('bed')+'<span class="b2">飯店資料 / 切換入住</span></button>'+
    '<button class="btn big" data-act="leaderLock">'+ic('lock')+'<span class="b2">鎖定管理模式</span></button></div>'});
}
function sheetBroadcast(){
  var b=S().broadcast||{}, cur=items().filter(function(x){return x.isCurrent;})[0];
  /* 集合日期：有日期才算得出跨日倒數（例如出發前先公布出發當天 05:30 的機場集合） */
  var st=S().settings, today=tzParts(LTZ()).date, tmr=ymd(parseDate(today)+86400000);
  var picks=[[today,'今天'],[tmr,'明天']];
  if(st.startDate&&!isNaN(parseDate(st.startDate))&&st.startDate!==today&&st.startDate!==tmr) picks.push([st.startDate,'出發日 '+dayDate(1).split('（')[0]]);
  openSheet({title:'修改即時廣播',focus:true,body:
    /* 日期預設：上一則還有效就沿用它的日期；已經過期（例如出發日的機場集合）就帶今天，
       免得主辦人只改時間、日期還停在前一天，整則廣播被當成過期藏起來 */
    fld('集合日期',inp('date',(bcActive()&&b.time)?(b.date||bcDate()):today,'date')+'<div class="chips" style="margin-top:.4rem">'+picks.map(function(x){ return '<button type="button" class="chip pick" data-act="chipSet" data-target="date" data-val="'+esc(x[0])+'">'+esc(x[1])+'</button>'; }).join('')+'</div>')+
    fld('集合時間（24 小時制）',timeField('time',b.time)+'<input type="hidden" name="tz" value="'+esc(b.tz||'')+'" data-at="'+esc(b.tz?(b.date||'')+' '+(b.time||''):'')+'">'+'<div class="muted" style="margin-top:.3rem">出發日 '+esc(twCutoff())+' 以前填台灣時間，其他時間都填當地時間。</div>'+'<div class="chips" style="margin-top:.4rem">'+[15,30,45,60].map(function(m){return '<button type="button" class="chip pick" data-act="chipTimeFromNow" data-min="'+m+'">現在＋'+m+'分</button>';}).join('')+'</div>')+
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
   避免管理者改完圖又按取消，結果圖也一起不見；也避免每改一個字就要重傳圖片。 */
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
      '<div class="pv-t">08:00</div><div><b>搭纜車上山</b><span>山上約 10 度，請備妥外套與保溫水壺</span></div>'+
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
/* 還原上一版：只列出「資料曾經突然變少」時自動留下的那幾份 */
function sheetPrev(){
  var list=Store.prevSnapshots();
  var body=list.length
    ? '<div class="muted">下面是資料突然變少時自動留下的上一版。按「還原」會把那一版寫回雲端、同步給全團。</div><div class="stack" style="margin-top:.6rem">'+
      list.map(function(p){ var d=new Date(p.at); var hm=(d.getMonth()+1)+'/'+d.getDate()+' '+(d.getHours()<10?'0':'')+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
        return '<div class="it-row"><div style="flex:1"><b>'+esc(DOC_NAMES[p.key])+'</b><div class="muted">'+p.n+' 筆 · 留存於 '+hm+'（目前 '+Store.docCount(p.key,Store.s[p.key])+' 筆）</div></div><button class="btn sm pri" data-act="restorePrev" data-key="'+p.key+'">還原</button></div>'; }).join('')+'</div>'
    : '<div class="muted">目前沒有需要還原的版本。只有在名單、行程、分組或記事本突然少掉一半以上時，才會自動留一份。</div>';
  openSheet({title:'還原上一版',body:body});
}
/* 時間模擬：挑一個時間點，重新載入後整個 App 以為「現在」是那個時間。
   只寫在這個分頁的 sessionStorage，關掉 App 就自動結束；模擬期間任何修改都不會存檔。 */
function sheetSim(){
  var st=S().settings, P2=[];
  function at(n,hm){ return dayYmd(n)+'T'+hm; }
  var d0=ymd(parseDate(st.startDate)-86400000), dEnd=ymd(parseDate(st.startDate)+(st.days||5)*86400000);
  P2.push(['出發前一晚',d0+'T21:00']);
  P2.push(['出發日 05:00・集合前',at(1,'05:00')]);
  P2.push(['出發日 05:45・集合遲到',at(1,'05:45')]);
  P2.push(['第 1 天 14:00・抵達之後',at(1,'14:00')]);
  for(var n=2;n<(st.days||5);n++) P2.push(['第 '+n+' 天 09:00',at(n,'09:00')]);
  P2.push(['第 '+(st.days||5)+' 天 07:00・最後一天',at(st.days||5,'07:00')]);
  P2.push(['第 '+(st.days||5)+' 天 20:00・已回台灣',at(st.days||5,'20:00')]);
  P2.push(['回國隔天',dEnd+'T10:00']);
  var body='<div class="muted">選一個時間，App 會以為「現在」就是那時候，讓你先看看旅途中、回國後首頁長什麼樣子。<b>只影響這支手機</b>，其他人看不到；模擬期間的任何修改都<b>不會存檔</b>。關掉 App 或按「結束」就恢復。時間都是<b>台灣時間</b>。</div>'+
    '<div class="stack" style="margin-top:.7rem">'+P2.map(function(x){ return '<button class="btn block" data-act="simSet" data-val="'+esc(x[1])+'">'+esc(x[0])+'<span class="sp" style="flex:1"></span><small class="muted">'+esc(mdw(x[1].slice(0,10)).split('（')[0]+' '+x[1].slice(11))+'</small></button>'; }).join('')+'</div>'+
    '<h2 class="sec">'+ic('clock')+'自訂時間（台灣時間）</h2>'+
    '<div class="row"><input class="in" type="datetime-local" name="simAt" value="'+esc(at(2,'10:00'))+'" style="flex:1;min-width:0"><button class="btn pri" data-act="simSet">開始</button></div>'+
    (SIM_OFF?'<button class="btn block dng" style="margin-top:.8rem" data-act="simEnd">結束模擬，回到現在</button>':'');
  openSheet({title:'時間模擬',body:body});
}
function sheetTripName(){
  var st=S().settings, v=st.tripName||'';
  openSheet({title:'團名',focus:true,body:
    fld('顯示在畫面最上方（建議 10 字以內）',inp('tripName',v,'text','maxlength="20" id="tnInput"'))+
    '<div class="muted" id="tnCount" style="text-align:right;margin-top:-.35rem">'+[].slice.call(v).length+' / 20 字</div>'+
    '<div class="chips" style="margin-top:.5rem">'+
      [((st.startDate||'').slice(0,4)||tzParts(TW).date.slice(0,4))+' 團體旅遊',(st.days||5)+' 日自由行','月半團旅'].map(function(x){
        return '<button type="button" class="chip pick" data-act="tnPick" data-val="'+esc(x)+'">'+esc(x)+'</button>'; }).join('')+
    '</div>'+
    '<div class="muted" style="margin-top:.6rem">太長會在標頭以「…」截斷，不會換行。窄螢幕（iPhone SE）大約放得下 10 個中文字。</div>',
    foot:footBtns('saveTripName')});
}
/* --- 防呆標籤管理（管理者） --- */
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
function meListHTML(q){ return members().filter(function(m){return !q||m.name.indexOf(q)>=0;}).map(function(m){return memberCard(m,{sm:true,act:'setMe',right:'room'});}).join('')||'<div class="muted">找不到，請問主辦人</div>'; }
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
    fld('飯店名稱（中文＋英文）',inp('name',h.name))+fld('當地語言的飯店名稱（給司機看）',inp('nameVi',h.nameVi))+fld('當地語言的地址（給司機看）',inp('addrVi',h.addrVi))+
    '<div class="grid2">'+fld('飯店電話',inp('phone',h.phone,'tel'))+fld('主辦人房號',inp('leaderRoom',h.leaderRoom))+'</div>'+
    '<div class="grid2">'+fld('Wi-Fi 名稱',inp('wifi',h.wifi,'text','placeholder="例：Hotel-Guest"'))+fld('Wi-Fi 密碼',inp('wifiPass',h.wifiPass,'text','placeholder="例：12345678"'))+'</div>'+
    fld('Wi-Fi 補充說明（留白就不顯示）',inp('wifiNote',(h.wifiNote===undefined||h.wifiNote===null?'連不上請到櫃台問，或跟主辦人說。':h.wifiNote),'text','placeholder="例：連不上請到櫃台問"'))+
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
/* --- 臨時標籤管理（管理者，例：用餐分桌的素食／已點餐…選項） --- */
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
/* 目的地時區的選單：括號裡「比台灣快／慢幾小時」用今天的日期算（有夏令時間的地方會跟著季節變） */
function tzDiffText(z){ var now=nowMs(), d=Math.round((tzOff(z,now)-tzOff(TW,now))/60000); if(!d) return '跟台灣一樣';
  var a=Math.abs(d), h=Math.floor(a/60), m=a%60; return (d>0?'比台灣快 ':'比台灣慢 ')+(h?h+' 小時':'')+(m?(h?' ':'')+m+' 分':''); }
function tzSelect(cur){ var list=TZ_PRESETS.filter(function(x){ return tzValid(x[0]); });
  if(cur&&tzValid(cur)&&cur!==TW&&!list.some(function(x){ return x[0]===cur; })) list.push([cur,cur]);
  return '<select class="in" name="tz"><option value="">跟台灣一樣（沒有時差）</option>'+list.map(function(x){ return '<option value="'+esc(x[0])+'"'+(x[0]===cur?' selected':'')+'>'+esc(x[1]+'（'+tzDiffText(x[0])+'）')+'</option>'; }).join('')+'</select>'; }
function sheetSettings(){
  var st=S().settings, cs=(st.contacts&&st.contacts.length?st.contacts:contacts()).slice(); while(cs.length<4) cs.push({name:'',label:'',phone:'',line:''});
  var f=st.flights||{}; f.eva=f.eva||{}; f.ci=f.ci||{};
  openSheet({title:'團務設定',focus:true,body:
    fld('團名',inp('tripName',st.tripName))+
    '<div class="grid2">'+fld('出發日期（第 1 天）',inp('startDate',st.startDate,'date'))+fld('總天數',inp('days',st.days,'number','min="1" max="15" inputmode="numeric"'))+'</div>'+
    fld('今天是第幾天','<select class="in" name="dayOverride"><option value="0">依日期自動判斷</option>'+Array.apply(null,{length:st.days||5}).map(function(_,i){return '<option value="'+(i+1)+'"'+(st.dayOverride===i+1?' selected':'')+'>手動指定：第 '+(i+1)+' 天</option>';}).join('')+'</select><div class="muted" style="margin-top:.3rem">注意：手動指定會套用到<b>全團每一支手機</b>。只是想自己先看看，請用管理專區的「時間模擬」。</div>')+
    fld('目的地時區（標頭「當地」時鐘、首頁倒數都用它）',tzSelect(st.tz||'')+'<div class="muted" style="margin-top:.3rem">出發日搭機前（最晚一班去程起飛以前）人還在台灣，那段一律用台灣時間。</div>')+
    fld('改管理 PIN（不改就留白）',inp('pin','','tel','maxlength="6" inputmode="numeric" placeholder="4 位數字" autocomplete="off"'))+
    '<div class="muted" style="margin-top:-.5rem">PIN 只會以雜湊保存，雲端看不到明文。外幣與匯率改在「工具 → 外幣點鈔速算」設定。</div>'+
    '<h2 class="sec">'+ic('plane')+'航班（起飛時間）</h2>'+
    '<div class="grid2">'+fld(esc(alShort('eva'))+' 去程 桃園起飛',timeField('eva_out',f.eva.out))+fld(esc(alShort('eva'))+' 回程起飛',timeField('eva_back',f.eva.back))+fld(esc(alShort('ci'))+' 去程 桃園起飛',timeField('ci_out',f.ci.out))+fld(esc(alShort('ci'))+' 回程起飛',timeField('ci_back',f.ci.back))+'</div>'+
    fld('回程從哪個機場起飛（選填，會寫在航班卡上）',inp('backPort',f.backPort,'text','maxlength="20" placeholder="例：成田機場、河內內排機場"'))+'<div class="muted" style="margin-top:-.5rem">團員首頁不會同時看到去回程：出發前與第 1 天只顯示去程，第 '+Math.max(2,(st.days||5)-1)+' 天起只顯示回程，中間幾天航班卡收起。</div>'+fld('去程團體報到說明（只在去程階段顯示在航班卡下方）',ta('flight_note',f.note))+
    '<h2 class="sec">'+ic('phone')+'緊急聯絡人</h2><div class="muted" style="margin-top:-.5rem">留白＝不顯示</div>'+
    cs.map(function(c,i){ return '<div class="f" style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem">'+inp('c_name_'+i,c.name,'text','placeholder="姓名"')+inp('c_label_'+i,c.label,'text','placeholder="例：當地電話"')+'<div style="grid-column:1/-1">'+inp('c_phone_'+i,c.phone,'tel','placeholder="含國碼，例：+886 912 345 678"')+'</div><div style="grid-column:1/-1">'+inp('c_line_'+i,c.line,'url','placeholder="LINE 加好友網址（選填）"')+'</div></div>'; }).join('')+
    '<div class="muted">當地的報警、救護車與駐外館處電話，改在「工具 → 緊急求助」頁編輯。</div>'+
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
/* ===== 推播通知（v3.24 預留，關閉中）=====
   只畫畫面：所有開關與欄位都是 disabled，沒有 data-act、不讀不寫任何資料、也不會跳出「允許通知」的詢問。 */
function puSwitch(label){ return '<button type="button" class="tgl" role="switch" aria-checked="false" aria-disabled="true" disabled aria-label="'+esc(label)+'（目前關閉中）"></button>'; }
function sheetPush(){
  var sel=function(opts,cur){ return '<select class="in" disabled aria-disabled="true">'+opts.map(function(o){ return '<option'+(o[0]===cur?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select>'; };
  openSheet({title:'推播通知',tall:true,body:
    '<div class="bk-note">'+ic('bell')+'<span>此功能<b>因成本考量，目前關閉中</b>。下面的開關與欄位是先預留的，開放之後才能使用；現在不會傳送任何通知。</span></div>'+
    '<div class="pu-list"><div class="pu-row"><div class="pu-t"><b>推播通知（總開關）</b><small>開啟後，手機不用打開 App 也會收到通知</small></div><span class="pu-off">關閉中</span>'+puSwitch('推播通知總開關')+'</div></div>'+
    '<h2 class="sec">'+ic('flag')+'什麼情況要推播</h2>'+
    '<div class="pu-list">'+PUSH_TYPES.map(function(t){ return '<div class="pu-row"><div class="pu-t"><b>'+esc(t.name)+'</b><small>'+esc(t.sub)+'</small></div>'+puSwitch(t.name)+'</div>'; }).join('')+'</div>'+
    '<h2 class="sec">'+ic('clock')+'提醒時間</h2>'+
    '<div class="grid2">'+fld('集合倒數：提前',sel([['5','5 分鐘'],['10','10 分鐘'],['15','15 分鐘'],['30','30 分鐘']],'15'))+fld('下一站：提前',sel([['10','10 分鐘'],['20','20 分鐘'],['30','30 分鐘'],['60','1 小時']],'20'))+'</div>'+
    fld('每日早安摘要的時間','<input class="in" type="text" value="07:30" disabled aria-disabled="true">')+
    fld('發送服務網址','<input class="in" type="text" placeholder="尚未設定" disabled aria-disabled="true">')+
    '<div class="muted">目前關閉中，這些欄位暫時不能修改。</div>',
    foot:'<button class="btn pri" data-act="sheetClose">知道了</button>'});
}
/* 通知團員：把廣播排版好，一鍵丟進 LINE 群組。
   「開啟 LINE 傳送」用 LINE 的分享網址（line.me/R/msg/text/），點下去會直接跳到 LINE 選聊天室，
   文字已經填好，管理者只要選群組按送出；萬一那支手機沒裝 LINE，還有「複製文字」可以退。 */
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
/* 首頁卡片位置：把 cardZone() 的規則開放給管理者調整。
   下面「現在的結果」是即時算出來的，管理者改完不用回首頁就能確認。 */
function sheetCardZones(){
  var z=zoneCfg(), di=dayInfo(), ord=zoneOrder(), h=[];
  function sl(k,cur,opts,cls){ return '<select class="in'+(cls?' '+cls:'')+'" data-act="zoneSet" data-k="'+esc(k)+'">'+
    opts.map(function(o){ return '<option value="'+esc(o[0])+'"'+(cur===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select>'; }
  /* 條件只對還在「自動」的卡片有意義，其他的不佔版面 */
  var COND={
    prep:['prepUntil','出發前準備｜什麼時候收起來',[['start','出發當天收起'],['end','整趟都留著'],['off','不顯示']]],
    flight:['flightSoon','航班資訊｜什麼時候排到「稍後」',[['auto','出發前＋去回程那幾天'],['ends','只有去回程那幾天'],['always','有顯示的日子都在稍後'],['never','一律放隨時查']]],
    morning:['morningSoon','明早時程｜什麼時候排到「稍後」',[['trip','旅程中'],['always','整趟都在稍後'],['never','一律放隨時查']]]
  };
  var autos=['prep','flight','morning'].filter(function(id){ return cardPin(id)==='auto'; });
  h.push('<div class="muted"><b>高亮提醒</b>：打開後全團首頁那張卡會發光；團員自己把卡片收起來時不亮（表示看過了），再打開又會亮。要讓已經收起的人也重新看到，把開關關掉再打開。</div>');
  h.push('<div class="muted">每張卡片可以自己決定要「自動跟著行程走」還是<b>釘死在某一區</b>。釘死的卡片旅程結束後也維持在你指定的位置。<br>例外：出發前準備出發後一定收起；航班卡出發前與第 1 天只顯示去程'+((S().settings.days||5)>=5?'、第 2～'+((S().settings.days||5)-2)+' 天收起':((S().settings.days||5)===4?'、第 2 天收起':''))+'、之後只顯示回程。<br>看板上的 ↑↓ 可以直接穿過分區標題，跨過去就等於釘住。</div>');
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
    (isHead?'':'<div class="muted">例：🕐 當地比台灣慢 1 小時…</div>')+
    (id?'<div class="row"><button class="btn" data-act="nbMove" data-pg="'+pgId+'" data-id="'+id+'" data-dir="-1">'+ic('up')+'上移</button><button class="btn" data-act="nbMove" data-pg="'+pgId+'" data-id="'+id+'" data-dir="1">'+ic('down')+'下移</button><button class="btn dng" data-act="nbDelItem" data-pg="'+pgId+'" data-id="'+id+'">'+ic('trash')+'刪除</button></div>':''),
    foot:footBtns('nbSaveItem')});
  SHEET.pg=pgId; SHEET.id=id; SHEET.head=isHead;
}
/* ===== 一鍵清空・備份與還原（v3.22）=====
   清空與還原都會影響全團，所以：先把「會發生什麼事」講清楚，再輸入一次管理 PIN 才執行。
   PIN 欄位不自動取得焦點：手機鍵盤一跳出來就會蓋住上面的警語。 */
function pinField(verb){ return '<div class="warn-box dng-box" id="sheetErr" role="alert" hidden></div>'+
  '<div class="f"><label>輸入管理 PIN 確認'+verb+'</label><input class="in pinmask" name="pin" type="tel" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="管理 PIN"></div>'; }
function sheetClear(){
  var s=bkSum(S()), st=S().settings||{}, L=[];
  function n(x,u){ return x?'（'+x+' '+u+'）':''; }
  L.push('行程'+n(s.itinerary,'站')+'、行程底圖'+n(s.photos,'張'));
  L.push('團員名單'+n(s.members,'人')+'、分組'+n(s.groups,'個情境')+'、點名紀錄');
  L.push('記事本'+n(s.notebook,'頁')+'，包含出發前準備清單');
  L.push('即時廣播、明早時程');
  L.push('團名'+(st.tripName?'「'+st.tripName+'」':'')+'、出發日期與天數、航班時間');
  L.push('飯店資料'+n(s.hotels,'間')+'、緊急聯絡人'+n(s.contacts,'位'));
  L.push('防呆標籤、航空公司名稱與航廈、首頁卡片位置與高亮、目的地時區');
  L.push('工具頁內容：知識小卡'+n(s.cards,'張')+'、外語圖卡'+n(s.phrases,'句')+'、外幣、計程車卡、當地急救電話（之後可以到「工具頁範本」一鍵套用通用版）');
  openSheet({title:'一鍵清空內容',tall:true,body:
    '<div class="warn-box dng-box">'+ic('alert')+'<span>清空後，<b>全團每一支手機都會同步變成空白</b>，首頁只剩「尚未建立旅程」。</span></div>'+
    '<div><b>會清空</b><ul class="dots clr-list">'+L.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul></div>'+
    '<div><b>會保留</b><div class="muted" style="margin-top:.25rem">管理 PIN（清空後一樣用原本的 PIN 進管理模式）。每支手機自己的字級、深淺色不受影響。</div></div>'+
    '<div class="bk-note">'+ic('history')+'<span>清空前會<b>自動備份</b>一份（雲端＋這支手機）。按錯了，到「管理專區 → 備份與還原」就能一鍵復原；雲端最多保留最近 '+BK_MAX+' 份。</span></div>'+
    '<button type="button" class="btn block" data-act="exportData">'+ic('install')+'下載備份檔（選用）</button>'+
    pinField('清空'),
    foot:'<button class="btn" data-act="sheetClose">取消</button><button class="btn dng" data-act="clearGo">'+ic('trash')+'確定清空</button>'});
}
/* 備份清單：先列這支手機裡的，雲端讀到了再換成合併後的 */
function bkListHTML(list,state){
  var h=['<div class="muted">每次「一鍵清空」或「還原」之前，都會先自動備份當時的全部內容。按「還原」會用那一份取代現在的資料，並同步給全團。</div>'];
  if(state==='loading') h.push('<div class="muted">正在讀取雲端的備份…</div>');
  else if(state==='fail') h.push('<div class="muted">雲端的備份暫時讀不到（可能沒有網路），先列出這支手機裡的。</div>');
  if(!list.length){ if(state!=='loading') h.push('<div class="card muted">目前沒有備份。按「一鍵清空內容」時，會先自動備份一份。</div>'); }
  else h.push('<div class="stack">'+list.map(function(e){ var s=e.sum||bkSum(e.docs);
    return '<div class="bk-row"><div class="bk-t"><b>'+esc(whenText(e.at))+' '+(e.reason==='restore'?'還原前':'清空前')+'的備份</b>'+
      '<span class="muted">'+esc((s.trip?s.trip+'：':'')+bkSumText(s))+'</span>'+
      '<span class="bk-src">存在'+(e.cloud&&e.local?'雲端＋這支手機':(e.cloud?'雲端':'這支手機'))+'</span></div>'+
      '<div class="row"><button class="btn sm pri" data-act="bkAsk" data-id="'+esc(e.id)+'">'+ic('refresh')+'還原</button><button class="btn sm" data-act="bkFile" data-id="'+esc(e.id)+'">'+ic('install')+'下載</button></div></div>'; }).join('')+'</div>');
  return h.join('');
}
function sheetBackups(){
  openSheet({title:'備份與還原',tall:true,body:'<div id="bkList" class="stack"></div>'});
  bkLoad(function(list,state){ var box=el('bkList'); if(box) box.innerHTML=bkListHTML(list,state); });
}
function sheetRestore(id){
  var e=bkFind(id); if(!e){ toast('找不到這份備份，請重新打開清單'); return; }
  var s=e.sum||bkSum(e.docs);
  openSheet({title:'還原這份備份？',body:
    '<div class="bk-row"><div class="bk-t"><b>'+esc(whenText(e.at))+' '+(e.reason==='restore'?'還原前':'清空前')+'的備份</b><span class="muted">'+esc((s.trip?s.trip+'：':'')+bkSumText(s))+'</span></div></div>'+
    '<div class="warn-box">'+ic('alert')+'<span>現在的內容會被這份備份<b>整個取代</b>，全團手機會同步。</span></div>'+
    (stateBlank(S())?'':'<div class="bk-note">'+ic('history')+'<span>還原前會先把<b>現在的內容</b>也自動備份一份，還原錯了可以再還原回來。</span></div>')+
    pinField('還原'),
    foot:'<button class="btn" data-act="sheetClose">取消</button><button class="btn pri" data-act="bkGo">'+ic('refresh')+'確定還原</button>'});
  SHEET.bk=id;
}

/* ===== 工具頁內容的編輯（v3.23，主辦人）=====
   全部存在 tools 文件，一律整份存檔（Store.save('tools')）：工具內容多半只有主辦人一個人在改。
   會讓內容變少的動作（清空一區、刪類別、套用範本）先在這支手機留一份上一版（Store.keepPrev）。 */
function sck(n){ var e=el('sheetRoot').querySelector('[name="'+n+'"]'); return !!(e&&e.checked); }
/* 小卡編輯器上方的插入鈕：[要插入的字, 按鈕名稱, 是否插在游標位置（不另起一行）] */
var MD_HELP=[['## ','小標題'],['### ','重點框'],['- ','條列'],['1. ','步驟'],['! ','警示'],['｜','對照',1]];
function sheetCardEdit(id,sec){
  var c=id?tlCard(id):null; if(id&&!c) return;
  c=c||{id:'',sec:(sec==='local'?'local':'pre'),icon:'info',title:'',sub:'',body:''};
  /* 順序：最常改的（標題、內容、預覽）放上面，區塊與圖示放最後——圖示有 30 個，放前面要捲很久才到內容 */
  openSheet({title:id?'編輯小卡':'新增小卡',tall:true,body:
    '<div class="grid2">'+fld('標題（10 字以內）',inp('title',c.title,'text','maxlength="10" placeholder="例：入境與通關"'))+fld('小字說明（選填）',inp('sub',c.sub,'text','maxlength="16" placeholder="例：護照效期"'))+'</div>'+
    '<div class="f"><label>內容</label><div class="md-bar">'+MD_HELP.map(function(x){ return '<button type="button" class="chip" data-act="mdIns" data-v="'+esc(x[0])+'"'+(x[2]?' data-inline="1"':'')+'>＋'+esc(x[1])+'</button>'; }).join('')+'<button type="button" class="chip" data-act="mdBold"><b>粗體</b></button></div>'+
      '<textarea class="in md-ta" name="body" id="mdBody" placeholder="## 小標題&#10;- 條列一&#10;- 條列二&#10;! 要特別注意的事">'+esc(c.body||'')+'</textarea>'+
      '<div class="muted md-help">一行一件事：開頭「## 」是小標題、「### 」開一個重點框、「- 」條列、「1. 」步驟、「! 」警示；「名稱｜說明」是對照表；**兩個星號夾住**是粗體；空一行分段。</div></div>'+
    '<div class="f"><label>預覽（團員看到的樣子）</label><div class="md-prev kc" id="mdPrev">'+(mdCard(c.body)||'<div class="muted">還沒有內容</div>')+'</div></div>'+
    fld('放在哪一區',swatches('sec',TOOL_SECS.map(function(s){ return [s.id,s.name]; }),c.sec==='local'?'local':'pre'))+
    fld('圖示',swatches('icon',CARD_ICONS.map(function(k){ return [k,k]; }),ICONS[c.icon]?c.icon:'info',function(v){ return ic(v); }))+
    (id?'<div class="row"><button class="btn" data-act="tlCardMove" data-dir="-1">'+ic('up')+'往前移</button><button class="btn" data-act="tlCardMove" data-dir="1">'+ic('down')+'往後移</button></div>':''),
    foot:footBtns('tlCardSave',id?'<button class="btn dng" data-act="tlCardDel">刪除</button>':'')});
  SHEET.id=id;
}
function mdPreview(){ var ta=el('mdBody'), pv=el('mdPrev'); if(ta&&pv) pv.innerHTML=mdCard(ta.value)||'<div class="muted">還沒有內容</div>'; }
function mdInsert(txt,inline){ var ta=el('mdBody'); if(!ta) return; var s=ta.selectionStart||0, e=ta.selectionEnd||0, v=ta.value;
  var pre=(!inline&&s>0&&v.charAt(s-1)!=='\n')?'\n':''; ta.value=v.slice(0,s)+pre+txt+v.slice(e);
  var c=s+pre.length+txt.length; ta.focus(); try{ ta.setSelectionRange(c,c); }catch(x){} mdPreview(); }
function mdWrap(w){ var ta=el('mdBody'); if(!ta) return; var s=ta.selectionStart||0, e=ta.selectionEnd||0, v=ta.value, sel=v.slice(s,e);
  ta.value=v.slice(0,s)+w+sel+w+v.slice(e); ta.focus();
  try{ if(sel) ta.setSelectionRange(s,e+2*w.length); else ta.setSelectionRange(s+w.length,s+w.length); }catch(x){} mdPreview(); }
function sheetTaxi(){
  var t=tl(), tx=(t.taxi&&typeof t.taxi==='object')?t.taxi:{}, lb=tlLab();
  openSheet({title:'計程車回飯店卡',tall:true,body:
    '<div class="muted">飯店名稱、地址、電話在管理專區的「飯店資料」裡改；這裡改卡片上的句子。</div>'+
    fld('給司機看的句子（外語）',ta('fl',tx.fl))+
    fld('中文意思',inp('zh',tx.zh,'text','placeholder="例：請載我回這間飯店，謝謝！"'))+
    '<h2 class="sec">'+ic('edit')+'欄位的外語小標（選填）</h2><div class="muted" style="margin-top:-.5rem">會顯示成「外語 · 中文」，例如「HOTEL · 飯店」；留白就只顯示中文。走散卡也會用到「緊急聯絡」這一個。</div>'+
    '<div class="grid2">'+fld('飯店',inp('lab_hotel',lb.hotel,'text','placeholder="例：HOTEL"'))+fld('地址',inp('lab_addr',lb.addr,'text','placeholder="例：ADDRESS"'))+fld('飯店電話',inp('lab_phone',lb.phone,'text','placeholder="例：PHONE"'))+fld('緊急聯絡',inp('lab_call',lb.call,'text','placeholder="例：CONTACT"'))+'</div>'+
    fld('最下面的小提醒（選填）',ta('tip',tx.tip)),
    foot:footBtns('taxiSave')});
}
function sheetLang(){
  var t=tl();
  openSheet({title:'外語設定',focus:true,body:
    fld('這次用的外語',inp('lang',t.lang,'text','maxlength="8" placeholder="例：日語、泰語、英語"'))+
    fld('圖卡上的外語標示（選填）',inp('langTag',t.langTag,'text','maxlength="24" placeholder="例：日本語、ภาษาไทย、ENGLISH"'))+
    fld('「謝謝您的幫忙」的外語（選填）',inp('thanks',t.thanks,'text','maxlength="40" placeholder="例：ありがとうございます"'))+
    '<div class="muted">全螢幕圖卡上方會寫「外語標示 · 外語」，例如「ENGLISH · 英語」；走散卡、圖卡最下面會先寫外語的謝謝。</div>',
    foot:footBtns('langSave')});
}
function sheetPhCat(id){
  var cs=tlCats(), c=id?cs.filter(function(x){ return x.id===id; })[0]:{id:'',e:'',name:'',sub:''}; if(!c) return;
  var n=id?phInCat(id).length:0;
  openSheet({title:id?'編輯類別':'新增類別',focus:true,body:
    '<div class="grid2">'+fld('圖示（1 個表情符號）',inp('e',c.e,'text','maxlength="4"'))+fld('類別名稱',inp('name',c.name,'text','maxlength="8" placeholder="例：點餐與飲食"'))+'</div>'+
    fld('說明（選填）',inp('sub',c.sub,'text','maxlength="20" placeholder="例：溫水、不要香菜"'))+
    (id?'<div class="row"><button class="btn" data-act="phCatMove" data-dir="-1">'+ic('up')+'往前</button><button class="btn" data-act="phCatMove" data-dir="1">'+ic('down')+'往後</button></div>'+
      '<div class="muted">這一類有 '+n+' 句；刪除類別會連同這 '+n+' 句一起刪掉。</div>':''),
    foot:footBtns('phCatSave',id?'<button class="btn dng" data-act="phCatDel">刪除</button>':'')});
  SHEET.id=id;
}
function sheetPhrase(id,cat){
  var p=id?phById(id):{id:'',cat:cat||'',e:'',zh:'',fl:'',say:''}; if(!p) return;
  var cs=tlCats();
  openSheet({title:id?'編輯圖卡':'新增圖卡',tall:true,focus:true,body:
    fld('中文（團員看的）',inp('zh',p.zh,'text','placeholder="例：請不要放香菜"'))+
    fld('外語（給對方看的那一句）',ta('fl',p.fl))+
    fld('空耳中文（照著念，選填）',inp('say',p.say,'text','placeholder="例：新 登 糗 繞 妹"'))+
    '<div class="grid2">'+fld('圖示（1 個表情符號）',inp('e',p.e,'text','maxlength="4"'))+
      fld('類別','<select class="in" name="cat">'+cs.map(function(c){ return '<option value="'+esc(c.id)+'"'+(c.id===p.cat?' selected':'')+'>'+esc(c.name||'')+'</option>'; }).join('')+'</select>')+'</div>'+
    '<label class="ck-line"><input type="checkbox" name="lost"'+(p.lost?' checked':'')+'><span>這是<b>走散卡</b>：全螢幕時附上緊急聯絡電話，「緊急求助」頁的走散按鈕也會打開它</span></label>'+
    (id?'<div class="row"><button class="btn" data-act="phMove" data-dir="-1">'+ic('up')+'上移</button><button class="btn" data-act="phMove" data-dir="1">'+ic('down')+'下移</button></div>':''),
    foot:footBtns('phSave',id?'<button class="btn dng" data-act="phDel">刪除</button>':'')});
  SHEET.id=id;
}
/* input type=color 只吃 #RRGGBB */
function hex6(c){ c=String(c||''); if(/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase(); var m=/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c); return m?('#'+m[1]+m[1]+m[2]+m[2]+m[3]+m[3]).toLowerCase():'#9aa3b2'; }
function mnRow(n,i){ return '<div class="mn-row">'+inp('n_v_'+i,n.v||'','number','inputmode="decimal" step="any" min="0" placeholder="面額" aria-label="面額"')+
  '<input class="in" type="color" name="n_c_'+i+'" value="'+hex6(n.color)+'" aria-label="顏色">'+inp('n_t_'+i,n.note||'','text','maxlength="12" placeholder="例：藍色 ⚠" aria-label="說明"')+'</div>'; }
function moneyAddRow(n){ var box=el('sheetRoot').querySelector('.mn-rows'); if(!box||!SHEET||SHEET.mn>=16) return; box.insertAdjacentHTML('beforeend',mnRow(n||{},SHEET.mn)); SHEET.mn++; }
/* 按常用貨幣：整張表單換成那一種（還沒按儲存都不算數） */
function moneyFill(p){ var R=el('sheetRoot'); function set(n,v){ var e=R.querySelector('[name="'+n+'"]'); if(e) e.value=(v==null?'':v); }
  set('m_name',p.name); set('m_unit',p.unit); set('m_dir',p.dir==='twd'?'twd':'fx'); set('m_rate',p.rate); set('m_warn',p.warn||'');
  var box=R.querySelector('.mn-rows'); if(!box) return; box.innerHTML=''; SHEET.mn=0; (p.notes||[]).forEach(function(n){ moneyAddRow(n); }); moneyAddRow({}); }
function sheetMoney(){
  var m=tlMoney(), ns=(Array.isArray(m.notes)?m.notes:[]).filter(Boolean);
  openSheet({title:'外幣設定',tall:true,body:
    '<div class="f"><label>快速帶入常用貨幣</label><div class="chips">'+MONEY_PRESETS.map(function(p){ return '<button type="button" class="chip pick" data-act="moneyPreset" data-id="'+p.id+'">'+esc(p.name)+'</button>'; }).join('')+'</div>'+
      '<div class="muted" style="margin-top:.3rem">匯率與鈔票顏色都是約略值，帶入後請對照出發前的匯率再改。</div></div>'+
    '<div class="grid2">'+fld('貨幣名稱',inp('m_name',m.name,'text','maxlength="10" placeholder="例：日圓"'))+fld('顯示單位',inp('m_unit',m.unit,'text','maxlength="4" placeholder="例：盾、日圓"'))+'</div>'+
    fld('匯率','<div class="rate-row"><select class="in" name="m_dir"><option value="fx"'+(m.dir!=='twd'?' selected':'')+'>1 台幣 ≈ 幾外幣</option><option value="twd"'+(m.dir==='twd'?' selected':'')+'>1 外幣 ≈ 幾台幣</option></select>'+
      inp('m_rate',m.rate||'','number','inputmode="decimal" step="any" min="0" placeholder="例：0.21" aria-label="匯率"')+'</div>'+
      '<div class="muted" style="margin-top:.3rem">數字很大的貨幣（越南盾、韓元、印尼盾）選「1 台幣 ≈ 幾外幣」比較好填。</div>')+
    '<div class="f"><label>面額、顏色、說明（存檔時大的排上面）</label><div class="mn-rows"></div><button type="button" class="btn sm" data-act="moneyRow">'+ic('plus')+'再加一種</button></div>'+
    fld('提醒文字（選填，**兩個星號**夾住是粗體）',ta('m_warn',m.warn)),
    foot:footBtns('moneySave',(m.name||ns.length)?'<button class="btn dng" data-act="moneyWipe">清空外幣</button>':'')});
  SHEET.mn=0; ns.forEach(function(n){ moneyAddRow(n); }); var k=Math.max(2,4-ns.length); while(k--) moneyAddRow({});
}
function sheetSOS(){
  var st=S().settings, ls=tlArr('sos').filter(function(x){ return x&&(x.name||x.phone); }).map(clone);
  /* 3.22 以前的駐外館處電話在團務設定裡：第一次打開就帶進來，存檔後改放這裡 */
  if(st.embassyPhone&&!ls.some(function(x){ return x.phone===st.embassyPhone; })) ls.push({name:'駐外館處',sub:'急難救助專線',phone:st.embassyPhone});
  var n=Math.min(12,Math.max(ls.length+2,4)); while(ls.length<n) ls.push({name:'',sub:'',phone:''});
  openSheet({title:'當地與官方專線',tall:true,body:
    '<div class="muted">填當地的報警、救護車、消防，以及駐外館處的急難救助電話。整列留白就不會顯示；外交部急難救助專線固定列在最後。</div>'+
    ls.map(function(x,i){ return '<div class="f sos-ed"><div class="grid2">'+inp('s_name_'+i,x.name,'text','placeholder="名稱，例：報警"')+inp('s_phone_'+i,x.phone,'tel','placeholder="電話，例：110"')+'</div>'+inp('s_sub_'+i,x.sub,'text','placeholder="說明（選填），例：24 小時"')+'</div>'; }).join(''),
    foot:footBtns('sosSave')});
  SHEET.n=ls.length;
}
/* 清空工具頁的一區：quick＝現場馬上用、phrases＝全部圖卡、pre／local＝知識小卡那兩區 */
function sheetTlClear(sec){
  var L=[], name='';
  if(sec==='quick'){ name='現場馬上用';
    L=['計程車回飯店卡的句子與外語小標','外幣設定'+(tlMoney().name?'（'+tlMoney().name+'）':''),'外語圖卡 '+tlPhrases().length+' 句、類別 '+tlCats().length+' 個','當地與官方專線 '+tlArr('sos').length+' 筆','外語名稱與「謝謝」的說法']; }
  else if(sec==='phrases'){ name='外語圖卡'; L=['外語圖卡 '+tlPhrases().length+' 句','類別 '+tlCats().length+' 個']; }
  else { var s=TOOL_SECS.filter(function(x){ return x.id===sec; })[0]; if(!s) return; name=s.name; L=tlCards(sec).map(function(c){ return c.title||'（沒有標題）'; }); }
  openSheet({title:'清空「'+esc(name)+'」',body:
    '<div class="warn-box dng-box">'+ic('alert')+'<span>清空後，<b>全團手機</b>的工具頁都會同步少掉這些內容。</span></div>'+
    '<div><b>會清空</b><ul class="dots clr-list">'+L.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul></div>'+
    (sec==='quick'?'<div class="muted">「緊急求助」頁會留著：緊急聯絡人（在團務設定）與外交部急難救助專線不受影響。</div>':'')+
    '<div class="bk-note">'+ic('history')+'<span>清空前會在這支手機<b>自動留一份</b>；按錯了，到「管理專區 → 還原上一版」救回來。</span></div>',
    foot:'<button class="btn" data-act="sheetClose">取消</button><button class="btn dng" data-act="tlClearGo" data-sec="'+esc(sec)+'">'+ic('trash')+'確定清空</button>'});
}
function sheetTpl(){
  openSheet({title:'工具頁範本',body:
    '<div class="muted">把工具頁的內容<b>整個換成</b>下面其中一套：外語圖卡、外幣、計程車卡、當地電話，以及「出發前先看」「在地小知識」的小卡。行程、名單、記事本、時區都不受影響。</div>'+
    '<div class="stack" style="margin-top:.6rem">'+Object.keys(TPL).map(function(k){ var x=TPL[k], t=x.tools;
      return '<div class="bk-row"><div class="bk-t"><b>'+esc(x.name)+'</b><div class="muted">'+esc(x.desc)+'</div><div class="muted">知識小卡 '+t.cards.length+' 張、外語圖卡 '+t.phrases.length+' 句</div></div><button class="btn sm pri" data-act="tplGo" data-id="'+k+'">套用</button></div>'; }).join('')+'</div>'+
    '<div class="bk-note">'+ic('history')+'<span>套用前會在這支手機自動留一份目前的內容，到「管理專區 → 還原上一版」可以換回來。</span></div>'});
}

/* v3.24 推播通知（預留，關閉中）
   小麥決定：成本考量，先不做推播；管理專區只預留畫面——總開關與各情境開關一律灰色、不能按，欄位也停用。
   這支測試確認「預留」真的只是畫面：
   - 只有主辦人（管理模式）看得到入口；團員不行，直接呼叫也打不開
   - 每一個開關都是停用、關閉狀態、灰色，沒有綁任何動作；每個欄位都停用
   - 怎麼按都不會改資料、不進佇列、不存進手機、不跳出「允許通知」、不建立推播訂閱
   - 程式裡沒有任何推播的實作（沒有 pushManager、requestPermission、showNotification，Service Worker 沒有 push 事件）
   - 說明寫明「成本考量」「目前關閉中」；320px 特大字、深色都不撐破，字夠大、對比夠
   用法：node audit/pushui.js [--shots] */
const {chromium,FILE,at}=require('./_lib');
const fs=require('fs');
const SHOTS=process.argv.includes('--shots');
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x).slice(0,300));} else console.log('  ✓',n); };
const T0=new Date('2026-09-20T10:00:00+08:00');
/* 偵測有沒有人去要通知權限、去建立推播訂閱（頁面載入前就裝好） */
const SPY=()=>{
  window.__spy={perm:0,sub:0,show:0};
  try{ if(window.Notification){ var rp=Notification.requestPermission; Notification.requestPermission=function(){ __spy.perm++; return rp.apply(this,arguments); }; } }catch(e){}
  try{ if(window.PushManager){ var sb=PushManager.prototype.subscribe; PushManager.prototype.subscribe=function(){ __spy.sub++; return sb.apply(this,arguments); }; } }catch(e){}
  try{ if(window.ServiceWorkerRegistration){ var sn=ServiceWorkerRegistration.prototype.showNotification; ServiceWorkerRegistration.prototype.showNotification=function(){ __spy.show++; return sn.apply(this,arguments); }; } }catch(e){}
};
/* WCAG 對比：文字色 vs 背景色（背景取往上第一個不透明的） */
const CONTRAST=()=>{
  function rgb(s){ var m=/rgba?\(([^)]+)\)/.exec(s); if(!m) return null; var a=m[1].split(',').map(function(x){ return parseFloat(x); }); return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}; }
  function lum(c){ function f(v){ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); } return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); }
  function bg(el){ for(var e=el;e;e=e.parentElement){ var c=rgb(getComputedStyle(e).backgroundColor); if(c&&c.a>=0.99) return c; } return {r:255,g:255,b:255,a:1}; }
  window.contrastOf=function(el){ var fg=rgb(getComputedStyle(el).color), b=bg(el), l1=lum(fg), l2=lum(b); return Math.round((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)*100)/100; };
};
async function open(b,opt){
  const ctx=await b.newContext(Object.assign({viewport:{width:375,height:740}},opt||{}));
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.addInitScript(SPY); await p.addInitScript(CONTRAST);
  await p.clock.install({time:T0}); await p.goto(FILE); await p.waitForTimeout(400);
  return {ctx,p,errs};
}
(async()=>{
  const b=await chromium.launch();

  console.log('\n[1] 入口：只有主辦人看得到');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.tab='tools'; P.tool='menu'; P.leader=false; render();
      o.guestBtn=!!document.querySelector('[data-act="pushInfo"]'); o.guestText=/推播|通知/.test(document.getElementById('view').innerText.replace(/提醒記事本|通知團員/g,''));
      ACT.pushInfo(); await new Promise(r=>setTimeout(r,50)); o.guestSheet=!!document.querySelector('.sheet');
      P.leader=true; render(); var btn=document.querySelector('[data-act="pushInfo"]');
      o.leaderBtn=!!btn; o.leaderText=btn?btn.innerText.replace(/\s+/g,' '):'';
      o.inAdmin=btn?btn.closest('.stack')===[].filter.call(document.querySelectorAll('h2.sec'),function(h){ return /管理專區/.test(h.textContent); })[0].nextElementSibling:false;
      return o; });
    ck('團員的工具頁沒有推播的入口，文字裡也沒提',!r.guestBtn&&!r.guestText,r);
    ck('團員直接呼叫也打不開表單',!r.guestSheet,r);
    ck('主辦人在管理專區看得到「推播通知」，並寫「目前關閉中（成本考量）」',r.leaderBtn&&r.inAdmin&&/推播通知/.test(r.leaderText)&&/關閉中/.test(r.leaderText)&&/成本考量/.test(r.leaderText),r);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[2] 表單：說明、開關、欄位');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.leader=true; P.tab='tools'; P.tool='menu'; render();
      document.querySelector('[data-act="pushInfo"]').click(); await new Promise(r=>setTimeout(r,80));
      var sh=document.querySelector('.sheet'); o.open=!!sh; o.title=(document.getElementById('sheetTitle')||{}).textContent;
      o.text=sh?sh.innerText:'';
      var tg=[].slice.call(document.querySelectorAll('#sheetRoot button.tgl'));
      o.n=tg.length;
      o.allOff=tg.every(function(t){ return t.disabled&&t.getAttribute('aria-checked')==='false'&&t.getAttribute('aria-disabled')==='true'&&t.getAttribute('role')==='switch'&&!t.classList.contains('on'); });
      /* 表單外層的背景遮罩本來就有 data-act（點背景關閉），只檢查「開關 → 表單本體」之間 */
      o.noAct=tg.every(function(t){ for(var e=t;e&&!e.classList.contains('sheet');e=e.parentElement){ if(e.hasAttribute('data-act')) return false; } return true; });
      o.grey=tg.map(function(t){ return +getComputedStyle(t).opacity; });
      o.names=[].map.call(document.querySelectorAll('#sheetRoot .pu-t>b'),function(e){ return e.textContent; });
      o.labels=tg.map(function(t){ return t.getAttribute('aria-label'); });
      o.pill=(document.querySelector('#sheetRoot .pu-off')||{}).textContent;
      var fl=[].slice.call(document.querySelectorAll('#sheetRoot input,#sheetRoot select,#sheetRoot textarea'));
      o.fields=fl.length; o.fieldsOff=fl.every(function(f){ return f.disabled; });
      o.types=PUSH_TYPES.map(function(t){ return t.id; }).join();
      o.foot=[].map.call(document.querySelectorAll('#sheetRoot .sheet-f button'),function(x){ return x.textContent.trim(); });
      return o; });
    ck('表單打得開，標題「推播通知」',r.open&&r.title==='推播通知',r);
    ck('說明寫明「成本考量」「目前關閉中」，並說現在不會傳送任何通知',/成本考量/.test(r.text)&&/目前關閉中/.test(r.text)&&/不會傳送任何通知/.test(r.text),r.text.slice(0,120));
    ck('六種情境：廣播更新、集合倒數、下一站提醒、每日早安摘要、明早時程、出發前提醒',r.types==='bc,cd,next,day,morn,pre'&&r.names.join()==='推播通知（總開關）,廣播更新,集合倒數,下一站提醒,每日早安摘要,明早時程,出發前提醒',r);
    ck('共 7 個開關（總開關＋6 種情境）',r.n===7,r.n);
    ck('每個開關都是：停用、aria-disabled、aria-checked=false、role=switch、沒有 on',r.allOff,r);
    ck('沒有任何開關綁動作（沒有 data-act，外層也沒有）',r.noAct,r);
    ck('開關是灰色的（不透明度 < 1）',r.grey.every(o=>o<1),r.grey);
    ck('每個開關的朗讀名稱都寫「目前關閉中」',r.labels.every(l=>/目前關閉中/.test(l)),r.labels);
    ck('總開關旁有「關閉中」標籤',r.pill==='關閉中',r.pill);
    ck('有預留欄位（提前分鐘、摘要時間、發送服務網址），全部停用',r.fields>=4&&r.fieldsOff,r);
    ck('只有一顆「知道了」關閉鍵',r.foot.join()==='知道了',r.foot);
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    ck('按 Esc 關得掉',await p.evaluate(()=>!document.querySelector('.sheet')));
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[3] 怎麼按都不會動到資料');
  { const {ctx,p,errs}=await open(b);
    const r=await p.evaluate(async()=>{ var o={};
      P.leader=true; P.tab='tools'; P.tool='menu'; render(); ACT.pushInfo(); await new Promise(r=>setTimeout(r,80));
      var snap=function(){ return JSON.stringify(Store.s)+'|'+Store.q.length+'|'+localStorage.getItem('sapa-data')+'|'+localStorage.getItem('sapa-prefs'); };
      var before=snap();
      /* 真人點不到停用的按鈕；這裡連「硬點」也試：click、冒泡的 click、點整列、點標籤 */
      document.querySelectorAll('#sheetRoot button.tgl').forEach(function(t){ t.click(); t.dispatchEvent(new MouseEvent('click',{bubbles:true})); t.closest('.pu-row').click(); t.closest('.pu-row').querySelector('b').click(); });
      document.querySelectorAll('#sheetRoot input,#sheetRoot select').forEach(function(f){ f.click(); f.dispatchEvent(new Event('input',{bubbles:true})); f.dispatchEvent(new Event('change',{bubbles:true})); });
      await new Promise(r=>setTimeout(r,120));
      o.same=snap()===before; o.stillOpen=!!document.querySelector('.sheet'); o.hasPush=('push' in Store.s.settings)||('pushUrl' in Store.s.settings);
      o.allOff=[].every.call(document.querySelectorAll('#sheetRoot button.tgl'),function(t){ return !t.classList.contains('on'); });
      o.spy=JSON.stringify(window.__spy); return o; });
    ck('資料、佇列、手機裡的存檔都沒變',r.same,r);
    ck('設定裡沒有多出 push、pushUrl 之類的欄位',!r.hasPush,r);
    ck('開關還是全關、表單還開著',r.allOff&&r.stillOpen,r);
    ck('沒有要求通知權限、沒有建立推播訂閱、沒有顯示通知',r.spy==='{"perm":0,"sub":0,"show":0}',r.spy);
    ck('沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  console.log('\n[4] 程式裡沒有推播的實作');
  { const html=fs.readFileSync(at('standalone.html'),'utf8'), sw=fs.readFileSync(at('sw.js'),'utf8');
    for(const w of ['pushManager','requestPermission','showNotification','PushManager','getSubscription']) ck('網頁程式沒有 '+w,html.indexOf(w)<0);
    ck("Service Worker 沒有 push 事件、notificationclick",!/addEventListener\(\s*['"](push|notificationclick|pushsubscriptionchange)['"]/.test(sw));
    ck('manifest 沒有 gcm_sender_id 這類推播設定',!/gcm_sender_id|"push"/.test(fs.readFileSync(at('manifest.webmanifest'),'utf8')));
    ck('沒有多出發送端的檔案（push/、functions/、worker）',!['push','functions','worker'].some(d=>fs.existsSync(at(d))));
  }

  console.log('\n[5] 版面、字級、對比、用詞（320px 特大字／標準字、淺色／深色）');
  for(const [fsz,dark] of [['xl',false],['md',false],['xl',true],['md',true]]){
    const {ctx,p,errs}=await open(b,{viewport:{width:320,height:568},colorScheme:dark?'dark':'light'});
    const r=await p.evaluate(async([f,d])=>{ P.fs=f; P.theme=d?'dark':'light'; P.leader=true; P.tab='tools'; P.tool='menu'; render();
      var o={}; o.menuOv=document.documentElement.scrollWidth>document.documentElement.clientWidth;
      var mb=document.querySelector('[data-act="pushInfo"]'); o.menuClip=mb.scrollWidth>mb.clientWidth+1;
      ACT.pushInfo(); await new Promise(r=>setTimeout(r,120));
      var sh=document.querySelector('.sheet'), body=document.querySelector('.sheet-b');
      o.sheetOv=sh.scrollWidth>sh.clientWidth+1; o.bodyOv=body.scrollWidth>body.clientWidth+1;
      o.clipped=[].slice.call(sh.querySelectorAll('.btn')).filter(function(x){ return x.scrollWidth>x.clientWidth+1; }).length;
      var small=[].slice.call(sh.querySelectorAll('.pu-t>small,.pu-off,.muted,.bk-note,label')); 
      o.minFont=Math.min.apply(null,small.map(function(e){ return parseFloat(getComputedStyle(e).fontSize); }));
      o.contrast=small.map(function(e){ return {t:e.textContent.trim().slice(0,10),c:contrastOf(e)}; }).filter(function(x){ return x.c<4.5; });
      o.word=/領隊|導遊/.test(sh.innerText); o.spy=JSON.stringify(window.__spy);
      return o; },[fsz,dark]);
    const tag=`${fsz}/${dark?'dark':'light'}`;
    ck(tag+'：工具頁與表單沒有橫向溢出、按鈕字沒被切',!r.menuOv&&!r.menuClip&&!r.sheetOv&&!r.bodyOv&&!r.clipped,r);
    ck(tag+'：小字不小於 12px、對比都達 4.5:1',r.minFont>=12&&!r.contrast.length,{minFont:r.minFont,low:r.contrast});
    ck(tag+'：沒有「領隊」「導遊」',!r.word,r);
    if(SHOTS) await p.screenshot({path:at(`shots/push-${fsz}${dark?'-dark':''}.png`)});
    ck(tag+'：沒有 JS 錯誤',!errs.length,errs);
    await ctx.close(); }

  await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

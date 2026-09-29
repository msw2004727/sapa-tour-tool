/* Firebase 規則驗證（v3.22）：用官方模擬器實際寫入，確認 firebase.rules.json 該擋的擋、該過的過。
   ─────────────────────────────────────────────────────────────
   不在 npm test 裡：需要 Java 11 以上與 Firebase 模擬器。改規則之前／之後手動跑：
     npx firebase-tools@15 emulators:exec --only database --project demo-sapa "node audit/fbrules.js"
   或自己先開好模擬器（預設 127.0.0.1:9000，可用 FIREBASE_DATABASE_EMULATOR_HOST 指定）再跑 npm run test:rules。
   ─────────────────────────────────────────────────────────────
   為什麼要用模擬器：Firebase 主控台的「規則模擬工具」做 set 時會把資料合併進現有資料再判斷，
   「整份存檔少了 items」這類情況會誤判成通過（改版日誌第八節）。模擬器是真的寫入，判斷才準。
   只會寫進模擬器（本機），碰不到正式資料庫。 */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.resolve(__dirname,'..');
const HOST=process.env.FIREBASE_DATABASE_EMULATOR_HOST||'127.0.0.1:9000';
const BASE='http://'+HOST.replace(/^https?:\/\//,'');
if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)){ console.log('只准連本機模擬器，現在是 '+BASE); process.exit(2); }
/* v3.18～v3.21 的正式規則（2026-09-22 生效）。拿來證明「還沒貼新規則就按清空」會整批被擋、什麼都不動 */
const OLD_RULES=JSON.stringify({rules:{trip:{'.read':true,
  '$doc':{'.write':'newData.exists()','.validate':"newData.hasChildren() && newData.child('_ts').isNumber()"},
  members:{'.write':'newData.exists()','.validate':"newData.hasChildren() && newData.child('_ts').isNumber() && newData.child('items').child('0').exists()"},
  itinerary:{'.write':'newData.exists()','.validate':"newData.hasChildren() && newData.child('_ts').isNumber() && newData.child('items').child('0').exists()"}},
  '$other':{'.read':false,'.write':false}}});
const NEW_RULES=fs.readFileSync(path.join(ROOT,'firebase.rules.json'),'utf8');
const ctx={}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'src/03-data.js'),'utf8')+fs.readFileSync(path.join(ROOT,'src/03b-seed.js'),'utf8')+';this.DEFAULTS=DEFAULTS;this.DOC_KEYS=DOC_KEYS;',ctx);
const J=o=>JSON.parse(JSON.stringify(o));
/* owner=true：用管理者身分（跳過規則）準備資料；false：一般未登入連線，照規則判斷 */
async function req(ns,method,p,body,owner){
  const r=await fetch(`${BASE}/${p}.json?ns=${ns}`,{method,headers:owner?{Authorization:'Bearer owner'}:{},body:body===undefined?undefined:JSON.stringify(body)});
  const t=await r.text(); let b=null; try{ b=JSON.parse(t); }catch(e){ b=t; } return {ok:r.status===200,status:r.status,body:b}; }
async function setRules(ns,text){ const r=await fetch(`${BASE}/.settings/rules.json?ns=${ns}`,{method:'PUT',headers:{Authorization:'Bearer owner'},body:text}); if(r.status!==200) throw new Error('規則載入失敗 '+r.status+' '+await r.text()); }
function seed(){ const T=Date.now()-60000, d=J(ctx.DEFAULTS); ctx.DOC_KEYS.forEach(k=>{ d[k]._ts=T; });
  d.photos.items={d1a:{src:'data:image/webp;base64,AAAA',op:9,kb:1}}; d.settings.pinHash='abc'; delete d.settings.pin; return d; }
const reset=ns=>req(ns,'PUT','',{trip:seed()},true);
const cnt=async(ns,k)=>{ const r=await req(ns,'GET','trip/'+k,undefined,true); const it=r.body&&r.body.items; return it?Object.keys(it).length:0; };
/* App 的「一鍵清空」送出的那一筆：8 份文件換成空殼＋一份備份 */
function clearBody(T,snap){ const u={}; ctx.DOC_KEYS.forEach(k=>{ u['trip/'+k]={_ts:T,_cleared:T}; }); u['trip/settings'].pinHash='abc'; u['trip/settings'].minVersion='3.22';
  u['backups/trip/b'+T]={at:T,reason:'clear',ver:'3.22',docs:snap}; return u; }
let fails=0; const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x).slice(0,200));} else console.log('  ✓',n); };

(async()=>{
  try{ await fetch(BASE+'/.json?ns=ping'); }catch(e){ console.log('連不到 Firebase 模擬器（'+BASE+'）。用法見檔案開頭的說明。'); process.exit(2); }
  const OLD='old'+Date.now(), NEW='new'+Date.now();
  await setRules(OLD,OLD_RULES); await setRules(NEW,NEW_RULES);

  console.log('【v3.21 以前的規則：還沒換規則就按清空】');
  await reset(OLD); const snap=seed();
  ck('前提：名單 33 人、行程 30 站',await cnt(OLD,'members')===33&&await cnt(OLD,'itinerary')===30);
  let r=await req(OLD,'PATCH','',clearBody(Date.now(),snap));
  ck('一鍵清空（整批）被擋',!r.ok,r);
  ck('被擋之後名單仍是 33 人（全有全無，沒有清掉一半）',await cnt(OLD,'members')===33);
  ck('被擋之後分組、記事本也沒被動',await req(OLD,'GET','trip/groups/scenarios',undefined,true).then(x=>Array.isArray(x.body)&&x.body.length===3)&&await req(OLD,'GET','trip/notebook/pages',undefined,true).then(x=>Array.isArray(x.body)&&x.body.length===5));
  ck('被擋之後備份區也沒有寫進東西',await req(OLD,'GET','backups',undefined,true).then(x=>x.body===null));

  console.log('【firebase.rules.json（目前 repo 裡的版本）】');
  await reset(NEW);
  const T=Date.now(); r=await req(NEW,'PATCH','',clearBody(T,snap));
  ck('一鍵清空（整批）通過',r.ok,r);
  const m=await req(NEW,'GET','trip/members',undefined,true), it=await req(NEW,'GET','trip/itinerary',undefined,true);
  ck('清空後名單只剩 _ts 與 _cleared',JSON.stringify(m.body)===JSON.stringify({_cleared:T,_ts:T}),m.body);
  ck('清空後行程只剩 _ts 與 _cleared',JSON.stringify(it.body)===JSON.stringify({_cleared:T,_ts:T}),it.body);
  const bk=await req(NEW,'GET','backups/trip');
  ck('備份寫進 backups/trip，一般連線讀得到',bk.ok&&bk.body&&bk.body['b'+T]&&Object.keys(bk.body['b'+T].docs.members.items).length===33,bk.status);
  r=await req(NEW,'PATCH','',{'trip/members/items/5/room':'609','trip/members/_ts':Date.now()});
  ck('清空後舊手機補寫半筆團員資料 → 被擋',!r.ok,r);
  r=await req(NEW,'PUT','trip/members',{_ts:Date.now(),_cleared:T,items:{3:{id:'x'}}});
  ck('帶標記但名單從第 4 筆開始（沒有第 1 筆）→ 被擋',!r.ok,r);
  ck('清空後新增第一位團員（整份存檔）→ 通過',(await req(NEW,'PUT','trip/members',{_ts:Date.now(),items:[{id:'n1',name:'新團員'}]})).ok);
  await req(NEW,'PUT','trip/itinerary',{_ts:Date.now(),_cleared:T});
  ck('清空後新增第一站（局部寫入並拿掉標記）→ 通過',(await req(NEW,'PATCH','',{'trip/itinerary/items/0':{id:'i1',day:1,title:'新行程'},'trip/itinerary/_ts':Date.now(),'trip/itinerary/_cleared':null})).ok);
  await reset(NEW);
  ck('沒有標記、存成空名單 → 仍被擋（防誤刪保護還在）',!(await req(NEW,'PUT','trip/members',{_ts:Date.now(),items:[]})).ok);
  ck('沒有標記、把整個名單清單刪掉 → 仍被擋',!(await req(NEW,'PATCH','',{'trip/members/items':null,'trip/members/_ts':Date.now()})).ok);
  ck('標記不是數字 → 被擋',!(await req(NEW,'PUT','trip/itinerary',{_ts:Date.now(),_cleared:'yes'})).ok);
  ck('整份刪除名單 → 仍被擋',!(await req(NEW,'DELETE','trip/members')).ok);
  ck('一次覆寫整個團 → 仍被擋',!(await req(NEW,'PUT','trip',seed())).ok);
  ck('寫到 trip／backups 以外 → 仍被擋',!(await req(NEW,'PUT','other/x',{a:1})).ok);
  ck('一般點名寫入 → 通過',(await req(NEW,'PATCH','',{'trip/rollcall/present/m01':true,'trip/rollcall/_ts':Date.now()})).ok);
  ck('廣播整份存檔 → 通過',(await req(NEW,'PUT','trip/broadcast',{_ts:Date.now(),time:'15:30',location:'飯店大廳'})).ok);
  ck('單一團員局部修改 → 通過',(await req(NEW,'PATCH','',{'trip/members/items/0/room':'301','trip/members/_ts':Date.now()})).ok);
  ck('寫一份格式正確的備份 → 通過',(await req(NEW,'PUT','backups/trip/b2',{at:1,reason:'clear',docs:{a:1}})).ok);
  ck('刪掉最舊的備份（自動淘汰）→ 通過',(await req(NEW,'DELETE','backups/trip/b2')).ok);
  ck('格式不對的備份（沒有 at/docs）→ 被擋',!(await req(NEW,'PUT','backups/trip/b3',{foo:1})).ok);
  ck('備份的 at 不是數字 → 被擋',!(await req(NEW,'PUT','backups/trip/b4',{at:'x',docs:{a:1}})).ok);
  const T2=Date.now(), u={}; ctx.DOC_KEYS.forEach(k=>{ u['trip/'+k]=Object.assign(J(snap[k]),{_ts:T2}); }); u['backups/trip/b'+T2]={at:T2,reason:'restore',docs:{settings:{_ts:1}}};
  await req(NEW,'PATCH','',clearBody(Date.now(),snap)); r=await req(NEW,'PATCH','',u);
  ck('從空殼整批還原 33 人／30 站 → 通過',r.ok&&await cnt(NEW,'members')===33&&await cnt(NEW,'itinerary')===30,r);

  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

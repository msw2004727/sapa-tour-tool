/* v3.25 分組新格式在 Firebase 上的行為：陣列裡的空字串、指派值 0、局部寫入 scenarios/N/assign/<團員>、settings/airMig、20 組的情境。
   ─────────────────────────────────────────────────────────────
   不在 npm test 裡：需要 Java 11 以上與 Firebase 模擬器（跟 audit/fbrules.js 一樣）。做法二選一：
     npx firebase-tools@15 emulators:exec --only database --project demo-sapa "node audit/fbgroups.js"
   或自己先開好模擬器（預設 127.0.0.1:9000，可用 FIREBASE_DATABASE_EMULATOR_HOST 指定）再 node audit/fbgroups.js。
   （這個環境裡 firebase-tools 的 emulators:exec 會被代理擋住，直接用 java -jar ~/.cache/firebase/emulators/firebase-database-emulator-v*.jar --port 9000 開就行。）
   只會寫進模擬器（本機），碰不到正式資料庫。
   實測結果（v3.25）：空字串會保留、陣列還是陣列；全部沒分組時的空 assign 會被拿掉（程式讀的時候當作沒有）；數字 0 保留。 */
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname,'..');
const BASE='http://'+(process.env.FIREBASE_DATABASE_EMULATOR_HOST||'127.0.0.1:9000');
const NS='demo-sapa-grp';
if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)){ console.log('只准連本機模擬器，現在是 '+BASE); process.exit(2); }
async function req(method,p,body,owner){ const r=await fetch(`${BASE}/${p}.json?ns=${NS}`,{method,headers:owner?{Authorization:'Bearer owner'}:{},body:body===undefined?undefined:JSON.stringify(body)}); const t=await r.text(); let b=null; try{ b=JSON.parse(t); }catch(e){ b=t; } return {status:r.status,body:b}; }
let fails=0; const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x).slice(0,300));} else console.log('  ✓',n); };
(async()=>{
  const rules=fs.readFileSync(path.join(ROOT,'firebase.rules.json'),'utf8');
  let r=await fetch(`${BASE}/.settings/rules.json?ns=${NS}`,{method:'PUT',headers:{Authorization:'Bearer owner'},body:rules}); ck('規則載入',r.status===200);
  const T=Date.now();
  const doc={_ts:T,activeId:'meal',scenarios:[
    {id:'meal',name:'用餐分桌',count:4,names:['第 1 桌','第 2 桌','第 3 桌','第 4 桌'],assign:{m01:0,m02:0,m10:1},cat:'meal',useTags:1,notes:['靠窗','','',''],time:'18:30',place:'山城餐廳'},
    {id:'air',name:'航班',cat:'transport',card:1,count:2,names:['長榮航空','中華航空'],shorts:['長榮','華航'],notes:['桃園第二航廈','桃園第一航廈'],times:['09:00','08:20'],backs:['12:05','11:30'],assign:{m01:0,m02:1}},
    {id:'shop',name:'夜市',cat:'shop',count:2,names:['第 1 隊','第 2 隊'],times:['20:30',''],notes:['','廣場'],assign:{}}
  ]};
  r=await req('PUT','trip/groups',doc,false); ck('整份 groups 寫入（一般連線、照規則）',r.status===200,r);
  r=await req('GET','trip/groups',undefined,true); const g=r.body;
  ck('陣列還是陣列、空字串還在（沒被 Firebase 拿掉）',Array.isArray(g.scenarios)&&Array.isArray(g.scenarios[0].notes)&&g.scenarios[0].notes.length===4&&g.scenarios[0].notes[1]===''&&g.scenarios[2].times[1]==='',JSON.stringify(g.scenarios[0].notes)+' '+JSON.stringify(g.scenarios[2].times));
  ck('空的 assign 被拿掉（讀回來是 undefined，程式要能吃）',g.scenarios[2].assign===undefined,g.scenarios[2].assign);
  ck('指派值 0 保留（不是 null）',g.scenarios[0].assign.m01===0&&g.scenarios[1].assign.m01===0,g.scenarios[0].assign);
  /* 局部寫入：跟 App 的 pushOp 一樣，用 update 帶多個路徑（同時更新 _ts） */
  r=await req('PATCH','trip',{'groups/scenarios/1/assign/m26':0,'groups/_ts':T+1},false); ck('局部寫入 scenarios/1/assign/m26=0',r.status===200,r);
  r=await req('PATCH','trip',{'groups/scenarios/1/assign/m26':null,'groups/_ts':T+2},false); ck('局部拿掉（移出分組 = null）',r.status===200,r);
  r=await req('GET','trip/groups/scenarios/1/assign',undefined,true); ck('m26 已移除、其他人還在',r.body.m26===undefined&&r.body.m01===0&&r.body.m02===1,r.body);
  /* 搬家記號：settings/airMig（局部寫入 settings） */
  await req('PUT','trip/settings',{_ts:T,tripName:'x',pinHash:'abc'},true);
  r=await req('PATCH','trip',{'settings/airMig':1,'settings/_ts':T+3},false); ck('settings/airMig=1 可以寫',r.status===200,r);
  /* 整份 groups 少了 _ts 仍要被擋（規則沒變） */
  const bad=JSON.parse(JSON.stringify(doc)); delete bad._ts; r=await req('PUT','trip/groups',bad,false); ck('沒有 _ts 的 groups 仍被擋',r.status!==200,r.status);
  /* 20 組、每組 5 個欄位的大情境也寫得進去 */
  const big={id:'big',name:'大',cat:'mate',count:20,names:[],leaders:[],notes:[],assign:{}}; for(let i=0;i<20;i++){ big.names.push('第 '+(i+1)+' 組'); big.leaders.push(i%2?'':'團員'+i); big.notes.push(''); }
  const d2=JSON.parse(JSON.stringify(doc)); d2.scenarios.push(big); d2._ts=T+4; r=await req('PUT','trip/groups',d2,false); ck('20 組的旅伴情境寫入',r.status===200,r);
  r=await req('GET','trip/groups/scenarios/3',undefined,true); ck('讀回 20 組、組長陣列有洞也還是 20 長度',r.body.names.length===20&&r.body.leaders.length===20&&r.body.leaders[1]==='',JSON.stringify(r.body.leaders).slice(0,80));
  console.log(fails?`\n${fails} 個問題`:'\n全部通過'); process.exit(fails?1:0);
})();

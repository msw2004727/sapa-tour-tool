const {chromium,FILE,at}=require('./_lib');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:375,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(FILE);await p.waitForTimeout(600);
const r=await p.evaluate(async()=>{
  const out={};
  // 模擬雲端：push 一律失敗（離線）
  let fail=true; const remote={};
  Store.push=true; Store.pushOp=op=>fail?Promise.reject(new Error('offline')):new Promise(res=>{ if(op.path){ remote[op.key]=remote[op.key]||{}; setPath(remote[op.key],op.path,op.val); remote[op.key]._ts=op.ts; } else remote[op.key]=clone(op.val); res(); });
  P.leader=true;
  // 1) 離線改廣播
  S().broadcast.location='纜車站門口'; S().broadcast.time='15:30'; Store.save('broadcast');
  await new Promise(r=>setTimeout(r,500));
  out.q1=Store.q.length; out.mode1=Store.mode;
  // 2) 離線點名兩個人（局部）
  const ids=members().slice(0,2).map(m=>m.id);
  Store.savePath('rollcall','present/'+ids[0],true); Store.savePath('rollcall','present/'+ids[1],true);
  await new Promise(r=>setTimeout(r,500));
  out.q2=Store.q.length;
  // 3) 雲端送來舊快照（廣播空、點名空、且另一位管理者把第 3 人點到）
  const stale=clone(DEFAULTS); stale.broadcast._ts=1; stale.rollcall={present:{},_ts:1}; stale.rollcall.present[members()[2].id]=true;
  Store.applyRemote(stale);
  out.locAfterStale=S().broadcast.location; out.present=Object.keys(S().rollcall.present||{}).length; out.q3=Store.q.length;
  // 4) 重新連線 → flush
  fail=false; Store.flush(); await new Promise(r=>setTimeout(r,800));
  out.q4=Store.q.length; out.mode4=Store.mode; out.remoteLoc=remote.broadcast&&remote.broadcast.location; out.remotePresent=remote.rollcall&&Object.keys(remote.rollcall.present||{}).length;
  // 5) PIN 雜湊
  out.pinOld=pinOK('8888'); pinMigrate(); out.hasHash=!!S().settings.pinHash&&!S().settings.pin; out.pinNew=pinOK('8888'); out.pinWrong=pinOK('1234');
  // 6) 版本提示
  S().settings.minVersion='9.9'; Store.checkVersion(); out.verToast=document.getElementById('toast').textContent.slice(0,12);
  // 7) localStorage 佇列持久化
  const c=JSON.parse(localStorage.getItem('sapa-data')); out.qPersisted=Array.isArray(c.q);
  return out;
});
console.log(JSON.stringify(r,null,1)); console.log(errs.length?errs:'no errors');
await b.close();})();

/* Service Worker：訊號很弱時不能白畫面（第 4 項）
   起一個本機 http 伺服器，可以切換「每個請求延遲 N 秒」。
   1) 第一次正常載入 → SW 安裝、快取建好
   2) 伺服器改成延遲 6 秒 → 第二次載入應該在 ~3 秒內就用快取畫出來（不是等 6 秒）
   3) 伺服器直接斷掉 → 仍然畫得出來
   4) 錯誤頁（500）不能被寫進快取，蓋掉正常的 index.html */
const {chromium,at}=require('./_lib');
const http=require('http'), fs=require('fs'), path=require('path');
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x));} else console.log('  ✓',n); };

const ROOT=at('.'); let DELAY=0, DOWN=false, ERR=false;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg'};
const srv=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://x'); let f=u.pathname==='/'?'/index.html':u.pathname;
  if(DOWN){ req.socket.destroy(); return; }
  const send=()=>{
    if(ERR&&f==='/index.html'){ res.writeHead(500,{'Content-Type':'text/html'}); return res.end('<h1>500 Server Error</h1>'); }
    const fp=path.join(ROOT,f); if(!fs.existsSync(fp)){ res.writeHead(404); return res.end(); }
    res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream','Cache-Control':'no-store'}); res.end(fs.readFileSync(fp));
  };
  if(DELAY) setTimeout(send,DELAY); else send();
});

(async()=>{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r)); const PORT=srv.address().port, URL0=`http://127.0.0.1:${PORT}/`;
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:375,height:667},serviceWorkers:'allow'});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.route(/gstatic\.com/,r=>r.abort());   /* 這裡不連雲端 */

  console.log('[1] 第一次載入：SW 安裝');
  await p.goto(URL0); await p.waitForTimeout(2500);
  const sw=await p.evaluate(async()=>{ const r=await navigator.serviceWorker.getRegistration(); const ks=await caches.keys(); const c=ks.length?await caches.open(ks[0]):null; const keys=c?(await c.keys()).map(k=>new URL(k.url).pathname):[]; return {reg:!!r,active:!!(r&&r.active),caches:ks,keys}; });
  ck('SW 已註冊且啟用',sw.reg&&sw.active,sw);
  ck('快取名稱是 v3',sw.caches.indexOf('sapa-tour-v3')>=0,sw.caches);
  ck('index.html 與 config.js 在快取裡',sw.keys.indexOf('/index.html')>=0&&sw.keys.indexOf('/config.js')>=0,sw.keys);
  /* 第二次一般載入：讓「/?v=xxx」這種帶參數的導覽也命中 */
  await p.goto(URL0+'?v=test'); await p.waitForTimeout(800);
  ck('帶參數的網址也能正常載入',await p.evaluate(()=>typeof APP_VERSION==='string'));

  console.log('[2] 伺服器每個請求延遲 6 秒（訊號很弱）');
  DELAY=6000;
  const t0=Date.now();
  await p.goto(URL0+'?v=slow',{waitUntil:'commit'});
  await p.waitForFunction(()=>typeof APP_VERSION==='string'&&document.querySelector('.hero, .card, .btn'),null,{timeout:15000});
  const dt=Date.now()-t0;
  console.log('    畫面出現耗時：'+dt+' ms');
  ck('3.5 秒內就畫出來（用快取，不等網路）',dt<3500,dt);
  ck('畫出來的是完整 App',await p.evaluate(()=>!!document.getElementById('view')&&document.getElementById('view').children.length>0));

  console.log('[3] 伺服器完全斷線');
  DELAY=0; DOWN=true;
  const t1=Date.now();
  await p.goto(URL0+'?v=down',{waitUntil:'commit'});
  await p.waitForFunction(()=>typeof APP_VERSION==='string',null,{timeout:15000});
  const dt1=Date.now()-t1;
  console.log('    畫面出現耗時：'+dt1+' ms');
  ck('斷線時仍畫得出來，且很快',dt1<3500,dt1);

  console.log('[4] 伺服器回 500 時不能污染快取');
  DOWN=false; ERR=true;
  await p.goto(URL0+'?v=err',{waitUntil:'commit'}); await p.waitForTimeout(1500);
  const afterErr=await p.evaluate(()=>typeof APP_VERSION==='string');
  ck('拿到 500 時畫面仍是 App（不是錯誤頁）——因為只等網路 2.5 秒且 500 不寫入快取',afterErr);
  ERR=false; DOWN=true;
  await p.goto(URL0+'?v=err2',{waitUntil:'commit'}); await p.waitForFunction(()=>document.readyState!=='loading',null,{timeout:15000}); await p.waitForTimeout(500);
  ck('之後斷線再開，快取裡仍是正常的 App，不是 500 頁',await p.evaluate(()=>typeof APP_VERSION==='string'&&!/500 Server Error/.test(document.body.textContent)));

  console.log('[5] 伺服器掛掉時按「更新」：不能把快取清掉');
  DOWN=true; ERR=false; DELAY=0;
  await p.goto(URL0+'?v=upd',{waitUntil:'commit'}); await p.waitForFunction(()=>typeof APP_VERSION==='string',null,{timeout:15000});
  const before5=await p.evaluate(async()=>({regs:(await navigator.serviceWorker.getRegistrations()).length,caches:(await caches.keys()).length}));
  await p.evaluate(()=>{ ACT.reloadApp(); }); await p.waitForTimeout(9500);
  const after5=await p.evaluate(async()=>({regs:(await navigator.serviceWorker.getRegistrations()).length,caches:(await caches.keys()).length,app:typeof APP_VERSION==='string',toast:document.getElementById('toast').textContent}));
  ck('按更新前 SW 與快取都在（測試本身有效）',before5.regs===1&&before5.caches===1,before5);
  ck('伺服器掛掉：不清 SW、不清快取、頁面還在',after5.regs===1&&after5.caches===1&&after5.app,after5);
  ck('有提示「連不到伺服器」',/連不到伺服器/.test(after5.toast),after5.toast);
  console.log('[6] 伺服器正常時按「更新」：真的清掉舊快取再重載');
  DOWN=false;
  await p.evaluate(()=>{ ACT.reloadApp(); }); await p.waitForTimeout(4000);
  const after6=await p.evaluate(()=>typeof APP_VERSION==='string'?APP_VERSION:null);
  ck('重載後 App 正常',after6==='3.18'||!!after6,after6);

  ck('全程無 JS 錯誤',errs.length===0,errs.slice(0,3));
  await b.close(); srv.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

const {chromium,FILE,at}=require('./_lib');
(async()=>{
  const b=await chromium.launch();
  for(const [w,fs] of [[320,'md'],[320,'xl'],[390,'lg']]){
    const ctx=await b.newContext({viewport:{width:w,height:900},deviceScaleFactor:2});
    const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(FILE); await p.waitForTimeout(400);
    await p.evaluate(f=>{P.fs=f;P.tab='tools';P.tool='menu';render();},fs);
    const r=await p.evaluate(()=>{
      const h=[...document.querySelectorAll('h2.sec')][0];
      const btn=document.querySelector('.inst-btn');
      return {secClip:h.scrollWidth-h.clientWidth, btnExists:!!btn,
        btnRight:btn?Math.round(btn.getBoundingClientRect().right):0,
        vw:document.documentElement.clientWidth,
        label:btn?btn.textContent.trim():''};
    });
    console.log(w,fs,JSON.stringify(r), errs.length?errs[0]:'');
    await ctx.close();
  }
  // 四種平台的教學彈窗截圖
  const ctx=await b.newContext({viewport:{width:390,height:900},deviceScaleFactor:2});
  const p=await ctx.newPage();
  await p.goto(FILE); await p.waitForTimeout(400);
  for(const [name,env] of [['ios',{ios:true,android:false,line:false,inapp:false}],
                           ['line',{ios:true,android:false,line:true,inapp:true}],
                           ['android',{ios:false,android:true,line:false,inapp:false}]]){
    await p.evaluate(e=>{uaEnv=()=>e;P.tab='tools';P.tool='menu';render();sheetInstall();},env);
    await p.waitForTimeout(250);
    await p.screenshot({path:at(`shots/inst-${name}.png`)});
    await p.evaluate(()=>closeSheet());
  }
  await b.close();
})();

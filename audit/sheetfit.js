/* 表單在「矮螢幕」下不可被壓扁：每個區塊的實際內容高度不得超過它的可視高度 */
const {chromium,FILE,at}=require('./_lib');
const F=FILE;
const SHEETS=[
  ['zones-auto',()=>{S().settings.zones={};S().settings.dayOverride=0;S().settings.startDate='2026-09-24';sheetCardZones();}],
  ['zones-manual',()=>{S().settings.zones={mode:'manual'};sheetCardZones();}],
  ['settings',()=>ACT.settings()],
  ['broadcast',()=>ACT.editBroadcast()],
  ['share',()=>sheetShare()],
  ['install-ios',()=>{uaEnv=()=>({ios:true,android:false,line:false,inapp:false});sheetInstall();}],
  ['install-line',()=>{uaEnv=()=>({ios:true,android:false,line:true,inapp:true});sheetInstall();}],
  ['homeScn',()=>ACT.homeScnVis()],
  ['pin',()=>{P.leader=false;sheetPin();}],
  ['leaderMenu',()=>{P.leader=true;sheetLeaderMenu();}],
];
let fails=0;
(async()=>{
  const b=await chromium.launch();
  /* 320×568（iPhone SE 1）到 390×667：最容易把表單壓扁的尺寸 */
  for(const [w,hh] of [[320,568],[375,600],[390,667]]) for(const fs of ['md','xl']){
    const ctx=await b.newContext({viewport:{width:w,height:hh}});
    const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(F); await p.waitForTimeout(350);
    await p.evaluate(f=>{P.fs=f;P.leader=true;render();},fs);
    for(const [name,fn] of SHEETS){
      await p.evaluate(fn); await p.waitForTimeout(120);
      const r=await p.evaluate(()=>{
        const body=document.querySelector('.sheet-b'); if(!body) return {no:true};
        const bad=[];
        body.querySelectorAll(':scope > *').forEach((el,i)=>{
          /* 內容比自己高＝被壓扁，裡面的東西會疊在一起 */
          if(el.scrollHeight>el.clientHeight+1) bad.push('child'+i+' '+el.className+' '+el.scrollHeight+'>'+el.clientHeight);
        });
        /* 看板：每個分區框也不能被壓 */
        document.querySelectorAll('.sheet .zb').forEach((el,i)=>{
          if(el.scrollHeight>el.clientHeight+1) bad.push('zb'+i+' '+el.scrollHeight+'>'+el.clientHeight);
        });
        /* 相鄰卡片列不可重疊 */
        const rows=[...document.querySelectorAll('.sheet .zb-c')];
        for(let i=1;i<rows.length;i++){
          const a=rows[i-1].getBoundingClientRect(), c=rows[i].getBoundingClientRect();
          if(c.top<a.bottom-1 && rows[i-1].parentElement===rows[i].parentElement) bad.push('overlap'+i);
        }
        return {bad, scrolls:body.scrollHeight>body.clientHeight};
      });
      const tag=`${w}x${hh}/${fs}/${name}`;
      if(r.no){ fails++; console.log('  ✗',tag,'表單沒開'); }
      else if(r.bad.length){ fails++; console.log('  ✗',tag,JSON.stringify(r.bad)); }
      await p.evaluate(()=>closeSheet());
    }
    if(errs.length){ fails++; console.log('  ✗ JS ERR',w,fs,errs[0]); }
    console.log('  ✓',w+'x'+hh,fs,'共',SHEETS.length,'個表單');
    await ctx.close();
  }
  await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

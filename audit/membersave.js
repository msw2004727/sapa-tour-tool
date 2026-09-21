/* 回歸測試：編輯團員卡片存檔後「重新整理」資料要還在
   背景：saveMember() 曾經在 closeSheet()（把 SHEET 設成 null）之後又讀 SHEET.id 判斷分支，
   導致 TypeError、Store.savePath/Store.save 完全沒被呼叫到——UI 看起來存了（表單有關掉），
   但其實什麼都沒寫進 localStorage／佇列，一重新整理就打回原狀。
   用法：node audit/membersave.js */
const {chromium,FILE,at}=require('./_lib');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:375,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(FILE); await p.waitForTimeout(500);

  const before=await p.evaluate(()=>{
    P.leader=true; render();
    var m=members()[0];
    return {id:m.id, room:m.room, remark:m.remark};
  });

  const saveResult=await p.evaluate((id)=>{
    try{
      ACT.editMember({getAttribute:function(){return id;}});
      document.querySelector('[name=room]').value='609';
      document.querySelector('[name=remark]').value='membersave 測試備註';
      ACT.saveMember();
      return {threw:false};
    }catch(e){ return {threw:true, err:String(e)}; }
  }, before.id);

  await p.waitForTimeout(300);
  const cachedRightAfter=await p.evaluate((id)=>{
    var c=JSON.parse(localStorage.getItem('sapa-data')||'null');
    var it=c&&c.docs&&c.docs.members?(c.docs.members.items||[]).filter(function(x){return x.id===id;})[0]:null;
    return it?{room:it.room, remark:it.remark}:null;
  }, before.id);

  await p.reload(); await p.waitForTimeout(500);
  const afterReload=await p.evaluate((id)=>{ var m=member(id); return m?{room:m.room, remark:m.remark}:null; }, before.id);

  const ok = !saveResult.threw
    && cachedRightAfter && cachedRightAfter.room==='609' && cachedRightAfter.remark==='membersave 測試備註'
    && afterReload && afterReload.room==='609' && afterReload.remark==='membersave 測試備註'
    && errs.length===0;

  console.log(JSON.stringify({before,saveResult,cachedRightAfter,afterReload,pageErrors:errs},null,1));
  console.log(ok?'全部通過':'FAIL');
  await b.close();
  process.exit(ok?0:1);
})();

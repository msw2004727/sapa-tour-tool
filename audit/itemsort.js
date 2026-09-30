/* v3.28 行程「同一天依時間自動排序」＋「夜宿 ○○」標籤來源。
   一、sortDayByTime 本身：沒填時間的站留在原位、時間相同維持原本先後、"5:30" 這種沒補零的也排得對、只動指定的那一天。
   二、實際走表單存檔（ACT.editItem → 填欄位 → ACT.saveItem）：
      新增一站（有時間）→ 落在時間對的位置；新增沒填時間的 → 排在那天最後、其他站都不動；
      改時間 → 跟著移動；改第幾天 → 進到新的那一天並排好；
      只改說明文字 → 不動順序（主辦人手動上移下移的排法不會被蓋掉）；存檔後重新整理順序還在。
   三、行程頁標題的「夜宿 ○○」不是寫死的，是飯店資料裡的「入住晚數」推出來的：清掉入住晚數就消失。
   用法：node audit/itemsort.js（要先 node build.js） */
const {chromium,FILE}=require('./_lib');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:375,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(FILE); await p.waitForTimeout(500);
  let bad=0;
  const chk=(name,ok,detail)=>{ if(!ok) bad++; console.log((ok?'  ok  ':'  FAIL ')+name+(ok?'':'  → '+JSON.stringify(detail))); };

  /* 在頁面裡用的小工具（前綴 t，避免跟程式撞名，見 CLAUDE.md 寫測試的原則）；重新整理之後要再裝一次 */
  const installHelpers=()=>p.evaluate(()=>{
    window.tday=d=>items().filter(x=>x.day===d).map(x=>x.id);
    window.tother=d=>JSON.stringify(items().filter(x=>x.day!==d).map(x=>x.id+'@'+x.day));
    window.tsave=(id,f)=>{   /* 走真正的表單：開表單 → 填欄位 → 存檔 */
      ACT.editItem({getAttribute:()=>id||''});
      const root=document.querySelector('#sheetRoot');
      Object.keys(f).forEach(k=>{ const e=root.querySelector('[name="'+k+'"]'); if(e) e.value=f[k]; });
      ACT.saveItem();
    };
    window.ttimes=d=>items().filter(x=>x.day===d&&x.time).map(x=>x.time);
  });
  await installHelpers();

  console.log('[1] sortDayByTime 本身');
  const u=await p.evaluate(()=>{
    const a=[{id:'x1',day:1,time:'09:00'},{id:'y1',day:2,time:'12:00'},{id:'y2',day:2,time:'08:30'},{id:'y3',day:2,time:''},{id:'y4',day:2,time:'5:30'},{id:'y5',day:2,time:'08:30'},{id:'z1',day:3,time:'01:00'}];
    sortDayByTime(a,2); return a.map(x=>x.id).join(',');
  });
  chk('沒填時間的留在原位、同時間維持先後、5:30 排在最前、其他天不動',u==='x1,y4,y2,y3,y5,y1,z1',u);

  console.log('[2] 新增一站（有時間）→ 落在時間對的位置');
  const d2=await p.evaluate(()=>{ P.leader=true; render(); return {ids:tday(2),times:ttimes(2),other:tother(2)}; });
  const m=t=>{const q=t.split(':').map(Number);return q[0]*60+q[1];};
  chk('前提：第 2 天至少有兩站有時間，而且前兩站差 2 分鐘以上',d2.times.length>=2&&m(d2.times[1])-m(d2.times[0])>=2,d2.times);
  const mid=(mn=>String(Math.floor(mn/60)).padStart(2,'0')+':'+String(mn%60).padStart(2,'0'))(Math.floor((m(d2.times[0])+m(d2.times[1]))/2));
  const r2=await p.evaluate((mid)=>{ tsave('',{day:'2',time:mid,title:'測試新增A'}); const n=items().filter(x=>x.title==='測試新增A')[0]; return {id:n.id,ids:tday(2),times:ttimes(2),other:tother(2)}; },mid);
  chk('新增的落在第 1 站與第 2 站之間（'+mid+'）',r2.ids.indexOf(r2.id)===1,r2.ids);
  chk('整天的時間由早到晚',r2.times.every((t,i)=>i===0||m(r2.times[i-1])<=m(t)),r2.times);
  chk('其他天的順序完全沒變',r2.other===d2.other,[d2.other,r2.other]);

  console.log('[3] 新增沒填時間的 → 排在那天最後，其他站不動');
  const r3=await p.evaluate(()=>{ const before=tday(2); tsave('',{day:'2',time:'',title:'測試無時間'}); const n=items().filter(x=>x.title==='測試無時間')[0]; return {before,after:tday(2),id:n.id}; });
  chk('原本的順序不變、新的排在最後',JSON.stringify(r3.after)===JSON.stringify(r3.before.concat([r3.id])),r3);

  console.log('[4] 改時間 → 跟著移動');
  const r4=await p.evaluate(()=>{ const id=tday(2)[0]; tsave(id,{time:'23:00'}); const l=tday(2).filter(i=>items().filter(x=>x.id===i)[0].time); return {id,lastTimed:l[l.length-1],times:ttimes(2)}; });
  chk('最早的那站改成 23:00 之後，變成有時間的最後一站',r4.id===r4.lastTimed,r4);
  chk('整天的時間由早到晚',r4.times.every((t,i)=>i===0||m(r4.times[i-1])<=m(t)),r4.times);

  console.log('[5] 改第幾天 → 進到新的那一天並排好');
  const r5=await p.evaluate(()=>{ const id=items().filter(x=>x.title==='測試新增A')[0].id; const o3=tother(3); tsave(id,{day:'3',time:'07:00'}); const t=ttimes(3); return {id,ids:tday(3),times:t,in2:tday(2).indexOf(id)}; });
  chk('離開第 2 天',r5.in2===-1,r5);
  chk('第 3 天的時間由早到晚',r5.times.every((t,i)=>i===0||m(r5.times[i-1])<=m(t)),r5.times);
  chk('07:00 排在 06:00 的早餐後面、09:00 的景點前面',r5.ids.indexOf(r5.id)===1,r5.ids);

  console.log('[6] 只改說明文字 → 不動順序（手動上移下移的排法不被蓋掉）');
  const r6=await p.evaluate(()=>{
    const ids=tday(4); ACT.moveItem({getAttribute:k=>({'data-id':ids[1],'data-dir':'1'})[k]});   /* 第 2 站往下移一格，故意讓時間不照順序 */
    const moved=tday(4); tsave(ids[0],{desc:'只改說明'}); return {ids,moved,after:tday(4)};
  });
  chk('前提：手動移動真的改了順序',JSON.stringify(r6.moved)!==JSON.stringify(r6.ids),r6);
  chk('只改說明文字存檔之後，順序維持手動排的樣子',JSON.stringify(r6.after)===JSON.stringify(r6.moved),r6);

  console.log('[7] 存檔後重新整理，順序還在');
  const beforeReload=await p.evaluate(()=>[2,3,4].map(d=>tday(d)));
  await p.waitForTimeout(300); await p.reload(); await p.waitForTimeout(600); await installHelpers();
  const afterReload=await p.evaluate(()=>[2,3,4].map(d=>tday(d)));
  chk('第 2、3、4 天的順序跟重新整理之前一樣',JSON.stringify(afterReload)===JSON.stringify(beforeReload),[beforeReload,afterReload]);

  console.log('[8] 「夜宿 ○○」是飯店資料推出來的，不是寫死的');
  const r8=await p.evaluate(()=>{
    P.leader=false; P.tab='plan'; P.planDay=2; render();
    const t1=(document.querySelector('.day-title')||{}).textContent||'';
    const h=S().settings.hotels.filter(x=>x.id==='sapa')[0]; const old=h.nights; h.nights=''; render();
    const t2=(document.querySelector('.day-title')||{}).textContent||''; h.nights=old; render();
    const t3=(document.querySelector('.day-title')||{}).textContent||'';
    return {t1,t2,t3};
  });
  chk('入住晚數寫「第 1、2、3 晚」時，第 2 天顯示「夜宿 沙壩」',/夜宿 沙壩/.test(r8.t1),r8.t1);
  chk('入住晚數清空後，「夜宿」消失',!/夜宿/.test(r8.t2),r8.t2);
  chk('改回去又出現',/夜宿 沙壩/.test(r8.t3),r8.t3);

  chk('沒有 JS 錯誤',errs.length===0,errs);
  console.log(bad?('FAIL：'+bad+' 項'):'全部通過');
  await b.close();
  process.exit(bad?1:0);
})();

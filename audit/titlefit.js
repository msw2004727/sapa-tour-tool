/* v3.33 行程頁每一站的標題：太長不斷行，改成緩緩左右來回，看得到完整的字。
   起因：行程頁的標題一行放不下就換行，只多出一個字（例：「中餐_Siripanna Chiangmai自助餐」的「餐」）也會掉到第二行，
   整張卡變高、很難看。現在：放得下的不動；放不下的不換行，先停一下、緩緩往左滑到看見最後一個字、停一下、再滑回來。
   系統設了「減少動態效果」時完全不處理（照舊換行，一個字都不藏）。
   這支測試自己造 6 站標題（全部虛構）：1 個短的（一定放得下）、4 個超長的（一定放不下，其中一個是 70 字元沒空格的英數、
   一個是因天候取消的、一個塞了 HTML）、1 個邊界的（使用者截圖那條，剛好多出一點點），在 4 種寬度 × 3 種字級 × 淺深色下量：
     1. 每一個標題都是單行（不換行），卡片在螢幕裡、卡片內容沒有撐出卡片、整頁沒有橫向捲動
     2. 放不下的標題有一個動畫、放得下的沒有；動畫「開頭」看得到第一個字、「結尾」最後一個字完整露在框裡但沒有滑過頭
     3. 慢：兩端各停 ≥ 1 秒、單程 ≥ 1 秒、速度 ≤ 80 px/s；起步有緩動（不是等速）
     4. 因天候取消的標題仍然有刪除線；塞進去的 HTML 只顯示成文字
     5. 系統「減少動態效果」：沒有動畫、長標題換行、整段字都在框裡；關掉之後不用重畫就開始動
     6. 視窗寬度改變（折疊機、橫放）：本來放不下的變成放得下就停、反過來就開始動
   前提也一起斷言（短的真的放得下、超長的真的放不下、有東西在動也有東西沒動），不然資料本來就不長會假通過。
   用法：node audit/titlefit.js（要先 node build.js） */
const {chromium,FILE}=require('./_lib');

const TITLES=[
  '中餐_Siripanna Chiangmai自助餐',
  '公司集合',
  '這是一個很長很長的行程名稱用來測試換行ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKL',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  '晚餐：這一站已經因天候取消但是名稱還是很長很長很長很長很長很長',
  '<img src=x onerror=window.tPWN=1>很長很長很長很長很長很長很長很長很長很長很長很長很長很長很長'
];
const CANCEL=4;           /* 第 5 站是因天候取消的 */
const ALWAYS_LONG=[2,3,4,5], SHORT=1;
const MID='十二個字的行程名稱放得下';   /* 320px 放不下、435px 放得下（resize 測試用） */

/* 放進頁面的函式（前綴 t，不跟程式撞名；用 toString 傳進去，所以裡面不能用外面的變數） */
const tSetup=function(a){
  const all=items(); const mine=all.filter(function(x){ return x.day===1; });
  while(mine.length<a.titles.length){ const x={id:'tmq'+mine.length,day:1,time:'',title:'',place:''}; all.push(x); mine.push(x); }
  mine.forEach(function(x,i){
    if(i<a.titles.length){ x.title=a.titles[i]; x.time=(i===0?'':'0'+(i+6)+':00'); x.desc=''; x.isCanceled=(i===a.cancel); x.isCurrent=false; }
    else x.day=99;
  });
  P.leader=!!a.leader; P.tab='plan'; P.planDay=1; P.fs=a.fs; P.theme=a.theme;
  document.documentElement.setAttribute('data-fs',a.fs); render();
};
const tMeas=function(){
  const vw=window.innerWidth;
  const docOver=document.documentElement.scrollWidth>vw+1;
  return [].slice.call(document.querySelectorAll('.stop')).map(function(s){
    const h=s.querySelector('.t-title'), n=h.querySelector('.mq-in'), cs=getComputedStyle(h);
    const hr=h.getBoundingClientRect(), nr=n.getBoundingClientRect(), sr=s.getBoundingClientRect();
    const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.25;
    const an=n.getAnimations?n.getAnimations():[];
    const o={txt:n.textContent,kids:n.children.length,mq:h.classList.contains('mq'),hh:hr.height,lh:lh,hw:hr.width,nw:nr.width,
      inCard:sr.left>=-1&&sr.right<=vw+1,cardOver:s.scrollWidth>s.clientWidth+1,docOver:docOver,anims:an.length,
      off:s.classList.contains('off'),deco:getComputedStyle(n).textDecorationLine,
      lead:!!document.querySelector('.lead-ctl'),leadIn:!!s.querySelector('.lead-ctl')};
    if(an.length){
      const a=an[0], kf=a.effect.getKeyframes(), D=a.effect.getComputedTiming().duration;
      o.dist=-parseFloat(/-?[\d.]+/.exec(kf[2].transform)[0]);
      o.pause=kf[1].offset*D; o.travel=(kf[2].offset-kf[1].offset)*D; o.pause2=(kf[3].offset-kf[2].offset)*D; o.back=(1-kf[3].offset)*D; o.D=D;
      a.pause();
      a.currentTime=0; o.startL=n.getBoundingClientRect().left-hr.left;
      a.currentTime=o.pause+o.travel*0.1; o.early=hr.left-n.getBoundingClientRect().left;
      a.currentTime=o.pause+o.travel+10; o.endR=hr.right-n.getBoundingClientRect().right;
      a.currentTime=o.pause+o.travel+o.pause2+o.back*0.5; o.midBack=hr.left-n.getBoundingClientRect().left;
      a.play();
    }
    return o;
  });
};

(async()=>{
  const b=await chromium.launch();
  let bad=0, checks=0;
  const chk=(name,ok,detail)=>{ checks++; if(!ok){ bad++; console.log('  FAIL '+name+'  → '+JSON.stringify(detail)); } };
  const install=p=>p.evaluate('window.tSetup='+tSetup.toString()+';window.tMeas='+tMeas.toString());
  const setup=(p,a)=>p.evaluate(x=>window.tSetup(x),a);
  const meas=p=>p.evaluate(()=>window.tMeas());
  const base={titles:TITLES,cancel:CANCEL,fs:'md',theme:'',leader:false};

  /* 單張卡的共同檢查（動畫與否之外的） */
  const common=(tag,c,i,expectTitle)=>{
    chk(tag+'前提：畫面上的標題就是造的那一條',c.txt===expectTitle,{got:c.txt});
    chk(tag+'標題單行（不換行）',c.hh<=c.lh*1.3,{hh:c.hh,lh:c.lh});
    chk(tag+'卡片在螢幕裡、內容沒撐出卡片、整頁沒有橫向捲動',c.inCard&&!c.cardOver&&!c.docOver,{inCard:c.inCard,cardOver:c.cardOver,docOver:c.docOver});
  };

  console.log('[1] 長標題：4 種寬度 × 3 種字級 × 淺深色');
  let sawMove=0, sawStill=0;
  for(const w of [320,375,390,435]){
    const p=await b.newPage({viewport:{width:w,height:900}});
    const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(FILE+'?sim=2026-09-25T09:00'); await p.waitForTimeout(450); await install(p);
    for(const fs of ['md','lg','xl']) for(const theme of ['','dark']){
      await setup(p,Object.assign({},base,{fs,theme}));
      const cs=await meas(p);
      const cfg=w+'px '+fs+(theme?' 深色':' 淺色');
      chk(cfg+' 前提：畫面上有 '+TITLES.length+' 張行程卡',cs.length===TITLES.length,cs.length);
      cs.forEach((c,i)=>{
        const tag=cfg+' 第'+(i+1)+'站 ';
        common(tag,c,i,TITLES[i]);
        const over=c.nw-c.hw;
        if(i===SHORT){
          chk(tag+'前提：短標題放得下',over<=0.5,{nw:c.nw,hw:c.hw});
          chk(tag+'放得下就不動（沒有動畫）',c.anims===0,c.anims);
          sawStill++;
        } else if(ALWAYS_LONG.includes(i)){
          chk(tag+'前提：超長標題放不下（多出 ≥ 100px）',over>=100,{nw:c.nw,hw:c.hw});
        }
        /* 放不下 ⇔ 有動畫（含使用者截圖那條邊界的） */
        chk(tag+'放不下才有動畫（恰好一個）、放得下沒有',over>0.5?c.anims===1:c.anims===0,{over,anims:c.anims});
        if(c.anims===1){
          sawMove++;
          chk(tag+'兩端各停 ≥ 1 秒',c.pause>=1000&&c.pause2>=1000,{p1:c.pause,p2:c.pause2});
          chk(tag+'單程 ≥ 1 秒、速度 ≤ 80 px/s（緩緩的）',c.travel>=1000&&c.dist/c.travel*1000<=80,{travel:c.travel,dist:c.dist,speed:c.dist/c.travel*1000});
          chk(tag+'回程跟去程一樣慢',Math.abs(c.back-c.travel)<=1,{travel:c.travel,back:c.back});
          chk(tag+'開頭：看得到第一個字（文字左緣跟框對齊）',Math.abs(c.startL)<=0.6,c.startL);
          chk(tag+'結尾：最後一個字完整露在框裡，也沒有滑過頭',c.endR>=-0.5&&c.endR<=8,c.endR);
          chk(tag+'起步有緩動（前 10% 時間走不到 7% 的距離）',c.dist<15||c.early<c.dist*0.07,{early:c.early,dist:c.dist});
          chk(tag+'回程途中在原位與盡頭之間',c.midBack>0.5&&c.midBack<c.dist-0.5,{mid:c.midBack,dist:c.dist});
        } else {
          chk(tag+'沒動的標題，整串字都看得到',c.nw<=c.hw+0.5,{nw:c.nw,hw:c.hw});
        }
        if(i===CANCEL){
          chk(tag+'因天候取消的卡有 off 標記、標題仍有刪除線',c.off&&/line-through/.test(c.deco),{off:c.off,deco:c.deco});
        } else {
          chk(tag+'沒取消的卡沒有 off 標記',!c.off,c.off);
        }
        if(i===5){
          chk(tag+'塞進去的 HTML 只顯示成文字（沒有元素、沒有執行）',c.kids===0&&c.txt.indexOf('<img')===0,{kids:c.kids});
        }
      });
      const pwn=await p.evaluate(()=>typeof window.tPWN);
      chk(cfg+' 塞進去的 onerror 沒有執行',pwn==='undefined',pwn);
    }
    chk(w+'px：沒有 JS 錯誤',errs.length===0,errs);
    await p.close();
  }
  chk('前提：有標題在動、也有標題沒動',sawMove>0&&sawStill>0,{sawMove,sawStill});

  console.log('[2] 管理模式（多一排上移／下移／編輯按鈕）也一樣');
  for(const [w,fs] of [[320,'xl'],[435,'md']]){
    const p=await b.newPage({viewport:{width:w,height:900}});
    await p.goto(FILE+'?sim=2026-09-25T09:00'); await p.waitForTimeout(450); await install(p);
    await setup(p,Object.assign({},base,{fs,leader:true}));
    const cs=await meas(p);
    cs.forEach((c,i)=>{
      const tag='管理模式 '+w+'px '+fs+' 第'+(i+1)+'站 ';
      chk(tag+'前提：有管理按鈕列',c.lead&&c.leadIn,{lead:c.lead,leadIn:c.leadIn});
      common(tag,c,i,TITLES[i]);
      if(ALWAYS_LONG.includes(i)) chk(tag+'放不下的在動',c.anims===1,c.anims);
    });
    await p.close();
  }

  console.log('[3] 系統設了「減少動態效果」：完全不動，長標題換行、一個字都不藏');
  for(const [w,fs] of [[320,'xl'],[435,'md']]){
    const p=await b.newPage({viewport:{width:w,height:900}});
    const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(FILE+'?sim=2026-09-25T09:00'); await p.waitForTimeout(450); await install(p);
    await p.emulateMedia({reducedMotion:'reduce'});
    await setup(p,Object.assign({},base,{fs}));
    const cs=await meas(p);
    cs.forEach((c,i)=>{
      const tag='減少動態 '+w+'px '+fs+' 第'+(i+1)+'站 ';
      chk(tag+'沒有動畫、沒有套用不換行',c.anims===0&&!c.mq,{anims:c.anims,mq:c.mq});
      chk(tag+'卡片在螢幕裡、內容沒撐出卡片、整頁沒有橫向捲動',c.inCard&&!c.cardOver&&!c.docOver,{inCard:c.inCard,cardOver:c.cardOver,docOver:c.docOver});
      chk(tag+'整串字都在框裡（沒有被藏起來）',c.nw<=c.hw+1,{nw:c.nw,hw:c.hw});
      if(ALWAYS_LONG.includes(i)) chk(tag+'前提：超長標題確實換成多行',c.hh>c.lh*1.5,{hh:c.hh,lh:c.lh});
    });
    /* 關掉「減少動態效果」：不用重畫，長標題自己開始動 */
    await p.emulateMedia({reducedMotion:'no-preference'}); await p.waitForTimeout(300);
    const cs2=await meas(p);
    chk(w+'px：關掉「減少動態效果」後，不用重畫，放不下的標題開始動',ALWAYS_LONG.every(i=>cs2[i].anims===1&&cs2[i].mq&&cs2[i].hh<=cs2[i].lh*1.3),cs2.map(c=>({a:c.anims,mq:c.mq,hh:c.hh})));
    /* 再打開：馬上停、換回換行 */
    await p.emulateMedia({reducedMotion:'reduce'}); await p.waitForTimeout(300);
    const cs3=await meas(p);
    chk(w+'px：再打開「減少動態效果」，動畫停了、標題換回換行',cs3.every(c=>c.anims===0&&!c.mq)&&ALWAYS_LONG.every(i=>cs3[i].hh>cs3[i].lh*1.5),cs3.map(c=>({a:c.anims,mq:c.mq,hh:c.hh})));
    chk(w+'px：沒有 JS 錯誤',errs.length===0,errs);
    await p.close();
  }

  console.log('[4] 視窗寬度改變（折疊機、橫放）：放得下就停、放不下就開始動');
  {
    const p=await b.newPage({viewport:{width:320,height:900}});
    const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    await p.goto(FILE+'?sim=2026-09-25T09:00'); await p.waitForTimeout(450); await install(p);
    const T=TITLES.slice(); T[SHORT]=MID;
    await setup(p,Object.assign({},base,{titles:T}));
    const a1=(await meas(p))[SHORT];
    chk('320px 前提：十二個字的標題放不下、在動',a1.nw-a1.hw>0.5&&a1.anims===1,{nw:a1.nw,hw:a1.hw,anims:a1.anims});
    await p.setViewportSize({width:435,height:900}); await p.waitForTimeout(450);
    const a2=await meas(p);
    chk('拉寬到 435px 前提：同一條放得下了',a2[SHORT].nw-a2[SHORT].hw<=0.5,{nw:a2[SHORT].nw,hw:a2[SHORT].hw});
    chk('拉寬後：放得下的標題停了、沒有動畫、整串字都看得到',a2[SHORT].anims===0&&a2[SHORT].nw<=a2[SHORT].hw+0.5,a2[SHORT]);
    chk('拉寬後：仍然放不下的標題還在動',ALWAYS_LONG.every(i=>a2[i].anims===1),a2.map(c=>c.anims));
    chk('拉寬後：每個標題仍是單行、整頁沒有橫向捲動',a2.every(c=>c.hh<=c.lh*1.3&&!c.docOver),a2.map(c=>({hh:c.hh,d:c.docOver})));
    await p.setViewportSize({width:320,height:900}); await p.waitForTimeout(450);
    const a3=(await meas(p))[SHORT];
    chk('縮回 320px：十二個字的標題又開始動，結尾完整露出',a3.anims===1&&a3.endR>=-0.5&&a3.endR<=8,{anims:a3.anims,endR:a3.endR});
    chk('沒有 JS 錯誤',errs.length===0,errs);
    await p.close();
  }

  console.log(bad?('FAIL：'+bad+' 項（共 '+checks+' 項）'):('全部通過（'+checks+' 項）'));
  await b.close();
  process.exit(bad?1:0);
})();

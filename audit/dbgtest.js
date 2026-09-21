/* 行程卡片底圖（每個行程項目一張）：上傳→裁切→壓縮→存檔→渲染→對比度，整條路走一遍 */
const {chromium,FILE,at}=require('./_lib');
const F=FILE;
const PHOTO=at('audit/_bigphoto.jpg');
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x));} else console.log('  ✓',n); };
const wait=(p,ms)=>p.waitForTimeout(ms);

/* 打開第 day 天的第 nth 張行程的編輯表單，回傳那個行程的 id */
async function openItem(p,day,nth){
  return await p.evaluate(([d,n])=>{
    P.leader=true; P.tab='plan'; P.planDay=d; render();
    const bs=[...document.querySelectorAll('[data-act="editItem"][data-id]')].filter(b=>b.getAttribute('data-id'));
    const b=bs[n||0]; b.click(); return b.getAttribute('data-id');
  },[day,nth||0]);
}
async function pickAndApply(p,day,nth,zoom){
  const id=await openItem(p,day,nth);
  await wait(p,250);
  await p.setInputFiles('#dbgFile',PHOTO);
  await wait(p,900);
  if(zoom) await p.evaluate(z=>{ var s=document.getElementById('dbgZ'); s.value=z; s.dispatchEvent(new Event('input',{bubbles:true})); },zoom);
  await wait(p,150);
  await p.click('#dbgApply');
  await wait(p,1400);
  return id;
}

(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:760}});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(F); await wait(p,450);

  console.log('[1] 上傳 → 壓縮 → 存檔（單一行程）');
  ck('一開始沒有任何底圖',await p.evaluate(()=>photoTotal().n===0));
  const ID1=await pickAndApply(p,1,0,180);
  const r1=await p.evaluate(id=>{
    const b=itemBg(id); if(!b) return {none:true};
    return {type:b.src.slice(5,b.src.indexOf(';')), bytes:Math.round(b.src.length*3/4), kb:b.kb, op:b.op,
            isData:b.src.indexOf('data:image/')===0, n:photoTotal().n};
  },ID1);
  ck('底圖存在這個行程底下',!r1.none,r1);
  ck('格式是 WebP',r1.type==='image/webp',r1.type);
  ck('是 data URI',r1.isData);
  ck('壓到 9KB 以內',r1.bytes<=9500,r1.bytes+'B / 紀錄 '+r1.kb+'KB');
  ck('濃度預設 9%',r1.op===9,r1.op);
  ck('只有一個行程有圖',r1.n===1,r1.n);

  console.log('[2] 只存裁切後那一塊（尺寸固定 360×203）');
  const dim=await p.evaluate(id=>new Promise(res=>{
    const im=new Image(); im.onload=()=>res({w:im.naturalWidth,h:im.naturalHeight}); im.src=itemBg(id).src;
  }),ID1);
  ck('輸出寬 360',dim.w===360,dim);
  ck('輸出高 203（16:9）',dim.h===203,dim);

  console.log('[3] 行程分頁：只有那一張卡有底圖');
  const r3=await p.evaluate(()=>{
    closeSheet(); P.leader=false; P.tab='plan'; P.planDay=1; render();
    const all=[...document.querySelectorAll('.stop')];
    const withBg=all.filter(c=>c.classList.contains('has-bg'));
    const cs=withBg.length?getComputedStyle(withBg[0],'::before'):null;
    const html=document.getElementById('view').innerHTML;
    const copies=(html.match(/data:image\/webp/g)||[]).length;
    return {all:all.length, withBg:withBg.length, copies,
      op:cs?cs.opacity:'', gray:cs?cs.filter:'', bg:cs?(cs.backgroundImage||'').slice(0,22):'',
      zTxt:withBg.length?getComputedStyle(withBg[0].children[0]).zIndex:'',
      otherBg:all.filter(c=>!c.classList.contains('has-bg')).map(c=>getComputedStyle(c,'::before').backgroundImage).filter(v=>v&&v!=='none').length};
  });
  ck('這天有多張行程卡',r3.all>=3,r3.all);
  ck('只有一張卡掛 has-bg',r3.withBg===1,r3.withBg);
  ck('沒圖的卡不會畫出底圖',r3.otherBg===0,r3.otherBg);
  ck('整頁只存一份圖',r3.copies===1,r3.copies);
  ck('底圖畫在 ::before 上',r3.bg.indexOf('url(')===0,r3.bg);
  ck('濃度 0.09',Math.abs(Number(r3.op)-0.09)<0.001,r3.op);
  ck('有去彩度',r3.gray.indexOf('grayscale(1)')>=0,r3.gray);
  ck('文字被抬到圖上面',r3.zTxt==='1',r3.zTxt);

  console.log('[4] 對比度（把圖依濃度混進卡片底色再量，濃度上限 30%）');
  const contrast=await p.evaluate(id=>new Promise(res=>{
    const srgb=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);};
    const lum=(r,g,b)=>.2126*srgb(r)+.7152*srgb(g)+.0722*srgb(b);
    const rat=(a,b)=>{const x=Math.max(a,b),y=Math.min(a,b);return (x+.05)/(y+.05);};
    const rgb=v=>{const m=String(v).match(/(\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:[255,255,255];};
    const im=new Image();
    im.onload=()=>{
      const cv=document.createElement('canvas'); cv.width=60; cv.height=34;
      const cx=cv.getContext('2d'); cx.drawImage(im,0,0,60,34);
      const px=cx.getImageData(0,0,60,34).data;
      const out={};
      [[.09,''],[.30,'max']].forEach(([o,tag])=>{
        [['light',null],['dark','dark']].forEach(([name,th])=>{
          if(th) document.documentElement.setAttribute('data-theme',th);
          else document.documentElement.removeAttribute('data-theme');
          const card=rgb(getComputedStyle(document.querySelector('.stop.has-bg')).backgroundColor);
          const t1=rgb(getComputedStyle(document.querySelector('.t-title')).color);
          const t2=rgb(getComputedStyle(document.querySelector('.t-desc')).color);
          let w1=99,w2=99;
          for(let i=0;i<px.length;i+=4){
            const y=.2126*px[i]+.7152*px[i+1]+.0722*px[i+2];      /* 顯示時是去彩度 */
            const R=card[0]*(1-o)+y*o, G=card[1]*(1-o)+y*o, B=card[2]*(1-o)+y*o;
            const L=lum(R,G,B);
            w1=Math.min(w1,rat(lum.apply(null,t1),L));
            w2=Math.min(w2,rat(lum.apply(null,t2),L));
          }
          out[name+(tag?'@30':'@9')]={title:+w1.toFixed(2),desc:+w2.toFixed(2)};
        });
      });
      document.documentElement.removeAttribute('data-theme');
      res(out);
    };
    im.src=itemBg(id).src;
  }),ID1);
  console.log('   ',JSON.stringify(contrast));
  ['light@9','dark@9'].forEach(k=>{
    ck(k+' 標題 ≥ 4.5:1',contrast[k].title>=4.5,contrast[k].title);
    ck(k+' 說明 ≥ 4.5:1',contrast[k].desc>=4.5,contrast[k].desc);
  });
  ['light@30','dark@30'].forEach(k=>{
    ck(k+' 標題 ≥ 4.5:1（濃度拉到最大）',contrast[k].title>=4.5,contrast[k].title);
  });

  console.log('[5] 濃度調整、覆蓋上傳、移除');
  const r5=await p.evaluate(id=>{
    P.leader=true; P.tab='plan'; P.planDay=1; render();
    [...document.querySelectorAll('[data-act="editItem"][data-id]')].filter(b=>b.getAttribute('data-id')===id)[0].click();
    return {opened:!!document.getElementById('dbgF'), hasDel:!document.getElementById('dbgDel').hidden,
            opDisabled:document.getElementById('dbgOp').disabled};
  },ID1);
  ck('編輯表單裡有底圖區塊',r5.opened);
  ck('已有底圖時「移除」按鈕會出現',r5.hasDel);
  ck('已有底圖時濃度可調',!r5.opDisabled);
  await p.evaluate(()=>{ const s=document.getElementById('dbgOp'); s.value=15;
    s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true})); });
  await wait(p,300);
  ck('濃度存得起來',await p.evaluate(id=>itemBg(id).op===15,ID1));
  await p.evaluate(()=>{ P.tab='plan'; render(); });
  ck('行程頁跟著變濃',await p.evaluate(()=>{
    const cs=getComputedStyle(document.querySelector('.stop.has-bg'),'::before');
    return Math.abs(Number(cs.opacity)-0.15)<0.001; }));

  /* 第一次上傳（原本還沒有圖）時，濃度滑桿必須立刻可以動 */
  const NEWID=await p.evaluate(()=>{
    P.leader=true; P.tab='plan'; P.planDay=2; render();
    const b=[...document.querySelectorAll('[data-act="editItem"][data-id]')].filter(x=>x.getAttribute('data-id'))[0];
    b.click(); return b.getAttribute('data-id');
  });
  await wait(p,250);
  ck('還沒有圖時濃度是鎖住的',await p.evaluate(()=>document.getElementById('dbgOp').disabled));
  await p.setInputFiles('#dbgFile',PHOTO); await wait(p,900);
  ck('選了照片之後濃度立刻解鎖',await p.evaluate(()=>!document.getElementById('dbgOp').disabled));
  await p.evaluate(()=>{ const s=document.getElementById('dbgOp'); s.value=20;
    s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true})); });
  await wait(p,200);
  await p.click('#dbgApply'); await wait(p,1400);
  ck('第一次上傳就能指定濃度',await p.evaluate(id=>itemBg(id).op===20,NEWID),
     await p.evaluate(id=>(itemBg(id)||{}).op,NEWID));

  console.log('[5b] 同一個行程再上傳一張，要覆蓋掉舊的');
  const before=await p.evaluate(id=>itemBg(id).src.slice(-40),NEWID);
  const txtBefore='測試用未存文字';
  await p.evaluate(t=>{ document.querySelector('[name="title"]').value=t; },txtBefore);
  await p.setInputFiles('#dbgFile',at('audit/_bigphoto2.jpg')); await wait(p,900);
  await p.evaluate(()=>{ var s=document.getElementById('dbgZ'); s.value=250; s.dispatchEvent(new Event('input',{bubbles:true})); });
  await wait(p,200);
  await p.click('#dbgApply'); await wait(p,1400);
  const after=await p.evaluate(id=>itemBg(id).src.slice(-40),NEWID);
  ck('新圖真的蓋掉舊圖',before!==after);
  ck('套用後表單還開著',await p.evaluate(()=>!!document.getElementById('dbgF')));
  ck('套用後沒存的文字沒被沖掉',
     await p.evaluate(()=>document.querySelector('[name="title"]').value)===txtBefore);
  ck('套用後回到「已有圖」狀態',await p.evaluate(()=>
    document.getElementById('dbgCrop').hidden && document.getElementById('dbgApply').hidden &&
    !document.getElementById('dbgDel').hidden && !document.getElementById('dbgOp').disabled));

  console.log('[5c] 移除');
  await p.click('[data-act="dbgRemove"]'); await wait(p,400);
  ck('移除之後資料清乾淨',await p.evaluate(id=>!itemBg(id),NEWID));
  ck('移除之後按鈕回到初始狀態',await p.evaluate(()=>
    document.getElementById('dbgDel').hidden && document.getElementById('dbgOp').disabled &&
    !document.getElementById('dbgHint').hidden));
  ck('移除之後卡片沒有底圖',await p.evaluate(id=>{
    closeSheet(); P.leader=false; P.tab='plan'; P.planDay=2; render();
    return !document.querySelector('.stop.has-bg'); },NEWID));

  console.log('[6] 左右／上下移動');
  await openItem(p,3,0); await wait(p,250);
  await p.setInputFiles('#dbgFile',PHOTO); await wait(p,900);
  const mv0=await p.evaluate(()=>({x:document.getElementById('dbgX').disabled,y:document.getElementById('dbgY').disabled}));
  ck('剛載入時至少有一軸可以移動',!(mv0.x&&mv0.y),mv0);
  await p.evaluate(()=>{ var s=document.getElementById('dbgZ'); s.value=200; s.dispatchEvent(new Event('input',{bubbles:true})); });
  await wait(p,200);
  ck('放大之後左右可以移動',await p.evaluate(()=>!document.getElementById('dbgX').disabled));
  ck('放大之後上下可以移動',await p.evaluate(()=>!document.getElementById('dbgY').disabled));
  const mv=await p.evaluate(()=>{
    const s=document.getElementById('dbgX'); s.value=-60; s.dispatchEvent(new Event('input',{bubbles:true}));
    const t=document.getElementById('dbgY'); t.value=80; t.dispatchEvent(new Event('input',{bubbles:true}));
    return {tx:Math.round(DBG.tx),ty:Math.round(DBG.ty),px:DBG.px,py:DBG.py,
            xv:document.getElementById('dbgXV').textContent,yv:document.getElementById('dbgYV').textContent};
  });
  ck('左右滑桿真的推動了畫面',mv.tx<-5,mv);
  ck('上下滑桿真的推動了畫面',mv.ty>5,mv);
  ck('滑桿讀數對得起來',mv.px===-60&&mv.py===80,mv);
  ck('顯示文字有帶正負號',mv.xv==='-60%'&&mv.yv==='+80%',mv);
  /* 拖曳之後滑桿要跟著回寫 */
  const drag=await p.evaluate(()=>{
    DBG.tx=0; DBG.ty=0; dbgLayout();
    return {x:document.getElementById('dbgX').value,y:document.getElementById('dbgY').value};
  });
  ck('拖曳後滑桿同步歸零',drag.x==='0'&&drag.y==='0',drag);
  await p.click('#dbgApply'); await wait(p,1400);

  console.log('[7] 全團容量（30 個行程每個都放一張，最壞情況）');
  const cap=await p.evaluate(()=>{
    /* 直接拿已經壓好的那張複製到每個行程，量最壞情況的總量 */
    const src=Object.keys(photoMap()).map(k=>photoMap()[k]).filter(b=>b&&b.src)[0];
    const m=photoMap(); let n=0;
    items().forEach(x=>{ m[x.id]={src:src.src,op:9,kb:src.kb}; n++; });
    const t=photoTotal();
    return {items:n, n:t.n, kb:t.kb, json:Math.round(JSON.stringify(S().photos).length/1024)};
  });
  console.log('    行程數 '+cap.items+'／有圖 '+cap.n+'／底圖合計 '+cap.kb+' KB（整份 photos JSON '+cap.json+' KB）');
  ck('全部放滿仍在 600KB 預算內',cap.kb<=600,cap.kb+'KB');
  ck('容量提示文字會出現',await p.evaluate(()=>dbgTotText(photoTotal()).indexOf('KB')>0));

  console.log('[8] 瀏覽器不支援 WebP 編碼時要退回 JPEG');
  const r8=await p.evaluate(()=>new Promise(res=>{
    const orig=HTMLCanvasElement.prototype.toBlob;
    /* 模擬舊版 Safari：要 webp 卻默默給你 PNG */
    HTMLCanvasElement.prototype.toBlob=function(cb,type,q){
      if(type==='image/webp') return orig.call(this,cb,'image/png');
      return orig.call(this,cb,type,q);
    };
    const cv=document.createElement('canvas'); cv.width=360; cv.height=203;
    const cx=cv.getContext('2d'); cx.fillStyle='#345'; cx.fillRect(0,0,360,203);
    dbgEncode(cv,function(uri,size,type){
      HTMLCanvasElement.prototype.toBlob=orig;
      res({type:type,head:(uri||'').slice(0,20),size:size});
    });
  }));
  ck('退回 JPEG 而不是吐出 PNG',r8.type==='image/jpeg',r8);
  ck('資料 URI 開頭正確',r8.head.indexOf('data:image/jpeg')===0,r8.head);

  console.log('[9] 首頁完全不出現底圖（每一天、含高亮狀態）');
  const r9=await p.evaluate(()=>{
    /* 讓每個行程都有圖，這樣不管今天算第幾天，首頁都有機會抓到圖 */
    const m=photoMap(); const src=Object.keys(m).map(k=>m[k]).filter(b=>b&&b.src)[0];
    items().forEach(x=>{ m[x.id]={src:src.src,op:9,kb:src.kb}; });
    const out={days:[],hl:null};
    P.leader=false;
    for(let d=1;d<=(S().settings.days||5);d++){
      S().settings.dayOverride=d; P.tab='home'; render();
      const home=document.getElementById('view');
      out.days.push({d:d,
        hasBgCard:!!home.querySelector('.card.has-bg'),
        cbg:home.querySelectorAll('.cbg').length,
        uri:(home.innerHTML.match(/data:image\/(webp|jpeg)/g)||[]).length});
    }
    /* 高亮開著時也不能冒出來 */
    S().settings.dayOverride=2;
    S().settings.cards=S().settings.cards||{}; S().settings.cards.today={hl:1,hts:Date.now()};
    P.tab='home'; render();
    const home=document.getElementById('view');
    out.hl={wrap:!!home.querySelector('.hlw'), cbg:home.querySelectorAll('.cbg').length,
            uri:(home.innerHTML.match(/data:image\/(webp|jpeg)/g)||[]).length};
    delete S().settings.dayOverride; delete S().settings.cards.today;
    return out;
  });
  console.log('    ',JSON.stringify(r9));
  ck('首頁每一天都沒有 .has-bg 卡',r9.days.every(x=>!x.hasBgCard),r9.days);
  ck('首頁每一天都沒有底圖層',r9.days.every(x=>x.cbg===0),r9.days);
  ck('首頁完全不帶圖片資料（省流量）',r9.days.every(x=>x.uri===0),r9.days);
  ck('高亮確實有開（測試本身有效）',r9.hl.wrap,r9.hl);
  ck('高亮時首頁仍然沒有底圖',r9.hl.cbg===0&&r9.hl.uri===0,r9.hl);
  const src=require('fs').readFileSync(at('standalone.html'),'utf8');
  ck('程式碼裡已無首頁底圖的殘留',src.indexOf('dayHeroBg')<0&&src.indexOf('.card>.cbg')<0,
     {dayHeroBg:src.indexOf('dayHeroBg'),cbg:src.indexOf('.card>.cbg')});

  console.log('[10] 首頁「今日行程」不顯示一句話說明');
  const r10=await p.evaluate(()=>{
    const out={};
    ['simple','detail'].forEach(m=>{
      P.leader=false; P.planMode=m; S().settings.dayOverride=2; P.tab='home'; render();
      const card=[...document.querySelectorAll('.card')].filter(c=>/今日行程|第 1 天預告/.test(c.textContent))[0];
      const day=items().filter(x=>x.day===2);
      const descs=day.map(x=>x.desc).filter(Boolean);
      out[m]={found:card?descs.filter(d=>card.textContent.indexOf(d)>=0).length:-1,
              tdDesc:card?card.querySelectorAll('.td-desc').length:-1, n:descs.length};
    });
    /* 行程分頁的詳細模式不能被誤傷 */
    P.planMode='detail'; P.tab='plan'; P.planDay=2; render();
    out.plan={detail:document.querySelectorAll('.t-detail').length, desc:document.querySelectorAll('.t-desc').length};
    delete S().settings.dayOverride; P.planMode='simple';
    return out;
  });
  console.log('    ',JSON.stringify(r10));
  ck('這天的行程確實有一句話說明（測試本身有效）',r10.simple.n>0,r10.simple);
  ck('重點字卡模式下首頁沒有說明',r10.simple.found===0,r10.simple);
  ck('詳細模式下首頁也沒有說明',r10.detail.found===0,r10.detail);
  ck('首頁已無 .td-desc 元素',r10.simple.tdDesc===0&&r10.detail.tdDesc===0,r10);
  ck('行程分頁的詳細介紹不受影響',r10.plan.detail>0&&r10.plan.desc>0,r10.plan);
  ck('樣式表已無 .td-desc 殘留',
     require('fs').readFileSync(at('standalone.html'),'utf8').indexOf('.td-desc')<0);

  ck('全程無 JS 錯誤',errs.length===0,errs.slice(0,2));

  await ctx.close(); await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

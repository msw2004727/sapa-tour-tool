/* 用詞與住宿卡 LINE 按鈕
   這團是「團體自由行」，沒有領隊也沒有導遊。任何畫面、按鈕文字、aria-label 都不能出現「領隊」或「導遊」（v3.20 起也擋導遊）。
   住宿卡原本的「撥給○○」改成「LINE聯繫」，連到聯絡人設定的 LINE 加好友網址。 */
const {chromium,FILE}=require('./_lib');
let fails=0;
const ck=(n,c,x)=>{ if(!c){fails++;console.log('  ✗',n,x===undefined?'':JSON.stringify(x));} else console.log('  ✓',n); };

(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:375,height:667}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(FILE); await p.waitForTimeout(500);

  console.log('[1] 所有畫面都不出現「領隊」「導遊」（團員與管理模式都查）');
  const r=await p.evaluate(()=>{
    const found=[]; let screens=0;
    const tools=['menu','money','phrases','sos','esim','tips','power','entry','weather','exchange','phoneset','grab','health','market','basics','rollcall'];
    const check=(label)=>{ screens++;
      const t=document.body.innerText;
      for(const w of ['領隊','導遊']){ const i=t.indexOf(w);
        if(i>=0) found.push(label+'：…'+t.slice(Math.max(0,i-20),i+15).replace(/\n/g,' ')+'…'); }
      document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(el=>{
        const a=(el.getAttribute('aria-label')||'')+(el.getAttribute('title')||'')+(el.getAttribute('placeholder')||'');
        if(/領隊|導遊/.test(a)) found.push(label+'（屬性）：'+a); }); };
    for(const leader of [false,true]){
      const who=leader?'管理':'團員'; P.leader=leader;
      for(const d of [0,2,5]){ S().settings.dayOverride=d; P.tab='home'; render(); check(who+' 首頁 第'+d+'天'); }
      for(const tab of ['plan','rooms','groups']){ P.tab=tab; render(); check(who+' '+tab); }
      P.planMode='detail'; P.tab='plan'; for(let d=1;d<=5;d++){ P.planDay=d; render(); check(who+' 行程詳細 第'+d+'天'); } P.planMode='simple';
      P.tab='tools'; for(const t of tools){ P.tool=t; render(); check(who+' 工具 '+t); }
      P.tab='notes'; render(); check(who+' 記事本');
    }
    return {screens, found};
  });
  ck('檢查的畫面數夠多（測試本身有效）',r.screens>=56,r.screens);
  ck('沒有任何畫面出現「領隊」或「導遊」',r.found.length===0,r.found.slice(0,5));
  /* 原始碼層級再擋一次：表單、toast 這類不在畫面上的字也算 */
  const src=require('fs').readFileSync(require('./_lib').at('standalone.html'),'utf8');
  ck('組裝後的網頁原始碼沒有「領隊」',src.indexOf('領隊')<0,src.indexOf('領隊'));
  ck('組裝後的網頁原始碼沒有「導遊」',src.indexOf('導遊')<0,src.indexOf('導遊'));
  ck('走散卡的越文不再請人打給導遊（hướng dẫn viên）',src.indexOf('hướng dẫn viên')<0);

  console.log('[2] 住宿卡：LINE聯繫');
  const L=await p.evaluate(()=>{
    const open=()=>{ const c=[...document.querySelectorAll('.ccard')].find(x=>/目前住宿/.test(x.textContent));
      if(c&&!c.classList.contains('open')) c.querySelector('.chead').click();
      return [...document.querySelectorAll('.ccard')].find(x=>/目前住宿/.test(x.textContent)); };
    P.leader=false; P.cards={}; S().settings.dayOverride=2; P.tab='home';
    S().settings.contacts=[{name:'甲',label:'台灣電話',phone:'+886900000000',line:''},
                           {name:'乙',label:'台灣電話',phone:'+886911111111',line:'https://line.me/ti/p/TESTLINK'}];
    render(); let c=open();
    const btn=c&&c.querySelector('a.btn.line');
    const out={opened:!!(c&&c.classList.contains('open')), text:btn&&btn.textContent.trim(), href:btn&&btn.getAttribute('href'),
      target:btn&&btn.target, callLeft:c?[...c.querySelectorAll('a')].filter(a=>/撥給|tel:/.test(a.textContent+a.getAttribute('href'))).length:-1};
    S().settings.contacts.forEach(x=>x.line=''); render(); c=open();
    out.noLineBtn=c?c.querySelectorAll('a.btn.line').length:-1;
    return out;
  });
  ck('住宿卡展得開（測試本身有效）',L.opened,L);
  ck('按鈕文字是「LINE聯繫」',L.text==='LINE聯繫',L.text);
  ck('跳過沒填 LINE 的人，用第一個有填的連結',L.href==='https://line.me/ti/p/TESTLINK',L.href);
  ck('另開新分頁',L.target==='_blank',L.target);
  ck('住宿卡不再有撥電話按鈕',L.callLeft===0,L.callLeft);
  ck('沒有人填 LINE 時整顆不出現（不會是壞連結）',L.noLineBtn===0,L.noLineBtn);

  ck('全程無 JS 錯誤',errs.length===0,errs.slice(0,2));
  await b.close();
  console.log(fails?`\n${fails} 個問題`:'\n全部通過');
  process.exit(fails?1:0);
})();

const {chromium,FILE,at}=require('./_lib');
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:320,height:660},deviceScaleFactor:2});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(FILE);await p.waitForTimeout(800);
async function shot(name,fn,full){ await p.evaluate(fn); await p.waitForTimeout(300); await p.screenshot({path:at('shots/'+name+'.png'),fullPage:!!full}); }
// 團員視角
await shot('01-home-guest',()=>{P.leader=false;P.meId='';P.tab='home';P.tipDismissed=false;savePrefs();render();},true);
await shot('02-home-me',()=>{P.meId=members()[0].id;P.tipDismissed=true;savePrefs();render();},true);
await shot('03-plan',()=>{P.tab='plan';P.planDay=2;P.planMode='simple';render();},true);
await shot('04-plan-detail',()=>{P.planMode='detail';render();},true);
await shot('05-rooms',()=>{P.tab='rooms';P.roomsSeg='rooms';render();},true);
await shot('06-list',()=>{P.roomsSeg='list';render();},true);
await shot('07-groups',()=>{P.tab='groups';P.scn='meal';render();},true);
await shot('08-airline',()=>{P.scn='airline';render();},true);
await shot('09-tools',()=>{P.tab='tools';P.tool='menu';render();},true);
await shot('10-money',()=>{P.tool='money';render();},true);
await shot('11-phrases',()=>{P.tool='phrases';render();},true);
await shot('12-sos',()=>{P.tool='sos';render();},true);
await shot('13-notes',()=>{P.tab='notes';render();},true);
// 管理者視角
await shot('20-home-leader',()=>{P.leader=true;P.tab='home';savePrefs();render();},true);
await shot('21-plan-leader',()=>{P.tab='plan';P.planMode='simple';render();},true);
await shot('22-tools-leader',()=>{P.tab='tools';P.tool='menu';render();},true);
await shot('23-rollcall',()=>{P.tool='rollcall';render();},true);
await shot('24-settings',()=>{ACT.settings();},false);
await p.evaluate(()=>closeSheet());
await shot('25-broadcast-edit',()=>{ACT.editBroadcast();},false);
await p.evaluate(()=>closeSheet());
await shot('26-item-edit',()=>{P.tab='plan';render();document.querySelector('[data-act="editItem"]').click();},false);
await p.evaluate(()=>closeSheet());
await shot('27-taxi',()=>{ACT.fullTaxi();},false);
console.log(errs.length?errs:'no errors');
await b.close();})();

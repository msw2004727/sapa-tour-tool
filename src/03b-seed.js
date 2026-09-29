/* ===== 內建預設資料：空殼（v3.23）=====
   程式不再內建任何一團的行程與名單（小麥指定「清空原先焊死的內建名單與行程，留下空殼」）。
   新手機第一次打開、還沒同步到雲端的那一兩秒，看到的就是這個空殼；正式內容一律由主辦人在管理模式建立，
   或從雲端同步下來。唯一的例外是工具頁：預設放通用版範本（03a-tpl.js），出國常識一打開就有得看。
   測試：audit/_lib.js 會在網頁載入前把一團假資料放在 window.__SEED__（audit/fixture-trip.js），
   這裡逐份蓋過空殼；tools 可以寫範本名稱（例如 'vietnam'）。正式網站沒有這個變數。 */
var DEFAULTS=(function(){
  var d={settings:{},broadcast:{},itinerary:{items:[]},members:{items:[]},groups:{scenarios:[]},
    rollcall:{present:{}},notebook:{pages:[]},photos:{items:{}},tools:JSON.parse(JSON.stringify(TPL.generic.tools))};
  var s=(typeof window!=='undefined')&&window.__SEED__;
  if(s&&typeof s==='object') Object.keys(s).forEach(function(k){ var v=s[k];
    if(k==='tools'&&typeof v==='string'&&TPL[v]) v=JSON.parse(JSON.stringify(TPL[v].tools));
    if(v&&typeof v==='object') d[k]=v; });
  return d;
})();

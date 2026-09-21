/* ===== 工具分頁 ===== */
function backBar(title){ return '<div style="display:flex;align-items:center;gap:.5rem"><button class="btn sm" data-act="tool" data-tool="menu">‹ 工具</button><b style="font-size:1.15rem">'+title+'</b></div>'; }
VIEWS.tools=function(){
  switch(P.tool){
    case 'money': return toolMoney();
    case 'phrases': return toolPhrases();
    case 'sos': return toolSOS();
    case 'esim': return toolESIM();
    case 'tips': return toolTips();
    case 'power': return toolPower();
    case 'entry': return toolEntry();
    case 'weather': return toolWeather();
    case 'exchange': return toolExchange();
    case 'phoneset': return toolPhoneSetup();
    case 'grab': return toolGrab();
    case 'health': return toolHealth();
    case 'market': return toolMarket();
    case 'basics': return toolBasics();
    case 'rollcall': return P.leader?toolRollcall():toolMenu();
    default: return toolMenu();
  }
};
function toolMenu(){
  var st=S().settings, h=[];
  /* 裝成 App 的入口放在這裡：工具頁是團員最常回來的一頁，
     已經從主畫面開啟（standalone）就不用再出現 */
  var instBtn=isStandalone()?'':'<button class="inst-btn" data-act="installApp">'+ic(uaEnv().ios?'share':'install')+(uaEnv().ios?'加到主畫面':'安裝 App')+'</button>';
  h.push('<h2 class="sec">'+ic('grid')+'現場馬上用'+instBtn+'</h2><div class="stack">'+
    '<button class="btn big warn" data-act="fullTaxi">'+ic('taxi')+'<span class="b2">計程車回飯店卡<small>全螢幕越文，直接出示給司機</small></span></button>'+
    '<button class="btn big" data-act="tool" data-tool="money">'+ic('cash')+'<span class="b2">越幣點鈔速算<small>按鈔票就算台幣，不用打字</small></span></button>'+
    '<button class="btn big" data-act="tool" data-tool="phrases">'+ic('chat')+'<span class="b2">越語點餐與溝通圖卡<small>溫水、不要香菜、多少錢…</small></span></button>'+
    '<button class="btn big" data-act="tool" data-tool="sos">'+ic('alert')+'<span class="b2">緊急求助與走失卡<small>聯絡電話、113 / 115、駐外館處</small></span></button>'+
  '</div>');
  h.push('<h2 class="sec">'+ic('book')+'出發前先看</h2><div class="tool-grid">'+
    '<button class="tcard" data-act="tool" data-tool="entry">'+ic('ticket')+'<b>入境與通關</b><small>護照效期、帶多少現金</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="weather">'+ic('thermo')+'<b>天氣與穿搭</b><small>山上比你想的冷</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="phoneset">'+ic('phone')+'<b>手機出發前設定</b><small>關漫遊、先裝好</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="exchange">'+ic('cash')+'<b>換匯與付款</b><small>心算法、刷卡還付現</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="esim">'+ic('wifi')+'<b>eSIM 怎麼買</b><small>KKday、Saily</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="tips">'+ic('gift')+'<b>小費文化</b><small>給多少、哪些場合</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="power">'+ic('plug')+'<b>電壓與插頭</b><small>220V、雙圓孔</small></button>'+
    '<button class="tcard" data-act="tab" data-tab="notes">'+ic('book')+'<b>提醒記事本</b><small>小常識、行前準備</small></button>'+
  '</div>');
  h.push('<h2 class="sec">'+ic('mountain')+'在地小知識</h2><div class="tool-grid">'+
    '<button class="tcard" data-act="tool" data-tool="grab">'+ic('taxi')+'<b>Grab 叫車</b><small>先看價錢不喊價</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="health">'+ic('thermo')+'<b>身體不適</b><small>暈車、腸胃、上高山</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="market">'+ic('cash')+'<b>購物與禮儀</b><small>殺價、拍照、被推銷</small></button>'+
    '<button class="tcard" data-act="tool" data-tool="basics">'+ic('toilet')+'<b>廁所與飲水</b><small>自備衛生紙</small></button>'+
  '</div>');
  if(P.leader){
    h.push('<h2 class="sec">'+badgeSVG('lead')+'管理專區</h2><div class="stack">'+
      '<button class="btn big" data-act="tool" data-tool="rollcall">'+ic('clipboard')+'<span class="b2">集合點名<small>誰還沒到</small></span></button>'+
      '<button class="btn big" data-act="editBroadcast">'+ic('megaphone')+'<span class="b2">修改廣播<small>時間、地點、叮嚀</small></span></button>'+
      '<button class="btn big" data-act="settings">'+ic('gear')+'<span class="b2">團務設定<small>日期、PIN、電話</small></span></button>'+
      '<button class="btn big" data-act="pickHotel">'+ic('bed')+'<span class="b2">飯店資料<small>入住切換、Wi-Fi</small></span></button>'+
      '<button class="btn big" data-act="editTags">'+ic('flag')+'<span class="b2">防呆標籤<small>自訂增減、改名</small></span></button>'+
      '<button class="btn big" data-act="homeScnVis">'+ic('users')+'<span class="b2">首頁分組顯示<small>選擇哪些分組情境出現在首頁</small></span></button>'+
      '<button class="btn big" data-act="cardZones">'+ic('grid')+'<span class="b2">首頁卡片位置<small>卡片何時移到稍後／隨時查／收起</small></span></button>'+
      '<button class="btn big" data-act="prevList">'+ic('refresh')+'<span class="b2">還原上一版<small>資料突然變少時自動留下的備份</small></span></button>'+
    '</div><div class="row"><button class="btn dng" data-act="resetDemo">'+ic('refresh')+'重置為初始資料</button><button class="btn" data-act="leaderLock">'+ic('lock')+'鎖定管理模式</button></div>');
  }
  h.push('<div class="ver">月半越南團旅 v'+APP_VERSION+' · '+(Store.backend==='firebase'?'雲端同步':(Store.backend==='claude'?'預覽同步':'單機'))+'</div>');
  return h.join('');
}
/* eSIM 網路卡 */
function toolESIM(){
  return backBar('eSIM 網路卡怎麼買')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'什麼是 eSIM</div>'+
    '<p>不用換實體 SIM 卡，直接在手機裡「下載」一組越南門號上網。出國前在台灣就能買好，落地開機就有網路，不必到機場排隊買卡，也不會弄丟原本的 SIM 卡。</p></div>'+

  '<h2 class="sec">'+ic('cash')+'方法一：KKday</h2>'+
  '<div class="info-card"><p style="margin-bottom:.6rem">買完把 QR Code 寄到你的 email，自己掃描安裝。</p><ol class="steps">'+
    '<li>打開 KKday 網站或 App，搜尋「<b>越南 eSIM</b>」。</li>'+
    '<li>挑天數與流量。我們是 5 天 4 夜，選 <b>5～7 天</b>、每日 1～2GB 的方案就很夠用（看影片多的人選吃到飽）。</li>'+
    '<li>結帳後 <b>QR Code 會寄到你的 email</b>，沒收到請先看垃圾郵件匣。</li>'+
    '<li>出發前一天在家用 Wi-Fi 掃描 QR Code 安裝（安裝要有網路）。</li>'+
    '<li>落地越南後，到「設定 → 行動網路」把這張新的 eSIM 打開、開啟數據漫遊就會通。</li>'+
  '</ol>'+
  '<div class="warn-box" style="margin-top:.6rem">'+ic('alert')+'<span><b>QR Code 只能掃一次</b>，掃了就綁定那支手機，不能換機也不能刪掉重來。掃之前先確定是要用的那支手機。</span></div></div>'+

  '<h2 class="sec">'+ic('wifi')+'方法二：Saily App</h2>'+
  '<div class="info-card"><p style="margin-bottom:.6rem">買、裝、開通全部在同一個 App 裡完成。</p><ol class="steps">'+
    '<li>App Store／Google Play 下載 <b>Saily</b>，用 Apple ID 或 Google 帳號註冊。</li>'+
    '<li>點「Explore Plans」→ 搜尋 <b>Vietnam（越南）</b>，選流量與天數。</li>'+
    '<li>用信用卡、Apple Pay 或 Google Pay 付款。</li>'+
    '<li>付完在 App 裡點「<b>Install eSIM</b>」，iPhone 會自動加入行動方案；Android 到「設定 → 網路 → SIM → 下載 eSIM」。</li>'+
    '<li>Saily 的流量是<b>第一次連上越南電信時才開始算</b>，所以可以在台灣提早裝好，不會浪費天數。</li>'+
  '</ol></div>'+

  '<h2 class="sec">'+ic('alert')+'eSIM 注意須知</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>先確認手機支援 eSIM。</b>iPhone XS（2018）以後大多支援，但<b>在中國大陸買的 iPhone 幾乎都不支援</b>（只有 2026 年的 iPhone Air、17e 等少數新機才開放）；Android 看 Google Pixel 3 以後、三星 S20 以後的國際版，<b>台灣買的三星多半不支援</b>（連 S25 台灣版都沒有）。不確定就撥 <b>*#06#</b>，畫面有出現「EID」才代表支援。</li>'+
    '<li><b>安裝一定要有網路。</b>在台灣用家裡或飯店 Wi-Fi 裝好最保險，落地後才裝可能連不上網而卡住。</li>'+
    '<li><b>不要刪掉原本的台灣門號。</b>eSIM 是額外加一組，台灣號碼留著才能收簡訊驗證碼；只要把「行動數據」切到越南那張、台灣那張<b>關掉數據漫遊</b>就不會被扣漫遊費。</li>'+
    '<li><b>KKday 的 QR Code 只能掃一次</b>，Saily 可以在 App 內重新安裝，怕操作失誤的人選 Saily 比較保險。</li>'+
    '<li><b>eSIM 多半只有數據、沒有電話號碼</b>，不能打電話或收簡訊。要打電話請用 LINE、Messenger 語音通話。</li>'+
    '<li>落地後如果沒網路：關飛航模式再開一次 → 確認新 eSIM 已開啟 → 打開「數據漫遊」 → 還是不行就重開機。</li>'+
    '<li>沙壩山區、番西邦纜車上訊號會變差，這是正常的，不是卡有問題。</li>'+
    '<li>不想自己弄的人可以直接用飯店 Wi-Fi，或跟主辦人說，出發前一起處理。</li>'+
  '</ul></div>';
}
/* 小費文化 */
function toolTips(){
  return backBar('越南小費文化')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'一句話結論</div>'+
    '<p>越南<b>沒有強制小費</b>的規定，不給也不會被白眼。但在觀光區給一點是常見的禮貌，金額小、心意到就好。</p></div>'+
  '<h2 class="sec">'+ic('cash')+'常見場合與行情</h2>'+
  '<div class="info-card"><dl class="kv2">'+
    '<dt>飯店房務</dt><dd>每天 20,000～50,000 越盾，放在枕頭上或桌上</dd>'+
    '<dt>行李員</dt><dd>每件行李 20,000～50,000 越盾</dd>'+
    '<dt>餐廳</dt><dd>帳單如果已收 5～10% service charge 就不用再給；沒收的話留零錢即可</dd>'+
    '<dt>按摩</dt><dd>50,000～100,000 越盾，做得舒服再給</dd>'+
    '<dt>計程車 / Grab</dt><dd>不用給，湊整數不用找零就很夠</dd>'+
    '<dt>包車司機 / 導覽</dt><dd>大家一起出比較好處理，可以跟主辦人討論</dd>'+
  '</dl></div>'+
  '<h2 class="sec">'+ic('alert')+'給小費的眉角</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>準備小面額。</b>10,000、20,000、50,000 越盾各留幾張，不然只有 500,000 大鈔會很尷尬。</li>'+
    '<li><b>用越盾，不要給台幣或硬幣。</b>外幣硬幣他們換不掉，等於沒給。</li>'+
    '<li><b>雙手遞、面帶微笑</b>，或直接放在桌上；不要丟或塞。</li>'+
    '<li>服務讓你不舒服就<b>不用給</b>，不要有壓力。</li>'+
    '<li>小心「找零陷阱」：越盾 20,000 和 500,000 顏色接近，付錢與找零時<b>看清楚位數</b>再收。</li>'+
  '</ul></div>';
}
/* 電壓與插頭 */
function toolPower(){
  return backBar('電壓與插頭')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'越南的電</div>'+
    '<p><b>電壓 220V、頻率 50Hz</b>（台灣是 110V、60Hz）。插座大多是<b>雙圓孔</b>，很多飯店是圓孔與扁孔通用的萬用插座。</p></div>'+
  '<h2 class="sec">'+ic('check')+'哪些東西可以直接插</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>手機、平板、筆電、相機充電器：可以直接用。</b>這類變壓器上都印著「INPUT 100–240V」，本來就吃全球電壓。</li>'+
    '<li>台灣的<b>兩腳扁插頭</b>大多可以直接插進越南的萬用插座；插不進去就用一個小圓轉接頭（台灣的百元商店或機場都買得到）。</li>'+
    '<li>行動電源、行李秤、電動牙刷等 USB 充電的東西也都沒問題。</li>'+
  '</ul></div>'+
  '<h2 class="sec">'+ic('alert')+'這些千萬不要直接插</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>台灣帶去的吹風機、電湯匙、捲髮棒、小電鍋</b>——這類只吃 110V，直接插 220V 會燒掉甚至冒煙。飯店都有吹風機，不用自己帶。</li>'+
    '<li>插上去前先<b>看變壓器上的字</b>：有「100–240V」才安全，只寫「110V」就不能用。</li>'+
    '<li>轉接頭<b>只轉形狀、不會降電壓</b>，不要以為插了轉接頭就安全。真的要用 110V 電器要買「變壓器」。</li>'+
  '</ul></div>'+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'順帶提醒</div>'+
    '<p>沙壩山區偶爾會短暫停電，手機與行動電源<b>睡前先充飽</b>。夜臥火車上的插座不一定每個舖位都有，建議帶一顆行動電源。</p></div>';
}
/* 入境與通關（資料來源：外交部領事事務局越南國家簽證及入境須知，2026-09 查證） */
function toolEntry(){
  return backBar('入境與通關')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'一句話結論</div>'+
    '<p>台灣護照去越南<b>要簽證</b>，不是免簽。本團由旅行社統一辦理，你自己要顧的只有一件事：<b>護照效期夠不夠</b>。</p></div>'+

  '<h2 class="sec">'+ic('ticket')+'出發前自己核對這三項</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>護照效期至少還有 6 個月</b>（從入境日算起）。翻到護照個人資料頁看「效期截止日」，2027 年 3 月以後到期才安全；快到期就要馬上去換，別拖。</li>'+
    '<li><b>護照上的英文名要跟機票一模一樣。</b>拼錯一個字母就可能上不了飛機，收到電子機票就先對一次。</li>'+
    '<li><b>護照裡至少留兩頁空白</b>，入境與出境各要蓋一次章。舊護照蓋滿的人先確認一下。</li>'+
    '<li><b>簽證由旅行社辦。</b>如果你是自己辦，是上越南官方網站 <b>evisa.gov.vn</b> 申請電子簽證，約 3～7 個工作天，觀光簽效期不超過 90 天。認明這個網址，其他代辦網站收費高很多。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('cash')+'可以帶多少現金</h2>'+
  '<div class="info-card"><dl class="kv2">'+
    '<dt>外幣</dt><dd>超過 <b>5,000 美元</b>等值就要向海關申報</dd>'+
    '<dt>越南盾</dt><dd>超過 <b>1,500 萬越盾</b>要申報</dd>'+
    '<dt>黃金</dt><dd>金塊禁止攜入；18K 以上金飾<b>超過 300 公克</b>要申報</dd>'+
  '</dl><div class="warn-box" style="margin-top:.6rem">'+ic('alert')+'<span>五天的行程用不到那麼多現金，<b>正常帶不會超過門檻</b>，這段只是讓你知道界線在哪。身上金項鍊金手鐲之類的日常配戴不用緊張。</span></div></div>'+

  '<h2 class="sec">'+ic('walk')+'下飛機之後的順序</h2>'+
  '<div class="info-card"><ol class="steps">'+
    '<li>跟著人群走到<b>證照查驗（Immigration）</b>，排「Foreigners／外國人」那排。</li>'+
    '<li>把<b>護照</b>交給櫃檯人員，可能會請你看鏡頭拍照、按指紋。不用講話，聽不懂就微笑等他指示。</li>'+
    '<li>蓋完章往前走，看螢幕找我們的班機號碼，到<b>行李轉盤</b>提行李。</li>'+
    '<li>出口前是<b>海關</b>，沒有要申報的東西就走綠色通道直接出去。</li>'+
    '<li>出關後在大廳等，<b>跟緊大家、不要自己先走</b>。</li>'+
  '</ol></div>'+

  '<h2 class="sec">'+ic('alert')+'護照怎麼顧</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>護照絕對不要放托運行李。</b>隨身背包貼身放，過關後就收好。</li>'+
    '<li>出發前<b>拍一張護照資料頁</b>存在手機相簿，再印一份紙本放行李箱。萬一遺失，補辦會快很多。</li>'+
    '<li>飯店入住時櫃檯可能會收走護照登記，<b>記得當天要回來</b>，離開飯店前確認拿回。</li>'+
    '<li>護照掉了先找主辦人，並聯絡駐越南台北經濟文化辦事處（電話在「緊急求助」頁）。</li>'+
  '</ul></div>';
}
/* 沙壩天氣與穿搭（氣溫資料：climatestotravel.com 沙壩九月月均值，2026-09 查證） */
function toolWeather(){
  return backBar('沙壩天氣與穿搭')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'一句話結論</div>'+
    '<p>沙壩在<b>海拔 1,500 公尺</b>的山上，九月白天約 <b>21 度</b>、晚上會降到 <b>16 度</b>，而且十天有六天在下雨。台灣同期還在三十幾度，<b>溫差比你想像的大</b>。</p></div>'+

  '<h2 class="sec">'+ic('thermo')+'各地溫度差很多</h2>'+
  '<div class="info-card"><dl class="kv2">'+
    '<dt>河內（平地）</dt><dd>悶熱潮濕，跟台灣夏天差不多</dd>'+
    '<dt>沙壩（1,500m）</dt><dd>白天約 21 度、夜裡約 16 度，早晚涼</dd>'+
    '<dt>番西邦山頂（3,143m）</dt><dd>比沙壩鎮上<b>再低約 10 度</b>，加上山頂風大，體感可能只有幾度</dd>'+
  '</dl><div class="warn-box" style="margin-top:.6rem">'+ic('alert')+'<span>上番西邦那天<b>一定要帶外套</b>，不要看沙壩鎮上出太陽就輕裝上山。纜車上去只要十幾分鐘，溫度卻差一大截。</span></div></div>'+

  '<h2 class="sec">'+ic('coat')+'這樣穿最省事</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>洋蔥式穿法</b>：短袖或薄長袖打底，外面一件薄外套，最外面一件<b>防風防潑水外套</b>。熱了脫、冷了加，比穿一件厚的好用。</li>'+
    '<li><b>鞋子要防滑。</b>山區石板路、梯田步道下過雨很滑，穿包鞋或運動鞋，不要穿新鞋或拖鞋。</li>'+
    '<li><b>帶輕便雨衣，勝過雨傘。</b>山上風大，傘常常撐不住，雨衣還能擋風。</li>'+
    '<li>怕冷的人多帶一條<b>薄圍巾或帽子</b>，脖子跟頭保暖，體感差很多。</li>'+
    '<li>行李裡放一套<b>乾的替換衣物</b>，淋濕了有得換。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('rain')+'雨季尾巴要有心理準備</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li>九月是沙壩雨量最多的月份之一（月雨量約 315 毫米、約 20 個雨天），<b>遇到下雨是正常的</b>，通常是陣雨不是整天下。</li>'+
    '<li>山上常起<b>雲霧</b>，看不看得到雲海要碰運氣；霧散得快，等一下再看常有驚喜。</li>'+
    '<li>雨後<b>石階很滑</b>，走路手不要插口袋，慢慢走。</li>'+
    '<li>房間可能<b>濕氣重、沒有暖氣</b>，怕冷的人可以請飯店多給一條被子。</li>'+
  '</ul></div>';
}
/* 換匯與付款 */
function toolExchange(){
  var r=Number(S().settings.vndPerTwd)||820;
  return backBar('換匯與付款')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'先記這個心算法</div>'+
    '<p><b>越盾去掉三個零，再乘以 1.2，就是台幣。</b><br>例如 100,000 盾 → 去掉三個零剩 100 → ×1.2 ＝ <b>約 120 台幣</b>。<br>算不出來就用工具頁的「越幣點鈔速算」，按鈔票就好，不用打字。</p></div>'+

  '<h2 class="sec">'+ic('cash')+'在哪裡換錢</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>台灣的銀行也能換越南盾，但匯率通常比較差。</b>多數人是在台灣先換好美金，到越南再換成越盾，或直接在當地提款。</li>'+
    '<li><b>機場換一點就好。</b>機場匯率差，換夠當天車資與零用即可，其餘到市區再換。</li>'+
    '<li><b>ATM 提款</b>方便但每筆有手續費，還可能被台灣的銀行再收一次；要用的人出發前先確認金融卡有開通海外提款與密碼。</li>'+
    '<li>換錢時<b>當場點清楚再走</b>，並要求多給一些小面額。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('alert')+'越南盾的三個坑</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>零很多。</b>一碗河粉五萬盾聽起來嚇人，其實約 60 台幣。看到價格先去掉三個零再算。</li>'+
    '<li><b>顏色很像。</b>20,000（藍）和 500,000（藍綠）容易看錯，付錢跟找零都要<b>看清楚位數</b>，一張差 25 倍。</li>'+
    '<li><b>小費與零錢要小面額。</b>10,000、20,000、50,000 各留幾張，只有大鈔會很難處理。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('ticket')+'刷卡還是付現</h2>'+
  '<div class="info-card"><dl class="kv2">'+
    '<dt>飯店、大餐廳</dt><dd>可以刷卡，記得選<b>用越盾結帳</b>（選台幣結帳匯率較差）</dd>'+
    '<dt>市場、小攤、路邊攤</dt><dd>只收現金，準備小鈔</dd>'+
    '<dt>計程車 / Grab</dt><dd>現金最保險；Grab 也可綁卡</dd>'+
    '<dt>參考匯率</dt><dd>1 台幣 ≈ '+r+' 越盾（可在團務設定更新）</dd>'+
  '</dl></div>';
}
/* 手機出發前設定 */
function toolPhoneSetup(){
  return backBar('手機出發前設定')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'為什麼要先弄</div>'+
    '<p>這幾件事<b>在台灣用 Wi-Fi 做只要十分鐘</b>，落地後沒網路才弄會很麻煩。出發前一晚照著做一次就好。</p></div>'+

  '<h2 class="sec">'+ic('alert')+'第一件事：關掉數據漫遊</h2>'+
  '<div class="info-card"><p style="margin-bottom:.6rem">這是最容易收到高額帳單的地方，出發前一定要關。</p><ul class="dots">'+
    '<li><b>iPhone：</b>設定 → 行動服務 → 找到你的台灣門號 → 把「數據漫遊」關掉。</li>'+
    '<li><b>Android：</b>設定 → 網路和網際網路 → SIM 卡 → 關閉「數據漫遊」。</li>'+
    '<li>台灣門號<b>不要整個關掉</b>，留著才能收銀行或驗證碼簡訊，只關「數據漫遊」即可。</li>'+
    '<li>有買 eSIM 的人，上網走 eSIM，作法看「eSIM 網路卡怎麼買」那張卡。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('down')+'出發前先裝好、先下載好</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>Grab</b>（叫車用）：註冊要用手機號碼收簡訊驗證，<b>一定要在台灣用台灣門號註冊好</b>，落地才裝常常收不到驗證碼。</li>'+
    '<li><b>Google 地圖離線地圖</b>：搜尋「Sa Pa」→ 點地名 → 下載 → 下載離線地圖。沒網路也能看自己在哪。</li>'+
    '<li><b>Google 翻譯</b>：進 App 把「越南文」語言包下載成離線，相機即時翻譯菜單很好用。</li>'+
    '<li><b>本工具站</b>：用瀏覽器打開後「加入主畫面」，之後像 App 一樣點開，沒網路也看得到。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('phone')+'存好這些資料</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li>把<b>主辦人電話</b>存進通訊錄（緊急求助頁有）。</li>'+
    '<li><b>飯店名稱與地址截圖</b>存在相簿，走散時可以直接給司機看——本工具站的「計程車回飯店卡」已經是越文版，更好用。</li>'+
    '<li>護照資料頁拍照存起來。</li>'+
    '<li><b>把手機的緊急聯絡人設定好</b>，並記得帶<b>行動電源</b>；山區冷、訊號差，電量掉得比平常快。</li>'+
  '</ul></div>'+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'打電話怎麼打</div>'+
    '<p>eSIM 多半只有上網、沒有電話號碼。要聯絡團員請用 <b>LINE 免費通話</b>；打當地電話（飯店、餐廳）才需要用台灣門號直撥，會算國際漫遊費。</p></div>';
}
/* 越幣速算 */
function twd(vnd){ var r=Number(S().settings.vndPerTwd)||820; return Math.round(vnd/r); }
function fmtVND(v){ return String(v).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
function toolMoney(){
  var total=P.money.reduce(function(a,b){return a+b;},0), r=Number(S().settings.vndPerTwd)||820;
  return backBar('越幣點鈔速算')+
    '<div class="warn-box">'+ic('alert')+'<span><b>20,000 與 500,000 都是藍色系</b>、10,000 與 200,000 都偏紅褐色——付錢前請數清楚後面幾個零！</span></div>'+
    '<div class="total"><div class="muted">已點 '+P.money.length+' 張 · 合計</div><div class="v">'+fmtVND(total)+' 盾</div><div class="t">≈ NT$ '+fmtVND(twd(total))+'</div><div class="r">1 台幣 ≈ '+r+' 盾（'+(P.leader?'<a href="#" data-act="settings">可修改</a>':'團務設定')+'）</div></div>'+
    '<div class="notes">'+NOTES.map(function(n){ return '<button class="note" data-act="noteTap" data-v="'+n.v+'"><span class="sw" style="background:'+n.color+'"></span><span class="nt">'+fmtVND(n.v)+'<small>'+esc(n.note)+'</small></span><span class="nv">≈ NT$ '+twd(n.v)+'</span></button>'; }).join('')+'</div>'+
    '<div class="row"><button class="btn" data-act="moneyUndo">退一張</button><button class="btn" data-act="moneyClear">全部清除</button></div>'+
    '<section class="card"><div class="card-h"><h2>'+ic('refresh')+'反過來算：我想付台幣</h2></div><div class="f"><label>台幣金額</label><input class="in" id="twdIn" type="number" inputmode="numeric" placeholder="例如 300"></div><div class="total" style="margin-top:.6rem"><div class="v" id="twdOut">—</div><div class="muted">盾（大約）</div></div></section>'+
    '<button class="btn block soft" data-act="nbGo" data-id="money">'+ic('book')+'更多金錢與購物小技巧</button>';
}
/* 越語圖卡 */
/* 兩層：先選類別（P.phCat 空字串＝還在類別清單），再看該類的圖卡 */
function toolPhrases(){
  var cat=PHRASE_CATS.filter(function(c){return c.id===P.phCat;})[0];
  if(!cat) return backBar('越語溝通圖卡')+
    '<div class="muted">先選類別，再點你要說的那一句。點下去會放大成全螢幕，直接把手機拿給對方看；每一句都附空耳中文，照著念也通。</div>'+
    '<div class="stack">'+PHRASE_CATS.map(function(c){
      var n=PHRASES.filter(function(p){return p.cat===c.id;}).length;
      return '<button class="ph" data-act="phCat" data-cat="'+c.id+'"><span class="e">'+c.e+'</span>'+
        '<span class="tx"><span class="zh">'+esc(c.name)+'</span><br><span class="vi">'+esc(c.sub)+'</span></span>'+
        '<span class="phn">'+n+' 句</span>'+ic('arrow')+'</button>';
    }).join('')+'</div>';
  return '<div style="display:flex;align-items:center;gap:.5rem"><button class="btn sm" data-act="phCat" data-cat="">‹ 類別</button><b style="font-size:1.15rem">'+c_e(cat)+esc(cat.name)+'</b></div>'+
    '<div class="muted" style="margin-top:.5rem">綠色那行是空耳中文，照著念就有七八分像。</div>'+
    '<div class="stack">'+PHRASES.map(function(p,i){
      if(p.cat!==cat.id) return '';
      return '<button class="ph" data-act="phrase" data-i="'+i+'"><span class="e">'+p.e+'</span>'+
        '<span class="tx"><span class="zh">'+esc(p.zh)+'</span><br><span class="vi">'+esc(p.vi)+'</span>'+
        (p.say&&p.say.charAt(0)!=='（'?'<br><span class="say-s">'+esc(p.say)+'</span>':'')+'</span>'+ic('arrow')+'</button>';
    }).join('')+'</div>';
}
function c_e(c){ return '<span style="margin-right:.3rem">'+c.e+'</span>'; }
function phraseFull(p){
  var st=S().settings;
  return '<div class="fh"><b>出示給對方看</b><button class="btn sm" data-act="fullClose">'+ic('x')+'關閉</button></div>'+
    '<div style="font-size:3rem;text-align:center">'+p.e+'</div>'+
    '<div class="fk">TIẾNG VIỆT · 越文</div><div class="vi xl">'+esc(p.vi)+'</div>'+
    '<div class="fk">中文意思</div><div class="zh">'+esc(p.zh)+'</div>'+
    (p.say?'<div class="fk">空耳中文 · 照著念</div><div class="say">'+esc(p.say)+'</div>':'')+
    (p.lost?'<div class="fk">LIÊN HỆ · 請幫我打這些電話</div>'+contactLinks():'')+
    '<div class="foot">Xin cảm ơn! 謝謝您的幫忙。</div>';
}
function contactLinks(){ return contacts().map(function(c){ return !c.phone?'':'<a class="ph-big" href="'+telHref(c.phone)+'">'+ic('phone')+'<span>'+esc(fmtPhone(c.phone))+'<small style="display:block;font-size:.85rem;color:#666;font-weight:800">'+esc(c.name)+(c.label?' · '+esc(c.label):'')+'</small></span></a>'; }).join(''); }
var FULL_LOCK=false;
function lockBar(){ return '<div class="lockbar" id="lockBar">'+(FULL_LOCK
  ?'<button class="btn sm pri" data-act="fullUnlock" id="unlockBtn">'+ic('lock')+'按住 2 秒解鎖</button><span>畫面已鎖定，不怕誤觸</span>'
  :'<button class="btn sm" data-act="fullLock">'+ic('unlock')+'鎖定畫面</button><span>把手機亮度調到最亮，遞給對方看</span>')+'</div>'; }
function taxiFull(){
  var st=S().settings, ho=hotel();
  return '<div class="fh"><b>出示給計程車司機</b>'+(FULL_LOCK?'':'<button class="btn sm" data-act="fullClose">'+ic('x')+'關閉</button>')+'</div>'+lockBar()+
    '<div class="vi xl">Làm ơn đưa tôi về khách sạn này. Cảm ơn!</div><div class="zh">請載我回這間飯店，謝謝！</div>'+
    '<div class="fk">KHÁCH SẠN · 飯店</div><div class="vi">'+esc(ho.nameVi||ho.name||'')+'</div>'+
    '<div class="fk">ĐỊA CHỈ · 地址</div><div class="vi">'+esc(ho.addrVi||'')+'</div>'+
    (ho.phone?'<div class="fk">ĐIỆN THOẠI KHÁCH SẠN · 飯店電話</div><a class="ph-big" href="'+telHref(ho.phone)+'">'+ic('phone')+esc(fmtPhone(ho.phone))+'</a>':'')+
    '<div class="fk">LIÊN HỆ · 緊急聯絡</div>'+contactLinks()+
    '<div class="foot">小提醒：上車前先問「Bao nhiêu tiền?」（多少錢）並講好價；請餐廳或飯店幫忙叫車、或用 Grab 叫車最穩妥。鎮內短程車資多在幾萬盾之間，喊價太高可以微笑婉拒。</div>';
}
/* Grab 叫車（沙壩可用性：sapanomad.com，2026-09 查證） */
function toolGrab(){
  return backBar('Grab 叫車')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'為什麼推薦用 Grab</div>'+
    '<p>Grab 是東南亞版的計程車 App。<b>叫車前就看得到車資、直接在 App 付或現金付</b>，不用喊價也不怕繞路，對不會講越南文的人最安全。</p></div>'+

  '<h2 class="sec">'+ic('alert')+'最重要：註冊要在台灣先做</h2>'+
  '<div class="info-card"><div class="warn-box">'+ic('alert')+'<span>Grab 註冊要用<b>手機號碼收簡訊驗證碼</b>。出國買的 eSIM 多半<b>只有上網、沒有電話號碼</b>，落地才註冊會收不到驗證碼卡住。<b>請在台灣就用台灣門號註冊完成。</b></span></div>'+
    '<ol class="steps" style="margin-top:.6rem">'+
    '<li>App Store／Google Play 搜尋「<b>Grab</b>」下載。</li>'+
    '<li>用<b>台灣手機號碼</b>註冊，收簡訊填驗證碼。</li>'+
    '<li>填姓名、email 就完成了，可以不綁信用卡（到時選現金付款）。</li>'+
  '</ol></div>'+

  '<h2 class="sec">'+ic('taxi')+'怎麼叫車</h2>'+
  '<div class="info-card"><ol class="steps">'+
    '<li>打開 App，上面那格是<b>上車地點</b>（通常自動抓你現在位置），下面那格輸入<b>目的地</b>。看不懂越南地名就從地圖上點，或先在 Google 地圖找好、複製名稱貼上。</li>'+
    '<li>選車型：<b>Car 是四人座轎車</b>（推薦），Bike 是機車載客，長輩不建議。</li>'+
    '<li>螢幕會直接顯示<b>車資</b>，覺得可以就按下訂。</li>'+
    '<li>配對後會出現<b>司機姓名、車型、車牌號碼</b>。上車前<b>核對車牌</b>，不對就不要上。</li>'+
    '<li>到了付現金或 App 扣款。車資已經談好，<b>不用再議價</b>。</li>'+
  '</ol></div>'+

  '<h2 class="sec">'+ic('mountain')+'沙壩的實際狀況</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li>沙壩<b>叫得到 Grab，但司機比河內少很多</b>，<b>清晨與深夜特別難叫</b>，可能等比較久或叫不到。</li>'+
    '<li>另一個選擇是 <b>Xanh SM</b>（越南的電動計程車，車身是青綠色），沙壩也有跑，可以用它的 App 叫，路邊也招得到。</li>'+
    '<li>叫不到車就<b>請飯店櫃檯幫忙叫</b>，這是最穩的方法，也可以請他們先問好價錢。</li>'+
    '<li>從老街火車站到沙壩這段山路<b>不適合用 App</b>，一般是搭接駁巴士或共乘小巴，跟著團走就好。</li>'+
    '<li>真的要搭路邊計程車，上車前先問「Bao nhiêu tiền?（包 妞 電）多少錢」講好價，或請司機<b>開計費表</b>。</li>'+
  '</ul></div>'+
  '<button class="btn block soft" data-act="fullTaxi">'+ic('taxi')+'打開計程車回飯店卡</button>';
}
/* 身體不適怎麼辦 */
function toolHealth(){
  return backBar('身體不適怎麼辦')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'先講最重要的</div>'+
    '<p>在國外不舒服，<b>第一件事是告訴主辦人</b>，不要自己忍。早講可以調整行程、早點就醫；忍到晚上或上了山才說，處理起來麻煩很多。</p></div>'+

  '<h2 class="sec">'+ic('mountain')+'上番西邦會不會高山症</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li>沙壩鎮上海拔約 1,500 公尺，<b>一般不會有高山反應</b>。</li>'+
    '<li>番西邦山頂 <b>3,143 公尺</b>，纜車幾分鐘就上去，有些人會覺得<b>頭悶、喘、走幾步就累</b>，這在高海拔是常見反應。</li>'+
    '<li>上去以後<b>走慢一點、少講話、不要跑跳</b>，山頂那幾百階不必勉強走完，坐著看風景一樣值得。</li>'+
    '<li>覺得頭痛、噁心、喘不過來，<b>就往下走、搭纜車下山</b>，下降高度是最有效的方法，並且告訴主辦人。</li>'+
    '<li>本來就有心臟、肺部或高血壓問題的人，上山前<b>先跟主辦人說一聲</b>，行程中互相照應。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('bus')+'暈車</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li>河內到沙壩的山路<b>彎道很多</b>，容易暈車的人請提早跟主辦人說，<b>坐前排</b>會好很多。</li>'+
    '<li>上車前<b>不要吃太飽</b>，也不要空腹。</li>'+
    '<li>會暈車的人<b>自己從台灣帶慣用的暈車藥</b>，出發前一段時間先吃（依你平常的習慣或藥師指示）。</li>'+
    '<li>車上<b>看遠方、不要滑手機</b>，開一點窗透氣。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('meal')+'腸胃不舒服</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>只喝瓶裝水</b>，開瓶前確認封膜完好；水龍頭的水不要生飲，刷牙用瓶裝水比較保險。</li>'+
    '<li>生冷的食物（生菜、生魚、切好的水果）與<b>來路不明的冰塊</b>斟酌，腸胃弱的人避開。</li>'+
    '<li>吃東西前<b>洗手或用乾洗手</b>。</li>'+
    '<li>拉肚子時<b>先補水</b>（瓶裝水、電解質飲料），少量多次；狀況沒改善或有發燒，跟主辦人說並就醫。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('thermo')+'藥品自己帶</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>慢性病藥一定要帶足全程的量</b>，放隨身行李不要托運，並多帶幾天備用。</li>'+
    '<li>把藥名或藥袋<b>拍照存手機</b>，萬一需要就醫，可以直接給醫生看。</li>'+
    '<li>常備：個人習慣的<b>止痛、感冒、腸胃、暈車、OK 繃</b>。台灣帶慣用的最安心，越南藥局的品項與名稱不一定對得上。</li>'+
    '<li>越南藥局招牌寫 <b>Nhà thuốc</b>，市區很常見。找藥局或看醫生的越南話，在「越語溝通圖卡 → 身體不適」那一類裡。</li>'+
  '</ul></div>'+

  '<div class="warn-box">'+ic('alert')+'<span><b>緊急狀況打 115（救護車）</b>，並立刻聯絡主辦人。電話都在「緊急求助」頁，一鍵可撥。</span></div>'+
  '<button class="btn block soft" data-act="tool" data-tool="sos">'+ic('alert')+'前往緊急求助頁</button>';
}
/* 購物殺價與少數民族禮儀 */
function toolMarket(){
  return backBar('購物與當地禮儀')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'沙壩的市場長什麼樣</div>'+
    '<p>沙壩是<b>黑苗族、紅瑤族</b>等少數民族的聚居地，市場與街上會看到穿著傳統服飾的婦女賣手工織品、銀飾、草藥。東西有特色，但<b>幾乎都要議價</b>。</p></div>'+

  '<h2 class="sec">'+ic('cash')+'殺價怎麼開口</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>觀光區開價通常偏高。</b>心裡先想好「這東西我願意付多少」，從對方開價的<b>一半左右</b>開始談，通常會落在中間。</li>'+
    '<li><b>不想買就不要問價。</b>一問價對方就會認真跟你談，之後不買容易尷尬、也容易被纏著。</li>'+
    '<li><b>轉身走是最有效的一招。</b>價錢談不下來就微笑說謝謝離開，可以接受的話對方多半會叫住你。</li>'+
    '<li><b>多買可以要求算便宜一點</b>，同一攤買三件比分開買三攤好談。</li>'+
    '<li>付錢前<b>再確認一次金額與位數</b>（越南盾零很多，20,000 和 500,000 容易看錯），找零當場點清楚。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('walk')+'被小販跟著怎麼辦</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li>沙壩街上常有婦女或小孩<b>一路跟著推銷</b>，這是當地常態，不是針對你，也<b>沒有危險</b>。</li>'+
    '<li>不想買就<b>看著對方、微笑、清楚說「Không, cảm ơn（空，感 恩）」不用了謝謝</b>，然後繼續走。含糊其辭或一直笑而不答，反而會被跟更久。</li>'+
    '<li><b>不要停下來翻看商品</b>，一旦拿在手上就很難脫身。</li>'+
    '<li>對方幫你帶路、陪你走一段之後才開口要錢，是常見情況；<b>不需要的協助一開始就婉拒</b>。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('camera')+'拍照的禮貌</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>拍人之前先問一聲</b>，舉起相機比個手勢、看對方點不點頭。少數民族長輩不見得喜歡被拍。</li>'+
    '<li><b>不要對著小孩猛拍</b>，也不要拍完就走；有些地方拍照後會被要求付費，先問清楚再拍。</li>'+
    '<li>進入村寨、民宅或有宗教意味的地方，<b>先問可不可以進、可不可以拍</b>。</li>'+
    '<li>大家一起拍團體照時<b>注意腳下</b>，梯田田埂窄又滑。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('heart')+'一個小提醒</h2>'+
  '<div class="info-card"><p>路上會遇到賣東西或討錢的孩子。<b>不建議直接給錢或糖果</b>——這會讓家長更傾向讓孩子上街而不是上學。真的想幫忙，<b>跟大人買一件他們做的東西</b>，比較實際。</p></div>';
}
/* 廁所與飲水 */
function toolBasics(){
  return backBar('廁所與飲水')+
  '<div class="info-card"><div class="ic-h">'+ic('info')+'兩句話結論</div>'+
    '<p><b>衛生紙自己帶，用完丟垃圾桶不要丟馬桶；水只喝瓶裝的。</b>這兩件事做到，旅途會順很多。</p></div>'+

  '<h2 class="sec">'+ic('toilet')+'廁所</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>隨身帶一包衛生紙與濕紙巾。</b>景區、休息站、山區的廁所經常沒有供應，這是最常後悔沒帶的東西。</li>'+
    '<li><b>用過的衛生紙丟旁邊的垃圾桶</b>，不要丟進馬桶。當地管線細，很容易堵住。</li>'+
    '<li>觀光區廁所<b>有時要收費</b>（幾千盾），身上留一點零錢。</li>'+
    '<li>看到廁所就先去，<b>不要等到上車前才去</b>。山路一開就是一段路，中間不一定有地方停。</li>'+
    '<li>找廁所的越南話：<b>Nhà vệ sinh ở đâu?（呀 唯 星 兒 鬥）</b>，圖卡在「交通與問路」那一類。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('cup')+'喝水</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li><b>只喝瓶裝水</b>，開瓶前看一下<b>封膜是否完整</b>。飯店房間每天會附贈幾瓶。</li>'+
    '<li><b>水龍頭的水不要生飲</b>；講究一點的人連刷牙都用瓶裝水。</li>'+
    '<li>餐廳的<b>冰塊</b>：正規餐廳多半用製冰廠的乾淨冰塊（中間有孔的圓柱狀），路邊小攤的碎冰腸胃弱的人就避開。不想加冰就出示「溫開水，不加冰」那張圖卡。</li>'+
    '<li>山上早晚涼，<b>喝溫水比冰水舒服</b>，帶個保溫瓶請餐廳或飯店裝熱水很方便。</li>'+
  '</ul></div>'+

  '<h2 class="sec">'+ic('check')+'其他小事</h2>'+
  '<div class="info-card"><ul class="dots">'+
    '<li>吃飯前<b>用乾洗手</b>，山區洗手台不一定有肥皂。</li>'+
    '<li>飯店的<b>牙刷牙膏不一定會附</b>，習慣用自己的就自己帶。</li>'+
    '<li>山區<b>濕氣重</b>，衣服不容易乾，多帶一雙襪子與一套換洗會比較舒服。</li>'+
  '</ul></div>';
}
/* 緊急求助 */
function toolSOS(){
  var st=S().settings;
  function row(t,s2,p,cls,ln){ return '<div class="em-row"><div class="t"><b>'+esc(t)+'</b><span>'+esc(s2)+'</span></div>'+(p?'<a class="btn '+(cls||'')+'" href="'+telHref(p)+'">'+ic('phone')+esc(fmtPhone(p))+'</a>':(ln?'':'<span class="muted">'+(P.leader?'<a href="#" data-act="settings">請填入</a>':'尚未填入')+'</span>'))+(ln?'<a class="btn line" href="'+esc(ln)+'" target="_blank" rel="noopener">'+ic('chat')+'加 LINE</a>':'')+'</div>'; }
  var lostIdx=PHRASES.findIndex(function(p){return p.lost;});
  return backBar('緊急求助')+
    '<button class="btn big warn" data-act="phrase" data-i="'+lostIdx+'">'+ic('alert')+'<span class="b2">我走散了：出示這張卡<small>越文請路人幫忙打電話</small></span></button>'+
    '<h2 class="sec">'+ic('phone')+'緊急聯絡人</h2><div class="stack">'+
    contacts().map(function(c){ return row(c.name,c.label||'',c.phone,'pri',c.line||''); }).join('')+
    (contacts().length?'':'<div class="card muted">尚未設定聯絡人'+(P.leader?'，請到團務設定填入':'')+'</div>')+
    '</div><h2 class="sec">'+ic('alert')+'越南當地與官方專線</h2><div class="stack">'+
    row('越南報警','Công an · 24 小時','113')+
    row('救護車','Cấp cứu · 24 小時','115')+
    row('消防','Cứu hỏa · 24 小時','114')+
    row('外交部急難救助專線','境外撥打，24 小時（付費）','+886800085095')+
    row('駐越南台北辦事處','河內 · 急難救助專線',st.embassyPhone)+
    '</div>'+
    '<button class="btn block soft" data-act="nbGo" data-id="lost">'+ic('book')+'萬一走散，這樣做</button>';
}
/* 集合點名（管理者） */
function toolRollcall(){
  var rc=S().rollcall||{present:{}}, ms=members(), b=S().broadcast||{};
  var present=ms.filter(function(m){return rc.present&&rc.present[m.id];});
  var missing=ms.filter(function(m){return !(rc.present&&rc.present[m.id]);});
  var label=rc.label||((b.time||'')+' '+(b.location||'')).trim();
  return backBar('集合點名')+
    '<section class="card rc-sticky"><div class="rc-head"><span class="big">'+present.length+'</span><span style="font-weight:900;font-size:1.2rem">/ '+ms.length+' 已到</span><span class="sp" style="flex:1"></span>'+(rc.startedAt?'<span class="muted">'+esc(rc.startedAt)+' 開始</span>':'')+'</div>'+
    '<div class="f" style="margin-top:.5rem"><label>這次集合</label><input class="in" id="rcLabel" value="'+esc(label)+'" placeholder="例：15:30 纜車站大廳"></div>'+
    (missing.length&&missing.length<ms.length?'<div class="missing" style="margin-top:.6rem">還沒到 '+missing.length+' 人'+(missing.length<=8?'：'+missing.map(function(m){ return m.phone?'<a href="'+telHref(m.phone)+'">'+esc(m.name)+ic('phone')+'</a>':'<span style="display:inline-block;margin-right:.5rem">'+esc(m.name)+'</span>'; }).join(''):'，往下捲找空圈圈')+'</div>':'')+
    (missing.length===0&&ms.length?'<div class="missing ok" style="margin-top:.6rem">'+ic('check')+'全員到齊，出發！</div>':'')+
    '<div class="row" style="margin-top:.6rem"><button class="btn ok" data-act="rcAll">全部到齊</button><button class="btn" data-act="rcReset">重新點名</button></div></section>'+
    '<div class="hint-lead">'+ic('info')+'點名字＝已到，再點一次取消。車長也可以用自己的手機一起點。</div>'+
    '<div class="rc">'+ms.map(function(m){ var on=rc.present&&rc.present[m.id]; return '<button class="'+(on?'on':'')+'" data-act="rcToggle" data-id="'+m.id+'" aria-pressed="'+(on?'true':'false')+'"><span class="ck">'+ic('check')+'</span><span style="flex:1;min-width:0">'+esc(m.name)+'</span>'+badgeSVG(m.emoji)+airlineBadge(m.airline)+'</button>'; }).join('')+'</div>';
}


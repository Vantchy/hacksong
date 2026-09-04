/* ============================================================
   电子衣橱 Demo - script.js
   纯 DOM/CSS 渲染，无 SVG
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     衣物数据
     - html: 穿在人物身上的 DOM 片段（.wear-xxx 类 + 颜色类）
     - thumb: 衣橱网格里的缩略图 DOM 片段
     - gender: 'f' 女 / 'm' 男 / 'u' 通用
     ---------------------------------------------------------- */

  const C = {
    pink:'c-pink-t', white:'c-white-t', blue:'c-blue-t', yellow:'c-yellow-t',
    red:'c-red-t', brown:'c-brown-t', mint:'c-mint-t', black:'c-black-t',
    denim:'c-denim-t', coral:'c-coral-t', gray:'c-gray-t', beige:'c-beige-t',
    navy:'c-navy-t', green:'c-green-t'
  };

  // 辅助：生成 T 恤类部件
  function tshirt(cls, collar) {
    return `<div class="wear-top"><div class="wear-tshirt">
      <div class="shirt-body ${cls}"></div>
      <div class="shirt-sleeve-l ${cls}"></div>
      <div class="shirt-sleeve-r ${cls}"></div>
      <div class="shirt-collar ${collar||cls}"></div>
    </div></div>`;
  }
  function hoodie(cls) {
    return `<div class="wear-top"><div class="wear-hoodie">
      <div class="shirt-body ${cls}"></div>
      <div class="shirt-sleeve-l ${cls}"></div>
      <div class="shirt-sleeve-r ${cls}"></div>
      <div class="shirt-hood ${cls}"></div>
      <div class="shirt-pocket"></div>
    </div></div>`;
  }
  function sweater(cls) {
    return `<div class="wear-top"><div class="wear-sweater">
      <div class="shirt-body ${cls}"></div>
      <div class="shirt-sleeve-l ${cls}"></div>
      <div class="shirt-sleeve-r ${cls}"></div>
      <div class="shirt-collar c-white-t"></div>
    </div></div>`;
  }
  function dress(cls) {
    return `<div class="wear-top"><div class="wear-dress">
      <div class="dress-top ${cls}"></div>
      <div class="dress-skirt ${cls}"></div>
      <div class="shirt-sleeve-l ${cls}"></div>
      <div class="shirt-sleeve-r ${cls}"></div>
      <div class="dress-bow"></div>
    </div></div>`;
  }
  function skirt(cls) {
    return `<div class="wear-bottom"><div class="wear-skirt">
      <div class="skirt-body ${cls}"></div>
    </div></div>`;
  }
  function pants(cls) {
    return `<div class="wear-bottom"><div class="wear-pants">
      <div class="pant-waist ${cls}"></div>
      <div class="pant-leg-l ${cls}"></div>
      <div class="pant-leg-r ${cls}"></div>
    </div></div>`;
  }
  function shorts(cls) {
    return `<div class="wear-bottom"><div class="wear-shorts">
      <div class="short-leg-l ${cls}"></div>
      <div class="short-leg-r ${cls}"></div>
    </div></div>`;
  }
  function shoes(cls) {
    return `<div class="wear-shoes">
      <div class="shoe shoe-l ${cls}"></div>
      <div class="shoe shoe-r ${cls}"></div>
    </div>`;
  }
  function bow(cls) {
    return `<div class="wear-acc"><div class="wear-bow">
      <div class="bow-center ${cls}"></div>
    </div></div>`;
  }
  function beret(cls) {
    return `<div class="wear-acc"><div class="wear-beret">
      <div class="beret-top ${cls}"></div>
      <div class="beret-brim ${cls}"></div>
      <div class="beret-ball c-red-t"></div>
    </div></div>`;
  }
  function headband(cls) {
    return `<div class="wear-acc"><div class="wear-headband ${cls}"></div></div>`;
  }
  function clip(cls) {
    return `<div class="wear-acc"><div class="wear-clip ${cls}"></div></div>`;
  }
  // 男款专用：衬衫
  function shirt(cls) {
    return `<div class="wear-top"><div class="wear-tshirt" style="position:relative">
      <div class="shirt-body ${cls}"></div>
      <div class="shirt-sleeve-l ${cls}"></div>
      <div class="shirt-sleeve-r ${cls}"></div>
      <div class="shirt-collar" style="width:30px;height:18px;background:${cls==='c-white-t'?'#FFFEF7':getColor(cls)};border-color:var(--color-border)"></div>
      <div style="position:absolute;top:14px;left:50%;transform:translateX(-50%);width:3px;height:40px;background:var(--color-border)"></div>
    </div></div>`;
  }

  function getColor(cls) {
    const map = {
      'c-pink-t':'#FFB6C1','c-white-t':'#FFFEF7','c-blue-t':'#97D4F0','c-yellow-t':'#F9E65F',
      'c-red-t':'#E74C3C','c-brown-t':'#8B6B4A','c-mint-t':'#C8F0C8','c-black-t':'#5D4037',
      'c-denim-t':'#6FA8C8','c-coral-t':'#FFAB91','c-gray-t':'#C8C0B8','c-beige-t':'#F0DDB8',
      'c-navy-t':'#4A6FA5','c-green-t':'#7CC47C'
    };
    return map[cls] || '#ccc';
  }

  /* 缩略图工厂 */
  const thumbT = (cls) => `<div class="mini-t ${cls}"></div>`;
  const thumbHoodie = (cls) => `<div class="mini-hoodie ${cls}"></div>`;
  const thumbSweater = (cls) => `<div class="mini-sweater ${cls}"></div>`;
  const thumbDress = (cls) => `<div class="mini-dress ${cls}"></div>`;
  const thumbShirt = (cls) => `<div class="mini-t ${cls}"></div>`;
  const thumbSkirt = (cls) => `<div class="mini-skirt ${cls}"></div>`;
  const thumbPants = (cls) => `<div class="mini-pants"><div style="width:16px;height:100%;background:${getColor(cls)};border:2px solid var(--color-border);border-radius:3px;position:absolute;left:0;top:0"></div><div style="width:16px;height:100%;background:${getColor(cls)};border:2px solid var(--color-border);border-radius:3px;position:absolute;right:0;top:0"></div></div>`;
  const thumbShorts = (cls) => `<div class="mini-shorts"><div style="width:17px;height:100%;background:${getColor(cls)};border:2px solid var(--color-border);border-radius:3px 3px 6px 6px;position:absolute;left:0;top:0"></div><div style="width:17px;height:100%;background:${getColor(cls)};border:2px solid var(--color-border);border-radius:3px 3px 6px 6px;position:absolute;right:0;top:0"></div></div>`;
  const thumbShoe = (cls) => `<div class="mini-shoe"><span class="${cls}"></span><span class="${cls}"></span></div>`;
  const thumbBow = (cls) => `<div class="mini-bow"><b class="${cls}"></b></div>`;
  const thumbBeret = (cls) => `<div class="mini-beret ${cls}"><i class="${cls}"></i><b class="${cls}"></b></div>`;
  const thumbBand = (cls) => `<div class="mini-band ${cls}"></div>`;
  const thumbClip = (cls) => `<div class="mini-clip ${cls}"></div>`;

  // 男女衣物库
  const CLOTHES = {
    female: {
      top: [
        { id:'ft1', name:'粉色T恤', html:tshirt(C.pink,'c-white-t'), thumb:thumbT(C.pink), gender:'f' },
        { id:'ft2', name:'米白卫衣', html:hoodie(C.white), thumb:thumbHoodie(C.white), gender:'f' },
        { id:'ft3', name:'蓝色毛衣', html:sweater(C.blue), thumb:thumbSweater(C.blue), gender:'f' },
        { id:'ft4', name:'黄色连衣裙', html:dress(C.yellow), thumb:thumbDress(C.yellow), gender:'f' },
        { id:'ft5', name:'粉色针织衫', html:sweater(C.pink), thumb:thumbSweater(C.pink), gender:'f' },
        { id:'ft6', name:'白色T恤', html:tshirt(C.white,C.beige), thumb:thumbT(C.white), gender:'f' }
      ],
      bottom: [
        { id:'fb1', name:'牛仔短裙', html:skirt(C.denim), thumb:thumbSkirt(C.denim), gender:'f' },
        { id:'fb2', name:'粉色半裙', html:skirt(C.pink), thumb:thumbSkirt(C.pink), gender:'f' },
        { id:'fb3', name:'白色短裤', html:shorts(C.white), thumb:thumbShorts(C.white), gender:'f' },
        { id:'fb4', name:'黑色长裤', html:pants(C.black), thumb:thumbPants(C.black), gender:'f' },
        { id:'fb5', name:'米色休闲裤', html:pants(C.beige), thumb:thumbPants(C.beige), gender:'f' }
      ],
      shoes: [
        { id:'fs1', name:'红色帆布鞋', html:shoes(C.red), thumb:thumbShoe(C.red), gender:'f' },
        { id:'fs2', name:'白色运动鞋', html:shoes(C.white), thumb:thumbShoe(C.white), gender:'f' },
        { id:'fs3', name:'棕色小皮鞋', html:shoes(C.brown), thumb:thumbShoe(C.brown), gender:'f' },
        { id:'fs4', name:'粉色拖鞋', html:shoes(C.pink), thumb:thumbShoe(C.pink), gender:'f' },
        { id:'fs5', name:'蓝色凉鞋', html:shoes(C.blue), thumb:thumbShoe(C.blue), gender:'f' }
      ],
      accessory: [
        { id:'fa1', name:'粉色蝴蝶结', html:bow(C.pink), thumb:thumbBow(C.pink), gender:'f' },
        { id:'fa2', name:'黄色贝雷帽', html:beret(C.yellow), thumb:thumbBeret(C.yellow), gender:'f' },
        { id:'fa3', name:'蓝色发带', html:headband(C.blue), thumb:thumbBand(C.blue), gender:'f' },
        { id:'fa4', name:'红色发卡', html:clip(C.red), thumb:thumbClip(C.red), gender:'f' }
      ]
    },
    male: {
      top: [
        { id:'mt1', name:'白色衬衫', html:shirt(C.white), thumb:thumbShirt(C.white), gender:'m' },
        { id:'mt2', name:'深蓝卫衣', html:hoodie(C.navy), thumb:thumbHoodie(C.navy), gender:'m' },
        { id:'mt3', name:'条纹T恤', html:tshirt(C.white,C.beige), thumb:thumbT(C.white), gender:'m' },
        { id:'mt4', name:'蓝色衬衫', html:shirt(C.blue), thumb:thumbShirt(C.blue), gender:'m' },
        { id:'mt5', name:'米色毛衣', html:sweater(C.beige), thumb:thumbSweater(C.beige), gender:'m' },
        { id:'mt6', name:'灰色T恤', html:tshirt(C.gray,C.white), thumb:thumbT(C.gray), gender:'m' }
      ],
      bottom: [
        { id:'mb1', name:'深蓝牛仔裤', html:pants(C.navy), thumb:thumbPants(C.navy), gender:'m' },
        { id:'mb2', name:'黑色长裤', html:pants(C.black), thumb:thumbPants(C.black), gender:'m' },
        { id:'mb3', name:'卡其短裤', html:shorts(C.beige), thumb:thumbShorts(C.beige), gender:'m' },
        { id:'mb4', name:'灰色运动裤', html:pants(C.gray), thumb:thumbPants(C.gray), gender:'m' }
      ],
      shoes: [
        { id:'ms1', name:'白色运动鞋', html:shoes(C.white), thumb:thumbShoe(C.white), gender:'m' },
        { id:'ms2', name:'黑色皮鞋', html:shoes(C.black), thumb:thumbShoe(C.black), gender:'m' },
        { id:'ms3', name:'蓝色板鞋', html:shoes(C.blue), thumb:thumbShoe(C.blue), gender:'m' },
        { id:'ms4', name:'棕色皮鞋', html:shoes(C.brown), thumb:thumbShoe(C.brown), gender:'m' }
      ],
      accessory: [
        { id:'ma1', name:'蓝色棒球帽', html:beret(C.blue), thumb:thumbBeret(C.blue), gender:'m' },
        { id:'ma2', name:'黑色手表', html:`<div class="wear-acc" style="top:180px;left:12px;z-index:15;position:absolute"><div style="width:18px;height:10px;background:#333;border:2px solid var(--color-border);border-radius:3px;position:relative"></div></div>`, thumb:thumbBand(C.black), gender:'m' },
        { id:'ma3', name:'黑色发带', html:headband(C.black), thumb:thumbBand(C.black), gender:'m' }
      ]
    }
  };

  /* ----------------------------------------------------------
     状态
     ---------------------------------------------------------- */
  let currentGender = 'female';
  const wearing = { top:null, bottom:null, shoes:null, accessory:null };

  /* ----------------------------------------------------------
     DOM 引用
     ---------------------------------------------------------- */
  const charFemale = document.getElementById('charFemale');
  const charMale = document.getElementById('charMale');
  const wardrobe = document.getElementById('wardrobe');
  const overlay = document.getElementById('closetOverlay');
  const closeBtn = document.getElementById('closetClose');
  const grid = document.getElementById('closetGrid');
  const tabs = document.getElementById('closetTabs');
  const countEl = document.getElementById('closetCount');
  const bubble = document.getElementById('bubble');
  const toastEl = document.getElementById('toast');
  const genderToggle = document.getElementById('genderToggle');
  const roomScene = document.querySelector('.room-scene');

  const ootdTop = document.getElementById('ootdTop');
  const ootdBottom = document.getElementById('ootdBottom');
  const ootdShoes = document.getElementById('ootdShoes');
  const ootdAcc = document.getElementById('ootdAcc');
  const totalCount = document.getElementById('totalCount');
  const wearingCount = document.getElementById('wearingCount');

  const LAYERS_F = {
    top: document.getElementById('layer-top-f'),
    bottom: document.getElementById('layer-bottom-f'),
    shoes: document.getElementById('layer-shoes-f'),
    accessory: document.getElementById('layer-accessory-f')
  };
  const LAYERS_M = {
    top: document.getElementById('layer-top-m'),
    bottom: document.getElementById('layer-bottom-m'),
    shoes: document.getElementById('layer-shoes-m'),
    accessory: document.getElementById('layer-accessory-m')
  };

  /* ----------------------------------------------------------
     渲染
     ---------------------------------------------------------- */
  function layers() { return currentGender === 'female' ? LAYERS_F : LAYERS_M; }
  function clothes() { return CLOTHES[currentGender]; }

  function renderLayer(cat) {
    const L = layers();
    const id = wearing[cat];
    if (!id) { L[cat].innerHTML = ''; return; }
    const items = clothes()[cat];
    const item = items.find(i => i.id === id);
    if (item) L[cat].innerHTML = item.html;
  }
  function renderAllLayers() {
    ['top','bottom','shoes','accessory'].forEach(renderLayer);
  }

  function getActiveChar() { return currentGender === 'female' ? charFemale : charMale; }

  function renderGrid(cat) {
    const items = clothes()[cat];
    grid.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'clothing-card' + (wearing[cat] === item.id ? ' wearing' : '');
      card.innerHTML = `
        <div class="clothing-preview">${item.thumb}</div>
        <div class="clothing-name">${item.name}</div>
      `;
      card.addEventListener('click', () => wearItem(cat, item.id));
      grid.appendChild(card);
    });
    const total = Object.values(clothes()).reduce((s,a) => s + a.length, 0);
    countEl.textContent = `共 ${items.length} 件 / 总计 ${total} 件`;
  }

  function updateOotd() {
    const def = {
      female: { top:'粉色内衣', bottom:'粉色内裤', shoes:'赤脚', acc:'无' },
      male:   { top:'赤裸上身', bottom:'深蓝内裤', shoes:'赤脚', acc:'无' }
    };
    const d = def[currentGender];
    ootdTop.textContent = wearing.top ? findItem('top',wearing.top).name : d.top;
    ootdBottom.textContent = wearing.bottom ? findItem('bottom',wearing.bottom).name : d.bottom;
    ootdShoes.textContent = wearing.shoes ? findItem('shoes',wearing.shoes).name : d.shoes;
    ootdAcc.textContent = wearing.accessory ? findItem('accessory',wearing.accessory).name : d.acc;
    const worn = Object.values(wearing).filter(Boolean).length;
    wearingCount.textContent = worn;
    totalCount.textContent = Object.values(clothes()).reduce((s,a) => s + a.length, 0);
  }

  function findItem(cat, id) { return clothes()[cat].find(i => i.id === id); }

  /* ----------------------------------------------------------
     换装
     ---------------------------------------------------------- */
  function wearItem(cat, id) {
    if (wearing[cat] === id) {
      wearing[cat] = null;
      toast(`脱下了「${findItem(cat,id).name}」`);
    } else {
      wearing[cat] = id;
      toast(`换上了「${findItem(cat,id).name}」✨`);
    }
    renderLayer(cat);
    renderGrid(currentCat);
    updateOotd();
    const ch = getActiveChar();
    ch.classList.remove('dressing');
    ch.classList.remove('floating');
    void ch.offsetWidth;
    ch.classList.add('dressing');
    setTimeout(() => { ch.classList.remove('dressing'); ch.classList.add('floating'); }, 450);
  }

  /* ----------------------------------------------------------
     分类切换
     ---------------------------------------------------------- */
  let currentCat = 'top';
  tabs.addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCat = tab.dataset.cat;
    renderGrid(currentCat);
  });

  /* ----------------------------------------------------------
     衣柜开合
     ---------------------------------------------------------- */
  function openCloset() {
    wardrobe.classList.add('open');
    overlay.classList.add('show');
    renderGrid(currentCat);
  }
  function closeCloset() {
    wardrobe.classList.remove('open');
    overlay.classList.remove('show');
  }
  wardrobe.addEventListener('click', openCloset);
  wardrobe.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCloset(); }
  });
  closeBtn.addEventListener('click', closeCloset);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeCloset(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCloset(); });

  /* ----------------------------------------------------------
     性别切换
     ---------------------------------------------------------- */
  genderToggle.addEventListener('click', e => {
    const opt = e.target.closest('.gender-opt');
    if (!opt) return;
    const g = opt.dataset.gender;
    if (g === currentGender) return;
    currentGender = g;
    genderToggle.querySelectorAll('.gender-opt').forEach(o => o.classList.toggle('active', o.dataset.gender === g));
    // 重置穿戴
    wearing.top = wearing.bottom = wearing.shoes = wearing.accessory = null;
    // 切换人物显隐
    charFemale.style.display = g === 'female' ? '' : 'none';
    charMale.style.display = g === 'male' ? '' : 'none';
    // 切换衣柜配色
    wardrobe.classList.toggle('wardrobe-female', g === 'female');
    wardrobe.classList.toggle('wardrobe-male', g === 'male');
    // 切换房间主题色
    roomScene.classList.toggle('room-female', g === 'female');
    roomScene.classList.toggle('room-male', g === 'male');
    // 更新默认对话
    bubble.textContent = g === 'female' ? '选件漂亮衣服吧～' : '今天穿什么好呢？';
    renderAllLayers();
    renderGrid(currentCat);
    updateOotd();
    toast(g === 'female' ? '切换为女生形象 👧' : '切换为男生形象 👦');
  });

  /* ----------------------------------------------------------
     底部按钮
     ---------------------------------------------------------- */
  document.getElementById('btnRandom').addEventListener('click', () => {
    Object.keys(clothes()).forEach(cat => {
      const items = clothes()[cat];
      wearing[cat] = items[Math.floor(Math.random() * items.length)].id;
    });
    renderAllLayers();
    renderGrid(currentCat);
    updateOotd();
    const ch = getActiveChar();
    ch.classList.remove('dressing','floating');
    void ch.offsetWidth;
    ch.classList.add('dressing');
    setTimeout(() => { ch.classList.remove('dressing'); ch.classList.add('floating'); }, 450);
    toast('🎲 随机搭配完成！');
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    Object.keys(wearing).forEach(c => wearing[c] = null);
    renderAllLayers();
    renderGrid(currentCat);
    updateOotd();
    toast('已重置');
  });

  document.getElementById('btnSave').addEventListener('click', () => {
    const parts = Object.values(wearing).filter(Boolean).length;
    if (parts === 0) { toast('还没搭配任何衣物哦～'); return; }
    toast(`💾 OOTD 已保存（${parts} 件）`);
  });

  /* ----------------------------------------------------------
     Toast
     ---------------------------------------------------------- */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  /* ----------------------------------------------------------
     初始化 —— 默认穿内衣内裤（无外套）
     ---------------------------------------------------------- */
  roomScene.classList.add('room-female');
  renderAllLayers();
  renderGrid('top');
  updateOotd();

  setTimeout(() => { bubble.textContent = '试试「随机搭配」或点右上角 ♀/♂ 切换性别'; }, 4500);
})();

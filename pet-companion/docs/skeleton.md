# 项目骨架 & 归属标注

> 本文件标出每个文件中 **A/B/C 的专属区域** 和 **重合操作区**，方便 AI 后续修改时识别归属、避免冲突。
>
> 标注规则：
> - `[A]` — A 专属，AI 只能按 A 的意图修改
> - `[B]` — B 专属
> - `[C]` — C 专属
> - `[A+B]` — A 与 B 的接口区（双方协商一致才能改）
> - `[B+C]` — B 与 C 的接口区（双方协商一致才能改）
> - `[A+B+C]` — 三方契约区（全员一致才能改）

---

## 一、文件级归属总览

```
pet-companion/
├── index.html        [A] 骨架 + [A+B] 接口区
├── css/
│   └── style.css     [A] 全权
├── js/
│   ├── app.js        [B] 全权 + [B+C] 接口区
│   ├── storage.js    [C] 全权
│   └── gameLogic.js  [C] 全权
├── assets/
│   ├── images/       [A] 管理
│   └── sounds/       [A] 管理（可选）
├── docs/
│   ├── prompt.md     [A+B+C] 共享
│   ├── samename.md   [A+B+C] 契约
│   └── skeleton.md   [A+B+C] 本文件
├── .gitignore        [C] 创建
└── README.md         [C] 维护
```

---

## 二、index.html 骨架标注

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>宠物伙伴</title>

    <!-- ===== [A] 样式引用 ===== -->
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <div id="app">   <!-- [A] 根容器 -->

        <!-- ===== [A] 顶部信息栏 ===== -->
        <!-- [A+B] 以下 id 是 A 定义、B 通过 getElementById 引用的接口 -->
        <header>
            <h1 id="pet-name">🐾 小宠物</h1>            <!-- [A+B] -->
            <div class="meta-info">                      <!-- [A] 仅样式 -->
                <span>等级 <strong id="level">1</strong></span>       <!-- [A+B] -->
                <span>经验 <strong id="xp">0</strong>/<strong id="xp-next">100</strong></span>  <!-- [A+B] -->
                <span>年龄 <strong id="age">0</strong> 天</span>      <!-- [A+B] -->
            </div>
            <div class="progress-bar" id="xp-bar">       <!-- [A] 仅样式 -->
                <div class="progress-fill" id="xp-fill" style="width: 0%"></div>  <!-- [A+B] style 由 B 的 JS 动态覆盖 -->
            </div>
        </header>

        <!-- ===== [A] 宠物展示区 ===== -->
        <section id="pet-area">                          <!-- [A] 仅样式 -->
            <!-- [A+B] 宠物表情和消息由 B 的 JS 动态更新 -->
            <div id="pet-sprite" class="pet-normal">😊</div>   <!-- [A+B] -->
            <div id="pet-message" class="message-bubble">你好！</div>  <!-- [A+B] -->
        </section>

        <!-- ===== [A] 属性面板 ===== -->
        <!-- [A+B] 以下 id 均为 A 定义、B 引用的接口 -->
        <section id="stats-panel">                       <!-- [A] 仅样式 -->
            <div class="stat">                           <!-- [A] 仅样式 -->
                <span class="stat-label">🍔 饱食度</span>          <!-- [A] -->
                <div class="progress-bar">                         <!-- [A] -->
                    <div class="progress-fill" id="hunger-fill" style="width: 80%"></div>    <!-- [A+B] -->
                </div>
                <span class="stat-value" id="hunger-value">80</span>  <!-- [A+B] -->
            </div>
            <div class="stat">
                <span class="stat-label">😄 快乐度</span>
                <div class="progress-bar">
                    <div class="progress-fill" id="happiness-fill" style="width: 70%"></div>  <!-- [A+B] -->
                </div>
                <span class="stat-value" id="happiness-value">70</span>  <!-- [A+B] -->
            </div>
            <div class="stat">
                <span class="stat-label">⚡ 精力</span>
                <div class="progress-bar">
                    <div class="progress-fill" id="energy-fill" style="width: 90%"></div>  <!-- [A+B] -->
                </div>
                <span class="stat-value" id="energy-value">90</span>  <!-- [A+B] -->
            </div>
            <div class="stat">
                <span class="stat-label">🧹 清洁度</span>
                <div class="progress-bar">
                    <div class="progress-fill" id="hygiene-fill" style="width: 60%"></div>  <!-- [A+B] -->
                </div>
                <span class="stat-value" id="hygiene-value">60</span>  <!-- [A+B] -->
            </div>
        </section>

        <!-- ===== [A] 操作按钮 ===== -->
        <!-- [A+B] data-action 是 A 定义、B 读取的接口 -->
        <section id="actions">                           <!-- [A] 仅样式 -->
            <button class="action-btn" data-action="feed">🍔 喂食</button>    <!-- [A+B] -->
            <button class="action-btn" data-action="play">🎮 玩耍</button>    <!-- [A+B] -->
            <button class="action-btn" data-action="sleep">😴 睡觉</button>   <!-- [A+B] -->
            <button class="action-btn" data-action="clean">🛁 洗澡</button>   <!-- [A+B] -->
            <button class="action-btn" data-action="heal">💊 治疗</button>    <!-- [A+B] -->
        </section>

        <!-- ===== [A] 存档管理 ===== -->
        <section id="save-management">                   <!-- [A] 仅样式 -->
            <button class="secondary-btn" id="save-btn">💾 保存</button>   <!-- [A+B] -->
            <button class="secondary-btn" id="load-btn">📂 读档</button>   <!-- [A+B] -->
            <button class="secondary-btn danger" id="reset-btn">🗑️ 重置</button>  <!-- [A+B] -->
        </section>
    </div>

    <!-- ===== [A] 引用脚本（加载顺序固定：C → C → B） ===== -->
    <script src="js/gameLogic.js"></script>    <!-- [C] -->
    <script src="js/storage.js"></script>      <!-- [C] -->
    <script src="js/app.js"></script>          <!-- [B] -->
</body>
</html>
```

---

## 三、css/style.css 骨架标注

```
/* ===== [A] 全部文件归 A 全权负责 ===== */
/* B 和 C 不得修改此文件中的任何内容      */
/* ===================================== */

/* ===== [A] 全局重置 ===== */
* { ... }

/* ===== [A] 主容器 ===== */
#app { ... }

/* ===== [A] 顶部信息栏 ===== */
header { ... }
#pet-name { ... }       /* [A+B] 此 id 与 B 的 JS 关联，改名需协商 */
.meta-info { ... }

/* ===== [A] 进度条 ===== */
.progress-bar { ... }
.progress-fill { ... }

/* ===== [A] 宠物展示区 ===== */
#pet-area { ... }
#pet-sprite { ... }     /* [A+B] 此 id 与 B 的 JS 关联 */
#pet-message { ... }    /* [A+B] 此 id 与 B 的 JS 关联 */

/* ===== [A] 宠物情绪动画（A 定义，B 通过 class 切换触发） ===== */
.pet-normal { animation: idleBounce ...; }     /* [A+B] */
.pet-happy { animation: happyJump ...; }       /* [A+B] */
.pet-sleeping { animation: sleepFloat ...; }   /* [A+B] */
.pet-sick { animation: sickShake ...; }        /* [A+B] */

/* ===== [A] 关键帧动画 ===== */
@keyframes idleBounce { ... }    /* [A] */
@keyframes happyJump { ... }     /* [A] */
@keyframes sleepFloat { ... }    /* [A] */
@keyframes sickShake { ... }     /* [A] */

/* ===== [A] 对话气泡 ===== */
.message-bubble { ... }

/* ===== [A] 属性面板 ===== */
#stats-panel { ... }
.stat { ... }
.stat-label { ... }
.stat-value { ... }

/* ===== [A] 各属性填充颜色 ===== */
#hunger-fill { ... }         /* [A+B] */
#happiness-fill { ... }      /* [A+B] */
#energy-fill { ... }         /* [A+B] */
#hygiene-fill { ... }        /* [A+B] */

/* ===== [A] 操作按钮 ===== */
#actions { ... }
.action-btn { ... }          /* [A+B] 此 class 被 B 的 querySelectorAll 引用 */

/* ===== [A] 存档管理 ===== */
#save-management { ... }
.secondary-btn { ... }
.secondary-btn.danger { ... }

/* ===== [A] 响应式 ===== */
@media (max-width: 480px) { ... }
```

---

## 四、js/gameLogic.js 骨架标注

```javascript
/**
 * gameLogic.js — 算法与规则
 * ===== [C] 全部文件归 C 全权负责 =====
 * B 只调用以下公开接口，不修改内部实现
 * A 完全不涉及此文件
 * =====================================
 */

const GameLogic = {    // [C] 全局对象名，属 [B+C] 接口区，B 和 C 协商一致才能改名

    // ===== [C] 默认初始状态 =====
    // [A+B+C] 以下字段名是三方契约，修改需通知所有人
    defaultState: {
        name: '小宠物',     // [A+B+C] → 对应 HTML id="pet-name"
        level: 1,           // [A+B+C] → 对应 HTML id="level"
        xp: 0,              // [A+B+C] → 对应 HTML id="xp"
        age: 0,             // [A+B+C] → 对应 HTML id="age"
        hunger: 80,         // [A+B+C] → 对应 HTML id="hunger-fill/value"
        happiness: 70,      // [A+B+C] → 对应 HTML id="happiness-fill/value"
        energy: 90,         // [A+B+C] → 对应 HTML id="energy-fill/value"
        hygiene: 60,        // [A+B+C] → 对应 HTML id="hygiene-fill/value"
        health: 100,        // [A+B+C] → 暂未绑定 UI
        isSleeping: false,  // [A+B+C] → 影响宠物表情
        createdAt: Date.now()  // [C] 仅内部使用
    },

    // ===== [C] 经验公式（内部算法，B 只调用结果） =====
    xpForLevel: function (level) { ... },   // [B+C] 方法签名不可改

    // ===== [C] 等级提升（内部算法） =====
    addXp: function (state, amount) { ... },  // [B+C] 方法签名不可改

    // ===== [C] 各操作的效果（B 通过 performAction 间接使用） =====
    // [B+C] data-action 值（feed/play/sleep/clean/heal）必须与 HTML 一致
    actions: {
        feed: { effects: { hunger: 20, happiness: 5, energy: 5 }, xpReward: 15, ... },
        play: { effects: { happiness: 25, energy: -15, hunger: -5 }, xpReward: 20, ... },
        sleep: { effects: { energy: 30, happiness: 5, hunger: -3 }, xpReward: 10, ... },
        clean: { effects: { hygiene: 30, happiness: 5, energy: -5 }, xpReward: 12, ... },
        heal: { effects: { health: 30, happiness: -5, energy: -10 }, xpReward: 18, ... }
    },

    // ===== [C] 执行操作（B 唯一调用的入口） =====
    // [B+C] 返回值格式 { state, message } 不可改
    performAction: function (state, actionKey) { ... },

    // ===== [C] 倒计时衰减（B 唯一调用的入口） =====
    // [B+C] 参数 minutes 含义不可改，返回值不可改
    tick: function (state, minutes = 5) { ... },

    // ===== [C] 检查警告（B 调用渲染） =====
    // [B+C] 返回值 string|null 不可改
    getWarning: function (state) { ... }
};
```

---

## 五、js/storage.js 骨架标注

```javascript
/**
 * storage.js — 数据持久化
 * ===== [C] 全部文件归 C 全权负责 =====
 * B 只调用以下公开接口，不修改内部实现
 * A 完全不涉及此文件
 * =====================================
 */

const Storage = {    // [C] 全局对象名，属 [B+C] 接口区

    // ===== [C] localStorage Key =====
    // [B+C] 此 key 不可改，B 不得直接操作 localStorage
    STORAGE_KEY: 'pet_companion_save',

    // ===== [C] 保存存档 =====
    // [B+C] 参数 state: Object，返回值 boolean
    save: function (state) { ... },

    // ===== [C] 读取存档 =====
    // [B+C] 返回值 Object|null
    load: function () { ... },

    // ===== [C] 删除存档 =====
    // [B+C] 返回值 boolean
    clear: function () { ... },

    // ===== [C] 检查存档是否存在 =====
    hasSave: function () { ... },

    // ===== [C] 获取存档时间 =====
    getSaveTime: function () { ... }
};
```

---

## 六、js/app.js 骨架标注

```javascript
/**
 * app.js — 核心交互逻辑
 * ===== [B] 全部文件归 B 全权负责 =====
 * B 调用 C 的 GameLogic 和 Storage 公开接口
 * A 不涉及此文件，但此文件引用了 A 定义的 HTML id
 * =====================================
 */

(function () {
    'use strict';

    // ===== [B] DOM 引用（引用的 id 由 A 定义） =====
    // [A+B] 以下 id 与 HTML 绑定，A 改名需通知 B
    const $ = (id) => document.getElementById(id);
    const el = {
        level:     $('level'),            // [A+B]
        xp:        $('xp'),               // [A+B]
        xpNext:    $('xp-next'),          // [A+B]
        xpFill:    $('xp-fill'),          // [A+B]
        age:       $('age'),              // [A+B]
        petName:   $('pet-name'),         // [A+B]
        petSprite: $('pet-sprite'),       // [A+B]
        message:   $('pet-message'),      // [A+B]
        hunger:    { fill: $('hunger-fill'),    value: $('hunger-value') },       // [A+B]
        happiness: { fill: $('happiness-fill'), value: $('happiness-value') },    // [A+B]
        energy:    { fill: $('energy-fill'),    value: $('energy-value') },       // [A+B]
        hygiene:   { fill: $('hygiene-fill'),   value: $('hygiene-value') },      // [A+B]
        actionBtns: document.querySelectorAll('.action-btn'),  // [A+B] .action-btn 由 A 定义
        saveBtn:    $('save-btn'),         // [A+B]
        loadBtn:    $('load-btn'),         // [A+B]
        resetBtn:   $('reset-btn')         // [A+B]
    };

    // ===== [B] 状态变量 =====
    let gameState = null;      // [B] 状态对象，字段结构由 [A+B+C] 契约定义
    let tickInterval = null;   // [B]
    const TICK_INTERVAL_MS = 5 * 60 * 1000;  // [B]

    // ===== [B] 渲染 UI（读取 C 提供的数据，更新 A 定义的 DOM） =====
    function render() { ... }                   // [B] 内部实现
    function updatePetAppearance(s) { ... }     // [B] 内部实现
    function triggerHappyAnimation() { ... }    // [B] 内部实现
    function showMessage(text, isImportant) { ... }  // [B] 内部实现

    // ===== [B] 操作处理（调用 C 的 GameLogic 接口） =====
    // [B+C] 以下函数调用 C 的公开方法
    function handleAction(actionKey) {          // [B] + [B+C]
        const result = GameLogic.performAction(gameState, actionKey);  // [B+C]
        gameState = result.state;
        render();
        showMessage(result.message);
        triggerHappyAnimation();
        Storage.save(gameState);  // [B+C]
    }

    // ===== [B] 定时衰减（调用 C 的 GameLogic 接口） =====
    function doTick() {                         // [B] + [B+C]
        gameState = GameLogic.tick(gameState, 5);  // [B+C]
        render();
        Storage.save(gameState);  // [B+C]
    }

    // ===== [B] 存档操作（调用 C 的 Storage 接口） =====
    function handleSave() {                     // [B] + [B+C]
        Storage.save(gameState);  // [B+C]
    }
    function handleLoad() {                     // [B] + [B+C]
        const data = Storage.load();            // [B+C]
        if (data) { gameState = data; render(); }
    }
    function handleReset() {                    // [B] + [B+C]
        Storage.clear();                        // [B+C]
        gameState = { ...GameLogic.defaultState, createdAt: Date.now() };  // [B+C]
        render();
    }

    // ===== [B] 离线计算（调用 C 的接口） =====
    function applyOfflineProgress() { ... }     // [B] + [B+C]

    // ===== [B] 初始化 =====
    function init() { ... }                     // [B]

    // ===== [B] 事件绑定 =====
    window.addEventListener('beforeunload', function () { ... });  // [B]

    // ===== [B] 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);  // [B]
    } else {
        init();  // [B]
    }
})();
```

---

## 七、重合操作区总览

### 7.1 [A+B] 接口区（A 和 B 必须协商）

| 接口类型 | 具体内容 | 风险 |
|----------|----------|------|
| **HTML id** | `pet-name`, `level`, `xp`, `xp-next`, `age`, `xp-fill`, `pet-sprite`, `pet-message`, `hunger-fill`, `hunger-value`, `happiness-fill`, `happiness-value`, `energy-fill`, `energy-value`, `hygiene-fill`, `hygiene-value`, `save-btn`, `load-btn`, `reset-btn` | A 改 id → B 的 JS 失效 |
| **CSS class** | `.action-btn`（B 用 `querySelectorAll` 绑定事件） | A 删 class → B 按钮失效 |
| **CSS 动画 class** | `.pet-normal`, `.pet-happy`, `.pet-sleeping`, `.pet-sick`（B 用 `classList.add/remove` 切换） | A 改名 → B 动画失效 |
| **data-action** | `feed`, `play`, `sleep`, `clean`, `heal`（A 定义值，B 读取后传给 C） | 任意一方改了值 → 操作失效 |

### 7.2 [B+C] 接口区（B 和 C 必须协商）

| 接口类型 | 具体内容 | 风险 |
|----------|----------|------|
| **全局对象名** | `GameLogic`, `Storage` | 改名 → B 的调用全断 |
| **方法签名** | `performAction(state, actionKey)` → `{ state, message }` | 改返回值格式 → B 渲染出错 |
| | `tick(state, minutes)` → `Object` | 改参数含义 → B 调用出错 |
| | `getWarning(state)` → `string \| null` | 改返回值类型 → B 逻辑出错 |
| | `save(state)` → `boolean` | 改参数 → B 调用出错 |
| | `load()` → `Object \| null` | 改返回值 → B 逻辑出错 |
| | `clear()` → `boolean` | — |
| **data-action 枚举** | `feed`, `play`, `sleep`, `clean`, `heal` | C 删了某个 key → B 操作无反应 |

### 7.3 [A+B+C] 契约区（三方必须一致）

| 契约内容 | 文件 | 说明 |
|----------|------|------|
| **状态对象字段名** | `samename.md` 第十节 | 12 个字段名，A 用 id 展示、B 用 JS 渲染、C 用算法维护 |
| **命名规范文档** | `samename.md` 全文 | 所有命名以该文件为准 |

---

## 八、AI 修改指南

| 场景 | 可以改什么 | 不可以改什么 |
|------|-----------|-------------|
| 修改 **A 的任务** | `index.html` 中 `[A]` 标注的 HTML 结构、`[A]` 标注的样式 | 不能改 `[A+B]` 标注的 id/class/data-action 名称 |
| 新增 **A 的元素** | 添加新的 HTML 元素，但 id 必须用新的、不与 B 现有引用冲突的名字 | 不能改 B 已引用的 id 的值 |
| 修改 **B 的任务** | `app.js` 中 `[B]` 标注的内部逻辑 | 不能改 `[B+C]` 标注的 C 的方法调用方式 |
| 修改 **C 的任务** | `gameLogic.js` 和 `storage.js` 中 `[C]` 标注的内部算法 | 不能改 `[B+C]` 标注的公开方法签名 |
| **任何修改前** | 先读 `samename.md` 检查命名是否被其他人引用 | 不能单方面修改 `[A+B]` / `[B+C]` / `[A+B+C]` 区域的任何内容
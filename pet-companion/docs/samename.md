# 统一命名规范（Samename）

> 本文件列出了 A、B、C 三人需要共同遵守的所有命名约定。**修改任何名称前，必须同步更新此文件并通知其他成员。**

---

## 一、文件路径（由 A 在 index.html 中引用）

三人必须确保以下文件路径完全一致：

| 文件 | 相对路径 | 谁负责 | 谁引用 |
|------|----------|--------|--------|
| 样式表 | `css/style.css` | A | index.html `<link>` |
| 算法规则 | `js/gameLogic.js` | C | index.html `<script>`（加载顺序第1） |
| 数据持久化 | `js/storage.js` | C | index.html `<script>`（加载顺序第2） |
| 核心交互 | `js/app.js` | B | index.html `<script>`（加载顺序第3） |

> **加载顺序固定**：gameLogic.js → storage.js → app.js（因为 app.js 依赖前两个全局对象）

---

## 二、HTML `id` 属性（A 定义，B 通过 `document.getElementById()` 引用）

| id | 用途 | 所属区域 |
|----|------|----------|
| `app` | 应用根容器 | 全局 |
| `pet-name` | 宠物名称显示 | 顶部信息栏 |
| `level` | 等级数字 | 顶部信息栏 |
| `xp` | 当前经验值 | 顶部信息栏 |
| `xp-next` | 升级所需经验 | 顶部信息栏 |
| `age` | 年龄天数 | 顶部信息栏 |
| `xp-bar` | 经验条容器 | 顶部信息栏 |
| `xp-fill` | 经验条填充 | 顶部信息栏 |
| `pet-area` | 宠物展示区容器 | 宠物区 |
| `pet-sprite` | 宠物表情/动画元素 | 宠物区 |
| `pet-message` | 对话气泡 | 宠物区 |
| `stats-panel` | 属性面板容器 | 属性面板 |
| `hunger-fill` | 饱食度填充条 | 属性面板 |
| `hunger-value` | 饱食度数字 | 属性面板 |
| `happiness-fill` | 快乐度填充条 | 属性面板 |
| `happiness-value` | 快乐度数字 | 属性面板 |
| `energy-fill` | 精力填充条 | 属性面板 |
| `energy-value` | 精力数字 | 属性面板 |
| `hygiene-fill` | 清洁度填充条 | 属性面板 |
| `hygiene-value` | 清洁度数字 | 属性面板 |
| `actions` | 操作按钮容器 | 操作区 |
| `save-management` | 存档管理容器 | 存档区 |
| `save-btn` | 保存按钮 | 存档区 |
| `load-btn` | 读档按钮 | 存档区 |
| `reset-btn` | 重置按钮 | 存档区 |

---

## 三、CSS 类名（A 定义，B 在 JS 中可增删）

| 类名 | 用途 | 备注 |
|------|------|------|
| `.meta-info` | 顶部信息栏元数据行 | |
| `.progress-bar` | 进度条容器 | 公用 |
| `.progress-fill` | 进度条填充 | 公用 |
| `.stat` | 属性行容器 | |
| `.stat-label` | 属性标签文字 | |
| `.stat-value` | 属性数值文字 | |
| `.action-btn` | 操作按钮 | B 通过 `querySelectorAll('.action-btn')` 批量绑定 |
| `.secondary-btn` | 存档按钮 | |
| `.danger` | 危险操作按钮修饰 | 加在 `.secondary-btn` 上 |
| `.message-bubble` | 对话气泡 | |
| `.pet-normal` | 宠物正常状态动画 | B 在 JS 中通过 `classList.add/remove` 切换 |
| `.pet-happy` | 宠物快乐动画 | 同上 |
| `.pet-sleeping` | 宠物睡眠动画 | 同上 |
| `.pet-sick` | 宠物生病动画 | 同上 |

---

## 四、CSS 关键帧动画名（A 定义，B 不需直接引用）

| 动画名 | 触发时机 | 对应类名 |
|--------|----------|----------|
| `idleBounce` | 正常待机 | `.pet-normal` |
| `happyJump` | 操作后快乐 | `.pet-happy` |
| `sleepFloat` | 睡眠中 | `.pet-sleeping` |
| `sickShake` | 生病状态 | `.pet-sick` |

---

## 五、`data-action` 属性值（A 在 HTML 中定义，B 通过 `dataset.action` 读取传给 C）

| 值 | 对应操作 | data-action 枚举 |
|----|----------|------------------|
| `pet_free` | 抚摸（免费） | `'pet_free'` |
| `greet` | 打招呼 | `'greet'` |
| `feed` | 喂食 | `'feed'` |
| `clean` | 洗澡 | `'clean'` |
| `highfive` | 击掌 | `'highfive'` |
| `cheer` | 加油 | `'cheer'` |
| `pet_extra` | 抚摸（额外） | `'pet_extra'` |
| `sleep` | 睡觉（快速充电） | `'sleep'` |

> B 读取：`this.dataset.action` → 传给 `GameLogic.performAction(state, actionKey)`  
> C 在 `GameLogic.actions` 中必须定义完全相同的 8 个 key（`play`、`heal` 已移除，新增 6 个）

---

## 六、JS 全局对象名（C 定义，B 直接调用）

| 全局对象 | 定义文件 | 用途 |
|----------|----------|------|
| `GameLogic` | `js/gameLogic.js` | 提供所有算法和规则方法 |
| `Storage` | `js/storage.js` | 提供所有存档读写方法 |

> **规则**：两个对象名必须全局唯一，B 和 C 不得修改对方定义的对象名。

---

## 七、`GameLogic` 属性和方法签名（C 定义，B 调用）

### 7.1 属性

| 路径 | 类型 | 说明 |
|------|------|------|
| `GameLogic.defaultState` | Object | 宠物初始状态默认值 |
| `GameLogic.actions` | Object | 8 种操作的配置集合（含 cost 专注星消耗字段） |

### 7.2 方法签名

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `GameLogic.xpForLevel(level)` | `level: number` | `number` | 根据等级计算所需经验值 |
| `GameLogic.addXp(state, amount)` | `state: Object, amount: number` | `number` | 增加经验，返回新等级 |
| `GameLogic.performAction(state, actionKey)` | `state: Object, actionKey: string` | `{ state: Object, message: string }` | 执行操作，返回新状态和消息 |
| `GameLogic.tick(state, minutes)` | `state: Object, minutes: number` | `Object` | 属性衰减计算，返回新状态。采用小时级极慢衰减，已移除健康值归零重置逻辑，符合 `animallogicC.md` "不惩罚" 原则 |
| `GameLogic.getWarning(state)` | `state: Object` | `string \| null` | 检查低属性警告，返回消息或 null |
| `GameLogic.claimDailyLogin(state)` | `state: Object` | `{ state: Object, message: string \| null, claimed: boolean }` | 每日首次登录奖励 2 专注星 |
| `GameLogic.enterFocus(state)` | `state: Object` | `Object` | 标记进入专注状态 |
| `GameLogic.leaveFocus(state)` | `state: Object` | `{ state: Object, message: string \| null, starsEarned: number }` | 离开专注状态，结算专注星 |
| `GameLogic.tickFocus(state)` | `state: Object` | `{ state: Object, message: string \| null }` | 每5分钟累加专注区块，达到24块自动结算 |
| `GameLogic.getStarsInfo(state)` | `state: Object` | `{ stars: number, dailyStars: number, dailyRemaining: number, sessionBlocks: number }` | 获取当前专注星信息 |

### 7.3 `GameLogic.actions` 子结构（C 定义，B 通过 `performAction` 间接使用）

每个 action 的结构如下（以 `feed` 为例，新增 `cost` 字段表示专注星消耗）：

```js
GameLogic.actions = {
    // ─── 免费互动（cost=0） ───
    pet_free: {
        label: '抚摸',
        effects: { affection: 1, happiness: 2 },
        cost: 0,         // 免费
        xpReward: 3,
        message: '😊 暖暖的～'
    },
    greet: {
        label: '打招呼',
        effects: { happiness: 1 },
        cost: 0,
        xpReward: 2,
        message: '👋 它抬头看了你一眼'
    },
    // ─── 点数互动（cost>0） ───
    feed: {
        label: '喂食',
        effects: { hunger: 15 },
        cost: 3,
        xpReward: 15,
        message: '🍔 好吃～谢谢你！'
    },
    clean: {
        label: '洗澡',
        effects: { hygiene: 20 },
        cost: 3,
        xpReward: 12,
        message: '🧼 好干净！'
    },
    highfive: {
        label: '击掌',
        effects: { energy: 5, happiness: 3 },
        cost: 2,
        xpReward: 10,
        message: '✋ 啪！配合完美！'
    },
    cheer: {
        label: '加油',
        effects: { happiness: 5 },
        cost: 1,
        xpReward: 5,
        message: '💪 加油加油！'
    },
    pet_extra: {
        label: '抚摸（额外）',
        effects: { affection: 2, happiness: 3 },
        cost: 1,
        xpReward: 8,
        message: '🥰 它蹭了蹭你的手'
    },
    sleep: {
        label: '睡觉（快速充电）',
        effects: { energy: 20 },
        cost: 2,
        xpReward: 10,
        message: '😴 充能完毕！'
    }
};
```

> **`effects` 的 key 必须与状态对象字段（见第十节）完全一致**，`performAction` 会遍历 `effects` 逐字段更新。
> **`cost`**：专注星消耗量，`cost=0` 表示免费互动。
> **亲密度 (`affection`)**：无上限，`performAction` 不会对其做 0-100 截断。

---

## 八、`Storage` 方法签名（C 定义，B 调用）

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Storage.save(state)` | `state: Object` | `boolean` | 保存存档到 localStorage |
| `Storage.load()` | 无 | `Object \| null` | 从 localStorage 读取存档 |
| `Storage.clear()` | 无 | `boolean` | 清除 localStorage 中的存档 |
| `Storage.hasSave()` | 无 | `boolean` | 检查是否存在存档 |
| `Storage.getSaveTime()` | 无 | `string \| null` | 获取存档时间的格式化字符串 |

---

## 九、localStorage Key（C 定义，其他人不要直接操作 localStorage）

| key | 值 | 说明 |
|-----|-----|------|
| `'pet_companion_save'` | JSON 字符串 | 存档数据，仅 C 通过 `Storage` 对象读写 |

> **规则**：A 和 B 不得直接调用 `localStorage.setItem/getItem/removeItem`，必须通过 `Storage` 对象操作。

---

## 十、状态对象字段（核心契约——三人必须完全一致）

以下字段是 `gameState` 对象的全部属性，**A 需要在 HTML 中定义对应的展示元素，B 负责渲染到 UI，C 负责维护数据逻辑**：

| 字段 | 类型 | 默认值 | 范围 | 中文含义 | 对应 HTML id |
|------|------|--------|------|----------|-------------|
| `name` | string | `'小宠物'` | — | 宠物名称 | `pet-name` |
| `level` | number | `1` | 1+ | 等级 | `level` |
| `xp` | number | `0` | 0+ | 当前经验值 | `xp` |
| `age` | number | `0` | 0+ | 存活天数 | `age` |
| `hunger` | number | `80` | 0-100 | 饱食度 | `hunger-fill` / `hunger-value` |
| `happiness` | number | `70` | 0-100 | 快乐度 | `happiness-fill` / `happiness-value` |
| `energy` | number | `90` | 0-100 | 精力 | `energy-fill` / `energy-value` |
| `hygiene` | number | `60` | 0-100 | 清洁度 | `hygiene-fill` / `hygiene-value` |
| `isSleeping` | boolean | `false` | true/false | 是否在睡觉 | 影响宠物表情 |
| `createdAt` | number | `Date.now()` | — | 创建时间戳 | — |
| `savedAt` | number | `Date.now()` | — | 最后保存时间戳 | —（仅存档用） |
| `focusTime` | number | `0` | 0+ | 本次专注时长（分钟） | —（已实现） |
| `mood` | string | `'neutral'` | happy/neutral/sad | 学习结束后的情绪标签 | —（已实现） |
| `interruptions` | number | `0` | 0+ | 学习过程中断次数 | —（已实现） |
| `affection` | number | `0` | 0+（无上限） | 亲密度（长期陪伴见证） | —（已实现，通过 `pet_free`/`pet_extra` 互动增加） |
| `stars` | number | `0` | 0+（软上限） | 专注星（奖励点数） | —（已实现） |
| `dailyStars` | number | `0` | 0-80 | 当日已获专注星数 | —（已实现，每日重置） |
| `lastDailyReset` | number | `0` | — | 上次每日重置时间戳 | —（仅内部使用） |
| `lastDailyLoginClaim` | number | `0` | — | 上次领取登录奖励时间戳 | —（仅内部使用） |
| `isFocused` | boolean | `false` | true/false | 是否处于专注状态 | —（已实现，B 控制状态切换） |
| `focusBlocks` | number | `0` | 0-24 | 专注时段累计区块数 | —（已实现，每块=5分钟专注） |

> **已实现**：`focusTime`、`mood`、`interruptions`、`affection`、`stars`、`dailyStars`、`lastDailyReset`、`lastDailyLoginClaim`、`isFocused`、`focusBlocks` 已在 `gameLogic.js` 的 `defaultState` 中添加。  
> **已移除**：`health`（健康值系统）已按 `animallogicC.md` 新设计移除，不再衰减也不会归零重置。

---

## 十一、app.js 内部变量命名（B 内部使用，但 A 可参考以了解自己的 HTML id 被如何引用）

### 11.1 `el` 对象结构（DOM 引用集合）

```js
const el = {
    // 基础信息
    level:     document.getElementById('level'),
    xp:        document.getElementById('xp'),
    xpNext:    document.getElementById('xp-next'),
    xpFill:    document.getElementById('xp-fill'),
    age:       document.getElementById('age'),
    petName:   document.getElementById('pet-name'),
    petSprite: document.getElementById('pet-sprite'),
    message:   document.getElementById('pet-message'),

    // 属性面板（每个属性含 fill 和 value 两个子元素）
    hunger:    { fill: document.getElementById('hunger-fill'),    value: document.getElementById('hunger-value') },
    happiness: { fill: document.getElementById('happiness-fill'), value: document.getElementById('happiness-value') },
    energy:    { fill: document.getElementById('energy-fill'),    value: document.getElementById('energy-value') },
    hygiene:   { fill: document.getElementById('hygiene-fill'),   value: document.getElementById('hygiene-value') },

    // 按钮
    actionBtns: document.querySelectorAll('.action-btn'),
    saveBtn:    document.getElementById('save-btn'),
    loadBtn:    document.getElementById('load-btn'),
    resetBtn:   document.getElementById('reset-btn')
};
```

### 11.2 变量和函数

| 名称 | 类型 | 用途 | 备注 |
|------|------|------|------|
| `gameState` | 变量 | 当前宠物状态对象 | 全局变量，类型为状态对象 |
| `tickInterval` | 变量 | 衰减定时器句柄 | 由 `setInterval` 返回，用于可能的清除 |
| `TICK_INTERVAL_MS` | 常量 | 衰减定时器间隔（毫秒） | `300000`（5分钟） |
| `el` | 常量 | DOM 元素引用集合 | 结构见 11.1 |
| `render()` | 函数 | 渲染所有 UI | 无参数，读取 `gameState` |
| `updatePetAppearance(s)` | 函数 | 更新宠物表情和动画 class | 参数 `s`: 状态对象，被 `render()` 调用 |
| `triggerHappyAnimation()` | 函数 | 触发快乐跳跃动画 | 操作后调用，600ms 后恢复 |
| `showMessage(text, isImportant)` | 函数 | 显示气泡消息 | 带淡入动画 |
| `handleAction(actionKey)` | 函数 | 操作按钮统一处理 | 调用 `GameLogic.performAction` → `render()` → `Storage.save` |
| `doTick()` | 函数 | 定时衰减处理 | 调用 `GameLogic.tick` → `render()` → `Storage.save` |
| `handleSave()` | 函数 | 保存按钮点击处理 | 调用 `Storage.save` |
| `handleLoad()` | 函数 | 读档按钮点击处理 | 调用 `Storage.load` → `render()` |
| `handleReset()` | 函数 | 重置按钮点击处理 | 调用 `Storage.clear`，重置为 `GameLogic.defaultState` |
| `applyOfflineProgress()` | 函数 | 离线时间计算 | 调用 `Storage.load` 和 `GameLogic.tick`，返回 boolean |
| `init()` | 函数 | 初始化入口 | 页面加载时调用，流程：离线计算 → 加载存档 → 绑定事件 → 启动定时器 |

---

## 十二、修改规则

1. **任何人要新增或修改命名**，必须先更新本文件，再通知其他两人
2. **字段名冲突**：以上所有命名在各自命名空间内必须唯一
3. **删除命名**：必须先确认没有其他代码引用，再删除并更新本文件
4. **本文件是三人协作的"契约"**，代码审查时以本文件为参考标准
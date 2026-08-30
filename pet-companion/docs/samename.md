好的，我来给你一份完整的统一接口文档。这份文档会放在 `docs/prompt.md` 中，你和 A、B 都按这个来。

---

## 📄 docs/prompt.md

```markdown
# 宠物伙伴 - 统一接口文档

> 三人必须严格遵循以下命名规范，确保代码互通。

---

## 一、数据字段（状态对象）

所有游戏状态存储为一个对象，字段如下：

| 字段 | 类型 | 含义 | 取值范围 |
|------|------|------|----------|
| `hunger` | number | 饱食度 | 0-100 |
| `happiness` | number | 快乐度 | 0-100 |
| `energy` | number | 精力 | 0-100 |
| `hygiene` | number | 清洁度 | 0-100 |
| `health` | number | 健康值 | 0-100 |
| `level` | number | 等级 | 1+ |
| `xp` | number | 当前经验值 | 0+ |
| `isSleeping` | boolean | 是否在睡觉 | true/false |
| `lastSaved` | string | 上次保存时间（ISO 字符串） | 如 "2026-08-30T10:30:00.000Z" |

### 状态对象示例
```javascript
const gameState = {
  hunger: 80,
  happiness: 70,
  energy: 60,
  hygiene: 90,
  health: 85,
  level: 3,
  xp: 45,
  isSleeping: false,
  lastSaved: new Date().toISOString()
}
```

---

## 二、storage.js 接口（C 提供）

| 函数名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `saveGame(data)` | `data`: 状态对象 | `void` | 保存游戏状态到 localStorage |
| `loadGame()` | 无 | `状态对象 \| null` | 加载存档，无存档返回 null |
| `resetGame()` | 无 | `void` | 清除所有存档数据 |
| `hasSave()` | 无 | `boolean` | 检查是否存在存档 |

### 调用示例
```javascript
// 保存
saveGame(gameState);

// 读取
const data = loadGame();
if (data) {
  // 恢复状态
}

// 重置
resetGame();

// 检查存档
if (hasSave()) {
  // 显示"继续游戏"按钮
}
```

---

## 三、gameLogic.js 接口（C 提供）

| 函数名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `calculateXP(action)` | `action`: 字符串（见下表） | `number` | 计算某动作获得的经验值 |
| `checkLevelUp(xp)` | `xp`: 当前经验值 | `{ levelUp, newLevel, remainingXP }` | 检查是否升级 |
| `getDecayRate(stat)` | `stat`: 字符串（属性名） | `number` | 获取该属性的衰减速率（每小时） |
| `applyDecay(state)` | `state`: 状态对象 | `新状态对象` | 根据时间差计算衰减，返回新状态 |
| `getMaxStat()` | 无 | `number` | 返回属性最大值（固定 100） |
| `isStatValid(value)` | `value`: number | `boolean` | 检查属性值是否在 0-100 范围内 |
| `getLevelUpXP(level)` | `level`: 当前等级 | `number` | 计算升到下一级所需总经验 |

### action 类型说明（用于 calculateXP）

| action | 说明 | 基础经验值 |
|--------|------|-----------|
| `'feed'` | 喂食 | 10 |
| `'play'` | 玩耍 | 15 |
| `'sleep'` | 睡觉 | 5 |
| `'bathe'` | 洗澡 | 8 |
| `'heal'` | 治疗 | 12 |

### 调用示例
```javascript
// 计算喂食所得经验
const xpGain = calculateXP('feed');  // 返回 10

// 检查是否升级
const result = checkLevelUp(150);
// 返回 { levelUp: true, newLevel: 2, remainingXP: 50 }

// 应用衰减（传入当前状态，返回新状态）
const newState = applyDecay(gameState);

// 获取某一属性的衰减速率
const decay = getDecayRate('hunger');  // 返回 2（每小时掉2点）
```

---

## 四、app.js 要监听的 DOM 元素（A 负责提供）

B 的交互代码需要操作以下元素：

| 用途 | 推荐 ID | 说明 |
|------|---------|------|
| 喂食按钮 | `#btn-feed` | 点击触发喂食 |
| 玩耍按钮 | `#btn-play` | 点击触发玩耍 |
| 睡觉按钮 | `#btn-sleep` | 点击切换睡眠状态 |
| 洗澡按钮 | `#btn-bathe` | 点击触发洗澡 |
| 治疗按钮 | `#btn-heal` | 点击触发治疗 |
| 保存按钮 | `#btn-save` | 点击手动保存 |
| 重置按钮 | `#btn-reset` | 点击重置游戏 |
| 状态显示区域 | `#status-display` | 展示所有属性数值 |
| 宠物表情/图片 | `#pet-image` | 显示宠物当前表情 |
| 等级显示 | `#level-display` | 显示当前等级 |
| 经验条 | `#xp-bar` | 显示经验进度 |
| 经验值显示 | `#xp-display` | 显示具体经验数值 |

### 可选动画类名（用于 CSS 动画）

| 动作 | 建议添加的类名 | 说明 |
|------|---------------|------|
| 喂食 | `animate-feed` | 宠物进食动画 |
| 玩耍 | `animate-play` | 宠物跳跃动画 |
| 睡觉 | `animate-sleep` | 睡觉 Zzz 动画 |
| 洗澡 | `animate-bathe` | 水花动画 |
| 升级 | `animate-levelup` | 升级闪光动画 |

---

## 五、文件引用关系

```
index.html
  ├── css/style.css         （A 提供）
  ├── js/storage.js         （C 提供）
  ├── js/gameLogic.js       （C 提供）
  └── js/app.js             （B 提供）
```

在 `index.html` 中按以下顺序引入：

```html
<script src="js/storage.js"></script>
<script src="js/gameLogic.js"></script>
<script src="js/app.js"></script>
```

**注意**：`app.js` 依赖 `storage.js` 和 `gameLogic.js`，所以后两者必须先加载。

---

## 六、数据流转示意

```
用户操作（点击按钮）
       ↓
    app.js（B 负责）
       ↓
    ├── 调用 gameLogic.calculateXP()     → 获得经验值
    ├── 调用 gameLogic.checkLevelUp()    → 检查是否升级
    ├── 调用 gameLogic.applyDecay()      → 计算衰减
    ├── 更新 UI 显示
    └── 调用 storage.saveGame()          → 保存存档
```

---

## 七、错误处理规范

- `storage.js` 中的读写操作必须用 `try-catch` 包裹
- 加载存档失败时返回 `null`，由 `app.js` 处理默认值
- `gameLogic.js` 中的纯函数不应抛出异常，应返回合理的默认值

---

## 八、版本记录

| 日期 | 版本 | 修改内容 | 修改人 |
|------|------|----------|--------|
| 2026-08-30 | v1.0 | 初始版本，定义所有接口 | C |

```

---

## 📋 你需要做的事情

1. **把这整份内容复制到** `docs/prompt.md` 文件中
2. **提交到你的 feature/storage 分支**：

```bash
git add docs/prompt.md
git commit -m "docs: 添加统一接口文档"
git push origin feature/storage
```

3. **把这份文档发给 A 和 B**，告诉他们：
   - 按文档中的 ID 命名来写 HTML（A）
   - 按文档中的接口名来调用（B）
   - 文档位置在 `docs/prompt.md`

---

## 🔗 接口调用关系图

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                          │
│  (A 提供：按钮 ID、状态显示区域、宠物图片)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                          app.js                            │
│  (B 负责：绑定按钮、调用接口、更新 UI)                      │
└─────────────────────────────────────────────────────────────┘
                    ↓                      ↓
┌─────────────────────────┐  ┌─────────────────────────────┐
│      storage.js         │  │       gameLogic.js          │
│  (C 提供：存档读写)      │  │  (C 提供：算法计算)         │
│                         │  │                             │
│  • saveGame()           │  │  • calculateXP()            │
│  • loadGame()           │  │  • checkLevelUp()           │
│  • resetGame()          │  │  • applyDecay()             │
│  • hasSave()            │  │  • getDecayRate()           │
└─────────────────────────┘  └─────────────────────────────┘
```

---


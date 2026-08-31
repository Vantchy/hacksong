# A / B 成员 — 待办事项与注意事项

> 本文档基于 C 已完成的代码变更和项目设计文档，收集 A 和 B 需要配合修改的全部内容。

---

## 一、A 需要做的改动（HTML / CSS）

### 🔴 必须改

#### 1. 删除旧按钮

以下 `data-action` 值的按钮已从 `GameLogic.actions` 中移除，**必须从 HTML 中删除**，否则点击会显示"未知操作"：

| 旧按钮 | 原因 |
|--------|------|
| `data-action="play"` | 玩耍操作已移除 |
| `data-action="heal"` | 健康值系统已移除，heal 随 health 删除 |

#### 2. 新增按钮

C 新增了 6 个操作，需要在 HTML 中创建对应按钮。`data-action` 值必须与下方完全一致：

| data-action | 按钮文字 | 类型 | 专注星消耗 | 备注 |
|-------------|----------|------|-----------|------|
| `pet_free` | 抚摸 | 免费互动 | 0 | 每天限 1 次（B 控制） |
| `greet` | 打招呼 | 免费互动 | 0 | 每天限 1 次（B 控制） |
| `highfive` | 击掌 | 点数互动 | 2 | |
| `cheer` | 加油 | 点数互动 | 1 | |
| `pet_extra` | 抚摸（额外） | 点数互动 | 1 | |
| `sleep` | 睡觉（快速充电） | 点数互动 | 2 | 效果已改为"瞬间回能" |

所有按钮需统一使用 CSS class `.action-btn`（B 用 `querySelectorAll` 绑定事件）。

#### 3. 专注星 UI 展示元素

C 的专注星系统已实现，A 需要在 HTML 中添加以下展示区域（id 已预留，B 会将数据渲染到对应元素）：

| 展示内容 | 建议 HTML id |
|----------|-------------|
| 专注星总数 | `star-count` |
| 当日已获专注星数 | `daily-star-count` |
| 当日剩余可获专注星数 | `daily-star-remaining` |
| 当前专注时段区块数（0-24） | `focus-block-count` |
| 专注星不足提示区域 | `star-warning`（可选，B 也可用 `pet-message`） |

#### 4. 适配健康值移除

CSS 中 `.pet-sick` 动画 class 已不再有意义（health 已移除），A 可以删除或保留，B 不会再使用这个 class。

---

### 🟡 建议改

#### 5. 按钮视觉区分

建议在 CSS 中给免费互动和点数互动不同的视觉样式，让用户一眼能区分：

```css
.action-btn-free { /* 免费：绿色/圆角/小 */ }
.action-btn-star { /* 点数：金色/星标 */ }
```

#### 6. 亲密度展示 + 宠物形态切换（可选）

C 已实现 `affection` 亲密度字段，通过 `pet_free` 和 `pet_extra` 增加。A 可以在 UI 中添加亲密度展示（如心形图标或进度条），数据由 B 渲染。

**C 新增 `getAffectionStage(state)` 方法**，返回当前亲密度所处行为阶段（`'newbie'` / `'familiar'` / `'intimate'` / `'bestie'` / `'forever'`），B 调用后根据返回值切换宠物 CSS class，A 为每个阶段设计对应的视觉形态和动画。

| 展示内容 | 建议 HTML id / CSS class |
|----------|--------------------------|
| 亲密度数值 | `affection-value` |
| 形态阶段 CSS class | `.pet-newbie`, `.pet-familiar`, `.pet-intimate`, `.pet-bestie`, `.pet-forever`（A 定义，B 切换） |

---

## 二、B 需要做的改动（`app.js`）

### 🔴 必须改

#### 1. 专注状态检测（核心新增职责）

B 需要实现完整的专注状态检测逻辑，这是 B 的核心新增功能：

```js
// 需要实现的功能：
// 1. 监听浏览器可见性（document.visibilitychange）
// 2. 监听用户活动（mousemove / keydown / touchstart）
// 3. 90 秒无活动 → 标记为非专注
// 4. 调用 GameLogic 的专注方法：
//    - 专注开始 → GameLogic.enterFocus(state)
//    - 专注中每5分钟 → GameLogic.tickFocus(state)
//    - 专注结束 → GameLogic.leaveFocus(state)
// 5. 界面显示当前专注状态
```

#### 2. 绑定新按钮事件

旧按钮（play, heal）已删除，新按钮（pet_free, greet, highfive, cheer, pet_extra）已添加。B 的按钮绑定逻辑保持不变（仍通过 `data-action` 读取），但需确保能绑定到所有新按钮。

#### 3. 处理专注星不足

`performAction` 返回的 `message` 现在包含 `⭐ 需要 X 专注星，当前不足`。B 需要将这条消息渲染到 UI（如 `pet-message` 元素）。

#### 4. 调用每日登录奖励（绑定"写下意图"按钮）

B **不再在页面加载时自动调用** `claimDailyLogin`，而是绑定到"写下学习目标"按钮/输入框的提交事件：

```js
// ❌ 旧：页面加载时自动调用
// GameLogic.claimDailyLogin(state);

// ✅ 新：用户写下意图后调用
const result = GameLogic.claimDailyLogin(state, true);
```

- 子页面加载/初始化时**不传参或传 false**，不会发放奖励，返回提示"先写下目标"
- 只有当用户写下了学习意图（B 检测到输入框有内容并提交）时，才传 `true`
- 今日已领取过则 `claimed: false`，不会重复发放

#### 5. 调用完成目标奖励（绑定"标记完成"按钮）

B 在用户点击"完成今日目标"按钮时调用 `GameLogic.claimDailyGoal(state)`：

```js
const result = GameLogic.claimDailyGoal(state);
if (result.claimed) {
  showMessage(result.message);  // "🎯 完成今日目标，获得 3 专注星！"
}
```

- 每天限 1 次，再次调用返回 `claimed: false`
- 受每日 80 星上限保护，若当日已达上限则奖励不足 3 星

#### 6. 专注结算 UI 反馈

`GameLogic.leaveFocus(state)` 返回 `{ state, message, starsEarned }`。B 需要将 `starsEarned` 展示给用户（如弹窗或消息提示）。

#### 7. 渲染专注星信息到 UI

B 定期调用 `GameLogic.getStarsInfo(state)`，将返回的数据填充到 A 定义的 HTML 元素中：

```js
const info = GameLogic.getStarsInfo(state);
// 渲染到对应元素
document.getElementById('star-count').textContent = info.stars;
document.getElementById('daily-star-count').textContent = info.dailyStars;
document.getElementById('daily-star-remaining').textContent = info.dailyRemaining;
document.getElementById('focus-block-count').textContent = info.sessionBlocks;
```

---

### 🟡 建议改

#### 7. 免费互动每日次数限制

`pet_free`（抚摸）和 `greet`（打招呼）每天各限 1 次。B 需要记录上次使用时间戳，当天已使用过则不再允许调用。C 不负责这个限制，**由 B 在前端控制**。

#### 8. 适配 CSS 动画 class

B 切换宠物动画时，移除 `.pet-sick` 的使用（已随 health 一起删除）。

---

## 三、A+B 共同注意事项

### 3.1 `data-action` 完整枚举

所有参与方必须保持一致：

```
pet_free, greet, feed, clean, highfive, cheer, pet_extra, sleep
```

> 已移除：`play`, `heal`  
> 已变更：`sleep` 从"睡觉切换"改为"快速充电"（纯属性操作，不再 toggle isSleeping）

### 3.2 HTML id 完整列表

A 定义的 id 必须与 B 的 `document.getElementById` 一致：

| 已有 id | 用途 |
|---------|------|
| `pet-name` | 宠物名称 |
| `level` | 等级 |
| `xp` / `xp-next` / `xp-fill` | 经验值 |
| `age` | 年龄 |
| `pet-sprite` | 宠物形象 |
| `pet-message` | 消息气泡 |
| `hunger-fill` / `hunger-value` | 饱食度 |
| `happiness-fill` / `happiness-value` | 快乐度 |
| `energy-fill` / `energy-value` | 精力 |
| `hygiene-fill` / `hygiene-value` | 清洁度 |
| `save-btn` / `load-btn` / `reset-btn` | 存档按钮 |

**新增 id（A 需创建，B 会渲染）：**

| 新增 id | 用途 |
|---------|------|
| `star-count` | 专注星总数 |
| `daily-star-count` | 当日已获专注星 |
| `daily-star-remaining` | 当日剩余可获 |
| `focus-block-count` | 当前专注区块数 |
| `affection-value` | 亲密度数值（可选） |

### 3.3 CSS class 完整列表

| class | 用途 | 状态 |
|-------|------|------|
| `.action-btn` | 所有操作按钮 | 不变 |
| `.pet-normal` | 宠物正常表情 | 不变 |
| `.pet-happy` | 宠物开心表情 | 不变 |
| `.pet-sleeping` | 宠物睡觉表情 | 不变 |
| `.pet-sick` | 宠物生病表情 | **已废弃**（随 health 删除） |

---

## 四、建议执行顺序

### A 的顺序

| 步骤 | 内容 | 优先级 |
|------|------|--------|
| 1 | 删除 play 和 heal 按钮 | 🔴 |
| 2 | 新增 6 个按钮（见上方表格） | 🔴 |
| 3 | 新增专注星展示元素（id 见上方） | 🔴 |
| 4 | 可选：亲密度展示、视觉区分 | 🟡 |

### B 的顺序

| 步骤 | 内容 | 优先级 |
|------|------|--------|
| 1 | 实现专注状态检测（浏览器可见性 + 用户活动监听） | 🔴 |
| 2 | 新按钮事件绑定 | 🔴 |
| 3 | 每日登录奖励调用和展示 | 🔴 |
| 4 | 专注结算 UI 反馈 | 🔴 |
| 5 | 专注星信息渲染到 UI | 🔴 |
| 6 | 专注星不足消息处理 | 🔴 |
| 7 | 免费互动每日次数限制 | 🟡 |
| 8 | 移除 `.pet-sick` 相关逻辑 | 🟡 |

### 协作步骤

| 步骤 | 内容 | 谁做 |
|------|------|------|
| 1 | A 完成 HTML 结构，确保所有 id 和 data-action 正确 | A |
| 2 | B 基于 A 的 HTML 编写 app.js，绑定事件和渲染 | B |
| 3 | C 评审 A 和 B 的 PR，确保 data-action 和接口对齐 | C |
| 4 | 三方联调，验证专注星经济闭环 | A+B+C |

---

## 五、⚠️ 绝对不能踩的坑

### 1. 接口签名不能改

```js
GameLogic.performAction(state, actionKey) → { state, message }
GameLogic.tick(state, minutes)            → Object
GameLogic.getWarning(state)               → string | null
// 专注星相关
GameLogic.enterFocus(state)               → Object
GameLogic.leaveFocus(state)               → { state, message, starsEarned }
GameLogic.tickFocus(state)                → { state, message }
GameLogic.getStarsInfo(state)             → { stars, dailyStars, dailyRemaining, sessionBlocks }
GameLogic.claimDailyLogin(state)          → { state, message, claimed }
```

### 2. 全局对象名不能改

```js
GameLogic  → 定义在 gameLogic.js
Storage    → 定义在 storage.js
```

### 3. 不要越界

| 不能碰 | 原因 |
|--------|------|
| `js/gameLogic.js` | 那是 C 的领域 |
| `js/storage.js` | 那是 C 的领域 |
| 直接操作 `localStorage` | 必须通过 `Storage` 对象 |
| 修改 `data-action` 值 | 需要和 C 协商 |
| 修改 `[B+C]` 接口区的方法签名 | 需要和 C 协商 |

### 4. 按钮 data-action 值必须与 C 的 actions key 完全一致

大小写、下划线都不能错，否则 `performAction` 返回"未知操作"。

### 5. 专注星每日上限

`GameLogic.leaveFocus` 内部已处理每日 80 星上限和每时段 120 分钟上限，B 无需额外限制，但需要在 UI 上展示剩余可获星数（`dailyRemaining`）。
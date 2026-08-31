# ⚠️ C 成员 — 待办事项与注意事项

> 本文档基于 README、skeleton.md、samename.md 及现有代码分析生成，供 C 明确开发范围和避坑。

---

## 一、C 负责的文件

| 文件 | 当前状态 | 说明 |
|------|----------|------|
| `js/storage.js` | ✅ 基本完成 | save / load / clear / hasSave / getSaveTime |
| `js/gameLogic.js` | ✅ 核心功能已实现 | defaultState / 极慢衰减 / 8 个操作 / 专注星系统 / 画像分析 / 倒计时 / 软上限 / 奖励系统 |
| `.gitignore` | ✅ 已创建 | 排除 OS 文件、编辑器配置、项目构建产物 |
| `README.md` | ✅ 已有 | 维护即可 |
| GitHub 仓库 | ✅ 已初始化 | |

---

## 二、已实现功能总览

### 🔴 P0 — 全部完成

| 项 | 说明 | 状态 |
|----|------|------|
| 属性衰减和健康值系统 | 从 defaultState 移除 health，移除 heal 操作，重写 tick() 为小时级极慢衰减 | ✅ |
| 互动操作对接专注星消耗 | 8 个操作（2 免费 + 6 点数），每项含 cost 字段，performAction 检查余额并扣除 | ✅ |

### 🟠 P1 — 全部完成

| 项 | 说明 | 状态 |
|----|------|------|
| 经验系统对接点数消耗 | xpReward 改为 `cost × 5` 动态计算 | ✅ |
| 画像数据字段配套方法 | 实现 addFocusTime / recordMood / addInterruption | ✅ |

### 🟡 P2 — 已完成

| 项 | 说明 | 状态 |
|----|------|------|
| 设计历史记录数据结构 | 方案A：state 内 history 数组，每项 7 字段，上限 100 条 | ✅ |
| 实现 getAnalysis 画像分析 | 返回 9 个字段（总览/情绪分布/最佳时段/连续学习天数等） | ✅ |
| 倒计时逻辑 | startCountdown + tickCountdown，辅助 B 的"深呼吸"功能 | ✅ |
| 专注星软上限机制 | getStarsRate 方法，<100星100%，<200星75%，<300星50%，≥300星30% | ✅ |
| 每日奖励绑定"写下意图" | claimDailyLogin 改为 hasWrittenIntention 参数，B 传 true 才发放 | ✅ |
| 完成自定学习目标奖励 | claimDailyGoal 方法，每天限 1 次奖励 3 星 | ✅ |

### 🟡 P2 — 待实现

| 项 | 说明 | 预计时间 |
|----|------|----------|
| — | 所有 P2 项已全部完成 | ✅ |

---

## 三、已实现的方法完整列表

### 核心方法（B 直接调用）

```
GameLogic.performAction(state, actionKey)   → { state, message }   // 互动操作（含专注星检查）
GameLogic.tick(state, minutes)              → Object               // 属性衰减（小时级极慢）
GameLogic.getWarning(state)                 → string | null        // 低属性警告
GameLogic.enterFocus(state)                 → Object               // 进入专注状态
GameLogic.leaveFocus(state)                 → { state, message, starsEarned }
GameLogic.tickFocus(state)                  → { state, message }   // 每5分钟累加区块
GameLogic.claimDailyLogin(state, hasWrittenIntention) → { state, message, claimed }
GameLogic.claimDailyGoal(state)             → { state, message, claimed }
GameLogic.getStarsInfo(state)               → Object               // 专注星信息汇总
GameLogic.addFocusTime(state, minutes)      → Object               // 累加专注时长
GameLogic.recordMood(state, mood)           → Object               // 记录情绪
GameLogic.addInterruption(state)            → Object               // 记录中断
GameLogic.startCountdown(state, seconds)    → Object               // 启动倒计时
GameLogic.tickCountdown(state)              → { state, finished }  // 每秒递减
GameLogic.recordSession(state, data)        → Object               // 记录学习历史
GameLogic.getAnalysis(state)                → Object               // 画像分析
```

### 内部方法（B 不直接调用）

```
GameLogic.getStarsRate(state)               → number               // 软上限倍率
GameLogic._checkDailyReset(state)           → void                 // 每日重置
GameLogic.addXp(state, amount)              → void                 // 经验增长（内部调用 xpForLevel）
```

---

## 四、项目管理职责

| 任务 | 状态 |
|------|------|
| 创建 GitHub 仓库 | ✅ |
| 初始化 git 并 push | ✅ |
| 创建 `.gitignore` | ✅ |
| 创建 feature 分支开发 | ✅ |
| 审核并合并 A 和 B 的 PR | ⏳ 待 A/B 完成 |
| 解决合并冲突 | ⏳ 待合并时处理 |

---

## 五、⚠️ 绝对不能踩的坑

### 1. 接口契约不能改（[B+C] 接口区）

以下方法签名是 B 在 `app.js` 中写死调用的，**改了 B 的代码就断**：

```
GameLogic.performAction(state, actionKey) → { state, message }
GameLogic.tick(state, minutes)           → Object
GameLogic.getWarning(state)              → string | null
Storage.save(state)                      → boolean
Storage.load()                           → Object | null
Storage.clear()                          → boolean
```

### 2. 全局对象名不能改

```
GameLogic  → 定义在 gameLogic.js
Storage    → 定义在 storage.js
```

B 的 `app.js` 直接引用这两个全局对象，**不能改名**。

### 3. 新增方法/字段必须先更新 samename.md

修改前先更新 `docs/samename.md`，再通知 A 和 B。

### 4. 不要越界

| 不能碰 | 原因 |
|--------|------|
| `js/app.js` | 那是 B 的领域 |
| `index.html` | 那是 A 的领域 |
| `css/style.css` | 那是 A 的领域 |
| 直接操作 localStorage | 通过 `Storage` 对象封装，外部只调方法 |
| 修改 `[A+B]` 接口区的 id / class / data-action | 需要和 A 协商 |

### 5. 画像是本地还是云端？

README 说"本地存储（兼顾隐私）+ 可选云端同步"。当前只有 localStorage，如果要预留云端接口，`Storage` 对象需要设计扩展点（如 `Storage.setSyncProvider(provider)`）。

---

## 六、建议执行顺序

| 步骤 | 内容 | 状态 |
|------|------|------|
| 1 | 创建 `.gitignore` | ✅ |
| 2 | 初始化 git 仓库并 push | ✅ |
| 3 | 修复属性衰减和健康值系统（从 defaultState 移除 health，重写 tick()） | ✅ |
| 4 | 互动操作对接专注星消耗（actions 加 cost，performAction 检查余额） | ✅ |
| 5 | 经验系统改为 `cost × 5` 动态计算 | ✅ |
| 6 | 实现画像数据字段配套方法（addFocusTime / recordMood / addInterruption） | ✅ |
| 7 | 设计历史记录数据结构（方案A）并实现 recordSession | ✅ |
| 8 | 实现 getAnalysis 画像分析 | ✅ |
| 9 | 实现倒计时逻辑（startCountdown + tickCountdown） | ✅ |
| 10 | 专注星软上限机制（getStarsRate） | ✅ |
| 11 | 每日奖励绑定"写下意图"（claimDailyLogin 改参数） | ✅ |
| 12 | 完成自定学习目标奖励（claimDailyGoal） | ✅ |
| 13 | 亲密度里程碑行为变化 | ✅ |
| 14 | 等 A 和 B 完成，审核合并 PR | ⏳ |
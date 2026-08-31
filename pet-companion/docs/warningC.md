# ⚠️ C 成员 — 待办事项与注意事项

> 本文档基于 README、skeleton.md、samename.md 及现有代码分析生成，供 C 明确开发范围和避坑。

---

## 一、C 负责的文件

| 文件 | 当前状态 | 说明 |
|------|----------|------|
| `js/storage.js` | ✅ 基本完成 | save / load / clear / hasSave / getSaveTime |
| `js/gameLogic.js` | ✅ 基本完成 | defaultState / xp公式 / 操作 / 衰减 / 警告 |
| `.gitignore` | ❌ 未创建 | 需要创建 |
| `README.md` | ✅ 已有 | 维护即可 |
| GitHub 仓库 | ❌ 未初始化 | C 负责创建并 push |

---

## 二、待实现功能（按优先级排列）

### 🔴 优先级 1：创建 `.gitignore`

创建 `.gitignore` 文件，排除以下内容：

```
node_modules/
.DS_Store
*.log
.vscode/
.idea/
```

---

### 🟠 优先级 2：扩展状态对象，实现画像数据采集

README **模块3（状态记录）** 和 samename.md 第十节已预留字段，但 **gameLogic.js 中未实现**：

| 字段 | 当前状态 | 需要做什么 |
|------|----------|-----------|
| `focusTime` | 仅在 samename.md 中定义，gameLogic.js 中不存在 | 在 `defaultState` 中添加，在 `tick()` 中累计 |
| `mood` | 同上 | 在 `defaultState` 中添加，提供方法记录情绪 |
| `interruptions` | 同上 | 在 `defaultState` 中添加，提供方法记录中断 |

需要新增以下方法：

```
GameLogic.addFocusTime(state, minutes)   → Object   // 累加专注时长
GameLogic.recordMood(state, mood)        → Object   // 记录情绪标签 (happy/neutral/sad)
GameLogic.addInterruption(state)         → Object   // 记录中断次数
```

并在 `tick()` 中默认累计 `focusTime`（当用户处于专注状态时）。

---

### 🟠 优先级 3：实现数据画像分析（模块3核心）

需要新增画像分析方法：

```
GameLogic.getAnalysis(state) → {
  bestTimeSlot: string,        // 一周内哪个时间段专注最长
  bestMoodForStart: string,    // 哪种情绪状态下启动最快
  avgFocusLimit: number,       // 连续专注的平均时长上限
  history: Array               // 学习记录历史
}
```

⚠️ **设计决策：历史数据怎么存？**

当前 `state` 只存当前状态，没有历史记录。需要选择方案：

- **方案A**：在 `state` 中增加 `history` 数组，存储每次学习记录 `{ date, focusTime, mood, interruptions, startTime }`
- **方案B**：新增独立存储 key（如 `pet_companion_history`），在 `Storage` 中增加对应方法管理

**建议：选方案A**，简单直接，且 localStorage 存储量足够。

---

### 🟡 优先级 4：倒计时/定时器逻辑（辅助 B 的模块2）

模块2 "状态镜像" 中提到：
- "好烦，不想学" → 60秒深呼吸/发呆倒计时

这些 UI 交互归 B，但**倒计时逻辑**可由 C 提供，方便复用：

```
GameLogic.startCountdown(seconds)        → countdownState  // 创建倒计时状态
GameLogic.tickCountdown(countdownState)  → countdownState  // 每秒递减
```

---

### 🟢 优先级 5：长期陪伴演化（加分项，模块4）

README 描述的个性化行为（提前等待、主动询问、暗示休息），依赖画像数据积累。**先完成优先级 2 和 3 再考虑。**

---

## 三、项目管理职责

| 任务 | 说明 |
|------|------|
| 创建 GitHub 仓库 | 按照 README 第八节步骤 |
| 初始化 git 并 push | `git init` → `git add .` → `git commit` → `git push` |
| 创建 `.gitignore` | 见上 |
| 创建 `feature/storage` 分支 | 在自己分支上开发 |
| 审核并合并 A 和 B 的 PR | 合并到 `main` |
| 解决合并冲突 | 主要在 `index.html` 的 script 引用和 id 定义上 |

---

## 四、⚠️ 绝对不能踩的坑

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

## 五、建议执行顺序

| 步骤 | 内容 | 预计时间 |
|------|------|----------|
| 1 | 创建 `.gitignore` | 5分钟 |
| 2 | 初始化 git 仓库并 push | 10分钟 |
| 3 | 创建 `feature/storage` 分支 | 2分钟 |
| 4 | `defaultState` 补充 `focusTime`、`mood`、`interruptions` | 5分钟 |
| 5 | 实现 `addFocusTime`、`recordMood`、`addInterruption` | 30分钟 |
| 6 | 设计历史记录数据结构（方案A/B） | 先想清楚 |
| 7 | 实现 `getAnalysis` 画像分析 | 1-2小时 |
| 8 | 更新 `samename.md` 记录新增字段和方法 | 每次新增都做 |
| 9 | 实现倒计时逻辑（可选） | 30分钟 |
| 10 | 等 A 和 B 完成，审核合并 PR | 待定 |
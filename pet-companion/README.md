# 🐾 宠物伙伴 (Pet Companion)

一个基于浏览器的虚拟宠物养成小游戏。通过喂养、玩耍、清洁等交互，陪伴你的电子宠物健康成长。

## 📁 项目结构

```
pet-companion/
├── index.html              # 主页面（A负责，HTML骨架 + 静态资源引用）
├── css/
│   └── style.css           # 所有样式（A全权负责）
├── js/
│   ├── app.js              # 核心交互逻辑（B负责，按钮绑定、状态更新、动画触发）
│   ├── storage.js          # 数据持久化（C负责，localStorage读写、存档管理）
│   └── gameLogic.js        # 算法与规则（C负责，等级成长、经验计算、倒计时逻辑）
├── assets/
│   ├── images/             # 宠物图片/表情包（A管理）
│   └── sounds/             # （可选）音效文件
├── docs/
│   └── prompt.md           # 共享需求文档（三人共同维护，保持AI提示词同步）
├── .gitignore              # C负责创建
└── README.md               # 本文件
```

## 👥 团队分工

| 成员 | 角色 | 负责范围 | 工作分支 |
|------|------|----------|----------|
| **A** | 🎨 UI工程师 | `index.html` 布局、`css/style.css` 样式、`assets/images/` 图片资源 | `feature/ui` |
| **B** | ⚡ 交互工程师 | `js/app.js` 按钮绑定、UI更新、动画触发 | `feature/interaction` |
| **C** | 🔧 集成工程师 | `js/storage.js` 存档管理、`js/gameLogic.js` 游戏算法；**负责合并PR到main** | `feature/storage` |

### 各成员职责详解

#### A（UI工程师）
- 负责一切**视觉呈现**：HTML 结构、CSS 样式、宠物图片/表情
- 可以使用纯 CSS 或 Tailwind 等工具
- **不需要关心**交互逻辑如何实现，只需在 HTML 中定义好 `id` 和 `class`
- 工作范围：`index.html`、`css/style.css`、`assets/images/`

#### B（交互工程师）
- 负责一切**用户交互**：按钮点击事件、宠物状态更新、UI 渲染、动画触发
- 通过调用 `gameLogic.js` 中的方法获取计算结果，调用 `storage.js` 的 `save/load` 函数读写存档
- **不需要直接操作** localStorage，也不负责算法公式
- 工作范围：`js/app.js`

#### C（集成工程师）
- 负责**底层能力**：数据持久化（localStorage）、游戏算法（等级成长、经验计算、属性衰减）
- 同时担任**项目管理员**：创建仓库、管理 main 分支、审核并合并 A 和 B 的 PR
- 工作范围：`js/storage.js`、`js/gameLogic.js`、`.gitignore`、`README.md`

## 🌿 分支策略

采用 **功能分支 + 专人合并** 的模式，避免三人并行开发时的代码冲突。

```
main 分支（成品仓库 — 仅 C 可合并）
  ↑
  ├── feature/ui           （A 的私人工作间）
  ├── feature/interaction  （B 的私人工作间）
  └── feature/storage      （C 的私人工作间）
```

### 工作流程

```
1. 初始化
   C 创建仓库 → push 初始代码到 main

2. 各成员拉取分支
   A: git checkout -b feature/ui
   B: git checkout -b feature/interaction
   C: git checkout -b feature/storage

3. 并行开发
   三人在各自分支上独立工作，互不干扰

4. 合并（由 C 执行）
   Step 1: 审核 A 的 PR → 合并 feature/ui → main
   Step 2: 审核 B 的 PR → 合并 feature/interaction → main
   Step 3: 如有冲突，C 手动解决
```

### 为什么这样设计？

| 问题 | 解决方案 |
|------|----------|
| A 改样式时不小心改坏了 B 的交互代码 | 各自在独立分支工作，互不影响 |
| 三人同时修改 `index.html` 导致冲突 | C 最后统一合并，只需解决一次冲突 |
| A 改按钮样式，B 改按钮功能 | 改的是同一按钮，但在不同分支，C 合并时协调 |
| 代码质量谁来把关 | C 作为管理员审核 PR，确保质量 |

## 🚀 首次建库步骤

### 1. C 执行（初始化仓库）

```bash
# 在 GitHub 创建空仓库后
git init
git add .
git commit -m "chore: 初始化项目结构"
git branch -M main
git remote add origin <仓库地址>
git push -u origin main
```

### 2. A 和 B 执行（拉取并创建自己的分支）

```bash
git clone <仓库地址>
cd pet-companion
git checkout -b feature/ui        # A 执行
# git checkout -b feature/interaction  # B 执行
```

### 3. 三人统一命名规范

在 `docs/prompt.md` 中约定好以下字段名（确保代码中引用一致）：

| 字段 | 含义 | 取值范围 |
|------|------|----------|
| `hunger` | 饱食度 | 0-100 |
| `happiness` | 快乐度 | 0-100 |
| `energy` | 精力 | 0-100 |
| `hygiene` | 清洁度 | 0-100 |
| `health` | 健康值 | 0-100 |
| `level` | 等级 | 1+ |
| `xp` | 当前经验 | 0+ |

## 🎮 游戏功能

- 🍔 **喂食** — 增加饱食度
- 🎮 **玩耍** — 增加快乐度（消耗精力）
- 😴 **睡觉** — 恢复精力（切换睡眠状态）
- 🛁 **洗澡** — 增加清洁度
- 💊 **治疗** — 恢复健康值
- 属性会随时间衰减，离线期间也会累计衰减
- 每次操作获得经验值，经验满自动升级
- 支持存档保存/读取/重置

## 📦 依赖

- 纯前端项目，无需安装任何依赖
- 使用浏览器原生 `localStorage` 存储数据
- 浏览器打开 `index.html` 即可运行
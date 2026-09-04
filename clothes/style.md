# 前端风格规范 - Design Tokens v2.0

> 这是一套可直接应用于前端开发的设计变量系统。所有数值均可直接复制到CSS/SCSS/Styled Components中使用。
> 
> 📌 **使用方式**：你只需要给我图片/描述，并告诉我你喜欢的特点，我会按照此模板更新对应的值。
>
> 🆕 **v2.0 更新**：新增房间场景、背景纹理、分层布局、进度条、气泡对话框、装饰元素等

---

## 1. 颜色系统 (Colors)

### 场景色板 Scene Palette（房间/场景用）
| 用途 | 色值 (HEX) | 色值 (RGB) | 使用场景 |
|------|-----------|-----------|---------|
| 壁纸/墙壁底色 | `#FFF5E6` | `rgb(255, 245, 230)` | 上层房间墙壁背景 |
| 壁纸条纹色 | `#F5E0C8` | `rgb(245, 224, 200)` | 竖条纹壁纸深色 |
| 地板色 | `#E6B88A` | `rgb(230, 184, 138)` | 下层地板/木质地板 |
| 地板格线色 | `#D4A070` | `rgb(212, 160, 112)` | 地板格子分隔线 |
| 踢脚线/分隔线 | `#FFFFFF` | `rgb(255, 255, 255)` | 墙壁与地板之间的白色分隔线 |
| 天空蓝（窗户） | `#A8DCF7` | `rgb(168, 220, 247)` | 窗户玻璃天空色 |
| 天空渐变浅蓝 | `#C8EBFC` | `rgb(200, 235, 252)` | 窗户下部渐变浅蓝 |
| 窗帘粉色 | `#FFB6C1` | `rgb(255, 182, 193)` | 粉色窗帘条纹 |
| 窗帘深粉 | `#FF9AAA` | `rgb(255, 154, 170)` | 窗帘条纹深色 |
| 太阳黄色 | `#FFDD55` | `rgb(255, 221, 85)` | 窗外太阳 |
| 云朵白色 | `#FFFFFF` | `rgb(255, 255, 255)` | 云朵 |
| 地毯粉色 | `#FFCCD8` | `rgb(255, 204, 216)` | 宠物圆形地毯 |
| 地毯虚线边 | `#FFFFFF` | `rgb(255, 255, 255)` | 地毯白色虚线装饰边 |
| 花盆棕色 | `#D4956A` | `rgb(212, 149, 106)` | 植物花盆 |
| 植物绿色 | `#7CC47C` | `rgb(124, 196, 124)` | 盆栽植物叶子 |
| 画框棕色 | `#C4956A` | `rgb(196, 149, 106)` | 墙上挂画框 |
| 爪印棕色 | `#B07850` | `rgb(176, 120, 80)` | 画框内爪印 |

### 主色板 Primary Palette
| 用途 | 色值 (HEX) | 色值 (RGB) | 使用场景 |
|------|-----------|-----------|---------|
| 背景主色（旧） | `#FEEA99` | `rgb(254, 234, 153)` | 黄色系页面备用 |
| 卡片背景色 | `#F0EDE8` | `rgb(240, 237, 232)` | 半透明卡片、信息面板 |
| 卡片背景奶白 | `#FFFEF7` | `rgb(255, 254, 247)` | 白色卡片、内容区域 |
| 黄色区块/按钮 | `#F9E65F` | `rgb(249, 230, 95)` | 强调色块、高亮按钮 |
| 浅天蓝色 | `#97D4F0` | `rgb(151, 212, 240)` | 点缀色、边框 |
| 薄荷绿/成功色 | `#C8F0C8` | `rgb(200, 240, 200)` | 抚摸/打招呼按钮、成功状态 |
| 绿色文字/进度条 | `#4CAF50` | `rgb(76, 175, 80)` | 经验条、绿色按钮文字 |
| 进度条橙色 | `#FFB347` | `rgb(255, 179, 71)` | 饱食度进度条 |
| 进度条黄色 | `#FFD93D` | `rgb(255, 217, 61)` | 快乐度进度条 |
| 进度条蓝色 | `#64B5F6` | `rgb(100, 181, 246)` | 精力进度条 |
| 进度条粉色 | `#F48FB1` | `rgb(244, 143, 177)` | 亲密度圆点 |
| 星星黄色 | `#FFB347` | `rgb(255, 179, 71)` | 专注量星星图标 |
| 时钟棕色边框 | `#8B6B4A` | `rgb(139, 107, 74)` | 时钟外圈 |
| 时钟表盘白 | `#FFF8F0` | `rgb(255, 248, 240)` | 时钟内表盘 |

### 辅助色板 Secondary Palette
| 用途 | 色值 (HEX) | 色值 (RGB) | 使用场景 |
|------|-----------|-----------|---------|
| 宠物主色白 | `#FFFEF9` | `rgb(255, 254, 249)` | 仓鼠/宠物白色身体 |
| 宠物花纹棕 | `#D4B896` | `rgb(212, 184, 150)` | 宠物棕色花纹 |
| 宠物耳朵棕 | `#8B6B4A` | `rgb(139, 107, 74)` | 宠物耳朵深色 |
| 腮红粉色 | `#FFB3B3` | `rgb(255, 179, 179)` | 腮红 |
| 眼睛蓝色 | `#6B8BC4` | `rgb(107, 139, 196)` | 宠物蓝色眼睛 |

### 中性色板 Neutral Palette
| 用途 | 色值 (HEX) | 色值 (RGB) | 使用场景 |
|------|-----------|-----------|---------|
| 描边棕 | `#8B6B4A` | `rgb(139, 107, 74)` | 主要边框、描边（温暖棕色替代纯黑） |
| 描边深棕 | `#5D4037` | `rgb(93, 64, 55)` | 深色描边、强调边框 |
| 主文字色 | `#5D4037` | `rgb(93, 64, 55)` | 标题、主要文字（温暖深棕） |
| 次要文字色 | `#8D6E63` | `rgb(141, 110, 99)` | 副标题、辅助文字 |
| 占位文字色 | `#BCAAA4` | `rgb(188, 170, 164)` | 输入框提示、禁用文字 |
| 纯白色 | `#FFFFFF` | `rgb(255, 255, 255)` | 纯白元素、文字反白 |

> 📝 **重要变更**：描边色从纯黑 `#2D2D2D` 调整为温暖棕色 `#8B6B4A`，整体更温馨柔和

---

## 2. 圆角系统 (Border Radius)

| 变量名 | 数值 | 使用场景 |
|--------|------|---------|
| `--radius-xs` | `4px` | 极小元素、进度条内部 |
| `--radius-sm` | `8px` | 小按钮、标签、小卡片角 |
| `--radius-md` | `12px` | 输入框、按钮、中等卡片 |
| `--radius-lg` | `16px` | 大按钮、交互按钮（抚摸/打招呼） |
| `--radius-xl` | `20px` | 窗户、主要卡片、信息面板 |
| `--radius-2xl` | `24px` | 大卡片、模态框 |
| `--radius-full` | `9999px` | 圆形头像、圆形按钮、胶囊按钮、地毯、时钟 |

> 📝 **变更**：圆角整体更柔和，增加了 `--radius-xs` 和 `--radius-2xl` 档位

---

## 3. 边框/描边系统 (Borders)

| 变量名 | 数值 | 使用场景 |
|--------|------|---------|
| `--border-width-thin` | `1.5px` | 内部细线、格线、分隔线 |
| `--border-width-base` | `2px` | 默认描边宽度（卡片、按钮） |
| `--border-width-thick` | `3px` | 粗描边、重点强调元素（时钟外圈） |
| `--border-style` | `solid` | 边框样式（实线） |
| `--border-color` | `var(--color-border)` | 默认边框色（温暖棕 #8B6B4A） |

**描边规则**：
- 所有卡片、按钮、装饰元素使用 **2px 棕色实线描边**
- 时钟、特殊圆形元素使用 **3px 粗描边**
- 地板格线、壁纸条纹为内部装饰，无需外描边
- 线条圆润，转角处使用圆角处理

---

## 4. 间距系统 (Spacing)

基于 4px 基准单位，采用 8px 栅格系统：

| 变量名 | 数值 | 使用场景 |
|--------|------|---------|
| `--spacing-3xs` | `2px` | 极细微调 |
| `--spacing-2xs` | `4px` | 极小间距、图标与文字 |
| `--spacing-xs` | `8px` | 元素内边距、小间距 |
| `--spacing-sm` | `12px` | 卡片内边距、组件间距 |
| `--spacing-md` | `16px` | 卡片外边距、模块间距 |
| `--spacing-lg` | `20px` | 大间距、页面边距 |
| `--spacing-xl` | `24px` | 区块间距 |
| `--spacing-2xl` | `32px` | 大区块间距 |

**布局参考值**：
- 页面左右边距：`16px-20px`
- 卡片内边距：`16px`
- 卡片之间垂直间距：`12px-16px`
- 顶部状态栏高度：约 `40px`
- 墙壁区域高度占比：约 60%
- 地板区域高度占比：约 40%

---

## 5. 字体系统 (Typography)

### 字体族 Font Family
```css
--font-family-base: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
--font-family-title: "ZCOOL KuaiLe", "站酷快乐体", "PingFang SC", sans-serif;
--font-family-number: "DIN Alternate", "DIN Round", "Roboto", sans-serif;
```

### 字号 Font Size
| 变量名 | 数值 | 字重 | 使用场景 |
|--------|------|------|---------|
| `--font-size-2xs` | `10px` | 400 | 极小标注、状态文字 |
| `--font-size-xs` | `12px` | 400 | 小标签、时间戳、宠物情绪 |
| `--font-size-sm` | `14px` | 400/500 | 辅助文字、按钮文字、统计文字 |
| `--font-size-md` | `16px` | 400/600 | 正文、昵称、输入框文字 |
| `--font-size-lg` | `18px` | 600 | 小标题、宠物名字 |
| `--font-size-xl` | `22px` | 700 | 大数字（专注量星星数字） |
| `--font-size-2xl` | `28px` | 700 | 超大数字、主标题 |
| `--font-size-title` | `20px` | 600 | 页面标题"小宠物" |

### 字重 Font Weight
| 变量名 | 数值 |
|--------|------|
| `--font-weight-normal` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |

### 行高 Line Height
| 变量名 | 数值 |
|--------|------|
| `--line-height-tight` | `1.2` |
| `--line-height-normal` | `1.5` |
| `--line-height-relaxed` | `1.8` |

---

## 6. 阴影系统 (Shadows)

柔和温馨的阴影风格，营造房间立体感：

| 变量名 | 数值 | 使用场景 |
|--------|------|---------|
| `--shadow-sm` | `0 2px 6px rgba(139, 107, 74, 0.12)` | 按钮、小元素悬浮 |
| `--shadow-md` | `0 4px 12px rgba(139, 107, 74, 0.15)` | 卡片、窗户悬浮 |
| `--shadow-lg` | `0 8px 24px rgba(139, 107, 74, 0.18)` | 模态框、弹出层 |
| `--shadow-window` | `0 6px 16px rgba(139, 107, 74, 0.2)` | 窗户投影 |
| `--shadow-inner` | `inset 0 2px 4px rgba(0, 0, 0, 0.06)` | 进度条凹槽、内凹效果 |
| `--shadow-pet` | `0 4px 8px rgba(139, 107, 74, 0.2)` | 宠物投影 |

> 📝 **变更**：阴影颜色调整为棕色系 `rgba(139, 107, 74, x)`，更温暖统一

---

## 7. 🆕 背景纹理与图案系统 (Background Patterns)

### 壁纸竖条纹（墙壁纹理）
```css
/* 使用 repeating-linear-gradient 实现竖条纹壁纸 */
.wallpaper {
  background-color: var(--color-wall);
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 40px,
    var(--color-wall-stripe) 40px,
    var(--color-wall-stripe) 80px
  );
}
```
- 条纹宽度：40px 底色 + 40px 条纹色 = 80px 周期
- 条纹方向：垂直（90deg）
- 条纹色比底色略深，营造柔和的壁纸质感

### 地板方格纹理
```css
.wooden-floor {
  background-color: var(--color-floor);
  background-image:
    linear-gradient(var(--color-floor-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-floor-line) 1px, transparent 1px);
  background-size: 80px 80px;
}
```
- 格子大小：80px × 80px
- 格线宽度：1px
- 格线颜色：比地板色略深的棕色

### 地毯虚线边
```css
.carpet {
  border: 3px dashed var(--color-carpet-border);
  /* 或使用双层边框实现虚线效果 */
}
```
- 边框样式：`dashed` 虚线
- 边框宽度：`3px`
- 边框颜色：白色 `#FFFFFF`
- 形状：椭圆形/圆形

### 窗帘条纹
```css
.curtain {
  background: repeating-linear-gradient(
    90deg,
    var(--color-curtain),
    var(--color-curtain) 8px,
    var(--color-curtain-dark) 8px,
    var(--color-curtain-dark) 16px
  );
}
```
- 条纹宽度：8px 交替
- 方向：垂直条纹

---

## 8. 动画与交互 (Animations)

| 变量名 | 数值 | 使用场景 |
|--------|------|---------|
| `--transition-fast` | `0.15s ease` | 按钮hover、颜色变化 |
| `--transition-base` | `0.25s ease` | 卡片悬浮、模态框弹出 |
| `--transition-bounce` | `0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)` | 按钮点击弹性动画 |
| `--bounce-scale` | `scale(0.95)` | 按钮点击时缩放 |
| `--hover-scale` | `scale(1.03)` | 卡片悬浮轻微放大 |
| `--float-duration` | `3s ease-in-out infinite` | 宠物/云朵漂浮动画 |
| `--sleep-z-duration` | `2s ease-in-out infinite` | 睡觉Zzz动画 |

### 推荐动画
```css
/* 宠物轻轻呼吸/浮动 */
@keyframes pet-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* Zzz 飘字动画 */
@keyframes zzz-float {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-20px) scale(0.7); }
}
```

---

## 9. 布局系统 (Layout) - 房间场景分层

### 整体布局结构（上下分层）
```
┌─────────────────────────────────┐
│  [顶部状态栏]  等级/经验/星星    │  ← 约 8%
├─────────────────────────────────┤
│                                 │
│     [墙壁区域 - 竖条纹壁纸]      │  ← 约 52%
│  ┌──────┐    ┌────────────┐     │
│  │画框  │    │   窗户     │     │
│  │🖼️    │    │  ☁️ 🌞     │     │
│  └──────┘    └────────────┘     │
│          ┌──────────────┐       │
│          │ 💬 对话气泡   │       │
│          └──────────────┘       │
│             [宠物]              │
│           ┌────────┐           │
│           │  (^-^) │           │
│           └────────┘           │
│        ╭──────────────╮        │
│        │   粉色地毯    │        │
├────────┴──────────────┴────────┤  ← 白色踢脚线
│  ┌──────┐              ┌─────┐ │
│  │信息卡│     [地板]   │盆栽 │ │  ← 约 40%
│  └──────┘    [格纹]    └─────┘ │
│         ┌────────────┐          │
│         │ 互动按钮区  │          │
│         └────────────┘          │
└─────────────────────────────────┘
```

### 分层z-index
| 层级 | z-index | 内容 |
|------|---------|------|
| 背景层 | 0 | 壁纸、地板 |
| 装饰层 | 10 | 画框、盆栽、窗户、地毯 |
| 内容层 | 20 | 宠物、卡片、进度条 |
| 气泡层 | 30 | 对话气泡、Tooltip |
| 弹窗层 | 50 | 模态框、确认框 |
| 顶层 | 100 | Toast、通知 |

---

## 10. 组件尺寸规范 (Component Sizes)

### 进度条 Progress Bar
- **高度**：`12px`
- **圆角**：`9999px`（全圆角/胶囊形）
- **轨道色**：`rgba(139, 107, 74, 0.15)` 浅棕色
- **轨道内阴影**：`inset 0 2px 4px rgba(0,0,0,0.08)`
- **填充圆角**：与轨道一致全圆角
- **颜色变体**：
  - 饱食度：橙色 `#FFB347`
  - 快乐度：黄色 `#FFD93D`
  - 精力：蓝色 `#64B5F6`
  - 清洁度：绿色 `#4CAF50`
  - 经验值：绿色 `#4CAF50`

### 互动按钮（抚摸/打招呼）
- **宽度**：约 `140px`
- **高度**：`44px`
- **圆角**：`16px`
- **背景色**：薄荷绿 `#C8F0C8`
- **文字颜色**：绿色 `#4CAF50`
- **边框**：`2px solid #8B6B4A`
- **字体**：16px，600字重

### 对话气泡
- **最小高度**：`44px`
- **内边距**：`10px 20px`
- **圆角**：`20px`
- **背景色**：白色 `#FFFFFF`
- **边框**：`2px solid #8B6B4A`
- **小三角**：底部居中，8px大小
- **字体**：14px，深棕色文字

### 输入框
- **高度**：`40px`
- **圆角**：`12px`
- **背景色**：白色 `#FFFFFF`
- **边框**：`2px solid #8B6B4A`
- **内边距**：`0 12px`
- **占位符颜色**：`#BCAAA4`

### 窗户组件
- **外框圆角**：`20px`
- **外框背景**：白色 `#FFFFFF`
- **外框边框**：`2px solid #8B6B4A`
- **外框内边距**：`12px`
- **窗格**：白色十字分隔条，2px宽
- **玻璃区域**：天蓝色渐变 `#A8DCF7 → #C8EBFC`
- **窗帘**：左右两侧各一条，粉色竖条纹

### 时钟组件
- **尺寸**：`60px × 60px`
- **外圈**：3px棕色粗描边 `#8B6B4A`
- **表盘**：白色/米白色 `#FFF8F0`
- **指针**：棕色 `#8B6B4A`

### 圆形地毯
- **尺寸**：`320px × 180px`（椭圆形）
- **背景色**：粉色 `#FFCCD8`
- **边框**：3px白色虚线 `dashed #FFFFFF`
- **阴影**：柔和投影

### 信息卡片（左下角统计）
- **背景色**：半透明浅灰 `rgba(240, 237, 232, 0.9)`
- **圆角**：`16px`
- **边框**：`1.5px solid rgba(139, 107, 74, 0.3)`
- **内边距**：`12px 16px`
- **字体**：12-14px，文字颜色棕色系

### 功能按钮（喂食/洗澡等）
- **尺寸**：约 `80px × 36px`
- **圆角**：`12px`
- **背景色**：奶黄色 `#FFF5E6`
- **边框**：`2px solid #8B6B4A`
- **角标**：右上角小圆形标记，显示剩余次数

### 胶囊按钮（开始专注/完成目标）
- **背景色**：奶黄色 `#FFF5E6`
- **文字色**：深棕色 `#5D4037`
- **圆角**：`9999px`
- **边框**：`2px solid #8B6B4A`
- **内边距**：`8px 20px`
- **图标+文字**：左侧带emoji图标

### 小徽章/标签（清）
- **尺寸**：`28px × 28px` 圆形
- **背景色**：白色带粉色描边
- **边框**：`2px solid #FFB6C1`
- **文字**：红色/粉色小字

---

## 11. CSS 变量完整代码（可直接复制）

```css
:root {
  /* === 场景颜色 Scene Colors === */
  --color-wall: #FFF5E6;
  --color-wall-stripe: #F5E0C8;
  --color-floor: #E6B88A;
  --color-floor-line: #D4A070;
  --color-sky: #A8DCF7;
  --color-sky-light: #C8EBFC;
  --color-curtain: #FFB6C1;
  --color-curtain-dark: #FF9AAA;
  --color-sun: #FFDD55;
  --color-cloud: #FFFFFF;
  --color-carpet: #FFCCD8;
  --color-carpet-border: #FFFFFF;
  --color-pot: #D4956A;
  --color-plant: #7CC47C;
  --color-frame: #C4956A;
  --color-paw: #B07850;

  /* === 主色板 Primary === */
  --color-bg-card: #F0EDE8;
  --color-bg-card-white: #FFFEF7;
  --color-yellow: #F9E65F;
  --color-blue: #97D4F0;
  --color-green: #C8F0C8;
  --color-green-text: #4CAF50;
  --color-progress-orange: #FFB347;
  --color-progress-yellow: #FFD93D;
  --color-progress-blue: #64B5F6;
  --color-progress-pink: #F48FB1;
  --color-star: #FFB347;
  --color-clock-border: #8B6B4A;
  --color-clock-face: #FFF8F0;
  --color-btn-yellow: #FFF5E6;

  /* === 宠物颜色 Pet Colors === */
  --color-pet-white: #FFFEF9;
  --color-pet-brown: #D4B896;
  --color-pet-ear: #8B6B4A;
  --color-pink: #FFB3B3;
  --color-eye-blue: #6B8BC4;

  /* === 中性色 Neutral === */
  --color-border: #8B6B4A;
  --color-border-dark: #5D4037;
  --color-text-primary: #5D4037;
  --color-text-secondary: #8D6E63;
  --color-text-placeholder: #BCAAA4;
  --color-white: #FFFFFF;

  /* === 圆角 Border Radius === */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* === 边框 Borders === */
  --border-width-thin: 1.5px;
  --border-width-base: 2px;
  --border-width-thick: 3px;
  --border-base: var(--border-width-base) solid var(--color-border);
  --border-thick: var(--border-width-thick) solid var(--color-border);

  /* === 间距 Spacing === */
  --spacing-3xs: 2px;
  --spacing-2xs: 4px;
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 20px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;

  /* === 字体 Typography === */
  --font-family-base: "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-family-title: "ZCOOL KuaiLe", "PingFang SC", sans-serif;
  --font-family-number: "DIN Alternate", "Roboto", sans-serif;

  --font-size-2xs: 10px;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 22px;
  --font-size-2xl: 28px;
  --font-size-title: 20px;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-normal: 1.5;

  /* === 阴影 Shadows === */
  --shadow-sm: 0 2px 6px rgba(139, 107, 74, 0.12);
  --shadow-md: 0 4px 12px rgba(139, 107, 74, 0.15);
  --shadow-lg: 0 8px 24px rgba(139, 107, 74, 0.18);
  --shadow-window: 0 6px 16px rgba(139, 107, 74, 0.2);
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-pet: 0 4px 8px rgba(139, 107, 74, 0.2);

  /* === 动画 Transitions === */
  --transition-fast: 0.15s ease;
  --transition-base: 0.25s ease;
  --transition-bounce: 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

## 12. 组件样式示例（可直接复制）

### 🏠 房间场景背景（带纹理）
```css
.room-scene {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

/* 墙壁壁纸 */
.wall {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  background-color: var(--color-wall);
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 40px,
    var(--color-wall-stripe) 40px,
    var(--color-wall-stripe) 80px
  );
}

/* 地板 */
.floor {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background-color: var(--color-floor);
  background-image:
    linear-gradient(var(--color-floor-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-floor-line) 1px, transparent 1px);
  background-size: 80px 80px;
}

/* 踢脚线 */
.baseboard {
  position: absolute;
  top: 60%;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-white);
  transform: translateY(-50%);
  z-index: 15;
}
```

### 🪟 窗户组件
```css
.window {
  position: absolute;
  top: 120px;
  right: 80px;
  width: 240px;
  height: 200px;
  background: var(--color-white);
  border: var(--border-base);
  border-radius: var(--radius-xl);
  padding: 12px;
  box-shadow: var(--shadow-window);
}

.window-glass {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, var(--color-sky) 0%, var(--color-sky-light) 100%);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

/* 窗格十字 */
.window-glass::before,
.window-glass::after {
  content: '';
  position: absolute;
  background: var(--color-white);
}
.window-glass::before {
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  transform: translateY(-50%);
}
.window-glass::after {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  transform: translateX(-50%);
}

.curtain {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 32px;
  background: repeating-linear-gradient(
    90deg,
    var(--color-curtain),
    var(--color-curtain) 8px,
    var(--color-curtain-dark) 8px,
    var(--color-curtain-dark) 16px
  );
  z-index: 2;
}
.curtain-left { left: 12px; border-radius: 0 0 0 var(--radius-md); }
.curtain-right { right: 12px; border-radius: 0 0 var(--radius-md) 0; }

.sun {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: var(--color-sun);
  border-radius: 50%;
  border: 2px solid var(--color-border);
}

.cloud {
  position: absolute;
  top: 30px;
  left: 30px;
  width: 40px;
  height: 24px;
  background: var(--color-cloud);
  border-radius: 20px;
}
```

### 📊 进度条
```css
.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(139, 107, 74, 0.15);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-inner);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progress-fill.orange { background: var(--color-progress-orange); }
.progress-fill.yellow { background: var(--color-progress-yellow); }
.progress-fill.blue { background: var(--color-progress-blue); }
.progress-fill.green { background: var(--color-green-text); }
```

### 💬 对话气泡
```css
.bubble {
  background: var(--color-white);
  border: var(--border-base);
  border-radius: var(--radius-xl);
  padding: 10px 20px;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  position: relative;
  display: inline-block;
  box-shadow: var(--shadow-sm);
}

.bubble::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid var(--color-border);
}

.bubble::before {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid var(--color-white);
  z-index: 1;
}
```

### 🟢 薄荷绿按钮（抚摸/打招呼）
```css
.btn-mint {
  background: var(--color-green);
  border: var(--border-base);
  border-radius: var(--radius-lg);
  padding: 10px 24px;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-green-text);
  cursor: pointer;
  transition: var(--transition-fast);
  min-width: 120px;
}

.btn-mint:hover {
  filter: brightness(0.95);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-mint:active {
  transform: scale(0.97);
  transition: var(--transition-bounce);
}
```

### 🟡 胶囊按钮（开始专注）
```css
.btn-capsule {
  background: var(--color-btn-yellow);
  border: var(--border-base);
  border-radius: var(--radius-full);
  padding: 8px 24px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-capsule:hover {
  background: var(--color-yellow);
}
```

### 🟣 圆形宠物地毯
```css
.pet-carpet {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 180px;
  background: var(--color-carpet);
  border: 3px dashed var(--color-carpet-border);
  border-radius: 50%;
  box-shadow: var(--shadow-pet);
}
```

### 🕐 时钟组件
```css
.clock {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  border: 3px solid var(--color-clock-border);
  background: var(--color-clock-face);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.clock::before,
.clock::after {
  content: '';
  position: absolute;
  background: var(--color-clock-border);
  border-radius: 2px;
  transform-origin: bottom center;
  left: 50%;
  bottom: 50%;
}

.clock::before {
  width: 3px;
  height: 18px;
  margin-left: -1.5px;
  transform: rotate(-30deg);
}

.clock::after {
  width: 3px;
  height: 14px;
  margin-left: -1.5px;
  transform: rotate(60deg);
}

.clock-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: var(--color-clock-border);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
```

### 🖼️ 墙上画框
```css
.picture-frame {
  position: absolute;
  top: 160px;
  left: 60px;
  width: 70px;
  height: 80px;
  background: var(--color-white);
  border: 4px solid var(--color-frame);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-5deg);
  box-shadow: var(--shadow-sm);
}

.paw-print {
  width: 40px;
  height: 40px;
  /* 爪印图案 */
  background: var(--color-paw);
  border-radius: 50% 50% 40% 40%;
  position: relative;
}
```

### 🌱 盆栽植物
```css
.plant-pot {
  position: absolute;
  bottom: 100px;
  right: 40px;
}

.pot {
  width: 48px;
  height: 36px;
  background: var(--color-pot);
  border: var(--border-base);
  border-radius: 0 0 8px 8px;
  position: relative;
}

.pot::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  height: 10px;
  background: var(--color-pot);
  border: var(--border-base);
  border-radius: 4px 4px 0 0;
}

.plant-leaves {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}

.leaf {
  width: 20px;
  height: 40px;
  background: var(--color-plant);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  border: 2px solid var(--color-border);
}
.leaf:nth-child(1) { transform: rotate(-20deg); }
.leaf:nth-child(2) { transform: scaleY(1.2); }
.leaf:nth-child(3) { transform: rotate(20deg); }
```

### 🏷️ 功能小按钮
```css
.btn-action {
  background: var(--color-btn-yellow);
  border: var(--border-base);
  border-radius: var(--radius-md);
  padding: 6px 14px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  cursor: pointer;
  position: relative;
  transition: var(--transition-fast);
}

.btn-action .badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  background: var(--color-star);
  border: 1.5px solid var(--color-border);
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}
```

---

## 13. 装饰元素库（增加背景丰富度）

以下元素可自由组合摆放，解决背景单调问题：

| 元素 | CSS实现方式 | 推荐位置 |
|------|------------|---------|
| 🖼️ 画框/照片框 | 棕色边框矩形+旋转 | 墙壁左/右侧 |
| 🪟 窗户+窗帘 | 白色边框+天蓝渐变+粉色条纹窗帘 | 墙壁右上/正中 |
| 🌞 太阳+云朵 | 黄色圆形+白色椭圆 | 窗户内 |
| 🌱 盆栽植物 | 棕色梯形花盆+绿色叶子 | 地板角落 |
| 🕐 挂钟 | 棕色边框圆形+指针 | 墙壁右侧 |
| ⭐ 星星图标 | 黄色五角星 | 顶部栏 |
| 💤 Zzz飘字 | 蓝色小Z字母+浮动动画 | 宠物头顶 |
| ❤️ 爱心 | 粉色心形 | 好感度提示 |
| 📋 便签纸 | 浅色矩形+旋转 | 墙壁上 |
| 🏮 小挂饰 | 小圆形+挂绳 | 顶部 |

---

## 14. 插画绘制规范（给AI/设计师）

### 宠物造型（仓鼠风格）
- **身体比例**：圆滚滚的椭圆形，胖嘟嘟
- **耳朵**：三角形内耳，棕色外耳+浅粉内耳
- **眼睛**：蓝色小横线/小椭圆（闭眼/眯眼状态），或蓝色圆点
- **嘴巴**：w形小嘴巴（猫咪嘴），或简单微笑弧线
- **腮红**：两团圆形粉色 `#FFB3B3`
- **小手**：椭圆形小爪子，放在身体两侧
- **身体花纹**：棕色斑纹分布在两侧
- **线条**：统一 2px 棕色描边 `#8B6B4A`

### 场景绘制规则
- 墙壁使用**竖条纹**增加质感，但不要过于醒目
- 地板使用**方格木纹**，格子不要太小
- 所有装饰元素保持扁平风格，纯色填充
- 阴影使用**同色系深色块**，边缘锐利
- 可适当添加小摆件，但不要过多，保持视觉焦点在宠物上
- 整体色调温暖：米白+暖棕+粉色+浅蓝点缀

---

## 15. 📋 本次更新记录

```
【分析输入】
- 参考图片：小宠物专注界面截图
- 关键设计元素：整体卡通风格、圆角设计处理、合理的布局结构
- 优化要求：背景增加纹理和装饰元素，提升视觉丰富度

【更新内容】
1. 颜色调整：
   - 描边色从纯黑 #2D2D2D 改为温暖棕 #8B6B4A
   - 文字色调整为棕色系 #5D4037
   - 新增墙壁/地板/窗帘/天空/地毯/植物等 20+ 个场景色
   - 新增进度条多色变体
2. 圆角调整：
   - 新增 --radius-xs (4px) 和 --radius-2xl (24px) 档位
   - 整体圆角更柔和
3. 边框调整：
   - 新增 --border-width-thick (3px) 用于时钟等元素
   - 阴影改为棕色系
4. 新增系统：
   - ✅ 背景纹理系统（竖条纹壁纸、格子地板、虚线地毯、条纹窗帘）
   - ✅ 场景分层布局（墙壁60%+地板40%）
   - ✅ z-index分层规范
5. 新增组件：
   - 进度条（多色）
   - 对话气泡（带小三角）
   - 窗户+窗帘+太阳+云朵
   - 时钟
   - 宠物椭圆形地毯
   - 薄荷绿互动按钮
   - 胶囊按钮
   - 画框装饰
   - 盆栽植物
   - 功能小按钮带角标
6. 装饰元素库：10种可自由组合的背景装饰

【代码更新】
- CSS变量从 ~30个 扩展到 ~70个
- 组件示例从 5个 扩展到 12个（含完整房间场景代码）
- 所有代码可直接复制使用
```

---

**当前风格关键词 v2.0**：温馨治愈小屋、棕色描边、马卡龙暖色调、竖条纹壁纸、格子地板、圆角房间、萌宠陪伴、柔和阴影、场景化布局、装饰丰富

# Folio · Presentation Design Intelligence Engine

> 由 Jorgut 创建 · MIT 协议开源

## 定位

Folio 是一个 **Presentation Design Intelligence Engine**，不是普通的 HTML PPT 生成器。

它的核心是**设计决策层**（Design Decision Layer）——根据用户目标、受众、场景、风格偏好，自动选择布局、排版、配色、动效和交互模式，再生成最终输出。

```
User Prompt
  │
  ▼
Design Decision Engine
  ├── 分析目标 (说服/汇报/教学/路演/作品集)
  ├── 分析受众 (高管/客户/大众/学术)
  ├── 分析场景 (正式/创意/技术/学术)
  ├── 选择视觉风格 (Minimal/Architectural/Editorial/Brutalism...)
  ├── 选择交互层级 (低/中/高)
  └── 选择输出格式 (HTML/PPTX/PDF)
        │
        ▼
Engines
  ├── Layout Engine    → 选择页面布局组合
  ├── Typography Engine → 选择字体系统
  ├── Color Engine     → 选择配色方案
  ├── Interaction Engine → 选择交互模式
  ├── Animation Engine → 选择动效方案
  ├── Visual Effects Engine → 选择视觉特效
  └── Export Engine    → 生成最终输出
        │
        ▼
Output
  ├── HTML (交互式演示)
  ├── PPTX (全文字可编辑)
  ├── PDF (印刷/分享)
  └── 更多...
```

---

## 架构概览

```
folio-ppt/
├── SKILL.md                      ← 你在这里：设计决策入口
├── index.html                    ← 主模板（杂志风格）
│
├── engines/                      ← 各引擎知识库
│   ├── layout-engine.md          ← 布局选择与组合规则
│   ├── typography-engine.md      ← 字体系统与排版规则
│   ├── color-engine.md           ← 配色系统与主题
│   ├── interaction-engine.md     ← 交互模式库
│   ├── animation-engine.md       ← 动效方案
│   ├── visual-effects-engine.md  ← 视觉特效
│   └── export-engine.md          ← 导出引擎
│
├── design-intelligence/
│   ├── decision-engine.md        ← 设计决策规则引擎
│   ├── visual-styles/            ← 视觉风格库
│   ├── interaction-patterns/     ← 交互模式库
│   └── knowledge-base/           ← 设计知识库
│
├── references/                   ← 现有参考文件
├── scripts/                      ← 现有导出脚本
├── templates/                    ← 现有模板
└── ROADMAP.md                    ← 路线图
```

---

## 设计决策引擎

> 开始新项目时，先运行决策流程，不要直接写 HTML。

```
1. 项目类型：网页 / PPT / 作品集 / Dashboard / 路演 / Keynote
2. 受众：高管 / 客户 / 大众 / 学术 / 技术
3. 场景：正式 / 创意 / 技术 / 学术 / 营销
4. 视觉风格：见 visual-styles/
5. 交互层级：低（静态）/ 中（动效）/ 高（WebGL+3D+Audio）
6. 输出格式：HTML / PPTX / PDF
```

详细规则见 `design-intelligence/decision-engine.md`。

---

## 视觉风格库

> 每个风格包含完整的字体、配色、间距、动效、特效组合。

| 风格 | 适用场景 | 参考 |
|------|---------|------|
| **Minimal** | 通用、商业、科技 | Apple, Muji |
| **Architectural** | 建筑/空间/设计作品集 | Concrete + 留白 + 细体 |
| **Editorial** | 杂志、内容展示 | NYT Magazine, Monocle |
| **Swiss** | 设计/艺术/文化 | 网格 + 无衬线 + 原色 |
| **Brutalism** | 大胆/反传统 | 粗排版 + 高对比 |
| **Glass** | 科技/现代/SaaS | 毛玻璃 + 高斯模糊 |
| **Dark** | 深色模式、科技 | 暗底 + 强调色 |
| **Bento** | Dashboard/数据 | 网格 + 卡片 + 模块化 |
| **Luxury** | 高端/品牌 | 衬线 + 留白 + 金色 |
| **Cyberpunk** | 创意/游戏 | 霓虹 + 发光 + 色差 |

每个风格的定义文件在 `design-intelligence/visual-styles/`。

---

## 交互模式库

> 根据场景选择合适的交互模式，不要随机添加动效。

| 交互类型 | 适用模式 |
|---------|---------|
| 页面进入 | Fade In / Scale In / Stagger / Reveal / Split Text |
| Hover | Lift / Glow / Scale / Magnetic / Tilt / Spotlight |
| 滚动 | Parallax / Pin / Horizontal / Progress / Sticky |
| 导航 | Mega Menu / Sidebar / Bottom Nav / Dock |
| 加载 | Skeleton / Progress / Shimmer / Blur Loading |
| 数据 | Count Up / Animated Chart / Morph / Progress Ring |

**决策规则：**
- 企业 PPT → 不使用 Cursor Trail / Shader / Liquid / Mouse Distortion
- 创意作品集 → 可使用 Motion + Lenis + Three.js + Shader + Ambient Audio
- 数据 Dashboard → 使用 Count Up + Chart Animation + Scroll Reveal

详细定义见 `design-intelligence/interaction-patterns/`。

---

## 布局体系（现有）

| # | 布局 | 用途 | 页面比例 |
|---|------|------|---------|
| 1 | **Cover** | 封面 — 居中或偏置大字 | 100% |
| 2 | **Split 4-8 / 3-9 / 7-5** | 不对称图文 split | 40/60 |
| 3 | **Overlap** | 全出血图 + 浮层文字面板 | 重叠 |
| 4 | **Bleed Quote** | 全出血图 + 大引语重叠 | 重叠 |
| 5 | **Editorial** | CSS 双栏正文 | 50/50 |
| 6 | **Stats** | 数据大字报 | 单页 |
| 7 | **Gallery** | 图片画廊（auto-fill 自适应） | 多列 |
| 8 | **Closing** | 收束页 | 100% |
| 9 | **Timeline** | 时间线 / 流程步骤 | 垂直 |
| 10 | **Spread** | 左右全出血跨页图文 | 50/50 |
| 11 | **Compare** | 并排对比（旧 vs 新） | 50/50 |
| 12 | **List** | 编号列表 / 原则清单 | 垂直 |
| 13 | **Chapter** | 章节分隔页 | 居中 |
| 14 | **Table** | 数据表格 | 网格 |
| 15 | **Inset** | 嵌入式图文 | 浮动 |
| 16 | **Pull-quote** | 突出引用 | 双栏 |

---

## 交互式演示系统

模板内置完整交互系统，浏览器直接打开即可使用：

| 操作 | 效果 |
|------|------|
| `→` `↓` `Space` | 下一页 |
| `←` `↑` | 上一页 |
| `G` | 缩略图概览 |
| `F` | 全屏 |
| `P` | 自动播放 |
| `Escape` | 回到首页 / 关闭概览 / 关闭 Lightbox |
| `B` | 低功耗模式 |
| `?` | 快捷键面板 |
| URL Hash | `#3` 打开第 3 页 |
| 滚轮 / 触屏 | 翻页 |
| Lightbox | 画廊图片点击放大 |

---

## 设计原则

> 以下原则来自 Gestalt Principles、Fitts's Law、Hick's Law、Miller's Law、Jakob's Law 和 Aesthetic-Usability Effect。

1. **8pt Grid** — 所有间距为 8 的倍数（16/24/32/40/48/64/80/96）
2. **12 Column Grid** — 内容区域 12 列，子元素按 `col-span-*` 跨列
3. **不对称优于对称** — 不要 50/50，用 4/8、3/9、7/5
4. **图文重叠创造层次** — 文字浮在图上是杂志的灵魂
5. **全出血图呼吸感** — 图片突破安全区边界
6. **字号对比要极端** — 主标题与正文比例 ≥ 6:1
7. **留白是设计的一部分** — 大片空白传递自信
8. **字体分工明确** — 标题衬线/正文非衬线/元数据等宽
9. **图片是第一公民** — 用标准比例（21:9 / 16:10 / 4:3 / 3:2）
10. **一个 deck 一套主题色** — 不要中途换色
11. **阅读模式** — 资讯类用 F 型，Landing 用 Z 型布局
12. **触控目标 ≥44pt** — Fitts's Law，包括不可见点击区
13. **一致性** — 统一圆角/阴影/字号系统，不混用
14. **减少选择** — Hick's Law，导航层级 ≤ 3 层

---

## 工作流

### Step 1 · 运行设计决策
```bash
查看 design-intelligence/decision-engine.md → 确定：
├── 项目类型
├── 受众
├── 视觉风格
├── 交互层级
└── 输出格式
```

### Step 2 · 拷贝模板
```bash
cp <SKILL_ROOT>/index.html 项目/ppt/index.html
mkdir -p 项目/ppt/images
```

### Step 3 · 按风格调整主题
```bash
# 在 index.html 的 <body> 上切换主题
<body class="theme-{default|indigo|forest|sand|mono|neon|rose|ocean}">
```

### Step 4 · 填充内容
1. 读 `<style>` 块确认类名已定义
2. 挑布局，粘 `<section>` 骨架，改文案和图片路径
3. 图片放 `images/`，命名 `{页号}-{语义}.{ext}`
4. 应用 8pt Grid 间距 (`--sp-4`/`--sp-5`/`--sp-6`/等)

### Step 5 · 导出分发

#### PPTX（全文字可编辑 — 推荐）
```bash
node <SKILL_ROOT>/scripts/export-native-pptx.mjs 项目/ppt/index.html
```

#### PDF（矢量文字，InDesign 可用）
```bash
node <SKILL_ROOT>/scripts/export-print-pdf.mjs 项目/ppt/index.html
```

#### 验证
```bash
node <SKILL_ROOT>/scripts/export-verify.mjs 项目/ppt/index.html
```

---

## 主题色预设

| 主题 | 风格映射 | 适用场景 |
|------|---------|---------|
| **墨水经典**（默认） | Editorial / Minimal | 通用、商业 |
| **靛蓝瓷** | Glass / Tech | 科技、研究 |
| **森林墨** | Architectural | 自然、文化 |
| **沙丘** | Brutalism / Editorial | 艺术、创意 |
| **单色** | Minimal / Swiss | 极简、现代 |
| **霓虹** | Cyberpunk | 创意、游戏 |
| **玫瑰** | Luxury | 时尚、品牌 |
| **海洋** | Glass / Tech | SaaS、科技 |

`<body class="theme-indigo">` 切换。

---

## 技术依赖

- PptxGenJS — PPTX 生成
- Playwright — 截图 + PDF 渲染

---

## 自适应设计体系

### 断点

| 尺寸 | 行为 |
|------|------|
| ≥1024px | 完整杂志布局 |
| 768–1023px（平板） | 列数减少，面板缩小 |
| <768px（手机） | 全部单列堆叠 |

### 设备能力自适应

| 规则 | 触发 | 效果 |
|------|------|------|
| 触屏模式 | `hover: none` | 导航点放大至 14px |
| 横屏手机 | `orientation: landscape` | 压缩间距 |
| 大屏 | `min-width: 1600px` | 加大安全区 |
| 弱动效 | `prefers-reduced-motion` | 关闭所有动画 |
| 打印 | `print` | 隐藏导航，分页 |

---

## 对齐国际设计系统

| 系统 | Folio 对应 |
|------|-----------|
| **Material Design** | 8pt Grid, 12 Column, Elevation |
| **Apple HIG** | 留白、字体层级、触控目标 ≥44pt |
| **Ant Design** | 间距系统、配色规则、表单布局 |
| **IBM Carbon** | 网格、间距比例、一致性原则 |
| **Gestalt Principles** | 邻近、相似、闭合、连续性 |
| **Fitts's Law** | 导航点/箭头 44px 不可见点击区 |
| **Hick's Law** | 导航层级 ≤ 3 层 |
| **Miller's Law** | 信息组块 ≤ 7±2 |
| **Jakob's Law** | 遵循用户熟悉的交互模式 |
| **Aesthetic-Usability** | 美观设计提升可用性感知 |

---

*完整文档：`design-intelligence/knowledge-base/` 和 `engines/` 子目录*

# Folio · Presentation Design Intelligence Engine

> 由 Jorgut 创建 · MIT 协议开源

**从 Layout Engine 到 Design Intelligence Engine。** Folio 不只是排版模板——它是一个能根据用户目标、受众和场景自动决策设计方案的智能系统。

```
User Prompt → Decision Engine → Visual Style → Engines → HTML / PPTX / PDF
```

<p align="center">
  <img src="assets/screenshots/slide-cover.png" width="45%" alt="Cover 布局">
  <img src="assets/screenshots/slide-editorial.png" width="45%" alt="Editorial 布局">
</p>

---

> ⚠️ **项目状态：积极开发中**
>
> Folio 目前处于**积极开发阶段**，核心架构正在从 Layout Engine 进化为 Design Intelligence Engine。
>
> - 当前版本：v0.9 (Design Intelligence)
> - 最后更新：2026-06-27
> - 稳定性：实验性
> - 贡献：欢迎反馈和建议
>
> 如果你在使用过程中遇到问题或有改进建议，请在 [Issues](https://github.com/Jorgut/folio-ppt/issues) 中反馈。

---

## 架构

```
folio/
├── SKILL.md                      ← 设计决策入口
├── index.html                    ← 主模板（16 种布局 + 交互系统）
├── engines/                      ← 7 引擎知识库
│   ├── layout-engine.md          ← 布局选择与组合规则
│   ├── typography-engine.md      ← 字体系统与配对矩阵
│   ├── color-engine.md           ← 配色系统与 8 主题色板
│   ├── interaction-engine.md     ← L0-L4 交互层级
│   ├── animation-engine.md       ← 动效方案与缓动速查
│   ├── visual-effects-engine.md  ← 视觉特效（Glass/Aurora/Noise...）
│   └── export-engine.md          ← 输出格式选择
├── design-intelligence/
│   ├── decision-engine.md        ← 5 步设计决策流程
│   ├── visual-styles/            ← 10 种视觉风格定义
│   ├── interaction-patterns/     ← 6 类交互模式库
│   └── knowledge-base/           ← Gestalt/UX Laws/Accessibility
├── scripts/
│   ├── design-decision.mjs       ← 交互式决策 CLI（新增）
│   ├── generate-theme.mjs        ← 引擎→代码联动生成器（新增）
│   ├── export-native-pptx.mjs    ← Native PPTX 导出
│   ├── export-print-pdf.mjs      ← 出版级 PDF 导出
│   └── export-verify.mjs         ← 输出验证
├── references/                   ← 设计参考文件
└── templates/                    ← 线框图模板
```

## 核心特性

| 特性 | 状态 |
|------|------|
| Design Intelligence 决策引擎 | ✅ v0.9 |
| 10 种视觉风格定义（Minimal/Editorial/Swiss/Glass...） | ✅ v0.9 |
| 引擎→代码联动生成器 (`generate-theme.mjs`) | ✅ v0.9 |
| 交互式决策 CLI (`design-decision.mjs`) | ✅ v0.9 |
| 设计知识库（Gestalt/UX Laws/Accessibility） | ✅ v0.9 |
| 杂志级排版（16 种布局） | ✅ 稳定 |
| 响应式/自适应设计 | ✅ 稳定 |
| 交互式演示（快捷键、概览、全屏） | ✅ 稳定 |
| Native PPTX 引擎（全文字可编辑） | ✅ Phase 1a 完成 |
| 布局映射引擎（12 种布局 mappers） | ✅ Phase 1b 完成 |
| 出版级 PDF（3mm 出血 + 裁切标记） | ✅ v0.8 |
| 8pt Grid 设计系统 + Fitts's Law 触控 | ✅ v0.9 |

## 快速开始

```bash
# 1. 设计决策 — 先选风格再写代码
node scripts/design-decision.mjs

# 2. 生成主题代码（CSS + Fonts + Effects）
node scripts/generate-theme.mjs editorial

# 3. 拷贝模板到项目
cp index.html 我的项目/ppt.html
mkdir -p 我的项目/images

# 4. 浏览器预览
open 我的项目/ppt.html

# 5. 安装依赖（仅导出需要）
cd scripts/
npm install
npx playwright install chromium

# 6. 导出 PPTX（全文字可编辑，带布局映射）
node export-native-pptx.mjs 我的项目/ppt.html

# 7. 输出验证
node export-verify.mjs 我的项目/ppt.html

# 8. 导出出版级 PDF（3mm 出血 + 裁切标记）
node export-print-pdf.mjs 我的项目/ppt.html
```

## 设计工作流

> 不要跳过 IA 和 wireframe 直接写 HTML。结构错了后面全白费。

<p align="center">
  <img src="assets/screenshots/wireframe-sheet.png" width="80%" alt="Wireframe Sheet — 13 种布局">
  <br><em>Wireframe Sheet — 13 种杂志布局，支持打印和标注</em>
</p>

```
Design Decision → IA → Wireframe → HTML Mockup → Native Export
```

| 阶段 | 活动 | 产出 |
|------|------|------|
| **决策** | 项目类型 / 受众 / 风格 / 交互层级 | Design Parameters 代码块 |
| **IA** | 内容盘点、叙事弧 | Deck Structure Document |
| **Wireframe** | Lo-fi → Mid-fi → Hi-fi | 标注完整的线框图 |
| **HTML** | 用 Folio 模板实现 | index.html (mockup) |
| **Export** | Native PPTX / 出版 PDF | .pptx / .pdf |

### 参考文件

| 文件 | 内容 |
|------|------|
| `engines/layout-engine.md` | 16 种布局选择组合规则 |
| `design-intelligence/visual-styles/` | 10 种风格完整定义 |
| `design-intelligence/knowledge-base/` | Gestalt/UX Laws/Accessibility |
| `references/presentation-design.md` | 编辑设计模式（NYT Magazine 等） |
| `references/information-architecture.md` | IA 五阶段流程 |
| `references/wireframing.md` | 线框图方法 |
| `templates/wireframe-sheet.html` | 可打印线框图纸 |

## 10 种视觉风格

| 风格 | 语感 | 参考 |
|------|------|------|
| **Minimal** | 少即是多 | Apple, Muji |
| **Editorial** | 杂志搬到屏幕 | NYT Magazine, Monocle |
| **Swiss** | 网格与秩序 | 瑞士国际主义 |
| **Architectural** | 空间与结构 | 建筑作品集 |
| **Brutalism** | 粗犀牛排版 | 反设计 |
| **Glass** | 未来感透明 | Apple Vision Pro |
| **Dark** | 暗底发光 | GitHub Dark |
| **Bento** | 井然有序的网格 | Dashboard |
| **Luxury** | 昂贵感 | 高端品牌 |
| **Cyberpunk** | 霓虹夜色 | 赛博朋克 |

每种风格在 `design-intelligence/visual-styles/` 中有完整的字体/配色/动效/特效/布局定义。

## 交互式演示

| 快捷键 | 功能 |
|--------|------|
| `→` `↓` `Space` | 下一页 |
| `←` `↑` | 上一页 |
| `G` | 缩略图概览 |
| `F` | 全屏切换 |
| `Escape` | 回到首页 / 关闭概览 |
| `B` | 低功耗模式 |
| `?` | 快捷键面板 |
| 🔗 按钮 | 复制当前页 URL |

## 引擎→代码联动

```bash
# 生成 Editorial 风格的主题代码（CSS 变量 + 字体 + 特效）
node scripts/generate-theme.mjs editorial

# 输出所有 10 种风格
node scripts/generate-theme.mjs all

# 交互式 5 步设计决策
node scripts/design-decision.mjs
```

## 依赖

- [PptxGenJS](https://github.com/gitbrent/PptxGenJS) — PPTX 生成
- [Playwright](https://playwright.dev) — 浏览器渲染 + 截图 + PDF

## 协作流程

| 目标工具 | 导出方式 | 说明 |
|---------|---------|------|
| **PowerPoint** | PPTX | 直接打开，文字可编辑 |
| **Google Slides** | PPTX → 上传 | 上传 .pptx 到 Drive，右键用 Slides 打开 |
| **Keynote** | PPTX → 打开 | 双击 .pptx 或用 Keynote 打开 |
| **Figma** | PDF → 导入 | 菜单 Import → 选择 PDF |
| **InDesign** | PDF → 置入 | 文件 → 置入 → 选择 PDF |

## 许可证

MIT License · Copyright (c) 2026 Jorgut

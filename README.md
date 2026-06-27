# Folio · 版式引擎

> 由 Jorgut 创建 · MIT 协议开源

**Layout Engine。** 你给内容 + 风格，Folio 给 deck。不做设计咨询，只做高质量渲染。

```
内容 + 风格 → 拷贝模板 → 填充 → 导出 (HTML / PPTX / PDF / IDML / Figma)
```

---

## 快速开始（4 步）

```bash
# 1. 拷贝模板到项目
cp index.html 我的项目/index.html
mkdir -p 我的项目/images

# 2. 在 <body> 上选主题
# <body class="theme-indigo">  — 科技感
# <body class="theme-sand">    — 暖色调
# <body class="theme-mono">    — 极简单色
# 完整 8 套主题在 SKILL.md / 风格参数在 design/style-guide.md

# 3. 浏览器预览
open 我的项目/index.html

# 4. 导出（安装依赖后）
cd scripts && npm install && npx playwright install chromium

# PPTX / PDF / InDesign
node export-native-pptx.mjs 我的项目/index.html      # PPTX
node export-print-pdf.mjs 我的项目/index.html         # 印刷 PDF
node export-idml.mjs 我的项目/index.html               # InDesign 原生格式

# Figma（自动选择）
node export-figma.mjs 我的项目/index.html              # 有 C2D → C2D; 否则本地
node export-figma.mjs --mode c2d 我的项目/index.html    # 强制 Code.to.Design API
node export-figma.mjs --mode local 我的项目/index.html   # 强制本地 Figma 插件

# 验证
node export-verify.mjs 我的项目/index.html
```

---

## 导出格式总览

| 格式 | 命令 | 文字可编辑 | 用途 |
|------|------|-----------|------|
| **HTML** | 浏览器打开 | ✅ 原生 | 预览、交互式演示 |
| **PPTX** | `export-native-pptx.mjs` | ✅ 可编辑 | PowerPoint / Google Slides / Keynote |
| **PDF 印刷** | `export-print-pdf.mjs` | ❌ 图片化 | 印刷厂、带裁切标记 |
| **PDF 编辑** | `export-indesign.mjs` | ✅ 可选文字 | InDesign 置入、轻量预览 |
| **Figma** | `export-figma.mjs`（C2D / 本地插件） | ✅ 可编辑 | Figma 内直接修改排版 |
| **IDML** | `export-idml.mjs` | ✅ 可编辑 | InDesign 原生导入 |

---

## Figma 导出（双模式）

Folio 提供两种 Figma 导出方式：**Code.to.Design**（云 API，高 fidelity）和 **本地模式**（内置 Figma 插件，免费）。

| | Code.to.Design ☁️ | 本地模式 🖥️ |
|--|-------------------|-------------|
| Fidelity | 高（服务端解析 HTML/CSS） | 一般（精确坐标 + 文字节点） |
| API Key | ✅ 需要（用户自备，免费 10 credits） | ❌ 不需要 |
| 成本 | 1 credit / 次（约 $0.08/次） | 免费 |
| 操作 | 自动写入剪贴板 → Figma 粘贴 | 生成 JSON → Figma 插件导入 |
| 文字 | 完全可编辑 | 可编辑（可能需要双击渲染） |

### 模式选择

```bash
# 自动选择（默认）：有 API Key 用 C2D，否则本地
node scripts/export-figma.mjs path/to/index.html

# 强制指定模式
node scripts/export-figma.mjs --mode c2d path/to/index.html
node scripts/export-figma.mjs --mode local path/to/index.html
```

### 首次运行（无 API Key）

自动进入引导界面：

```
╔══════════════════════════════════════════════════════╗
║  🔑  Code.to.Design 需要 API Key                     ║
╚══════════════════════════════════════════════════════╝

Folio 支持两种 Figma 导出方式：

  [1] Code.to.Design（推荐）
      — 高 fidelity，文字完全可编辑
      — 需要 API Key（免费：10 credits）
      → 打开 https://api.to.design 注册获取

  [2] 本地模式（免费，内置 Figma 插件）
      — 不需要 API Key，不需要联网
      — fidelity 一般，文字可能需要手动调整
```

选择 1 → 自动打开浏览器跳转 `https://api.to.design` → 注册获取 API Key → 设置环境变量：

```bash
export C2D_API_KEY="你的key"
# 或写入 .env 文件
echo 'C2D_API_KEY="你的key"' >> scripts/.env
```

选择 2 → 直接用本地模式。

### 模式 A：Code.to.Design（推荐）

1. 配置 API Key：

```bash
export C2D_API_KEY="你的key"
```

2. 运行导出：

```bash
node scripts/export-figma.mjs path/to/index.html
```

3. 流程：
   - Playwright 渲染每页
   - 发送 HTML 到 Code.to.Design API（1 次调用 = 1 credit）
   - 收到 Figma 原生剪贴板数据
   - 自动写入 macOS 系统剪贴板（`NSPasteboardTypeHTML`）
   - 切换到 Figma → `Cmd+V` → 16 页全部以 Frame 出现

4. 输出文件：
   - `index.figma-clipboard.html` — 原始剪贴板数据（备份）

### 模式 B：本地模式（免费）

使用内置的 **Folio Importer** 插件，完全本地运行。**同时支持 Figma Design 和 Figma Slides。**

1. 运行导出：

```bash
node scripts/export-figma.mjs --mode local path/to/index.html
```

2. 首次安装插件（只需一次）：
   - 左上角菜单 → **Plugins** → **Development** → **Import plugin from manifest…**
   - 选择输出的 `figma-plugin/manifest.json`

3. 在 **Figma Design** 中导入：
   - 运行 **Folio Importer** → 选择 `index.figma.json`
   - 自动为每页创建 Page + Frame + TextNode + Image Rectangle

4. 在 **Figma Slides** 中导入：
   - 打开或新建一个 Figma Slides 文件
   - 运行 **Folio Importer** → 选择同一个 `index.figma.json`
   - 自动为每页创建一个 Slide（1920×1080），坐标从 1280×720 等比缩放

### 已知限制

| 模式 | 限制 |
|------|------|
| C2D | 依赖网络；API 消耗 credits；不支持 system fonts（只能用 Google Fonts） |
| 本地 | 文字双击才渲染；CSS 排版不完全还原；文字框可能重叠 |

---

## InDesign 工作流

Folio 提供两种 InDesign 友好格式：

### IDML（首选，原生导入）

```bash
node scripts/export-idml.mjs path/to/index.html
```

输出：
- `index.idml` — InDesign 原生格式，直接双击或 **文件 → 打开**
- `index_images/` — 图片文件夹（IDML 引用外部图片，不嵌入）

IDML 特点：
- 文字进独立文本框，完全可编辑
- 字体/字号/颜色/对齐保留
- 16 页自动建好，页码正确排序
- 支持 InDesign 的段落样式和字符样式

### InDesign PDF（备选，置入式）

```bash
node scripts/export-indesign.mjs path/to/index.html
```

输出 `index.indesign.pdf`（约 1.2MB），特点：
- 文字可选（非图片化）
- 图片为原生 PDF 元素（非 PNG 覆盖）
- 可拖入 InDesign 作为参考层

---

## 文件结构

```
folio/
├── SKILL.md                      ← 入口：4 步工作流 + 决策表
├── README.md                     ← 本文件
├── index.html                    ← 主模板（16 种布局 + 交互系统）
├── design/
│   ├── style-guide.md            ← 10 种风格完整参数
│   ├── principles.md             ← 设计原则速查 + 交互层级
│   └── knowledge-base/           ← 教学：Gestalt / UX Laws / Accessibility / 信息设计
├── engines/
│   ├── layout-engine.md          ← 16 种布局选择与组合规则
│   ├── typography-engine.md      ← 字体系统与配对矩阵
│   ├── color-engine.md           ← 配色系统与 8 主题色板
│   ├── interaction-engine.md     ← L0-L4 交互层级
│   ├── animation-engine.md       ← 动效方案与缓动速查
│   ├── visual-effects-engine.md  ← 视觉特效（Glass/Aurora/Noise...）
│   └── export-engine.md          ← 输出格式选择
├── scripts/
│   ├── generate-theme.mjs        ← 主题代码生成器
│   ├── design-decision.mjs       ← 交互式风格选择 CLI
│   ├── export-native-pptx.mjs    ← PPTX 导出
│   ├── export-print-pdf.mjs      ← 印刷级 PDF
│   ├── export-pdf.mjs            ← 基础 PDF
│   ├── export-indesign.mjs       ← InDesign 编辑 PDF
│   ├── export-idml.mjs           ← InDesign 原生 IDML
│   ├── export-figma.mjs          ← Figma 导出（双模式）
│   ├── figma-plugin/             ← Figma 导入插件
│   │   ├── manifest.json
│   │   ├── code.js
│   │   └── ui.html
│   ├── .env.example              ← 环境变量模板
│   ├── export-verify.mjs         ← 输出验证
│   └── layout-mapping.mjs        ← 布局映射引擎（PPTX/IDML）
├── references/                   ← 设计参考文件
└── templates/                    ← 线框图模板
```

---

## 核心特性

| 特性 | 状态 |
|------|------|
| 杂志级排版（16 种布局，不对称优先） | ✅ 稳定 |
| 8pt Grid + 12 Column 设计系统 | ✅ 稳定 |
| 交互式演示（快捷键、概览、全屏、低功耗） | ✅ 稳定 |
| 10 种视觉风格（Minimal/Editorial/Swiss/Glass...） | ✅ v0.9 |
| Native PPTX 导出（全文字可编辑） | ✅ 稳定 |
| 出版级 PDF（3mm 出血 + 裁切标记） | ✅ 稳定 |
| Figma 导出 — Code.to.Design（高 fidelity，剪贴板粘贴） | ✅ v2.0 |
| Figma 导出 — 本地模式（内置插件，免费离线） | ✅ v1.0 |
| IDML 导出（InDesign 原生导入，文字/样式完整） | ✅ v1.0 |
| InDesign 编辑 PDF（原生图片 + 可选文字） | ✅ v1.0 |
| 响应式/自适应设计（mobile/tablet/desktop） | ✅ 稳定 |
| 主题色切换（8 套预设） | ✅ 稳定 |

---

## 已知限制

| 格式 | 限制 | 原因 |
|------|------|------|
| **PPTX** | CSS 出血/重叠/文字压图不完全还原 | PPTX 格式不支持杂志级绝对定位 |
| **Figma C2D** | 仅支持 Google Fonts（不支持 system fonts） | Code.to.Design 解析限制 |
| **Figma C2D** | 需联网 + 消耗 credits | 依赖第三方 API |
| **Figma 本地** | 文字双击才渲染 | Figma Plugin API 文本节点渲染机制 |
| **Figma 本地** | CSS 排版不完全还原，文字框可能重叠 | 浏览器 vs Figma 文本布局引擎差异 |
| **IDML** | 图片为外部链接，需保持 `index_images/` 同目录 | IDML 格式不嵌入二进制图片 |
| **PDF 印刷** | 文件较大（7MB+） | 全页 PNG 覆盖层 |

---

## 10 种视觉风格

| 风格 | 语感 | 参考 | 主题 |
|------|------|------|------|
| **Minimal** | 少即是多 | Apple | `default` / `mono` |
| **Editorial** | 印刷杂志搬上屏幕 | NYT Magazine | `default` / `sand` |
| **Swiss** | 网格与秩序 | 瑞士国际主义 | `mono` |
| **Architectural** | 空间与结构 | Tadao Ando | `forest` |
| **Brutalism** | 粗犀牛排版 | 反设计运动 | `sand` |
| **Glass** | 未来感透明层次 | Apple Vision Pro | `indigo` / `ocean` |
| **Dark** | 暗底发光 | GitHub Dark | `indigo` |
| **Bento** | 井然有序的网格 | Dashboard | `mono` |
| **Luxury** | 昂贵感 | 高端品牌 | `rose` |
| **Cyberpunk** | 霓虹夜色 | 赛博朋克 | `neon` |

完整参数（字体/颜色/间距/动效/特效/布局/禁忌）→ `design/style-guide.md`

---

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

---

## 依赖

- [PptxGenJS](https://github.com/gitbrent/PptxGenJS) — PPTX 生成
- [Playwright](https://playwright.dev) — 浏览器渲染 + 截图 + PDF

```bash
cd scripts
npm install
npx playwright install chromium
```

---

## 许可证

MIT License · Copyright (c) 2026 Jorgut

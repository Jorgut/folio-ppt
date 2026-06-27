# Design Decision Engine

> 在动笔（写 HTML）之前，先运行这套决策流程。

## 为什么需要决策引擎

大多数 PPT/展示层设计失败的原因是：
1. 风格与内容不匹配（创意路演用极简 = 无趣）
2. 交互层级与场景不匹配（学术汇报用 WebGL = 喧宾夺主）
3. 颜色与品牌/情绪不匹配

决策引擎在生成任何代码之前，将输入参数映射到设计选择。

---

## 决策流程

### 第一步：项目类型

```
1. 路演 / Pitch     → 节奏快、视觉冲击、大标题+大图
2. 学术报告         → 内容优先、排版清晰、数据图表
3. 产品演示         → 截屏+功能介绍、对比
4. 品牌展示         → 品牌色、留白多、高级感
5. 设计作品集       → 全出血图、动效丰富、视觉驱动
6. 数据 Dashboard   → 网格布局、信息密度高、交互式
7. 内部文档         → 极简排版、低交互、可打印
```

### 第二步：受众分析

```
受众类型 → 关键考量
──────── → ─────────
高管        → 时间少，大标题 + 关键数字，不要小字
客户        → 视觉一致性，品牌色，易懂的图
大众        → 吸引眼球的封面，少文字，多图片
学术        → 可读性，数据准确性，参考文献
技术        → 代码/架构图，深色模式偏好
```

### 第三步：视觉风格选择

> 详细定义见 `visual-styles/`

```
风格选择树：
├── 商业/正式 → Minimal / Editorial
├── 创意/路演 → Brutalism / Cyberpunk / Neon
├── 品牌/高端 → Luxury / Editorial
├── 技术/科技 → Glass / Dark / Minimal
├── 设计/艺术 → Swiss / Architectural
├── 数据/报告 → Bento / Minimal
├── 学术/研究 → Editorial / Minimal
```

### 第四步：交互层级

> 详细定义见 `engines/interaction-engine.md`

```
L0 静态     → PDF/打印预览
L1 轻量     → 内部文档、纯内容
L2 标准     → 大部分路演（推荐）
L3 丰富     → 作品集、营销页面
L4 沉浸     → 创意展示、品牌体验
```

### 第五步：输出格式

> 详细定义见 `engines/export-engine.md`

```
HTML  → 完整交互体验（主输出）
PPTX  → 客户可编辑交付（推荐）
PDF   → 印刷/出版/分享
```

---

## 快速决策矩阵

| 用户输入 | 风格 | 交互 | 布局策略 | 特效 |
|---------|------|------|---------|------|
| "做一个公司路演PPT" | Editorial | L2 | Cover→Split→Stats→Timeline→Closing | 无 |
| "设计作品集" | Architectural | L3 | Cover→Bleed→Gallery→Overlap→Spread→Closing | Glass + Parallax |
| "新产品发布" | Glass | L2-L3 | Cover→Split→Gallery→Compare→Stats→Closing | Glass + Aurora |
| "学术论文汇报" | Minimal | L1 | Cover→Editorial→Table→Stats→Closing | 无 |
| "数据大屏" | Bento | L2 | Stats→Table→Compare→Stats→Closing | CountUp |
| "品牌官网展示" | Luxury | L2 | Cover→Spread→Gallery→Pull-quote→Closing | Gradient Mesh |
| "黑客马拉松路演" | Neon | L3 | Cover→List→Compare→Stats→Closing | Glow + Particle |
| "技术架构分享" | Dark | L2 | Cover→Timeline→Compare→Table→Closing | Aurora |

---

## 设计参数记忆卡

> 输出最终设计时，在文件头部记录：

```html
<!--
✨ Design Parameters
  Project Type:    [路演/报告/品牌/作品集/dashboard/文档]
  Audience:        [高管/客户/大众/学术/技术]
  Visual Style:    [Minimal/Architectural/Editorial/Swiss/Brutalism/Glass/Dark/Bento/Luxury/Cyberpunk]
  Interaction Lv:  [L0/L1/L2/L3/L4]
  Color Theme:     [default/indigo/forest/sand/mono/neon/rose/ocean]
  Typography:      [标题字体 / 正文字体]
  Output Format:   [HTML/PPTX/PDF]
-->
```

这确保后续维护者理解设计意图。

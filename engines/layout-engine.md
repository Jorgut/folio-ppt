# Layout Engine

> 布局选择与组合规则

## 核心原则

1. **不对称优先** — 避免 50/50 对称分割，推荐 4/8、3/9、7/5
2. **图文叠加** — 文字浮于图上是杂志感的灵魂
3. **全出血** — 图片突破安全区边界创造沉浸感
4. **节奏变化** — 连续 2 页相同布局后必须换布局
5. **封面 / 章节 / 收束页** — 必须用居中或大字布局

## 布局组合策略

| 内容类型 | 推荐布局序列 | 说明 |
|---------|------------|------|
| 产品路演 | Cover → Split → Gallery → Stats → Closing | 先摆产品再讲故事 |
| 研究报告 | Cover → Timeline → Split → Table → Stats → Closing | 先时间线建立信任 |
| 设计作品集 | Cover → Bleed → Gallery → Overlap → Spread → Closing | 视觉驱动 |
| 商业模式 | Cover → List → Compare → Stats → Table → Closing | 逻辑驱动 |
| 学术汇报 | Cover → Editorial → Table → Stats → Split → Closing | 内容驱动 |

## 布局速查

| 布局 | 定义 | 最佳内容量 | 视觉权重 |
|------|------|-----------|---------|
| Cover | `<section data-layout="cover">` | 标题 + 副标题 | 高 |
| Split 4-8 | `data-layout="split"` 默认 | 1 图 + 若干文字 | 中 |
| Split 3-9 | `class="col-span-3"` 左侧 | 窄侧强调 | 中 |
| Overlap | `data-layout="overlap"` | 全屏图 + 浮层文字 | 高 |
| Bleed Quote | `data-layout="bleed-quote"` | 图 + 大字引语 | 很高 |
| Editorial | `data-layout="editorial"` | 2栏正文 | 低 |
| Stats | `data-layout="stats"` | 3-4 个数字 | 很高 |
| Gallery | `data-layout="gallery"` | 4-8 张图 | 中 |
| Timeline | `data-layout="timeline"` | 3-6 步骤 | 中 |
| Spread | `data-layout="spread"` | 左图右文全出血 | 很高 |
| Compare | `data-layout="compare"` | 2 组对比 | 中 |
| List | `data-layout="list"` | 4-8 条项目 | 低 |
| Chapter | `data-layout="chapter"` | 章节标题 | 高 |
| Table | `data-layout="table"` | 3-8 行数据 | 低 |
| Inset | `data-layout="inset"` | 1 图 1 文 | 中 |
| Pull-quote | `data-layout="pull-quote"` | 1 条引用 | 高 |

## 布局决策规则

```
IF 图片质量高 → 选择 Overlap / Bleed / Spread / Gallery
IF 数据重要 → 选择 Stats / Table
IF 需要叙事 → 选择 Timeline / List
IF 需要对比 → 选择 Compare
IF 品牌感 → 选择 Cover (全屏品牌色或视频背景)
IF 内容密集 → 选择 Editorial / Split (右侧放内容)
```

## 组合禁忌

- ❌ 连续 3 页 Split 布局（视觉疲劳）
- ❌ 连续使用 Stats（每个数字失去冲击力）
- ❌ Cover 后接 Bleed（两个全出血冲突）
- ❌ Gallery 后再用 Gallery（视觉单调）

## 响应式行为

| 布局 | 平板 | 手机 |
|------|------|------|
| Split | 上下排列 | 全堆叠 |
| Overlap | 浮层缩小 | 图在上，文字在下 |
| Spread | 缩小图片区域 | 单列 |
| Gallery | 3 列 | 2 列 |
| Editorial | 合并一栏 | 单列 |

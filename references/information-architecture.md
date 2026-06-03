# Information Architecture for Presentations

> 演示文稿的 IA 框架——从内容到结构

## 核心原则

> "Organizing information is not about making things neat — it's about making things meaningful." — Richard Saul Wurman

信息架构在演示文稿中解决的问题：
1. **内容优先级**：什么必须在第一页看到？什么可以藏在附录？
2. **层级关系**：哪些概念是父子关系？哪些是并列关系？
3. **阅读路径**：观众的眼睛应该从哪里开始？经过哪里？在哪里停下？
4. **认知负荷**：每页信息密度是否匹配观众的注意力带宽？

---

## IA 五阶段流程（适配演示文稿）

### Phase 1 · Discovery & Audit

**目标**：搞清楚"我们有什么内容"

| 活动 | 产出 | 方法 |
|------|------|------|
| 内容盘点 | Content inventory 列表 | 逐页列出所有要放进去的内容 |
| 受众分析 | Audience persona | 他们知道什么？不知道什么？关心什么？ |
| 场景约束 | Constraint list | 时长、页数、格式、设备、分享方式 |

**内容盘点模板**：

```markdown
## Content Inventory

| # | 内容块 | 类型 | 优先级 | 必选/可选 | 目标页 |
|---|--------|------|--------|----------|--------|
| 1 | 标题 + 副标题 | 文字 | P0 | 必选 | 封面 |
| 2 | 核心数据 #1 | 数据 | P0 | 必选 | Stats 页 |
| 3 | 用户故事 | 叙事 | P1 | 必选 | Split 页 |
| ... | ... | ... | ... | ... | ... |
```

**Priority 定义**：
- **P0**：没有这页就不成立
- **P1**：核心论证需要
- **P2**：补充说明，有更好
- **P3**：nice-to-have，页数允许才放

### Phase 2 · Research

**目标**：搞清楚"观众怎么想"

| 活动 | 产出 | 方法 |
|------|------|------|
| 受众心智模型 | Mental model diagram | 他们用什么分类方式理解你的内容？ |
| 词汇验证 | Vocabulary list | 你用的术语他们能听懂吗？ |
| 竞品结构分析 | Competitor structure | 类似的 presentation 怎么组织的？ |

**演示文稿的"用户研究"简化版**：

不需要做完整的 card sort，但要回答：
1. 观众最关心的 3 个问题是什么？
2. 他们对这个主题已知什么？未知什么？
3. 你希望他们离开时记住的 1 件事是什么？（只能有 1 件）

### Phase 3 · Structural Modeling

**目标**：把内容组织成可读的结构

**演示文稿的叙事弧**（Nancy Duarte 模型）：

```
Hook (钩子)        → 1 页   : 反差 / 问题 / 硬数据让人停下来
Context (定调)     → 1-2 页 : 背景 / 你是谁 / 为什么讲这个
Core (主体)        → 3-5 页 : 核心内容，用不同 layout 穿插
Shift (转折)       → 1 页   : 打破预期 / 提出新观点
Takeaway (收束)    → 1-2 页 : 金句 / 悬念问题 / 行动建议
```

**内容分块原则**：

每页只传达 **1 个核心信息**（One Point Per Slide）。如果一页要传达 2 个信息，拆成 2 页。

**信息密度矩阵**：

| 内容类型 | 每页元素上限 | 布局推荐 |
|---------|------------|---------|
| 叙事/故事 | 1 图 + 1 段文字 | Split / Overlap |
| 数据/统计 | 1-3 个核心数字 | Stats |
| 流程/步骤 | 4-6 步 | Pipeline / Timeline |
| 对比/选择 | 2-3 个对比项 | Split / Compare |
| 引语/金句 | 1 句话 | Bleed Quote / Closing |
| 图片/视觉 | 1-4 张图 | Gallery / Full-bleed |

### Phase 4 · Validation

**目标**：验证结构是否成立

**快速验证方法**（不需要正式 tree testing）：

1. **电梯测试**：用 30 秒说清楚你的 deck 在讲什么。如果说不清楚，结构有问题。
2. **页码测试**：只看页码和标题，能猜出大致内容吗？如果不能，层级有问题。
3. **删减测试**：删掉任何一页，论证还成立吗？如果成立，那页可能是 P3，考虑去掉。

### Phase 5 · Documentation

**目标**：产出结构文档，指导后续 wireframe

**Deck Structure Document 模板**：

```markdown
## Deck Structure

### 受众
[描述]

### 核心信息（1 句话）
[你希望观众离开时记住的 1 件事]

### 时长 / 页数
[X 分钟 / Y 页]

### 叙事弧
1. Hook: [什么钩子] → [什么布局]
2. Context: [什么背景] → [什么布局]
3. Core 1: [什么内容] → [什么布局]
4. Core 2: [什么内容] → [什么布局]
...
N. Takeaway: [什么收束] → [什么布局]

### 主题节奏
| 页 | 主题 | 布局 | 信息密度 |
|----|------|------|---------|
| 1 | hero dark | Cover | 低 |
| 2 | light | Editorial | 中 |
| 3 | dark | Stats | 高 |
| ... | ... | ... | ... |
```

---

## IA 反模式（常见错误）

| 错误 | 为什么错 | 修正 |
|------|---------|------|
| **跳过 IA 直接写** | 结构错了后面全白费 | 至少花 10 分钟做 Phase 1 |
| **每页都想传达 3+ 个信息** | 认知超载，观众什么都记不住 | One Point Per Slide |
| **没有叙事弧** | 变成 bullet list 的堆砌 | 用 Hook→Core→Takeaway 结构 |
| **层级太平** | 所有内容看起来一样重要 | 用字号 + 颜色 + 位置建立层级 |
| **没有验证** | 自己觉得清楚，观众觉得乱 | 做电梯测试 + 删减测试 |

---

## 与 Wireframing 的关系

```
IA 产出: Deck Structure Document
         ↓
Wireframe 产出: 每页的视觉结构
         ↓
Mockup 产出: 最终高保真设计
```

IA 决定**放什么、按什么顺序放**。
Wireframe 决定**放在哪里、占多大面积**。
Mockup 决定**长什么样、用什么颜色字体**。

---

## 参考来源

- Richard Saul Wurman — Information Architecture 原则
- Nancy Duarte — Slide:ology（叙事弧模型）
- Garr Reynolds — Presentation Zen（少即是多）
- Information Architecture Authority — IA 五阶段流程
- Figma Resource Library — Wireframing for IA

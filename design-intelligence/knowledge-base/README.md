# Design Knowledge Base

> 设计原则、UX 法则、无障碍标准参考。

## 目录

- [Gestalt Principles](./gestalt.md) — 格式塔心理学原则
- [UX Laws](./ux-laws.md) — Nielsen 启发式 & HCI 研究法则
- [Accessibility](./accessibility.md) — WCAG 无障碍标准
- [Information Design](./information-design.md) — 信息设计规则

---

## 速查

### Gestalt Principles

| 原则 | 含义 | 设计应用 |
|------|------|---------|
| 邻近性 | 靠近的元素属于一组 | 卡片间距、导航分组 |
| 相似性 | 相似的元素属于一组 | 颜色/字号系统一致性 |
| 闭合性 | 大脑自动补全 | Logo、图标简化 |
| 连续性 | 视线沿对齐方向移动 | 对齐引导阅读流 |
| 图形-背景 | 区分前景与背景 | 毛玻璃、阴影层级 |
| 共同区域 | 同一框内为一组 | Card 容器分组 |

### UX Laws

| 法则 | 含义 | 设计应用 |
|------|------|---------|
| Fitts's Law | 目标大小 + 距离决定操作时间 | 导航点 ≥44px 点击区 |
| Hick's Law | 选择越多决策越慢 | 导航层级 ≤ 3 层 |
| Miller's Law | 工作记忆 7±2 项 | 信息分块 ≤ 5 项 |
| Jakob's Law | 用户偏好熟悉模式 | 遵循平台交互惯例 |
| Law of Proximity | 靠近即关联 | 图注排版 |

### Accessibility (WCAG 2.1 AA)

| 要求 | 标准 |
|------|------|
| 对比度 | 正文 ≥ 4.5:1，大文字 ≥ 3:1 |
| 触控目标 | ≥ 44×44px |
| 文字缩放 | 200% 不丢内容 |
| 焦点可见 | 键盘导航有焦点样式 |
| 动效可控 | prefers-reduced-motion |

### Information Design

| 原则 | 应用 |
|------|------|
| F 型阅读 | 资讯类：标题→引语→详情 |
| Z 型布局 | Landing：Logo→CTA→图片 |
| 倒金字塔 | 最重要的在最前面 |
| Signal-to-Noise | 去除装饰元素，突出数据 |
| 数据墨水比 | Tufte 原则：最大化数据/墨水 |

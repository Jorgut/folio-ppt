# Bento · 便当网格

> Dashboard · 数据 · 模块化

## 语感

"井然有序的网格" — 卡片网格、数据驱动、信息密度高、全局概览。

## 参考品牌

Apple Music / Apple News 网格布局, Notion, Linear, Bento 网格设计

## 字体

```
标题: Inter SemiBold (字重 600)
正文: Inter / SF Pro Text (字重 400)
数字: Inter / SF Mono (字重 700)
元数据: Inter (字重 400, 字号小)
```

## 颜色

| 角色 | 浅色 | 深色 |
|------|------|------|
| 背景 | `#f5f5f7` | `#111111` |
| 卡片 | `#ffffff` | `#1c1c1e` |
| 文字 | `#1a1a1a` | `#f5f5f7` |
| 强调 | `#4a6fa5` 或 数据颜色 | `#5a8fbf` |
| 次要 | `#6b7280` | `#98989d` |

## 间距

紧凑 Grid: gap `--sp-4` (16px) / `--sp-5` (24px)。卡片内 padding `--sp-4`。

## 动效

L2 — CountUp (数字)、卡片滚动入场 Stagger (80ms 间隔)

## 特效

- 卡片阴影 (subtle)
- 圆角 12-16px
- 无装饰特效

## 布局

- 网格卡片布局 (CSS Grid auto-fill)
- 每个卡片独立
- Stats 分布在卡片网格中
- Table 嵌入卡片
- 信息密度高，一屏容纳 4-8 卡片

## CSS 核心

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--sp-4);
}
.bento-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: var(--sp-4);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
```

## 禁忌

- ❌ 全出血图（破坏卡片秩序）
- ❌ 多方向阅读（Bento 需要 F 型扫描）
- ❌ 过大间距（减少信息密度）
- ❌ 不对齐元素

# Animation Engine

> 动效方案选择与控制规则

## 动效原则

1. **动效应有目的** — 引导注意力、反馈交互、建立空间关系
2. **时长 200-500ms** — 太短看不清，太长等不及
3. **缓动函数决定感受** — `cubic-bezier(0.16, 1, 0.3, 1)` 推荐
4. **尊重低功耗** — `prefers-reduced-motion` 时关闭所有动画
5. **连续相同动效不超过 3 页** — 防止审美疲劳

## 动效类型

| 类型 | 用途 | 时长 | 缓动 |
|------|------|------|------|
| **FadeIn** | 通用入场 | 400ms | ease-out |
| **ScaleIn** | 突出元素 | 300ms | spring(0.3) |
| **SlideUp** | 文字入场 | 500ms | cubic-bezier(0.16,1,0.3,1) |
| **Stagger** | 列表/卡片组入场 | 80ms 间隔 | ease-out |
| **Reveal** | 图片裁切入场 | 600ms | cubic-bezier(0.16,1,0.3,1) |
| **Parallax** | 滚动时图层差速 | 滚动相关 | linear |
| **CountUp** | 数字动画 | 1-2s | ease-out |
| **Glow** | 强调色发光 | 1.5s loop | ease-in-out |
| **Magnetic** | 按钮跟随鼠标 | 200ms | spring |
| **Liquid** | 扭曲过渡 | 800ms | custom |

## 决策规则

```
IF 内容密集 → 使用 FadeIn（最低干扰）
IF 视觉驱动 → 使用 Reveal + Stagger + Parallax
IF 数据驱动 → 使用 CountUp + Chart Animation
IF 快速浏览 → 禁用动画（可读性优先）
```

## 动效实现

模板内置 CSS transition + animation：

```css
/* 页面过渡 */
.slide { opacity: 0; transition: opacity 400ms ease-out; }
.slide.active { opacity: 1; }

/* 元素入场 */
[data-animate="fade-up"] {
  opacity: 0; transform: translateY(20px);
  transition: all 500ms cubic-bezier(0.16,1,0.3,1);
}
[data-animate="fade-up"].visible {
  opacity: 1; transform: translateY(0);
}
```

## 缓动速查

| 名称 | 效果 | 函数 |
|------|------|------|
| ease-out-smooth | 优雅戛然而止 | `cubic-bezier(0, 0, 0.2, 1)` |
| ease-in-out-smooth | 平稳来回 | `cubic-bezier(0.4, 0, 0.2, 1)` |
| spring-subtle | 回弹效果 | `cubic-bezier(0.16, 1, 0.3, 1)` |
| bounce | 弹跳效果 | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

## 低功耗模式

按下 `B` 键或 `prefers-reduced-motion` 时：

```css
@media (prefers-reduced-motion) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

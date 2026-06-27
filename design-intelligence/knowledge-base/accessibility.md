# Accessibility · 无障碍设计

> WCAG 2.1 AA 标准在轮播/演示中的实现。

## 1. 色彩对比度

| 要求 | WCAG AA | WCAG AAA |
|------|---------|---------|
| 正文 | ≥ 4.5:1 | ≥ 7:1 |
| 大文字 (≥24px 或 ≥19px bold) | ≥ 3:1 | ≥ 4.5:1 |
| 禁用状态 | 无要求 | 无要求 |

**检查工具**：WebAIM Contrast Checker

## 2. 触控目标 (Fitts's Law)

所有可交互元素触控区域 ≥ 44×44px：
- 导航圆点
- 翻页箭头
- 按钮
- 链接

使用 `::after` 扩展不可见点击区：

```css
.clickable::after {
  content: '';
  position: absolute;
  inset: calc((44px - 100%) / -2);
}
```

## 3. 文字缩放

200% 缩放后内容不丢失：
- 使用 `clamp()` 响应式字号
- 不使用固定 px 限制容器
- 不依赖绝对定位的精确像素

## 4. 键盘导航

所有交互必须键盘可访问：
- 翻页：← → ↑ ↓ Space
- 全屏：F
- 退出：Escape
- 焦点可见：`:focus-visible` 样式

```css
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

## 5. 动效可控

```css
/* 用户系统设置 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* 手动低功耗模式（B 键） */
body.low-power *, body.low-power *::before, body.low-power *::after {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

## 6. 屏幕阅读器

```html
<!-- 页面标题 -->
<section aria-label="第3页：我们的数据" role="region">

<!-- 图像替代 -->
<img src="chart.jpg" alt="2024年营收增长35%的图表">

<!-- 跳转链接 -->
<a href="#content" class="skip-link">跳到主要内容</a>

<!-- 状态通知 -->
<div aria-live="polite" class="sr-only">第3页已加载</div>
```

## 7. 响应式无障碍

- 触屏设备：导航点放大至 14px
- 横屏手机：压缩间距但仍保持触控目标
- 大屏：加大安全区、可读性优化
- 打印：隐藏导航，保留内容

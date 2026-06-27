# Dark · 深色模式

> 科技 · 夜间 · 沉浸

## 语感

"暗底发光" — 深色背景、发光强调色、高对比、科技感。

## 参考品牌

GitHub Dark, VSCode, 游戏 UI, 科技 Dashboard

## 字体

```
标题: Inter Heavy / SF Pro Display (字重 800)
正文: Inter Light / Helvetica Neue Light (字重 300)
元数据: SF Mono / JetBrains Mono (字重 400)
```

## 颜色

| 角色 | 深色 |
|------|------|
| 背景 | `#0f0f1a` |
| 面板 | `#1a1a2e` (rgba 叠加) |
| 文字 | `#e8ecf4` |
| 强调 | `#00d4ff` 亮青 / `#7c5cfc` 紫 |
| 次要 | `#6b7280` |
| 分割线 | `rgba(255,255,255,0.06)` |

## 间距

标准 8pt Grid

## 动效

L2 - 发光 Glow 强调 + 平滑过渡

## 特效

- Aurora (暗色背景渐变光)
- Glow (发光文字/按钮)
- 细微粒子 (Canvas 背景)
- 发光边框

## 布局

- Cover: 居中标题 + 发光强调线
- Split: 深色面板 + 发光装饰
- Stats: 发光数字

## CSS 核心

```css
.glow-text {
  text-shadow: 0 0 20px var(--accent), 0 0 40px var(--accent);
}
.glow-border {
  box-shadow: 0 0 15px var(--accent), inset 0 0 15px var(--accent);
}
```

## 禁忌

- ❌ 浅色文字叠在浅色背景上（对比度不足）
- ❌ 使用棕色/土色（在深色背景下显脏）
- ❌ 大量多色发光（视觉混乱）

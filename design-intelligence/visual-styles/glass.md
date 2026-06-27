# Glass · 毛玻璃

> 科技 · 现代 · SaaS

## 语感

"未来感透明层次" — 毛玻璃面板、高斯模糊背景、悬浮 UI、光影通透。

## 参考品牌

Apple Vision Pro UI, Glassmorphism, Windows 10/11 Fluent Design

## 字体

```
标题: Inter SemiBold / SF Pro Display (字重 600)
正文: Inter / SF Pro Text (字重 400)
元数据: SF Mono / JetBrains Mono (字重 400)
```

## 颜色

| 角色 | 浅色 | 深色 |
|------|------|------|
| 背景 | `#f0f4f8` + 渐变 | `#0a0e1a` + 暗渐变 |
| 文字 | `#1a1a2e` | `#e8ecf4` |
| 强调 | `#4a6fa5` / `#667eea` | `#6b8fc9` / `#8899ee` |
| 次要 | `#6b7280` | `#8899b0` |

## 间距

标准 8pt Grid，面板间用 `--sp-5` / `--sp-6`

## 动效

L2-L3 — 平滑 300ms ease-out + Magnetic Hover + 浮动感

## 特效

- Glass 毛玻璃面板 (`backdrop-filter: blur(20px)`)
- Aurora (背景渐变模糊光)
- 细微阴影 + 悬浮感
- 圆角 ≥ 16px

## 布局

- Cover: 居中毛玻璃面板 + 模糊背景
- Overlap: 浮层面板
- Split: 毛玻璃侧面板

## CSS 核心

```css
.glass-panel {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
}
.dark .glass-panel {
  background: rgba(0,0,0,0.3);
  border-color: rgba(255,255,255,0.08);
}
```

## 禁忌

- ❌ 不透明/高饱和背景（破坏毛玻璃效果）
- ❌ 锐利直角（玻璃风格需圆角）
- ❌ 粗野主义/霓虹（冲突）

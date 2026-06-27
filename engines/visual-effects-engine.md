# Visual Effects Engine

> 视觉特效选择与控制规则

## 核心原则

1. **特效为内容服务** — 不要为炫技添加特效
2. **性能考量** — WebGL/Shader/粒子密集消耗 GPU
3. **降级策略** — 移动端降级为 CSS-only
4. **低功耗模式** — 按下 B 键关闭所有特效

## 特效类型

| 特效 | 技术 | 性能成本 | 适用风格 |
|------|------|---------|---------|
| **Glass** | `backdrop-filter: blur()` | 低 | Glass, Tech |
| **Gradient Mesh** | CSS gradient 网格叠加 | 低 | Editorial, Luxury |
| **Noise Overlay** | CSS `mix-blend-mode` | 低 | Brutalism, Editorial |
| **Aurora** | CSS gradient + blur | 中 | Dark, Neon |
| **Particle Field** | Canvas/Three.js | 高 | Cyberpunk, Creative |
| **Shader** | WebGL GLSL | 很高 | 沉浸式展示 |
| **3D Scene** | Three.js | 高 | 产品展示 |
| **Cursor Trail** | Canvas | 中 | 创意作品集 |
| **Morph** | SVG 变形 | 中 | 品牌展示 |
| **Mosaic** | CSS grid + 图片分块 | 中 | 艺术展示 |

## 风格 → 特效映射

| 风格 | 推荐特效 | 理由 |
|------|---------|------|
| Minimal | 无特效 | 极简不需多余 |
| Architectural | Gradient Mesh / 轻微 Noise | 丰富纹理不抢戏 |
| Editorial | Noise Overlay | 纸质感 |
| Swiss | 无特效或纯色块 | 干净几何 |
| Brutalism | Noise + 曝光过度 | 粗粝感 |
| Glass | Glass + Aurora | 毛玻璃轻盈 |
| Dark | Aurora + Glow | 科技感 |
| Cyberpunk | Particle + Shader + Cursor | 沉浸感 |
| Luxury | Gradient Mesh + Glass | 高级质感 |

## 决策规则

```
IF 性能优先 → 仅使用 CSS-only 特效
IF 移动端优先 → 禁止 WebGL/Canvas 特效
IF 低功耗模式 → 关闭所有特效
IF 打印/PDF → 关闭所有特效
```

## CSS 特效速查

```css
/* Glass */
.glass { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }

/* Noise */
.noise::after { content: ''; background: url('data:image/svg+xml,...'); mix-blend-mode: overlay; opacity: 0.05; }

/* Aurora */
.aurora { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); filter: blur(60px); opacity: 0.3; }

/* Glow Text */
.glow { text-shadow: 0 0 20px var(--accent), 0 0 40px var(--accent); }
```

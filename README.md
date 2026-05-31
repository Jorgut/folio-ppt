# Folio · 杂志风 PPT

由 Jorgut 创建 · MIT 协议开源

**单文件 HTML** 横向翻页 PPT，杂志编辑式排版。支持一键导出 PPTX（截图方式，布局 100% 还原）。

## 快速开始

```bash
# 1. 拷贝模板到项目
cp index.html 我的项目/ppt.html
mkdir -p 我的项目/images

# 2. 浏览器预览
open 我的项目/ppt.html

# 3. 安装依赖（仅导出需要）
cd scripts/
npm install
npx playwright install chromium

# 4. 导出 PPTX
node export-pptx.mjs 我的项目/ppt.html
```

## 8 种杂志布局

| 布局 | 用途 |
|------|------|
| Cover | 封面 |
| Split 4-8 / 3-9 / 7-5 | 不对称图文分栏 |
| Overlap | 全出血图 + 文字浮层 |
| Bleed Quote | 全出血图 + 引语 |
| Editorial | CSS 双栏正文 |
| Stats | 数字大字报 |
| Gallery | 图片画廊 |
| Closing | 收束页 |

## 设计原则

1. 不对称优于对称
2. 图文重叠创造层次
3. 全出血图呼吸感
4. 字号对比 ≥ 6:1
5. 留白是设计的一部分
6. 三种字体各司其职
7. 图片只用标准比例
8. 一套 deck 一套主题色

## 依赖

- [PptxGenJS](https://github.com/gitbrent/PptxGenJS) — PPTX 生成
- [Playwright](https://playwright.dev) — 浏览器截图

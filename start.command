#!/bin/bash
# Folio · Design Intelligence Engine
# 双击启动 Opencode，自动进入项目目录

cd "$(dirname "$0")"

clear
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Folio · Design Intelligence Engine          ║"
echo "║                                              ║"
echo "║  最近：README 重写 / Wireframe 更新           ║"
echo "║         Figma双模式 / IDML 文档               ║"
echo "║                                              ║"
echo "║  待办：优化"开始项目"引导流程                  ║
echo "║         评估 Design Engine 架构重构           ║"
echo "║                                              ║"
echo "║  Opencode 启动中...                          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "> 上下文已保存至 HANDOFF.md"
echo "> 在新会话中粘贴该文件内容即可继续"
echo ""

cat HANDOFF.md

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Opencode 启动中... 请稍候"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exec opencode

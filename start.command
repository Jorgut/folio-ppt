#!/bin/bash
# Folio - Design Intelligence Engine
# Double-click to launch opencode in the project directory

cd "$(dirname "$0")"

clear
echo ''
echo '╔══════════════════════════════════════════════╗'
echo '║  Folio · Design Intelligence Engine          ║'
echo '║                                              ║'
echo '║  Recent: README rewrite / Wireframe update   ║'
echo '║          Figma dual-mode / IDML docs         ║'
echo '║                                              ║'
echo '║  TODO: Improve getting-started flow          ║'
echo '║        Evaluate Design Engine restructure    ║'
echo '║                                              ║'
echo '║  Launching opencode...                       ║'
echo '╚══════════════════════════════════════════════╝'
echo ''
echo '> Context saved in HANDOFF.md'
echo '> Paste its content in a new session to continue'
echo ''

cat HANDOFF.md

echo ''
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo '  Starting opencode...'
echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
echo ''

exec opencode

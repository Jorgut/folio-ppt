#!/bin/bash
# Folio - Design Intelligence Engine
# Double-click to copy context and launch opencode
# Then Cmd+V in opencode to paste the HANDOFF context

cd "$(dirname "$0")"

cat HANDOFF.md | pbcopy

clear
echo ''
echo '╔══════════════════════════════════════════════╗'
echo '║  Folio - Design Intelligence Engine          ║'
echo '║                                              ║'
echo '║  Recent: README rewrite / Wireframe update   ║'
echo '║          Figma dual-mode / IDML docs         ║'
echo '║                                              ║'
echo '║  TODO: Improve getting-started flow          ║'
echo '║        Evaluate Design Engine restructure    ║'
echo '║                                              ║'
echo '║  Context copied to clipboard!                ║'
echo '║  In opencode: press Cmd+V to paste           ║'
echo '╚══════════════════════════════════════════════╝'

cat HANDOFF.md

echo ''
echo '======================================================'
echo '  Context copied to clipboard!'
echo '  -> opencode started below, press Cmd+V to continue'
echo '======================================================'

exec opencode

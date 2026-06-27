#!/usr/bin/env node
/**
 * Export Folio deck to Figma.
 *
 * Two modes:
 *   c2d       — Code.to.Design API (high fidelity, requires C2D_API_KEY)
 *               Sends each slide to the cloud API, gets clipboard data → paste in Figma
 *   local     — Built-in Figma plugin (free, lower fidelity)
 *               Extracts text positions + images → .figma.json + figma-plugin/
 *   clipboard — (EXPERIMENTAL) Local clipboard encoding using @figit/fig-kiwi
 *               Same data as local mode, but encodes to Figma-native clipboard format
 *               for Cmd+V paste — fidelity matches local mode (limited)
 *   auto      — (default) c2d if C2D_API_KEY is set, else local
 *
 * Usage:
 *   node scripts/export-figma.mjs path/to/index.html
 *   node scripts/export-figma.mjs --mode c2d path/to/index.html
 *   node scripts/export-figma.mjs --mode clipboard path/to/index.html
 *   node scripts/export-figma.mjs --mode local path/to/index.html
 *
 * Environment:
 *   C2D_API_KEY    Your Code.to.Design API key (get one at https://api.to.design)
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { resolve, join, basename, dirname } from 'path';
import { createInterface } from 'readline';
import { execSync } from 'child_process';
import { encodeSlidesToClipboard } from './figma-clipboard.mjs';

// ─── Constants ───────────────────────────────────────────────────
const SLIDE_W = 1280;
const SLIDE_H = 720;
const C2D_API_URL = 'https://api.to.design/html';
const TEXT_SELECTOR = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'li',
  '.display-hero', '.display-1', '.display-2', '.title-zh',
  '.lead', '.body', '.caption', '.meta',
  '.pull-quote', '.subtitle', '.kicker', '.attribution',
  '.stat-nb', '.stat-label', '.closing-quote',
  '.overlay-panel h2', '.overlay-panel .lead', '.overlay-panel .caption',
  '.quote-block .pull-quote', '.quote-block .attribution',
  '.text-panel h2', '.text-panel .lead', '.text-panel .body', '.text-panel .caption',
  '.article-header h2', '.article-body p',
  '.table-label', '.table-value', '.quote-text',
].join(', ');

// ─── Help ─────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
Folio → Figma Export

Usage:
  node scripts/export-figma.mjs [options] <path/to/index.html>

Options:
  --mode <mode>    auto (default) | c2d | clipboard | local
  --output <dir>   Output directory (default: same as input HTML)
  -h, --help       Show this help

Modes:
  auto      Try c2d (if C2D_API_KEY set), fallback: local
  c2d       Use Code.to.Design API — sends HTML to cloud for Figma conversion
  clipboard EXPERIMENTAL: local fig-kiwi encoding (low fidelity, no plugin)
  local     Use built-in Figma Importer plugin (free)

Environment:
  C2D_API_KEY    Your Code.to.Design API key
                 Get one at https://api.to.design  (free: 10 credits)
`);
}

function toFileUrl(p) { return `file://${p}`; }

function toHexColor(colorValue, fallback = 'CCCCCC') {
  if (!colorValue || typeof colorValue !== 'string') return fallback;
  const n = colorValue.trim();
  const r = n.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (r) return r.slice(1, 4).map(v => Number.parseInt(v, 10).toString(16).padStart(2, '0')).join('').toUpperCase();
  const h = n.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (h) {
    const hex = h[1];
    return hex.length === 3 ? hex.split('').map(c => c + c).join('').toUpperCase() : hex.toUpperCase();
  }
  return fallback;
}

function mapFont(fontFamily = '') {
  const first = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  const lower = first.toLowerCase();
  if (lower.includes('playfair')) return 'Playfair Display';
  if (lower.includes('inter')) return 'Inter';
  if (lower.includes('jetbrains') || lower.includes('courier')) return 'Courier New';
  if (lower.includes('noto') || lower.includes('source han')) return 'Noto Serif SC';
  return first || 'Inter';
}

function mapAlign(align = 'left') {
  if (align === 'center' || align === 'centre') return 'CENTER';
  if (align === 'right') return 'RIGHT';
  if (align === 'justify') return 'JUSTIFIED';
  return 'LEFT';
}

// ─── Interactive prompt ──────────────────────────────────────────
function askQuestion(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer.trim());
  }));
}

// ─── Download a single image as base64 ────────────────────────────
async function downloadImageAsBase64(page, url) {
  try {
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 15000 });
    if (!resp || !resp.ok()) return null;
    const buffer = await resp.body();
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

// ─── Shared clipboard writer (macOS AppKit → pbcopy → HTML helper) ──
function writeSystemClipboard(clipboardData, outputDir, baseName) {
  const rawPath = join(outputDir, `${baseName}.figma-clipboard.html`);
  writeFileSync(rawPath, clipboardData, 'utf-8');

  let clipboardOk = false;

  if (process.platform === 'darwin') {
    try {
      const tmpFile = join(outputDir, `.${baseName}.figma-tmp.html`);
      const scriptFile = join(outputDir, `.${baseName}.figma-copy.applescript`);
      writeFileSync(tmpFile, clipboardData, 'utf-8');
      writeFileSync(scriptFile,
        'use framework "AppKit"\n' +
        `set d to current application's NSData's alloc()'s initWithContentsOfFile:"${tmpFile}"\n` +
        'set pb to current application\'s NSPasteboard\'s generalPasteboard()\n' +
        'pb\'s clearContents()\n' +
        'pb\'s setData:d forType:(current application\'s NSPasteboardTypeHTML)\n'
      );
      execSync(`osascript "${scriptFile}"`, { timeout: 10000 });
      execSync(`rm -f "${tmpFile}" "${scriptFile}"`);
      clipboardOk = true;
    } catch (err) {
      console.log(`  ⚠️  Native clipboard failed: ${err.message.slice(0, 80)}`);
    }
  }

  if (!clipboardOk) {
    try {
      execSync(`cat "${rawPath}" | pbcopy`, { timeout: 5000 });
      clipboardOk = true;
    } catch { /* silent */ }
  }

  if (!clipboardOk) {
    const helperPath = join(outputDir, `${baseName}.figma.html`);
    const helperHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Folio → Figma</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#1a1a2e;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
  .card{background:#16213e;border-radius:16px;padding:3rem 4rem;box-shadow:0 20px 60px rgba(0,0,0,0.5);max-width:520px}
  h1{font-size:1.5rem;margin-bottom:0.5rem;color:#fff}
  p{color:#8892b0;line-height:1.6;margin-bottom:1.5rem}
  .steps{text-align:left;background:#0f3460;border-radius:8px;padding:1rem 1.5rem;font-size:0.9rem;line-height:1.8}
  kbd{background:#1a1a2e;padding:2px 8px;border-radius:4px;font-family:monospace;border:1px solid #334}
</style></head>
<body><div class="card">
  <h1>Folio → Figma</h1>
  <p>Auto-copy didn't work on your platform.</p>
  <div class="steps">
    1. Open <b>${basename(rawPath)}</b> in a browser<br>
    2. <kbd>Cmd+A</kbd> select all → <kbd>Cmd+C</kbd> copy<br>
    3. Switch to Figma → <kbd>Cmd+V</kbd>
  </div>
</div></body></html>`;
    writeFileSync(helperPath, helperHtml, 'utf-8');
    console.log(`  ℹ️  Manual: open ${helperPath} → Cmd+A → Cmd+C → Figma → Cmd+V`);
    try { execSync(`open "${helperPath}"`); } catch { /* ignore */ }
  }

  return clipboardOk;
}

// ─── Initialize browser + page ────────────────────────────────────
async function createBrowserPage(htmlPath) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: SLIDE_W, height: SLIDE_H } });
  await page.goto(toFileUrl(htmlPath), { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.slide', { timeout: 10000 });
  await page.addStyleTag({ content: `
    #deck, .slide, .slide [data-anim], .anim-scale {
      transition: none !important; animation: none !important;
    }
    .slide, .slide [data-anim] {
      opacity: 1 !important; transform: none !important;
    }` });
  return { browser, page };
}

// ═══════════════════════════════════════════════════════════════════
// MODE: C2D — Code.to.Design API
// ═══════════════════════════════════════════════════════════════════
async function modeC2D({ page, absPath, outputDir, baseName }) {
  const apiKey = process.env.C2D_API_KEY;
  if (!apiKey) {
    console.log(`
╔══════════════════════════════════════════════════════╗
║  🔑  C2D_API_KEY not found                          ║
╚══════════════════════════════════════════════════════╝

Code.to.Design mode requires an API key.

Get one (free — 10 credits included):
  → https://api.to.design

Then set it:
  export C2D_API_KEY="your-key-here"
`);
    return false;
  }

  console.log('\n[1/3] Rendering deck with Playwright...');
  const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`  ${slideCount} slides found`);

  // Extract all <style> blocks from the page
  const pageStyles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('style'))
      .map(s => s.textContent)
      .join('\n');
  });

  // Also capture any inline styles that might be critical
  const inlineStyles = await page.evaluate(() => {
    const els = document.querySelectorAll('[style]');
    return Array.from(els).slice(0, 5).map(el => ({
      selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''),
      style: el.getAttribute('style')
    }));
  });

  // Build per-slide HTML payloads (all slides in one request = 1 credit)
  console.log('[2/3] Building slide HTML payload...');
  const slidePayloads = [];
  for (let i = 0; i < slideCount; i++) {
    // Navigate to slide (triggers correct class state)
    await page.evaluate((index) => {
      const deck = document.getElementById('deck');
      if (deck) deck.style.transform = `translateX(-${index * 100}%)`;
      document.querySelectorAll('.slide').forEach((s, idx) => s.classList.toggle('active', idx === index));
    }, i);
    await page.waitForTimeout(50);

    const slideHtml = await page.evaluate((index) => {
      const slide = document.querySelectorAll('.slide')[index];
      if (!slide) return '';
      // Include slide ID and all attributes for styling
      return slide.outerHTML;
    }, i);

    const full = `<style>${pageStyles}</style>\n<div class="slide-wrapper" style="width:${SLIDE_W}px;height:${SLIDE_H}px;overflow:hidden;position:relative;">\n${slideHtml}\n</div>`;
    slidePayloads.push(full);
  }

  // Send all slides in one API call (1 credit)
  console.log('[3/3] Sending to Code.to.Design API...');
  console.log(`  ${slideCount} slides → 1 credit`);
  const combinedHtml = slidePayloads.join('\n');

  let clipboardData;
  try {
    const response = await fetch(C2D_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ html: combinedHtml, clip: true })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    clipboardData = await response.text();
    if (!clipboardData || clipboardData.length < 50) {
      throw new Error('API returned empty or invalid clipboard data');
    }
  } catch (err) {
    console.error(`\n❌ Code.to.Design API error: ${err.message}`);
    console.log('\nFalling back to local mode...\n');
    return false; // Signal fallback
  }

  console.log(`  ✅ Clipboard data received (${(clipboardData.length / 1024).toFixed(0)} KB)`);

  const clipboardOk = writeSystemClipboard(clipboardData, outputDir, baseName);
  if (clipboardOk) {
    console.log(`  ✅ Copied to system clipboard (${(clipboardData.length / 1024).toFixed(0)} KB)`);
  }

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  ✅ Export complete — ${slideCount} slides           ║`);
  console.log(`║                                                ║`);
  console.log(`║  Open Figma → ${'Cmd+V'.padEnd(45)}║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
  return true;
}

// ─── Shared: extract slides from Playwright page ───────────────────
async function extractSlidesLocal(page) {
  const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
  const slides = [];
  for (let slideIndex = 0; slideIndex < slideCount; slideIndex++) {
    await page.evaluate((index) => {
      const deck = document.getElementById('deck');
      if (deck) deck.style.transform = `translateX(-${index * 100}%)`;
      document.querySelectorAll('.slide').forEach((s, i) => s.classList.toggle('active', i === index));
    }, slideIndex);
    await page.waitForTimeout(100);

    const slideData = await page.evaluate(({ index, textSelector }) => {
      const slides = Array.from(document.querySelectorAll('.slide'));
      const slide = slides[index];
      if (!slide) return null;

      const deck = document.getElementById('deck');
      if (deck) deck.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, i) => s.classList.toggle('active', i === index));

      const normalizeText = (v) => v.replace(/\r/g, '').replace(/[\t ]+\n/g, '\n').replace(/\n[\t ]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      const isWithinIgnored = (el) => Boolean(el.closest('#overview, #shortcuts, #nav'));
      const isImgContainer = (el) => Boolean(el.closest('.img, .img-backdrop, .img-full, .img-gallery-item'));

      const texts = Array.from(slide.querySelectorAll(textSelector))
        .filter(el => !isWithinIgnored(el) && !isImgContainer(el))
        .filter(el => el.querySelectorAll(textSelector).length === 0)
        .map(el => {
          const raw = normalizeText(el.innerText || el.textContent || '');
          if (!raw) return null;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return null;
          const cs = getComputedStyle(el);
          const lh = parseFloat(cs.lineHeight);
          return {
            text: raw,
            rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            style: {
              fontFamily: cs.fontFamily, fontSize: parseFloat(cs.fontSize), fontWeight: cs.fontWeight,
              color: cs.color, textAlign: cs.textAlign,
              lineHeight: isFinite(lh) ? lh : parseFloat(cs.fontSize) * 1.4,
              letterSpacing: cs.letterSpacing,
            },
            isItalic: el.closest('.pull-quote') !== null || cs.fontStyle === 'italic',
          };
        })
        .filter(Boolean);

      const images = Array.from(slide.querySelectorAll('img'))
        .filter(el => !isWithinIgnored(el))
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 10 && r.height > 10; })
        .map(el => {
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return { src: el.currentSrc || el.src || '', rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }, alt: el.alt || '', objectFit: cs.objectFit || 'cover' };
        })
        .filter(img => img.src && !img.src.startsWith('data:'));

      const bgEls = Array.from(slide.querySelectorAll('.img-full, .img-backdrop, .img'));
      for (const el of bgEls) {
        const cs = getComputedStyle(el);
        const bgImage = cs.backgroundImage || '';
        const m = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (m && m[1] && !m[1].startsWith('data:')) {
          const rect = el.getBoundingClientRect();
          const exists = images.some(img => Math.abs(img.rect.x - rect.x) < 5 && Math.abs(img.rect.y - rect.y) < 5);
          if (!exists && rect.width > 10 && rect.height > 10) {
            images.push({ src: m[1], rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }, alt: '', objectFit: cs.backgroundSize || 'cover' });
          }
        }
      }

      const bgColor = getComputedStyle(slide).backgroundColor;
      return { index, bgColor, texts, images };
    }, { index: slideIndex, textSelector: TEXT_SELECTOR });

    if (slideData) slides.push(slideData);
  }
  return slides;
}

// ─── Shared: normalize + download images ───────────────────────────
async function normalizeSlideData(page, rawSlides) {
  const data = {
    version: 1,
    slideWidth: SLIDE_W,
    slideHeight: SLIDE_H,
    slides: rawSlides.map(s => ({
      index: s.index,
      bgColor: toHexColor(s.bgColor, 'F7F4EF'),
      texts: s.texts.map(t => ({
        text: t.text, rect: t.rect,
        style: {
          fontFamily: mapFont(t.style.fontFamily), fontSize: t.style.fontSize,
          fontWeight: t.style.fontWeight, color: toHexColor(t.style.color, '1A1814'),
          textAlign: mapAlign(t.style.textAlign), lineHeight: t.style.lineHeight,
          letterSpacing: t.style.letterSpacing,
        },
        isItalic: t.isItalic,
      })),
      images: s.images.map(img => ({ src: img.src, rect: img.rect, objectFit: img.objectFit })),
    })),
  };

  // Download images as base64
  const allUrls = new Set();
  for (const slide of data.slides) {
    for (const img of slide.images) allUrls.add(img.src);
  }
  const uniqueUrls = [...allUrls];
  if (uniqueUrls.length > 0) {
    console.log(`  ${uniqueUrls.length} unique images found`);
    console.log('  Downloading images...');
    const imageMap = {};
    for (const url of uniqueUrls) {
      const b64 = await downloadImageAsBase64(page, url);
      if (b64) imageMap[url] = b64;
    }
    console.log(`  ${Object.keys(imageMap).length} images downloaded`);
    for (const slide of data.slides) {
      for (const img of slide.images) {
        if (imageMap[img.src]) img.data = imageMap[img.src];
      }
    }
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════
// MODE: Clipboard — Local fig-kiwi clipboard encoding (EXPERIMENTAL)
// ═══════════════════════════════════════════════════════════════════
async function modeClipboard({ page, absPath, outputDir, baseName }) {
  console.log('\n[1/4] Rendering deck with Playwright...');
  const rawSlides = await extractSlidesLocal(page);
  console.log(`  ${rawSlides.length} slides, ${rawSlides.reduce((s, sd) => s + sd.texts.length, 0)} text elements`);

  console.log('[2/4] Normalizing & downloading images...');
  const data = await normalizeSlideData(page, rawSlides);

  console.log('[3/4] Encoding to Figma clipboard format...');
  const { html, size } = encodeSlidesToClipboard(data.slides, {
    slideW: SLIDE_W,
    slideH: SLIDE_H,
  });
  console.log(`  ✅ Clipboard data encoded (${(size / 1024).toFixed(0)} KB)`);

  // Write raw clipboard HTML to disk (backup)
  const clipPath = join(outputDir, `${baseName}.figma-clipboard.html`);
  writeFileSync(clipPath, html, 'utf-8');

  console.log('[4/4] Writing to system clipboard...');
  const clipboardOk = writeSystemClipboard(html, outputDir, baseName);
  if (clipboardOk) {
    console.log(`  ✅ Copied to system clipboard`);
  }

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  ✅ Export complete — ${data.slides.length} slides           ║`);
  console.log(`║                                                ║`);
  console.log(`║  Works in BOTH:                                 ║`);
  console.log(`║  • Figma Design — ${'Cmd+V'.padEnd(38)}║`);
  console.log(`║  • Figma Slides — ${'Cmd+V'.padEnd(38)}║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
}

// ═══════════════════════════════════════════════════════════════════
// MODE: Local — Built-in Figma plugin
// ═══════════════════════════════════════════════════════════════════
async function modeLocal({ page, absPath, outputDir, baseName }) {
  console.log('\n[1/3] Rendering deck with Playwright...');
  const rawSlides = await extractSlidesLocal(page);
  console.log(`  ${rawSlides.length} slides, ${rawSlides.reduce((s, sd) => s + sd.texts.length, 0)} text elements`);

  const data = await normalizeSlideData(page, rawSlides);
  console.log(`  ${data.slides.length} slides, ${data.slides.reduce((s, sd) => s + sd.texts.length, 0)} text elements, ${data.slides.reduce((s, sd) => s + (sd.images || []).length, 0)} images`);

  // Write files
  console.log('[3/3] Writing files...');
  const jsonPath = join(outputDir, `${baseName}.figma.json`);
  writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✅ JSON: ${jsonPath} (${(Buffer.byteLength(JSON.stringify(data), 'utf-8') / 1024).toFixed(0)} KB)`);

  // Copy plugin files
  const pluginDir = join(outputDir, 'figma-plugin');
  mkdirSync(pluginDir, { recursive: true });

  const skillPluginDir = join(dirname(import.meta.url.replace('file://', '')), 'figma-plugin');
  for (const file of ['manifest.json', 'code.js', 'ui.html']) {
    const src = join(skillPluginDir, file);
    if (existsSync(src)) {
      cpSync(src, join(pluginDir, file));
    }
  }
  console.log(`  ✅ Plugin: ${pluginDir}/`);

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  ✅ Export complete — ${data.slides.length} slides               ║`);
  console.log(`║                                                ║`);
  console.log(`║  Design: Plugins → Folio Importer               ║`);
  console.log(`║  Slides: Plugins → Folio Importer (auto-detect)  ║`);
  console.log(`║  JSON: ${baseName}.figma.json                        ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
}

// ═══════════════════════════════════════════════════════════════════
// Main — mode selection + orchestration
// ═══════════════════════════════════════════════════════════════════
async function main() {
  // Parse args
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  let mode = 'auto';
  let htmlPath = null;
  const filteredArgs = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && i + 1 < args.length) {
      mode = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      // skip, handled later
      i++;
    } else {
      filteredArgs.push(args[i]);
    }
  }

  htmlPath = filteredArgs[0];

  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node scripts/export-figma.mjs [--mode auto|c2d|clipboard|local] <path/to/index.html>');
    console.error('       node scripts/export-figma.mjs --help');
    process.exit(1);
  }

  const absPath = resolve(htmlPath);
  const outputDir = dirname(absPath);
  const baseName = basename(absPath, '.html');
  const hasApiKey = !!process.env.C2D_API_KEY;

  // Mode resolution
  let effectiveMode = mode;
  if (mode === 'auto') {
    effectiveMode = hasApiKey ? 'c2d' : 'local';
  }

  if (effectiveMode === 'c2d' && !hasApiKey) {
    // Interactive setup: guide user to get an API key
    console.log(`
╔══════════════════════════════════════════════════════╗
║  🔑  Code.to.Design 需要 API Key                     ║
╚══════════════════════════════════════════════════════╝

Folio 支持多种 Figma 导出方式：

  [1] Code.to.Design（推荐）
      — 高 fidelity，文字完全可编辑
      — 需要 API Key（免费：10 credits）
      → 打开 https://api.to.design 注册获取

  [2] 本地模式（免费，内置 Figma 插件）
      — 不需要 API Key，不需要联网
      — fidelity 一般，文字可能需要手动调整

（当前选择了 --mode c2d 但没有配置 C2D_API_KEY）
`);
    const answer = await askQuestion('请选择 [1/2] (默认 2): ');
    if (answer === '1') {
      console.log('\n正在打开 https://code.to.design ...\n');
      try {
        execSync('open https://code.to.design');
      } catch { /* ignore */ }
      console.log('获取 API Key 后，设置环境变量:\n');
      console.log('  export C2D_API_KEY="你的key"');
      console.log('  然后重新运行本命令\n');
      process.exit(0);
    }
    effectiveMode = 'local';
  }

  const modeMap = {
    c2d: '☁️  Code.to.Design',
    clipboard: '📋  Local Clipboard (EXPERIMENTAL)',
    local: '🖥️  Local Plugin',
  };
  const modeLabel = modeMap[effectiveMode] || effectiveMode;
  console.log(`Folio → Figma  |  mode: ${modeLabel}`);

  // Launch browser (shared by all modes)
  const { browser, page } = await createBrowserPage(absPath);

  let success = false;
  if (effectiveMode === 'c2d') {
    success = await modeC2D({ page, absPath, outputDir, baseName });
    if (!success) {
      console.log('C2D failed. Using local plugin mode as fallback...\n');
      await modeLocal({ page, absPath, outputDir, baseName });
    }
  } else if (effectiveMode === 'clipboard') {
    await modeClipboard({ page, absPath, outputDir, baseName });
  } else {
    await modeLocal({ page, absPath, outputDir, baseName });
  }

  await browser.close();
}

main().catch((err) => { console.error('Export failed:', err); process.exit(1); });

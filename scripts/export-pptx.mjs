#!/usr/bin/env node
/**
 * Folio — HTML Magazine PPT → PPTX Export (Screenshot-based)
 *
 * Each HTML slide is rendered as a full-resolution PNG via Playwright,
 * then placed as a full-bleed image in a PPTX. 100% layout fidelity.
 *
 * Usage:
 *   node scripts/export-pptx.mjs path/to/index.html
 *
 * Dependencies:
 *   npm install playwright pptxgenjs
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';

const SLIDE_W = 1280;
const SLIDE_H = 720;
const SCALE = 2; // 2× for retina-quality screenshots (2560×1440)

function pxToInches(px) {
  return px / 96;
}

async function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node scripts/export-pptx.mjs <path/to/index.html>');
    process.exit(1);
  }

  const absPath = resolve(htmlPath);
  const fileUrl = `file://${absPath}`;
  const tmpDir = mkdtempSync(resolve(tmpdir(), 'folio-export-'));

  console.log(`[1/3] Launching browser...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: SLIDE_W * SCALE, height: SLIDE_H * SCALE },
    deviceScaleFactor: SCALE,
  });

  console.log(`[2/3] Loading slides...`);
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.slide', { timeout: 10000 });

  // Get the total number of slides
  const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`  Found ${slideCount} slides`);

  // Find the slide container and set its width
  const deckBox = await page.evaluate(() => {
    const deck = document.getElementById('deck');
    const rect = deck.getBoundingClientRect();
    return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
  });

  // Screenshot each slide individually
  const screenshotPaths = [];
  for (let i = 0; i < slideCount; i++) {
    // Navigate to the slide
    await page.evaluate((idx) => {
      const deck = document.getElementById('deck');
      if (deck) deck.style.transform = `translateX(-${idx * 100}%)`;
      // Manually activate the slide for animations
      document.querySelectorAll('.slide').forEach((s, j) => {
        s.classList.toggle('active', j === idx);
      });
    }, i);

    // Wait for animations to settle
    await page.waitForTimeout(400);

    // Screenshot just the viewport (which is exactly one slide)
    const ssPath = resolve(tmpDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: ssPath, clip: { x: 0, y: 0, width: SLIDE_W * SCALE, height: SLIDE_H * SCALE } });
    screenshotPaths.push(ssPath);
    console.log(`  Slide ${i + 1}/${slideCount} screenshot captured`);
  }

  console.log(`[3/3] Generating PPTX...`);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CUSTOM_16x9', width: pxToInches(SLIDE_W), height: pxToInches(SLIDE_H) });
  pptx.layout = 'CUSTOM_16x9';

  for (let i = 0; i < screenshotPaths.length; i++) {
    const slide = pptx.addSlide();
    slide.addImage({
      path: screenshotPaths[i],
      x: 0, y: 0,
      w: pxToInches(SLIDE_W),
      h: pxToInches(SLIDE_H),
      sizing: { type: 'cover', w: pxToInches(SLIDE_W), h: pxToInches(SLIDE_H) },
    });
  }

  const outputPath = absPath.replace(/\.html?$/, '.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`  ✅ PPTX saved to: ${outputPath} (${screenshotPaths.length} slides)`);

  // Cleanup
  rmSync(tmpDir, { recursive: true, force: true });
  await browser.close();
  console.log(`Done.`);
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});

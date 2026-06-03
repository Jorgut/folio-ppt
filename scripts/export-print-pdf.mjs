#!/usr/bin/env node
/**
 * Folio — HTML Magazine → Print-Ready PDF Export
 *
 * Renders each slide individually with Playwright, then assembles a
 * print-oriented PDF with trim, bleed, and vector crop marks using pdf-lib.
 *
 * Usage:
 *   node scripts/export-print-pdf.mjs path/to/index.html
 *
 * Dependencies:
 *   npm install playwright pdf-lib
 *   npx playwright install chromium
 */

import { existsSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { chromium } from 'playwright';
import { PDFDocument, PDFName, grayscale } from 'pdf-lib';

const SLIDE_W = 1280;
const SLIDE_H = 720;
const PX_TO_PT = 72 / 96;
const MM_TO_PT = 72 / 25.4;

const BLEED_MM = 3;
const BLEED_PT = BLEED_MM * MM_TO_PT;
const SLUG_PT = BLEED_PT;
const CROP_MARK_LENGTH_PT = BLEED_PT;
const CROP_MARK_THICKNESS_PT = 0.5;

const TRIM_W_PT = SLIDE_W * PX_TO_PT;
const TRIM_H_PT = SLIDE_H * PX_TO_PT;
const BLEED_W_PT = TRIM_W_PT + (BLEED_PT * 2);
const BLEED_H_PT = TRIM_H_PT + (BLEED_PT * 2);
const PAGE_W_PT = TRIM_W_PT + 2 * (BLEED_PT + SLUG_PT);
const PAGE_H_PT = TRIM_H_PT + 2 * (BLEED_PT + SLUG_PT);

const TRIM_X_PT = SLUG_PT + BLEED_PT;
const TRIM_Y_PT = SLUG_PT + BLEED_PT;
const BLEED_X_PT = SLUG_PT;
const BLEED_Y_PT = SLUG_PT;

async function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node scripts/export-print-pdf.mjs <path/to/index.html>');
    process.exit(1);
  }

  const absPath = resolve(htmlPath);
  const fileUrl = `file://${absPath}`;
  const outputPath = absPath.replace(/\.html?$/i, '.print.pdf');

  console.log('[1/4] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: SLIDE_W, height: SLIDE_H },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('[2/4] Loading deck...');
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.slide', { timeout: 10000 });
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });

  const slideCount = await page.evaluate(() => {
    const deck = document.getElementById('deck');
    const slides = [...document.querySelectorAll('.slide')];

    if (!deck || slides.length === 0) {
      throw new Error('Deck or slides not found');
    }

    deck.style.transition = 'none';
    deck.style.transform = 'translateX(0)';
    deck.style.willChange = 'auto';

    for (const slide of slides) {
      slide.classList.add('active');
      slide.style.opacity = '1';
      slide.style.transform = 'none';
      for (const animatedEl of slide.querySelectorAll('[data-anim]')) {
        animatedEl.style.opacity = '1';
        animatedEl.style.transform = 'none';
      }
    }

    const nav = document.getElementById('nav');
    if (nav) nav.style.display = 'none';

    const progress = document.getElementById('progress');
    if (progress) progress.style.display = 'none';

    const overview = document.getElementById('overview');
    if (overview) overview.style.display = 'none';

    const shortcuts = document.getElementById('shortcuts');
    if (shortcuts) shortcuts.style.display = 'none';

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return slides.length;
  });
  console.log(`  Found ${slideCount} slides`);

  console.log('[3/4] Rendering slides and assembling print PDF...');
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${basename(absPath, extname(absPath))} (print-ready)`);
  pdfDoc.setProducer('Folio export-print-pdf.mjs');
  pdfDoc.setCreator('pdf-lib + Playwright');

  for (let index = 0; index < slideCount; index += 1) {
    console.log(`  Rendering slide ${index + 1}/${slideCount}...`);
    await page.evaluate(({ slideIndex, slideWidth }) => {
      const deck = document.getElementById('deck');
      if (!deck) {
        throw new Error('Deck not found');
      }

      deck.style.transform = `translateX(-${slideIndex * slideWidth}px)`;
      window.scrollTo(0, 0);
    }, { slideIndex: index, slideWidth: SLIDE_W });

    await page.waitForTimeout(50);

    const imageBytes = await page.screenshot({
      type: 'png',
      fullPage: false,
      animations: 'disabled',
    });

    const image = await pdfDoc.embedPng(imageBytes);
    const pdfPage = pdfDoc.addPage([PAGE_W_PT, PAGE_H_PT]);

    setPageBox(pdfDoc, pdfPage, 'MediaBox', 0, 0, PAGE_W_PT, PAGE_H_PT);
    setPageBox(pdfDoc, pdfPage, 'CropBox', 0, 0, PAGE_W_PT, PAGE_H_PT);
    setPageBox(pdfDoc, pdfPage, 'BleedBox', BLEED_X_PT, BLEED_Y_PT, BLEED_W_PT, BLEED_H_PT);
    setPageBox(pdfDoc, pdfPage, 'TrimBox', TRIM_X_PT, TRIM_Y_PT, TRIM_W_PT, TRIM_H_PT);
    setPageBox(pdfDoc, pdfPage, 'ArtBox', TRIM_X_PT, TRIM_Y_PT, TRIM_W_PT, TRIM_H_PT);

    pdfPage.drawImage(image, {
      x: BLEED_X_PT,
      y: BLEED_Y_PT,
      width: BLEED_W_PT,
      height: BLEED_H_PT,
    });

    pdfPage.drawImage(image, {
      x: TRIM_X_PT,
      y: TRIM_Y_PT,
      width: TRIM_W_PT,
      height: TRIM_H_PT,
    });

    drawCropMarks(pdfPage);
  }

  console.log('[4/4] Saving PDF...');
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  writeFileSync(outputPath, pdfBytes);

  await browser.close();

  console.log(`  ✅ Print PDF saved to: ${outputPath} (${slideCount} pages)`);
  console.log('  Note: trim/bleed boxes and vector crop marks are included; CMYK/PDF/X-1a conversion remains a downstream prepress step.');
}

function setPageBox(pdfDoc, page, boxName, x, y, width, height) {
  page.node.set(
    PDFName.of(boxName),
    pdfDoc.context.obj([x, y, x + width, y + height]),
  );
}

function drawCropMarks(page) {
  const color = grayscale(0);
  const left = TRIM_X_PT;
  const right = TRIM_X_PT + TRIM_W_PT;
  const bottom = TRIM_Y_PT;
  const top = TRIM_Y_PT + TRIM_H_PT;

  const outerLeft = BLEED_X_PT;
  const outerRight = BLEED_X_PT + BLEED_W_PT;
  const outerBottom = BLEED_Y_PT;
  const outerTop = BLEED_Y_PT + BLEED_H_PT;

  const lines = [
    [{ x: outerLeft - CROP_MARK_LENGTH_PT, y: top }, { x: outerLeft, y: top }],
    [{ x: outerLeft - CROP_MARK_LENGTH_PT, y: bottom }, { x: outerLeft, y: bottom }],
    [{ x: outerRight, y: top }, { x: outerRight + CROP_MARK_LENGTH_PT, y: top }],
    [{ x: outerRight, y: bottom }, { x: outerRight + CROP_MARK_LENGTH_PT, y: bottom }],
    [{ x: left, y: outerTop }, { x: left, y: outerTop + CROP_MARK_LENGTH_PT }],
    [{ x: right, y: outerTop }, { x: right, y: outerTop + CROP_MARK_LENGTH_PT }],
    [{ x: left, y: outerBottom - CROP_MARK_LENGTH_PT }, { x: left, y: outerBottom }],
    [{ x: right, y: outerBottom - CROP_MARK_LENGTH_PT }, { x: right, y: outerBottom }],
  ];

  for (const [start, end] of lines) {
    page.drawLine({
      start,
      end,
      thickness: CROP_MARK_THICKNESS_PT,
      color,
    });
  }
}

main().catch(err => {
  console.error('Print export failed:', err);
  process.exit(1);
});

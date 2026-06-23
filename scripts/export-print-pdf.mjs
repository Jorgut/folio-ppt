#!/usr/bin/env node

import { chromium } from 'playwright';
import { PDFDocument, cmyk } from 'pdf-lib';
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

const SLIDE_W_PX = 1280;
const SLIDE_H_PX = 720;
const PX_PER_IN = 96;
const PT_PER_IN = 72;
const MM_PER_IN = 25.4;
const BLEED_MM = 3;
const CROP_MM = 5;
const BLEED_PX = (BLEED_MM / MM_PER_IN) * PX_PER_IN;
const BLEED_IN = BLEED_MM / MM_PER_IN;
const BLEED_PT = BLEED_IN * PT_PER_IN;
const CROP_PT = (CROP_MM / MM_PER_IN) * PT_PER_IN;
const TRIM_W_IN = SLIDE_W_PX / PX_PER_IN;
const TRIM_H_IN = SLIDE_H_PX / PX_PER_IN;
const TRIM_W_PT = TRIM_W_IN * PT_PER_IN;
const TRIM_H_PT = TRIM_H_IN * PT_PER_IN;
const BLEED_W_IN = TRIM_W_IN + (BLEED_IN * 2);
const BLEED_H_IN = TRIM_H_IN + (BLEED_IN * 2);
const BLEED_W_PT = TRIM_W_PT + (BLEED_PT * 2);
const BLEED_H_PT = TRIM_H_PT + (BLEED_PT * 2);
const MEDIA_W_PT = BLEED_W_PT + (CROP_PT * 2);
const MEDIA_H_PT = BLEED_H_PT + (CROP_PT * 2);
const FULL_W_PX = SLIDE_W_PX + (BLEED_PX * 2);
const FULL_H_PX = SLIDE_H_PX + (BLEED_PX * 2);
const LINE_WIDTH_PT = 0.5;
const IMAGE_SCALE = 1.04;

function toFileUrl(filePath) {
  return pathToFileURL(filePath).href;
}

function toPrintOutputPath(filePath) {
  return filePath.replace(/\.html?$/i, '.print.pdf');
}

function formatInches(value) {
  return `${value.toFixed(4)}in`;
}

function createExportStyles() {
  return `
    @page {
      size: ${formatInches(BLEED_W_IN)} ${formatInches(BLEED_H_IN)};
      margin: 0;
    }

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    #print-export-root {
      display: block !important;
      width: ${FULL_W_PX}px !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .print-page {
      position: relative !important;
      width: ${FULL_W_PX}px !important;
      height: ${FULL_H_PX}px !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: #ffffff !important;
      break-after: page !important;
      page-break-after: always !important;
    }

    .print-page:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }

    .print-slide {
      position: absolute !important;
      left: ${BLEED_PX}px !important;
      top: ${BLEED_PX}px !important;
      width: ${SLIDE_W_PX}px !important;
      height: ${SLIDE_H_PX}px !important;
      min-width: ${SLIDE_W_PX}px !important;
      max-width: ${SLIDE_W_PX}px !important;
      min-height: ${SLIDE_H_PX}px !important;
      max-height: ${SLIDE_H_PX}px !important;
      margin: 0 !important;
      flex: none !important;
      opacity: 1 !important;
      transform: none !important;
      overflow: visible !important;
    }

    .print-slide,
    .print-slide * {
      animation: none !important;
      transition: none !important;
    }

    .print-slide [data-anim] {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }

    .print-slide .full-bleed {
      width: calc(100% + ${BLEED_PX * 2}px) !important;
      height: calc(100% + ${BLEED_PX * 2}px) !important;
      margin-left: -${BLEED_PX}px !important;
      margin-right: -${BLEED_PX}px !important;
      margin-top: -${BLEED_PX}px !important;
      margin-bottom: -${BLEED_PX}px !important;
      max-width: none !important;
      max-height: none !important;
      overflow: hidden !important;
    }

    .print-slide .full-bleed img,
    .print-slide .img-full img,
    .print-slide .img-backdrop img,
    .print-slide .spread-image img,
    .print-slide .img img {
      transform: scale(${IMAGE_SCALE}) !important;
      transform-origin: center center !important;
      image-rendering: auto !important;
    }
  `;
}

async function preparePrintableDeck(page) {
  await page.addStyleTag({ content: createExportStyles() });
  await page.evaluate(({ bleedPx, slideWidth, slideHeight }) => {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const exportRoot = document.createElement('div');

    exportRoot.id = 'print-export-root';

    for (const slide of slides) {
      const wrapper = document.createElement('section');
      wrapper.className = 'print-page';
      slide.classList.add('print-slide', 'active');
      slide.style.width = `${slideWidth}px`;
      slide.style.height = `${slideHeight}px`;
      slide.style.left = `${bleedPx}px`;
      slide.style.top = `${bleedPx}px`;
      wrapper.appendChild(slide);
      exportRoot.appendChild(wrapper);
    }

    document.body.replaceChildren(exportRoot);
    document.documentElement.style.overflow = 'visible';
    document.body.style.overflow = 'visible';
  }, {
    bleedPx: BLEED_PX,
    slideWidth: SLIDE_W_PX,
    slideHeight: SLIDE_H_PX,
  });
}

function drawCropMarks(page) {
  const leftTrim = CROP_PT + BLEED_PT;
  const rightTrim = leftTrim + TRIM_W_PT;
  const bottomTrim = CROP_PT + BLEED_PT;
  const topTrim = bottomTrim + TRIM_H_PT;
  const markColor = cmyk(0, 0, 0, 1);

  const lines = [
    { start: { x: leftTrim - CROP_PT, y: topTrim }, end: { x: leftTrim, y: topTrim } },
    { start: { x: leftTrim, y: topTrim }, end: { x: leftTrim, y: topTrim + CROP_PT } },
    { start: { x: rightTrim, y: topTrim }, end: { x: rightTrim + CROP_PT, y: topTrim } },
    { start: { x: rightTrim, y: topTrim }, end: { x: rightTrim, y: topTrim + CROP_PT } },
    { start: { x: leftTrim - CROP_PT, y: bottomTrim }, end: { x: leftTrim, y: bottomTrim } },
    { start: { x: leftTrim, y: bottomTrim - CROP_PT }, end: { x: leftTrim, y: bottomTrim } },
    { start: { x: rightTrim, y: bottomTrim }, end: { x: rightTrim + CROP_PT, y: bottomTrim } },
    { start: { x: rightTrim, y: bottomTrim - CROP_PT }, end: { x: rightTrim, y: bottomTrim } },
  ];

  for (const line of lines) {
    page.drawLine({
      start: line.start,
      end: line.end,
      thickness: LINE_WIDTH_PT,
      color: markColor,
    });
  }
}

async function buildFinalPdf(tempPdfPath, outputPath) {
  const sourceBytes = readFileSync(tempPdfPath);
  const sourceDoc = await PDFDocument.load(sourceBytes);
  const finalDoc = await PDFDocument.create();
  const sourcePages = sourceDoc.getPages();
  const embeddedPages = await finalDoc.embedPages(sourcePages);

  for (const embeddedPage of embeddedPages) {
    const page = finalDoc.addPage([MEDIA_W_PT, MEDIA_H_PT]);

    page.drawPage(embeddedPage, {
      x: CROP_PT,
      y: CROP_PT,
      width: BLEED_W_PT,
      height: BLEED_H_PT,
    });

    page.setMediaBox(0, 0, MEDIA_W_PT, MEDIA_H_PT);
    page.setBleedBox(CROP_PT, CROP_PT, BLEED_W_PT, BLEED_H_PT);
    page.setTrimBox(CROP_PT + BLEED_PT, CROP_PT + BLEED_PT, TRIM_W_PT, TRIM_H_PT);
    drawCropMarks(page);
  }

  const finalBytes = await finalDoc.save();
  writeFileSync(outputPath, finalBytes);
}

async function renderBleedPdf(fileUrl, tempPdfPath) {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: SLIDE_W_PX, height: SLIDE_H_PX },
    });

    await page.emulateMedia({ media: 'screen' });
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('.slide', { timeout: 10000 });
    await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
    await preparePrintableDeck(page);
    await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());

    const slideCount = await page.evaluate(() => document.querySelectorAll('.print-page').length);

    await page.pdf({
      path: tempPdfPath,
      width: formatInches(BLEED_W_IN),
      height: formatInches(BLEED_H_IN),
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
      scale: 1,
    });

    return slideCount;
  } finally {
    await browser.close();
  }
}

async function main() {
  const htmlPath = process.argv[2];

  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node scripts/export-print-pdf.mjs <path/to/index.html>');
    process.exit(1);
  }

  const absPath = resolve(htmlPath);
  const fileUrl = toFileUrl(absPath);
  const outputPath = toPrintOutputPath(absPath);
  const tempDir = mkdtempSync(join(tmpdir(), 'folio-print-pdf-'));
  const tempPdfPath = join(tempDir, 'bleed.pdf');

  console.log('[1/4] Rendering bleed PDF...');
  const slideCount = await renderBleedPdf(fileUrl, tempPdfPath);
  console.log(`  Found ${slideCount} slides`);

  console.log('[2/4] Building print PDF...');
  await buildFinalPdf(tempPdfPath, outputPath);

  console.log('[3/4] Cleaning up...');
  if (existsSync(tempPdfPath)) {
    unlinkSync(tempPdfPath);
  }
  rmSync(tempDir, { recursive: true, force: true });

  console.log('[4/4] Done');
  console.log(`  PDF saved to: ${outputPath} (${slideCount} pages)`);
  console.log(`  TrimBox: ${TRIM_W_PT}pt × ${TRIM_H_PT}pt`);
  console.log(`  BleedBox: ${BLEED_W_PT.toFixed(3)}pt × ${BLEED_H_PT.toFixed(3)}pt`);
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});

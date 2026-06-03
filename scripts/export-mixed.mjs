#!/usr/bin/env node
/**
 * Folio — HTML Magazine PPT → Mixed PPTX Export
 *
 * Renders each HTML slide twice:
 * 1) Capture live DOM text metrics from Playwright for editable PPT text boxes
 * 2) Hide text in the browser and screenshot the visual background layer
 *
 * Usage:
 *   node scripts/export-mixed.mjs path/to/index.html
 *
 * Dependencies:
 *   npm install playwright pptxgenjs
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';

const SLIDE_W = 1280;
const SLIDE_H = 720;
const SCALE = 2;

const TEXT_SELECTORS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'blockquote',
  '.lead',
  '.hero',
  '.block-quote',
  '.stat-nb',
  '.stat-label',
  '.meta',
  '.closing-quote',
  '.caption',
  '.body',
  '.pull-quote',
  '.subtitle',
  '.img-cap',
].join(', ');

const EXPORT_STYLE = `
  #nav,
  #progress,
  #overview,
  #shortcuts {
    display: none !important;
  }

  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }

  [data-export-mixed-text="true"] {
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    text-shadow: none !important;
  }

  [data-export-mixed-text="true"]::before,
  [data-export-mixed-text="true"]::after,
  [data-export-mixed-text="true"]::first-letter {
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    text-shadow: none !important;
  }
`;

function pxToInches(px) {
  return px / 96;
}

function pxToPoints(px) {
  return px * 0.75;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rgbaToHex(color) {
  const toHex = (channel) => clampNumber(Math.round(channel), 0, 255).toString(16).padStart(2, '0');
  return `${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
}

function containsCjk(text) {
  return /[\u3400-\u9FFF\uF900-\uFAFF]/u.test(text);
}

function parseFontFamilies(fontFamily) {
  return fontFamily
    .split(',')
    .map((family) => family.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function resolveFontFace(fontFamily, text) {
  const families = parseFontFamilies(fontFamily);
  const hasCjk = containsCjk(text);
  const preferred = ['Playfair Display', 'Noto Serif SC', 'Inter', 'JetBrains Mono'];
  const matched = preferred.find((font) => families.some((family) => family.includes(font)));

  if (hasCjk) {
    if (families.some((family) => family.includes('JetBrains Mono'))) {
      return 'JetBrains Mono';
    }
    if (families.some((family) => family.includes('Inter'))) {
      return 'Inter';
    }
    if (families.some((family) => family.includes('Playfair Display')) || families.some((family) => family.includes('Noto Serif SC'))) {
      return 'Noto Serif SC';
    }
    return 'Noto Serif SC';
  }

  return matched ?? families[0] ?? 'Arial';
}

async function waitForAssets(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;

    const imagePromises = Array.from(document.images, (img) => {
      if (img.complete) {
        return img.decode().catch(() => {});
      }

      return new Promise((resolveImage) => {
        const done = () => resolveImage();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    });

    await Promise.all(imagePromises);
  });
}

async function activateSlide(page, index) {
  await page.evaluate((idx) => {
    const deck = document.getElementById('deck');
    const slides = Array.from(document.querySelectorAll('.slide'));

    if (deck) {
      deck.style.transform = `translateX(-${idx * 100}%)`;
    }

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === idx);
      slide.scrollTop = 0;
    });

    window.scrollTo(0, 0);
  }, index);
}

async function extractSlideData(page, index) {
  return page.evaluate(({ idx, selectorList }) => {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const slide = slides[idx];

    if (!slide) {
      throw new Error(`Slide ${idx + 1} not found`);
    }

    const parseColor = (value) => {
      if (!value || value === 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0 };
      }

      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) {
        return { r: 0, g: 0, b: 0, a: 1 };
      }

      const [r, g, b, a] = match[1].split(',').map((part) => part.trim());
      return {
        r: Number.parseFloat(r),
        g: Number.parseFloat(g),
        b: Number.parseFloat(b),
        a: a === undefined ? 1 : Number.parseFloat(a),
      };
    };

    const composite = (foreground, background) => {
      const alpha = Number.isFinite(foreground.a) ? foreground.a : 1;
      const bgAlpha = Number.isFinite(background.a) ? background.a : 1;
      const outAlpha = alpha + bgAlpha * (1 - alpha);

      if (outAlpha <= 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
      }

      return {
        r: (foreground.r * alpha + background.r * bgAlpha * (1 - alpha)) / outAlpha,
        g: (foreground.g * alpha + background.g * bgAlpha * (1 - alpha)) / outAlpha,
        b: (foreground.b * alpha + background.b * bgAlpha * (1 - alpha)) / outAlpha,
        a: outAlpha,
      };
    };

    const resolveBackgroundColor = (element) => {
      let current = element.parentElement;
      while (current) {
        const bg = parseColor(getComputedStyle(current).backgroundColor);
        if (bg.a > 0) {
          return bg;
        }
        current = current.parentElement;
      }

      const slideBg = parseColor(getComputedStyle(slide).backgroundColor);
      if (slideBg.a > 0) {
        return slideBg;
      }

      const bodyBg = parseColor(getComputedStyle(document.body).backgroundColor);
      if (bodyBg.a > 0) {
        return bodyBg;
      }

      return { r: 255, g: 255, b: 255, a: 1 };
    };

    const applyTextTransform = (text, transform) => {
      if (transform === 'uppercase') {
        return text.toUpperCase();
      }
      if (transform === 'lowercase') {
        return text.toLowerCase();
      }
      if (transform === 'capitalize') {
        return text.replace(/(^|\s)(\S)/g, (match, leading, char) => `${leading}${char.toUpperCase()}`);
      }
      return text;
    };

    document.querySelectorAll('[data-export-mixed-text]').forEach((element) => {
      element.removeAttribute('data-export-mixed-text');
    });

    const slideRect = slide.getBoundingClientRect();
    const seen = new Set();
    const elements = [];

    for (const element of slide.querySelectorAll(selectorList)) {
      if (seen.has(element)) {
        continue;
      }
      seen.add(element);
      elements.push(element);
    }

    const texts = elements
      .map((element, elementIndex) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const rawText = element.innerText ?? element.textContent ?? '';
        const text = applyTextTransform(rawText, style.textTransform)
          .replace(/\u00A0/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        if (!text) {
          return null;
        }

        if (style.display === 'none' || style.visibility === 'hidden' || Number.parseFloat(style.opacity) === 0) {
          return null;
        }

        if (rect.width < 2 || rect.height < 2) {
          return null;
        }

        const lineHeightPx = Number.parseFloat(style.lineHeight);
        const foreground = parseColor(style.color);
        const background = resolveBackgroundColor(element);
        const effectiveColor = foreground.a < 1 ? composite(foreground, background) : foreground;

        element.setAttribute('data-export-mixed-text', 'true');
        element.setAttribute('data-export-mixed-text-id', String(elementIndex));

        return {
          id: elementIndex,
          tagName: element.tagName.toLowerCase(),
          className: element.className,
          text,
          x: rect.left - slideRect.left,
          y: rect.top - slideRect.top,
          width: rect.width,
          height: rect.height,
          fontFamily: style.fontFamily,
          fontSizePx: Number.parseFloat(style.fontSize),
          fontWeight: style.fontWeight,
          fontStyle: style.fontStyle,
          lineHeightPx: Number.isFinite(lineHeightPx) ? lineHeightPx : Number.parseFloat(style.fontSize) * 1.2,
          letterSpacingPx: Number.parseFloat(style.letterSpacing) || 0,
          textAlign: style.textAlign,
          color: effectiveColor,
        };
      })
      .filter(Boolean);

    return {
      slideRect: {
        x: slideRect.left,
        y: slideRect.top,
        width: slideRect.width,
        height: slideRect.height,
      },
      texts,
    };
  }, { idx: index, selectorList: TEXT_SELECTORS });
}

async function clearTextHideMarkers(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-export-mixed-text]').forEach((element) => {
      element.removeAttribute('data-export-mixed-text');
      element.removeAttribute('data-export-mixed-text-id');
    });
  });
}

function addTextBoxes(slide, texts) {
  for (const textItem of texts) {
    const fontWeightValue = Number.parseInt(textItem.fontWeight, 10);
    const isBold = Number.isFinite(fontWeightValue)
      ? fontWeightValue >= 600
      : String(textItem.fontWeight).toLowerCase().includes('bold');

    slide.addText(textItem.text, {
      x: pxToInches(textItem.x),
      y: pxToInches(textItem.y),
      w: pxToInches(textItem.width),
      h: pxToInches(textItem.height),
      fontFace: resolveFontFace(textItem.fontFamily, textItem.text),
      fontSize: pxToPoints(textItem.fontSizePx),
      color: rgbaToHex(textItem.color),
      bold: isBold,
      italic: textItem.fontStyle.includes('italic'),
      breakLine: false,
      margin: 0,
      valign: 'top',
      align: ['center', 'right', 'justify'].includes(textItem.textAlign) ? textItem.textAlign : 'left',
      paraSpaceAfterPt: 0,
      fit: 'resize',
    });
  }
}

async function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath || !existsSync(htmlPath)) {
    console.error('Usage: node scripts/export-mixed.mjs <path/to/index.html>');
    process.exit(1);
  }

  const absPath = resolve(htmlPath);
  const fileUrl = `file://${absPath}`;
  const tmpDir = mkdtempSync(resolve(tmpdir(), 'folio-export-mixed-'));
  const outputPath = absPath.replace(/\.html?$/i, '.mixed.pptx');

  console.log('[1/3] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: SLIDE_W, height: SLIDE_H },
    deviceScaleFactor: SCALE,
  });

  try {
    console.log('[2/3] Loading slides and extracting DOM text...');
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('.slide', { timeout: 10000 });
    await page.addStyleTag({ content: EXPORT_STYLE });
    await waitForAssets(page);

    const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
    console.log(`  Found ${slideCount} slides`);

    const pptx = new PptxGenJS();
    pptx.defineLayout({
      name: 'CUSTOM_16x9',
      width: pxToInches(SLIDE_W),
      height: pxToInches(SLIDE_H),
    });
    pptx.layout = 'CUSTOM_16x9';

    for (let index = 0; index < slideCount; index += 1) {
      await activateSlide(page, index);
      await page.waitForTimeout(150);

      const slideData = await extractSlideData(page, index);
      const screenshotPath = resolve(tmpDir, `slide-${String(index + 1).padStart(2, '0')}.png`);

      await page.screenshot({
        path: screenshotPath,
        clip: {
          x: slideData.slideRect.x,
          y: slideData.slideRect.y,
          width: slideData.slideRect.width,
          height: slideData.slideRect.height,
        },
      });

      await clearTextHideMarkers(page);

      const pptSlide = pptx.addSlide();
      pptSlide.addImage({
        path: screenshotPath,
        x: 0,
        y: 0,
        w: pxToInches(SLIDE_W),
        h: pxToInches(SLIDE_H),
        sizing: { type: 'cover', w: pxToInches(SLIDE_W), h: pxToInches(SLIDE_H) },
      });
      addTextBoxes(pptSlide, slideData.texts);

      console.log(`  Slide ${index + 1}/${slideCount}: ${slideData.texts.length} text boxes + background captured`);
    }

    console.log('[3/3] Writing mixed PPTX...');
    await pptx.writeFile({ fileName: outputPath });
    console.log(`  ✅ Mixed PPTX saved to: ${outputPath}`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Mixed export failed:', error);
  process.exit(1);
});

/**
 * Encode Folio's extracted slides data into Figma's native clipboard format
 * (fig-kiwi binary), enabling Cmd+V paste in both Figma Design and Figma Slides.
 *
 * Uses @figit/fig-kiwi only for binary encoding — node structure and text
 * metrics come from our extraction pipeline, matching figit's proven format.
 */

import { encodeFigmaData, composeClipboardHtml } from '@figit/fig-kiwi';

// ─── Constants (match figit's internal values) ──────────────────────

const SESSION_ID = 0;          // figit uses 0 everywhere
const PASTE_ID = 777;          // figit's fixed pasteID
const PASTE_FILE_KEY = 'IAMA_DUMMY_FILE_KEY_AMA'; // figit's dummy key

// Fixed localIDs (matching figit's ROOT_RESERVED_GUIDS layout)
const DOC_LID   = 0;
const CANVAS_LID = 1;
const FRAME0_LID = 2;          // first frame starts at 2, children increment

// ─── Helpers ───────────────────────────────────────────────────────

function hexToFigmaColor(hex) {
  if (!hex || typeof hex !== 'string') return { r: 0.102, g: 0.094, b: 0.078, a: 1 };
  const clean = hex.replace(/^#/, '');
  return {
    r: Math.round((parseInt(clean.slice(0, 2), 16) / 255) * 10000) / 10000,
    g: Math.round((parseInt(clean.slice(2, 4), 16) / 255) * 10000) / 10000,
    b: Math.round((parseInt(clean.slice(4, 6), 16) / 255) * 10000) / 10000,
    a: 1,
  };
}

function mapAlign(align = 'left') {
  if (align === 'center' || align === 'centre') return 'CENTER';
  if (align === 'right') return 'RIGHT';
  if (align === 'justify') return 'JUSTIFIED';
  return 'LEFT';
}

function base64DataUriToBytes(dataUri) {
  if (!dataUri) return new Uint8Array(0);
  const base64 = dataUri.includes('base64,') ? dataUri.split('base64,')[1] : dataUri;
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/** @returns {{ sessionID: 0, localID: number }} */
function guid(localID) {
  return { sessionID: SESSION_ID, localID };
}

// ─── Node builders (mirror figit's createDocumentNodeChange etc.) ───

const DOCUMENT_NODE = {
  guid: guid(DOC_LID),
  phase: 'CREATED',
  type: 'DOCUMENT',
  name: 'Unnamed',
  visible: true,
  opacity: 1,
  blendMode: 'PASS_THROUGH',
  mask: false,
  maskType: 'ALPHA',
};

function buildCanvasNode(name) {
  return {
    guid: guid(CANVAS_LID),
    phase: 'CREATED',
    parentIndex: { guid: guid(DOC_LID), position: '!' },
    type: 'CANVAS',
    name,
    visible: true,
    opacity: 1,
    blendMode: 'PASS_THROUGH',
    transform: { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 },
    mask: false,
    maskType: 'ALPHA',
    backgroundOpacity: 1,
    backgroundEnabled: true,
  };
}

function buildFrameNode({ localID, width, height, name, fillPaints }) {
  return {
    guid: guid(localID),
    phase: 'CREATED',
    parentIndex: { guid: guid(CANVAS_LID), position: '!' },
    type: 'FRAME',
    name,
    visible: true,
    opacity: 1,
    blendMode: 'PASS_THROUGH',
    size: { x: width, y: height },
    transform: { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 },
    strokeWeight: 1,
    strokeAlign: 'INSIDE',
    strokeJoin: 'MITER',
    fillPaints,
    frameMaskDisabled: false,
    stackMode: 'VERTICAL',
  };
}

function buildTextNode({ localID, parentLID, text, rect, style, isItalic }) {
  const fontSize = style.fontSize || 16;
  return {
    guid: guid(localID),
    phase: 'CREATED',
    parentIndex: { guid: guid(parentLID), position: '!' },
    type: 'TEXT',
    name: text ? text.slice(0, 30).replace(/\n/g, ' ') : 'Text',
    visible: true,
    opacity: 1,
    size: { x: rect.width || 100, y: rect.height || 20 },
    transform: {
      m00: 1, m01: 0, m02: rect.x || 0,
      m10: 0, m11: 1, m12: rect.y || 0,
    },
    characters: text || '',
    fontSize,
    textAlignHorizontal: mapAlign(style.textAlign),
    textAlignVertical: 'TOP',
    lineHeight: { value: style.lineHeight || fontSize * 1.4, units: 'PIXELS' },
    fontName: {
      family: style.fontFamily || 'Inter',
      style: isItalic ? 'Italic' : 'Regular',
      postscript: '',
    },
    letterSpacing: { value: parseFloat(style.letterSpacing) || 0, units: 'PIXELS' },
    fillPaints: [{
      type: 'SOLID',
      color: hexToFigmaColor(style.color || '1A1814'),
      opacity: 1,
      visible: true,
      blendMode: 'NORMAL',
    }],
    fontVersion: '2',
    autoRename: true,
  };
}

function buildImageNode({ localID, parentLID, img }) {
  return {
    guid: guid(localID),
    phase: 'CREATED',
    parentIndex: { guid: guid(parentLID), position: '!' },
    type: 'ROUNDED_RECTANGLE',
    name: img.alt || 'Image',
    visible: true,
    opacity: 1,
    size: { x: img.rect.width || 100, y: img.rect.height || 100 },
    transform: {
      m00: 1, m01: 0, m02: img.rect.x || 0,
      m10: 0, m11: 1, m12: img.rect.y || 0,
    },
    fillPaints: [{
      type: 'IMAGE',
      image: { hash: [0, 0, 0, 0, 0, 0, 0, 0], dataBlob: img._blobIndex },
      opacity: 1,
      visible: true,
      blendMode: 'NORMAL',
      imageScaleMode: img.objectFit === 'cover' ? 'FILL' : 'FIT',
      scale: 1,
    }],
    cornerRadius: 0,
    strokeWeight: 0,
    strokeAlign: 'OUTSIDE',
    autoRename: true,
  };
}

// ─── Clipboard builder ─────────────────────────────────────────────

function buildClipboardMessage(slides, options = {}) {
  const { slideW = 1280, slideH = 720 } = options;
  const nodeChanges = [];
  const blobs = [];

  // ── DOCUMENT (localID: 0) ──
  nodeChanges.push(DOCUMENT_NODE);

  // ── CANVAS (localID: 1) ──
  nodeChanges.push(buildCanvasNode('Folio Deck'));

  // ── FRAMEs + children ──
  let nextLID = FRAME0_LID; // start at 2

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const frameLID = nextLID++;

    // Background fill — figit always sets white as default
    const fillPaints = [];
    if (slide.bgColor) {
      fillPaints.push({
        type: 'SOLID',
        color: hexToFigmaColor(slide.bgColor),
        opacity: 1,
        visible: true,
        blendMode: 'NORMAL',
      });
    }
    // Always have at least white fill (figit sets white for every frame)
    if (fillPaints.length === 0) {
      fillPaints.push({
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1, a: 1 },
        opacity: 1,
        visible: true,
        blendMode: 'NORMAL',
      });
    }

    nodeChanges.push(buildFrameNode({
      localID: frameLID,
      width: slideW,
      height: slideH,
      name: `Slide ${i + 1}`,
      fillPaints,
    }));

    // ── Text nodes ──
    const texts = slide.texts || [];
    for (const t of texts) {
      nodeChanges.push(buildTextNode({
        localID: nextLID++,
        parentLID: frameLID,
        text: t.text,
        rect: t.rect,
        style: t.style,
        isItalic: t.isItalic,
      }));
    }

    // ── Image nodes ──
    const images = slide.images || [];
    for (const img of images) {
      if (!img.data) continue;
      const rawBytes = base64DataUriToBytes(img.data);
      if (rawBytes.length === 0) continue;

      const blobIndex = blobs.length;
      blobs.push({ bytes: Array.from(rawBytes) });

      nodeChanges.push(buildImageNode({
        localID: nextLID++,
        parentLID: frameLID,
        img: { ...img, _blobIndex: blobIndex },
      }));
    }
  }

  return {
    type: 'NODE_CHANGES',
    sessionID: SESSION_ID,
    ackID: SESSION_ID,
    nodeChanges,
    blobs,
    pasteID: PASTE_ID,
    pasteFileKey: PASTE_FILE_KEY,
    pasteIsPartiallyOutsideEnclosingFrame: false,
    isCut: false,
    pasteEditorType: 'DESIGN',
    publishedAssetGuids: [],
  };
}

// ─── Public API ────────────────────────────────────────────────────

export function encodeSlidesToClipboard(slides, options = {}) {
  const message = buildClipboardMessage(slides, options);
  const { base64, size } = encodeFigmaData(message);
  const html = composeClipboardHtml(base64);
  return { html, base64, size };
}

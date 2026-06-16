#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.text || !args.output) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const width = numberArg(args.width, 240);
const height = numberArg(args.height, 120);
const fontSize = numberArg(args.fontSize, 72);
const fontWeight = args.fontWeight ?? '800';
const fill = args.fill ?? '#202124';
const fontFamily = args.fontFamily ?? fontFamilyFromFontFile(args.fontFile) ?? 'Arial, sans-serif';
const x = args.x ?? '50%';
const y = args.y ?? '50%';
const textAnchor = args.textAnchor ?? 'middle';
const dominantBaseline = args.dominantBaseline ?? 'central';
const letterSpacing = args.letterSpacing ?? null;

const fontCss = buildFontCss({
  fontFile: args.fontFile,
  googleCss: args.googleCss,
  fontFamily
});

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style><![CDATA[
${fontCss}
    .text {
      user-select: none;
      -webkit-user-select: none;
      font-family: ${cssFontFamily(fontFamily)};
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      fill: ${fill};
${letterSpacing ? `      letter-spacing: ${letterSpacing};\n` : ''}    }
  ]]></style>
  <text class="text" x="${escapeXml(String(x))}" y="${escapeXml(String(y))}" text-anchor="${escapeXml(textAnchor)}" dominant-baseline="${escapeXml(dominantBaseline)}">${escapeXml(args.text)}</text>
</svg>
`;

fs.mkdirSync(path.dirname(args.output), { recursive: true });
fs.writeFileSync(args.output, svg);
console.log(`Wrote ${args.output}`);

function parseArgs(argv) {
  const parsed = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      continue;
    }

    const key = toCamelCase(arg.slice(2));
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i++;
    }
  }

  return parsed;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function numberArg(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid number: ${value}`);
  }

  return number;
}

function buildFontCss({ fontFile, googleCss, fontFamily }) {
  const lines = [];

  if (googleCss) {
    lines.push(`@import url('${googleCss}');`);
  }

  if (fontFile) {
    const absolutePath = path.resolve(fontFile);
    const bytes = fs.readFileSync(absolutePath);
    const mimeType = fontMimeType(absolutePath);
    const format = fontFormat(absolutePath);
    const dataUrl = `data:${mimeType};base64,${bytes.toString('base64')}`;

    lines.push(`@font-face {`);
    lines.push(`  font-family: ${cssFontFamily(fontFamily)};`);
    lines.push(`  src: url('${dataUrl}') format('${format}');`);
    lines.push(`  font-display: block;`);
    lines.push(`}`);
  }

  return lines.join('\n');
}

function fontFamilyFromFontFile(fontFile) {
  if (!fontFile) {
    return null;
  }

  return path.basename(fontFile, path.extname(fontFile));
}

function fontMimeType(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.ttf') return 'font/ttf';
  if (ext === '.otf') return 'font/otf';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.woff2') return 'font/woff2';
  throw new Error(`Unsupported font extension: ${ext}`);
}

function fontFormat(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.ttf') return 'truetype';
  if (ext === '.otf') return 'opentype';
  if (ext === '.woff') return 'woff';
  if (ext === '.woff2') return 'woff2';
  throw new Error(`Unsupported font extension: ${ext}`);
}

function cssFontFamily(value) {
  if (value.includes(',') || value.startsWith('"') || value.startsWith("'")) {
    return value;
  }

  return JSON.stringify(value);
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function indent(value, spaces) {
  if (!value) {
    return '';
  }

  const prefix = ' '.repeat(spaces);
  return value.split('\n').map(line => `${prefix}${line}`).join('\n');
}

function printHelp() {
  console.log(`Usage:
  node games/daily-quiz/tools/generate-text-svg.mjs --text 星河 --output games/daily-quiz/quizzes/2026/06/2026-06-19-image.svg

Options:
  --text <text>                 Text to render. Required.
  --output <path>               SVG output path. Required.
  --width <number>              SVG width. Default: 240.
  --height <number>             SVG height. Default: 120.
  --font-size <number>          Font size in px. Default: 72.
  --font-weight <value>         Font weight. Default: 800.
  --font-family <value>         CSS font-family. Default: derived from --font-file or Arial.
  --font-file <path>            Embed a local .ttf/.otf/.woff/.woff2 font into the SVG.
  --google-css <url>            Add a Google Fonts CSS URL via @import.
  --fill <color>                Text color. Default: #202124.
  --x <value>                   Text x coordinate. Default: 50%.
  --y <value>                   Text y coordinate. Default: 65%.
  --text-anchor <value>         SVG text-anchor. Default: middle.
  --dominant-baseline <value>   SVG dominant-baseline. Default: middle.
  --letter-spacing <value>      Optional CSS letter-spacing.
`);
}

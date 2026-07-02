// Генерация иконок Bloq: красный круг с белой диагональной полосой (знак запрета).
// Без зависимостей: PNG собирается вручную, сжатие - встроенный zlib.
// Запуск: npm run icons (файлы кладутся в icons/).

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SIZES = [16, 32, 48, 128];
const RED = [224, 49, 49];
const WHITE = [255, 255, 255];

let crcTable = null;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "icons");
mkdirSync(outDir, { recursive: true });

for (const size of SIZES) {
  const file = path.join(outDir, `icon${size}.png`);
  writeFileSync(file, buildPng(size, renderIcon(size)));
  console.log(path.relative(root, file));
}

// Рисуем попиксельно: круг с антиалиасингом по краю, полоса по диагонали "\".
function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const radius = size * 0.46;
  const barHalfWidth = size * 0.11;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.hypot(dx, dy);
      const coverage = clamp(radius - dist + 0.5, 0, 1);
      if (coverage <= 0) continue;

      const distToDiagonal = Math.abs(dx - dy) / Math.SQRT2;
      const barCoverage = clamp(barHalfWidth - distToDiagonal + 0.5, 0, 1);

      const offset = (y * size + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        pixels[offset + ch] = Math.round(RED[ch] + (WHITE[ch] - RED[ch]) * barCoverage);
      }
      pixels[offset + 3] = Math.round(coverage * 255);
    }
  }
  return pixels;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Минимальный PNG: сигнатура + IHDR (RGBA, 8 бит) + IDAT (без фильтров) + IEND.
function buildPng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // глубина
  ihdr[9] = 6; // цветовой тип RGBA

  const stride = size * 4 + 1; // +1 байт типа фильтра на строку
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // фильтр None
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function crc32(buffer) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

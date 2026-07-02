// Bloq - сборка пакета для Chrome Web Store. Без зависимостей: ZIP-контейнер
// собирается вручную (deflate из zlib). В архив попадают ТОЛЬКО рантайм-файлы
// расширения по явному whitelist - без tests/tools/docs/dev-мусора.
// Архив воспроизводим побайтно (фиксированная дата). Запуск: npm run build.

import { deflateRawSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));

// Явный список рантайм-файлов. manifest.json обязан лежать в корне архива.
const FILES = [
  "manifest.json",
  "rules/ads.json",
  "data/selectors.mjs",
  "common/matching.mjs",
  "src/background.js",
  "src/content/bloq.js",
  "src/popup/popup.html",
  "src/popup/popup.css",
  "src/popup/popup.js",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

// Фиксированные DOS-дата/время -> архив побайтно стабилен между сборками.
const DOS_TIME = 0; // 00:00:00
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1; // 2020-01-01

let crcTable = null;

const zip = buildZip();
mkdirSync(path.join(root, "dist"), { recursive: true });
const outPath = path.join(root, "dist", `bloq-${manifest.version}.zip`);
writeFileSync(outPath, zip);
console.log(`${path.relative(root, outPath)}  (${FILES.length} файлов, ${zip.length} байт)`);

function buildZip() {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const rel of FILES) {
    const data = readFileSync(path.join(root, rel));
    const name = Buffer.from(rel, "utf8"); // прямые слэши - валидны для ZIP
    const crc = crc32(data);
    const deflated = deflateRawSync(data, { level: 9 });
    // Берём меньшее из (deflate, stored): для крошечных файлов stored короче.
    const stored = deflated.length >= data.length;
    const method = stored ? 0 : 8;
    const payload = stored ? data : deflated;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra len
    localChunks.push(local, name, payload);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra len
    central.writeUInt16LE(0, 32); // comment len
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42); // offset of local header
    centralChunks.push(central, name);

    offset += local.length + name.length + payload.length;
  }

  const localBuf = Buffer.concat(localChunks);
  const centralBuf = Buffer.concat(centralChunks);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // this disk
  eocd.writeUInt16LE(0, 6); // disk with central dir
  eocd.writeUInt16LE(FILES.length, 8);
  eocd.writeUInt16LE(FILES.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16); // offset of central directory
  eocd.writeUInt16LE(0, 20); // comment len

  return Buffer.concat([localBuf, centralBuf, eocd]);
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

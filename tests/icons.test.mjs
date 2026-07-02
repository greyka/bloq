import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

test("иконки: валидные PNG с размерами из манифеста", () => {
  for (const [key, rel] of Object.entries(manifest.icons)) {
    const buf = readFileSync(path.join(root, rel));
    assert.deepEqual([...buf.subarray(0, 8)], PNG_SIGNATURE, `${rel}: не PNG`);
    // IHDR: ширина и высота сразу после сигнатуры и заголовка чанка
    assert.equal(buf.readUInt32BE(16), Number(key), `${rel}: ширина != ${key}`);
    assert.equal(buf.readUInt32BE(20), Number(key), `${rel}: высота != ${key}`);
  }
});

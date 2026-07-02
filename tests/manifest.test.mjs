import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = readFileSync(path.join(root, "manifest.json"), "utf8");
const manifest = JSON.parse(raw);

test("манифест: MV3, имя Bloq, версия и описание", () => {
  assert.notEqual(raw.charCodeAt(0), 0xfeff, "BOM в manifest.json - Chrome не распарсит");
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "Bloq");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(manifest.description.length > 0);
});

test("манифест: разрешения минимальны и достаточны", () => {
  assert.deepEqual(
    [...manifest.permissions].sort(),
    ["activeTab", "declarativeNetRequest", "storage"]
  );
  assert.equal(manifest.host_permissions, undefined, "широкие host_permissions не нужны");
});

test("манифест: каждый упомянутый файл существует", () => {
  const refs = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
    ...manifest.content_scripts.flatMap((cs) => cs.js),
    ...manifest.declarative_net_request.rule_resources.map((r) => r.path),
    ...manifest.web_accessible_resources.flatMap((w) => w.resources),
  ];
  for (const ref of refs) {
    assert.ok(existsSync(path.join(root, ref)), `нет файла: ${ref}`);
  }
});

test("манифест: контент-скрипт стартует рано и во всех фреймах", () => {
  const cs = manifest.content_scripts[0];
  assert.equal(cs.run_at, "document_start");
  assert.equal(cs.all_frames, true);
  assert.ok(cs.matches.includes("http://*/*"));
  assert.ok(cs.matches.includes("https://*/*"));
});

test("манифест: background объявлен как ES-модуль", () => {
  assert.equal(manifest.background.type, "module");
});

test("манифест: статический ruleset включён по умолчанию", () => {
  const resource = manifest.declarative_net_request.rule_resources[0];
  assert.equal(resource.enabled, true);
  assert.equal(resource.path, "rules/ads.json");
});

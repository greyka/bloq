// Сшивка частей расширения между собой: манифест <-> код <-> версии.
// Эти тесты ловят дрейф конфигурации, который в браузере всплывает только
// молчаливой поломкой.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));

test("динамические import контент-скрипта объявлены в web_accessible_resources", () => {
  const src = readFileSync(path.join(root, "src", "content", "bloq.js"), "utf8");
  const imports = [...src.matchAll(/chrome\.runtime\.getURL\(["']([^"']+)["']\)/g)].map(
    (m) => m[1]
  );
  assert.ok(imports.length >= 2, "контент-скрипт должен грузить модули через getURL");

  const war = manifest.web_accessible_resources.flatMap((entry) => entry.resources);
  for (const resource of imports) {
    assert.ok(war.includes(resource), `${resource} не объявлен в web_accessible_resources`);
    assert.ok(existsSync(path.join(root, resource)), `нет файла ${resource}`);
  }
});

test("версия одна на всех: manifest, package.json, CHANGELOG", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const changelog = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const topEntry = changelog.match(/^## (\d+\.\d+\.\d+)/m)?.[1];

  assert.equal(pkg.version, manifest.version, "package.json разошёлся с манифестом");
  assert.equal(topEntry, manifest.version, "CHANGELOG разошёлся с манифестом");
});

test("id статического ruleset совпадает в манифесте и background", () => {
  const bg = readFileSync(path.join(root, "src", "background.js"), "utf8");
  const manifestId = manifest.declarative_net_request.rule_resources[0].id;
  const bgId = bg.match(/const RULESET_ID = "([^"]+)"/)?.[1];
  assert.equal(bgId, manifestId, "background управляет не тем ruleset");
});

test("popup и background импортируют общий модуль matching", () => {
  const popup = readFileSync(path.join(root, "src", "popup", "popup.js"), "utf8");
  const bg = readFileSync(path.join(root, "src", "background.js"), "utf8");
  assert.match(popup, /from "\.\.\/\.\.\/common\/matching\.mjs"/);
  assert.match(bg, /from "\.\.\/common\/matching\.mjs"/);
});

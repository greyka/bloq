import test from "node:test";
import assert from "node:assert/strict";
import * as data from "../data/selectors.mjs";
import { validateSelector } from "./lib/validate.mjs";

test("списки селекторов не пусты", () => {
  assert.ok(data.cosmeticSelectors.length >= 20, "мало косметических селекторов");
  assert.ok(data.cookieHideSelectors.length >= 20, "мало cookie-селекторов");
  assert.ok(data.cookieRejectClicks.length >= 8, "мало CMP с авто-отказом");
  assert.ok(data.shadowHosts.length >= 1);
  assert.ok(data.scrollLockClasses.length >= 1);
});

test("каждый селектор безопасен для сборки stylesheet", () => {
  const all = [
    ...data.cosmeticSelectors,
    ...data.cookieHideSelectors,
    ...data.cookieRejectClicks.flatMap((cmp) => cmp.selectors),
    ...data.shadowHosts,
  ];
  for (const selector of all) {
    assert.ok(validateSelector(selector), `плохой селектор: ${selector}`);
  }
});

test("селекторы скрытия не дублируются", () => {
  const all = [...data.cosmeticSelectors, ...data.cookieHideSelectors];
  const dupes = all.filter((selector, index) => all.indexOf(selector) !== index);
  assert.deepEqual(dupes, []);
});

test("записи авто-отказа имеют имя CMP и непустые селекторы", () => {
  for (const cmp of data.cookieRejectClicks) {
    assert.ok(typeof cmp.cmp === "string" && cmp.cmp.length > 0);
    assert.ok(Array.isArray(cmp.selectors) && cmp.selectors.length > 0, cmp.cmp);
  }
});

test("классы разблокировки скролла - валидные имена классов", () => {
  for (const cls of data.scrollLockClasses) {
    assert.match(cls, /^[a-zA-Z][\w-]*$/);
  }
});

test("негатив: validateSelector режет брак", () => {
  assert.equal(validateSelector("div{color:red}"), false, "инъекция стилей через {");
  assert.equal(validateSelector("[unclosed"), false, "незакрытая скобка");
  assert.equal(validateSelector("a)"), false, "лишняя закрывающая");
  assert.equal(validateSelector('div[a="x]'), false, "незакрытая кавычка");
  assert.equal(validateSelector(""), false, "пустая строка");
  assert.equal(validateSelector("   "), false, "пробелы");
  assert.equal(validateSelector("a;b"), false, "точка с запятой");
  assert.equal(validateSelector(null), false, "не строка");
  // и валидные проходят
  assert.equal(validateSelector('iframe[id^="google_ads_iframe"]'), true);
  assert.equal(validateSelector(".ad-slot"), true);
});

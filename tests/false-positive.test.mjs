// Регресс на ложные срабатывания: Bloq не должен ломать веб-приложения (Gmail).

import test from "node:test";
import assert from "node:assert/strict";
import * as data from "../data/selectors.mjs";
import { isAllowlisted } from "../common/matching.mjs";

const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z][a-z0-9-]*$/;

test("нет слишком широких bare-селекторов, ломающих веб-приложения", () => {
  for (const bad of [".ad", ".ads", ".adv"]) {
    assert.ok(!data.cosmeticSelectors.includes(bad), `слишком широкий селектор: ${bad}`);
  }
  // Специфичные рекламные селекторы остаются.
  assert.ok(data.cosmeticSelectors.includes(".adsbygoogle"));
  assert.ok(data.cosmeticSelectors.includes(".ad-container"));
  assert.ok(data.cosmeticSelectors.includes(".advertisement"));
});

test("cosmeticExcludedDomains: валидные домены, покрывают веб-почту", () => {
  assert.ok(Array.isArray(data.cosmeticExcludedDomains));
  assert.ok(data.cosmeticExcludedDomains.length >= 5);
  for (const d of data.cosmeticExcludedDomains) {
    assert.match(d, DOMAIN_RE, `некорректный домен: ${d}`);
  }
});

test("косметика отключена на Gmail и веб-почте, но не на обычных сайтах", () => {
  assert.ok(isAllowlisted("mail.google.com", data.cosmeticExcludedDomains), "Gmail не исключён");
  assert.ok(isAllowlisted("outlook.live.com", data.cosmeticExcludedDomains), "Outlook не исключён");
  // Обычные сайты фильтруются как обычно.
  assert.equal(isAllowlisted("lenta.ru", data.cosmeticExcludedDomains), false);
  assert.equal(isAllowlisted("example.com", data.cosmeticExcludedDomains), false);
  // Не должно задеть основной google.com (поиск и пр.).
  assert.equal(isAllowlisted("www.google.com", data.cosmeticExcludedDomains), false);
});

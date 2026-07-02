import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateDnrRules, policyErrors } from "./lib/validate.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rules = JSON.parse(readFileSync(path.join(root, "rules", "ads.json"), "utf8"));

test("правила DNR структурно валидны", () => {
  assert.deepEqual(validateDnrRules(rules), []);
  assert.ok(rules.length <= 30000, "лимит гарантированных статических правил MV3");
});

test("политика: block не трогает main_frame и бьёт только third-party", () => {
  assert.deepEqual(policyErrors(rules), []);
});

test("домены не дублируются между правилами", () => {
  const all = rules.flatMap((rule) => rule.condition.requestDomains ?? []);
  const dupes = all.filter((domain, index) => all.indexOf(domain) !== index);
  assert.deepEqual(dupes, []);
});

test("покрытие: есть и доменные правила, и generic-паттерны", () => {
  const domainCount = rules
    .flatMap((rule) => rule.condition.requestDomains ?? [])
    .length;
  const patternCount = rules.filter((rule) => rule.condition.urlFilter).length;
  assert.ok(domainCount >= 50, `доменов маловато: ${domainCount}`);
  assert.ok(patternCount >= 5, `generic-паттернов маловато: ${patternCount}`);
});

test("негатив: валидатор ловит брак", () => {
  const block = (condition) => ({ id: 1, action: { type: "block" }, condition });

  // дубль id
  assert.notDeepEqual(
    validateDnrRules([block({ urlFilter: "||x." }), block({ urlFilter: "||y." })]),
    []
  );
  // id < 1
  assert.notDeepEqual(
    validateDnrRules([{ id: 0, action: { type: "block" }, condition: { urlFilter: "x" } }]),
    []
  );
  // неизвестный action
  assert.notDeepEqual(
    validateDnrRules([{ id: 1, action: { type: "explode" }, condition: { urlFilter: "x" } }]),
    []
  );
  // пустое условие
  assert.notDeepEqual(validateDnrRules([block({})]), []);
  // кривой resourceType
  assert.notDeepEqual(
    validateDnrRules([block({ urlFilter: "x", resourceTypes: ["scriptz"] })]),
    []
  );
  // кривой домен
  assert.notDeepEqual(validateDnrRules([block({ requestDomains: ["not a domain"] })]), []);
  // пустой массив
  assert.notDeepEqual(validateDnrRules([]), []);
});

test("негатив: policyErrors ловит нарушение политики", () => {
  // block без исключения main_frame и без thirdParty
  const bad = [{ id: 1, action: { type: "block" }, condition: { urlFilter: "||ads." } }];
  const errors = policyErrors(bad);
  assert.equal(errors.length, 2);
});

// Валидаторы данных Bloq. Негативные тесты проверяют, что валидаторы
// действительно ловят брак, а не всегда отвечают «ок».

export const DNR_RESOURCE_TYPES = new Set([
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "webtransport",
  "webbundle",
  "other",
]);

export const DNR_ACTION_TYPES = new Set([
  "block",
  "allow",
  "allowAllRequests",
  "upgradeScheme",
  "redirect",
  "modifyHeaders",
]);

const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z][a-z0-9-]*$/;

// Структурная валидация массива правил declarativeNetRequest.
export function validateDnrRules(rules) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return ["rules: ожидается непустой массив"];
  }
  const errors = [];
  const seenIds = new Set();

  rules.forEach((rule, index) => {
    const at = `rule[${index}] (id=${rule?.id})`;

    if (!Number.isInteger(rule?.id) || rule.id < 1) {
      errors.push(`${at}: id должен быть целым >= 1`);
    } else if (seenIds.has(rule.id)) {
      errors.push(`${at}: дубль id`);
    } else {
      seenIds.add(rule.id);
    }

    if (rule?.priority !== undefined && (!Number.isInteger(rule.priority) || rule.priority < 1)) {
      errors.push(`${at}: priority должен быть целым >= 1`);
    }

    if (!DNR_ACTION_TYPES.has(rule?.action?.type)) {
      errors.push(`${at}: неизвестный action.type`);
    }

    const cond = rule?.condition;
    if (!cond || typeof cond !== "object") {
      errors.push(`${at}: нет condition`);
      return;
    }

    const hasAnyCondition =
      cond.urlFilter || cond.regexFilter || cond.requestDomains?.length || cond.initiatorDomains?.length;
    if (!hasAnyCondition) errors.push(`${at}: пустое условие`);

    for (const key of ["resourceTypes", "excludedResourceTypes"]) {
      for (const rt of cond[key] ?? []) {
        if (!DNR_RESOURCE_TYPES.has(rt)) errors.push(`${at}: неизвестный resourceType "${rt}"`);
      }
    }

    for (const domain of cond.requestDomains ?? []) {
      if (!DOMAIN_RE.test(domain)) errors.push(`${at}: некорректный домен "${domain}"`);
    }
  });

  return errors;
}

// Политика Bloq для block-правил: не трогаем main_frame (иначе ломается
// навигация на сайты сетей) и бьём только third-party (иначе ломаются
// рекламные кабинеты и дашборды аналитики на их собственных доменах).
export function policyErrors(rules) {
  const errors = [];
  for (const rule of rules) {
    if (rule?.action?.type !== "block") continue;
    const cond = rule.condition ?? {};

    const excludesMainFrame =
      (cond.excludedResourceTypes ?? []).includes("main_frame") ||
      (Array.isArray(cond.resourceTypes) && !cond.resourceTypes.includes("main_frame"));
    if (!excludesMainFrame) errors.push(`rule id=${rule.id}: block без исключения main_frame`);

    if (cond.domainType !== "thirdParty") {
      errors.push(`rule id=${rule.id}: block без domainType=thirdParty`);
    }
  }
  return errors;
}

// Селектор безопасен для сборки stylesheet: непустой, без { } ; и с
// закрытыми скобками/кавычками. (Полную CSS-грамматику проверяет браузер;
// контент-скрипт изолирует ошибку - одно правило на селектор.)
export function validateSelector(selector) {
  if (typeof selector !== "string" || !selector.trim()) return false;
  if (/[{};]/.test(selector)) return false;

  const stack = [];
  const pairs = { ")": "(", "]": "[" };
  let quote = null;

  for (const ch of selector) {
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") stack.push(ch);
    else if (ch === ")" || ch === "]") {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }

  return quote === null && stack.length === 0;
}

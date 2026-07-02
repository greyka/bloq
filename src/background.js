// Bloq - service worker.
// Хранилище (chrome.storage.local) - единственный источник состояния:
// { enabled: boolean, allowlist: string[] }. DNR-правила всегда пересобираются
// из него целиком, поэтому синхронизация идемпотентна.

import { normalizeHost } from "../common/matching.mjs";

const RULESET_ID = "bloq_ads";
// Выше приоритета block-правил (1): allow-правило побеждает на allowlist-сайтах.
const ALLOW_RULE_PRIORITY = 100;
const DEFAULT_STATE = { enabled: true, allowlist: [] };

chrome.runtime.onInstalled.addListener(bootstrap);
chrome.runtime.onStartup.addListener(bootstrap);

async function bootstrap() {
  // Счётчик заблокированных запросов на бейдже иконки (без доступа к содержимому).
  await chrome.declarativeNetRequest.setExtensionActionOptions({
    displayActionCountAsBadgeText: true,
  });
  await syncFromStorage();
}

function getState() {
  return chrome.storage.local.get(DEFAULT_STATE);
}

async function syncFromStorage() {
  const { enabled, allowlist } = await getState();

  await chrome.declarativeNetRequest.updateEnabledRulesets(
    enabled ? { enableRulesetIds: [RULESET_ID] } : { disableRulesetIds: [RULESET_ID] }
  );

  // Динамические allow-правила пересобираются с нуля из allowlist:
  // повторный вызов при том же состоянии даёт тот же результат.
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: allowlist.map((domain, index) => ({
      id: index + 1,
      priority: ALLOW_RULE_PRIORITY,
      action: { type: "allowAllRequests" },
      condition: {
        requestDomains: [domain],
        resourceTypes: ["main_frame"],
      },
    })),
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true; // ответ асинхронный
});

async function handleMessage(message) {
  switch (message?.type) {
    case "get-state":
      return { ok: true, state: await getState() };

    case "set-enabled": {
      await chrome.storage.local.set({ enabled: Boolean(message.value) });
      await syncFromStorage();
      return { ok: true };
    }

    case "toggle-site": {
      const host = normalizeHost(message.host);
      if (!host) return { ok: false, error: "пустой host" };
      const { allowlist } = await getState();
      const next = allowlist.includes(host)
        ? allowlist.filter((domain) => domain !== host)
        : [...allowlist, host];
      await chrome.storage.local.set({ allowlist: next });
      await syncFromStorage();
      return { ok: true, allowlisted: next.includes(host) };
    }

    default:
      return { ok: false, error: "неизвестное сообщение" };
  }
}

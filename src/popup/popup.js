// Bloq - попап: глобальный тумблер и allowlist текущего сайта.
// Состоянием владеет background; попап только шлёт сообщения.

import { normalizeHost, isAllowlisted } from "../../common/matching.mjs";

const $ = (id) => document.getElementById(id);

let currentHost = null;
let currentTabId = null;

init().catch((error) => {
  document.body.textContent = `Ошибка: ${error}`;
});

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url && /^https?:/.test(tab.url)) {
    currentHost = normalizeHost(new URL(tab.url).hostname);
    currentTabId = tab.id;
  }

  const response = await chrome.runtime.sendMessage({ type: "get-state" });
  if (!response?.ok) throw new Error(response?.error ?? "background не ответил");
  const { state } = response;

  $("enabled").checked = state.enabled;
  if (currentHost) {
    $("site-host").textContent = currentHost;
    $("site-enabled").checked = !isAllowlisted(currentHost, state.allowlist);
    $("site-enabled").disabled = !state.enabled;
  } else {
    $("site-row").hidden = true;
  }

  $("enabled").addEventListener("change", async (event) => {
    await chrome.runtime.sendMessage({ type: "set-enabled", value: event.target.checked });
    $("site-enabled").disabled = !event.target.checked;
    showReloadHint();
  });

  $("site-enabled").addEventListener("change", async () => {
    await chrome.runtime.sendMessage({ type: "toggle-site", host: currentHost });
    showReloadHint();
  });

  $("reload").addEventListener("click", async () => {
    if (currentTabId != null) await chrome.tabs.reload(currentTabId);
    window.close();
  });
}

function showReloadHint() {
  $("hint").hidden = false;
  $("reload").hidden = currentTabId == null;
}

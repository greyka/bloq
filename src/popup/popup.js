// Bloq - попап: глобальный тумблер, per-site allowlist и реальные метрики.
// Состоянием владеет background; попап только шлёт сообщения и отражает состояние.

import { normalizeHost, isAllowlisted } from "../../common/matching.mjs";

const $ = (id) => document.getElementById(id);

let currentHost = null;
let currentTabId = null;

init().catch((error) => {
  document.body.textContent = `Ошибка: ${error}`;
});

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let favUrl = null;
  if (tab?.url && /^https?:/.test(tab.url)) {
    currentHost = normalizeHost(new URL(tab.url).hostname);
    currentTabId = tab.id;
    favUrl = tab.favIconUrl || null;
  }

  $("version").textContent = "v" + chrome.runtime.getManifest().version;
  countBlocklistDomains().then((count) => {
    $("stat-blocklist").textContent = count;
  });

  const response = await chrome.runtime.sendMessage({ type: "get-state" });
  if (!response?.ok) throw new Error(response?.error ?? "background не ответил");
  const { state } = response;

  $("enabled").checked = state.enabled;
  $("stat-allowlist").textContent = state.allowlist.length;

  if (currentHost) {
    $("site-host").textContent = currentHost;
    $("site-enabled").checked = !isAllowlisted(currentHost, state.allowlist);
    setFavicon(favUrl);
  } else {
    $("site-row").hidden = true;
  }

  applyEnabledUi(state.enabled);

  $("enabled").addEventListener("change", async (event) => {
    const on = event.target.checked;
    await chrome.runtime.sendMessage({ type: "set-enabled", value: on });
    applyEnabledUi(on);
    showReloadHint();
  });

  $("site-enabled").addEventListener("change", async () => {
    await chrome.runtime.sendMessage({ type: "toggle-site", host: currentHost });
    const fresh = await chrome.runtime.sendMessage({ type: "get-state" });
    if (fresh?.ok) $("stat-allowlist").textContent = fresh.state.allowlist.length;
    showReloadHint();
  });

  $("reload").addEventListener("click", async () => {
    if (currentTabId != null) await chrome.tabs.reload(currentTabId);
    window.close();
  });
}

// Глобальное вкл/выкл: статус-пилл, подпись и доступность per-site тумблера.
function applyEnabledUi(on) {
  document.body.classList.toggle("is-off", !on);
  $("status-label").textContent = on ? "Активна" : "Пауза";
  $("primary-desc").textContent = on ? "Защита активна на всех сайтах" : "Защита приостановлена";
  $("site-enabled").disabled = !on;
}

function setFavicon(url) {
  if (!url) return; // остаётся нейтральный глобус
  const img = $("fav-img");
  const globe = $("fav-globe");
  img.addEventListener("error", () => {
    img.hidden = true;
    globe.hidden = false;
  });
  img.src = url;
  img.hidden = false;
  globe.hidden = true;
}

// Реальный размер блок-листа: уникальные домены из статических правил.
async function countBlocklistDomains() {
  try {
    const rules = await fetch(chrome.runtime.getURL("rules/ads.json")).then((r) => r.json());
    const domains = new Set();
    for (const rule of rules) {
      for (const domain of rule.condition?.requestDomains ?? []) domains.add(domain);
    }
    return domains.size;
  } catch {
    return "—";
  }
}

function showReloadHint() {
  $("hint").hidden = false;
  $("reload").hidden = currentTabId == null;
}

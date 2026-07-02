// Bloq - контент-скрипт: скрытие баннеров и cookie-попапов, авто-отказ
// в известных CMP, разблокировка скролла. Работает во всех http(s)-фреймах.
// Данные селекторов - в data/selectors.mjs (общие с тестами).

(() => {
  if (window.__bloqInjected) return;
  window.__bloqInjected = true;

  const STYLE_ID = "bloq-style";
  const WATCH_LIMIT_MS = 30000; // после этого наблюдение за DOM останавливаем
  const PASS_DEBOUNCE_MS = 250;

  let data = null;
  let matching = null;
  let active = false;
  let observer = null;
  let watchTimer = null;
  let passScheduled = false;
  const clickedCmps = new Set();

  init().catch(() => {
    /* не-HTML документ или закрытый фрейм - молча выходим */
  });

  async function init() {
    [data, matching] = await Promise.all([
      import(chrome.runtime.getURL("data/selectors.mjs")),
      import(chrome.runtime.getURL("common/matching.mjs")),
    ]);
    const state = await chrome.storage.local.get({ enabled: true, allowlist: [] });
    applyState(state);

    chrome.storage.onChanged.addListener((_changes, area) => {
      if (area !== "local") return;
      chrome.storage.local.get({ enabled: true, allowlist: [] }).then(applyState);
    });
  }

  function applyState({ enabled, allowlist }) {
    const shouldRun = enabled && !matching.isAllowlisted(location.hostname, allowlist);
    if (shouldRun && !active) enable();
    else if (!shouldRun && active) disable();
  }

  function enable() {
    active = true;
    injectStyle();
    startConsentWatcher();
  }

  function disable() {
    active = false;
    document.getElementById(STYLE_ID)?.remove();
    stopConsentWatcher();
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    // По одному правилу на селектор: невалидный селектор роняет только себя,
    // а не весь stylesheet.
    const css = [...data.cosmeticSelectors, ...data.cookieHideSelectors]
      .map((selector) => `${selector} { display: none !important; }`)
      .join("\n");
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function startConsentWatcher() {
    runConsentPass();
    if (document.documentElement && !observer) {
      observer = new MutationObserver(scheduleConsentPass);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    watchTimer = setTimeout(stopConsentWatcher, WATCH_LIMIT_MS);
  }

  function stopConsentWatcher() {
    observer?.disconnect();
    observer = null;
    clearTimeout(watchTimer);
    watchTimer = null;
  }

  function scheduleConsentPass() {
    if (passScheduled) return;
    passScheduled = true;
    setTimeout(() => {
      passScheduled = false;
      if (active) runConsentPass();
    }, PASS_DEBOUNCE_MS);
  }

  function runConsentPass() {
    let consentSeen = false;

    // 1. Авто-отказ: жмём «Отклонить все» у известных CMP (по разу на CMP).
    for (const cmp of data.cookieRejectClicks) {
      if (clickedCmps.has(cmp.cmp)) continue;
      for (const selector of cmp.selectors) {
        const button = queryDeep(selector);
        if (button) {
          clickedCmps.add(cmp.cmp);
          consentSeen = true;
          try {
            button.click();
          } catch {
            /* CMP уже убрал кнопку - не страшно, баннер скрыт стилем */
          }
          break;
        }
      }
    }

    // 2. Если consent-элемент присутствует (и скрыт нами) - снимаем блокировку скролла.
    if (!consentSeen) {
      consentSeen = data.cookieHideSelectors.some((selector) => {
        try {
          return Boolean(document.querySelector(selector));
        } catch {
          return false;
        }
      });
    }
    if (consentSeen) unlockScroll();
  }

  function unlockScroll() {
    for (const cls of data.scrollLockClasses) {
      document.documentElement?.classList.remove(cls);
      document.body?.classList.remove(cls);
    }
    for (const el of [document.documentElement, document.body]) {
      if (!el) continue;
      if (el.style.overflow === "hidden") el.style.overflow = "";
      if (el.style.position === "fixed") el.style.position = "";
    }
  }

  // querySelector с заходом в известные открытые shadow DOM (Usercentrics и т.п.).
  function queryDeep(selector) {
    try {
      const direct = document.querySelector(selector);
      if (direct) return direct;
      for (const hostSelector of data.shadowHosts) {
        const host = document.querySelector(hostSelector);
        const hit = host?.shadowRoot?.querySelector(selector);
        if (hit) return hit;
      }
    } catch {
      /* селектор не подошёл этому документу */
    }
    return null;
  }
})();

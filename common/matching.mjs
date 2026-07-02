// Bloq - сопоставление хостов. Единственная реализация, общая для
// background, popup, контент-скрипта и тестов.

// Нормализация: нижний регистр, без завершающей точки и ведущего "www.".
export function normalizeHost(host) {
  if (typeof host !== "string") return "";
  let h = host.trim().toLowerCase();
  if (h.endsWith(".")) h = h.slice(0, -1);
  if (h.startsWith("www.")) h = h.slice(4);
  return h;
}

// Хост совпадает с доменом или является его поддоменом (строго по границе метки).
export function hostMatches(host, domain) {
  if (!host || !domain) return false;
  return host === domain || host.endsWith("." + domain);
}

export function isAllowlisted(host, allowlist) {
  if (!Array.isArray(allowlist)) return false;
  const h = normalizeHost(host);
  return allowlist.some((domain) => hostMatches(h, domain));
}

// Funções compartilhadas entre background, popup, opções e página de bloqueio.

// disabledSites / disabledKeywords = itens da lista que estão pausados (switch desligado).
export const DEFAULT_STATE = {
  sites: [],
  keywords: [],
  disabledSites: [],
  disabledKeywords: [],
  blockShorts: false,
  enabled: true,
};

export const STATE_KEYS = Object.keys(DEFAULT_STATE);

const arr = (v) => (Array.isArray(v) ? v : []);

export async function getState() {
  const data = await chrome.storage.local.get(DEFAULT_STATE);
  return {
    sites: arr(data.sites),
    keywords: arr(data.keywords),
    disabledSites: arr(data.disabledSites),
    disabledKeywords: arr(data.disabledKeywords),
    blockShorts: data.blockShorts === true,
    enabled: data.enabled !== false,
  };
}

/** Só os itens com o switch ligado — são esses que realmente bloqueiam. */
export function activeLists(state) {
  return {
    sites: state.sites.filter((s) => !state.disabledSites.includes(s)),
    keywords: state.keywords.filter((k) => !state.disabledKeywords.includes(k)),
    blockShorts: state.blockShorts,
  };
}

export function setState(partial) {
  return chrome.storage.local.set(partial);
}

/** Converte "https://www.Exemplo.com/abc" em "exemplo.com". Retorna null se inválido. */
export function normalizeDomain(input) {
  if (!input) return null;
  let value = String(input).trim().toLowerCase();
  if (!value) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (!/^https?:$/.test(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, "").replace(/\.$/, "");
    if (!host || !host.includes(".") || /[^a-z0-9.\-]/.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

export function normalizeKeyword(input) {
  const value = String(input || "").trim().toLowerCase();
  return value.length >= 2 ? value : null;
}

/** Verifica se uma URL deve ser bloqueada pela lista atual. */
/** true se a URL é um YouTube Shorts (youtube.com/shorts/...). */
export function isShortsUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (host === "youtube.com" || host.endsWith(".youtube.com")) &&
      /^\/shorts(\/|$)/.test(u.pathname);
  } catch {
    return false;
  }
}

export function isBlocked(url, { sites, keywords, blockShorts }) {
  if (blockShorts && isShortsUrl(url)) return true;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase();
  if (sites.some((s) => host === s || host.endsWith(`.${s}`))) return true;
  const lower = url.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/** Retorna o domínio da lista que bloqueia este host (ou null). */
export function matchingSite(host, sites) {
  host = (host || "").toLowerCase();
  return sites.find((s) => host === s || host.endsWith(`.${s}`)) || null;
}

/** Adiciona (ou reativa) um site na lista. */
export async function addSite(domain) {
  const s = await getState();
  await setState({
    sites: s.sites.includes(domain) ? s.sites : [...s.sites, domain].sort(),
    disabledSites: s.disabledSites.filter((x) => x !== domain),
  });
}

export async function removeSite(domain) {
  const s = await getState();
  await setState({
    sites: s.sites.filter((x) => x !== domain),
    disabledSites: s.disabledSites.filter((x) => x !== domain),
  });
}

/** Liga/desliga um item. kind = "sites" ou "keywords". */
export async function setItemActive(kind, item, active) {
  const key = kind === "sites" ? "disabledSites" : "disabledKeywords";
  const s = await getState();
  const rest = s[key].filter((x) => x !== item);
  await setState({ [key]: active ? rest : [...rest, item] });
}

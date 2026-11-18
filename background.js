import { getState, normalizeDomain, isBlocked, activeLists, addSite, STATE_KEYS } from "./common.js";
import { getLang, t } from "./i18n.js";

const BLOCK_PAGE = chrome.runtime.getURL("blocked.html");

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Recria as regras de bloqueio (declarativeNetRequest) a partir da lista salva. */
async function syncRules() {
  const state = await getState();
  const active = activeLists(state);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const rules = [];

  if (state.enabled) {
    let id = 1;
    const redirect = {
      type: "redirect",
      // \0 = URL original completa; vai no "#" para a página de bloqueio exibi-la.
      redirect: { regexSubstitution: `${BLOCK_PAGE}#\\0` },
    };

    for (const site of active.sites) {
      rules.push({
        id: id++,
        priority: 1,
        action: redirect,
        condition: {
          regexFilter: `^https?://([^/?#]*\\.)?${escapeRegex(site)}([:/?#].*)?$`,
          resourceTypes: ["main_frame"],
        },
      });
    }

    if (active.blockShorts) {
      rules.push({
        id: id++,
        priority: 1,
        action: redirect,
        condition: {
          regexFilter: "^https?://([^/?#]*\\.)?youtube\\.com/shorts([/?#].*)?$",
          resourceTypes: ["main_frame"],
        },
      });
    }

    for (const keyword of active.keywords) {
      rules.push({
        id: id++,
        priority: 1,
        action: redirect,
        condition: {
          regexFilter: `^https?://.*${escapeRegex(keyword)}.*$`,
          isUrlFilterCaseSensitive: false,
          resourceTypes: ["main_frame"],
        },
      });
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: rules,
  });

  await updateBadge(state);
  await enforceOpenTabs(state);
}

/** Redireciona abas já abertas que passaram a estar bloqueadas. */
async function enforceOpenTabs(state) {
  if (!state.enabled) return;
  const active = activeLists(state);
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && isBlocked(tab.url, active)) {
      chrome.tabs.update(tab.id, { url: `${BLOCK_PAGE}#${tab.url}` }).catch(() => {});
    }
  }
}

async function updateBadge(state) {
  await chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
  await chrome.action.setBadgeText({ text: state.enabled ? "" : "OFF" });
}

/** Cria o menu do botão direito e o título do ícone no idioma escolhido. */
async function applyLanguage() {
  const lang = await getLang();
  await chrome.action.setTitle({ title: t(lang, "appName") });
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: "block-site",
    title: t(lang, "contextBlock"),
    contexts: ["page", "link"],
  });
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "block-site") return;
  const domain = normalizeDomain(info.linkUrl || info.pageUrl);
  if (!domain) return;
  await addSite(domain);
});

// Segunda camada: verifica a aba sempre que o endereço muda. Pega casos que a
// regra de rede não vê — botão Voltar (cache), navegação interna de sites como
// x.com/YouTube e páginas servidas pelo cache do próprio site.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  const url = changeInfo.url;
  if (!url || url.startsWith(BLOCK_PAGE)) return;
  const state = await getState();
  if (state.enabled && isBlocked(url, activeLists(state))) {
    chrome.tabs.update(tabId, { url: `${BLOCK_PAGE}#${url}` }).catch(() => {});
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (STATE_KEYS.some((k) => k in changes)) syncRules();
  if ("lang" in changes) applyLanguage();
});

chrome.runtime.onInstalled.addListener((details) => {
  applyLanguage();
  syncRules();
  if (details.reason === "install") chrome.runtime.openOptionsPage();
});

chrome.runtime.onStartup.addListener(() => {
  applyLanguage();
  syncRules();
});

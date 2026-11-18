import { getState, setState, normalizeDomain, matchingSite, addSite, setItemActive } from "./common.js";
import { getLang, t, applyI18n, bindLangToggle } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const BLOCK_PAGE = chrome.runtime.getURL("blocked.html");

let currentDomain = null;
let lang = "pt";
const tr = (key, vars) => t(lang, key, vars);

async function getCurrentUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  // Se a aba já está na página de bloqueio, a URL original está no "#".
  if (tab.url.startsWith(BLOCK_PAGE)) return tab.url.slice(tab.url.indexOf("#") + 1);
  return tab.url;
}

async function render() {
  lang = await getLang();
  applyI18n(lang);

  const state = await getState();
  $("enabled").checked = state.enabled;
  const total = state.sites.length + state.keywords.length;
  $("count").textContent = total === 1 ? tr("countOne") : tr("countMany", { n: total });

  const btn = $("toggleBlock");
  if (!currentDomain) {
    $("current").textContent = tr("unsupported");
    btn.textContent = tr("blockThis");
    btn.className = "";
    btn.disabled = true;
    return;
  }

  $("current").textContent = currentDomain;
  btn.disabled = false;
  const match = matchingSite(currentDomain, state.sites);
  if (!match) {
    btn.textContent = tr("blockThis");
    btn.className = "";
    btn.dataset.action = "add";
    btn.dataset.domain = currentDomain;
  } else if (state.disabledSites.includes(match)) {
    btn.textContent = tr("blockAgain", { site: match });
    btn.className = "";
    btn.dataset.action = "resume";
    btn.dataset.domain = match;
  } else {
    btn.textContent = tr("pause", { site: match });
    btn.className = "secondary";
    btn.dataset.action = "pause";
    btn.dataset.domain = match;
  }
}

$("toggleBlock").addEventListener("click", async (e) => {
  const { action, domain } = e.currentTarget.dataset;
  if (action === "add") await addSite(domain);
  else await setItemActive("sites", domain, action === "resume");
  // Ao liberar um site enquanto a tela de bloqueio está aberta, volta para ele.
  if (action === "pause") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith(BLOCK_PAGE)) {
      chrome.tabs.update(tab.id, { url: tab.url.slice(tab.url.indexOf("#") + 1) });
    }
  }
  await render();
});

$("enabled").addEventListener("change", (e) => setState({ enabled: e.target.checked }));
bindLangToggle();
chrome.storage.onChanged.addListener((_, area) => area === "local" && render());

$("openOptions").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

(async () => {
  currentDomain = normalizeDomain(await getCurrentUrl());
  await render();
})();

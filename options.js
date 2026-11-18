import {
  getState,
  setState,
  normalizeDomain,
  normalizeKeyword,
  addSite,
  removeSite,
  setItemActive,
} from "./common.js";
import { getLang, t, applyI18n, bindLangToggle } from "./i18n.js";

const $ = (id) => document.getElementById(id);
let lang = "pt";
const tr = (key, vars) => t(lang, key, vars);

/** Desenha a lista com um switch (ligado = bloqueando) e o botão Remover. */
function renderList(el, items, disabled, { onToggle, onRemove, emptyKey }) {
  el.replaceChildren();
  if (!items.length) {
    const div = document.createElement("div");
    div.className = "empty";
    div.textContent = tr(emptyKey);
    el.append(div);
    return;
  }
  for (const item of items) {
    const active = !disabled.includes(item);

    const li = document.createElement("li");
    if (!active) li.classList.add("paused");

    const left = document.createElement("label");
    left.className = "item-label";

    const sw = document.createElement("span");
    sw.className = "switch";
    sw.title = tr(active ? "switchOnTitle" : "switchOffTitle");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = active;
    input.addEventListener("change", () => onToggle(item, input.checked));
    const slider = document.createElement("span");
    slider.className = "slider";
    sw.append(input, slider);

    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item;

    const status = document.createElement("span");
    status.className = "item-status";
    status.textContent = tr(active ? "statusBlocked" : "statusAllowed");

    left.append(sw, name, status);

    const btn = document.createElement("button");
    btn.className = "secondary";
    btn.textContent = tr("remove");
    btn.addEventListener("click", () => onRemove(item));

    li.append(left, btn);
    el.append(li);
  }
}

async function render() {
  lang = await getLang();
  applyI18n(lang);

  const state = await getState();
  $("enabled").checked = state.enabled;
  $("enabledText").textContent = tr(state.enabled ? "enabledOn" : "enabledOff");

  $("blockShorts").checked = state.blockShorts;
  $("shortsRow").classList.toggle("paused", !state.blockShorts);
  $("shortsStatus").textContent = tr(state.blockShorts ? "statusBlocked" : "statusAllowed");

  renderList($("siteList"), state.sites, state.disabledSites, {
    onToggle: (site, on) => setItemActive("sites", site, on),
    onRemove: (site) => removeSite(site),
    emptyKey: "emptySites",
  });

  renderList($("keywordList"), state.keywords, state.disabledKeywords, {
    onToggle: (kw, on) => setItemActive("keywords", kw, on),
    onRemove: async (kw) => {
      const s = await getState();
      await setState({
        keywords: s.keywords.filter((x) => x !== kw),
        disabledKeywords: s.disabledKeywords.filter((x) => x !== kw),
      });
    },
    emptyKey: "emptyKeywords",
  });
}

$("siteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const domain = normalizeDomain($("siteInput").value);
  if (!domain) {
    $("siteError").textContent = tr("errInvalidSite");
    return;
  }
  const state = await getState();
  if (state.sites.includes(domain) && !state.disabledSites.includes(domain)) {
    $("siteError").textContent = tr("errDuplicate", { item: domain });
    return;
  }
  $("siteError").textContent = "";
  $("siteInput").value = "";
  await addSite(domain); // se estava pausado, reativa
});

$("keywordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const kw = normalizeKeyword($("keywordInput").value);
  if (!kw) {
    $("keywordError").textContent = tr("errShortKeyword");
    return;
  }
  const state = await getState();
  if (state.keywords.includes(kw) && !state.disabledKeywords.includes(kw)) {
    $("keywordError").textContent = tr("errDuplicate", { item: `"${kw}"` });
    return;
  }
  $("keywordError").textContent = "";
  $("keywordInput").value = "";
  await setState({
    keywords: state.keywords.includes(kw) ? state.keywords : [...state.keywords, kw].sort(),
    disabledKeywords: state.disabledKeywords.filter((x) => x !== kw),
  });
});

$("enabled").addEventListener("change", (e) => setState({ enabled: e.target.checked }));
$("blockShorts").addEventListener("change", (e) => setState({ blockShorts: e.target.checked }));
bindLangToggle();

// Atualiza a tela quando algo muda (lista, idioma, popup, menu de contexto).
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if ("lang" in changes) {
    // Mensagens de erro ficariam no idioma antigo — limpa.
    $("siteError").textContent = "";
    $("keywordError").textContent = "";
  }
  render();
});

render();

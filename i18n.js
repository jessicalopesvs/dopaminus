// Textos da extensão em português e inglês.
// O idioma escolhido fica salvo em chrome.storage.local ("lang": "pt" | "en").

export const LANGS = ["pt", "en"];
export const DEFAULT_LANG = "pt";

const STRINGS = {
  pt: {
    appName: "Bloqueador de Sites",
    language: "Idioma",

    // Configurações
    optionsTitle: "Bloqueador de Sites — Configurações",
    enabledOn: "Ativado",
    enabledOff: "Desativado",
    sitesTitle: "Sites bloqueados",
    sitesDesc:
      "Bloqueia o domínio e todos os subdomínios (ex.: <code>youtube.com</code> bloqueia <code>m.youtube.com</code>).",
    sitePlaceholder: "ex.: instagram.com",
    add: "Adicionar",
    remove: "Remover",
    statusBlocked: "bloqueado",
    statusAllowed: "liberado",
    switchOnTitle: "Bloqueando — clique para pausar",
    switchOffTitle: "Pausado — clique para bloquear",
    emptySites: "Nenhum site bloqueado ainda.",
    specialTitle: "Bloqueios especiais",
    specialDesc: "Bloqueie só uma parte de um site, deixando o resto liberado.",
    shortsDesc:
      "Bloqueia a página /shorts e esconde os Shorts do YouTube, inclusive o botão Shorts da barra lateral. Os outros vídeos continuam liberados.",
    keywordsTitle: "Palavras-chave bloqueadas",
    keywordsDesc:
      "Bloqueia qualquer endereço que contenha a palavra (ex.: <code>apostas</code>).",
    keywordPlaceholder: "ex.: fofoca",
    emptyKeywords: "Nenhuma palavra-chave bloqueada ainda.",
    errInvalidSite: "Endereço inválido. Use algo como exemplo.com",
    errDuplicate: "{item} já está na lista.",
    errShortKeyword: "Digite pelo menos 2 caracteres.",

    // Popup
    popupName: "Bloqueador",
    toggleAllTitle: "Ativar/desativar bloqueio",
    currentSite: "Site atual",
    unsupported: "Página não suportada",
    blockThis: "Bloquear este site",
    blockAgain: "Bloquear {site} de novo",
    pause: "Liberar {site} (pausar)",
    countOne: "1 item bloqueado",
    countMany: "{n} itens bloqueados",
    manageList: "Gerenciar lista",

    // Tela de bloqueio
    blockedPageTitle: "Site bloqueado",
    blockedTabTitle: "Bloqueado: {host}",
    blockedHeading: "Este site está bloqueado",
    blockedYou: "Você bloqueou",
    thisAddress: "este endereço",
    closeTab: "Fechar aba",
    quotes: [
      "Foco no que importa. Você consegue!",
      "Pequenas distrações somam grandes atrasos.",
      "Que tal voltar para a sua tarefa?",
      "Respire fundo e siga em frente.",
      "Seu eu do futuro vai agradecer.",
    ],

    // Menu do botão direito
    contextBlock: "Bloquear este site",
  },

  en: {
    appName: "Site Blocker",
    language: "Language",

    optionsTitle: "Site Blocker — Settings",
    enabledOn: "On",
    enabledOff: "Off",
    sitesTitle: "Blocked sites",
    sitesDesc:
      "Blocks the domain and all its subdomains (e.g. <code>youtube.com</code> also blocks <code>m.youtube.com</code>).",
    sitePlaceholder: "e.g. instagram.com",
    add: "Add",
    remove: "Remove",
    statusBlocked: "blocked",
    statusAllowed: "allowed",
    switchOnTitle: "Blocking — click to pause",
    switchOffTitle: "Paused — click to block",
    emptySites: "No blocked sites yet.",
    specialTitle: "Special blocks",
    specialDesc: "Block just part of a site and keep the rest available.",
    shortsDesc:
      "Blocks the /shorts page and hides Shorts on YouTube, including the Shorts button in the sidebar. Regular videos stay available.",
    keywordsTitle: "Blocked keywords",
    keywordsDesc:
      "Blocks any address that contains the word (e.g. <code>betting</code>).",
    keywordPlaceholder: "e.g. gossip",
    emptyKeywords: "No blocked keywords yet.",
    errInvalidSite: "Invalid address. Use something like example.com",
    errDuplicate: "{item} is already on the list.",
    errShortKeyword: "Type at least 2 characters.",

    popupName: "Blocker",
    toggleAllTitle: "Turn blocking on/off",
    currentSite: "Current site",
    unsupported: "Page not supported",
    blockThis: "Block this site",
    blockAgain: "Block {site} again",
    pause: "Allow {site} (pause)",
    countOne: "1 blocked item",
    countMany: "{n} blocked items",
    manageList: "Manage list",

    blockedPageTitle: "Site blocked",
    blockedTabTitle: "Blocked: {host}",
    blockedHeading: "This site is blocked",
    blockedYou: "You blocked",
    thisAddress: "this address",
    closeTab: "Close tab",
    quotes: [
      "Focus on what matters. You've got this!",
      "Small distractions add up to big delays.",
      "How about getting back to your task?",
      "Take a deep breath and keep going.",
      "Your future self will thank you.",
    ],

    contextBlock: "Block this site",
  },
};

export async function getLang() {
  try {
    const { lang } = await chrome.storage.local.get("lang");
    return LANGS.includes(lang) ? lang : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function setLang(lang) {
  return chrome.storage.local.set({ lang: LANGS.includes(lang) ? lang : DEFAULT_LANG });
}

/** Texto traduzido. Troca {nome} pelos valores em vars. */
export function t(lang, key, vars = {}) {
  const value = STRINGS[lang]?.[key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

/**
 * Aplica as traduções no HTML:
 *  data-i18n="chave"             → textContent
 *  data-i18n-html="chave"        → innerHTML (só para textos nossos com <code>)
 *  data-i18n-placeholder="chave" → placeholder
 *  data-i18n-title="chave"       → title
 *  <html data-i18n-doc-title="chave"> → document.title
 */
export function applyI18n(lang, root = document) {
  document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(lang, el.dataset.i18n)));
  root.querySelectorAll("[data-i18n-html]").forEach((el) => (el.innerHTML = t(lang, el.dataset.i18nHtml)));
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(lang, el.dataset.i18nPlaceholder)));
  root.querySelectorAll("[data-i18n-title]").forEach((el) => (el.title = t(lang, el.dataset.i18nTitle)));
  const docTitle = document.documentElement.dataset.i18nDocTitle;
  if (docTitle) document.title = t(lang, docTitle);
  // Marca o botão do idioma atual no seletor PT | EN.
  root.querySelectorAll(".lang-toggle button").forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

/** Liga os botões PT | EN de um seletor de idioma. */
export function bindLangToggle(root = document) {
  root.querySelectorAll(".lang-toggle button").forEach((b) => {
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });
}

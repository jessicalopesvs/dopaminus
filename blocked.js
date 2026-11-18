import { getLang, t, applyI18n } from "./i18n.js";

let host = null;
try {
  host = new URL(location.hash.slice(1)).hostname;
} catch {
  /* endereço desconhecido */
}

// Sorteia a frase uma vez; ao trocar de idioma mostra a mesma frase traduzida.
const quoteIndex = Math.floor(Math.random() * 5);

async function render() {
  const lang = await getLang();
  applyI18n(lang);
  document.getElementById("site").textContent = host
    ? host.replace(/^www\./, "")
    : t(lang, "thisAddress");
  if (host) document.title = t(lang, "blockedTabTitle", { host });
  const quotes = t(lang, "quotes");
  document.getElementById("quote").textContent = quotes[quoteIndex % quotes.length];
}

document.getElementById("closeTab").addEventListener("click", async () => {
  const tab = await chrome.tabs.getCurrent();
  chrome.tabs.remove(tab.id);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "lang" in changes) render();
});

render();

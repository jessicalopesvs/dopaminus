// Roda nas páginas do YouTube. Quando "Bloquear YouTube Shorts" está ligado,
// esconde as prateleiras, sugestões e atalhos de Shorts — o resto do YouTube continua normal.
// (Abrir um link /shorts/ é bloqueado pelo background e cai na tela de bloqueio.)

const STYLE_ID = "bloqueador-sites-hide-shorts";
const MARK = "data-bloqueador-shorts"; // marca elementos escondidos pela varredura em JS

const SHORTS_LINK = 'a[href*="/shorts/"]';

const CSS = `
  /* Prateleiras de Shorts (início, inscrições, pesquisa, página do vídeo) */
  ytd-reel-shelf-renderer,
  ytd-rich-shelf-renderer[is-shorts],
  ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
  ytd-rich-section-renderer:has(${SHORTS_LINK}),
  grid-shelf-view-model:has(${SHORTS_LINK}),
  ytm-reel-shelf-renderer,
  ytm-shorts-lockup-view-model,
  ytm-shorts-lockup-view-model-v2,
  ytd-reel-item-renderer,
  /* Vídeos soltos que são Shorts (inclui as sugestões ao lado/abaixo do vídeo) */
  yt-lockup-view-model:has(${SHORTS_LINK}),
  ytd-rich-item-renderer:has(${SHORTS_LINK}),
  ytd-video-renderer:has(${SHORTS_LINK}),
  ytd-grid-video-renderer:has(${SHORTS_LINK}),
  ytd-compact-video-renderer:has(${SHORTS_LINK}),
  /* Botão "Shorts" no menu lateral e no menu compacto */
  ytd-guide-entry-renderer:has(a[href^="/shorts"]),
  ytd-guide-entry-renderer:has(a[title="Shorts"]),
  ytd-mini-guide-entry-renderer:has(a[href^="/shorts"]),
  ytd-mini-guide-entry-renderer[aria-label="Shorts"],
  ytm-pivot-bar-item-renderer:has(.pivot-shorts),
  /* Aba "Shorts" na página de canais e filtro "Shorts" na pesquisa */
  yt-tab-shape[tab-title="Shorts"],
  tp-yt-paper-tab:has(a[href$="/shorts"]),
  yt-chip-cloud-chip-renderer:has(a[href*="/shorts"]),
  /* Itens marcados pela varredura em JS (abaixo) */
  [${MARK}] {
    display: none !important;
  }
`;

// Cartões que representam um único vídeo/Short.
const CARD = [
  "yt-lockup-view-model",
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-reel-item-renderer",
  "ytm-shorts-lockup-view-model-v2",
  "ytm-shorts-lockup-view-model",
].join(",");

// Prateleiras que só têm Shorts (somem inteiras). Em prateleiras mistas sai só o cartão.
const SHORTS_SHELF = [
  "grid-shelf-view-model",
  "ytd-reel-shelf-renderer",
  "ytd-rich-shelf-renderer[is-shorts]",
  "ytm-reel-shelf-renderer",
].join(",");

let active = false;
let scanTimer = null;

/** Segunda camada, em JS: pega Shorts que o CSS não alcança (layouts novos do YouTube). */
function scan() {
  scanTimer = null;
  if (!active) return;

  for (const a of document.querySelectorAll(SHORTS_LINK)) {
    if (a.closest(`[${MARK}]`)) continue;
    // Links do menu lateral são tratados pelo CSS.
    if (a.closest("ytd-guide-renderer, ytd-mini-guide-renderer")) continue;
    const target = a.closest(SHORTS_SHELF) || a.closest(CARD);
    if (target) target.setAttribute(MARK, "");
  }

  // Filtros (chips) e abas com o texto "Shorts", ex.: acima das sugestões do vídeo.
  for (const chip of document.querySelectorAll(
    "yt-chip-cloud-chip-renderer, chip-view-model, chip-shape, yt-tab-shape"
  )) {
    if (!chip.hasAttribute(MARK) && chip.textContent.trim().toLowerCase() === "shorts") {
      chip.setAttribute(MARK, "");
    }
  }
}

function scheduleScan() {
  if (active && !scanTimer) scanTimer = setTimeout(scan, 250);
}

const observer = new MutationObserver(scheduleScan);

function apply(hide) {
  active = hide;
  let style = document.getElementById(STYLE_ID);
  if (hide) {
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = CSS;
      (document.head || document.documentElement).append(style);
    }
    observer.observe(document.documentElement, { childList: true, subtree: true });
    scheduleScan();
  } else {
    observer.disconnect();
    style?.remove();
    document.querySelectorAll(`[${MARK}]`).forEach((el) => el.removeAttribute(MARK));
  }
}

async function update() {
  const { blockShorts = false, enabled = true } = await chrome.storage.local.get([
    "blockShorts",
    "enabled",
  ]);
  apply(blockShorts === true && enabled !== false);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && ("blockShorts" in changes || "enabled" in changes)) update();
});

// O YouTube troca de página sem recarregar; varre de novo a cada navegação interna.
document.addEventListener("yt-navigate-finish", scheduleScan);

update();

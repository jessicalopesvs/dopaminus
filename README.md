# Dopaminus – Site Blocker

A free, lightweight Chrome extension that blocks distracting websites, keywords and YouTube Shorts, so you can spend your attention on what actually matters.

*The name comes from **dopamine**, the chemical behind the "just one more scroll" feeling. Dopaminus is about having less of the cheap, instant kind.*

![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-red) ![Languages](https://img.shields.io/badge/languages-English%20%7C%20Portugu%C3%AAs-lightgrey) ![Price](https://img.shields.io/badge/price-free-brightgreen)

---

## Why I built this

Social media feeds, short videos and endless scrolling are designed to keep us hooked. Every notification, new post or 30-second clip gives the brain a small hit of **dopamine**. Over time, that constant stream of quick rewards makes it harder to focus on slower, deeper work like studying, writing or coding. Often we open a distracting site out of habit, without even deciding to.

I wanted a simple tool that **adds friction between me and those habits**. When I type a blocked address, I see a calm screen reminding me to get back to my task instead of the feed.

Many popular website blockers are **paid**, or keep their most useful features behind a subscription: keyword blocking, more sites on the list, blocking specific parts of a site. A browser extension that blocks a few websites shouldn't need a monthly fee, so **I decided to build my own** and make it free.



### The result

I used Claude Code to speed up development and shape the extension around my own needs when I noticed the demand, ending up with a tool that blocks exactly what distracts me. Since I installed it, my productivity has noticeably increased. I spend less time switching to social media “for just a minute”, I get through my tasks with fewer interruptions, and I no longer lose hours to short-video feeds. YouTube is still there for tutorials and long videos, but Shorts no longer pulls me into endless scrolling.

---

## Features

- **Block websites**: blocking a domain also blocks all its subdomains (`youtube.com` also blocks `m.youtube.com`).
- **Block keywords**: block any address that contains a word (e.g. `betting`, `gossip`).
- **On/off switch for each item**: pause a site temporarily without removing it from your list.
- **Block only YouTube Shorts**: keep regular YouTube available but block `/shorts`, and hide Shorts from:
  - the home page, search results and channel pages
  - the suggestions next to the video you're watching
  - the **Shorts** button in the sidebar
- **Calm block screen**: shows which site was blocked and a short motivational message, with a **Close tab** button.
- **Quick actions**: block or pause the current site from the toolbar popup, or right-click any page or link and choose **Block this site**.
- **Global switch**: turn all blocking on or off at once.
- **Hard to bypass**: blocks pages even when they're already open, reached with the Back button, or loaded inside single-page apps like X/Twitter and YouTube.
- **English and Portuguese**: switch with the **PT | EN** toggle.
- **Automatic dark mode**: follows your system theme.
- **100% private**: no account, no tracking, no servers. Everything stays in your browser.

---

## Installation

The extension is not on the Chrome Web Store yet. You can install it manually in under a minute:

1. Download this repository (**Code → Download ZIP**) and unzip it, or clone it:
   ```bash
   git clone https://github.com/jessicalopesvs/dopaminus.git
   ```
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right corner).
4. Click **Load unpacked** and select the project folder (the one that contains `manifest.json`).
5. Pin the extension: click the puzzle icon in the toolbar, then the pin next to **Dopaminus**.

The settings page opens automatically after the first install.

### Updating

After downloading a new version, go to `chrome://extensions` and click the reload button (↻) on the extension card. Your block list is kept.

---

## How to use

| I want to… | How |
|---|---|
| Block the site I'm on | Click the extension icon and choose **Block this site** |
| Block any site | Right-click the page or a link and choose **Block this site**, or add it in **Manage list** |
| Pause a site for a while | Turn off its switch in the settings, or click **Allow (pause)** in the popup |
| Block only YouTube Shorts | Settings, **Special blocks**, turn on **YouTube Shorts** |
| Block words in URLs | Settings, **Blocked keywords** |
| Turn everything off | Use the main switch in the popup or at the top of the settings |
| Change the language | Click **PT** or **EN** in the popup or the settings |

---

## Privacy

- Your block list and settings are stored **only in your browser** (`chrome.storage.local`).
- The extension sends **no data** anywhere: no analytics, no accounts, no external requests.

### Why it needs these permissions

| Permission | Why |
|---|---|
| `declarativeNetRequest` | Redirects blocked sites to the block screen before they load |
| `tabs` | Blocks tabs that are already open and pages reached with Back or loaded inside single-page apps |
| `storage` | Saves your block list and settings locally |
| `contextMenus` | Adds **Block this site** to the right-click menu |
| Access to all sites | Needed to block whichever sites *you* choose, and to hide Shorts on YouTube |

---

## How it works (technical overview)

Built with plain JavaScript on **Chrome Manifest V3**, with no frameworks and no build step.

- **First layer, network rules:** each blocked site or keyword becomes a `declarativeNetRequest` redirect rule, so Chrome itself sends the request to the block screen before the page loads.
- **Second layer, tab monitoring:** the service worker watches URL changes in tabs. This catches cases the network rules can't see, such as pages restored from the back/forward cache, pages served by a site's own service worker, and in-app navigation.
- **YouTube Shorts:** a content script injects CSS that hides Shorts shelves, cards, chips and the sidebar entry. A `MutationObserver` also hides any card that links to `/shorts/`, which keeps working when YouTube changes its layout.

```
├── manifest.json        # Extension configuration (Manifest V3)
├── background.js        # Service worker: blocking rules, tab monitoring, context menu
├── common.js            # Shared helpers: storage, URL matching
├── i18n.js              # English / Portuguese strings and language switcher
├── youtube-shorts.js    # Content script that hides Shorts on YouTube
├── popup.html / .js     # Toolbar popup
├── options.html / .js   # Settings page
├── blocked.html / .js   # Block screen
├── styles.css           # Shared styles (light and dark mode)
├── _locales/            # Extension name and description (en, pt_BR)
├── icons/               # Extension icons
└── make_icons.py        # Script that generates the icons (Python standard library only)
```

---

## Roadmap

Ideas for future versions:

- [ ] Password or timer before unblocking a site
- [ ] Schedules (for example, block social media during work hours)
- [ ] Statistics on how many times each site was blocked
- [ ] Publish on the Chrome Web Store

---

## Contributing

Suggestions and pull requests are welcome! If you find a site or YouTube layout where blocking doesn't work, please open an issue with a screenshot.

---

*Made to spend less time scrolling and more time doing.*

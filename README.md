# ⚡ Claude Quota Strip

A lightweight browser extension that tracks your Claude usage in real-time — session %, weekly %, reset timers, and turn count — injected directly above the claude.ai input box.

![Claude Quota Strip toolbar](https://img.shields.io/badge/version-0.1.0-orange) ![License](https://img.shields.io/badge/license-MIT-green) ![Chrome](https://img.shields.io/badge/Chrome-MV3-blue)

---

## What it looks like

The extension injects a persistent toolbar above the claude.ai message input:
⚡ | SESSION 60% ——— resets 2h 4m | WEEKLY 6% ——— resets 4d | 17 turns ⭐ Star | 🐛 Bug

And a popup when you click the extension icon showing per-session breakdowns with progress bars and reset timers.

---

## Features

- 📊 **Session usage %** with reset countdown
- 📅 **Weekly usage %** with reset countdown  
- 🔄 **Turn counter** per conversation
- 🌗 **Dark / light theme** auto-detection
- 📌 **Persistent toolbar** injected above the input box
- 🔒 **100% local** — no data leaves your browser

---

## Install from source (free)

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- Google Chrome

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Vydyam/claude-quota-strip.git
cd claude-quota-strip

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build
```

Then load into Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder inside the project
5. Visit [claude.ai](https://claude.ai) and start chatting

---

## Development

```bash
# Watch mode — rebuilds on every file save
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

### Project structure

<img width="533" height="413" alt="image" src="https://github.com/user-attachments/assets/178c8ade-98a7-4e3b-becc-f9f94e177f9c" />

### How it works

1. `injector.js` runs in the **MAIN world** and overrides `window.fetch` before claude.ai loads
2. It intercepts the SSE stream from `/api/organizations/.../completion`
3. The `message_limit` event in the stream contains session and weekly utilization data
4. Data is dispatched via a custom DOM event to `content-script.js`
5. The content script forwards it to the service worker for storage
6. The toolbar and popup update in real-time

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

Good first issues:
- [ ] Firefox support
- [ ] Export session history as CSV
- [ ] Configurable toolbar position
- [ ] Notifications when approaching limits

---

## License

MIT © [Vydyam](https://github.com/Vydyam)

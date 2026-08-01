# Contributing to Claude Token Tracker

Thanks for your interest! Here's how to get started.

## Setup

```bash
git clone https://github.com/Vydyam/claude-token-tracker.git
cd claude-token-tracker
npm install
npm run dev   # watch mode
```

Load the `dist/` folder as an unpacked extension in Chrome.

## Submitting changes

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Build: `npm run build`
5. Commit: `git commit -m "feat: describe your change"`
6. Push and open a Pull Request

## Reporting bugs

Use the 🐛 Bug button in the toolbar or open an issue on GitHub.
Include your Chrome version, OS, and steps to reproduce.

## Code style

- Vanilla JS only — no frameworks in content scripts
- Keep `injector.js` minimal and dependency-free
- Follow existing naming conventions
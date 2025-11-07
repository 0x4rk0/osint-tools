# Repository Guidelines

## Project Structure & Module Organization
- `public/arf.json` holds the hierarchical catalog rendered in the UI; edit nodes in place and keep indentation consistent with existing four-space blocks.
- Static assets live under `public/css`, `public/js`, and `public/js/vendor`; avoid adding build steps that require bundlers.
- `public/index.html` initializes the D3 tree; small behavioral tweaks belong in `public/js/app.js` while vendor updates go in `public/js/vendor`.
- Root-level `package.json` defines the lightweight tooling used solely for dependency vendoring and the local dev server.

## Build, Test, and Development Commands
- `npm install` installs `copyfiles` and pulls `d3` so postinstall can mirror `d3.min.js` into `public/js/vendor/d3`.
- `npm run start` serves `public/` via `python -m SimpleHTTPServer 8000`; open http://localhost:8000/ to verify UI changes.
- `npx copyfiles -f ./node_modules/d3/d3.min.js ./public/js/vendor/d3` refreshes the vendored bundle if you upgrade `d3`.

## Coding Style & Naming Conventions
- Favor plain ES5 JavaScript; avoid transpilers and keep functions small and descriptive (e.g., `buildCountryNode`).
- JSON entries use double quotes and trailing commas only where JSON allows; alphabetical ordering inside siblings keeps diffs reviewable.
- CSS follows the existing BEM-lite pattern (`.nav__item`); indent with two spaces in CSS/JS and four spaces in JSON for readability.

## Testing Guidelines
- No automated suite exists; manually reload the served site and expand nodes relevant to your change to ensure the tree renders without console errors.
- When editing `arf.json`, validate the file with `python -m json.tool public/arf.json` before committing.

## Commit & Pull Request Guidelines
- Follow the repository’s short, imperative commit style (e.g., `Update arf.json`, `Add files via upload`).
- Keep each commit focused on one resource group or UI tweak; include before/after screenshots when the tree layout changes.
- Pull requests must summarize the affected sections of `arf.json`, note any new external dependencies, and link related GitHub issues when applicable.

## Security & Data Hygiene
- Only add publicly accessible, free OSINT resources; verify URLs over HTTPS when available.
- Strip tracking parameters from links and avoid embedding secrets or API keys anywhere in the tree.

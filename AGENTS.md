# GLingo

Static React/Vite application published to GitHub Pages. Russian learner interface.

- Run `pnpm test` and `pnpm build` before publishing.
- Keep `base: '/GLingo/'` and resolve public assets through `asset()`.
- Navigation uses hash routes so reloading lessons works on GitHub Pages.
- Progress is private to the current browser's localStorage; do not add shared demo profiles.
- Do not commit browser data, credentials, `.env` files, `node_modules`, or `dist`.
- Preserve source-page references and task coverage when editing Spotlight vocabulary.
- Keep the upstream MIT copyright notice and textbook asset provenance.

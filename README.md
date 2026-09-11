# Managing Cultural Differences Study Hub

Files:
- `index.html` — the study website.
- `worker.js` — Cloudflare Worker that calls Groq and translates sections.
- `wrangler.jsonc` — Cloudflare Worker configuration.
- `package.json` — pinned Wrangler dependency for Cloudflare Builds.

Required Cloudflare secret: `GROQ_API_KEY`.

The website currently calls: `https://mcd-ai.dashti27.workers.dev`.
If your Worker URL differs, edit the `WORKER_URL` constant near the bottom of `index.html`.

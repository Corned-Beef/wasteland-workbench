# Wasteland Workbench (hosted)

Static build of the Wasteland & Wyverns engine's asset-inspector page,
published via GitHub Pages so the private `stream-pack` release can be
browsed from any device without downloading it.

- **This repo contains tool code only** — no game assets, no data, no
  secrets. The page is inert until a viewer supplies their own fine-grained
  GitHub token (Contents: Read-only on the private asset repo), which is
  stored only in that viewer's browser and sent only to `api.github.com`.
- Source of truth lives in the private engine repo
  (`apps/workbench`); this repo holds the built output. Don't edit here —
  changes get overwritten on the next sync.

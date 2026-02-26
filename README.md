# Project Dashboard (GitHub Pages + Cloudflare Access)

This is a static dashboard site:
- Kanban rendered from `data/tasks.json`
- Mermaid diagrams from `diagrams/*.mmd`

## Deploy
- Push to GitHub repo
- Enable GitHub Pages (main / root)

## Protect
Put Cloudflare Access (Google login + allowlist) in front of the Pages site.

## Update tasks
Edit `data/tasks.json` in a PR.

## Note
If you want the dashboard to pull from the Google Sheet automatically, we can add a CI job to export sheet -> JSON.

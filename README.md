<!--
  README.md
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Overview, prerequisites, build/test/lint instructions, deploy notes.
  Change log:
    2026-10-26  0.1.0  Initial README.
    2026-10-26  0.3.0  Deploy instructions.
    2026-10-26  0.5.0  HTTPS / Let's Encrypt section.
-->

# Framework_Website_HopemanHorde

Source for [HopemanHorde.com](https://hopemanhorde.com/), Ward Hopeman's
personal site. The top level is an About page with a GitHub link and a list
of projects; every page below the top level is project work.

The site is a [Hugo](https://gohugo.io/) static site with its own minimal
templates (no third-party theme).

## Layout

| Path                 | What it holds                                      |
| -------------------- | -------------------------------------------------- |
| `hugo.yaml`          | Site configuration                                 |
| `content/`           | Markdown pages (`_index.md` is the About text)     |
| `layouts/`           | Templates (`baseof`, `home`, `page`, `section`)    |
| `data/projects.yaml` | Registry of hosted projects shown on the home page |
| `static/`            | Files copied as-is (CSS, images)                   |
| `scripts/`           | Helper scripts (build, deploy)                     |
| `tests/`             | `node:test` smoke tests                            |

## Prerequisites

- Hugo **extended** 0.146 or newer (`winget install Hugo.Hugo.Extended`)
- Node.js 20+ (LTS) for lint and test tooling only
- Git

## Build manually

```sh
hugo                 # writes the site to public/
hugo server          # live preview at http://localhost:1313/
```

Or `npm run build`, which runs `hugo --gc --cleanDestinationDir`.

## Lint and test

```sh
npm install          # dev tooling only
npm run build        # tests check the built output
npm run lint         # markdownlint, yaml-lint, html-validate
npm test             # node:test smoke tests
```

## Adding a project

1. Add an entry to `data/projects.yaml` (`name`, `path`, `description`,
   optional `repo` and `status`).
2. Put the project's pages under `content/<project>/` (or its static build
   under `static/<project>/`) so it is served at `/<project>/`.
3. Build, lint, test, then deploy.

## Deploy

`scripts/deploy.ps1` builds, lints and tests the site, then uploads `public/`
to the GoDaddy cPanel account over SFTP using an SSH key. Credentials are
never stored in this repository.

One-time setup:

1. In cPanel, enable SSH access and add your public key under
   **SSH Access > Manage SSH Keys** (then **Authorize** it).
2. Copy `deploy.example.json` to `deploy.local.json` (gitignored) and fill
   in `host`, `port`, `user` (cPanel username), `keyPath` (private key) and
   `remotePath` (document root relative to home, usually `public_html`).
   Password fields are rejected by the script.

Run:

```sh
npm run deploy                 # dry run: checks + shows what would upload
npm run deploy -- -Execute     # real upload
```

Uploads add or overwrite files; nothing on the server is deleted.

## HTTPS

The hosting plan has no AutoSSL, so the certificate comes from
Let's Encrypt via [acme.sh](https://github.com/acmesh-official/acme.sh),
installed in the hosting account at `~/.acme.sh`:

- Covers `hopemanhorde.com` and `www.hopemanhorde.com` (webroot validation
  through `public_html`).
- A daily cron job renews it about every 60 days and reinstalls it in
  cPanel with the `cpanel_uapi` deploy hook.
- `static/.htaccess` redirects HTTP to HTTPS but leaves
  `/.well-known/acme-challenge/` alone so renewals can validate.

Check status over SSH: `~/.acme.sh/acme.sh --list`.
Force a renewal: `~/.acme.sh/acme.sh --renew -d hopemanhorde.com --ecc --force`.

## License

[MIT](LICENSE)

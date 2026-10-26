<!--
  CHANGELOG.md
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Release history, following Keep a Changelog and SemVer.
  Change log:
    2026-10-26  0.1.0  Created.
    2026-10-26  0.2.0  Added 0.2.0 entry.
    2026-10-26  0.3.0  Added 0.3.0 entry.
    2026-10-26  0.4.0  Added 0.4.0 entry.
    2026-10-26  0.4.1  Added 0.4.1 entry.
    2026-10-26  0.5.0  Added 0.5.0 entry.
-->

# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [0.5.0] - 2026-10-26

### Added

- HTTPS for `hopemanhorde.com` and `www.hopemanhorde.com` with a free
  Let's Encrypt certificate, issued by acme.sh in the hosting account and
  installed through cPanel (`cpanel_uapi` deploy hook). A daily cron job
  renews it about every 60 days and reinstalls it automatically.

### Changed

- `static/.htaccess`: HTTP now redirects to HTTPS (301), except
  `/.well-known/acme-challenge/` so certificate renewals keep validating.

## [0.4.1] - 2026-10-26

### Fixed

- Missing pages showed GoDaddy's 404: cPanel serves `404.shtml` and ignores
  the `.htaccess` ErrorDocument, so `scripts/deploy.ps1` now also uploads
  the 404 page as `404.shtml`.

### Removed

- GoDaddy placeholder files on the server (`home.html`,
  `layout-styles.css`, old `404.shtml`); backed up locally first.

## [0.4.0] - 2026-10-26

### Added

- Custom 404 page (`layouts/404.html`), replacing GoDaddy's default.
- `static/.htaccess`: `index.html` as default page, custom 404, no
  directory listings, and an HTTPS redirect prepared but disabled until a
  trusted certificate is installed.

### Changed

- Ward's own bio in `content/_index.md`.
- `scripts/deploy.ps1` now uploads top-level dotfiles such as `.htaccess`
  (sftp's `*` glob skips them).

## [0.3.0] - 2026-10-26

### Added

- `scripts/deploy.ps1`: build, lint, test, then SFTP upload of `public/` to
  cPanel. Dry run by default; `-Execute` uploads. Key-based auth only;
  config fields named like passwords/secrets/tokens are refused;
  `remotePath` must be relative with no `..`.
- `deploy.example.json` template; `deploy.local.json` is gitignored.
- `npm run deploy` script and `tests/deploy.test.mjs` safety tests.

## [0.2.0] - 2026-10-26

### Added

- About section with a placeholder bio (`content/_index.md`) to edit.
- Prominent GitHub button linking to github.com/whopeman.
- Project cards (name, description, link to the project path, optional
  status and source link) rendered from `data/projects.yaml`.
- Empty-state message when no projects are listed.
- `tests/home.test.mjs`: builds fixture sites to test cards and empty state.

## [0.1.0] - 2026-10-26

### Added

- Hugo site scaffold with own minimal templates.
- Home page with About text, GitHub link and project list from
  `data/projects.yaml`.
- Lint (markdownlint-cli2, yaml-lint, html-validate) and `node:test` tests.
- README, CONTRIBUTING, MIT LICENSE, `.editorconfig`, `.gitignore`, VERSION.

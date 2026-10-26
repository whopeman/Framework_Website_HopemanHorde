<!--
  CHANGELOG.md
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Release history, following Keep a Changelog and SemVer.
  Change log:
    2026-10-26  0.1.0  Created.
    2026-10-26  0.2.0  Added 0.2.0 entry.
-->

# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

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

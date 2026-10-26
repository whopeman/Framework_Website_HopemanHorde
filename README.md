<!--
  README.md
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Overview, prerequisites, build/test/lint instructions, deploy notes.
  Change log:
    2026-10-26  0.1.0  Initial README.
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

## Deploy overview

The built `public/` directory is uploaded to the GoDaddy cPanel hosting
account's document root for HopemanHorde.com. Deployment automation is
planned for a later step; credentials are never stored in this repository.

## License

[MIT](LICENSE)

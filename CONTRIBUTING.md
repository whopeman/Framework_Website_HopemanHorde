<!--
  CONTRIBUTING.md
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : How to make and submit changes to this site.
  Change log:
    2026-10-26  0.1.0  Initial guidelines.
-->

# Contributing

## Workflow

1. Branch from `main`.
2. Write or update a test in `tests/` first, then make the change.
3. Run `npm run build`, `npm run lint` and `npm test`; all must pass.
4. Update `CHANGELOG.md` and, for a release, `VERSION` and `package.json`.
5. Commit with a message prefixed `Framework_Website_HopemanHorde:`.

## Conventions

- Every authored file starts with a header comment: purpose/usage,
  parameters, project name, date and a change log section.
- No third-party Hugo theme; templates live in `layouts/`.
- Dev dependencies must be MIT, Apache-2.0, ISC or similarly permissive.
- Never commit credentials, keys, `.env` files or the `public/` output.

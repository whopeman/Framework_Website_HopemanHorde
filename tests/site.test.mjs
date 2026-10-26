/*
  tests/site.test.mjs
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Smoke tests for the built site and the project registry.
  Usage   : npm run build && npm test   (runs via node:test)
  Change log:
    2026-10-26  0.1.0  Initial tests: index.html exists with GitHub link;
                       data/projects.yaml parses as a list.
    2026-10-26  0.4.0  404 page and .htaccess tests.
    2026-10-26  0.5.0  HTTPS redirect test (ACME challenges exempt).
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('built site has public/index.html', () => {
  const index = join(root, 'public', 'index.html');
  assert.ok(existsSync(index), 'public/index.html missing - run `npm run build` first');
});

test('home page links to the GitHub profile', () => {
  const html = readFileSync(join(root, 'public', 'index.html'), 'utf8');
  assert.match(html, /href="https:\/\/github\.com\/whopeman"/);
});

test('data/projects.yaml parses as a list', () => {
  const projects = parse(readFileSync(join(root, 'data', 'projects.yaml'), 'utf8'));
  assert.ok(Array.isArray(projects), 'projects.yaml must be a YAML list');
});

test('every project entry has name, path and description', () => {
  const projects = parse(readFileSync(join(root, 'data', 'projects.yaml'), 'utf8'));
  for (const p of projects) {
    for (const key of ['name', 'path', 'description']) {
      assert.ok(p[key], `project ${JSON.stringify(p)} is missing "${key}"`);
    }
  }
});

test('built site has a 404 page that links home', () => {
  const page = join(root, 'public', '404.html');
  assert.ok(existsSync(page), 'public/404.html missing');
  assert.match(readFileSync(page, 'utf8'), /href="\/"/);
});

test('built site ships an .htaccess using the 404 page', () => {
  const file = join(root, 'public', '.htaccess');
  assert.ok(existsSync(file), 'public/.htaccess missing');
  assert.match(readFileSync(file, 'utf8'), /^ErrorDocument 404 \/404\.html$/m);
});

test('.htaccess redirects http to https but not ACME challenges', () => {
  const ht = readFileSync(join(root, 'public', '.htaccess'), 'utf8');
  const live = ht.split(/\r?\n/).filter((l) => !l.trim().startsWith('#')).join('\n');
  assert.match(live, /^RewriteEngine On$/m);
  assert.match(live, /^RewriteCond %\{HTTPS\} off$/m);
  assert.match(live, /^RewriteRule \^ https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\} \[L,R=301\]$/m);
  const acme = live.indexOf('RewriteCond %{REQUEST_URI} !^/\\.well-known/acme-challenge/');
  assert.ok(acme >= 0, 'ACME challenge exclusion missing');
  assert.ok(acme < live.indexOf('RewriteRule'), 'ACME exclusion must precede the redirect rule');
});

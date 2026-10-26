/*
  tests/site.test.mjs
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Smoke tests for the built site and the project registry.
  Usage   : npm run build && npm test   (runs via node:test)
  Change log:
    2026-10-26  0.1.0  Initial tests: index.html exists with GitHub link;
                       data/projects.yaml parses as a list.
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

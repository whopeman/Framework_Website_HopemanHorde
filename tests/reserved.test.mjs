/*
  tests/reserved.test.mjs
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Keep hosted projects and the main site from colliding under
            public_html: main-site folders must be reserved, and registered
            project slugs must be valid and unreserved.
  Usage   : npm run build && npm test
  Change log:
    2026-10-26  0.6.0  Initial reserved-path tests.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reserved = JSON.parse(readFileSync(join(root, 'scripts', 'reserved-slugs.json'), 'utf8')).reserved;
const projects = parse(readFileSync(join(root, 'data', 'projects.yaml'), 'utf8'));

test('reserved list covers server-owned paths', () => {
  for (const name of ['css', 'cgi-bin', '.well-known', 'hopemanhorde.com']) {
    assert.ok(reserved.includes(name), `${name} must be reserved`);
  }
});

test('every top-level folder the main site builds is reserved', () => {
  const dirs = readdirSync(join(root, 'public'), { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);
  for (const d of dirs) {
    assert.ok(reserved.includes(d), `public/${d}/ would collide with a project slug; add it to reserved-slugs.json`);
  }
});

test('registered projects use valid, unreserved, unique slugs', () => {
  const seen = new Set();
  for (const p of projects) {
    const m = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/.exec(p.path);
    assert.ok(m, `project path "${p.path}" must look like /<slug>/`);
    assert.ok(!reserved.includes(m[1]), `project slug "${m[1]}" is reserved`);
    assert.ok(!seen.has(m[1]), `duplicate project slug "${m[1]}"`);
    seen.add(m[1]);
  }
});

/*
  tests/new-project.test.mjs
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Tests for scripts/new-project.ps1: slug/field validation,
            registry update and optional project scaffolding. Every case
            works on a temp copy of data/projects.yaml.
  Usage   : npm test   (Windows PowerShell required)
  Change log:
    2026-10-26  0.6.0  Initial tests.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts', 'new-project.ps1');

function withTempData(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'hh-newproj-'));
  const data = join(dir, 'projects.yaml');
  copyFileSync(join(root, 'data', 'projects.yaml'), data);
  try { return fn(dir, data); } finally { rmSync(dir, { recursive: true, force: true }); }
}

function run(data, args) {
  const r = spawnSync('powershell', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', script, '-DataPath', data, ...args,
  ], { encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

const base = ['-Name', 'Demo Project', '-Description', 'A demo: with "quotes".'];

test('valid project is appended to the registry', () => withTempData((dir, data) => {
  const r = run(data, ['-Slug', 'demo-1', ...base, '-Repo', 'https://github.com/whopeman/demo', '-Status', 'active']);
  assert.equal(r.status, 0, r.out);
  const list = parse(readFileSync(data, 'utf8'));
  assert.deepEqual(list, [{
    name: 'Demo Project', path: '/demo-1/', description: 'A demo: with "quotes".',
    repo: 'https://github.com/whopeman/demo', status: 'active',
  }]);
  assert.match(readFileSync(data, 'utf8'), /^# data\/projects\.yaml/m, 'header comment kept');
}));

test('second project is appended after the first', () => withTempData((dir, data) => {
  assert.equal(run(data, ['-Slug', 'alpha', ...base]).status, 0);
  assert.equal(run(data, ['-Slug', 'beta', ...base]).status, 0);
  assert.deepEqual(parse(readFileSync(data, 'utf8')).map((p) => p.path), ['/alpha/', '/beta/']);
}));

test('invalid or reserved slugs are rejected', () => withTempData((dir, data) => {
  const before = readFileSync(data, 'utf8');
  for (const slug of ['Demo', 'under_score', '-lead', 'trail-', 'a--b', 'css', 'cgi-bin',
    '.well-known', 'hopemanhorde.com', 'x'.repeat(41), '']) {
    const r = run(data, ['-Slug', slug, ...base]);
    assert.notEqual(r.status, 0, `accepted slug "${slug}"`);
  }
  assert.equal(readFileSync(data, 'utf8'), before, 'registry must be unchanged');
}));

test('duplicate slug is rejected', () => withTempData((dir, data) => {
  assert.equal(run(data, ['-Slug', 'demo', ...base]).status, 0);
  const r = run(data, ['-Slug', 'demo', ...base]);
  assert.notEqual(r.status, 0);
  assert.match(r.out, /already/i);
}));

test('missing name or description, bad repo or status are rejected', () => withTempData((dir, data) => {
  assert.notEqual(run(data, ['-Slug', 'a', '-Description', 'd']).status, 0);
  assert.notEqual(run(data, ['-Slug', 'a', '-Name', 'n']).status, 0);
  assert.notEqual(run(data, ['-Slug', 'a', ...base, '-Repo', 'http://example.com/x']).status, 0);
  assert.notEqual(run(data, ['-Slug', 'a', ...base, '-Status', 'bogus']).status, 0);
  assert.deepEqual(parse(readFileSync(data, 'utf8')), []);
}));

test('-ScaffoldPath creates a starter project wired to public_html/<slug>', () => withTempData((dir, data) => {
  const target = join(dir, 'demo-site');
  const r = run(data, ['-Slug', 'demo-site', ...base, '-ScaffoldPath', target]);
  assert.equal(r.status, 0, r.out);
  for (const f of ['README.md', 'index.html', 'deploy.example.json', '.gitignore']) {
    assert.ok(existsSync(join(target, f)), `${f} missing`);
  }
  const index = readFileSync(join(target, 'index.html'), 'utf8');
  assert.match(index, /<title>Demo Project<\/title>/);
  assert.doesNotMatch(index, /\{\{[A-Z_]+\}\}/, 'placeholders left unreplaced');
  const cfg = JSON.parse(readFileSync(join(target, 'deploy.example.json'), 'utf8'));
  assert.equal(cfg.slug, 'demo-site');
  assert.equal(cfg.remotePath, 'public_html/demo-site');
  assert.match(readFileSync(join(target, '.gitignore'), 'utf8'), /^deploy\.local\.json$/m);
}));

test('-ScaffoldPath refuses a non-empty folder', () => withTempData((dir, data) => {
  const r = run(data, ['-Slug', 'demo', ...base, '-ScaffoldPath', dir]);
  assert.notEqual(r.status, 0);
  assert.deepEqual(parse(readFileSync(data, 'utf8')), [], 'registry must be unchanged');
}));

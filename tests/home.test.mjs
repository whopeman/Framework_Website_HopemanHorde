/*
  tests/home.test.mjs
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Home page behaviour: About section, prominent GitHub link,
            project cards from data/projects.yaml and the empty state.
  Usage   : npm test   (needs `hugo` on PATH, or HUGO=<path to hugo.exe>)
  Notes   : Each case copies the site into a temp dir with a fixture
            projects.yaml and builds it there, so the real data is untouched.
  Change log:
    2026-10-26  0.2.0  Initial home page tests.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hugo = process.env.HUGO || 'hugo';

function buildWith(projectsYaml) {
  const dir = mkdtempSync(join(tmpdir(), 'hh-site-'));
  for (const p of ['hugo.yaml', 'content', 'layouts', 'static']) {
    cpSync(join(root, p), join(dir, p), { recursive: true });
  }
  cpSync(join(root, 'data'), join(dir, 'data'), { recursive: true });
  writeFileSync(join(dir, 'data', 'projects.yaml'), projectsYaml);
  const r = spawnSync(hugo, ['--quiet', '--source', dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, `hugo failed: ${r.error ?? r.stderr}`);
  const html = readFileSync(join(dir, 'public', 'index.html'), 'utf8');
  rmSync(dir, { recursive: true, force: true });
  return html;
}

const twoProjects = `
- name: Alpha Tool
  path: /alpha/
  description: First sample project.
  repo: https://github.com/whopeman/alpha
  status: active
- name: Beta Site
  path: /beta/
  description: Second sample project.
`;

test('About section has a heading and bio text', () => {
  const html = buildWith('[]\n');
  assert.match(html, /<section id="about"[^>]*>[\s\S]*<h1>About<\/h1>/);
  assert.match(html, /class="bio"/);
});

test('prominent GitHub link points to github.com/whopeman', () => {
  const html = buildWith('[]\n');
  assert.match(html, /<a class="github-link"[^>]*href="https:\/\/github\.com\/whopeman"/);
});

test('empty project list shows the empty-state message', () => {
  const html = buildWith('[]\n');
  assert.match(html, /class="empty-state"/);
  assert.doesNotMatch(html, /class="project-card"/);
});

test('each project renders as a card linking to its path', () => {
  const html = buildWith(twoProjects);
  assert.equal((html.match(/class="project-card"/g) || []).length, 2);
  assert.match(html, /href="\/alpha\/"[^>]*>Alpha Tool</);
  assert.match(html, /href="\/beta\/"[^>]*>Beta Site</);
  assert.match(html, /First sample project\./);
  assert.match(html, /href="https:\/\/github\.com\/whopeman\/alpha"/);
  assert.doesNotMatch(html, /class="empty-state"/);
});

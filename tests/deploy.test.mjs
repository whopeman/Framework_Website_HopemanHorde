/*
  tests/deploy.test.mjs
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Safety tests for scripts/deploy.ps1 and its config files.
            Never contacts a server: every run here is a dry run or is
            expected to fail validation before any upload.
  Usage   : npm test   (Windows PowerShell required)
  Change log:
    2026-10-26  0.3.0  Initial deploy tests.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts', 'deploy.ps1');
const REQUIRED = ['host', 'port', 'user', 'keyPath', 'remotePath'];

function runDeploy(config, extraArgs = []) {
  const dir = mkdtempSync(join(tmpdir(), 'hh-deploy-'));
  const keyPath = join(dir, 'dummy_key');
  writeFileSync(keyPath, 'not a real key');
  const cfgPath = join(dir, 'deploy.test.json');
  writeFileSync(cfgPath, JSON.stringify({ keyPath, ...config }));
  const r = spawnSync('powershell', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', script, '-ConfigPath', cfgPath, '-SkipChecks', ...extraArgs,
  ], { encoding: 'utf8' });
  rmSync(dir, { recursive: true, force: true });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

const good = { host: 'example.invalid', port: 22, user: 'demo', remotePath: 'public_html' };

test('deploy.example.json has every required key and no secrets', () => {
  const cfg = JSON.parse(readFileSync(join(root, 'deploy.example.json'), 'utf8'));
  for (const k of REQUIRED) assert.ok(k in cfg, `missing ${k}`);
  for (const k of Object.keys(cfg)) assert.doesNotMatch(k, /pass|secret|token/i);
});

test('deploy.local.json is ignored by git', () => {
  const r = spawnSync('git', ['check-ignore', '-q', 'deploy.local.json'], { cwd: root });
  assert.equal(r.status, 0, 'deploy.local.json must be gitignored');
});

test('default run is a dry run and uploads nothing', () => {
  const { status, out } = runDeploy(good);
  assert.equal(status, 0, out);
  assert.match(out, /DRY RUN/);
  assert.match(out, /cd "public_html"/);
  assert.doesNotMatch(out, /Uploading/);
});

test('config with a password field is rejected', () => {
  const { status, out } = runDeploy({ ...good, password: 'x' });
  assert.notEqual(status, 0);
  assert.match(out, /password/i);
  assert.doesNotMatch(out, /DRY RUN/);
});

test('config missing a required key is rejected', () => {
  const { host, ...noHost } = good;
  const { status, out } = runDeploy(noHost);
  assert.notEqual(status, 0);
  assert.match(out, /host/);
});

test('remotePath must be relative and not escape the home dir', () => {
  for (const remotePath of ['/', '/home/x/public_html', '../other', '']) {
    const { status } = runDeploy({ ...good, remotePath });
    assert.notEqual(status, 0, `accepted remotePath "${remotePath}"`);
  }
});

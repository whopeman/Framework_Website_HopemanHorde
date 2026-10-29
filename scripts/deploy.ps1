<#
  scripts/deploy.ps1
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Build, lint and test the site, then upload public/ to the
            GoDaddy cPanel account over SFTP (key-based auth only).
            Also deploys a hosted project into public_html/<slug>/ when the
            config has a "slug" key (project mode).
  Usage   : npm run deploy                 # dry run: shows what would happen
            npm run deploy -- -Execute     # real upload
            npm run deploy -- -ConfigPath ../my-tool/deploy.local.json   # project
            powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy.ps1 [params]
  Params  :
    -ConfigPath  Local config JSON (default: deploy.local.json, gitignored).
                 Keys: host, port, user, keyPath, remotePath
                 (see deploy.example.json). Password fields are refused.
                 Project mode adds: slug, sourceDir (folder to upload,
                 relative to the config file); remotePath must then be
                 exactly public_html/<slug>, and the main-site build is skipped.
    -SkipChecks  Skip the build/lint/test step (uses the existing public/).
    -Execute     Actually upload. Without it the script is a dry run.
  Notes   : Only SFTP is implemented. remotePath is relative to the cPanel
            home directory (e.g. public_html) and may not contain "..".
            Uploads add/overwrite files; nothing on the server is deleted.
  Change log:
    2026-10-26  0.3.0  Initial SFTP deploy script with dry-run default.
    2026-10-26  0.4.0  Upload top-level dotfiles (.htaccess).
    2026-10-26  0.4.1  Also upload the 404 page as 404.shtml.
    2026-10-26  0.6.0  Project mode (slug + sourceDir -> public_html/<slug>).
    2026-10-27  0.6.1  Create top-level remote folders before "put -r *"
                       (OpenSSH sftp does not, so subfolder uploads failed).
#>
param(
  [string]$ConfigPath = 'deploy.local.json',
  [switch]$SkipChecks,
  [switch]$Execute
)
$ErrorActionPreference = 'Stop'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..')
if (Test-Path $ConfigPath) { $ConfigPath = (Resolve-Path $ConfigPath).Path }
Set-Location $repo

function Fail([string]$msg) {
  Write-Error "deploy: $msg" -ErrorAction Continue
  exit 1
}

# --- Load and validate config ------------------------------------------------
if (-not (Test-Path $ConfigPath)) {
  Fail "config '$ConfigPath' not found. Copy deploy.example.json to deploy.local.json and fill it in."
}
$cfg = Get-Content -Raw $ConfigPath | ConvertFrom-Json
$keys = @($cfg.PSObject.Properties.Name)

$secretKeys = $keys | Where-Object { $_ -match 'pass|secret|token' }
if ($secretKeys) {
  Fail "config contains '$($secretKeys -join ', ')'. Passwords are not supported; use an SSH key (keyPath)."
}
foreach ($k in 'host', 'port', 'user', 'keyPath', 'remotePath') {
  if ($keys -notcontains $k -or [string]::IsNullOrWhiteSpace([string]$cfg.$k)) {
    Fail "config is missing required key '$k'."
  }
}
if ($keys -contains 'protocol' -and $cfg.protocol -ne 'sftp') {
  Fail "protocol '$($cfg.protocol)' is not supported; only 'sftp' is implemented."
}
$remotePath = [string]$cfg.remotePath
if ($remotePath -match '^[/\\]' -or $remotePath -match '(^|[/\\])\.\.([/\\]|$)' -or $remotePath -match '^[A-Za-z]:') {
  Fail "remotePath '$remotePath' must be relative to the home directory and must not contain '..'."
}
$isProject = $keys -contains 'slug'
if ($isProject) {
  $slug = [string]$cfg.slug
  $reserved = (Get-Content -Raw (Join-Path $PSScriptRoot 'reserved-slugs.json') | ConvertFrom-Json).reserved
  if ($slug -cnotmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or $slug.Length -gt 40 -or $reserved -contains $slug) {
    Fail "slug '$slug' is invalid or reserved."
  }
  if ($remotePath -cne "public_html/$slug") {
    Fail "project remotePath must be exactly 'public_html/$slug', not '$remotePath'."
  }
  if ([string]::IsNullOrWhiteSpace([string]$cfg.sourceDir)) { Fail 'project config is missing sourceDir.' }
  $source = [string]$cfg.sourceDir
  if (-not [IO.Path]::IsPathRooted($source)) { $source = Join-Path (Split-Path $ConfigPath) $source }
  if (-not (Test-Path (Join-Path $source 'index.html'))) {
    Fail "sourceDir '$source' has no index.html; build the project first."
  }
  $source = (Resolve-Path $source).Path
} else {
  $source = 'public'
}
if (-not (Test-Path $cfg.keyPath)) {
  Fail "SSH key not found at keyPath '$($cfg.keyPath)'."
}
$port = [int]$cfg.port
$target = "$($cfg.user)@$($cfg.host)"

# --- Build, lint, test -------------------------------------------------------
if ($isProject) {
  Write-Output "Project mode: $source -> $remotePath (main-site build skipped; run the project's own checks first)."
} elseif (-not $SkipChecks) {
  & (Join-Path $PSScriptRoot 'build.ps1')
  if (-not $?) { Fail 'build/lint/test failed; nothing uploaded.' }
}

# --- Upload ------------------------------------------------------------------
$batch = @(
  "-mkdir `"$remotePath`""
  "cd `"$remotePath`""
  "lcd `"$($source -replace '\\', '/')`""
)
# OpenSSH's "put -r *" does not create the remote folder for each matched
# directory, so make the top-level ones first (deeper levels are created by put -r).
if (Test-Path $source) {
  Get-ChildItem -Path $source -Directory |
    ForEach-Object { $batch += "-mkdir `"$($_.Name)`"" }
}
$batch += 'put -r *'
# sftp's * glob skips dotfiles, so upload top-level ones (e.g. .htaccess) by name.
if (Test-Path $source) {
  Get-ChildItem -Path $source -Force -File -Filter '.*' |
    ForEach-Object { $batch += "put `"$($_.Name)`"" }
}
# cPanel's server config serves 404.shtml for missing pages and ignores the
# .htaccess ErrorDocument, so publish the main site's 404 page under that name.
if (-not $isProject -and (Test-Path 'public/404.html')) { $batch += 'put "404.html" "404.shtml"' }
$batch += 'bye'

if (-not $Execute) {
  Write-Output 'DRY RUN - nothing will be uploaded. Re-run with -Execute to deploy.'
  Write-Output "Target : sftp://$target`:$port"
  Write-Output 'Batch  :'
  $batch | ForEach-Object { Write-Output "  $_" }
  if (-not (Test-Path (Join-Path $source 'index.html'))) {
    Write-Output "Note   : $source/index.html does not exist yet; run a build first."
  }
  exit 0
}

if (-not (Test-Path (Join-Path $source 'index.html'))) { Fail "$source/index.html missing; build first." }

$batchFile = New-TemporaryFile
try {
  Set-Content -Path $batchFile -Value $batch -Encoding ascii
  Write-Output "Uploading $source to $target`:$remotePath ..."
  & sftp -b $batchFile -i $cfg.keyPath -P $port `
    -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new $target
  if ($LASTEXITCODE -ne 0) { Fail "sftp exited with code $LASTEXITCODE." }
  Write-Output 'Deploy complete.'
} finally {
  Remove-Item $batchFile -ErrorAction SilentlyContinue
}

<#
  scripts/deploy.ps1
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Build, lint and test the site, then upload public/ to the
            GoDaddy cPanel account over SFTP (key-based auth only).
  Usage   : npm run deploy                 # dry run: shows what would happen
            npm run deploy -- -Execute     # real upload
            powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy.ps1 [params]
  Params  :
    -ConfigPath  Local config JSON (default: deploy.local.json, gitignored).
                 Keys: host, port, user, keyPath, remotePath
                 (see deploy.example.json). Password fields are refused.
    -SkipChecks  Skip the build/lint/test step (uses the existing public/).
    -Execute     Actually upload. Without it the script is a dry run.
  Notes   : Only SFTP is implemented. remotePath is relative to the cPanel
            home directory (e.g. public_html) and may not contain "..".
            Uploads add/overwrite files; nothing on the server is deleted.
  Change log:
    2026-10-26  0.3.0  Initial SFTP deploy script with dry-run default.
    2026-10-26  0.4.0  Upload top-level dotfiles (.htaccess).
#>
param(
  [string]$ConfigPath = 'deploy.local.json',
  [switch]$SkipChecks,
  [switch]$Execute
)
$ErrorActionPreference = 'Stop'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..')
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
if (-not (Test-Path $cfg.keyPath)) {
  Fail "SSH key not found at keyPath '$($cfg.keyPath)'."
}
$port = [int]$cfg.port
$target = "$($cfg.user)@$($cfg.host)"

# --- Build, lint, test -------------------------------------------------------
if (-not $SkipChecks) {
  & (Join-Path $PSScriptRoot 'build.ps1')
  if (-not $?) { Fail 'build/lint/test failed; nothing uploaded.' }
}

# --- Upload ------------------------------------------------------------------
$batch = @(
  "-mkdir `"$remotePath`""
  "cd `"$remotePath`""
  "lcd `"public`""
  'put -r *'
)
# sftp's * glob skips dotfiles, so upload top-level ones (e.g. .htaccess) by name.
if (Test-Path 'public') {
  Get-ChildItem -Path 'public' -Force -File -Filter '.*' |
    ForEach-Object { $batch += "put `"$($_.Name)`"" }
}
$batch += 'bye'

if (-not $Execute) {
  Write-Output 'DRY RUN - nothing will be uploaded. Re-run with -Execute to deploy.'
  Write-Output "Target : sftp://$target`:$port"
  Write-Output 'Batch  :'
  $batch | ForEach-Object { Write-Output "  $_" }
  if (-not (Test-Path 'public/index.html')) {
    Write-Output 'Note   : public/index.html does not exist yet; run a build first.'
  }
  exit 0
}

if (-not (Test-Path 'public/index.html')) { Fail 'public/index.html missing; build first.' }

$batchFile = New-TemporaryFile
try {
  Set-Content -Path $batchFile -Value $batch -Encoding ascii
  Write-Output "Uploading public/ to $target`:$remotePath ..."
  & sftp -b $batchFile -i $cfg.keyPath -P $port `
    -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new $target
  if ($LASTEXITCODE -ne 0) { Fail "sftp exited with code $LASTEXITCODE." }
  Write-Output 'Deploy complete.'
} finally {
  Remove-Item $batchFile -ErrorAction SilentlyContinue
}

<#
  scripts/new-project.ps1
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Register a new project hosted at https://hopemanhorde.com/<slug>/
            in data/projects.yaml, and optionally scaffold its starter folder
            from templates/project/.
  Usage   : npm run new-project -- -Slug my-tool -Name "My Tool" -Description "What it does"
            npm run new-project -- -Slug my-tool -Name "My Tool" -Description "..." `
              -Repo https://github.com/whopeman/my-tool -Status active -ScaffoldPath ..\my-tool
  Params  :
    -Slug          URL folder: lowercase a-z, 0-9 and single hyphens, max 40
                   chars, not listed in scripts/reserved-slugs.json. Required.
    -Name          Display name. Required.
    -Description   One-line summary. Required.
    -Repo          Optional https:// URL of the project's repository.
    -Status        Optional: active, wip or archived.
    -ScaffoldPath  Optional folder to create the starter project in (must be
                   missing or empty).
    -DataPath      Registry file (default data/projects.yaml; used by tests).
  Notes   : Validation and scaffolding happen before the registry is written,
            so a failed run leaves data/projects.yaml unchanged.
  Change log:
    2026-10-26  0.6.0  Initial version.
#>
param(
  [string]$Slug,
  [string]$Name,
  [string]$Description,
  [string]$Repo,
  [string]$Status,
  [string]$ScaffoldPath,
  [string]$DataPath
)
$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
if (-not $DataPath) { $DataPath = Join-Path $repoRoot 'data/projects.yaml' }

function Fail([string]$msg) {
  Write-Error "new-project: $msg" -ErrorAction Continue
  exit 1
}

# --- Validate ----------------------------------------------------------------
$reserved = (Get-Content -Raw (Join-Path $PSScriptRoot 'reserved-slugs.json') | ConvertFrom-Json).reserved
if ($Slug -cnotmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or $Slug.Length -gt 40) {
  Fail "slug '$Slug' must be lowercase a-z, 0-9 and single hyphens (max 40 chars)."
}
if ($reserved -contains $Slug) { Fail "slug '$Slug' is reserved by the main site or the server." }
if ([string]::IsNullOrWhiteSpace($Name)) { Fail '-Name is required.' }
if ([string]::IsNullOrWhiteSpace($Description)) { Fail '-Description is required.' }
if ($Repo -and $Repo -notmatch '^https://\S+$') { Fail "-Repo must be an https:// URL." }
if ($Status -and @('active', 'wip', 'archived') -notcontains $Status) {
  Fail "-Status must be active, wip or archived."
}

$yaml = [IO.File]::ReadAllText($DataPath)
$body = ($yaml -split "`n" | Where-Object { $_ -notmatch '^\s*#' }) -join "`n"
if ($body -match "(?m)^\s*-?\s*path:\s*[`"']?/$([regex]::Escape($Slug))/[`"']?\s*$") {
  Fail "slug '$Slug' is already registered in $DataPath."
}

# --- Scaffold (optional) -----------------------------------------------------
if ($ScaffoldPath) {
  if ((Test-Path $ScaffoldPath) -and (Get-ChildItem -Force $ScaffoldPath | Select-Object -First 1)) {
    Fail "scaffold folder '$ScaffoldPath' exists and is not empty."
  }
  New-Item -ItemType Directory -Force $ScaffoldPath | Out-Null
  $values = @{
    SLUG = $Slug; NAME = $Name; DESCRIPTION = $Description
    DATE = (Get-Date -Format 'yyyy-MM-dd')
  }
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  foreach ($f in Get-ChildItem -Force -File (Join-Path $repoRoot 'templates/project')) {
    $text = [IO.File]::ReadAllText($f.FullName)
    foreach ($k in $values.Keys) {
      $v = $values[$k]
      switch ($f.Extension) {
        '.html' { $v = [System.Net.WebUtility]::HtmlEncode($v) }
        '.json' { $v = ($v | ConvertTo-Json).Trim('"') }
      }
      $text = $text.Replace("{{$k}}", $v)
    }
    [IO.File]::WriteAllText((Join-Path $ScaffoldPath $f.Name), $text, $utf8)
  }
  Write-Output "Scaffolded starter project in $ScaffoldPath"
}

# --- Register ----------------------------------------------------------------
function Q([string]$s) { '"' + $s.Replace('\', '\\').Replace('"', '\"') + '"' }
$entry = @("- name: $(Q $Name)", "  path: $(Q "/$Slug/")", "  description: $(Q $Description)")
if ($Repo) { $entry += "  repo: $(Q $Repo)" }
if ($Status) { $entry += "  status: $(Q $Status)" }
$entry = $entry -join "`n"

if ($yaml -match '(?m)^\[\]\s*$') {
  $yaml = $yaml -replace '(?m)^\[\]\s*$', $entry.Replace('$', '$$')
} else {
  $yaml = $yaml.TrimEnd("`r", "`n") + "`n" + $entry
}
[IO.File]::WriteAllText($DataPath, $yaml.TrimEnd("`r", "`n") + "`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Registered '$Name' at /$Slug/ in $DataPath"

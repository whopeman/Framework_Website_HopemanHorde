<#
  scripts/build.ps1
  Project : Framework_Website_HopemanHorde
  Date    : 2026-10-26
  Purpose : Clean build of the site, then lint and test it.
  Usage   : powershell -File scripts/build.ps1 [-SkipChecks]
  Params  :
    -SkipChecks  Build only; do not run lint and tests.
  Change log:
    2026-10-26  0.1.0  Initial build script.
#>
param([switch]$SkipChecks)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

hugo --gc --cleanDestinationDir
if ($LASTEXITCODE -ne 0) { throw 'hugo build failed' }

if (-not $SkipChecks) {
  npm run lint
  if ($LASTEXITCODE -ne 0) { throw 'lint failed' }
  npm test
  if ($LASTEXITCODE -ne 0) { throw 'tests failed' }
}

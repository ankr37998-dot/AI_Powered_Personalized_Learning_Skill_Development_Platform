$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envPath)) {
  throw 'backend/.env is missing. Copy backend/.env.example to backend/.env first.'
}

$lines = @(Get-Content $envPath | Where-Object { $_ -notmatch '^\s*ADMIN_BOOTSTRAP_SECRET\s*=' })
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$lines += "ADMIN_BOOTSTRAP_SECRET=$secret"
[IO.File]::WriteAllLines($envPath, $lines, [Text.UTF8Encoding]::new($false))
[Array]::Clear($bytes, 0, $bytes.Length)
$secret = $null
Write-Host 'One-time admin bootstrap secret saved to ignored backend/.env. Value hidden; restart the backend.'

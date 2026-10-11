$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envPath)) {
  throw 'backend/.env is missing.'
}

$secret = $null
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*ADMIN_BOOTSTRAP_SECRET\s*=(.*)$') { $secret = $Matches[1].Trim() }
}
if (-not $secret) {
  throw 'ADMIN_BOOTSTRAP_SECRET is missing. Run configure-admin-bootstrap.ps1 and restart the backend first.'
}

$name = Read-Host 'Administrator name'
$email = Read-Host 'Administrator email'
$securePassword = Read-Host 'New administrator password (12+ characters)' -AsSecureString
$passwordPointer = [IntPtr]::Zero

try {
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  if ($password.Length -lt 12 -or $password.Length -gt 128) {
    throw 'Administrator password must be between 12 and 128 characters.'
  }

  $body = @{ name = $name; email = $email; password = $password } | ConvertTo-Json -Compress
  $result = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/bootstrap-admin' `
    -Method Post `
    -Headers @{ 'x-admin-bootstrap-secret' = $secret } `
    -ContentType 'application/json' `
    -Body $body `
    -TimeoutSec 15

  if (-not $result.success) { throw 'Administrator creation was not confirmed by the API.' }
  Write-Host 'Administrator created. Sign in through the app using the email and password you entered.'
}
finally {
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  $securePassword.Dispose()
  $password = $null
  $secret = $null
}

$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'

if (-not (Test-Path $envPath)) {
  throw 'backend/.env is missing. Copy backend/.env.example to backend/.env first.'
}

$secureKey = Read-Host 'Enter your new Google Gemini API key' -AsSecureString
$keyPointer = [IntPtr]::Zero

try {
  $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer).Trim()

  if ($apiKey.Length -lt 20 -or $apiKey -match '\s') {
    throw 'The API key must be at least 20 characters and contain no whitespace.'
  }

  $lines = @(Get-Content $envPath | Where-Object { $_ -notmatch '^\s*GOOGLE_GEMINI_API_KEY\s*=' })
  $lines += "GOOGLE_GEMINI_API_KEY=$apiKey"
  [IO.File]::WriteAllLines($envPath, $lines, [Text.UTF8Encoding]::new($false))
  Write-Host 'GOOGLE_GEMINI_API_KEY saved to ignored backend/.env. The key value was not displayed.'
}
finally {
  if ($keyPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
  }
  $secureKey.Dispose()
  $apiKey = $null
}



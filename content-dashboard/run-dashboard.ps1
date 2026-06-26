$ErrorActionPreference = "Stop"

$port = if ($env:PORT) { [int]$env:PORT } else { 5177 }
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($nodeCommand) {
  & $nodeCommand.Source "$PSScriptRoot\server.mjs"
  exit $LASTEXITCODE
}

$codexNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (Test-Path -LiteralPath $codexNode) {
  & $codexNode "$PSScriptRoot\server.mjs"
  exit $LASTEXITCODE
}

function Get-MimeType {
  param([string]$Path)

  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".png" { "image/png" }
    ".svg" { "image/svg+xml" }
    default { "application/octet-stream" }
  }
}

function Send-Response {
  param(
    [Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$Body
  )

  $header = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

function Resolve-StaticPath {
  param([string]$RequestPath)

  $relative = if ($RequestPath -eq "/") { "index.html" } else { $RequestPath.TrimStart("/") }
  $relative = [Uri]::UnescapeDataString($relative).Replace("/", [IO.Path]::DirectorySeparatorChar)
  $candidate = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot $relative))
  $root = [IO.Path]::GetFullPath($PSScriptRoot)

  if (-not $candidate.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }

  return $candidate
}

function Read-DashboardData {
  $latestScan = Join-Path $PSScriptRoot "..\outputs\facebook-content-scan\cleaned_posts.json"
  $localSeed = Join-Path $PSScriptRoot "data\sample-facebook-scan.json"

  if (Test-Path -LiteralPath $latestScan) {
    return [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $latestScan))
  }

  return [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $localSeed))
}

Write-Host "Node.js was not found. Starting PowerShell fallback server."
Write-Host "Content dashboard running at http://localhost:$port"

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
$listener.Start()

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        continue
      }

      $parts = $requestLine.Split(" ")
      $method = $parts[0]
      $path = ($parts[1] -split "\?")[0]

      do {
        $line = $reader.ReadLine()
      } while ($line)

      if ($path -eq "/api/health") {
        $body = [Text.Encoding]::UTF8.GetBytes('{"ok":true,"storage":"google-sheets-via-api-boundary","server":"powershell-fallback"}')
        Send-Response $stream 200 "OK" "application/json; charset=utf-8" $body
        continue
      }

      if ($path -eq "/api/dashboard") {
        Send-Response $stream 200 "OK" "application/json; charset=utf-8" (Read-DashboardData)
        continue
      }

      if ($path -eq "/api/sync") {
        $body = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"message":"Connect this route to Google Sheets or Apps Script. Keep credentials on the server only."}')
        Send-Response $stream 501 "Not Implemented" "application/json; charset=utf-8" $body
        continue
      }

      if ($method -ne "GET") {
        $body = [Text.Encoding]::UTF8.GetBytes("Method not allowed")
        Send-Response $stream 405 "Method Not Allowed" "text/plain; charset=utf-8" $body
        continue
      }

      $staticPath = Resolve-StaticPath $path
      if (-not $staticPath -or -not (Test-Path -LiteralPath $staticPath -PathType Leaf)) {
        $body = [Text.Encoding]::UTF8.GetBytes("Not found")
        Send-Response $stream 404 "Not Found" "text/plain; charset=utf-8" $body
        continue
      }

      Send-Response $stream 200 "OK" (Get-MimeType $staticPath) ([IO.File]::ReadAllBytes($staticPath))
    } catch {
      if ($stream) {
        $body = [Text.Encoding]::UTF8.GetBytes("Server error")
        Send-Response $stream 500 "Internal Server Error" "text/plain; charset=utf-8" $body
      }
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}

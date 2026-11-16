param([switch]$Start)
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$MinNode = [version]"22.13.0"

function Invoke-Step($Label, $Dir, [scriptblock]$Block) {
    Write-Host "`n==> $Label" -ForegroundColor Cyan
    Push-Location $Dir
    try {
        & $Block
        if ($LASTEXITCODE) { throw "$Label failed (exit $LASTEXITCODE)" }
    } finally { Pop-Location }
}

$nodeVersion = [version]((node -v).TrimStart("v"))
if ($nodeVersion -lt $MinNode) { throw "Node $MinNode+ required, found $nodeVersion. Install from https://nodejs.org" }

Invoke-Step "Install contract dependencies" "$Root\smart-contract" { npm install --no-audit --no-fund }
Invoke-Step "Install web dependencies" "$Root\web-app" { npm install --no-audit --no-fund }

$envFile = Join-Path $Root "web-app\.env.local"
if (-not (Test-Path $envFile)) {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = -join ($bytes | ForEach-Object { $_.ToString("x2") })
    [IO.File]::WriteAllText($envFile, "SESSION_SECRET=$secret`nNEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545`n")
    Write-Host "Created web-app\.env.local with a fresh SESSION_SECRET" -ForegroundColor Green
}

Invoke-Step "Smart contract tests (Hardhat)" "$Root\smart-contract" { npx hardhat test }
Invoke-Step "Backend unit tests" "$Root\web-app" { npm test }

if (-not $Start) {
    Write-Host "`nAll set. Run .\setup.ps1 -Start to launch everything." -ForegroundColor Green
    return
}

Write-Host "`n==> Starting local blockchain (new window)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$Root\smart-contract'; npx hardhat node"

$rpcBody = '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
$deadline = (Get-Date).AddSeconds(60)
do {
    Start-Sleep -Seconds 2
    try { Invoke-RestMethod -Uri "http://127.0.0.1:8545" -Method Post -Body $rpcBody -ContentType "application/json" | Out-Null; $up = $true } catch { $up = $false }
} until ($up -or (Get-Date) -gt $deadline)
if (-not $up) { throw "Local chain did not start on 127.0.0.1:8545" }

Invoke-Step "Deploy + seed Pechi & Bella" "$Root\smart-contract" { npx hardhat run scripts/deploy.js --network localhost }

Write-Host "`n==> Starting web app (new window)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$Root\web-app'; npm run dev"
Start-Sleep -Seconds 6
Start-Process "http://localhost:3000"

Write-Host @"

Pela is running at http://localhost:3000
MetaMask: add network RPC http://127.0.0.1:8545, chain ID 31337, symbol ETH.
Import the private keys printed in the blockchain window:
"@ -ForegroundColor Green

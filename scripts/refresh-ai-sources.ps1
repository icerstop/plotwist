$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$aiResearch = Join-Path $PWD 'research/ai'
New-Item -ItemType Directory -Force $aiResearch | Out-Null
# These are published data downloads; no API keys or benchmark questions are fetched.
Invoke-WebRequest 'https://epoch.ai/data/benchmark_data.zip' -OutFile (Join-Path $aiResearch 'epoch-benchmarks.zip')
Invoke-WebRequest 'https://www.trackingai.org/app/database/proj_IQ/score_logs/iq/daily_logs.csv' -OutFile (Join-Path $aiResearch 'tracking-iq.csv')
Expand-Archive -LiteralPath (Join-Path $aiResearch 'epoch-benchmarks.zip') -DestinationPath (Join-Path $aiResearch 'epoch') -Force
$aiReceiptPath = Join-Path $aiResearch 'source-receipt.json'
$aiReceipt = Get-Content -Raw -LiteralPath $aiReceiptPath | ConvertFrom-Json
$aiReceipt.retrievedAt = [DateTime]::UtcNow.ToString('yyyy-MM-dd')
$aiReceipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $aiReceiptPath -Encoding utf8
node scripts/build-ai-data.mjs
if ($LASTEXITCODE -ne 0) { throw 'Normalizacja nie powiodła się; nie publikuj danych.' }
Write-Output 'Pobrano źródła. Sprawdź zmiany metodologii, uruchom npm test i npm run build przed publikacją.'

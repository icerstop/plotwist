$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$aiResearch = Join-Path $PWD 'research/ai'
New-Item -ItemType Directory -Force $aiResearch | Out-Null
# These are published data downloads; no API keys or benchmark questions are fetched.
Invoke-WebRequest 'https://epoch.ai/data/benchmark_data.zip' -OutFile (Join-Path $aiResearch 'epoch-benchmarks.zip')
Invoke-WebRequest 'https://www.trackingai.org/app/database/proj_IQ/score_logs/iq/daily_logs.csv' -OutFile (Join-Path $aiResearch 'tracking-iq.csv')
Invoke-WebRequest 'https://www.trackingai.org/assets/js/charts/charts_IQ.js' -OutFile (Join-Path $aiResearch 'tracking-formula-latest.js')
Expand-Archive -LiteralPath (Join-Path $aiResearch 'epoch-benchmarks.zip') -DestinationPath (Join-Path $aiResearch 'epoch') -Force
$aiReceiptPath = Join-Path $aiResearch 'source-receipt.json'
$aiReceipt = Get-Content -Raw -LiteralPath $aiReceiptPath | ConvertFrom-Json
$aiReceipt.retrievedAt = [DateTime]::UtcNow.ToString('yyyy-MM-dd')
$aiDownloads = @(
    @{ file='epoch-benchmarks.zip'; url='https://epoch.ai/data/benchmark_data.zip' },
    @{ file='tracking-iq.csv'; url='https://www.trackingai.org/app/database/proj_IQ/score_logs/iq/daily_logs.csv' },
    @{ file='tracking-formula-latest.js'; url='https://www.trackingai.org/assets/js/charts/charts_IQ.js' }
) | ForEach-Object { @{ file=$_.file; url=$_.url; retrievedAt=[DateTime]::UtcNow.ToString('o'); sha256=(Get-FileHash -LiteralPath (Join-Path $aiResearch $_.file) -Algorithm SHA256).Hash.ToLower() } }
$aiReceipt | Add-Member -NotePropertyName downloads -NotePropertyValue @($aiDownloads) -Force
$aiReceipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $aiReceiptPath -Encoding utf8
node scripts/build-ai-data.mjs
if ($LASTEXITCODE -ne 0) { throw 'Normalizacja nie powiodła się; nie publikuj danych.' }
node scripts/audit-ai-brands.mjs
if ($LASTEXITCODE -ne 0) { throw 'Audyt marek nie powiódł się; nie publikuj danych.' }
Write-Output 'Pobrano źródła Epoch i TrackingAI. Raport Sonnet 5.5 oraz snapshoty AA i ARC-AGI-3 zachowują własne daty. ARC odśwież osobno: node scripts/fetch-arc3-data.mjs, potem npm run data:ai i node scripts/audit-ai-brands.mjs. Sprawdź zmiany metodologii i wzory TrackingAI, uruchom npm test i npm run build przed publikacją.'

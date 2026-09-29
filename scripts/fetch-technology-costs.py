"""Download a pinned Epoch snapshot and primary NHGRI data; never execute source code.

Run once to refresh local inputs, then python scripts/build-story-data.py.
The Epoch commit is pinned deliberately: updating it requires reviewing methodology.
"""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, urllib.request

RAW = Path(__file__).resolve().parents[1] / 'research/stories/raw'
COMMIT = '9163c17ee7217b9f09ac51bcc71ed64c18c04bc8'
BASE = f'https://raw.githubusercontent.com/droodman/inference-cost/{COMMIT}/'
REPORT = 'https://epoch.ai/publications/the-plunging-price-of-thought'
FILES = {
    'epoch-thought-figure1.csv': BASE + 'output/slides/Figure%201.csv',
    'epoch-thought-figure2.csv': BASE + 'output/slides/Figure%202.csv',
    'epoch-chip-performance.csv': 'https://epoch.ai/data/charts/chip-performance-per-dollar/chip_perf_per_dollar_quarterly_other_merged.csv',
    'nhgri-sequencing-costs.xls': 'https://www.genome.gov/sites/default/files/media/files/2023-05/Sequencing_Cost_Data_Table_May2022.xls',
    'cost-of-sequencing-a-full-human-genome.csv': 'https://ourworldindata.org/grapher/cost-of-sequencing-a-full-human-genome.csv?v=1&csvType=full&useColumnShortNames=false',
    'cost-of-sequencing-a-full-human-genome.metadata.json': 'https://ourworldindata.org/grapher/cost-of-sequencing-a-full-human-genome.metadata.json?v=1&csvType=full&useColumnShortNames=false',
}

if __name__ == '__main__':
    RAW.mkdir(parents=True, exist_ok=True)
    for name, url in FILES.items():
        path = RAW / name
        if path.exists() and path.with_name(name + '.receipt.json').exists():
            print(f'Already archived: {name}')
            continue
        request = urllib.request.Request(url, headers={'User-Agent': 'Plotwist dataset research (source attribution retained)'})
        with urllib.request.urlopen(request, timeout=90) as response:
            data = response.read()
        path.write_bytes(data)
        receipt = {'url': url, 'retrievedAt': datetime.now(timezone.utc).isoformat(),
                   'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
        if name.startswith('epoch-thought'):
            receipt.update(repositoryCommit=COMMIT, reportUrl=REPORT, reportPublishedAt='2026-09-22')
        path.with_name(name + '.receipt.json').write_text(json.dumps(receipt, indent=2), encoding='utf8')
        print(f'Archived {name}: {len(data)} bytes')

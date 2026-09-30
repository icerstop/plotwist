"""Extract public AA chart data from a saved model page, without executing JS.

Usage: python scripts/extract-aa-snapshot.py research/ai/gpt-6-1-sol-aa-model.html 2026-09-30
The date is the actual download date, never an inferred benchmark run date.
"""
import hashlib
import json
import math
from pathlib import Path
import re
import sys
from html.parser import HTMLParser


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.items = []

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.active = True

    def handle_endtag(self, tag):
        if tag == 'script':
            self.active = False

    def handle_data(self, data):
        if self.active:
            self.items.append(data)


def extract(text):
    parser = Scripts()
    parser.feed(text)
    models = {}
    decoder = json.JSONDecoder()
    for script in parser.items:
        match = re.fullmatch(r'self\.__next_f\.push\((.*)\)', script, re.S)
        if not match:
            continue
        payload = json.loads(match[1])
        if len(payload) < 2 or not isinstance(payload[1], str):
            continue
        for start in re.finditer(r'\{"id":"[^"\n]+","slug":', payload[1]):
            model, _ = decoder.raw_decode(payload[1], start.start())
            if 'intelligenceIndex' in model:
                models[model['slug']] = model
    if not models:
        raise ValueError('AA schema changed: no chart models found. Do not replace snapshot.')
    return models


if __name__ == '__main__':
    source, retrieved = Path(sys.argv[1]), sys.argv[2]
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', retrieved):
        raise ValueError('Supply the actual download date as YYYY-MM-DD.')
    models = extract(source.read_text(encoding='utf-8'))
    measured = [m for m in models.values() if isinstance(m.get('intelligenceIndex'), (int, float))
                and math.isfinite(m['intelligenceIndex']) and m.get('intelligenceIndexIsEstimated') is False]
    if not measured:
        raise ValueError('No explicitly measured index scores found.')
    # Retain original numeric fields/configurations; omit unrelated pricing/provider UI data.
    keys = ['id', 'slug', 'name', 'releaseDate', 'effort', 'release', 'intelligenceIndex',
            'intelligenceIndexIsEstimated', 'intelligenceIndexEvaluations', 'omniscienceAccuracy',
            'omniscienceHallucinationRate', 'terminalBenchScience', 'scicode', 'critpt']
    rows = [{**{k: m.get(k) for k in keys}, 'creator': {k: m['creator'].get(k) for k in ['slug', 'name']}}
            for m in measured]
    snapshot = {
        'retrievedAt': retrieved, 'dateKind': 'snapshot', 'indexVersion': '4.3.2',
        'sourceUrl': 'https://artificialanalysis.ai/models/gpt-6-1-sol',
        'methodologyUrl': 'https://artificialanalysis.ai/methodology/intelligence-benchmarking',
        'versionEvidenceUrl': 'https://artificialanalysis.ai/articles/gpt-6-1-sol-replaces-gpt-6-sol-after-just-7-days-with-near-astra-intelligence',
        'sourceFile': source.name, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'excludedEstimatedOrUnmeasured': len(models) - len(rows),
        'excludedBenchmarks': {'scicode': 'Under review on source model page', 'critpt': 'Under review on source model page'},
        'models': sorted(rows, key=lambda m: (m['releaseDate'] or '', m['slug'])),
    }
    # This extractor is pinned to the reviewed September source/version, not a blind live refresh.
    required = [m for m in rows if m['release']['slug'] == 'gpt-6-1-sol']
    if len(required) != 5 or any(m['releaseDate'] != '2026-09-29' for m in required):
        raise ValueError('Unexpected GPT-6.1 Sol coverage; inspect source before writing.')
    target = Path('research/ai/aa-2026-09-30.json')
    target.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(rows)} measured configurations; {snapshot["excludedEstimatedOrUnmeasured"]} estimated/unmeasured excluded')

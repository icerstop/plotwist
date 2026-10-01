"""Refresh inspected source URLs; stop on HTML errors in place of data files."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import requests

raw=Path(__file__).resolve().parents[1]/'research/gold-reserves/raw'
for receipt_path in sorted(raw.glob('*.receipt.json')):
    receipt=json.loads(receipt_path.read_text());path=receipt_path.with_name(receipt_path.name.removesuffix('.receipt.json'))
    r=requests.get(receipt['url'],timeout=45);r.raise_for_status()
    if path.suffix=='.xlsx':assert r.content.startswith(b'PK'), 'Not an Excel workbook'
    elif path.suffix=='.json':r.json()
    elif path.suffix=='.csv':assert b'<html' not in r.content[:500].lower(), 'HTML instead of CSV'
    elif path.name=='un-gold-poland.html':assert b'Gold reserves' in r.content, 'Missing gold table'
    path.write_bytes(r.content)
    receipt.update(retrievedAt=datetime.now(timezone.utc).isoformat(),sha256=hashlib.sha256(r.content).hexdigest(),bytes=len(r.content))
    receipt_path.write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf8')
    print(path.name)

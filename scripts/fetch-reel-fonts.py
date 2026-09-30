"""Bundle the curated font expansion from Google Fonts (requires fonttools).

Downloads original, unmodified files, checks Polish glyphs and records licenses
and SHA-256 receipts. Run from any directory: python scripts/fetch-reel-fonts.py
"""
import hashlib
import io
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
import re
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import URLError

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FAMILIES = {
    "sans": ["Plus Jakarta Sans", "Sora", "Onest", "Albert Sans", "Figtree",
             "Instrument Sans", "Work Sans", "Public Sans", "Archivo",
             "Raleway", "Nunito Sans", "Lexend"],
    "serif": ["Fraunces", "DM Serif Display", "DM Serif Text", "Crimson Pro",
              "EB Garamond", "Bodoni Moda", "Spectral", "Newsreader",
              "Literata", "Source Serif 4"],
    "display": ["Bebas Neue", "Anton", "Archivo Black", "Teko", "Chakra Petch",
                "Rajdhani", "Unbounded", "Bricolage Grotesque"],
    "handwriting": ["Caveat", "Kalam", "Patrick Hand", "Marck Script", "Mali", "Courgette"],
    "mono": ["IBM Plex Mono", "Space Mono", "Fira Code", "Source Code Pro"],
}
POLISH = "ĄĆĘŁŃÓŚŹŻąćęłńóśźż0123456789"


def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": "Plotwist-font-bundler"}), timeout=30) as response:
                return response.read()
        except (URLError, TimeoutError):
            if attempt == 2:
                raise


def bundle(item):
    group, name = item
    slug = name.lower().replace(" ", "")
    folder = ROOT / "public" / "fonts" / slug
    fallback = "Georgia, serif" if group == "serif" else "monospace" if group == "mono" else "cursive" if group == "handwriting" else "Arial, sans-serif"
    cached = folder / "source.json"
    if cached.exists():
        receipt = json.loads(cached.read_text(encoding="utf-8"))
        if receipt.get("revision") == REVISION and receipt.get("verifiedGlyphs") == POLISH and (folder / "OFL.txt").exists() and all((ROOT / "public" / f["path"].lstrip("/")).exists() and hashlib.sha256((ROOT / "public" / f["path"].lstrip("/")).read_bytes()).hexdigest() == f["sha256"] for f in receipt["files"]):
            return {"id": slug, "name": name, "group": group, "face": name, "family": f'"{name}", {fallback}', "files": [{"path": f["path"], "weight": f["weight"]} for f in receipt["files"]]}
    base = f"https://raw.githubusercontent.com/google/fonts/{REVISION}/ofl/{slug}/"
    metadata = fetch(base + "METADATA.pb").decode("utf-8")
    if 'license: "OFL"' not in metadata:
        raise ValueError(f"Unexpected license: {name}")
    license_data = fetch(base + "OFL.txt")
    records = []
    for block in re.findall(r"fonts\s*\{([^}]+)\}", metadata):
        if 'style: "normal"' in block:
            filename = re.search(r'filename: "([^"]+)"', block).group(1)
            weight = int(re.search(r"weight: (\d+)", block).group(1))
            records.append((filename, weight))
    variable = [r for r in records if "[" in r[0]]
    selected = variable[:1] or [r for r in records if r[1] in (400, 700)]
    if not selected:
        raise ValueError(f"No suitable normal font: {name}")
    files, downloads = [], []
    for filename, weight in selected:
        url = base + quote(filename, safe="")
        data = fetch(url)
        font = TTFont(io.BytesIO(data))
        missing = [c for c in POLISH if ord(c) not in font.getBestCmap()]
        if missing:
            raise ValueError(f"{name} missing glyphs: {''.join(missing)}")
        axes = {a.axisTag: a for a in font["fvar"].axes} if "fvar" in font else {}
        weight_range = f"{axes['wght'].minValue:g} {axes['wght'].maxValue:g}" if "wght" in axes else str(weight)
        local_name = re.sub(r"[^\w.\-]", "-", filename)
        entry = {"path": f"/fonts/{slug}/{local_name}", "weight": weight_range}
        files.append(entry)
        downloads.append((local_name, data, {**entry, "source": url, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}))
        font.close()
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "OFL.txt").write_bytes(license_data)
    for filename, data, _ in downloads:
        (folder / filename).write_bytes(data)
    receipt = {"family": name, "retrievedAt": date.today().isoformat(), "source": f"https://github.com/google/fonts/tree/{REVISION}/ofl/{slug}", "revision": REVISION, "metadata": metadata, "license": "SIL Open Font License 1.1", "verifiedGlyphs": POLISH, "files": [r for _, _, r in downloads]}
    (folder / "source.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK {name}: {len(downloads)} file(s), {sum(len(d) for _, d, _ in downloads):,} bytes", flush=True)
    return {"id": slug, "name": name, "group": group, "face": name, "family": f'"{name}", {fallback}', "files": files}


if __name__ == "__main__":
    REVISION = json.loads(fetch("https://api.github.com/repos/google/fonts/commits/main"))["sha"]
    items = [(group, name) for group, names in FAMILIES.items() for name in names]
    with ThreadPoolExecutor(max_workers=5) as pool:
        fonts = list(pool.map(bundle, items))
    catalog_path = ROOT / "src" / "font-catalog.js"
    current = json.loads(catalog_path.read_text(encoding="utf-8").split("=", 1)[1].strip().removesuffix(";"))
    ids = {f["id"] for f in fonts}
    catalog = [f for f in current if f["id"] not in ids] + fonts
    catalog_path.write_text("// Locally hosted Google Fonts; licenses and source receipts live beside each font.\nexport const bundledFonts = " + json.dumps(catalog, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"Added {len(fonts)} families; bundled catalog now contains {len(catalog)} families.")

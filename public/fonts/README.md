# Reel fonts

Locally hosted, unmodified Google Fonts. Each family directory includes its OFL 1.1 license and source receipt (download URLs, date, SHA-256 hashes, metadata and weight range). Libre Baskerville uses a README receipt.

All added families include the Polish alphabet and digits, checked in the actual font character maps. The app loads only selected families before canvas preview, PNG or video rendering. Variable fonts use their native weight range; static fonts include regular and bold files when available. Single-weight display/script faces use browser-synthesized bold when requested, just like synthetic italics.

New families (2026-09-28): Inter, Manrope, DM Sans, Montserrat, Outfit, Space Grotesk, Playfair Display, Lora, Cormorant Garamond, Bitter, Oswald, Barlow Condensed, Roboto Mono, JetBrains Mono.

Upstream catalogue: https://github.com/google/fonts

Expansion (2026-09-30): 40 additional families, bringing the editor to 61 choices (55 bundled and 6 system fonts).

- Sans serif: Plus Jakarta Sans, Sora, Onest, Albert Sans, Figtree, Instrument Sans, Work Sans, Public Sans, Archivo, Raleway, Nunito Sans, Lexend.
- Serif: Fraunces, DM Serif Display, DM Serif Text, Crimson Pro, EB Garamond, Bodoni Moda, Spectral, Newsreader, Literata, Source Serif 4.
- Display: Bebas Neue, Anton, Archivo Black, Teko, Chakra Petch, Rajdhani, Unbounded, Bricolage Grotesque.
- Handwriting: Caveat, Kalam, Patrick Hand, Marck Script, Mali, Courgette.
- Monospace: IBM Plex Mono, Space Mono, Fira Code, Source Code Pro.

Refresh the curated expansion using `python scripts/fetch-reel-fonts.py` (Python with `fonttools`). The script pins each run to the upstream Git commit, retains original font bytes, records checksums and licenses, and rejects files missing Polish glyphs before updating the catalog. No API key is required.

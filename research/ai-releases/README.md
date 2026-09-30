# AI release chronology — verified 2026-09-30

The public data is generated with `node scripts/build-ai-releases.mjs`. Each model row includes the primary source URL, category, availability date and verification notes. The source receipts here preserve download timestamps and SHA-256 hashes; failed downloads are explicitly recorded. OpenAI blog pages that refused direct downloads were read with the browser/web reader. Their verified URLs and date decisions live in the generator.

This is a curated, non-exhaustive catalogue of OpenAI and Anthropic named general/coding language-model releases, covering 2024-01-01 through 2026-09-30. It is not evidence that all AI releases have been counted. Monthly zeros mean no matching entry in this catalogue; the UI and reel identify the scope. No extrapolation, interpolated release counts or automatically inferred benchmark dates are used.

Counting rules: separately named mini/nano/open-weight sizes and Codex products have individual rows. GPT-5.1 and GPT-5.2 product modes are deliberately grouped under the named version. Routine API snapshots, other modality models, deep-research products and inference/service modes are excluded. The explicitly announced Sonnet 3.5 revision is optional. Restricted Mythos access is excluded, including Fable/Mythos variants with shared underlying weights. The alternate launch counter groups by publisher and calendar date, while gaps use distinct calendar dates across the selected publishers.

First customer availability is used, including paid previews. Important resolutions:

- Claude 3.5 Sonnet: API release notes explicitly say available June 20, 2024, despite the current announcement page showing June 21. The former determines the row.
- Claude 3.5 Haiku: announced October 22; first API availability November 4, 2024.
- o1: ChatGPT December 5, 2024; API December 17.
- GPT-5-Codex: Codex September 15, 2025; API September 23.
- GPT-5.1: ChatGPT November 12, 2025; API November 13.
- GPT-5.1-Codex-Max: Codex November 19, 2025; API December 4. This name is a trained model, unlike a Max effort configuration.
- GPT-5.2-Codex: Codex December 18, 2025; API January 14, 2026.
- GPT-5.3-Codex: Codex February 5, 2026; API February 24.
- GPT-5.5: customers April 23, 2026; API April 24.

September 2026 has seven public named entries, six publisher/date groups and five distinct dates in this selection. A chronology does not establish a monotonic increase, statistical trend, capability improvement, or compute growth. Equal elapsed calendar time receives equal screen time; simultaneous releases retain their actual shared date. CSV preserves all selected rows chronologically, and JSON also contains scope, filters and monthly aggregates.

Reproduction: regenerate data, then run `node --test tests/ai-releases.test.mjs`. New dates must be source-checked, including availability (not just announcement), before updating the cutoff.

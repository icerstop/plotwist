# AI release chronology — verified 2026-09-30

The public data is generated with `node scripts/build-ai-releases.mjs`. Each model row includes the primary source URL, category, availability date and verification notes. The source receipts here preserve download timestamps and SHA-256 hashes; failed downloads are explicitly recorded. OpenAI blog pages that refused direct downloads were read with the browser/web reader. Their verified URLs and date decisions live in the generator.

This is a curated, non-exhaustive catalogue of named language-model releases from ten producers (OpenAI, Anthropic, Google, DeepSeek, Z.ai, Mistral, Moonshot, Meta, xAI and Alibaba), covering 2018-06-11 through 2026-09-30. It is not evidence that all AI releases have been counted. Monthly zeros mean no matching entry in this catalogue; the UI and reel identify the scope. No extrapolation, interpolated release counts or automatically inferred benchmark dates are used.

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

The original OpenAI/Anthropic selection for September 2026 has seven public named entries, six publisher/date groups and five distinct dates in this selection. A chronology does not establish a monotonic increase, statistical trend, capability improvement, or compute growth. Without event pauses, equal elapsed calendar time receives equal screen time. With pauses enabled, movement between dates is uniform but wall-clock screen time is deliberately not proportional to calendar time; simultaneous releases share one stop. CSV preserves all selected rows chronologically, and JSON also contains scope, filters and monthly aggregates.

Reproduction: regenerate data, then run `node --test tests/ai-releases.test.mjs`. New dates must be source-checked, including availability (not just announcement), before updating the cutoff.

## Historical extension (2026-09-30)

Added 12 pre-2024 OpenAI entries and five early Anthropic entries, bringing the catalogue to 80. Every added row links to its primary source; the generator includes the date decisions. GPT-1 uses the June 11, 2018 release of code and weights. GPT-2 has four separately released checkpoint sizes (124M, 355M, 774M and 1.5B); original 117M/345M counts were later corrected by OpenAI. The May 3 date is verified by OpenAI's commit `0503b1b24969ccbaf93a5d05f2c2588dabff1c46` (2019-05-03T03:39:33Z), titled “updates for 345M model”, via the GitHub commits API.

GPT-3 uses the June 11, 2020 limited API beta, not the May 28 paper. Codex (2021) uses the June 29 Copilot technical preview, not the August 10 improved API version. GPT-3.5 (ChatGPT) specifically denotes the November 30, 2022 conversational research preview, not all GPT-3.5 API ancestors. GPT-3.5 Turbo's March 1, 2023 date is confirmed by OpenAI staff's contemporaneous announcement; its blog header now displays a 2024 edit date. GPT-4 uses ChatGPT Plus availability, not later API general availability. GPT-4 Turbo uses its November 6, 2023 preview.

InstructGPT is deliberately not assigned January 27, 2022 as a first-release date: OpenAI's post says it had already been in API beta for more than a year. Its earlier exact first-access day is not established here. Routine snapshots, unverified earlier Claude revisions and GPT-3.5 ancestors remain outside this non-exhaustive catalogue. No fabricated daily date is used to fill those gaps.

## Event pauses

`src/event-timing.js` is a reusable deterministic mapping from video seconds to event progress. A distinct date gets one stop even if multiple publishers or models launched that day. Defaults and date-specific overrides live in the common animation settings and survive reloads. When requested stops exceed 75% of the active data sequence, they are scaled proportionally and the UI displays the actual hold and a duration-fit button. At least 25% remains for calendar movement; the existing final 10% remains for effects to settle. No dates or counts are interpolated or changed by the pauses.

## Ten-producer expansion and Gemini 4 (2026-09-30)

The catalogue now has 239 named entries, grouped into 170 producer/date events. Counts include optional revisions and the single explicit partner-access event; they are not counts of all public AI releases. Existing two-company selections stay unchanged. The “All publishers” preset excludes revisions and partner-only events; “Google: Bard → Gemini 4” explicitly includes partner access.

Gemini 4 Argon is dated September 30, 2026 from Google's announcement and current Fairwind rollout. It is **not** a public API/consumer launch. The source does not give a public availability date. Its `restricted` category, `partner-access` availability and visible reel label preserve that distinction. This category currently covers Argon only; it is not an exhaustive register of private programmes.

Google groups Bard/LaMDA, PaLM 2 in Bard and Gemini under one publisher. Bard's February 2024 rename is not another model. Zhipu/ChatGLM/GLM map to Z.ai; Kimi to Moonshot; Llama to Meta; Grok to xAI; Qwen to Alibaba. Families are intentionally curated, not complete: early Kimi/DeepSeek/ChatGLM, some Mixtral/Grok releases and routine checkpoints remain outside this snapshot when an exact first-access day was not established. Do not interpret missing entries as inactivity.

First-access decisions are preserved per row. In particular, Gemini 1.5 Flash uses the API changelog's May 10 preview rather than the May 14 I/O announcement; DeepSeek-Coder-V2 uses June 14 API access before June 17 weights. Grok 4.5 uses July 8 API access and Grok 4.7 September 20 Grok Build access, before their later blog/API announcements. Kimi K3 uses July 16 app/API access before July 27 weights. Qwen3.8 Max's August 2 launch is confirmed by the official Qwen video linked in its row and provider blog. Open model sizes are individual entries; base/instruct/quantized copies are not counted again. Restricted LLaMA research weights are marked `gated-weights`, not unrestricted open source. The category “open-weight” identifies releases catalogued via weights, not an exhaustive licence classification of every general/coding model.

`expanded/` preserves readable source snapshots used for the expansion; `receipts.json` records their hashes and URLs. Specific announcements and repository notices are linked per dataset row. Live source edits may change later; rerun source verification before moving the cutoff.

Validation: 241 automated tests, 24 browser-rendered combinations across two modes and three aspect ratios, ten-publisher selection persistence, eight simultaneous Qwen entries, explicit Gemini 4 partner label, stable ending and a six-second MP4 export at 30 fps.

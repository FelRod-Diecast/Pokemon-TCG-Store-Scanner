# Engineering Log — Pokémon TCG Store Scanner

Repository: `FelRod-Diecast/Pokemon-TCG-Store-Scanner`
Working branch: `repair/discovery-quality`
Protected target: `main` (do not merge without verified tests and a live browser export)

## Goal
Improve reliable discovery of real Pokémon TCG products at Target, Costco, and Sam's Club. A green syntax/unit-test run alone is not proof that live retailer discovery works.

## Operating rules
- Keep work on the repair branch; do not make unverified edits to `main`.
- Do not import third-party code without confirming its license and dependencies.
- Do not bypass CAPTCHA, anti-bot controls, membership requirements, or automate checkout.
- Treat HTTP success, parsed rows, candidate matches, unique products, and confirmed stock as separate measurements.
- Preserve diagnostics and record failures; never interpret a failed request as a sellout.
- After each meaningful change, run `npm run check` and `npm test`, inspect the diff, and check CI for the exact head commit.
- Mark a retailer as live-verified only after an actual browser scan shows plausible product titles and usable product identifiers/URLs.

## Current branch state (2026-10-12)
- Draft PR #6: https://github.com/FelRod-Diecast/Pokemon-TCG-Store-Scanner/pull/6
- Existing branch changes repair Target's RedSky search page route and distinguish per-query matches from newly unique products in Target/Costco diagnostics.
- These changes have automated structural tests, but the Target endpoint route still needs live confirmation.
- Latest branch source SHA for `background.js` observed during review: `d25d32866969ad5cb31299c5cb6b93a032be4ab0`.
- Do not assume CI passed for the latest branch head until the exact current head and its workflow run are checked.

## Evidence from user's diagnostic export
File: `pokemon-tcg-scanner-state-2026-10-12T19-05-09-759Z.json`, exported 2026-10-12 19:05 UTC.
- Saved products: 19, all Costco; this does not demonstrate current discovery is finding fresh products.
- Last discovery: Target HTTP 200 across four searches, zero candidates; Costco HTTP 200 across six searches, zero candidates; Sam's Club HTTP 200, zero candidates after recursively walking 1,159 objects.
- Target sample rows include unrelated Pokémon merchandise; tighten query coverage/filter diagnosis before interpreting zero as no products.
- Costco returned about 205 raw rows but zero accepted candidates; inspect actual product row/title/id fields and filters.
- Sam's Club response shape includes `payload.records`, with nested `skus`, `prodProperties`, and `parentCategories`. Current generic recursive walk inspects category/metadata objects as if they could be products; replace with a conservative parser over actual product records only.
- Sam's Club query and inventory requests currently pass an empty `clubId`; document it as an unresolved configuration issue, not verified inventory coverage.
- A browser tab showed a Sam's Club challenge iframe, but current diagnostics do not prove that the API request itself was challenged. Do not bypass it.

## Work queue — execute in order
1. Inspect the latest captured response-shape diagnostics and current branch code for exact Target, Costco, and Sam's Club product-record fields.
2. Add a persistent fixture-based test suite for retailer response parsing. Use captured response data only if the export contains actual safe response content; otherwise use clearly labeled synthetic fixtures based on observed keys.
3. Replace Sam's Club's broad recursive product extraction with record-level extraction from `payload.records`; require a real product title and stable ID. Keep category/property/SKU metadata from becoming standalone products. Add tests for both valid records and irrelevant metadata.
4. Diagnose Costco's `searchResult.results[*].product` title and identifier fields using saved `sampleShape`/response-shape diagnostics. Adjust only fields supported by evidence; test positive and negative examples.
5. Revisit Target route/query coverage against live results; do not treat HTTP 200 as proof the query returned correct products.
6. Run `npm run check`, `npm test`, inspect `git diff`/PR changes, then verify CI against the exact head SHA.
7. Ask the user to run one scan in Edge/Chrome and export diagnostics only after local/CI checks are clean; compare raw rows, candidate counts, sample names, unique products, and errors before claiming improvement.
8. Update this log after each step with date, files changed, test results, evidence, and the next action. Keep PR in draft until live evidence supports merging.

## Entry format for future updates
### YYYY-MM-DD — short title
- Evidence:
- Changes:
- Tests:
- Live validation:
- Remaining risks:
- Next step:


### 2026-10-12 — Capture Sam's Club product-record fields for parser repair
- Evidence: the saved 19:05 UTC export showed a successful Sam's Club search response with `payload.records` containing 32 records, but the current recursive walk inspected 1,159 objects and returned zero candidates. The export contains response shape and sampled generic names, not the full original response body, so the exact nested product-title field is not yet proven.
- Changes: added bounded diagnostics for the first eight `payload.records` entries: record keys, product ID/id, scalar descriptor fields, scalar search/SEO fields, SKU keys, and SKU descriptor fields. Added a smoke test to guard this diagnostic output. No extraction behavior or inventory behavior was changed in this step.
- Files: `background.js`, `tests/smoke.test.js`, and this log.
- Commit/head: `dde94c400450f672f7c9293628c50459a692af66`.
- Tests: GitHub Actions run #50 for this exact head completed `npm run check` successfully and the `npm test` step successfully. Job cleanup was still marked in progress when checked; both validation steps themselves reported success.
- Live validation: not yet verified. Target and Costco still had zero accepted candidates in the latest user export; Sam's Club parser still uses the old recursive walk. No claim of working live discovery is made.
- Remaining risks: Target's new search route needs live confirmation; Costco's returned product records need deeper title/filter diagnosis; Sam's Club product title fields and empty `clubId` need verification.
- Next step: use the new record-level diagnostic samples from the next scan export to implement a record-only Sam's Club parser with positive/negative fixture tests; then inspect Costco's candidate filtering and Target query coverage. Keep PR #6 draft and `main` untouched until live evidence improves.

### 2026-10-12 — Expand Costco discovery for Pokémon 30th Anniversary products
- Evidence: user supplied screenshots of a September 30 TCG Robinhood post reporting Costco online SKU 2007497 for a Pokémon 30th Anniversary ETB + Booster Bundle 2-pack, reported online price $125.99, reported in-club combo price $57.49, and a reported depot window of October 8–9. The post itself says the online drop date is TBA; these claims are community-reported and not independently verified.
- Changes: expanded the Pokémon TCG title inclusion vocabulary to recognize the abbreviation `ETB` and the phrases `30th anniversary` and `30th celebration`; expanded Costco search queries to include `pokemon 30th anniversary`, `pokemon 30th celebration`, `pokemon ultra premium collection`, and `pokemon etb booster bundle`. Added a smoke test for the new query/filter terms.
- Files: `background.js`, `tests/smoke.test.js`, and this log.
- Commits: `838e54e93ddc91074bfcf448a8b6e703022a31f0` (filter terms), `b9cd96b44468b75d0d872681820021408ca6bb43` (Costco queries), `9cbe7b52d3c4d50da7f5d09a479e8514bacde50e` (smoke test).
- Tests: automated checks have not yet been verified against the latest head. This is query/filter coverage, not proof that Costco returns SKU 2007497 or that the parser can recognize it from live results.
- Live validation: pending. No current claim that the UPC listing or drop is confirmed.
- Remaining risks: Costco may not return these terms through its public search API; the current candidate ID/title field mapping may still be inadequate; the parser does not yet preserve external discovery leads with no live retailer result or source provenance.
- Next step: check GitHub Actions for the exact branch head; inspect and fix test failures if any. Then build a source-attributed upcoming-leads registry (community reports are leads, not confirmed retailer inventory) and continue the record-level Costco/Sam's Club parser work without changing `main`.

### 2026-10-12 — Align shared product-title filter with upcoming-product discovery
- Evidence: source review found the background discovery filter had added `ETB`, `ultra premium collection`, `30th anniversary`, and `30th celebration`, but the shared title classifier used by the extension/tests had not been updated. That inconsistency meant upcoming 30th product titles were not consistently classified across scanner components.
- Changes: updated `shared.js` to recognize the same terms and added positive tests for `Pokemon 30th Anniversary ETB + Booster Bundle` and `Pokémon 30th Celebration Ultra Premium Collection`.
- Commits: `54cab3a18028aa4cc4420d4cc431b62ef7d88cbf` (filter), `16d1009629924cde058c98e6a3a5ec1ed94a0dcb` (tests).
- Tests: pending exact-head CI verification. No local execution was available in this connector session.
- Live validation: pending. This fixes title classification only; it does not establish that Costco's API returns SKU 2007497 or that a live discovery result is saved.
- Next step: verify exact branch-head CI; then add source-attributed upcoming leads and fix retailer response parsing based on actual response samples. Keep `main` untouched.

### 2026-10-12 — Add weekly-guide Sam's Club discovery vocabulary
- Evidence: user supplied a weekly Pokémon release graphic covering Oct 12–17 that reports Sam's Club Ascended Heroes Focused Fighters boxes and ETBs, plus Target/Costco 30th Anniversary product categories. These are community-published leads, not independently confirmed inventory or drop times.
- Changes: extended background and shared title filters with `ascended heroes` and `focused fighters`; added a positive test for representative Sam's Club product titles.
- Commits: `7a954cc2495469b28026cf3c8a2e5cb9ab41c537` (background filter), `abacbc2255d1ceb8c5f16bd44ab0ee278fa2d1a1` (shared filter), `fabd525c5b97945676a0a6d659b65c66f42fdc5c` (tests).
- Tests: pending exact-head CI verification; no local test run in this connector session.
- Live validation: pending. Sam's Club currently requests a fixed browse category and still uses broad recursive extraction; adding title vocabulary does not prove the API will return the reported products.
- Next step: verify CI at the exact current head; then repair Sam's Club record-only parsing and Costco row extraction based on observed field samples. Preserve reported leads as unconfirmed and keep `main` untouched.

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

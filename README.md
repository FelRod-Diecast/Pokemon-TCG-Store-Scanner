# Pokémon TCG Store Scanner

A Manifest V3 browser extension for observing Pokémon TCG listings on Target, Costco, and Sam's Club pages opened in your browser. The same extension code is intended to work in current Chrome and Edge.

## Current implementation

- Popup dashboard with tracked listings and per-store scan timestamps.
- Button to open search pages for the three supported retailers.
- DOM-based extraction of likely product links, including retailer product paths and HTML product pages, and a Pokémon TCG title filter.
- Local persistence of seen listings, with a per-store baseline to avoid a burst of first-run alerts.
- Duplicate suppression and notifications for later new listings and recognizable availability changes.
- Three states: `in_stock`, `sold_out`, and `unknown`. Unknown observations do not overwrite a known state.

## Install in Chrome

See [Chrome installation instructions](CHROME_INSTALL.md). Briefly: download and extract the repository ZIP, open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked** on the extracted folder containing `manifest.json`.

## Install in Microsoft Edge

1. Download and extract the repository ZIP.
2. Open `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the extracted folder containing `manifest.json`.
5. Open the extension popup and click **Open store searches**.
6. Let the retailer pages load. Keep the tabs open for periodic re-checks.

## Important limitations

This is an early implementation, not a guarantee of live inventory. Retailer page structures can change and pages can return different content by region, session, or verification state. A visible listing does not guarantee that it can be purchased. Availability signals are inferred from recognizable page text and must be verified on the retailer's site. This extension does not bypass CAPTCHA, anti-bot controls, store restrictions, or automate checkout. If a page is challenged or blocked, complete any verification yourself.

The first scan for each store establishes a baseline and intentionally does not alert on every item already listed. Subsequent newly observed listings may trigger notifications.

## Validation

Run `npm run check` and `npm test` with Node.js installed. These checks cover JavaScript syntax and core filter/manifest behavior; they do **not** replace live testing against each retailer's current pages.

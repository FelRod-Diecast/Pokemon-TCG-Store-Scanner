# Pokémon TCG Store Scanner

An Edge/Chrome Manifest V3 extension that performs **automatic background discovery and availability monitoring** for Pokémon TCG listings at Target, Costco, and Sam's Club. It does not require you to keep retailer search tabs open.

## How it works

- Uses retailer-facing product search APIs from the extension service worker to discover candidate products.
- Filters out common non-TCG Pokémon merchandise.
- Saves products and their previous availability state in browser storage.
- Runs discovery on a repeating browser alarm (approximately every 5 minutes).
- Runs Target fulfillment checks on a repeating alarm (approximately every 3 minutes).
- Checks Costco and Sam's Club availability signals when their product search APIs return them.
- Notifies on newly discovered listings after the store's initial baseline, availability signals, restocks, and sellouts.
- Shows tracked products, last discovery timestamps, prices when available, and stock confidence in the popup.
- Provides a **Scan now** button to request an immediate scan cycle.

## Install in Microsoft Edge

1. Download and extract this repository ZIP.
2. Open `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the extracted folder containing `manifest.json`.
5. Leave the extension enabled. It scans in the background while Edge is running; you do not need to open search tabs.

## Install in Chrome

1. Download and extract this repository ZIP.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the extracted folder containing `manifest.json`.
5. Leave the extension enabled. It scans in the background while Chrome is running; you do not need to open search tabs.

## Important limitations

The extension depends on retailer endpoints and browser access. Retailer APIs can change, rate-limit requests, return incomplete data, or block access. A failed request must not be interpreted as a sellout. The Target configuration currently uses the same ZIP/store defaults as the Railway scanner (76040 / store 1368). Sam's Club inventory calls may require a valid club identifier; the current code mirrors the Railway scanner's empty default, so that retailer's successful response must be verified in a real browser run.

Availability is reported as a retailer signal, not a guarantee that checkout or local pickup will succeed. The extension does not bypass CAPTCHA, anti-bot checks, membership restrictions, or automate checkout. If a retailer challenges or blocks requests, it reports the error instead of attempting to evade the control.

The first successful discovery cycle for each store creates a baseline to avoid a flood of initial listing alerts. Subsequent newly discovered products can trigger notifications. Browser alarms run only while the browser and extension are available; this is not a 24/7 server process.

## Validation

Run `npm run check` and `npm test` with Node.js installed. Automated tests cover syntax and basic filter/manifest behavior, but they do not replace live API checks in Edge or Chrome.

# Install Pokémon TCG Store Scanner in Chrome

1. Open the repository: https://github.com/FelRod-Diecast/Pokemon-TCG-Store-Scanner
2. Click **Code → Download ZIP** and extract it to a folder you will keep.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the extracted folder that contains `manifest.json`.
6. Keep the extension enabled. It runs scheduled background discovery and stock checks; you do **not** need to open retailer search pages.
7. Click the extension icon to see discovered products and timestamps. Use **Scan now** to request an immediate cycle.

## What to verify

- After installation, open the extension popup and click **Scan now**.
- Wait for the retailer requests to finish, then refresh the dashboard.
- Check the extension's service-worker console from `chrome://extensions` → the extension's **service worker** link if a store remains empty. Failed retailer requests should appear there.
- Verify each product directly at the retailer. An availability signal is not a guarantee that the item can be checked out.

This is an early build. The automated tests do not prove the current retailer endpoints will respond successfully from your browser/network. It does not bypass CAPTCHA or automate checkout.

# Install in Google Chrome

The extension uses Manifest V3 APIs shared by current Google Chrome and Microsoft Edge. Use this repository as the unpacked extension in Chrome; no separate scanner codebase is required.

1. On GitHub, open the repository page and choose **Code → Download ZIP**.
2. Extract the ZIP to a permanent folder (do not select the ZIP itself).
3. In Chrome, open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the extracted `Pokemon-TCG-Store-Scanner` folder that contains `manifest.json`.
6. Pin the extension if desired, open its popup, and click **Open store searches**.
7. Leave the retailer tabs open so the content scripts can inspect the pages and re-check them periodically.

## Notes

- This is an early DOM-based scanner, not a guarantee of live inventory. Test each retailer in your own region and session.
- A product listing is not proof of local stock or successful checkout. Status is inferred from visible page text and may remain **Unknown**.
- If a retailer displays CAPTCHA or another human-verification challenge, complete it yourself. The extension does not bypass challenges or automate checkout.
- For updates, download/extract the latest repository ZIP, then use **Reload** on `chrome://extensions` after replacing the unpacked folder's files.

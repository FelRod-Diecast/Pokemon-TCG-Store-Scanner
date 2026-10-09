# Pokémon TCG Store Scanner

An Edge-first Manifest V3 browser extension for monitoring Pokémon Trading Card Game products at supported retailer pages.

## Scope

- Monitor supported Target, Costco, and Sam’s Club product/search pages when the user opens them.
- Filter results to Pokémon TCG products.
- Track observed product availability with explicit `In stock`, `Sold out`, and `Unknown` states.
- Persist observations locally and suppress duplicate alerts.
- Provide a dashboard and safe manual handling when a retailer requests human verification.

## Safety and limitations

This extension does not bypass CAPTCHA or anti-bot protections, automate checkout, or claim local inventory based only on a generic catalog listing. Availability is marked `Unknown` unless the page exposes a reliable signal. Retailer page layouts and APIs change, so each retailer adapter must be validated independently.

## Status

Repository initialized. Scanner implementation and automated tests are not yet present; this README is a scope definition, not a claim that the scanner is complete.

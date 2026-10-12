# Ammu-Nation #15 Bulk Order Calculator

Static customer-facing bulk-order calculator for GitHub Pages. No server, API keys, payment collection, or external dependencies.

## Publish on GitHub Pages

1. Create a public GitHub repository named `ammu-nation`.
2. Upload `index.html` (and optionally this README) to the repository root on the `main` branch.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, then **main** and **/(root)**. Click **Save**.
5. Open `https://YOUR-USERNAME.github.io/ammu-nation/` after deployment completes.

## Notes

- MOQ is checked per category if the cart contains that category. Weapons: 10 clan/cartel or 50 reseller. Ammo: 5,000 clan/cartel or 10,000 reseller. Body Armor is categorized as Other and has no MOQ.
- Prices are from the supplied calculator table and should be reviewed before public use.
- The site does not submit orders or collect customer information. It creates a quote to copy or download.
- Editing the price list: change the `products` array in `index.html`.

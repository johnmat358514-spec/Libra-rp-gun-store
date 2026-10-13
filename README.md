# Ammu-Nation #15 — Libra RP

Open `index.html` in a browser. No installation or build is needed. For a local HTTP preview, run `node scripts/preview.cjs`, then visit http://127.0.0.1:4175.

To deploy the site to static hosting, include `index.html`, `styles.css`, `fonts.css`, `products.js`, `app.js`, and the complete `assets` folder. The `scripts` directory is only for the optional local preview. No build step is needed.

The design follows the black-and-gold Libra RP storefront reference: Sandy Shores banner, virtual-store disclaimer, weapon/ammunition/armor tabs, a four-column desktop catalog, both pricing tiers on every product, and a right-hand shopping cart. Features include search, price sorting, product details, a persistent cart, bulk minimum checks, clipboard export and TXT downloads. All 22 original items, prices and category minimums are retained. Minimums apply only to weapon/ammunition categories present in the order; armor has no minimum. Switching tiers recalculates prices without clearing the cart.

Images and fonts are stored locally, so the site can be viewed offline. Product images are representative of fictional roleplay items. The site does not take payment or submit orders to a server; users share the copied/downloaded order with the store team in-game. Cart persistence depends on browser storage being available.

Browser verification covered all 22 product images, search, categories, sorting, product previews, pricing, bulk minimums, cart persistence, clipboard content and TXT exports. Responsive overflow checks passed at widths of 320, 390, 768, 1024 and 1440 pixels. Earlier versions remain available in the Git history.

## Artwork and font sources

- Custom hero, rifle, ammunition and vest photographs: generated with the built-in image generation tool. Optimized files: `assets/armory-hero.webp`, `assets/rifle-studio.webp`, `assets/ammo-studio.webp`, `assets/armor-studio.webp`. Source PNGs are retained. Generation prompts: `assets/IMAGE-PROMPTS.md`.
- Other product artwork: [QBCore qb-inventory image library](https://github.com/qbcore-framework/qb-inventory/tree/main/html/images), downloaded locally as `*-v2.png`. The repository license is included as `assets/QB-INVENTORY-LICENSE.txt`. Some related ammunition categories use representative shared inventory artwork.
- Barlow Condensed and DM Sans: [Google Fonts](https://github.com/google/fonts), served locally under the SIL Open Font License. License texts are in `assets/fonts`.
- Sandy Shores location banner: retained from the original website.

The root MIT license covers the website code. Third-party artwork and fonts retain their respective licenses listed above.

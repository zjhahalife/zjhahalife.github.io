# Zhou Jun — artist website

This repository contains the approved English-language artist website and its
public source data. No original computer paths or private project files are
needed to build or use it.

## Website and hosting

Website: [Zhou Jun](https://zjhahalife.github.io/)

The ready-to-serve website is in `docs/`. Open `docs/index.html` to browse it
locally. For GitHub Pages, use **Deploy from a branch**, branch **main**, folder
**/docs**. No Actions workflow, paid service, database or package installation
is required. Commit changes to `main` to update the hosted files.

## Updating the site

1. Edit the public work, exhibition or book records in `source/site-content.json`.
2. Add any new approved images or videos under `docs/assets/` and enter their
   relative paths and natural dimensions in the data.
3. Run `python tools/build.py` (or `python3 tools/build.py`).
4. Preview `docs/index.html` and the affected detail pages, then commit and push
   the updated `source/`, `tools/` and `docs/` files.

Presentation templates are in `tools/build.py`. Site typography and interactions
are in `docs/styles.css` and `docs/site.js`. All artwork must remain complete and
at its natural aspect ratio. Unknown facts must stay blank.

`source/presentation.json` controls the visual order within each year and which
projects use separate archive cards for individual images. Cards fill each row
in order, from the newest year to the oldest. A range uses its latest explicit
year for display and ordering; `present` does not introduce an inferred year.
Original year strings remain in `source/site-content.json`.

`tools/preview_scale.py` derives a shared relative scale from confirmed painting
dimensions while preserving each image's aspect ratio. A 40 cm long edge previews
at half the length of an 80 cm edge in the same context. Documentation, installation
views and open-book photographs use regular complete-image previews. Pixel limits
continue to apply when enlarging an image.

Image entry and interaction feedback are in `docs/motion.css` and `docs/motion.js`.
Keep the final artwork dimensions, native scroll/pinch behaviour and
`prefers-reduced-motion` support when adjusting them. `docs/browse.css` and
`docs/browse.js` manage the reading-position line, previous/next keyboard navigation
and the archive's session-only category/search/scroll restoration. Check keyboard
behaviour in text inputs, video players and the image viewer after changing
navigation or selectors. Update the CSS/JavaScript query versions in
`tools/build.py` when changing cached assets, then rebuild.

The resting mouse pointer is drawn by `docs/site.js` and styled in
`docs/styles.css`. The icon is `docs/assets/cursor-skull.svg`.

After the final public URL is known, run:

```text
python tools/build.py --base-url https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

This saves the URL in `source/publication.json`, adds canonical URLs and a sitemap,
and includes the approved cover composition for homepage sharing. Later normal
builds keep this deployment configuration.

## Included material

54 works, 79 documentation images, 13 full work texts, 5 complete playable videos,
12 exhibition records and 2 self-published books. Exhibition entries intentionally
show only one year, title and known venue/city. The site uses relative links and
supports being hosted at a project subpath.

The archive has 55 cards for 54 work records: the two paintings in `Desert 1&2`
appear separately and link to their respective images within the same detail page.
The Studio page uses the original CV portrait, with the photograph and copy aligned
left. Its historical CV text was not imported again.

The current artist-confirmed corrections are `HOrroor Nevel Website` at 30 × 40 cm,
`Desert 1&2` at 30 × 40 cm each, `EGG Circulate` at 120 × 80 cm, and `Sodium Ion`
dated 2026. These corrections retain the other work texts and profile information.

`NO.0` is listed with its confirmed title and year; no cover or interior images
were supplied. `Sodium Ion` is dated 2026; its support remains unspecified.

All original artwork and documentation remain the property of the artist and
their respective rights holders. No open-source licence for the artworks is
implied by this public repository.

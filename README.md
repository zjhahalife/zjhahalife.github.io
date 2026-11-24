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
4. Preview `docs/index.html`, then commit and push the updated source and `docs/`.

Presentation templates are in `tools/build.py`. Site typography and interactions
are in `docs/styles.css` and `docs/site.js`. All artwork must remain complete and
at its natural aspect ratio. Unknown facts must stay blank.

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

`NO.0` is listed with its confirmed title and year; no cover or interior images
were supplied. The year and support of `Sodium Ion` remain unspecified.

All original artwork and documentation remain the property of the artist and
their respective rights holders. No open-source licence for the artworks is
implied by this public repository.

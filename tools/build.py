"""Build the approved artist website from this repository's public content.

Requires only Python 3 standard library. No original computer paths, packages,
API keys, source PDFs, or access to this chat are needed.
"""
from pathlib import Path
from html import escape
from collections import defaultdict
from urllib.parse import urlparse, urljoin
import argparse, json, re
from xml.sax.saxutils import escape as xml_escape

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'docs'
PUBLIC_SOURCE = ROOT / 'source' / 'site-content.json'
CONFIG = ROOT / 'source' / 'publication.json'
parser = argparse.ArgumentParser(description='Rebuild the artist website.')
parser.add_argument('--base-url', help='Public HTTPS URL including its project path; saved for later builds.')
args = parser.parse_args()
config = json.loads(CONFIG.read_text(encoding='utf-8')) if CONFIG.exists() else {}
if args.base_url is not None:
    candidate = args.base_url.strip()
    if candidate:
        parsed = urlparse(candidate)
        if parsed.scheme != 'https' or not parsed.netloc or parsed.query or parsed.fragment or parsed.username or parsed.password:
            parser.error('--base-url must be a public HTTPS URL without credentials, query, or fragment.')
        config['base_url'] = candidate.rstrip('/') + '/'
    else:
        config['base_url'] = ''
    CONFIG.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
BASE_URL = config.get('base_url', '')
public_source = json.loads(PUBLIC_SOURCE.read_text(encoding='utf-8'))
works = public_source['works']
byid = {work['id']: work for work in works}
profile = public_source
source = {
    'bio': {'en': public_source['bio']},
    'statement': {'en': public_source['statement']},
    'contact': public_source['contact'],
}
STUDIO = public_source['studio']
INSTAGRAM = public_source['instagram']
E = lambda value: escape(str(value), quote=True)
categories = [('painting', 'Painting'), ('installation', 'Installation'),
              ('photography', 'Photography'), ('video', 'Video'),
              ('performance', 'Performance'), ('books', 'Artist books')]
SITE.mkdir(exist_ok=True)
(SITE / 'works').mkdir(exist_ok=True)

icon = '<svg class="instagram-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".85" fill="currentColor" stroke="none"/></svg>'

def mark(): return ''

def image(w, number=0, prefix='', eager=False, thumbnail=False):
    im = w['web_images'][number]
    src = im['thumbnail'] if thumbnail else im['src']
    alt = ', '.join(part for part in [w['title'], w['year']] if part)
    return f'<img src="{prefix}{src}" width="{im["width"]}" height="{im["height"]}" alt="{E(alt)}" loading="{"eager" if eager else "lazy"}" decoding="async">'

def header(active, prefix=''):
    cats = ''.join(f'<a class="category-link" data-category="{slug}" href="{prefix}{"books.html" if slug == "books" else "works.html?category=" + slug}">{label}</a>' for slug, label in categories)
    infos = ''.join(f'<a href="{prefix}{key}.html"'+(' aria-current="page"' if active == key else '')+f'>{label}</a>' for key, label in [('exhibitions', 'Exhibitions'), ('about', 'About'), ('contact', 'Contact')])
    primary = ''.join(f'<a href="{prefix}{url}"'+(' aria-current="page"' if active == key else '')+f'>{label}</a>' for key, url, label in [('works', 'works.html', 'Works'), ('about', 'about.html', 'Studio'), ('exhibitions', 'exhibitions.html', 'Exhibitions'), ('books', 'books.html', 'Artist books'), ('contact', 'contact.html', 'Contact')])
    return f'''<a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="artist-identity"><a class="site-name" href="{prefix}index.html" aria-label="Zhou Jun, home">Zhou Jun</a><a class="instagram-link" href="{INSTAGRAM}" target="_blank" rel="noopener noreferrer" aria-label="Instagram @zjhahalife">{icon}</a></div><nav class="desktop-navigation" aria-label="Primary">{primary}</nav><button class="menu-toggle mobile-menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu">Menu</button><nav id="site-menu" class="site-menu" aria-label="All pages" hidden><div class="menu-works"><a href="{prefix}index.html">Home</a><a class="all-works-link" href="{prefix}works.html">All works</a>{cats}</div><div class="menu-information">{infos}<a href="{INSTAGRAM}" target="_blank" rel="noopener noreferrer">Instagram</a></div></nav></header>'''

def footer(prefix=''):
    work_links = ''.join(f'<a href="{prefix}{"books.html" if slug == "books" else "works.html?category=" + slug}">{label}</a>' for slug, label in categories)
    return f'''<footer class="site-footer"><div class="footer-column"><h2>Works</h2>{work_links}</div><div class="footer-column"><h2>Studio</h2><a href="{prefix}about.html">Biography</a><a href="{prefix}exhibitions.html">Exhibitions</a><a href="{prefix}contact.html">Contact</a></div><div class="footer-column footer-location"><h2>Location</h2><p>Hangzhou, China<br>Providence, RI, USA</p></div><div class="footer-column footer-contact"><h2>Contact</h2><a href="mailto:jun00074@gmail.com">jun00074@gmail.com</a><a href="{INSTAGRAM}" target="_blank" rel="noopener noreferrer">Instagram / @zjhahalife</a></div><div class="footer-bottom"><a class="studio-signature" href="{prefix}index.html">© 2026 {E(STUDIO)}</a></div></footer>'''

def page(title, section, content, description='', prefix=''):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{E(title)} — Zhou Jun</title><meta name="description" content="{E(description or title)}"><meta property="og:title" content="{E(title)} — Zhou Jun"><meta property="og:type" content="website"><meta name="theme-color" content="#eae8e4"><link rel="icon" href="{prefix}favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="{prefix}styles.css"><script defer src="{prefix}site.js"></script></head><body class="{section}-page">{header(section, prefix)}<main id="main" class="layout-main">{content}</main>{footer(prefix)}</body></html>'''

def selected(key, cls):
    w = byid[key]
    return f'''<article class="selected-project {cls}" id="work-{key.lower()}" data-work="{key}"><a class="selected-image" href="{w['url']}" aria-label="View {E(w['title'])}"><span class="image-surface">{image(w, eager=True)}</span></a><div class="project-caption"><div class="caption-heading"><h2><a href="{w['url']}">{E(w['title'])}</a></h2><span class="project-year">{E(w['year'])}</span></div><p>{E(w['medium'])}</p><p>{E(w['size'])}</p></div></article>'''

def cover_work(key, cls):
    w = byid[key]
    im = w['web_images'][0]
    year = f'<span class="cover-year">{E(w["year"])}</span>' if w['year'] else ''
    return f'''<article class="cover-work {cls}" data-work="{key}" style="--art-ratio:{im['width']/im['height']:.8f}"><a class="cover-image" href="{w['url']}" aria-label="View {E(w['title'])}">{image(w, eager=True)}</a><div class="cover-caption"><div class="cover-caption-heading"><h2><a href="{w['url']}">{E(w['title'])}</a></h2>{year}</div><p>{E(w['medium'])}</p><p>{E(w['size'])}</p></div></article>'''

home = '<h1 class="visually-hidden">Selected works by Zhou Jun</h1><div class="cover-running"><span>Selected paintings</span><a href="works.html?category=painting">All paintings</a></div>'
home += '<section class="selected-spread" aria-label="Selected paintings">'
home += cover_work('P39', 'cover-lead')
home += cover_work('P36', 'cover-landscape cover-landscape-one')
home += cover_work('P38', 'cover-landscape cover-landscape-two')
home += '</section>'
home += '<section class="home-studio" aria-labelledby="home-studio-title"><h2 id="home-studio-title">The Studio</h2><div class="home-studio-copy"><p>Zhou Jun works with painting, sculpture, video and performance.</p><p>Based between Hangzhou, China and Providence, RI, USA.</p><p>Rhode Island School of Design<br>BFA in Sculpture, expected 2028.</p><a href="about.html">Biography</a></div></section>'
(SITE / 'index.html').write_text(page('Selected works', 'selected', home, 'Sodium Ion and two Untitled paintings by Zhou Jun. Selected works and studio information.'), encoding='utf-8')

rank = {key: i for i, key in enumerate(['P39', 'P36', 'P38', 'P01', 'P35', 'P37', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'I08', 'I01'])}
def year_number(w):
    match = re.search(r'\d{4}', w['year'])
    return int(match.group()) if match else 9999
ordered = sorted(works, key=lambda w: (-year_number(w), rank.get(w['id'], 100), w['id']))
groups = defaultdict(list)
for w in ordered:
    match = re.search(r'\d{4}', w['year'])
    groups[match.group() if match else 'Recent'].append(w)
archive = f'<div class="index-heading"><h1>Works</h1><div class="index-tools"><span id="result-count" aria-live="polite">{len(works)} works</span><input type="search" id="art-search" aria-label="Search works" placeholder="Search works" autocomplete="off"></div></div>'
archive += '<nav class="archive-categories" aria-label="Filter works"><a class="all-works-link" href="works.html" data-category="all">All</a>'+''.join(f'<a class="category-link" data-category="{slug}" href="{"books.html" if slug == "books" else "?category=" + slug}">{label}</a>' for slug, label in categories)+'</nav>'
archive += '<section class="year-group all-years" data-year="all"><div class="year-works">'
for w in ordered:
    query = ' '.join([w['title'], w['year'], w['medium'], w['size']]).lower()
    year = f'<span class="archive-year">{E(w["year"])}</span>' if w['year'] else ''
    size = f'<p class="archive-size">{E(w["size"])}</p>' if w['size'] else ''
    archive += f'<article class="archive-work" data-category="{" ".join(w["categories"])}" data-search="{E(query)}"><a href="{w["url"]}"><span class="archive-media">{image(w, thumbnail=True)}{mark()}</span><div class="archive-caption-heading"><h3>{E(w["title"])}</h3>{year}</div><p class="archive-medium">{E(w["medium"])}</p>{size}</a></article>'
archive += '</div></section>'
archive += '<p id="empty-state" hidden>No matching works.</p>'
(SITE / 'works.html').write_text(page('Works', 'works', archive, 'The work index of Zhou Jun, 2023–2026.'), encoding='utf-8')

def exhibition_information(x):
    location = '<br>'.join(E(value) for value in [x.get('venue'), x.get('location')] if value)
    return f'<p class="secondary">{location}</p>' if location else ''

ex = '<h1 class="page-title">Exhibitions</h1>'
for kind, label in [('Solo exhibition', 'Solo Exhibitions'), ('Group exhibition', 'Group Exhibitions'), ('', 'Exhibition records')]:
    entries = [entry for entry in profile['exhibitions'] if entry.get('type', '') == kind]
    if not entries: continue
    ex += f'<section class="exhibition-section"><h2>{label}</h2><div class="exhibition-list">'
    for x in entries:
        ex += f'<div class="exhibition" data-exhibition="{E(x.get("id", x["title"]))}"><span>{E(x["year"])}</span><div><p>{E(x.get("title_en", x.get("title", "")))}</p>{exhibition_information(x)}</div></div>'
    ex += '</div></section>'
(SITE / 'exhibitions.html').write_text(page('Exhibitions', 'exhibitions', ex, 'Zhou Jun, exhibition history.'), encoding='utf-8')
bio_text = source['bio']['en'].removesuffix('Rhode Island School of Design.').strip()
about = f'<div class="text-page"><h1 class="page-title">Zhou Jun</h1><p>{E(bio_text)}</p><section class="text-section"><h2>Education</h2><p>2023–present<br>Rhode Island School of Design, Providence, RI, USA<br>BFA in Sculpture, expected 2028.</p></section><section class="text-section"><h2>Artist statement</h2><p>{E(source["statement"]["en"])}</p></section><section class="text-section"><h2>Artist books</h2><p><a class="text-link" href="works/b01.html">2025 — Banana Republic</a><br>2024 — NO.0</p><p><a class="text-link" href="books.html">All artist books</a></p></section><section class="text-section"><h2>Exhibitions</h2><p><a class="text-link" href="exhibitions.html">Exhibition history</a></p></section></div>'
(SITE / 'about.html').write_text(page('About', 'about', about, 'Zhou Jun, biography and artist statement.'), encoding='utf-8')
contact = f'<div class="text-page"><h1 class="page-title">Contact</h1><p><a class="text-link" href="mailto:jun00074@gmail.com">jun00074@gmail.com</a></p><p><a class="text-link" href="{INSTAGRAM}" target="_blank" rel="noopener noreferrer">Instagram / @zjhahalife</a></p></div>'
(SITE / 'contact.html').write_text(page('Contact', 'contact', contact, 'Contact Zhou Jun.'), encoding='utf-8')

books = '<div class="books-index"><h1 class="page-title">Artist books</h1>'
for publication in sorted(profile['publications'], key=lambda entry: -entry['year']):
    title = publication['title']
    is_banana = publication.get('short_title', title) == 'Banana Republic'
    books += '<article class="publication-entry">'
    if is_banana:
        books += f'<a class="publication-image" href="works/b01.html">{image(byid["B01"], number=1, eager=True)}</a>'
    books += f'<div class="publication-copy"><div class="publication-heading"><h2>{E(title)}</h2><span>{publication["year"]}</span></div><p>Self-published artist book</p>'
    if is_banana:
        book = byid['B01']
        edition = book['edition']
        books += f'<p>{edition["pages"]} pages · Edition of {edition["print_run"]}</p><a class="text-link" href="works/b01.html">View book</a>'
    books += '</div></article>'
books += '</div>'
(SITE / 'books.html').write_text(page('Artist books', 'books', books, 'Self-published artist books by Zhou Jun: Banana Republic and NO.0.'), encoding='utf-8')

def additional_facts(w):
    facts = []
    if w.get('production_date'): facts.append(('Production date', w['production_date']))
    if w.get('publishing_method'): facts.append(('Publication', w['publishing_method']))
    if w.get('isbn'): facts.append(('ISBN', w['isbn']))
    if w.get('edition'):
        edition = w['edition']
        for field, label in [('pages', 'Pages'), ('print_run', 'Edition'), ('binding', 'Binding'), ('paper', 'Paper'), ('cover', 'Cover')]:
            if field in edition:
                value = edition[field]
                if field == 'print_run': value = f'{value} copies'
                facts.append((label, str(value)))
    if w.get('video_technical'):
        original = w['video_technical']
        facts.append(('Original video format', f'{original["original_resolution"]}, {original["original_fps"]} fps'))
        subtitled = original.get('subtitled_version')
        if subtitled:
            facts.append(('Subtitled version', f'{subtitled["language"]}, {subtitled["resolution"]}, {subtitled["fps"]} fps'))
    return facts

def paragraphs(w):
    headings = set(w.get('description_headings', []))
    return ''.join(f'<h2 class="work-text-heading">{E(text)}</h2>' if index in headings else f'<p>{E(text)}</p>' for index, text in enumerate(w.get('description_paragraphs', [])))

def credits(w):
    return ''.join(f'<p class="credit">{E(label)}: {E(value)}</p>' for label, value in w.get('credits', {}).items())

for i, w in enumerate(ordered):
    previous_work, next_work = ordered[(i-1) % len(ordered)], ordered[(i+1) % len(ordered)]
    body = '<div class="work-detail-layout"><div class="work-images" aria-label="Artwork images">'
    for n, im in enumerate(w['web_images']):
        ratio = im['width'] / im['height']
        body += f'<figure class="work-frame" style="--image-ratio:{ratio:.8f}"><button class="work-image" type="button" data-zoom="../{im["src"]}" aria-label="Enlarge {E(w["title"])}, image {n+1}"><span class="detail-image-surface">{image(w, n, "../", eager=n==0)}</span></button>'
        mobile_year = f'<span class="image-year">{E(w["year"])}</span>' if w['year'] else ''
        facts_class = 'image-caption-facts long-medium' if len(w['medium']) > 80 else 'image-caption-facts'
        body += f'<figcaption class="mobile-image-caption"><div class="image-caption-heading"><p class="image-caption-title">{E(w["title"])}</p>{mobile_year}</div><dl class="{facts_class}"><div><dt>Medium</dt><dd>{E(w["medium"])}</dd></div>'
        if w['size']: body += f'<div><dt>Dimensions</dt><dd>{E(w["size"])}</dd></div>'
        if w.get('video_duration'): body += f'<div><dt>Video duration</dt><dd>{E(w["video_duration"])}</dd></div>'
        body += '</dl>'
        if n == 0 and (w.get('description') or w.get('credits') or additional_facts(w) or w.get('video')):
            body += '<div class="image-caption-description">'
            if w.get('video'): body += '<p><a class="text-link" href="#work-video">Watch video</a></p>'
            if additional_facts(w):
                body += '<dl class="production-facts">' + ''.join(f'<div><dt>{E(label)}</dt><dd>{E(value)}</dd></div>' for label, value in additional_facts(w)) + '</dl>'
            body += paragraphs(w) + credits(w)
            if w.get('production_paragraphs'):
                body += '<section class="book-production"><h3>Book production</h3>' + ''.join(f'<p>{E(text)}</p>' for text in w['production_paragraphs']) + '</section>'
            body += '</div>'
        body += '</figcaption></figure>'
    if w.get('video'):
        video = w['video']
        body += f'<figure class="work-video" id="work-video"><video controls playsinline preload="metadata" poster="../{w["web_images"][0]["src"]}" aria-label="{E(w["title"])} — video"><source src="../{video["src"]}" type="video/mp4"><a href="../{video["src"]}">Open video</a></video><figcaption><span>{"Book interior film" if w["id"] == "B01" else "Video"}</span><span>{E(w["video_duration"])}</span></figcaption></figure>'
    year = f'<span>{E(w["year"])}</span>' if w['year'] else ''
    body += f'</div><aside class="work-information"><div class="work-heading"><h1>{E(w["title"])}</h1>{year}</div><div class="work-metadata"><dl class="work-facts"><div><dt>Medium</dt><dd>{E(w["medium"])}</dd></div>'
    if w['size']: body += f'<div><dt>Dimensions</dt><dd>{E(w["size"])}</dd></div>'
    if w.get('video_duration'): body += f'<div><dt>Video duration</dt><dd>{E(w["video_duration"])}</dd></div>'
    for label, value in additional_facts(w): body += f'<div><dt>{E(label)}</dt><dd>{E(value)}</dd></div>'
    body += '</dl>'
    if len(w['web_images']) > 1: body += f'<p class="gallery-note">Scroll to view {len(w["web_images"])} images</p>'
    if w.get('video'): body += '<p class="gallery-note"><a class="text-link" href="#work-video">Watch video</a></p>'
    body += '</div><div class="work-statement">'
    body += paragraphs(w) + credits(w)
    if w.get('production_paragraphs'):
        body += '<section class="book-production"><h2>Book production</h2>' + ''.join(f'<p>{E(text)}</p>' for text in w['production_paragraphs']) + '</section>'
    body += '</div></aside></div>'
    body += f'<nav class="work-navigation" aria-label="Work navigation"><a href="{previous_work["id"].lower()}.html">Previous</a><a href="../works.html">Index</a><a href="{next_work["id"].lower()}.html">Next</a></nav>'
    body += f'<dialog id="lightbox" class="lightbox" aria-label="Artwork image viewer"><div class="lightbox-body"><div class="lightbox-toolbar"><p>{E(w["title"])}</p><button type="button" data-close>Close</button></div><div class="lightbox-stage"><div class="lightbox-artwork"><img alt="{E(w["title"])}">{mark()}</div></div><div class="lightbox-controls"><button type="button" data-prev>Previous image</button><span data-position></span><button type="button" data-next>Next image</button></div></div></dialog>'
    description = '. '.join(part for part in [', '.join(part for part in [w['title'], w['year']] if part), w['medium']] if part) + '.'
    (SITE / w['url']).write_text(page(w['title'], 'work', body, description, '../'), encoding='utf-8')

public = {'artist': 'Zhou Jun', 'studio': STUDIO, 'instagram': INSTAGRAM,
          'bio': source['bio']['en'], 'statement': source['statement']['en'], 'works': works,
          'education': profile['education'], 'exhibitions': profile['exhibitions'],
          'publications': profile['publications'], 'contact': {'email': source['contact']['email'], 'instagram': INSTAGRAM}}
(SITE / 'works-data.json').write_text(json.dumps(public, ensure_ascii=False, indent=2), encoding='utf-8')

# Add deployment-only metadata after all approved pages have been rendered.
# Empty configuration preserves the approved HTML byte-for-byte.
html_files = sorted(SITE.rglob('*.html'))
if BASE_URL:
    urls = []
    for file in html_files:
        relative = file.relative_to(SITE).as_posix()
        canonical = urljoin(BASE_URL, relative)
        urls.append(canonical)
        extra = f'<link rel="canonical" href="{E(canonical)}"><meta property="og:url" content="{E(canonical)}">'
        cover = SITE / 'assets' / 'site-cover.png'
        if relative == 'index.html' and cover.is_file():
            image_url = urljoin(BASE_URL, 'assets/site-cover.png')
            extra += f'<meta property="og:image" content="{E(image_url)}"><meta property="og:image:width" content="1440"><meta property="og:image:height" content="900"><meta property="og:image:alt" content="Selected complete paintings by Zhou Jun"><meta name="twitter:card" content="summary_large_image">'
        html = file.read_text(encoding='utf-8')
        html = html.replace('</head>', extra + '</head>')
        file.write_text(html, encoding='utf-8')
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>' + xml_escape(url) + '</loc></url>' for url in urls) + '</urlset>\n'
    (SITE / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
    (SITE / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: ' + urljoin(BASE_URL, 'sitemap.xml') + '\n', encoding='utf-8')
elif args.base_url is not None:
    # Explicitly clearing a deployment URL also clears only generated metadata.
    (SITE / 'robots.txt').write_text('User-agent: *\nAllow: /\n', encoding='utf-8')
    sitemap = SITE / 'sitemap.xml'
    if sitemap.is_file(): sitemap.unlink()

print(json.dumps({'status': 'built', 'pages': len(html_files), 'works': len(works), 'documentation_images': sum(len(w['web_images']) for w in works), 'complete_work_texts': sum(bool(w.get('description_paragraphs')) for w in works), 'videos': sum(bool(w.get('video')) for w in works), 'exhibitions': len(profile['exhibitions']), 'publications': len(profile['publications']), 'base_url': BASE_URL}))

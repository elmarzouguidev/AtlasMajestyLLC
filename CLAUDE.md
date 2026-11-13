# CLAUDE.md — Atlas Majesty LLC website

Static marketing site (HTML, CSS, vanilla JS) for **Atlas Majesty LLC**, an SEO & digital marketing agency in Albuquerque, NM. The site was rebranded from "Solution Express Media LLC"; that old name, domain and email must never reappear.

## Git rules (strict)
- Never create, switch to, or delete git branches. Always work on the main branch.
- Never run `git add`, `git commit`, `git push`, `git reset`, `git rebase` or `git stash`. The owner handles all commits.
- Read-only git commands (`git status`, `git diff`, `git log`, `git branch`) are fine.

## Working rules
- For any task touching more than a few files, list the planned changes first and wait for confirmation.
- Don't change layout, design or service copy beyond what the task asks.
- Never invent business data (phone numbers, reviews, client names, stats, addresses). Leave `<!-- TODO: ... -->` and report it.
- End each task with a short report: files changed, anything skipped, open TODOs.

## Brand
- Full name: Atlas Majesty LLC · Short name: Atlas Majesty
- Domain: https://www.atlasmajesty.com · Email: contact@atlasmajesty.com
- Address: 1209 Mountain Road, Ste N, Albuquerque, NM 87110
- Phone: TODO (not provided yet; do not add placeholders)
- Tagline: SEO & Digital Marketing
- Logo source: `images/brand/atlas-majesty-logo.jpeg` (never modify or delete). Generated variants live in `images/brand/`.
- Use the white logo on dark backgrounds and the burgundy logo on light ones.

## Colors (defined in `:root` in `css/site.css`)
| Token | Value | Use |
|---|---|---|
| `--brand-primary` | #800020 | buttons, links, accents |
| `--brand-dark` | #650019 | hover/active, hero gradient start |
| `--brand-darkest` | #4D0013 | dark sections, footer, hero gradient end |
| `--brand-accent` | #A32648 | accents on light backgrounds only |
| `--brand-tint` | #F6E8EC | small elements: icon backgrounds, cards, badges |
| `--brand-tint-strong` | #E8B4C2 | accents and links on dark backgrounds |
| `--brand-surface` | #F8F6F4 | page background |
| `--brand-surface-2` | #F3EFEC | full-width alternate sections |

- Always use the tokens; never hardcode brand hex values. Use `rgba(var(--brand-primary-rgb), α)` for shadows and focus rings.
- Never put `--brand-accent` text on dark backgrounds (it fails contrast at about 2:1).
- Text and background pairs must meet WCAG AA (4.5:1 normal text, 3:1 large text/UI).
- No blue, navy or amber from the old theme.
- Error states: `--color-error` #EF4444 is for borders only. Small error *text* uses `--color-error-text` #DC2626 (4.8:1 on white; #EF4444 is only 3.76:1). Every error state also carries text, never color alone.
- Muted text is `--color-text-muted` #596678 (5.1:1 on `--brand-surface-2`). Never use #94A3B8 or lighter for text people read.

## Structure
- Root pages: index, about, contact, seo-services, local-seo, technical-seo, on-page-seo, seo-content, seo-audit, privacy-policy, terms-of-service, cookie-policy
- `blog/` holds the blog index and posts. `css/site.css` is the one stylesheet (layers: tokens, base, layout, components, utilities). `js/site.js` holds the site scripts and `js/forms.js` the forms. `send.php` receives the forms. `images/` holds the images.
- Header, mobile menu and footer are duplicated in every HTML file. A change to one must be applied to all pages.

## SEO conventions
- Internal home links point to `/` (root-relative). Preview with a local server (`php -S localhost:8000`), not `file://`.
- Every page needs:
  - a unique `<title>` and meta description
  - a self-referencing canonical on https://www.atlasmajesty.com
  - matching og:* and twitter:* tags
  - `<meta name="theme-color" content="#800020">`
- og:image is `https://www.atlasmajesty.com/images/og-image.jpg` (1200×630).
- JSON-LD: LocalBusiness/ProfessionalService and FAQPage on the homepage. Keep name, address, email and URL identical to the Brand section (NAP consistency).
- When adding, removing or renaming a page, update `sitemap.xml` (lastmod = today) and internal links.
- Legal pages: list any changed sentence in the report for manual review.

## Design skills
For any UI, layout, styling or redesign work, first read both skills in full and follow them:
- `design-taste-frontend`
- `better-ui`

Priority when they conflict:
1. This CLAUDE.md (brand colors, logo, SEO conventions, git rules) always wins.
2. Then the skills, for layout, typography, spacing, components and interaction.
3. Never replace brand tokens with a skill's default palette or fonts.

Redesign constraints:
- Keep all copy, URLs, page titles, meta tags, canonicals, JSON-LD and form fields unless a change is explicitly approved.
- Keep one H1 per page and the existing H1/H2 wording (SEO), even if the visual hierarchy changes.
- No frameworks or build step: plain HTML, CSS and vanilla JS only. No new external dependencies except Google Fonts.
- Performance: no layout shift, lazy-load below-the-fold images, keep CSS/JS lean (Core Web Vitals matter for an SEO agency's own site).
- Accessibility: WCAG AA contrast, visible focus states, keyboard-usable menus and FAQ, prefers-reduced-motion respected.
- Header, mobile menu and footer are duplicated in every page: change them identically everywhere.

## Redesign decisions (approved)
- **Direction:** Outfit (headings) + Figtree (text), only weights 400 and 500, loaded from Google Fonts with `display=swap`, preconnect and a non-blocking stylesheet. Metric-matched `Outfit Fallback` / `Figtree Fallback` faces prevent layout shift. `--display-weight` (400 by default) controls heading weight.
- **System:** spacing 4/8/12/16/24/32/48/64/96/128 (`--s-1…10`), type tokens `--t-*`, radius `soft` 8/12/20, one 1280px `.wrap`, 12-column grid, split line at column 7. Cards use a layered shadow ring over a transparent border; nothing nests a box in a box.
- **Rhythm:** hero (dark) → alternating `--brand-surface` / `--brand-surface-2` sections → one dark `footer.closing` that also holds the final call to action. Two dark bands only. Sections use `min-height: calc(var(--h,1) * 100svh)`, never a fixed height, so content never clips. Index and service pages follow this; blog and legal pages use a looser flow.
- **Hero:** type-led statement. No stock people, no invented dashboards or metrics. No stock photos of any kind unless the owner supplies real ones.
- **Header/nav:** opaque, fixed, hairline, no blur or shadow. Bar items: SEO Services (flat panel), Local SEO, About, Blog, Contact, plus the one primary button. "Home" and "Free Audit" are not in the bar (the logo and the button cover them); the footer keeps both links. Phones get a full-screen menu and a bottom action bar.
- **FAQ:** open in full (ruled rows, no accordion), matching the FAQPage JSON-LD.
- **Motion:** hero entrance once on load; one type-led moment per page (words settle from soft to full on scroll). Transform/opacity only, gated by `prefers-reduced-motion`. No scroll fade-ins. Hover styles only inside `@media (hover: hover)`. Press: 1px sink and scale .985; hover lifts 1px; linked cards lift 2px.
- **Forms:** no mailto and no fake success. `js/forms.js` posts with `fetch()` to `send.php` and shows "sent" only on a successful JSON response; errors appear under their fields or in the status line. `send.php`: POST only, server-side validation, honeypot field `company_url`, per-IP rate limit, same-origin check, email to contact@atlasmajesty.com via `mail()` (switch to SMTP later in `send_mail()`). Field names and order never change.
- **Images:** the blog and local-SEO JPGs with text baked into the pixels were removed from the design; none may be reintroduced. Pictures are live-text-free, have width/height, lazy-load below the fold, and content images get a 1px black 10% inset outline.
- **Icons:** one outline SVG sprite, `currentColor`, 1.5px rendered stroke. No emoji.
- **Budget per page:** CSS under 60 KB, JS under 30 KB, no layout shift from fonts, images or the header, only the fonts and weights in use.
- **Class naming:** neutral or brand names only (`btn--primary`, `card`, `tile`, `step`, `g-main`, `g-alt`). No `blue`, `navy` or `amber` in any class or selector.


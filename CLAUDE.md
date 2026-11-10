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
- Domain: https://www.atlasmajesty.com · Email: support@atlasmajesty.com
- Address: 1209 Mountain Road, Ste N, Albuquerque, NM 87110
- Phone: TODO (not provided yet; do not add placeholders)
- Tagline: SEO & Digital Marketing
- Logo source: `images/brand/atlas-majesty-logo.jpeg` (never modify or delete). Generated variants live in `images/brand/`.
- Use the white logo on dark backgrounds and the burgundy logo on light ones.

## Colors (defined in `:root` in `css/main.css`)
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
- Error states keep #EF4444 and must include an icon or text, not color alone.

## Structure
- Root pages: index, about, contact, seo-services, local-seo, technical-seo, on-page-seo, seo-content, seo-audit, privacy-policy, terms-of-service, cookie-policy
- `blog/` holds the blog index and posts. `css/main.css` is the main stylesheet. `js/main.js` holds the scripts. `images/` holds the images.
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
- 
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
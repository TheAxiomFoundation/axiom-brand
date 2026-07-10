# axiom-brand

The Axiom Foundation logo kit — every wordmark, mark, color, size, and channel export,
generated from one source of truth.

**Browse & download:** the [preview page](https://axiom-brand-sigma.vercel.app) shows everything.
**Grab-and-go:** clone this repo, or link partners straight to the preview page.
**Formats:** SVG (any size) · PNG (channel-sized, incl. transparent) · **PDF** (vector, for designers/print/Slides) · **ICO** (favicon.ico, 16+32+48).

## The logo

**∀XIOM** — the universal quantifier (a flipped A) plus XIOM, set in Geist, with
FOUNDATION as a letterspaced subline in the full lockup. Colors: the amber gradient
`#b45309 → #8a3d08` on paper `#faf9f6`, or paper-on-ink `#1c1917`. The glyphs are
outlined paths — no font required to use any file here.

## What's where

| Need | File |
|---|---|
| Zoom virtual background | `png/zoom/zoom-{paper,ink}-{full,compact}.png` (+ `zoom-centered-…`) |
| LinkedIn company logo / avatar | `png/social/avatar-400.png` (+ ink) |
| LinkedIn page cover (1128×191) | `png/linkedin/company-cover-{paper,ink}-{full,compact}.png` |
| LinkedIn personal banner (1584×396) | `png/linkedin/personal-banner-{paper,ink}-{full,compact}.png` |
| Social share / OG image (1200×630) | `png/social/og-{paper,ink}-{full,compact}.png` |
| X / Twitter header (1500×500) | `png/social/x-header-{paper,ink}-{full,compact}.png` |
| Avatar (any platform) | `png/social/avatar-400.png` / `avatar-ink-400.png` |
| GitHub org icon | `png/social/github-org-500.png` (+ ink) |
| Favicons / app icons | `png/favicons/axiom-icon-{32,180,512,1024}.png` + `png/favicons/favicon.ico` |
| Designers / print / Slides | `pdf/*.pdf` (vector: full, compact, mark, tile — gradient/ink/black) |
| Newsletter header (1200×300) | `png/email/newsletter-header-{paper,ink}-{full,compact}.png` |
| Email signature (transparent) | `png/email/signature-{full,compact}-{gradient,ink}-600w.png` |
| YouTube channel art (2560×1440) | `png/social/youtube-banner-{paper,ink}-{full,compact}.png` |
| Slides & docs (transparent, 2400w) | `png/wordmark/axiom-{full,compact}-{gradient,amber,ink,paper,white,black}-2400w.png` |
| Anything vector | `svg/wordmark/**`, `svg/mark/**` — six colors × three weights |
| Design treatments (gradients + oversize ∀) | `png/{zoom,linkedin,social,email}/*-{amberwash,inkglow,amberdeep,glyph-paper,glyph-ink}-full.png` |
| Everything at once | [Download the repo as zip](https://github.com/TheAxiomFoundation/axiom-brand/archive/refs/heads/main.zip) |

Print vendors: the SVGs are what most vendors want (vector, paths only). If someone
insists on PDF/EPS or CMYK, ask — we'll add exports rather than let them retrace.

## Weights

The site wordmark currently uses Geist **300**; this kit's channel exports use **350**
("a bit more", per the July 2026 discussion), with 300/350/400 SVG masters and a
comparison sheet (`svg/weight-compare.svg`) for the final call. Re-render every PNG at a
different weight with one flag.

## Rebuilding

```sh
npm install
node scripts/gen-svg.mjs                # SVG masters (fonts/Geist-Variable.ttf → paths)
node scripts/render-png.mjs --weight 350  # channel PNGs via headless Chrome
```

## Rules of use

- **Until brand recognition is established, outward-facing surfaces use the FULL
  lockup (FOUNDATION under AXIOM).** Compact ∀XIOM is for constrained spaces
  (favicons excepted — the ∀ tile); internal tools may use either.

- Don't retype the wordmark in a live font — always use these files (isomorphism applies
  to logos too: one source, many faithful renderings).
- Amber gradient on paper; paper wordmark on ink or amber; never amber-on-amber.
- The ∀ tile is the only square-format mark. Don't crop the wordmark into a square.
- Minimum clear space: half the ∀'s width on all sides.

## Usage terms

The ∀XIOM wordmark and mark identify the Axiom Foundation. Partners and press may use
these files unmodified to reference Axiom (articles, integration pages, event
materials). Don't alter colors/geometry, imply endorsement, or use the mark for your
own product identity. Questions: hello@axiom-foundation.org.

Geist is used under the [SIL Open Font License](https://github.com/vercel/geist-font).

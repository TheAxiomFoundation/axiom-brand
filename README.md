# axiom-brand

The Axiom Foundation logo kit — every wordmark, mark, color, size, and channel export,
generated from one source of truth.

**Browse & download:** the [preview page](https://axiom-brand.vercel.app) shows everything.
**Grab-and-go:** clone this repo, or link partners straight to the preview page.

## The logo

**∀XIOM** — the universal quantifier (a flipped A) plus XIOM, set in Geist, with
FOUNDATION as a letterspaced subline in the full lockup. Colors: the amber gradient
`#b45309 → #8a3d08` on paper `#faf9f6`, or paper-on-ink `#1c1917`. The glyphs are
outlined paths — no font required to use any file here.

## What's where

| Need | File |
|---|---|
| Zoom virtual background | `png/zoom/zoom-paper.png` (light) / `zoom-ink.png` (dark) |
| LinkedIn company logo | `png/linkedin/company-logo-400.png` |
| LinkedIn page cover | `png/linkedin/company-cover-1128x191.png` |
| LinkedIn personal banner | `png/linkedin/personal-banner-1584x396.png` (+ ink variant) |
| Social share / OG image | `png/social/og-1200x630.png` (+ ink) |
| X / Twitter header | `png/social/x-header-1500x500.png` |
| Avatar (any platform) | `png/social/avatar-400.png` (transparent corners) |
| GitHub org icon | `png/social/github-org-500.png` |
| Favicons / app icons | `png/favicons/axiom-icon-{32,180,512,1024}.png` |
| Slides & docs (transparent) | `png/wordmark/axiom-{full,compact}-{gradient,ink,paper,white}-2400w.png` |
| Anything vector | `svg/wordmark/**`, `svg/mark/**` — six colors × three weights |

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

- Don't retype the wordmark in a live font — always use these files (isomorphism applies
  to logos too: one source, many faithful renderings).
- Amber gradient on paper; paper wordmark on ink or amber; never amber-on-amber.
- The ∀ tile is the only square-format mark. Don't crop the wordmark into a square.
- Minimum clear space: half the ∀'s width on all sides.

Geist is used under the [SIL Open Font License](https://github.com/vercel/geist-font).

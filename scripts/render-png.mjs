#!/usr/bin/env node
/* Renders channel PNGs from the SVG masters via headless Chrome.
   Usage: node scripts/render-png.mjs [--weight 350]
   Each spec builds a one-off HTML stage at the exact pixel size, places the SVG,
   and screenshots it (transparent background where bg is null). */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = process.argv.includes("--weight")
  ? process.argv[process.argv.indexOf("--weight") + 1]
  : "350";
const CHROME =
  process.env.CHROME_BIN ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const PAPER = "#faf9f6", INK = "#1c1917";

/* spec: out, w, h, bg (null = transparent), svg path, place: css for the img wrapper, logoW */
const SPECS = [
  // Zoom virtual backgrounds (1920×1080) — quiet field, lockup anchored bottom-left
  { out: "zoom/zoom-paper.png", w: 1920, h: 1080, bg: PAPER,
    svg: `svg/wordmark/full/axiom-full-w${W}-gradient.svg`, logoW: 380,
    place: "position:absolute;left:72px;bottom:64px" },
  { out: "zoom/zoom-ink.png", w: 1920, h: 1080, bg: INK,
    svg: `svg/wordmark/full/axiom-full-w${W}-paper.svg`, logoW: 380,
    place: "position:absolute;left:72px;bottom:64px" },
  { out: "zoom/zoom-paper-centered.png", w: 1920, h: 1080, bg: PAPER,
    svg: `svg/wordmark/compact/axiom-w${W}-gradient.svg`, logoW: 560,
    place: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" },

  // LinkedIn
  { out: "linkedin/company-logo-400.png", w: 400, h: 400, bg: PAPER,
    svg: `svg/mark/tile/axiom-tile-w${W}-paper.svg`, logoW: 400, place: "position:absolute;inset:0" },
  { out: "linkedin/company-logo-ink-400.png", w: 400, h: 400, bg: INK,
    svg: `svg/mark/tile/axiom-tile-w${W}-ink.svg`, logoW: 400, place: "position:absolute;inset:0" },
  { out: "linkedin/company-cover-1128x191.png", w: 1128, h: 191, bg: PAPER,
    svg: `svg/wordmark/compact/axiom-w${W}-gradient.svg`, logoW: 300,
    place: "position:absolute;left:56px;top:50%;transform:translateY(-50%)" },
  { out: "linkedin/personal-banner-1584x396.png", w: 1584, h: 396, bg: PAPER,
    svg: `svg/wordmark/full/axiom-full-w${W}-gradient.svg`, logoW: 330,
    place: "position:absolute;right:96px;top:50%;transform:translateY(-50%)" },
  { out: "linkedin/personal-banner-ink-1584x396.png", w: 1584, h: 396, bg: INK,
    svg: `svg/wordmark/full/axiom-full-w${W}-paper.svg`, logoW: 330,
    place: "position:absolute;right:96px;top:50%;transform:translateY(-50%)" },

  // Social / OG
  { out: "social/og-1200x630.png", w: 1200, h: 630, bg: PAPER,
    svg: `svg/wordmark/full/axiom-full-w${W}-gradient.svg`, logoW: 520,
    place: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" },
  { out: "social/og-ink-1200x630.png", w: 1200, h: 630, bg: INK,
    svg: `svg/wordmark/full/axiom-full-w${W}-paper.svg`, logoW: 520,
    place: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" },
  { out: "social/x-header-1500x500.png", w: 1500, h: 500, bg: PAPER,
    svg: `svg/wordmark/compact/axiom-w${W}-gradient.svg`, logoW: 420,
    place: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" },
  { out: "social/avatar-400.png", w: 400, h: 400, bg: null,
    svg: `svg/mark/tile/axiom-tile-w${W}-paper.svg`, logoW: 400, place: "position:absolute;inset:0" },
  { out: "social/github-org-500.png", w: 500, h: 500, bg: null,
    svg: `svg/mark/tile/axiom-tile-w${W}-paper.svg`, logoW: 500, place: "position:absolute;inset:0" },

  // Favicons / app icons
  ...[32, 180, 512, 1024].map((s) => ({
    out: `favicons/axiom-icon-${s}.png`, w: s, h: s, bg: null,
    svg: `svg/mark/tile/axiom-tile-w${W}-paper.svg`, logoW: s, place: "position:absolute;inset:0",
  })),

  // Transparent wordmark PNGs for slides/docs
  ...["gradient", "ink", "paper", "white"].flatMap((c) => [
    { out: `wordmark/axiom-full-${c}-2400w.png`, w: 2400, h: 1030, bg: null,
      svg: `svg/wordmark/full/axiom-full-w${W}-${c}.svg`, logoW: 2400, place: "position:absolute;inset:0" },
    { out: `wordmark/axiom-compact-${c}-2400w.png`, w: 2400, h: 700, bg: null,
      svg: `svg/wordmark/compact/axiom-w${W}-${c}.svg`, logoW: 2400,
      place: "position:absolute;left:0;top:50%;transform:translateY(-50%)" },
  ]),

  // Email: newsletter header (Mailchimp) + signature logo
  { out: "email/newsletter-header-1200x300.png", w: 1200, h: 300, bg: PAPER,
    svg: `svg/wordmark/full/axiom-full-w${W}-gradient.svg`, logoW: 260,
    place: "position:absolute;left:64px;top:50%;transform:translateY(-50%)" },
  { out: "email/newsletter-header-ink-1200x300.png", w: 1200, h: 300, bg: INK,
    svg: `svg/wordmark/full/axiom-full-w${W}-paper.svg`, logoW: 260,
    place: "position:absolute;left:64px;top:50%;transform:translateY(-50%)" },
  { out: "email/signature-logo-600w.png", w: 600, h: 176, bg: null,
    svg: `svg/wordmark/compact/axiom-w${W}-gradient.svg`, logoW: 600,
    place: "position:absolute;left:0;top:50%;transform:translateY(-50%)" },

  // YouTube channel art (2560×1440; logo inside the 1546×423 all-device safe area)
  { out: "social/youtube-banner-2560x1440.png", w: 2560, h: 1440, bg: PAPER,
    svg: `svg/wordmark/compact/axiom-w${W}-gradient.svg`, logoW: 460,
    place: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" },

  // Weight comparison sheet for review
  { out: "weight-compare.png", w: 1600, h: 1100, bg: PAPER,
    svg: "svg/weight-compare.svg", logoW: 1500,
    place: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" },
];

const stage = join(root, ".stage");
mkdirSync(stage, { recursive: true });

for (const s of SPECS) {
  const outPath = join(root, "png", s.out);
  mkdirSync(dirname(outPath), { recursive: true });
  const html = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;width:${s.w}px;height:${s.h}px;background:${s.bg ?? "transparent"};overflow:hidden}</style>
<img src="file://${join(root, s.svg)}" style="${s.place};width:${s.logoW}px">`;
  const page = join(stage, "stage.html");
  writeFileSync(page, html);
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--hide-scrollbars",
    "--default-background-color=00000000",
    `--window-size=${s.w},${s.h}`,
    `--screenshot=${outPath}`,
    `file://${page}`,
  ], { stdio: "pipe" });
  console.log(`png/${s.out}`);
}
rmSync(stage, { recursive: true, force: true });
console.log("done");

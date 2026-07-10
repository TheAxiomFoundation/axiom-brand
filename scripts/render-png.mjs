#!/usr/bin/env node
/* Renders channel PNGs from the SVG masters via headless Chrome.
   Usage: node scripts/render-png.mjs [--weight 350]
   Every wordmark channel is emitted as a full matrix: {paper, ink} × {full, compact}.
   Transparent exports use tight canvases computed from the SVG's real viewBox. */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
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
const LOCKUP = {
  full: (c) => `svg/wordmark/full/axiom-full-w${W}-${c}.svg`,
  compact: (c) => `svg/wordmark/compact/axiom-w${W}-${c}.svg`,
};
const BG = { paper: { hex: PAPER, logo: "gradient" }, ink: { hex: INK, logo: "paper" } };

const aspect = (rel) => {
  const [, w, h] = readFileSync(join(root, rel), "utf8").match(/viewBox="0 0 (\d+) (\d+)"/);
  return +w / +h;
};

const SPECS = [];
const add = (out, w, h, bg, svg, logoW, place) => SPECS.push({ out, w, h, bg, svg, logoW, place });
/* tight transparent export: canvas exactly fits the SVG at the given width */
const tight = (out, svg, w) =>
  add(out, w, Math.round(w / aspect(svg)), null, svg, w, "position:absolute;inset:0");

const CENTER = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)";
const LEFT = "position:absolute;left:64px;top:50%;transform:translateY(-50%)";
const RIGHT = "position:absolute;right:96px;top:50%;transform:translateY(-50%)";
const CORNER = "position:absolute;left:72px;bottom:64px";

/* Wordmark channels — full matrix {paper,ink} × {full,compact} */
const CHANNELS = [
  { dir: "zoom", name: "zoom", w: 1920, h: 1080, place: CORNER, logoW: { full: 380, compact: 440 } },
  { dir: "zoom", name: "zoom-centered", w: 1920, h: 1080, place: CENTER, logoW: { full: 560, compact: 640 } },
  { dir: "linkedin", name: "company-cover", w: 1128, h: 191, place: LEFT, logoW: { full: 300, compact: 330 } },
  { dir: "linkedin", name: "personal-banner", w: 1584, h: 396, place: RIGHT, logoW: { full: 330, compact: 400 } },
  { dir: "social", name: "og", w: 1200, h: 630, place: CENTER, logoW: { full: 520, compact: 600 } },
  { dir: "social", name: "x-header", w: 1500, h: 500, place: CENTER, logoW: { full: 380, compact: 440 } },
  { dir: "social", name: "youtube-banner", w: 2560, h: 1440, place: CENTER, logoW: { full: 420, compact: 480 } },
  { dir: "email", name: "newsletter-header", w: 1200, h: 300, place: LEFT, logoW: { full: 240, compact: 300 } },
];
for (const c of CHANNELS)
  for (const [bgName, bg] of Object.entries(BG))
    for (const [lk, svgFor] of Object.entries(LOCKUP))
      add(`${c.dir}/${c.name}-${bgName}-${lk}.png`, c.w, c.h, bg.hex, svgFor(bg.logo), c.logoW[lk], c.place);

/* Email signature — transparent, tight, both lockups (gradient + ink) */
for (const lk of ["full", "compact"])
  for (const color of ["gradient", "ink"])
    tight(`email/signature-${lk}-${color}-600w.png`, LOCKUP[lk](color), 600);

/* Square marks: tiles for avatars/org icons in both colorways */
for (const [n, svg] of [
  ["avatar-400", `svg/mark/tile/axiom-tile-w${W}-paper.svg`],
  ["avatar-ink-400", `svg/mark/tile/axiom-tile-w${W}-ink.svg`],
]) add(`social/${n}.png`, 400, 400, null, svg, 400, "position:absolute;inset:0");
for (const [n, svg] of [
  ["github-org-500", `svg/mark/tile/axiom-tile-w${W}-paper.svg`],
  ["github-org-ink-500", `svg/mark/tile/axiom-tile-w${W}-ink.svg`],
]) add(`social/${n}.png`, 500, 500, null, svg, 500, "position:absolute;inset:0");

/* Favicons / app icons (paper tile is canonical) */
for (const s of [32, 180, 512, 1024])
  add(`favicons/axiom-icon-${s}.png`, s, s, null, `svg/mark/tile/axiom-tile-w${W}-paper.svg`, s, "position:absolute;inset:0");

/* Transparent wordmark PNGs for slides/docs — ALL six colors × both lockups, tight */
for (const c of ["gradient", "amber", "ink", "paper", "white", "black"]) {
  tight(`wordmark/axiom-full-${c}-2400w.png`, LOCKUP.full(c), 2400);
  tight(`wordmark/axiom-compact-${c}-2400w.png`, LOCKUP.compact(c), 2400);
}

/* Weight comparison sheet */
add("weight-compare.png", 1600, 1100, PAPER, "svg/weight-compare.svg", 1500, CENTER);

/* ── render ── */
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
console.log(`done — ${SPECS.length} PNGs`);

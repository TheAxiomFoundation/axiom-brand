#!/usr/bin/env node
/* Generates every SVG master in svg/ from fonts/Geist-Variable.ttf.
   The wordmark is ∀XIOM (flipped-A universal quantifier + XIOM) with an optional
   FOUNDATION subline, per the site's existing logo geometry. */
import { createRequire } from "node:module";
const fontkit = createRequire(import.meta.url)("fontkit");
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const font = fontkit.openSync(join(root, "fonts/Geist-Variable.ttf"));
const UPEM = font.unitsPerEm; // 1000

const WEIGHTS = [300, 350, 400, 450];
const RECOMMENDED = 350;

const COLORS = {
  gradient: null, // handled via <linearGradient>
  amber: "#b45309",
  ink: "#1c1917",
  paper: "#faf9f6",
  white: "#ffffff",
  black: "#000000",
};
const GRAD = `<linearGradient id="ax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b45309"/><stop offset="1" stop-color="#8a3d08"/></linearGradient>`;

const write = (rel, content) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  console.log(rel);
};

/* Lay out a string at a weight; returns glyph paths + positions in font units. */
function layout(text, wght, tracking = 0) {
  const v = font.getVariation({ wght });
  const run = v.layout(text);
  const glyphs = [];
  let x = 0;
  for (let i = 0; i < run.glyphs.length; i++) {
    glyphs.push({ d: run.glyphs[i].path.toSVG(), x, ch: text[i] });
    x += run.positions[i].xAdvance + (i < run.glyphs.length - 1 ? tracking : 0);
  }
  const first = run.glyphs[0].path.bbox, last = run.glyphs[run.glyphs.length - 1].path.bbox;
  return {
    glyphs, width: x, capHeight: font.capHeight,
    inkLeft: glyphs[0].x + first.minX,
    inkRight: glyphs[glyphs.length - 1].x + last.maxX,
  };
}

/* Render glyphs into SVG path groups. size = font size in viewBox units.
   flipFirst: mirror the first glyph vertically around the cap midline (the ∀). */
function glyphGroup(l, size, ox, oy, fill, flipFirst) {
  const s = size / UPEM;
  const cap = l.capHeight * s;
  return l.glyphs
    .map((g, i) => {
      const gx = ox + g.x * s;
      const t =
        flipFirst && i === 0
          ? `translate(${gx.toFixed(2)} ${(oy - cap).toFixed(2)}) scale(${s} ${s})`
          : `translate(${gx.toFixed(2)} ${oy.toFixed(2)}) scale(${s} ${-s})`;
      return `<g transform="${t}"><path fill="${fill}" d="${g.d}"/></g>`;
    })
    .join("\n  ");
}

function svgDoc(w, h, body, bg) {
  const rect = bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">\n<defs>${GRAD}</defs>\n${rect}\n  ${body}\n</svg>\n`;
}

const fillFor = (color) => (color === "gradient" ? "url(#ax)" : COLORS[color]);

/* ── Wordmark builders ── */
const PAD = 20; // viewBox padding around the mark
const SIZE = 310; // wordmark font size (matches existing 310)

function compact(wght, color) {
  const l = layout("AXIOM", wght, 14);
  const s = SIZE / UPEM;
  const w = l.width * s + PAD * 2;
  const cap = l.capHeight * s;
  const h = cap + PAD * 2;
  const body = glyphGroup(l, SIZE, PAD, PAD + cap, fillFor(color), true);
  return svgDoc(Math.ceil(w), Math.ceil(h), body, null);
}

function full(wght, color, subTrack = null, align = "center") {
  const l = layout("AXIOM", wght, 14);
  const s = SIZE / UPEM;
  const wordW = l.width * s;
  const cap = l.capHeight * s;
  let SUB = 80;
  let subS = SUB / UPEM;
  let sub, subX;
  if (subTrack === "fit") {
    // width-exact, maximal letters: tracking pinned at 0.10em, size solved
    const subWght = Math.min(wght + 50, 450);
    const probe = layout("FOUNDATION", subWght, 100);
    SUB = (wordW / probe.width) * UPEM;
    subS = SUB / UPEM;
    sub = probe;
    subX = PAD;
  } else if (subTrack && typeof subTrack === "object" && subTrack.fitSize) {
    // width-exact at a chosen size: tracking solved (floored at 0.10em)
    SUB = subTrack.fitSize;
    subS = SUB / UPEM;
    const subWght = Math.min(wght + 50, 450);
    const nat = layout("FOUNDATION", subWght);
    const track = Math.max(100, (wordW / subS - nat.width) / (nat.glyphs.length - 1));
    sub = layout("FOUNDATION", subWght, track);
    subX = PAD;
  } else if (subTrack !== null) {
    // fixed-tracking variants (Ariel direction): heavier FOUNDATION
    sub = layout("FOUNDATION", Math.min(wght + 100, 500), subTrack);
    subX = align === "left" ? PAD : PAD + (wordW - sub.width * subS) / 2;
  } else {
    // classic: letterspaced to span the wordmark width exactly
    const subWght = Math.min(wght + 50, 450);
    const subNat = layout("FOUNDATION", subWght);
    const track = (wordW / subS - subNat.width) / (subNat.glyphs.length - 1);
    sub = layout("FOUNDATION", subWght, track);
    subX = PAD;
  }
  const gap = 46;
  const subCap = sub.capHeight * subS;
  const w = wordW + PAD * 2;
  const h = cap + gap + subCap + PAD * 2;
  const body =
    glyphGroup(l, SIZE, PAD, PAD + cap, fillFor(color), true) +
    "\n  " +
    glyphGroup(sub, SUB, subX, PAD + cap + gap + subCap, fillFor(color), false);
  return svgDoc(Math.ceil(w), Math.ceil(h), body, null);
}

/* The canonical aligned lockup: FOUNDATION's visible ink spans exactly AXIOM's
   visible ink (side bearings accounted for), 0.18em tracking, size solved. */
function fullAligned(wght, color) {
  const l = layout("AXIOM", wght, 14);
  const s = SIZE / UPEM;
  const cap = l.capHeight * s;
  const inkL = PAD + l.inkLeft * s;           // px position of AXIOM's visible left edge
  const inkW = (l.inkRight - l.inkLeft) * s;  // px width of AXIOM's visible ink
  const subWght = Math.min(wght + 100, 500);
  const probe = layout("FOUNDATION", subWght, 180); // 0.18em tracking
  const SUB = (inkW / (probe.inkRight - probe.inkLeft)) * UPEM;
  const subS = SUB / UPEM;
  const subX = inkL - probe.inkLeft * subS;   // F's ink starts exactly at AXIOM's ink left
  const gap = 46;
  const subCap = probe.capHeight * subS;
  const w = l.width * s + PAD * 2;
  const h = cap + gap + subCap + PAD * 2;
  const body =
    glyphGroup(l, SIZE, PAD, PAD + cap, fillFor(color), true) +
    "\n  " +
    glyphGroup(probe, SUB, subX, PAD + cap + gap + subCap, fillFor(color), false);
  return svgDoc(Math.ceil(w), Math.ceil(h), body, null);
}

/* Site-today lockup, flush: same subline size/weight as the current site, but the
   letterspacing is solved against AXIOM's visible ink — F starts at the ∀'s ink,
   N ends exactly at the M's stroke (no overflow past it). */
function fullFlush(wght, color) {
  const l = layout("AXIOM", wght, 14);
  const s = SIZE / UPEM;
  const cap = l.capHeight * s;
  const inkL = PAD + l.inkLeft * s;
  const inkW = (l.inkRight - l.inkLeft) * s;
  const SUB = 80;
  const subS = SUB / UPEM;
  const subWght = Math.min(wght + 50, 450);
  const nat = layout("FOUNDATION", subWght);
  const natInkW = nat.inkRight - nat.inkLeft; // font units, ink only
  const track = (inkW / subS - natInkW) / (nat.glyphs.length - 1);
  const sub = layout("FOUNDATION", subWght, track);
  const subX = inkL - sub.inkLeft * subS;
  const gap = 46;
  const subCap = sub.capHeight * subS;
  const w = l.width * s + PAD * 2;
  const h = cap + gap + subCap + PAD * 2;
  const body =
    glyphGroup(l, SIZE, PAD, PAD + cap, fillFor(color), true) +
    "\n  " +
    glyphGroup(sub, SUB, subX, PAD + cap + gap + subCap, fillFor(color), false);
  return svgDoc(Math.ceil(w), Math.ceil(h), body, null);
}

/* ── Mark (∀ alone) and tile ── */
function mark(wght, color) {
  const l = layout("A", wght);
  const s = SIZE / UPEM;
  const w = l.width * s + PAD * 2;
  const cap = l.capHeight * s;
  const body = glyphGroup(l, SIZE, PAD, PAD + cap, fillFor(color), true);
  return svgDoc(Math.ceil(w), Math.ceil(cap + PAD * 2), body, null);
}

function tile(wght, bg, glyphColor, radiusPct = 16) {
  const l = layout("A", wght);
  const box = 100;
  const size = 115; // glyph cap ≈ 82 in the 100-box — matches the site favicon's proportions
  const s = size / UPEM;
  const cap = l.capHeight * s;
  const gw = l.width * s;
  const ox = (box - gw) / 2;
  const oy = (box - cap) / 2 + cap;
  const body =
    `<rect width="${box}" height="${box}" rx="${radiusPct}" fill="${bg}"/>\n  ` +
    glyphGroup(l, size, ox, oy, fillFor(glyphColor), true);
  return svgDoc(box, box, body, null);
}

/* ── Emit the matrix ── */
for (const w of WEIGHTS) {
  for (const color of Object.keys(COLORS)) {
    write(`svg/wordmark/full/axiom-full-w${w}-${color}.svg`, full(w, color));
    write(`svg/wordmark/full-aligned/axiom-full-aligned-w${w}-${color}.svg`, fullAligned(w, color));
    write(`svg/wordmark/full-flush/axiom-full-flush-w${w}-${color}.svg`, fullFlush(w, color));
    // fixed-tracking FOUNDATION scale (em ×100): t30 airy … t10 snug — centered and left-aligned
    for (const t of [300, 220, 160, 100]) {
      write(`svg/wordmark/full-t${t / 10}/axiom-full-t${t / 10}-w${w}-${color}.svg`, full(w, color, t));
      write(`svg/wordmark/full-l${t / 10}/axiom-full-l${t / 10}-w${w}-${color}.svg`, full(w, color, t, "left"));
    }
    write(`svg/wordmark/full-snug/axiom-full-snug-w${w}-${color}.svg`, full(w, color, 100));
    write(`svg/wordmark/full-fit/axiom-full-fit-w${w}-${color}.svg`, full(w, color, "fit"));
    // width-exact family at intermediate subline sizes (justified = size 80 end of the scale)
    for (const fs of [95, 110, 125])
      write(`svg/wordmark/full-fit${fs}/axiom-full-fit${fs}-w${w}-${color}.svg`, full(w, color, { fitSize: fs }));
    write(`svg/wordmark/compact/axiom-w${w}-${color}.svg`, compact(w, color));
    write(`svg/mark/axiom-mark-w${w}-${color}.svg`, mark(w, color));
  }
}

/* Solid-background lockups (recommended weight): logo color chosen for contrast */
const BGS = [
  ["paper", "#faf9f6", "gradient"],
  ["ink", "#1c1917", "paper"],
  ["amber", "#92400e", "paper"],
];
for (const [name, hex, logoColor] of BGS) {
  const inner = full(RECOMMENDED, logoColor);
  const compactInner = compact(RECOMMENDED, logoColor);
  // re-wrap with padding + background
  const wrap = (doc) => {
    const [, wStr, hStr] = doc.match(/viewBox="0 0 (\d+) (\d+)"/);
    const w = +wStr + 160, h = +hStr + 160;
    const body = doc.replace(/^<svg[^>]*>\n<defs>.*<\/defs>\n\n?/s, "").replace(/<\/svg>\n?$/, "");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">\n<defs>${GRAD}</defs>\n<rect width="${w}" height="${h}" fill="${hex}"/>\n<g transform="translate(80 80)">\n  ${body}\n</g>\n</svg>\n`;
  };
  write(`svg/wordmark/on-${name}/axiom-full-on-${name}.svg`, wrap(inner));
  write(`svg/wordmark/on-${name}/axiom-on-${name}.svg`, wrap(compactInner));
}

/* Tiles (all weights for the favicon-style mark; the classic = paper bg + amber ∀) */
for (const w of WEIGHTS) {
  write(`svg/mark/tile/axiom-tile-w${w}-paper.svg`, tile(w, "#faf9f6", "amber"));
  write(`svg/mark/tile/axiom-tile-w${w}-ink.svg`, tile(w, "#1c1917", "paper"));
  write(`svg/mark/tile/axiom-tile-w${w}-amber.svg`, tile(w, "#92400e", "paper"));
}

/* Weight comparison sheet (compact at each weight, labeled with Geist digits) */
{
  const rows = WEIGHTS.map((w, i) => {
    const l = layout("AXIOM", w, 14);
    const s = SIZE / UPEM;
    const cap = l.capHeight * s;
    const y = 60 + i * (cap + 110);
    const label = layout(String(w), 400);
    const ls = 44 / UPEM;
    return (
      glyphGroup(label, 44, 40, y + cap, "#78716c", false) +
      "\n  " +
      glyphGroup(l, SIZE, 200, y + cap, "#1c1917", true)
    );
  }).join("\n  ");
  const l0 = layout("AXIOM", 300, 14);
  const w = Math.ceil((l0.width * SIZE) / UPEM) + 260;
  const h = 60 + WEIGHTS.length * ((font.capHeight * SIZE) / UPEM + 110);
  write(
    `svg/weight-compare.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${Math.ceil(h)}">\n<rect width="${w}" height="${Math.ceil(h)}" fill="#faf9f6"/>\n  ${rows}\n</svg>\n`,
  );
}

console.log("done");

#!/usr/bin/env node
/* Vector PDF exports of the key masters via Chrome print-to-pdf.
   The SVG markup is inlined (not <img>) so paths stay vector in the PDF. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME =
  process.env.CHROME_BIN ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const W = process.argv.includes("--weight")
  ? process.argv[process.argv.indexOf("--weight") + 1]
  : "350";

const MASTERS = [
  `svg/wordmark/full/axiom-full-w${W}-gradient.svg`,
  `svg/wordmark/full/axiom-full-w${W}-ink.svg`,
  `svg/wordmark/full/axiom-full-w${W}-black.svg`,
  `svg/wordmark/compact/axiom-w${W}-gradient.svg`,
  `svg/wordmark/compact/axiom-w${W}-ink.svg`,
  `svg/wordmark/compact/axiom-w${W}-black.svg`,
  `svg/mark/axiom-mark-w${W}-gradient.svg`,
  `svg/mark/axiom-mark-w${W}-black.svg`,
  `svg/mark/tile/axiom-tile-w${W}-paper.svg`,
];

const stage = join(root, ".stage");
mkdirSync(stage, { recursive: true });

for (const rel of MASTERS) {
  const svg = readFileSync(join(root, rel), "utf8");
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const html = `<!doctype html><meta charset="utf-8">
<style>@page{size:${w}px ${h}px;margin:0}html,body{margin:0}svg{display:block;width:${w}px;height:${h}px}</style>
${svg}`;
  const page = join(stage, "pdf.html");
  writeFileSync(page, html);
  const out = join(root, "pdf", basename(rel).replace(/\.svg$/, ".pdf"));
  mkdirSync(dirname(out), { recursive: true });
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--no-pdf-header-footer",
    `--print-to-pdf=${out}`, `file://${page}`,
  ], { stdio: "pipe" });
  console.log(`pdf/${basename(out)}`);
}
rmSync(stage, { recursive: true, force: true });
console.log("done");

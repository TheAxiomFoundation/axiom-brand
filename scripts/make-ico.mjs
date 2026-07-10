#!/usr/bin/env node
/* Builds png/favicons/favicon.ico (16+32+48, PNG-encoded entries) from the tile SVG. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME =
  process.env.CHROME_BIN ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const W = process.argv.includes("--weight")
  ? process.argv[process.argv.indexOf("--weight") + 1]
  : "350";

const SIZES = [16, 32, 48];
const stage = join(root, ".stage-ico");
mkdirSync(stage, { recursive: true });

const pngs = SIZES.map((s) => {
  const page = join(stage, "i.html");
  writeFileSync(
    page,
    `<!doctype html><style>html,body{margin:0;width:${s}px;height:${s}px;background:transparent;overflow:hidden}</style>` +
      `<img src="file://${join(root, `svg/mark/tile/axiom-tile-w${W}-paper.svg`)}" style="width:${s}px;height:${s}px">`,
  );
  const out = join(stage, `i${s}.png`);
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--hide-scrollbars",
    "--default-background-color=00000000",
    `--window-size=${s},${s}`, `--screenshot=${out}`, `file://${page}`,
  ], { stdio: "pipe" });
  return readFileSync(out);
});

// ICO container: 6-byte header, 16-byte dir entry per image, then PNG blobs.
const count = pngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(count, 4);
let offset = 6 + 16 * count;
const entries = [], blobs = [];
pngs.forEach((buf, i) => {
  const s = SIZES[i];
  const e = Buffer.alloc(16);
  e.writeUInt8(s === 256 ? 0 : s, 0); // width
  e.writeUInt8(s === 256 ? 0 : s, 1); // height
  e.writeUInt8(0, 2);  // palette
  e.writeUInt8(0, 3);  // reserved
  e.writeUInt16LE(1, 4);  // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += buf.length;
  entries.push(e);
  blobs.push(buf);
});
const ico = Buffer.concat([header, ...entries, ...blobs]);
mkdirSync(join(root, "png/favicons"), { recursive: true });
writeFileSync(join(root, "png/favicons/favicon.ico"), ico);
rmSync(stage, { recursive: true, force: true });
console.log(`png/favicons/favicon.ico (${SIZES.join("+")}, ${ico.length} bytes)`);

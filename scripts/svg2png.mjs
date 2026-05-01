#!/usr/bin/env node
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sources = [
  { svg: 'packages/web/public/icon-192.svg', png: 'packages/web/public/icon-192.png', size: 192 },
  { svg: 'packages/web/public/icon-512.svg', png: 'packages/web/public/icon-512.png', size: 512 },
  { svg: 'packages/web/public/icon-512.svg', png: 'packages/web/public/apple-touch-icon.png', size: 180 },
];

for (const { svg, png, size } of sources) {
  const buf = await readFile(resolve(root, svg));
  await sharp(buf).resize(size, size).png().toFile(resolve(root, png));
  console.log(`generated ${png} (${size}×${size})`);
}

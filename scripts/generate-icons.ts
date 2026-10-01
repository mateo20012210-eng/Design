/** Generates PNG icons (standard, maskable, apple-touch) from public/favicon.svg. Run: npm run icons */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const svg = fs.readFileSync(path.resolve('public/favicon.svg'));
const out = path.resolve('public/icons');
fs.mkdirSync(out, { recursive: true });

async function standard(size: number, file: string) {
  await sharp(svg).resize(size, size).png().toFile(file);
}

/** Maskable icons need ~20% safe-zone padding around the artwork on a solid background. */
async function maskable(size: number, file: string) {
  const inner = Math.round(size * 0.8);
  const icon = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#0f1f3d' } })
    .composite([{ input: icon, gravity: 'center' }])
    .png()
    .toFile(file);
}

(async () => {
  await standard(192, path.join(out, 'icon-192.png'));
  await standard(512, path.join(out, 'icon-512.png'));
  await maskable(192, path.join(out, 'maskable-192.png'));
  await maskable(512, path.join(out, 'maskable-512.png'));
  // Apple touch icon: iOS applies its own rounded mask, so give it a solid background and no transparency.
  const apple = await sharp(svg).resize(180, 180).png().toBuffer();
  await sharp({ create: { width: 180, height: 180, channels: 3, background: '#0f1f3d' } })
    .composite([{ input: apple }])
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
  console.log('Icons written to public/icons and public/apple-touch-icon.png');
})();

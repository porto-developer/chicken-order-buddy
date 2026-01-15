import sharp from 'sharp';
import { readFileSync } from 'fs';

const svgBuffer = readFileSync('./public/icon.svg');

// Generate 192x192
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile('./public/icon-192x192.png');

console.log('✓ Created icon-192x192.png');

// Generate 512x512
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('./public/icon-512x512.png');

console.log('✓ Created icon-512x512.png');

console.log('✓ All PWA icons generated successfully!');

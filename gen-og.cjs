const sharp = require('sharp');
const path = require('path');

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
  <rect width='1200' height='630' fill='#c91f26'/>
  <rect x='60' y='60' width='1080' height='510' rx='20' fill='white'/>
  <text x='600' y='260' text-anchor='middle' font-family='Arial,sans-serif' font-size='72' font-weight='bold' fill='#c91f26'>Malayala Mitra</text>
  <text x='600' y='340' text-anchor='middle' font-family='Arial,sans-serif' font-size='36' fill='#333'>Malayalam News Portal</text>
  <text x='600' y='400' text-anchor='middle' font-family='Arial,sans-serif' font-size='28' fill='#666'>Breaking News | Kerala | India | World</text>
</svg>`;

const outPath = path.join(__dirname, 'assets', 'images', 'og-image.jpg');

sharp(Buffer.from(svg))
  .resize(1200, 630)
  .jpeg({ quality: 90 })
  .toFile(outPath)
  .then(() => console.log('Created:', outPath))
  .catch(e => { console.error(e); process.exit(1); });

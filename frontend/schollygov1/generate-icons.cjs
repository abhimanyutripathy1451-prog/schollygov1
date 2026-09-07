const sharp = require('sharp');
const fs = require('fs');

async function convertIcons() {
  const svgBuffer = fs.readFileSync('public/favicon.svg');
  
  await sharp(svgBuffer)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 10, g: 15, b: 28, alpha: 1 } // Matches bg-app color
    })
    .png()
    .toFile('public/logo-192.png');
    
  console.log('Created logo-192.png');
    
  await sharp(svgBuffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 10, g: 15, b: 28, alpha: 1 }
    })
    .png()
    .toFile('public/logo-512.png');
    
  console.log('Created logo-512.png');
}

convertIcons().catch(console.error);

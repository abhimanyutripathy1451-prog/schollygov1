const sharp = require('sharp');
const fs = require('fs');

async function convertIcons() {
  const svgBuffer = fs.readFileSync('public/favicon.svg');
  
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/logo-192.png');
    
  console.log('Created logo-192.png');
    
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/logo-512.png');
    
  console.log('Created logo-512.png');
}

convertIcons().catch(console.error);

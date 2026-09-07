const sharp = require('sharp');
const fs = require('fs');

async function convertIcons() {
  const imageBuffer = fs.readFileSync('C:/Users/abhim/.gemini/antigravity-ide/brain/ecb42651-fcb9-4f56-b667-2a56d90508a7/.user_uploaded/media_1788785768828.png');
  
  await sharp(imageBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/logo-192.png');
    
  console.log('Created logo-192.png');
    
  await sharp(imageBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/logo-512.png');
    
  console.log('Created logo-512.png');
}

convertIcons().catch(console.error);

const sharp = require('sharp');
const fs = require('fs');

if (!fs.existsSync('public/icons')) {
  fs.mkdirSync('public/icons');
}

async function generate() {
  try {
    await sharp('public/logo.png')
      .resize(192, 192, {
        fit: 'contain',
        background: '#F9FAFB'
      })
      .toFile('public/icons/icon-192.png');
      
    await sharp('public/logo.png')
      .resize(512, 512, {
        fit: 'contain',
        background: '#F9FAFB'
      })
      .toFile('public/icons/icon-512.png');
      
    console.log('Icons generated successfully.');
  } catch (e) {
    console.error(e);
  }
}
generate();

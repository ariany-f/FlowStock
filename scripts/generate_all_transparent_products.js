const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { fetchBuffer, decodeAnyImage, processPackshotToTransparentPNG } = require('./packshot_utils');

const PROD_DIR = path.join(__dirname, '..', 'assets', 'products');

async function processItem(name, source, options = {}) {
  console.log(`Processing ${name}...`);
  try {
    let rawBuf;
    if (source.startsWith('http')) {
      rawBuf = await fetchBuffer(source);
    } else {
      rawBuf = fs.readFileSync(path.join(PROD_DIR, source));
    }

    const decoded = decodeAnyImage(rawBuf);
    const resultPng = processPackshotToTransparentPNG(decoded, options);
    const outFile = path.join(PROD_DIR, `${name}.png`);
    fs.writeFileSync(outFile, PNG.sync.write(resultPng));
    console.log(`✓ Saved ${name}.png (${resultPng.width}x${resultPng.height})`);
  } catch (err) {
    console.error(`✗ Error processing ${name}:`, err.message);
  }
}

async function run() {
  console.log('=== GENERATING TRANSPARENT PRODUCT PACKSHOTS ===');

  // 1. Spaten (Garrafa / Lata)
  await processItem('spaten', 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Spaten_Hell.jpg', {
    threshold: 235,
    diffTolerance: 40
  });

  // 2. Brahma (Garrafa / Lata)
  await processItem('brahma', 'https://upload.wikimedia.org/wikipedia/commons/5/57/Brahma_da_AmBev_Mercosur.JPG', {
    threshold: 230,
    diffTolerance: 35
  });

  // 3. Corona Extra (Long Neck)
  await processItem('corona', 'raw_4.png', {
    threshold: 240,
    diffTolerance: 30
  });

  // 4. Heineken (330ml Long Neck)
  await processItem('heineken', 'raw_1.png', {
    threshold: 230,
    diffTolerance: 30
  });

  // 5. Heineken 600ml
  await processItem('heineken_600', 'raw_6.png', {
    threshold: 230,
    diffTolerance: 35
  });

  // 6. Tanqueray London Dry
  await processItem('tanqueray', 'https://upload.wikimedia.org/wikipedia/commons/a/af/Tanqueray_bottle_Gin.png', {
    threshold: 240,
    diffTolerance: 30
  });

  // 7. Johnnie Walker Black Label
  await processItem('johnnie_walker', 'https://upload.wikimedia.org/wikipedia/commons/2/21/Johnnie_Walker_Black_Label.jpg', {
    threshold: 235,
    diffTolerance: 35
  });

  // 8. Absolut Vodka
  await processItem('absolut', 'absolut.png', {
    threshold: 240,
    diffTolerance: 30
  });

  // 9. Guaraná Antarctica
  await processItem('guarana', 'https://images.openfoodfacts.org/images/products/789/199/100/0826/front_pt.43.400.jpg', {
    threshold: 235,
    diffTolerance: 40
  });

  // 10. Red Bull Energy Drink
  await processItem('redbull', 'https://images.openfoodfacts.org/images/products/061/126/999/1000/front_pt.135.400.jpg', {
    threshold: 235,
    diffTolerance: 40
  });

  // 11. Eisenbahn Pilsen
  await processItem('eisenbahn', 'raw_7.png', {
    threshold: 240,
    diffTolerance: 30
  });

  // 12. Erdinger Weißbier
  await processItem('erdinger', 'raw_10.png', {
    threshold: 240,
    diffTolerance: 30
  });

  // 13. Barril de Inox Chopp
  await processItem('keg_inox', 'keg_inox_photo.jpg', {
    threshold: 220,
    diffTolerance: 45
  });

  // 14. Monin Xarope
  await processItem('monin', 'monin.jpg', {
    threshold: 230,
    diffTolerance: 35
  });

  // 15. Gelo em cubos
  await processItem('ice', 'ice.jpg', {
    threshold: 230,
    diffTolerance: 35
  });

  console.log('=== ALL TRANSPARENT PACKSHOTS COMPLETE ===');
}

run();

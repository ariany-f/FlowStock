const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { decodeAnyImage, processPackshotToTransparentPNG } = require('./packshot_utils');

const PROD_DIR = path.join(__dirname, '..', 'assets', 'products');

function processLocal(name, file, options = {}) {
  console.log(`Processing local ${name} from ${file}...`);
  const rawBuf = fs.readFileSync(path.join(PROD_DIR, file));
  const decoded = decodeAnyImage(rawBuf);
  const resultPng = processPackshotToTransparentPNG(decoded, options);
  const outFile = path.join(PROD_DIR, `${name}.png`);
  fs.writeFileSync(outFile, PNG.sync.write(resultPng));
  console.log(`✓ Saved ${name}.png (${resultPng.width}x${resultPng.height})`);
}

// Spaten
processLocal('spaten', 'spaten.jpg', {
  threshold: 220,
  diffTolerance: 35
});

// Brahma
processLocal('brahma', 'brahma.jpg', {
  threshold: 220,
  diffTolerance: 35
});

// Tanqueray
processLocal('tanqueray', 'tanqueray.jpg', {
  threshold: 220,
  diffTolerance: 35
});

console.log('Done processing local items!');

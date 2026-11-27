const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

function loadRawRgba(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileBuf = fs.readFileSync(filePath);
  if (ext === '.png') {
    const png = PNG.sync.read(fileBuf);
    return { width: png.width, height: png.height, data: png.data };
  } else if (ext === '.jpg' || ext === '.jpeg') {
    const raw = jpeg.decode(fileBuf, { useTArray: true, formatAsRGBA: true });
    return { width: raw.width, height: raw.height, data: raw.data };
  }
  throw new Error('Unsupported format: ' + ext);
}

function removeBackgroundAndCrop(imageObj, options = {}) {
  const { width, height, data } = imageObj;
  const {
    threshold = 240,       // Max brightness for white detection
    diffTolerance = 30,    // Color difference tolerance from corner bg
    edgeTolerance = 45,    // Edge gradient tolerance
  } = options;

  // Sample corner colors
  const cornerCoords = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)]
  ];
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (const [cx, cy] of cornerCoords) {
    const idx = (cy * width + cx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
    bgCount++;
  }
  bgR /= bgCount;
  bgG /= bgCount;
  bgB /= bgCount;

  function isBgColor(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a < 30) return true;

    // Check if bright white/near white
    if (r >= threshold && g >= threshold && b >= threshold) return true;

    // Distance to sampled bg
    const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
    return dist < diffTolerance;
  }

  // BFS Flood fill from perimeter
  const isBg = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x++) {
    const tIdx = (0 * width + x) * 4;
    const bIdx = ((height - 1) * width + x) * 4;
    if (isBgColor(tIdx)) { queue.push(x, 0); visited[0 * width + x] = 1; }
    if (isBgColor(bIdx)) { queue.push(x, height - 1); visited[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    const lIdx = (y * width + 0) * 4;
    const rIdx = (y * width + (width - 1)) * 4;
    if (isBgColor(lIdx) && !visited[y * width + 0]) { queue.push(0, y); visited[y * width + 0] = 1; }
    if (isBgColor(rIdx) && !visited[y * width + (width - 1)]) { queue.push(width - 1, y); visited[y * width + (width - 1)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const pIdx = cy * width + cx;
    isBg[pIdx] = 1;

    // Check 4 neighbors
    const nbs = [ [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1] ];
    for (let i = 0; i < 4; i++) {
      const nx = nbs[i][0];
      const ny = nbs[i][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBgColor(nIdx * 4)) {
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Find tight bounding box of product
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!isBg[idx]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    // Fallback if whole image flagged
    minX = 0; maxX = width - 1; minY = 0; maxY = height - 1;
  }

  // Add small 2% padding
  const padX = Math.max(4, Math.floor((maxX - minX) * 0.02));
  const padY = Math.max(4, Math.floor((maxY - minY) * 0.02));
  const cropX0 = Math.max(0, minX - padX);
  const cropX1 = Math.min(width - 1, maxX + padX);
  const cropY0 = Math.max(0, minY - padY);
  const cropY1 = Math.min(height - 1, maxY + padY);

  const cropW = cropX1 - cropX0 + 1;
  const cropH = cropY1 - cropY0 + 1;

  const outPng = new PNG({ width: cropW, height: cropH });

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcX = cropX0 + x;
      const srcY = cropY0 + y;
      const srcIdx = (srcY * width + srcX) * 4;
      const destIdx = (y * cropW + x) * 4;

      if (isBg[srcY * width + srcX]) {
        outPng.data[destIdx] = 0;
        outPng.data[destIdx + 1] = 0;
        outPng.data[destIdx + 2] = 0;
        outPng.data[destIdx + 3] = 0; // Fully transparent
      } else {
        // Soft edge anti-aliasing: if neighbor is background and pixel is light, blend alpha
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];
        let alpha = data[srcIdx + 3];

        // Check if adjacent to background
        let hasBgNeighbor = false;
        if (srcX > 0 && isBg[srcY * width + (srcX - 1)]) hasBgNeighbor = true;
        if (srcX < width - 1 && isBg[srcY * width + (srcX + 1)]) hasBgNeighbor = true;
        if (srcY > 0 && isBg[(srcY - 1) * width + srcX]) hasBgNeighbor = true;
        if (srcY < height - 1 && isBg[(srcY + 1) * width + srcX]) hasBgNeighbor = true;

        if (hasBgNeighbor) {
          const brightness = (r + g + b) / 3;
          if (brightness > 220) {
            alpha = Math.max(40, Math.min(255, Math.floor(255 * (1 - (brightness - 220) / 40))));
          }
        }

        outPng.data[destIdx] = r;
        outPng.data[destIdx + 1] = g;
        outPng.data[destIdx + 2] = b;
        outPng.data[destIdx + 3] = alpha;
      }
    }
  }

  return outPng;
}

// Test on one file
const input = 'assets/products/raw_4.png';
const loaded = loadRawRgba(input);
const result = removeBackgroundAndCrop(loaded, { threshold: 240, diffTolerance: 30 });
fs.writeFileSync('assets/products/corona_test.png', PNG.sync.write(result));
console.log('Successfully created corona_test.png! Size:', result.width, 'x', result.height);

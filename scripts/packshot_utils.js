const https = require('https');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'FlowStockApp/1.0 (Mozilla/5.0)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url} (status ${res.statusCode})`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function decodeAnyImage(buf, extHint = '') {
  // Check PNG signature
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    const png = PNG.sync.read(buf);
    return { width: png.width, height: png.height, data: png.data };
  }
  // JPEG
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    const raw = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
    return { width: raw.width, height: raw.height, data: raw.data };
  }
  throw new Error('Unknown image format');
}

function processPackshotToTransparentPNG(imageObj, options = {}) {
  const { width, height, data } = imageObj;
  const {
    threshold = 230,
    diffTolerance = 35,
    sampleMargin = 2,
  } = options;

  // Sample perimeter colors
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (let x = 0; x < width; x += 10) {
    const tIdx = (0 * width + x) * 4;
    const bIdx = ((height - 1) * width + x) * 4;
    bgR += data[tIdx] + data[bIdx];
    bgG += data[tIdx + 1] + data[bIdx + 1];
    bgB += data[tIdx + 2] + data[bIdx + 2];
    bgCount += 2;
  }
  for (let y = 0; y < height; y += 10) {
    const lIdx = (y * width + 0) * 4;
    const rIdx = (y * width + (width - 1)) * 4;
    bgR += data[lIdx] + data[rIdx];
    bgG += data[lIdx + 1] + data[rIdx + 1];
    bgB += data[lIdx + 2] + data[rIdx + 2];
    bgCount += 2;
  }
  bgR /= bgCount;
  bgG /= bgCount;
  bgB /= bgCount;

  function isBgPixel(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a < 25) return true;

    // Direct bright white
    if (r >= threshold && g >= threshold && b >= threshold) return true;

    // Euclidean distance to border background
    const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
    return dist < diffTolerance;
  }

  const isBg = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x++) {
    const tIdx = (0 * width + x) * 4;
    const bIdx = ((height - 1) * width + x) * 4;
    if (isBgPixel(tIdx)) { queue.push(x, 0); visited[0 * width + x] = 1; }
    if (isBgPixel(bIdx)) { queue.push(x, height - 1); visited[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    const lIdx = (y * width + 0) * 4;
    const rIdx = (y * width + (width - 1)) * 4;
    if (isBgPixel(lIdx) && !visited[y * width + 0]) { queue.push(0, y); visited[y * width + 0] = 1; }
    if (isBgPixel(rIdx) && !visited[y * width + (width - 1)]) { queue.push(width - 1, y); visited[y * width + (width - 1)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const pIdx = cy * width + cx;
    isBg[pIdx] = 1;

    const nbs = [ [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1] ];
    for (let i = 0; i < 4; i++) {
      const nx = nbs[i][0];
      const ny = nbs[i][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBgPixel(nIdx * 4)) {
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Tight bounding box of the product
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
    minX = 0; maxX = width - 1; minY = 0; maxY = height - 1;
  }

  // Padding 2%
  const padX = Math.max(2, Math.floor((maxX - minX) * 0.02));
  const padY = Math.max(2, Math.floor((maxY - minY) * 0.02));
  const cropX0 = Math.max(0, minX - padX);
  const cropX1 = Math.min(width - 1, maxX + padX);
  const cropY0 = Math.max(0, minY - padY);
  const cropY1 = Math.min(height - 1, maxY + padY);

  const cropW = cropX1 - cropX0 + 1;
  const cropH = cropY1 - cropY0 + 1;

  const out = new PNG({ width: cropW, height: cropH });

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcX = cropX0 + x;
      const srcY = cropY0 + y;
      const srcIdx = (srcY * width + srcX) * 4;
      const destIdx = (y * cropW + x) * 4;

      if (isBg[srcY * width + srcX]) {
        out.data[destIdx] = 0;
        out.data[destIdx + 1] = 0;
        out.data[destIdx + 2] = 0;
        out.data[destIdx + 3] = 0;
      } else {
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];
        let alpha = data[srcIdx + 3];

        // Feather border
        let hasBgNeighbor = false;
        if (srcX > 0 && isBg[srcY * width + (srcX - 1)]) hasBgNeighbor = true;
        if (srcX < width - 1 && isBg[srcY * width + (srcX + 1)]) hasBgNeighbor = true;
        if (srcY > 0 && isBg[(srcY - 1) * width + srcX]) hasBgNeighbor = true;
        if (srcY < height - 1 && isBg[(srcY + 1) * width + srcX]) hasBgNeighbor = true;

        if (hasBgNeighbor) {
          const brightness = (r + g + b) / 3;
          if (brightness > 210) {
            alpha = Math.max(30, Math.min(255, Math.floor(255 * (1 - (brightness - 210) / 45))));
          }
        }

        out.data[destIdx] = r;
        out.data[destIdx + 1] = g;
        out.data[destIdx + 2] = b;
        out.data[destIdx + 3] = alpha;
      }
    }
  }

  return out;
}

module.exports = {
  fetchBuffer,
  decodeAnyImage,
  processPackshotToTransparentPNG
};

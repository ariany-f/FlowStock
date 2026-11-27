const https = require('https');
const fs = require('fs');
const path = require('path');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeXD(url, label) {
  console.log('Fetching HTML for ' + label + '...');
  const html = await fetch(url);
  const matchProto = html.match(/window\.prototypeData\s*=\s*(\{[\s\S]*?\});/);
  if (!matchProto) {
    console.log('Could not find prototypeData in HTML for ' + label);
    return;
  }
  const protoData = JSON.parse(matchProto[1]);
  console.log('Found prototypeData for ' + label + ':', {
    manifestURL: protoData.manifestURL ? protoData.manifestURL.substring(0, 100) + '...' : null,
    docId: protoData.docId,
    title: protoData.title || protoData.name
  });

  if (protoData.manifestURL) {
    const manifestJsonStr = await fetch(protoData.manifestURL);
    const manifest = JSON.parse(manifestJsonStr);
    console.log('Manifest parsed! Artboards count: ' + (manifest.artboards ? manifest.artboards.length : 0));
    fs.writeFileSync('xd_manifest_' + label + '.json', JSON.stringify(manifest, null, 2));
    
    // Save details to output
    if (manifest.artboards) {
      manifest.artboards.forEach((ab, idx) => {
        console.log(`[${label}] #${idx + 1}: "${ab.name}" (id: ${ab.id}, w: ${ab.width}, h: ${ab.height})`);
      });
    }
  }
}

(async () => {
  try {
    await scrapeXD('https://xd.adobe.com/view/2d12dda9-014c-4f33-9028-5fd2f07b5ff7-7841/grid/', 'flow1');
    console.log('-------------------------------------------');
    await scrapeXD('https://xd.adobe.com/view/1b4766a8-267b-4b99-8791-5fccc1061ffa-4e14/grid/', 'june10');
  } catch (err) {
    console.error('Error:', err);
  }
})();

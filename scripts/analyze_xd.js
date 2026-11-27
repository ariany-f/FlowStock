const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}: ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function fetchText(url) {
  return fetchBuffer(url).then(b => b.toString('utf8'));
}

function extractTexts(node, texts = []) {
  if (!node) return texts;
  if (node.text && node.text.rawText) {
    const raw = node.text.rawText.trim();
    if (raw && !texts.includes(raw)) texts.push(raw);
  }
  if (node.name && typeof node.name === 'string') {
    // If name looks like a label
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractTexts(child, texts);
    }
  }
  if (node.artboards && Array.isArray(node.artboards)) {
    for (const ab of node.artboards) {
      extractTexts(ab, texts);
    }
  }
  return texts;
}

async function analyzeProject(pageUrl, projectDir, label) {
  console.log(`\n=================== ANALYZING ${label} ===================`);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const html = await fetchText(pageUrl);
  const matchProto = html.match(/window\.prototypeData\s*=\s*(\{[\s\S]*?\});/);
  if (!matchProto) {
    console.error(`Cannot find prototypeData in ${pageUrl}`);
    return;
  }
  const proto = JSON.parse(matchProto[1]);
  const token = proto.linkTemplate.data.access_token;
  const apiKey = proto.linkTemplate.data.api_key;
  const docUrn = proto.manifest.id;
  const artboards = proto.manifest.artboards || [];

  console.log(`Project: "${proto.manifest.name}", Total Artboards: ${artboards.length}`);

  const results = [];

  for (let i = 0; i < artboards.length; i++) {
    const ab = artboards[i];
    const safeName = ab.name.replace(/[/\\?%*:|"<>]/g, '_').trim();
    const prefix = String(i + 1).padStart(2, '0');
    const thumbComp = (ab.components || []).find(c => c.rel === 'thumbnail' || c.path.endsWith('.png'));
    const agcComp = (ab.components || []).find(c => c.type === 'agc');

    let thumbFile = null;
    if (thumbComp) {
      const thumbUrl = `https://cdn-sharing.adobecc.com/content/storage/id/${docUrn};revision=0?component_id=${thumbComp.id}&api_key=${apiKey}&access_token=${token}`;
      thumbFile = path.join(projectDir, `${prefix}_${safeName}.png`);
      try {
        const imgBuf = await fetchBuffer(thumbUrl);
        fs.writeFileSync(thumbFile, imgBuf);
      } catch (e) {
        console.error(`Error fetching thumb for ${ab.name}:`, e.message);
      }
    }

    let texts = [];
    if (agcComp) {
      const agcUrl = `https://cdn-sharing.adobecc.com/content/storage/id/${docUrn};revision=0?component_id=${agcComp.id}&api_key=${apiKey}&access_token=${token}`;
      try {
        const agcJsonStr = await fetchText(agcUrl);
        const agcObj = JSON.parse(agcJsonStr);
        texts = extractTexts(agcObj);
      } catch (e) {
        console.error(`Error fetching agc for ${ab.name}:`, e.message);
      }
    }

    results.push({
      index: i + 1,
      id: ab.id,
      name: ab.name,
      bounds: ab.bounds,
      thumbFile: thumbFile ? path.basename(thumbFile) : null,
      texts: texts
    });

    console.log(`[${prefix}/${artboards.length}] ${ab.name} -> ${texts.length} text items`);
  }

  fs.writeFileSync(path.join(projectDir, 'summary.json'), JSON.stringify(results, null, 2));
  console.log(`Saved summary to ${path.join(projectDir, 'summary.json')}`);
}

(async () => {
  try {
    const outBase = path.join(__dirname, '..', 'xd_analysis');
    await analyzeProject('https://xd.adobe.com/view/1b4766a8-267b-4b99-8791-5fccc1061ffa-4e14/grid/', path.join(outBase, 'june10_mobile'), 'June 10 Mobile App');
    await analyzeProject('https://xd.adobe.com/view/2d12dda9-014c-4f33-9028-5fd2f07b5ff7-7841/grid/', path.join(outBase, 'flow1_web'), 'Flow 1 Web/Admin App');
  } catch (err) {
    console.error('Fatal error:', err);
  }
})();

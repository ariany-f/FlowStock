const https = require('https');
const fs = require('fs');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function extractAllTexts(node, list = []) {
  if (!node) return list;
  if (node.text && node.text.rawText) {
    const t = node.text.rawText.trim();
    if (t && !list.includes(t)) list.push(t);
  }
  const children = node.children || (node.artboard && node.artboard.children) || [];
  for (const c of children) {
    extractAllTexts(c, list);
  }
  return list;
}

async function dumpTexts(pageUrl, label) {
  console.log('\n==============================\n' + label + '\n==============================');
  const html = await fetchText(pageUrl);
  const match = html.match(/window\.prototypeData\s*=\s*(\{[\s\S]*?\});/);
  const proto = JSON.parse(match[1]);
  const token = proto.linkTemplate.data.access_token;
  const apiKey = proto.linkTemplate.data.api_key;
  const docUrn = proto.manifest.id;
  const artboards = proto.manifest.artboards || [];
  
  const screens = [];
  for (let i = 0; i < artboards.length; i++) {
    const ab = artboards[i];
    const agcComp = (ab.components || []).find(c => c.type === 'agc');
    let texts = [];
    if (agcComp) {
      const u = 'https://cdn-sharing.adobecc.com/content/storage/id/' + docUrn + ';revision=0?component_id=' + agcComp.id + '&api_key=' + apiKey + '&access_token=' + token;
      try {
        const rawAgc = await fetchText(u);
        const agcObj = JSON.parse(rawAgc);
        texts = extractAllTexts(agcObj);
      } catch (e) {}
    }
    screens.push({ index: i + 1, name: ab.name, texts: texts });
    console.log(`[#${i + 1}] ${ab.name}: ${texts.join(' | ').substring(0, 100)}`);
  }
  fs.writeFileSync('texts_' + label.replace(/\s+/g, '_') + '.json', JSON.stringify(screens, null, 2));
}

(async () => {
  await dumpTexts('https://xd.adobe.com/view/1b4766a8-267b-4b99-8791-5fccc1061ffa-4e14/grid/', 'june10');
  await dumpTexts('https://xd.adobe.com/view/2d12dda9-014c-4f33-9028-5fd2f07b5ff7-7841/grid/', 'flow1');
})();

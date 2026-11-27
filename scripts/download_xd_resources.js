const https = require('https');
const fs = require('fs');
const path = require('path');

async function checkXdResources() {
  const html = await (new Promise((res, rej) => {
    https.get('https://xd.adobe.com/view/1b4766a8-267b-4b99-8791-5fccc1061ffa-4e14/grid/', r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    }).on('error', rej);
  }));
  const matchProto = html.match(/window\.prototypeData\s*=\s*(\{[\s\S]*?\});/);
  const proto = JSON.parse(matchProto[1]);
  const token = proto.linkTemplate.data.access_token;
  const apiKey = proto.linkTemplate.data.api_key;
  const docUrn = proto.manifest.id;
  const resources = proto.manifest.resources || {};
  
  const outDir = path.join(__dirname, '..', 'xd_analysis', 'resources');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Total XD resources:', Object.keys(resources).length);
  let idx = 0;
  for (const [key, resObj] of Object.entries(resources)) {
    idx++;
    const u = 'https://cdn-sharing.adobecc.com/content/storage/id/' + docUrn + ';revision=0?component_id=' + resObj.id + '&api_key=' + apiKey + '&access_token=' + token;
    await new Promise(done => {
      https.get(u, r => {
        const chunks = [];
        r.on('data', c => chunks.push(c));
        r.on('end', () => {
          const buf = Buffer.concat(chunks);
          const ct = r.headers['content-type'] || '';
          const ext = ct.includes('png') ? 'png' : 'jpg';
          console.log(`Resource ${idx} [${key}]: ${ct} (${buf.length} bytes)`);
          fs.writeFileSync(path.join(outDir, `xd_res_${idx}.${ext}`), buf);
          done();
        });
      });
    });
  }
}
checkXdResources();

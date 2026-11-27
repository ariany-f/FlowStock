const fs = require('fs');
let html = '<html><body><h1>Raw Products</h1><div style="display:flex;flex-wrap:wrap;gap:10px;">';
fs.readdirSync('assets/products').filter(f => f.startsWith('raw_')).forEach(f => {
  const b64 = fs.readFileSync('assets/products/' + f).toString('base64');
  html += '<div style="border:1px solid #ccc;padding:5px;text-align:center;"><img src="data:image/png;base64,' + b64 + '" style="max-width:120px;max-height:120px;"/><p>' + f + '</p></div>';
});
html += '</div><h1>Brand Assets</h1><div style="display:flex;flex-wrap:wrap;gap:10px;">';
fs.readdirSync('assets/brand').forEach(f => {
  const b64 = fs.readFileSync('assets/brand/' + f).toString('base64');
  html += '<div style="border:1px solid #ccc;padding:5px;text-align:center;"><img src="data:image/png;base64,' + b64 + '" style="max-width:120px;max-height:120px;"/><p>' + f + '</p></div>';
});
html += '</div></body></html>';
fs.writeFileSync('public/raw_preview.html', html);
console.log('raw preview created');

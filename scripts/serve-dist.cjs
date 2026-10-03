// Minimal local SPA server for testing production bundles, not a deployment server.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
for (const [name, port] of [['mf-host', 4200], ['remote', 4201], ['plain-host', 4202]]) {
  const output = path.resolve(__dirname, '..', 'dist', name);
  const root = fs.existsSync(path.join(output, 'browser')) ? path.join(output, 'browser') : output;
  http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end(); return; }
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (path.extname(pathname)) { res.writeHead(404).end(); return; }
      file = path.join(root, 'index.html');
    }
    if (!fs.existsSync(file)) { res.writeHead(503).end('Run npm run build first'); return; }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`${name}: http://localhost:${port}`));
}

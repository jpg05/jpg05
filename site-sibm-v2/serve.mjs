// Petit serveur statique local pour prévisualiser dist/ (URLs sans extension, 404 personnalisée).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT || 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf' };
const redirects = Object.fromEntries(
  fs.existsSync(path.join(DIST, '_redirects'))
    ? fs.readFileSync(path.join(DIST, '_redirects'), 'utf8').split('\n').filter(Boolean).map((l) => { const [a, b] = l.split(/\s+/); return [a, b]; })
    : []
);
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (redirects[p]) { res.writeHead(301, { Location: redirects[p] }); return res.end(); }
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  const tries = [p, p + '.html', path.join(p, 'index.html')];
  for (const t of tries) {
    const f = path.join(DIST, t);
    if (f.startsWith(DIST) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      return fs.createReadStream(f).pipe(res);
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(path.join(DIST, '404.html')).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));

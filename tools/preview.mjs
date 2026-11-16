// Servidor local para ver o Dom Web Financeiro no modo demonstração.
// Uso: npm run preview  →  abra http://localhost:8789
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const porta = Number(process.env.PORT || 8789);
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

http
  .createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const arq = path.join(raiz, path.normalize(p));
    if (!arq.startsWith(raiz)) return res.writeHead(403).end();
    try {
      const dados = await fs.readFile(arq);
      res.writeHead(200, { 'Content-Type': tipos[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(dados);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
    }
  })
  .listen(porta, () => console.log(`Dom Web Financeiro em http://localhost:${porta}`));

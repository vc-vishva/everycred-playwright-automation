/**
 * Lightweight static server for viewing the generated report (reports/ dir).
 * No external dependencies — plain Node http + fs.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const REPORTS_DIR = path.join(__dirname, 'reports');
const PORT = Number(process.env.REPORT_SERVER_PORT) || 4173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.zip': 'application/zip',
};

function resolveSafePath(requestUrl) {
  const decoded = decodeURIComponent(requestUrl.split('?')[0]);
  const requested = decoded === '/' ? '/summary.html' : decoded;
  // Normalize and confirm the resolved path stays inside REPORTS_DIR to prevent
  // path traversal (e.g. "/../../secret.env").
  const resolved = path.normalize(path.join(REPORTS_DIR, requested));
  if (!resolved.startsWith(REPORTS_DIR)) {
    return null;
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  const filePath = resolveSafePath(req.url || '/');

  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad request');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Report server running at http://localhost:${PORT}`);
  console.log(`Serving: ${REPORTS_DIR}`);
});

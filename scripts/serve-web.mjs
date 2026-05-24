import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const port = Number(process.env.WEB_PORT || 5173);
const apiTarget = process.env.API_TARGET || "http://localhost:8787";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400).end();
    return;
  }
  if (req.url.startsWith("/api/")) {
    proxyApi(req, res);
    return;
  }
  const pathname = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
  const safePath = path.normalize(path.join(dist, pathname));
  const target = safePath.startsWith(dist) && fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(dist, "index.html");
  const ext = path.extname(target);
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
  fs.createReadStream(target).pipe(res);
});

function proxyApi(req, res) {
  const targetUrl = new URL(req.url, apiTarget);
  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers: { ...req.headers, host: targetUrl.host }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on("error", () => {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "API 服务不可用" }));
  });
  req.pipe(proxyReq);
}

server.listen(port, "0.0.0.0", () => {
  console.log(`Web server listening on http://localhost:${port}`);
});

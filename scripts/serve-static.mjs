import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
const root = path.resolve("out");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
await fs.access(path.join(root, "index.html"));
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let name = decodeURIComponent(url.pathname);
      if (name.endsWith("/")) name += "index.html";
      const target = path.resolve(root, "." + name);
      if (!target.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const bytes = await fs.readFile(target);
      res.writeHead(200, {
        "Content-Type":
          mime[path.extname(target)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(bytes);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Re:Learn static export: http://127.0.0.1:4173/"),
  );

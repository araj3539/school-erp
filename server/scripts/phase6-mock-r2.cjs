const http = require("node:http");
const store = new Map();
const port = Number(process.env.MOCK_R2_PORT || 4569);
function keyOf(url) { return decodeURIComponent(url.pathname.replace(/^\//, "")); }
const server = http.createServer((req, res) => {
  const key = keyOf(new URL(req.url, `http://${req.headers.host}`));
  if (req.method === "PUT") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => { store.set(key, Buffer.concat(chunks)); res.writeHead(200).end(); });
    return;
  }
  if (req.method === "GET") {
    const body = store.get(key);
    if (!body) return res.writeHead(404).end();
    res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": body.length });
    res.end(body);
    return;
  }
  if (req.method === "DELETE") { store.delete(key); return res.writeHead(204).end(); }
  res.writeHead(405).end();
});
server.listen(port, "127.0.0.1", () => console.log(`Mock R2 listening on ${port}`));

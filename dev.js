// dev.js – Zero-dependency local dev server (Node 18+)
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

// ── Load .env ──────────────────────────────────────────────
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    });
}

// ── Route map: URL path -> handler file ────────────────────
const routes = {
  "/api/tasks": require("./api/tasks"),
  "/api/study": require("./api/study"),
  "/api/search": require("./api/search"),
};

// ── MIME types for static files ────────────────────────────
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// ── Helpers to mimic Vercel's req/res interface ────────────
function parseQuery(urlObj) {
  const q = {};
  urlObj.searchParams.forEach((v, k) => (q[k] = v));
  return q;
}

function wrapResponse(raw) {
  let _status = 200;
  const headers = { "Content-Type": "application/json" };
  const res = {
    status(code) { _status = code; return res; },
    setHeader(k, v) { headers[k] = v; return res; },
    json(data) {
      raw.writeHead(_status, headers);
      raw.end(JSON.stringify(data));
    },
  };
  return res;
}

async function readBody(raw) {
  const chunks = [];
  for await (const chunk of raw) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString();
  try { return JSON.parse(text); } catch { return {}; }
}

// ── Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const server = http.createServer(async (rawReq, rawRes) => {
  const urlObj = new URL(rawReq.url, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname;

  // ── API route ──
  const handler = routes[pathname];
  if (handler) {
    const body = ["POST", "PUT", "PATCH"].includes(rawReq.method)
      ? await readBody(rawReq)
      : undefined;

    const req = {
      method: rawReq.method,
      headers: rawReq.headers,
      query: parseQuery(urlObj),
      body,
    };
    const res = wrapResponse(rawRes);

    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      if (!rawRes.headersSent) {
        rawRes.writeHead(500, { "Content-Type": "application/json" });
        rawRes.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
    return;
  }

  // ── Static file serving from /public ──
  let filePath = path.join(__dirname, "public", pathname === "/" ? "index.html" : pathname);

  // If path doesn't exist, serve index.html (SPA fallback)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, "public", "index.html");
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || "application/octet-stream";

  try {
    const content = fs.readFileSync(filePath);
    rawRes.writeHead(200, { "Content-Type": mime });
    rawRes.end(content);
  } catch {
    rawRes.writeHead(404);
    rawRes.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`\n  DayLog dev server running at  http://localhost:${PORT}\n`);
});

// OpenDice.exe: serves the built web app on this computer and opens it.
//
// Built by scripts/build-exe.mjs into a Node single executable application;
// the files of apps/web/dist are embedded as SEA assets. Nothing is installed
// and nothing leaves this computer: the server listens on 127.0.0.1 only.
//
// The port is fixed because the browser keeps roll history per address; a
// changing port would look like an empty history every launch. If the port is
// taken, another Open Dice is most likely already running, so the browser is
// pointed at it and this copy exits.
"use strict";

const http = require("node:http");
const { execFile } = require("node:child_process");
const sea = require("node:sea");

const HOST = "127.0.0.1";
const PORT = Number(process.env.OPEN_DICE_PORT) || 5179;
const URL_ = `http://${HOST}:${PORT}/`;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const files = new Set(JSON.parse(sea.getAsset("manifest.json", "utf8")));

function typeOf(name) {
  const dot = name.lastIndexOf(".");
  return TYPES[dot >= 0 ? name.slice(dot).toLowerCase() : ""] || "application/octet-stream";
}

function openBrowser(url) {
  const [cmd, args] = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
    : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  execFile(cmd, args, () => {});
}

const server = http.createServer((req, res) => {
  let name;
  try {
    name = decodeURIComponent(new URL(req.url, URL_).pathname).replace(/^\/+/, "") || "index.html";
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (!files.has(name)) name = "index.html";        // single page app: unknown paths get the app
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  const body = Buffer.from(sea.getAsset("dist/" + name));
  res.writeHead(200, {
    "Content-Type": typeOf(name),
    "Content-Length": body.length,
    "Cache-Control": name.startsWith("assets/") ? "max-age=31536000, immutable" : "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(req.method === "HEAD" ? undefined : body);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Open Dice is already running at ${URL_}`);
    if (!process.env.OPEN_DICE_NO_BROWSER) openBrowser(URL_);
    setTimeout(() => process.exit(0), 500);
    return;
  }
  console.error("Open Dice could not start:", err.message);
  setTimeout(() => process.exit(1), 5000);
});

server.listen(PORT, HOST, () => {
  console.log(`Open Dice: ${URL_}`);
  console.log("Close this window to stop it.");
  if (!process.env.OPEN_DICE_NO_BROWSER) openBrowser(URL_);
});

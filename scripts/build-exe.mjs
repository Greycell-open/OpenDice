// Build OpenDice.exe in the project folder: the web app in a Node single executable.
//
//   npm run exe
//
// Runs after `npm run build` (the npm script does both). Embeds every file of
// apps/web/dist as a SEA asset next to scripts/exe-launcher.cjs, copies this
// Node binary and injects the blob with postject. The result needs nothing
// installed. It is unsigned, so Windows SmartScreen may ask once.
// https://nodejs.org/api/single-executable-applications.html
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "apps", "web", "dist");
const work = join(root, ".sea-build");
const exe = join(root, process.platform === "win32" ? "OpenDice.exe" : "OpenDice");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(dist).map((f) => relative(dist, f).split(sep).join("/"));
if (!files.includes("index.html")) throw new Error("apps/web/dist has no index.html: run npm run build first");

rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
writeFileSync(join(work, "manifest.json"), JSON.stringify(files));

const assets = { "manifest.json": join(work, "manifest.json") };
for (const f of files) assets["dist/" + f] = join(dist, ...f.split("/"));

const blob = join(work, "sea-prep.blob");
writeFileSync(join(work, "sea-config.json"), JSON.stringify({
  main: join(root, "scripts", "exe-launcher.cjs"),
  output: blob,
  disableExperimentalSEAWarning: true,
  useCodeCache: false,
  assets,
}, null, 1));

execFileSync(process.execPath, ["--experimental-sea-config", join(work, "sea-config.json")], { stdio: "inherit" });
rmSync(exe, { force: true });
copyFileSync(process.execPath, exe);
// npx is a .cmd on Windows, which needs a shell, so paths with spaces
// ("Control Center") are quoted there.
const win = process.platform === "win32";
const q = (a) => (win ? `"${a}"` : a);
execFileSync(win ? "npx.cmd" : "npx", ["--yes", "postject@1.0.0-alpha.6", q(exe), "NODE_SEA_BLOB", q(blob),
  "--sentinel-fuse", "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
  ...(process.platform === "darwin" ? ["--macho-segment-name", "NODE_SEA"] : [])],
  { stdio: "inherit", shell: win });
rmSync(work, { recursive: true, force: true });
console.log(`Built ${relative(root, exe)} (${(statSync(exe).size / 1048576).toFixed(0)} MB, ${files.length} app files)`);

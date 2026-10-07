import { mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, ["--experimental-strip-types", path.join(root, "scripts/prepare-catalog.mjs")], { stdio: "inherit" });
const archive = path.join(root, "assets/riot-images.tar.gz");
const assets = path.join(root, "assets");
const parts = readdirSync(assets).filter(name => /^riot-images\.part-\d{3}$/.test(name)).sort();
if (parts.length) writeFileSync(archive, Buffer.concat(parts.map(name => readFileSync(path.join(assets, name)))));
if (!existsSync(archive)) throw new Error("Pacote de imagens locais não encontrado.");
const destination = path.join(root, "public/assets");
mkdirSync(destination, { recursive: true });
execFileSync("tar", ["-xzf", archive, "-C", destination]);
console.log("Imagens locais do Aegis preparadas.");

import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const rootDir = process.cwd();
const tempExportDir = fs.mkdtempSync(path.join(os.tmpdir(), "cic_export_"));
const zipPath = path.join(rootDir, "cloud-ide-copilot.zip");

const excludedDirs = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  ".trigger",
  "dist",
  "build",
  "coverage",
  "out",
]);

function shouldExclude(name, isDirectory) {
  if (isDirectory && excludedDirs.has(name)) return true;
  if (name === ".env.example") return false;
  if (name === ".env" || name.startsWith(".env.")) return true;
  if (/\.(pem|key|p12|pfx|zip|tsbuildinfo)$/i.test(name)) return true;
  if (/^(credentials|service-account).*\.json$/i.test(name)) return true;
  return false;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  const name = path.basename(src);
  if (shouldExclude(name, stat.isDirectory())) return;

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

for (const file of fs.readdirSync(rootDir)) {
  copyRecursive(path.join(rootDir, file), path.join(tempExportDir, file));
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

if (process.platform === "win32") {
  execFileSync("tar.exe", ["-a", "-cf", zipPath, "*"], { cwd: tempExportDir, shell: true });
} else {
  execFileSync("zip", ["-qr", zipPath, "."], { cwd: tempExportDir });
}

fs.rmSync(tempExportDir, { recursive: true, force: true });
console.log(`ZIP_CREATED_SUCCESSFULLY=${zipPath}`);
console.log(`ZIP_SIZE_BYTES=${fs.statSync(zipPath).size}`);

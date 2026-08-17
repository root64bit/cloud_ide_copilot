import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const rootDir = process.cwd();
const tempExportDir = fs.mkdtempSync(path.join(os.tmpdir(), "cic_export_"));

const excluded = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  "dist",
  "coverage",
  "cloud-ide-copilot.zip",
]);

function shouldExclude(name) {
  if (excluded.has(name)) return true;
  if (name.startsWith(".env")) return true;
  if (name.endsWith(".pem") || name.endsWith(".key") || name.endsWith(".zip")) return true;
  return false;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      if (shouldExclude(file)) continue;
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log("Staging clean files into:", tempExportDir);
for (const file of fs.readdirSync(rootDir)) {
  if (shouldExclude(file)) continue;
  copyRecursive(path.join(rootDir, file), path.join(tempExportDir, file));
}

const zipPath = path.join(rootDir, "cloud-ide-copilot.zip");
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log("Compressing archive with tar.exe to:", zipPath);
execSync(`tar.exe -a -cf "${zipPath}" *`, { cwd: tempExportDir });

fs.rmSync(tempExportDir, { recursive: true, force: true });
console.log("ZIP_CREATED_SUCCESSFULLY:", fs.statSync(zipPath).size, "bytes");

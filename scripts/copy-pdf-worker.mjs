import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = join(root, "..", "public");
const dest = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.error("[copy-pdf-worker] Source not found:", src);
  process.exit(1);
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

copyFileSync(src, dest);
console.log("[copy-pdf-worker] Copied pdf.worker.min.mjs to public/");

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".edgeone/**",
    ".vercel/**",
    "out/**",
    "build/**",
    "public/pdf.worker.min.mjs",
    "next-env.d.ts",
    "**/._*",
    "._*",
    "debug-*.js",
    "fix-*.js",
    "fix-parser.js",
  ]),
]);

export default eslintConfig;

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const distDir = path.resolve(rootDir, "dist");

// Clean out dist directory if emptyOutDir behavior is expected
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const publicSources = [
  path.resolve(rootDir, ".output/public"),
  path.resolve(rootDir, "public"),
];

// Copy public assets from .output/public and public into dist
for (const pub of publicSources) {
  if (fs.existsSync(pub)) {
    fs.cpSync(pub, distDir, { recursive: true, force: true });
  }
}

// Inspect dist/assets to discover bundled index-*.js and styles-*.css
const assetsDir = path.resolve(distDir, "assets");
let jsFile = "";
let cssFile = "";

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  jsFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js")) || "";
  cssFile = files.find((f) => f.endsWith(".css")) || "";
}

const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NCATEX - National Conference on Advanced Trends in Electronics and Telecommunication Engineering</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    ${cssFile ? `<link rel="stylesheet" crossorigin href="/assets/${cssFile}">` : ""}
  </head>
  <body>
    <div id="root"></div>
    ${jsFile ? `<script type="module" crossorigin src="/assets/${jsFile}"></script>` : `<script type="module" src="/src/main.tsx"></script>`}
  </body>
</html>
`;

fs.writeFileSync(path.resolve(distDir, "index.html"), htmlContent, "utf8");

// Also ensure .output/public has index.html if it exists
const outputPublic = path.resolve(rootDir, ".output/public");
if (fs.existsSync(outputPublic)) {
  fs.writeFileSync(path.resolve(outputPublic, "index.html"), htmlContent, "utf8");
}

console.log("✓ Successfully generated dist/index.html with asset paths:");
if (cssFile) console.log(`  <link rel="stylesheet" crossorigin href="/assets/${cssFile}">`);
if (jsFile) console.log(`  <script type="module" crossorigin src="/assets/${jsFile}"></script>`);

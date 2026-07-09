import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const distRoot = join(process.cwd(), "dist");
const indexPath = join(distRoot, "index.html");
const fallbackPath = join(distRoot, "404.html");

if (!existsSync(indexPath)) {
  throw new Error("Cannot create GitHub Pages SPA fallback because dist/index.html does not exist.");
}

copyFileSync(indexPath, fallbackPath);
console.log("Created dist/404.html for GitHub Pages SPA fallback.");

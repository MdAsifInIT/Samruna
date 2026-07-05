import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const distRoot = join(root, "dist");
const browserSourceRoots = [
  join(root, "src", "app"),
  join(root, "src", "components"),
  join(root, "src", "domain"),
  join(root, "src", "features"),
  join(root, "src", "fixtures"),
  join(root, "src", "App.tsx"),
  join(root, "src", "main.tsx"),
  join(root, "src", "styles.css")
];

const forbiddenBundlePatterns = [
  "OPENAI_API_KEY",
  "Bearer ",
  "api.openai.com",
  "/v1/responses",
  "OpenAiResponsesProvider"
];

const forbiddenAppPatterns = [
  "OPENAI_API_KEY",
  "Bearer ",
  "api.openai.com",
  "../ai/",
  "../../ai/",
  "ai/providers",
  "../ai/providers",
  "OpenAiResponsesProvider"
];

if (!existsSync(distRoot)) {
  throw new Error("dist/ was not found. Run npm run build before scanning the frontend bundle.");
}

scanFiles(distRoot, [".html", ".js", ".css"], forbiddenBundlePatterns, "frontend bundle");
scanPaths(browserSourceRoots, [".ts", ".tsx", ".css"], forbiddenAppPatterns, "browser source");

console.log("Frontend secret scan passed.");

function scanFiles(directory, extensions, patterns, label) {
  for (const file of listFiles(directory, extensions)) {
    const content = readFileSync(file, "utf8");

    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        throw new Error(`${label} contains forbidden pattern "${pattern}" in ${file}`);
      }
    }
  }
}

function scanPaths(paths, extensions, patterns, label) {
  for (const path of paths) {
    if (!existsSync(path)) {
      continue;
    }

    const stat = statSync(path);

    if (stat.isDirectory()) {
      scanFiles(path, extensions, patterns, label);
      continue;
    }

    if (!extensions.some((extension) => path.endsWith(extension))) {
      continue;
    }

    const content = readFileSync(path, "utf8");

    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        throw new Error(`${label} contains forbidden pattern "${pattern}" in ${path}`);
      }
    }
  }
}

function listFiles(directory, extensions) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      files.push(...listFiles(path, extensions));
    } else if (extensions.some((extension) => path.endsWith(extension))) {
      files.push(path);
    }
  }

  return files;
}

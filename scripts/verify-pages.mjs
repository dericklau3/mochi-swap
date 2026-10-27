import process from "node:process";
import console from "node:console";
import { readFileSync, statSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";

const directory = resolve(process.argv[2] || "dist");
const basePath = "/mochi-swap/";

try {
  const html = readFileSync(resolve(directory, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  const styles = [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter(([tag]) => /\brel=["']stylesheet["']/i.test(tag))
    .map(([tag]) => tag.match(/\bhref=["']([^"']+)["']/i)?.[1]);
  if (!scripts.length) throw new Error("No compiled entry script found in index.html.");

  for (const asset of [...scripts, ...styles]) {
    if (!asset || /\/src\/|\.(?:ts|tsx|jsx)(?:[?#]|$)|@vite\/client/.test(asset)) {
      throw new Error(`Unbuilt source referenced in deployment HTML: ${asset}`);
    }
    if (!asset.startsWith(basePath)) throw new Error(`Asset must use ${basePath} as its base path: ${asset}`);
    const file = resolve(directory, asset.slice(basePath.length).split(/[?#]/)[0]);
    const pathFromRoot = relative(directory, file);
    if (pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) throw new Error(`Asset is outside the deployment directory: ${asset}`);
    if (!statSync(file).isFile()) throw new Error(`Missing deployment asset: ${asset}`);
  }
  console.log(`Verified Pages artifact: ${scripts.length} script(s), ${styles.length} stylesheet(s).`);
} catch (error) {
  console.error(`Pages artifact verification failed: ${error.message}`);
  process.exitCode = 1;
}

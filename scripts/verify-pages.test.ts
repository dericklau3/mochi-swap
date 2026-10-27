// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const fixtures: string[] = [];
function artifact(html: string, files: string[] = []) {
  const dir = mkdtempSync(join(tmpdir(), "mochi-pages-"));
  fixtures.push(dir);
  for (const file of files) {
    mkdirSync(join(dir, file, ".."), { recursive: true });
    writeFileSync(join(dir, file), "/* built asset */");
  }
  writeFileSync(join(dir, "index.html"), html);
  return spawnSync(process.execPath, [resolve("scripts/verify-pages.mjs"), dir], { encoding: "utf8" });
}
afterEach(() => fixtures.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("Pages deployment artifact verification", () => {
  it("accepts compiled JS and CSS under the repository base path", () => {
    const result = artifact('<script type="module" src="/mochi-swap/assets/app-123.js"></script><link rel="stylesheet" href="/mochi-swap/assets/app-123.css">', ["assets/app-123.js", "assets/app-123.css"]);
    expect(result.status, result.stderr).toBe(0);
  });
  it("rejects the source HTML responsible for the deployed blank page", () => {
    const result = artifact('<div id="root"></div><script type="module" src="/src/main.tsx"></script>');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Unbuilt source");
  });
  it("rejects a build with an incorrect repository base path", () => {
    const result = artifact('<script type="module" src="/assets/app.js"></script>', ["assets/app.js"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Asset must use /mochi-swap/");
  });
  it("rejects missing scripts or styles instead of publishing a broken app", () => {
    const result = artifact('<script type="module" src="/mochi-swap/assets/app.js"></script><link rel="stylesheet" href="/mochi-swap/assets/missing.css">', ["assets/app.js"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("missing.css");
  });
});

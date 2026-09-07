import { existsSync, mkdirSync, copyFileSync, watch, readdirSync } from "node:fs";
import { join } from "node:path";

function copyAll(srcDir, destDir, extension) {
  if (!existsSync(srcDir)) return;
  mkdirSync(destDir, { recursive: true });
  for (const name of readdirSync(srcDir)) {
    if (!name.endsWith(extension)) continue;
    copyFileSync(join(srcDir, name), join(destDir, name));
  }
}

function watchDir(srcDir, destDir, extension) {
  if (!existsSync(srcDir)) return;
  copyAll(srcDir, destDir, extension);
  watch(srcDir, (_event, filename) => {
    if (!filename?.endsWith(extension)) return;
    mkdirSync(destDir, { recursive: true });
    copyFileSync(join(srcDir, filename), join(destDir, filename));
    console.log(`[watch-assets] copied ${join(srcDir, filename)} -> ${join(destDir, filename)}`);
  });
  console.log(`[watch-assets] watching ${srcDir}`);
}

watchDir("src/styles", "dist/styles", ".css");
watchDir("src/assets/icons", "dist/assets/icons", ".svg");

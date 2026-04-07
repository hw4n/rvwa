import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const standaloneNodeModules = path.join(standaloneRoot, "node_modules");
const pnpmHoistedRoot = path.join(standaloneNodeModules, ".pnpm", "node_modules");
const pnpmStoreRoot = path.join(standaloneNodeModules, ".pnpm");

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function removeIfExists(targetPath) {
  if (exists(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function ensureParent(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function copyRealEntry(sourcePath, destinationPath) {
  const stats = fs.lstatSync(sourcePath);

  if (stats.isSymbolicLink()) {
    try {
      const resolvedPath = fs.realpathSync(sourcePath);
      copyRealEntry(resolvedPath, destinationPath);
      return;
    } catch {
      const packageName = inferPackageNameFromPath(sourcePath);
      const fallbackPath = resolveBrokenHoistedPackage(packageName);

      if (!fallbackPath) {
        console.warn(`Skipping unresolved hoisted dependency: ${packageName}`);
        return;
      }

      copyRealEntry(fallbackPath, destinationPath);
      return;
    }
  }

  removeIfExists(destinationPath);
  ensureParent(destinationPath);

  if (stats.isDirectory()) {
    fs.cpSync(sourcePath, destinationPath, {
      recursive: true,
      force: true,
      dereference: true,
    });
    return;
  }

  fs.copyFileSync(sourcePath, destinationPath);
}

function inferPackageNameFromPath(sourcePath) {
  const relativePath = path.relative(pnpmHoistedRoot, sourcePath);
  const segments = relativePath.split(path.sep).filter(Boolean);

  if (segments[0]?.startsWith("@")) {
    return `${segments[0]}/${segments[1]}`;
  }

  return segments[0] ?? path.basename(sourcePath);
}

function resolveBrokenHoistedPackage(packageName) {
  const escapedName = packageName.replace("/", "+");
  const candidates = fs
    .readdirSync(pnpmStoreRoot)
    .filter((entry) => entry === escapedName || entry.startsWith(`${escapedName}@`))
    .map((entry) => path.join(pnpmStoreRoot, entry, "node_modules", packageName))
    .filter(exists)
    .sort();

  return candidates.at(-1) ?? null;
}

function main() {
  if (!exists(pnpmHoistedRoot)) {
    throw new Error(`Missing pnpm hoisted node_modules: ${pnpmHoistedRoot}`);
  }

  for (const entry of fs.readdirSync(pnpmHoistedRoot)) {
    const sourcePath = path.join(pnpmHoistedRoot, entry);
    const destinationPath = path.join(standaloneNodeModules, entry);
    copyRealEntry(sourcePath, destinationPath);
  }
}

main();

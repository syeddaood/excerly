#!/usr/bin/env node
/**
 * npm workspaces nests Expo/React Native packages under apps/mobile when versions
 * differ across workspaces. Metro/babel at the repo root must resolve the mobile
 * versions — link (or replace) them into root node_modules.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const mobileNodeModules = path.join(root, "apps/mobile/node_modules");
const rootNodeModules = path.join(root, "node_modules");

if (!fs.existsSync(mobileNodeModules)) {
  process.exit(0);
}

const FORCE_REPLACE = new Set([
  "react",
  "react-dom",
  "react-native",
  "expo",
]);

function ensureSymlink(relativeFromRoot, targetDir, force = false) {
  const linkPath = path.join(rootNodeModules, relativeFromRoot);
  const topLevel = relativeFromRoot.split(path.sep)[0];

  if (fs.existsSync(linkPath)) {
    const shouldForce = force || FORCE_REPLACE.has(topLevel);
    if (!shouldForce) {
      return;
    }

    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(linkPath);
    } else {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  }

  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  const relativeTarget = path.relative(path.dirname(linkPath), targetDir);
  fs.symlinkSync(relativeTarget, linkPath, "dir");
}

function shouldLinkPackage(name) {
  return (
    name === "expo" ||
    name.startsWith("expo-") ||
    name === "react-native" ||
    name.startsWith("react-native-") ||
    name === "react" ||
    name === "react-dom" ||
    name === "@expo" ||
    name === "@react-native"
  );
}

for (const entry of fs.readdirSync(mobileNodeModules)) {
  if (entry === ".bin") {
    continue;
  }

  const entryPath = path.join(mobileNodeModules, entry);
  if (!fs.statSync(entryPath).isDirectory()) {
    continue;
  }

  if (entry.startsWith("@")) {
    if (entry !== "@expo" && entry !== "@react-native") {
      continue;
    }

    for (const scopedPackage of fs.readdirSync(entryPath)) {
      ensureSymlink(
        path.join(entry, scopedPackage),
        path.join(entryPath, scopedPackage),
        entry === "@react-native",
      );
    }
    continue;
  }

  if (shouldLinkPackage(entry)) {
    ensureSymlink(entry, entryPath, FORCE_REPLACE.has(entry));
  }
}

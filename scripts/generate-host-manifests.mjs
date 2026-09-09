#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  buildExpectedArtifacts,
  collectHostManifestFiles,
  jsonText,
  loadCanonical,
  removeEmptyGeneratedDirectories,
} from "./host-manifest-lib.mjs";

const canonical = loadCanonical();
const artifacts = buildExpectedArtifacts(canonical);
const expectedAbsolute = new Set([...artifacts.keys()].map((relative) => path.join(ROOT, relative)));
let removed = 0;
for (const file of collectHostManifestFiles()) {
  if (!expectedAbsolute.has(file)) {
    fs.rmSync(file);
    removed += 1;
  }
}
removeEmptyGeneratedDirectories();

let written = 0;
for (const [relative, payload] of artifacts) {
  const target = path.join(ROOT, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const next = jsonText(payload);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current !== next) {
    fs.writeFileSync(target, next, "utf8");
    written += 1;
  }
}

process.stdout.write(`${JSON.stringify({ ok: true, pluginCount: canonical.plugins.length, artifactCount: artifacts.size, written, removed }, null, 2)}\n`);

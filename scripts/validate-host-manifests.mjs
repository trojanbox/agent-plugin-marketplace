#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  buildExpectedArtifacts,
  collectHostManifestFiles,
  jsonText,
  loadCanonical,
} from "./host-manifest-lib.mjs";

const REQUIRED_CODEX_INTERFACE = [
  "displayName",
  "shortDescription",
  "longDescription",
  "developerName",
  "category",
  "capabilities",
  "defaultPrompt",
];

function frontmatter(pathname) {
  const text = fs.readFileSync(pathname, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  return match ? match[1] : null;
}

function scalar(block, field) {
  if (!block) return null;
  const match = new RegExp(`^${field}:\\s*["']?(.+?)["']?\\s*$`, "m").exec(block);
  return match ? match[1].trim() : null;
}

const errors = [];
let canonical;
try {
  canonical = loadCanonical();
} catch (error) {
  errors.push(error.message);
}

if (canonical) {
  const expected = buildExpectedArtifacts(canonical);
  const expectedAbsolute = new Set([...expected.keys()].map((relative) => path.join(ROOT, relative)));
  const actualAbsolute = new Set(collectHostManifestFiles());

  for (const [relative, payload] of expected) {
    const pathname = path.join(ROOT, relative);
    if (!fs.existsSync(pathname)) {
      errors.push(`missing generated host manifest: ${relative}`);
      continue;
    }
    const actual = fs.readFileSync(pathname, "utf8");
    const wanted = jsonText(payload);
    if (actual !== wanted) errors.push(`generated host manifest drift: ${relative}`);
    if (actual.includes("internal-skills")) errors.push(`host manifest must not expose internal-skills: ${relative}`);
  }
  for (const file of actualAbsolute) {
    if (!expectedAbsolute.has(file)) errors.push(`stale generated host manifest: ${path.relative(ROOT, file)}`);
  }

  for (const plugin of canonical.plugins) {
    for (const entry of fs.readdirSync(plugin.publicSkillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const skill = path.join(plugin.publicSkillsRoot, entry.name, "SKILL.md");
      if (!fs.existsSync(skill)) {
        errors.push(`public skill directory missing SKILL.md: plugins/${plugin.name}/skills/${entry.name}`);
        continue;
      }
      const block = frontmatter(skill);
      if (!block) errors.push(`public skill missing frontmatter: ${path.relative(ROOT, skill)}`);
      if (scalar(block, "visibility") === "internal") errors.push(`internal skill leaked into public skills root: ${path.relative(ROOT, skill)}`);
    }
    if (plugin.internalSkillsRoot) {
      for (const entry of fs.readdirSync(plugin.internalSkillsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
        const skill = path.join(plugin.internalSkillsRoot, entry.name, "SKILL.md");
        if (!fs.existsSync(skill)) {
          errors.push(`internal skill directory missing SKILL.md: plugins/${plugin.name}/internal-skills/${entry.name}`);
          continue;
        }
        const block = frontmatter(skill);
        if (scalar(block, "visibility") !== "internal") errors.push(`internal skill must declare visibility: internal: ${path.relative(ROOT, skill)}`);
      }
    }

    const codexPath = path.join(plugin.pluginRoot, ".codex-plugin", "plugin.json");
    if (fs.existsSync(codexPath)) {
      const codex = JSON.parse(fs.readFileSync(codexPath, "utf8"));
      if (codex.skills !== "./skills/") errors.push(`${plugin.name} Codex skills must be ./skills/`);
      if (!codex.author || typeof codex.author.name !== "string" || !codex.author.name.trim()) errors.push(`${plugin.name} Codex author.name missing`);
      if (!codex.interface || typeof codex.interface !== "object") errors.push(`${plugin.name} Codex interface missing`);
      else {
        for (const field of REQUIRED_CODEX_INTERFACE) {
          const value = codex.interface[field];
          const valid = Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
          if (!valid) errors.push(`${plugin.name} Codex interface.${field} missing`);
        }
      }
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${JSON.stringify({ ok: false, errors }, null, 2)}\n`);
  process.exit(1);
}
process.stdout.write(`${JSON.stringify({ ok: true, pluginCount: canonical.plugins.length, artifactCount: buildExpectedArtifacts(canonical).size }, null, 2)}\n`);

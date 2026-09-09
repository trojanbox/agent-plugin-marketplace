import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKETPLACE_PATH = path.join(ROOT, "marketplace.json");
const SAFE_NAME = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function fail(message) {
  throw new Error(message);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be a non-empty string`);
  return value.trim();
}

function requireSafeName(value, label) {
  const name = requireString(value, label);
  if (!SAFE_NAME.test(name)) fail(`${label} is invalid: ${name}`);
  return name;
}

function requireSemver(value, label) {
  const version = requireString(value, label);
  if (!SEMVER.test(version)) fail(`${label} must be strict semver: ${version}`);
  return version;
}

function assertRelativeRoot(value, expected, label) {
  if (value !== expected) fail(`${label} must be ${expected}, got ${value}`);
}

export function humanizeName(name) {
  const special = new Map([["ai", "AI"], ["api", "API"], ["k12", "K-12"]]);
  return name
    .split("-")
    .map((part) => special.get(part.toLowerCase()) || `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function shorten(text, maxChars = 96) {
  const chars = [...text.trim()];
  if (chars.length <= maxChars) return chars.join("");
  return `${chars.slice(0, maxChars - 1).join("")}…`;
}

export function loadCanonical() {
  const marketplace = readJson(MARKETPLACE_PATH, "marketplace.json");
  if (marketplace.schemaVersion !== 1) fail("marketplace.json schemaVersion must be 1");
  requireSafeName(marketplace.name, "marketplace.name");
  requireSemver(marketplace.version, "marketplace.version");
  requireString(marketplace.description, "marketplace.description");
  if (!marketplace.owner || typeof marketplace.owner !== "object" || Array.isArray(marketplace.owner)) {
    fail("marketplace.owner must be an object");
  }
  const owner = {
    name: requireString(marketplace.owner.name, "marketplace.owner.name"),
  };
  if (marketplace.owner.url !== undefined) owner.url = requireString(marketplace.owner.url, "marketplace.owner.url");
  const repository = requireString(marketplace.repository, "marketplace.repository");
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail("marketplace.plugins must be a non-empty array");
  }

  const seen = new Set();
  const plugins = marketplace.plugins.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) fail(`marketplace.plugins[${index}] must be an object`);
    const name = requireSafeName(entry.name, `marketplace.plugins[${index}].name`);
    if (seen.has(name)) fail(`duplicate plugin: ${name}`);
    seen.add(name);
    const source = requireString(entry.source, `${name}.source`);
    if (source !== `./plugins/${name}`) fail(`${name}.source must be ./plugins/${name}`);
    const category = requireString(entry.category, `${name}.category`);
    const pluginRoot = path.join(ROOT, "plugins", name);
    if (!fs.existsSync(pluginRoot) || !fs.statSync(pluginRoot).isDirectory()) fail(`plugin directory missing: plugins/${name}`);
    const manifestPath = path.join(pluginRoot, "plugin.json");
    const manifest = readJson(manifestPath, `plugins/${name}/plugin.json`);
    if (manifest.schemaVersion !== 1) fail(`${name}.plugin.json schemaVersion must be 1`);
    if (requireSafeName(manifest.name, `${name}.plugin.name`) !== name) fail(`${name}.plugin.name must match marketplace entry`);
    requireSemver(manifest.version, `${name}.plugin.version`);
    requireString(manifest.description, `${name}.plugin.description`);
    assertRelativeRoot(manifest.skills, "./skills", `${name}.plugin.skills`);
    const publicSkillsRoot = path.join(pluginRoot, "skills");
    if (!fs.existsSync(publicSkillsRoot) || !fs.statSync(publicSkillsRoot).isDirectory()) fail(`${name} public skills directory missing`);
    let internalSkillsRoot = null;
    if (manifest.internalSkills !== undefined) {
      assertRelativeRoot(manifest.internalSkills, "./internal-skills", `${name}.plugin.internalSkills`);
      internalSkillsRoot = path.join(pluginRoot, "internal-skills");
      if (!fs.existsSync(internalSkillsRoot) || !fs.statSync(internalSkillsRoot).isDirectory()) fail(`${name} internal skills directory missing`);
    }
    return {
      name,
      source,
      category,
      pluginRoot,
      publicSkillsRoot,
      internalSkillsRoot,
      manifest,
      displayName: humanizeName(name),
    };
  });

  return { marketplace, owner, repository, plugins };
}

function claudePluginManifest(plugin, canonical) {
  return {
    name: plugin.name,
    displayName: plugin.displayName,
    version: plugin.manifest.version,
    description: plugin.manifest.description,
    author: canonical.owner,
    repository: canonical.repository,
  };
}

function codexPluginManifest(plugin, canonical) {
  return {
    name: plugin.name,
    version: plugin.manifest.version,
    description: plugin.manifest.description,
    author: canonical.owner,
    repository: canonical.repository,
    skills: "./skills/",
    interface: {
      displayName: plugin.displayName,
      shortDescription: shorten(plugin.manifest.description),
      longDescription: plugin.manifest.description,
      developerName: canonical.owner.name,
      category: plugin.category,
      capabilities: ["Interactive"],
      defaultPrompt: [`使用 ${plugin.displayName} 插件帮助我完成当前任务。`],
    },
  };
}

export function buildExpectedArtifacts(canonical = loadCanonical()) {
  const claudeMarketplace = {
    name: canonical.marketplace.name,
    owner: canonical.owner,
    description: canonical.marketplace.description,
    version: canonical.marketplace.version,
    plugins: canonical.plugins.map((plugin) => ({
      name: plugin.name,
      source: plugin.source,
      description: plugin.manifest.description,
      version: plugin.manifest.version,
      author: canonical.owner,
      repository: canonical.repository,
      category: plugin.category,
    })),
  };

  const codexMarketplace = {
    name: canonical.marketplace.name,
    interface: { displayName: humanizeName(canonical.marketplace.name) },
    plugins: canonical.plugins.map((plugin) => ({
      name: plugin.name,
      source: { source: "local", path: plugin.source },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: plugin.category,
    })),
  };

  const artifacts = new Map();
  artifacts.set(".claude-plugin/marketplace.json", claudeMarketplace);
  artifacts.set(".agents/plugins/marketplace.json", codexMarketplace);
  for (const plugin of canonical.plugins) {
    artifacts.set(`plugins/${plugin.name}/.claude-plugin/plugin.json`, claudePluginManifest(plugin, canonical));
    artifacts.set(`plugins/${plugin.name}/.codex-plugin/plugin.json`, codexPluginManifest(plugin, canonical));
  }
  return artifacts;
}

export function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function collectHostManifestFiles() {
  const files = [];
  const rootCandidates = [
    path.join(ROOT, ".claude-plugin", "marketplace.json"),
    path.join(ROOT, ".agents", "plugins", "marketplace.json"),
  ];
  for (const file of rootCandidates) if (fs.existsSync(file)) files.push(file);
  const pluginsRoot = path.join(ROOT, "plugins");
  if (fs.existsSync(pluginsRoot)) {
    for (const entry of fs.readdirSync(pluginsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const relative of [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
        const file = path.join(pluginsRoot, entry.name, relative);
        if (fs.existsSync(file)) files.push(file);
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

export function removeEmptyGeneratedDirectories() {
  const pluginsRoot = path.join(ROOT, "plugins");
  if (fs.existsSync(pluginsRoot)) {
    for (const entry of fs.readdirSync(pluginsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const dirName of [".claude-plugin", ".codex-plugin"]) {
        const dir = path.join(pluginsRoot, entry.name, dirName);
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory() && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
      }
    }
  }
}

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const RUNTIME_ROOT = path.resolve(__dirname);
const MARKETPLACE_PATH = path.join(RUNTIME_ROOT, "marketplace.json");
const PLUGINS_ROOT = path.join(RUNTIME_ROOT, "plugins");
const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;
const SAFE_GROUP = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const CONTEXT_BUDGET = Object.freeze({
  aiUsageBytes: 4096,
  marketplaceBytes: 8192,
  pluginManifestBytes: 8192,
  skillChars: 5000,
  skillLines: 500,
});

const OUTPUT_COMPLETE = Symbol("output-complete");

function output(payload, exitCode = 0) {
  process.exitCode = exitCode;
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  throw OUTPUT_COMPLETE;
}

function fail(message, details = undefined, exitCode = 1) {
  const payload = { ok: false, error: message };
  if (details !== undefined) payload.details = details;
  output(payload, exitCode);
}

function assertSafeName(name, label) {
  if (!name || !SAFE_NAME.test(name)) {
    fail(`${label}名称无效`, { name });
  }
}

function parseSkillIdList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFrontmatter(filePath, defaults = {}) {
  const text = fs.readFileSync(filePath, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);

  if (!match) {
    fail("Markdown 文件缺少 YAML frontmatter", { path: filePath });
  }

  function scalar(name, required = false) {
    const re = new RegExp(`^${name}:\\s*["']?(.+?)["']?\\s*$`, "m");
    const found = re.exec(match[1]);
    if (!found) {
      if (required) {
        fail(`Markdown frontmatter 缺少 ${name}`, { path: filePath });
      }
      return null;
    }
    return found[1].trim();
  }

  return {
    name: scalar("name", true),
    description: scalar("description", true),
    visibility: scalar("visibility") || defaults.visibility || null,
    phase: scalar("phase") || defaults.phase || null,
    uses: parseSkillIdList(scalar("uses")),
    optionalUses: parseSkillIdList(scalar("optional_uses")),
  };
}

function readJson(filePath, label) {
  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`无法读取 ${label}`, { path: filePath, message: error.message });
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${label} 不是有效 JSON`, { path: filePath, message: error.message });
  }
}

function realpathDirectory(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    fail(`未找到 ${label} 目录`, { expected: dirPath });
  }
  if (!fs.statSync(dirPath).isDirectory()) {
    fail(`${label} 不是目录`, { path: dirPath });
  }
  return fs.realpathSync(dirPath);
}

function assertWithin(realPath, rootReal, label) {
  if (realPath !== rootReal && !realPath.startsWith(`${rootReal}${path.sep}`)) {
    fail(`${label}路径越过允许边界`, { path: realPath, root: rootReal });
  }
}

function resolveLocalDirectory(baseDir, relativePath, boundaryReal, label) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    fail(`${label}路径无效`, { path: relativePath });
  }
  if (/^[a-z]+:\/\//i.test(relativePath)) {
    fail(`${label} 当前 Runtime 只支持已安装的本地目录`, {
      path: relativePath,
      action: "远程 Git/npm/HTTP 属于 Marketplace 安装器职责；先 materialize 到本地再交给 Runtime。",
    });
  }
  const resolved = path.resolve(baseDir, relativePath);
  const real = realpathDirectory(resolved, label);
  assertWithin(real, boundaryReal, label);
  return real;
}

function loadMarketplace() {
  if (!fs.existsSync(MARKETPLACE_PATH)) {
    fail("未找到 marketplace.json", {
      expected: MARKETPLACE_PATH,
      action: "Runtime 必须通过 marketplace.json 发现 Plugin。",
    });
  }

  const runtimeReal = fs.realpathSync(RUNTIME_ROOT);
  const data = readJson(MARKETPLACE_PATH, "marketplace.json");
  if (data.schemaVersion !== 1) {
    fail("marketplace.json schemaVersion 不受支持", {
      actual: data.schemaVersion,
      supported: [1],
    });
  }
  assertSafeName(data.name, "Marketplace");
  if (typeof data.version !== "string" || !SEMVER.test(data.version)) {
    fail("Marketplace version 必须是 SemVer", { version: data.version });
  }
  if (!Array.isArray(data.plugins) || data.plugins.length === 0) {
    fail("marketplace.json 没有 Plugin", { path: MARKETPLACE_PATH });
  }

  const entries = data.plugins.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      fail("Marketplace Plugin 条目无效", { index, entry });
    }
    assertSafeName(entry.name, "Plugin");
    if (typeof entry.source !== "string" || !entry.source.trim()) {
      fail("Marketplace Plugin 缺少 source", { plugin: entry.name, index });
    }
    return {
      name: entry.name,
      source: entry.source,
      category: typeof entry.category === "string" ? entry.category : null,
    };
  });

  const duplicates = entries
    .map((item) => item.name)
    .filter((name, index, all) => all.indexOf(name) !== index);
  if (duplicates.length > 0) {
    fail("Marketplace 存在重复 Plugin", { plugins: [...new Set(duplicates)] });
  }

  return {
    schemaVersion: data.schemaVersion,
    name: data.name,
    version: data.version,
    description: typeof data.description === "string" ? data.description : null,
    path: fs.realpathSync(MARKETPLACE_PATH),
    runtimeReal,
    entries,
  };
}

function walkSkillMarkdownFiles(skillsDir) {
  const found = [];
  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name === "SKILL.md") found.push(entryPath);
    }
  }
  walk(skillsDir);
  return found.sort((a, b) => a.localeCompare(b));
}

function parseGroups(manifest, pluginName) {
  const groups = manifest.groups || {};
  if (typeof groups !== "object" || Array.isArray(groups)) {
    fail("plugin.json groups 必须是对象", { plugin: pluginName });
  }

  const groupBySkill = new Map();
  const issues = [];
  const normalized = {};

  for (const [group, skills] of Object.entries(groups)) {
    if (!SAFE_GROUP.test(group)) {
      issues.push({ plugin: pluginName, issue: "invalid-group-name", group });
      continue;
    }
    if (!Array.isArray(skills)) {
      issues.push({ plugin: pluginName, issue: "invalid-group-members", group });
      continue;
    }
    normalized[group] = [];
    for (const skill of skills) {
      if (typeof skill !== "string" || !SAFE_NAME.test(skill)) {
        issues.push({ plugin: pluginName, issue: "invalid-group-skill-name", group, skill });
        continue;
      }
      if (groupBySkill.has(skill)) {
        issues.push({
          plugin: pluginName,
          issue: "skill-in-multiple-groups",
          skill,
          groups: [groupBySkill.get(skill), group],
        });
        continue;
      }
      groupBySkill.set(skill, group);
      normalized[group].push(skill);
    }
    normalized[group].sort((a, b) => a.localeCompare(b));
  }

  return { groupBySkill, groups: normalized, issues };
}

function loadPluginFromEntry(entry, marketplace) {
  const pluginDir = resolveLocalDirectory(
    RUNTIME_ROOT,
    entry.source,
    marketplace.runtimeReal,
    `Plugin ${entry.name}`,
  );
  const manifestPath = path.join(pluginDir, "plugin.json");
  if (!fs.existsSync(manifestPath)) {
    fail("Plugin 目录缺少 plugin.json", { plugin: entry.name, path: pluginDir });
  }

  const manifest = readJson(manifestPath, `${entry.name}/plugin.json`);
  if (manifest.schemaVersion !== 1) {
    fail("plugin.json schemaVersion 不受支持", {
      plugin: entry.name,
      actual: manifest.schemaVersion,
      supported: [1],
    });
  }
  assertSafeName(manifest.name, "Plugin");
  if (manifest.name !== entry.name) {
    fail("Marketplace Plugin 名与 plugin.json name 不一致", {
      marketplaceName: entry.name,
      manifestName: manifest.name,
      path: manifestPath,
    });
  }
  if (typeof manifest.version !== "string" || !SEMVER.test(manifest.version)) {
    fail("Plugin version 必须是 SemVer", { plugin: entry.name, version: manifest.version });
  }
  if (typeof manifest.description !== "string" || !manifest.description.trim()) {
    fail("Plugin 缺少 description", { plugin: entry.name, path: manifestPath });
  }
  if (manifest.skills !== "./skills") {
    fail("Plugin skills 根目录必须固定为 ./skills", {
      plugin: entry.name,
      actual: manifest.skills,
      expected: "./skills",
    });
  }

  const pluginReal = fs.realpathSync(pluginDir);
  const skillsRoot = resolveLocalDirectory(pluginDir, manifest.skills, pluginReal, `${entry.name} skills`);
  let sharedRoot = null;
  if (manifest.shared !== undefined) {
    if (manifest.shared !== "./shared") {
      fail("Plugin shared 根目录必须固定为 ./shared", {
        plugin: entry.name,
        actual: manifest.shared,
        expected: "./shared",
      });
    }
    sharedRoot = resolveLocalDirectory(pluginDir, manifest.shared, pluginReal, `${entry.name} shared`);
  }

  const groupInfo = parseGroups(manifest, entry.name);
  const locations = [];
  const structureIssues = [...groupInfo.issues];

  for (const skillPath of walkSkillMarkdownFiles(skillsRoot)) {
    const relativePath = path.relative(skillsRoot, skillPath);
    const parts = relativePath.split(path.sep);
    if (parts.length !== 2) {
      structureIssues.push({
        plugin: entry.name,
        issue: "skill-path-invalid",
        path: skillPath,
        relativePath,
        expected: "<skill>/SKILL.md",
        message: "Group 只允许存在于 plugin.json metadata，不进入物理 Skill 路径。",
      });
      continue;
    }
    const skillDirectory = parts[0];
    if (!SAFE_NAME.test(skillDirectory)) {
      structureIssues.push({
        plugin: entry.name,
        issue: "invalid-skill-directory-name",
        path: skillPath,
        directory: skillDirectory,
      });
      continue;
    }
    locations.push({
      plugin: entry.name,
      category: entry.name,
      group: groupInfo.groupBySkill.get(skillDirectory) || null,
      directory: skillDirectory,
      path: skillPath,
    });
  }

  const knownSkills = new Set(locations.map((item) => item.directory));
  for (const [skill, group] of groupInfo.groupBySkill.entries()) {
    if (!knownSkills.has(skill)) {
      structureIssues.push({
        plugin: entry.name,
        issue: "group-references-missing-skill",
        group,
        skill,
      });
    }
  }

  const groups = Object.entries(groupInfo.groups)
    .filter(([, members]) => members.length > 0)
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));

  return {
    name: manifest.name,
    category: entry.category,
    description: manifest.description,
    version: manifest.version,
    path: fs.realpathSync(manifestPath),
    directory: pluginReal,
    skillsRoot,
    sharedRoot,
    skillCount: locations.length,
    groupCount: groups.length,
    groups,
    groupMap: groupInfo.groups,
    structureIssues,
    skillLocations: locations,
    compatibility: manifest.compatibility || null,
  };
}

function scanPlugins() {
  const marketplace = loadMarketplace();
  const plugins = marketplace.entries.map((entry) => loadPluginFromEntry(entry, marketplace));
  plugins.sort((a, b) => a.name.localeCompare(b.name));
  return { marketplace, plugins };
}

function getPluginByName(name) {
  assertSafeName(name, "Plugin");
  const { marketplace, plugins } = scanPlugins();
  const plugin = plugins.find((item) => item.name === name);
  if (plugin) return { marketplace, plugin };
  fail("未找到指定 Plugin（旧版 Category 参数仍映射到 Plugin）", {
    name,
    availablePlugins: plugins.map((item) => item.name),
  });
}

function loadSkillFromLocation(plugin, location) {
  const skillReal = fs.realpathSync(location.path);
  assertWithin(skillReal, plugin.skillsRoot, "Skill");
  const metadata = parseFrontmatter(skillReal, { visibility: "workflow", phase: "unspecified" });

  if (metadata.name !== location.directory) {
    fail("Skill 目录名与 frontmatter name 不一致", {
      plugin: plugin.name,
      group: location.group,
      directory: location.directory,
      frontmatterName: metadata.name,
      path: skillReal,
    });
  }

  return {
    plugin: plugin.name,
    category: plugin.name,
    pluginRoot: plugin.directory,
    sharedRoot: plugin.sharedRoot,
    group: location.group,
    name: metadata.name,
    description: metadata.description,
    visibility: metadata.visibility,
    phase: metadata.phase,
    uses: metadata.uses,
    optionalUses: metadata.optionalUses,
    path: skillReal,
  };
}

function scanPluginSkills(plugin) {
  const skills = plugin.skillLocations.map((location) => loadSkillFromLocation(plugin, location));
  skills.sort((a, b) => {
    const groupA = a.group || "";
    const groupB = b.group || "";
    return groupA.localeCompare(groupB) || a.name.localeCompare(b.name);
  });
  return skills;
}

function scanRegistry() {
  const { marketplace, plugins } = scanPlugins();
  const skills = [];
  const structureIssues = [];
  for (const plugin of plugins) {
    skills.push(...scanPluginSkills(plugin));
    structureIssues.push(...plugin.structureIssues);
  }
  if (skills.length === 0) {
    fail("Marketplace 中没有找到 Skill", { expected: "plugins/<plugin>/skills/<skill>/SKILL.md" });
  }
  return { marketplace, plugins, categories: plugins, skills, structureIssues };
}

function registryManifest(registry) {
  return {
    plugins: registry.plugins.map((item) => item.name).sort(),
    skills: registry.skills.map((item) => `${item.plugin}/${item.name}`).sort(),
  };
}

function validateCompositionReferences(registry) {
  const known = new Set(registry.skills.map((item) => `${item.plugin}/${item.name}`));
  const issues = [];
  for (const skill of registry.skills) {
    const source = `${skill.plugin}/${skill.name}`;
    for (const [field, refs] of [["uses", skill.uses || []], ["optional_uses", skill.optionalUses || []]]) {
      for (const ref of refs) {
        const parts = ref.split("/");
        const valid = parts.length === 2 && parts.every((part) => part && SAFE_NAME.test(part));
        if (!valid) {
          issues.push({ source, field, target: ref, issue: "invalid-skill-id" });
          continue;
        }
        if (ref === source) {
          issues.push({ source, field, target: ref, issue: "self-reference" });
          continue;
        }
        if (!known.has(ref)) issues.push({ source, field, target: ref, issue: "missing-skill" });
      }
    }
  }
  return issues;
}

function validateSkillContracts(registry) {
  const issues = [];
  const compositionHeading = /^#{1,6}\s+.*(?:Composition|能力组合)/im;
  for (const skill of registry.skills) {
    const source = `${skill.plugin}/${skill.name}`;
    const text = fs.readFileSync(skill.path, "utf8");
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    if (!frontmatter || !/^phase:\s*["']?\S+/m.test(frontmatter[1])) {
      issues.push({ source, field: "phase", issue: "missing-explicit-phase" });
    }
    if ((skill.optionalUses || []).length > 0 && !compositionHeading.test(text)) {
      issues.push({ source, field: "optional_uses", issue: "missing-composition-rules" });
    }
  }
  return issues;
}

function validateContextBudgets(registry) {
  const issues = [];
  const aiUsagePath = path.join(RUNTIME_ROOT, "AI_USAGE.md");
  if (fs.existsSync(aiUsagePath)) {
    const bytes = fs.statSync(aiUsagePath).size;
    if (bytes > CONTEXT_BUDGET.aiUsageBytes) {
      issues.push({ source: "AI_USAGE.md", issue: "bootstrap-too-large", actualBytes: bytes, maxBytes: CONTEXT_BUDGET.aiUsageBytes });
    }
  }

  const marketplaceBytes = fs.statSync(registry.marketplace.path).size;
  if (marketplaceBytes > CONTEXT_BUDGET.marketplaceBytes) {
    issues.push({ source: "marketplace.json", issue: "marketplace-manifest-too-large", actualBytes: marketplaceBytes, maxBytes: CONTEXT_BUDGET.marketplaceBytes });
  }

  for (const plugin of registry.plugins) {
    const bytes = fs.statSync(plugin.path).size;
    if (bytes > CONTEXT_BUDGET.pluginManifestBytes) {
      issues.push({ source: `${plugin.name}/plugin.json`, issue: "plugin-manifest-too-large", actualBytes: bytes, maxBytes: CONTEXT_BUDGET.pluginManifestBytes });
    }
  }

  for (const skill of registry.skills) {
    const text = fs.readFileSync(skill.path, "utf8");
    const chars = [...text].length;
    const lines = text.split(/\r?\n/).length;
    if (chars > CONTEXT_BUDGET.skillChars) {
      issues.push({ source: `${skill.plugin}/${skill.name}`, issue: "skill-main-too-large", actualChars: chars, maxChars: CONTEXT_BUDGET.skillChars });
    }
    if (lines > CONTEXT_BUDGET.skillLines) {
      issues.push({ source: `${skill.plugin}/${skill.name}`, issue: "skill-main-too-many-lines", actualLines: lines, maxLines: CONTEXT_BUDGET.skillLines });
    }
  }
  return issues;
}

function validateRequiredDependencyCycles(registry) {
  const known = new Set(registry.skills.map((skill) => `${skill.plugin}/${skill.name}`));
  const graph = new Map(registry.skills.map((skill) => [`${skill.plugin}/${skill.name}`, (skill.uses || []).filter((ref) => known.has(ref))]));
  const state = new Map();
  const stack = [];
  const cycles = new Map();

  function visit(node) {
    state.set(node, 1);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      if ((state.get(next) || 0) === 0) visit(next);
      else if (state.get(next) === 1) {
        const start = stack.lastIndexOf(next);
        const cycle = [...stack.slice(start), next];
        const canonical = [...cycle.slice(0, -1)].sort().join("|");
        if (!cycles.has(canonical)) cycles.set(canonical, cycle);
      }
    }
    stack.pop();
    state.set(node, 2);
  }

  for (const node of graph.keys()) if ((state.get(node) || 0) === 0) visit(node);
  return [...cycles.values()].map((cycle) => ({ source: cycle[0], field: "uses", target: cycle[1], issue: "required-cycle", cycle }));
}

function parseSkillId(skillId) {
  if (!skillId || skillId.split("/").length !== 2) {
    fail("Skill 标识必须为 <plugin>/<skill>（兼容旧 <category>/<skill>）", { skill: skillId });
  }
  const [plugin, name] = skillId.split("/");
  assertSafeName(plugin, "Plugin");
  assertSafeName(name, "Skill");
  return { plugin, category: plugin, name };
}

function loadSkillDirect(skillId) {
  const target = parseSkillId(skillId);
  const { plugin } = getPluginByName(target.plugin);
  const matches = plugin.skillLocations.filter((location) => location.directory === target.name);
  if (matches.length === 0) {
    const availableSkills = plugin.skillLocations.map((location) => `${plugin.name}/${location.directory}`).sort();
    fail("未找到指定 Skill", { skill: skillId, availableSkills });
  }
  if (matches.length > 1) {
    fail("多个物理 Skill 映射到同一逻辑 Skill ID", {
      skill: skillId,
      paths: matches.map((item) => item.path),
      action: "每个 Plugin 的 skills/ 下只能有一个同名 Skill；Group 只存在于 plugin.json metadata。",
    });
  }
  return loadSkillFromLocation(plugin, matches[0]);
}

function countSkillsByVisibility(skills) {
  const internalSkillCount = skills.filter((skill) => skill.visibility === "internal").length;
  return { skillCount: skills.length, publicSkillCount: skills.length - internalSkillCount, internalSkillCount };
}

function scanResult(command) {
  const registry = scanRegistry();
  return {
    ok: true,
    command,
    runtimeRoot: RUNTIME_ROOT,
    marketplacePath: MARKETPLACE_PATH,
    pluginsRoot: PLUGINS_ROOT,
    skillsRoot: PLUGINS_ROOT,
    pluginCount: registry.plugins.length,
    categoryCount: registry.plugins.length,
    ...countSkillsByVisibility(registry.skills),
    registry,
  };
}

function compactPlugin(plugin) {
  const item = {
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    skillCount: plugin.skillCount,
    skillCountIncludesInternal: true,
  };
  if (plugin.category) item.marketplaceCategory = plugin.category;
  if (plugin.groupCount > 0) item.groupCount = plugin.groupCount;
  return item;
}

function compactSkill(skill, includeGroup = true) {
  const item = { name: skill.name, description: skill.description };
  if (includeGroup && skill.group) item.group = skill.group;
  if (skill.phase && skill.phase !== "unspecified") item.phase = skill.phase;
  return item;
}

function compactCatalogSkill(skill) {
  const item = { id: `${skill.plugin}/${skill.name}`, plugin: skill.plugin, description: skill.description };
  if (skill.group) item.group = skill.group;
  if (skill.phase && skill.phase !== "unspecified") item.phase = skill.phase;
  if ((skill.uses || []).length > 0) item.uses = skill.uses;
  if ((skill.optionalUses || []).length > 0) item.optionalUses = skill.optionalUses;
  return item;
}

function groupPluginSkills(skills) {
  const grouped = new Map();
  const ungrouped = [];
  for (const skill of skills) {
    if (!skill.group) ungrouped.push(skill);
    else {
      if (!grouped.has(skill.group)) grouped.set(skill.group, []);
      grouped.get(skill.group).push(skill);
    }
  }
  const groups = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, items]) => ({
      name,
      skillCount: items.length,
      skills: items.sort((a, b) => a.name.localeCompare(b.name)).map((item) => compactSkill(item, false)),
    }));
  return {
    groups,
    ungroupedSkills: ungrouped.sort((a, b) => a.name.localeCompare(b.name)).map((item) => compactSkill(item, false)),
  };
}

function diagnosticPlugin(plugin) {
  const item = {
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    path: plugin.path,
    directory: plugin.directory,
    skillsRoot: plugin.skillsRoot,
    skillCount: plugin.skillCount,
  };
  if (plugin.sharedRoot) item.sharedRoot = plugin.sharedRoot;
  if (plugin.category) item.marketplaceCategory = plugin.category;
  if (plugin.groupCount > 0) {
    item.groupCount = plugin.groupCount;
    item.groups = plugin.groups;
  }
  return item;
}

function compactMarketplace(marketplace) {
  return {
    name: marketplace.name,
    version: marketplace.version,
    description: marketplace.description,
    path: marketplace.path,
  };
}

function main() {
  const [, , command = "help", argument, extraArgument] = process.argv;
  if (extraArgument !== undefined) fail("参数过多", { command, arguments: process.argv.slice(3) });

  switch (command) {
    case "init":
    case "refresh": {
      if (argument !== undefined) fail(`${command} 不接受参数`, { argument });
      const result = scanResult(command);
      output({
        ok: true,
        command,
        mode: "direct-scan",
        architecture: "marketplace-plugin-skill",
        runtimeRoot: result.runtimeRoot,
        marketplacePath: result.marketplacePath,
        pluginsRoot: result.pluginsRoot,
        skillsRoot: result.skillsRoot,
        pluginCount: result.pluginCount,
        categoryCount: result.categoryCount,
        skillCount: result.skillCount,
        publicSkillCount: result.publicSkillCount,
        internalSkillCount: result.internalSkillCount,
      });
      break;
    }

    case "marketplace": {
      if (argument !== undefined) fail("marketplace 不接受参数", { argument });
      const { marketplace, plugins } = scanPlugins();
      output({
        ok: true,
        command,
        mode: "marketplace",
        marketplace: compactMarketplace(marketplace),
        pluginCount: plugins.length,
        plugins: plugins.map(compactPlugin),
      });
      break;
    }

    case "list": {
      if (argument === undefined) {
        const { marketplace, plugins } = scanPlugins();
        const compact = plugins.map(compactPlugin);
        output({
          ok: true,
          command,
          mode: "categories",
          architecture: "marketplace-plugin-skill",
          marketplace: compactMarketplace(marketplace),
          pluginCount: plugins.length,
          plugins: compact,
          categoryCount: plugins.length,
          categories: compact,
          compatibility: { categoryAlias: true },
        });
      }

      const { marketplace, plugin } = getPluginByName(argument);
      const allSkills = scanPluginSkills(plugin);
      const visibleSkills = allSkills.filter((skill) => skill.visibility !== "internal");
      const grouped = groupPluginSkills(visibleSkills);
      const compactPluginInfo = { name: plugin.name, version: plugin.version, description: plugin.description };
      output({
        ok: true,
        command,
        mode: "category",
        architecture: "marketplace-plugin-skill",
        marketplace: compactMarketplace(marketplace),
        plugin: compactPluginInfo,
        category: { name: plugin.name, description: plugin.description },
        skillCount: visibleSkills.length,
        publicSkillCount: visibleSkills.length,
        internalSkillCount: allSkills.length - visibleSkills.length,
        groupCount: grouped.groups.length,
        groups: grouped.groups,
        ungroupedSkillCount: grouped.ungroupedSkills.length,
        ungroupedSkills: grouped.ungroupedSkills,
        hiddenInternalSkillCount: allSkills.length - visibleSkills.length,
        compatibility: { categoryAlias: true },
      });
      break;
    }

    case "catalog": {
      if (argument !== undefined) fail("catalog 不接受参数", { argument });
      const registry = scanRegistry();
      const visibleSkills = registry.skills.filter((skill) => skill.visibility !== "internal");
      const visibilityCounts = countSkillsByVisibility(registry.skills);
      output({
        ok: true,
        command,
        mode: "catalog",
        architecture: "marketplace-plugin-skill",
        marketplace: compactMarketplace(registry.marketplace),
        pluginCount: registry.plugins.length,
        skillCount: visibleSkills.length,
        publicSkillCount: visibleSkills.length,
        internalSkillCount: visibilityCounts.internalSkillCount,
        skills: visibleSkills.map(compactCatalogSkill),
      });
      break;
    }

    case "doctor": {
      if (argument !== undefined) fail("doctor 不接受参数", { argument });
      const result = scanResult(command);
      const manifest = registryManifest(result.registry);
      const duplicatePlugins = manifest.plugins.filter((name, index) => manifest.plugins.indexOf(name) !== index);
      const duplicateSkills = manifest.skills.filter((name, index) => manifest.skills.indexOf(name) !== index);
      const structureIssues = result.registry.structureIssues || [];
      const compositionIssues = [
        ...validateCompositionReferences(result.registry),
        ...validateRequiredDependencyCycles(result.registry),
      ];
      const contractIssues = validateSkillContracts(result.registry);
      const contextIssues = validateContextBudgets(result.registry);
      const ok = duplicatePlugins.length === 0 && duplicateSkills.length === 0 && structureIssues.length === 0 && compositionIssues.length === 0 && contractIssues.length === 0 && contextIssues.length === 0;

      output({
        ok,
        command,
        mode: "direct-scan",
        architecture: "marketplace-plugin-skill",
        runtimeRoot: result.runtimeRoot,
        marketplacePath: result.marketplacePath,
        pluginsRoot: result.pluginsRoot,
        skillsRoot: result.skillsRoot,
        pluginCount: result.pluginCount,
        categoryCount: result.categoryCount,
        skillCount: result.skillCount,
        publicSkillCount: result.publicSkillCount,
        internalSkillCount: result.internalSkillCount,
        duplicatePlugins: [...new Set(duplicatePlugins)],
        duplicateCategories: [...new Set(duplicatePlugins)],
        duplicateSkills: [...new Set(duplicateSkills)],
        structureIssues,
        compositionIssues,
        contractIssues,
        contextIssues,
        contextBudget: CONTEXT_BUDGET,
        marketplace: compactMarketplace(result.registry.marketplace),
        plugins: result.registry.plugins.map(diagnosticPlugin),
        categories: result.registry.plugins.map(diagnosticPlugin),
        skills: result.registry.skills,
      }, ok ? 0 : 1);
      break;
    }

    case "skill": {
      if (argument === undefined) fail("缺少 Skill 标识", { expected: "<plugin>/<skill>" });
      output({ ok: true, command, mode: "direct-read", architecture: "marketplace-plugin-skill", skill: loadSkillDirect(argument) });
      break;
    }

    case "help": {
      if (argument !== undefined) fail("help 不接受参数", { argument });
      output({
        ok: true,
        command,
        architecture: "marketplace-plugin-skill",
        usage: [
          "node <runtime>/skill-runtime.js init",
          "node <runtime>/skill-runtime.js marketplace",
          "node <runtime>/skill-runtime.js list",
          "node <runtime>/skill-runtime.js list <plugin>",
          "node <runtime>/skill-runtime.js catalog",
          "node <runtime>/skill-runtime.js doctor",
          "node <runtime>/skill-runtime.js skill <plugin>/<skill-name>",
          "node <runtime>/skill-runtime.js refresh",
        ],
        compatibilityUsage: [
          "node <runtime>/skill-runtime.js list <category>",
          "node <runtime>/skill-runtime.js skill <category>/<skill-name>",
        ],
        notes: [
          "Runtime 根目录由 skill-runtime.js 自身位置自动确定，整个目录可搬迁。",
          "AI_USAGE.md 仍是稳定 bootstrap 入口；Marketplace/Plugin 细节由 Runtime CLI 负责发现。",
          "marketplace.json 只负责本地已安装 Plugin 的 Catalog/分组/来源元数据；Runtime 执行不回查远程市场。",
          "每个 Plugin 使用 plugins/<plugin>/plugin.json + skills/<skill>/SKILL.md；Plugin 是 namespace/version/共享资源边界。",
          "Group 只存在于 plugin.json metadata，不进入物理目录和稳定 Skill ID。",
          "稳定逻辑 Skill ID 为 <plugin>/<skill>；原 <category>/<skill> ID 因 Plugin 名沿用旧 Category 名而保持兼容。",
          "Plugin 共享资源放 shared/；Skill 自有 references/scripts/assets 仍按需加载。",
          "当前 Runtime 只消费已经 materialize 的本地 Plugin；Git/npm/HTTP 安装、更新和依赖解析属于未来独立 Plugin Manager，不在本执行器里伪实现。",
          "doctor 检查 Marketplace/Plugin manifest、Skill 物理深度、Group metadata、逻辑 ID、Composition、phase、optional_uses 与上下文预算。",
        ],
      });
      break;
    }

    default:
      fail("未知命令", { command, hint: "执行 node <runtime>/skill-runtime.js help" });
  }
}

try {
  main();
} catch (error) {
  if (error !== OUTPUT_COMPLETE) {
    throw error;
  }
}

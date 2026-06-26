import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { resolveInitAgents } from "../src/commands/init.js";
import { planFiles, applyFileActions } from "../src/core/file-plan.js";
import { renderInitFiles } from "../src/core/templates.js";
import { pathExists } from "../src/core/project.js";

describe("init file planning", () => {
  it("creates a complete first-run plan", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "spec-power-"));
    const files = renderInitFiles({ profile: "multi-module", agents: ["codex", "claude"] });
    const actions = await planFiles(cwd, files, {});
    const sharedRules = files.find((file) => file.path === ".specpower/standards/AGENTS.md");

    expect(files.some((file) => file.path.startsWith(".specpower/harness-templates/"))).toBe(false);
    expect(sharedRules?.content).toContain("共享 Agent 规则");
    expect(sharedRules?.content).toContain("执行规则");
    expect(actions.every((action) => action.action === "create")).toBe(true);
    await applyFileActions(cwd, actions);

    const agentEntry = await readFile(path.join(cwd, "AGENTS.md"), "utf8");
    const claudeEntry = await readFile(path.join(cwd, "CLAUDE.md"), "utf8");
    await expect(pathExists(path.join(cwd, "SDD_WORKFLOW.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, "AGENTS.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, "CLAUDE.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, ".specpower", "standards", "AGENTS.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, ".specpower", "standards", "api-contract.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, ".specpower", "standards", "backend.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, ".specpower", "standards", "frontend.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, ".specpower", "standards", "testing.md"))).resolves.toBe(true);
    expect(agentEntry).toContain("SDD_WORKFLOW.md");
    expect(agentEntry).toContain(".specpower/standards/");
    expect(agentEntry).toContain("Codex 项目入口");
    expect(claudeEntry).toContain("SDD_WORKFLOW.md");
    expect(claudeEntry).toContain(".specpower/standards/");
    expect(claudeEntry).toContain("Claude Code 项目入口");
    await expect(pathExists(path.join(cwd, ".specpower", "upstream.lock"))).resolves.toBe(true);
  });

  it("does not overwrite existing Agent entries unless forced", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "spec-power-"));
    await writeFile(path.join(cwd, "AGENTS.md"), "existing\n", "utf8");
    const files = renderInitFiles({ profile: "multi-module", agents: ["codex"] });
    const actions = await planFiles(cwd, files, {});
    const agentAction = actions.find((action) => action.path === "AGENTS.md");

    expect(agentAction?.action).toBe("skip");
    await applyFileActions(cwd, actions);
    await expect(readFile(path.join(cwd, "AGENTS.md"), "utf8")).resolves.toBe("existing\n");
  });

  it("plans overwrites when force is enabled", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "spec-power-"));
    await writeFile(path.join(cwd, "AGENTS.md"), "existing\n", "utf8");
    const files = renderInitFiles({ profile: "multi-module", agents: ["codex"] });
    const actions = await planFiles(cwd, files, { force: true });
    const agentAction = actions.find((action) => action.path === "AGENTS.md");

    expect(agentAction?.action).toBe("overwrite");
  });
});

describe("init agent arguments", () => {
  it("defaults to all supported agents", () => {
    expect(resolveInitAgents(undefined, [])).toEqual(["codex", "claude"]);
  });

  it("accepts one positional agent", () => {
    expect(resolveInitAgents(undefined, ["codex"])).toEqual(["codex"]);
    expect(resolveInitAgents(undefined, ["claude"])).toEqual(["claude"]);
  });

  it("accepts multiple positional agents", () => {
    expect(resolveInitAgents(undefined, ["codex", "claude"])).toEqual(["codex", "claude"]);
  });

  it("keeps --agents as an explicit override", () => {
    expect(resolveInitAgents("claude", ["codex"])).toEqual(["claude"]);
  });
});

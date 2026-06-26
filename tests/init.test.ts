import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { planFiles, applyFileActions } from "../src/core/file-plan.js";
import { renderInitFiles } from "../src/core/templates.js";
import { pathExists } from "../src/core/project.js";

describe("init file planning", () => {
  it("creates a complete first-run plan", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "spec-power-"));
    const files = renderInitFiles({ profile: "multi-module", agents: ["codex", "claude"] });
    const actions = await planFiles(cwd, files, {});

    expect(actions.every((action) => action.action === "create")).toBe(true);
    await applyFileActions(cwd, actions);

    await expect(pathExists(path.join(cwd, "SDD_WORKFLOW.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, "AGENTS.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(cwd, "CLAUDE.md"))).resolves.toBe(true);
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


import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { applyFileActions, planFiles } from "../src/core/file-plan.js";
import { renderInitFiles } from "../src/core/templates.js";
import { runChecks } from "../src/commands/check.js";

describe("check command logic", () => {
  it("passes after init files are applied", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "spec-power-"));
    const files = renderInitFiles({ profile: "multi-module", agents: ["codex", "claude"] });
    await applyFileActions(cwd, await planFiles(cwd, files, {}));

    const results = await runChecks(cwd);
    expect(results.some((result) => result.level === "error")).toBe(false);
  });

  it("reports errors for missing setup", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "spec-power-"));
    const results = await runChecks(cwd);

    expect(results.some((result) => result.level === "error")).toBe(true);
  });

  it("reports errors for missing bundled harness standards", async () => {
    const standardFiles = ["AGENTS.md", "api-contract.md", "backend.md", "frontend.md", "testing.md"];
    for (const standardFile of standardFiles) {
      const cwd = await mkdtemp(path.join(tmpdir(), "spec-power-"));
      const files = renderInitFiles({ profile: "multi-module", agents: ["codex"] });
      await applyFileActions(cwd, await planFiles(cwd, files, {}));
      await rm(path.join(cwd, ".specpower", "standards", standardFile));

      const relativePath = `.specpower/standards/${standardFile}`;
      const results = await runChecks(cwd);
      expect(results).toContainEqual({
        level: "error",
        message: `Missing required file: ${relativePath}`
      });
    }
  });
});

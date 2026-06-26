import { describe, expect, it } from "vitest";
import { mkdtemp } from "node:fs/promises";
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
});


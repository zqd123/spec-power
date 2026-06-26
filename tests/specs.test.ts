import { describe, expect, it } from "vitest";
import { mkdir } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nextSpecDirectory, slugify } from "../src/core/specs.js";

describe("spec helpers", () => {
  it("slugifies user input", () => {
    expect(slugify("Smart Table Import")).toBe("smart-table-import");
    expect(slugify("  API_v2 sync!! ")).toBe("api-v2-sync");
  });

  it("returns next numbered spec directory", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "spec-power-"));
    await mkdir(path.join(cwd, "specs", "001-existing"), { recursive: true });
    await mkdir(path.join(cwd, "specs", "002-other"), { recursive: true });

    await expect(nextSpecDirectory(cwd, "smart-table-import")).resolves.toBe("003-smart-table-import");
  });
});


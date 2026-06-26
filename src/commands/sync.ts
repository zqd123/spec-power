import { Command } from "commander";
import { readLockfile } from "../core/lockfile.js";
import { bundledTemplateVersion } from "../core/templates.js";

export function syncCommand(): Command {
  return new Command("sync")
    .description("Check bundled template version. External sync is not implemented in the first release.")
    .option("--check", "check whether the lockfile template version matches the bundled version", false)
    .option("--apply", "reserved for future safe template sync", false)
    .action(async (options: { check: boolean; apply: boolean }) => {
      if (options.apply) {
        console.log("sync --apply is reserved for a later release. Bundled template mode does not auto-sync files yet.");
        return;
      }

      const lockfile = await readLockfile(process.cwd());
      if (!lockfile) {
        console.log("warning  .specpower/upstream.lock was not found. Run spec-power init first.");
        return;
      }

      if (lockfile.version === bundledTemplateVersion) {
        console.log(`info     bundled template version is current: ${bundledTemplateVersion}`);
      } else {
        console.log(
          `warning  lockfile version ${lockfile.version} differs from bundled template version ${bundledTemplateVersion}`
        );
      }

      if (!options.check) {
        console.log("info     no files changed. Use sync --check in CI for version drift checks.");
      }
    });
}


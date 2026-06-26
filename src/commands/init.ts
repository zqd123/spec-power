import { Command } from "commander";
import { applyFileActions, planFiles, summarizeActions } from "../core/file-plan.js";
import { detectProfile } from "../core/project.js";
import { parseAgents, parseProfile } from "../core/options.js";
import { renderInitFiles } from "../core/templates.js";

export function initCommand(): Command {
  return new Command("init")
    .description("Initialize SpecPower SDD files in the current project.")
    .option("--agents <agents>", "comma-separated agents to enable", "codex,claude")
    .option("--profile <profile>", "project profile")
    .option("--dry-run", "print the write plan without changing files", false)
    .option("--force", "overwrite existing generated files", false)
    .action(async (options: { agents: string; profile?: string; dryRun: boolean; force: boolean }) => {
      const cwd = process.cwd();
      const agents = parseAgents(options.agents);
      const detectedProfile = await detectProfile(cwd);
      const profile = parseProfile(options.profile, detectedProfile);
      const files = renderInitFiles({ profile, agents });
      const actions = await planFiles(cwd, files, { force: options.force });

      console.log(`SpecPower init plan (${profile}, agents: ${agents.join(", ")})`);
      console.log(summarizeActions(actions));

      if (options.dryRun) {
        console.log("\nDry run only. No files were changed.");
        return;
      }

      await applyFileActions(cwd, actions);
      const written = actions.filter((action) => action.action === "create" || action.action === "overwrite");
      console.log(`\nWrote ${written.length} file(s).`);
      console.log("Next steps:");
      console.log("  1. Run spec-power check");
      console.log("  2. Create a first spec with spec-power new <slug>");
      console.log("  3. Install Spec Kit or Superpowers in your Agent environment only if your team uses them.");
    });
}


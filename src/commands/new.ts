import { Command } from "commander";
import { parseSpecAgent, parseSpecType } from "../core/options.js";
import { nextSpecDirectory, slugify, writeSpecFiles } from "../core/specs.js";
import { renderSpecFiles } from "../core/templates.js";

export function newCommand(): Command {
  return new Command("new")
    .description("Create a new specs/NNN-slug directory.")
    .argument("<slug>", "feature slug")
    .option("--type <type>", "spec type: feature, bugfix, or chore", "feature")
    .option("--modules <modules>", "comma-separated impacted modules")
    .option("--agent <agent>", "codex, claude, or both", "both")
    .option("--dry-run", "print files without changing the filesystem", false)
    .action(
      async (
        rawSlug: string,
        options: { type: string; modules?: string; agent: string; dryRun: boolean }
      ) => {
        const cwd = process.cwd();
        const slug = slugify(rawSlug);
        const type = parseSpecType(options.type);
        const agent = parseSpecAgent(options.agent);
        const modules = parseModules(options.modules);
        const directoryName = await nextSpecDirectory(cwd, slug);
        const files = renderSpecFiles({ title: toTitle(slug), type, modules, agent });
        const paths = await writeSpecFiles(cwd, directoryName, files, { dryRun: options.dryRun });

        if (options.dryRun) {
          console.log(`SpecPower new plan: specs/${directoryName}`);
          for (const filePath of paths) {
            console.log(`create    ${filePath}`);
          }
          console.log("Dry run only. No files were changed.");
          return;
        }

        console.log(`Created specs/${directoryName}`);
        for (const filePath of paths) {
          console.log(`create    ${filePath}`);
        }
      }
    );
}

function parseModules(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}


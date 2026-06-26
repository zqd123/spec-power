#!/usr/bin/env node
import { Command } from "commander";
import { checkCommand } from "./commands/check.js";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import { newCommand } from "./commands/new.js";
import { syncCommand } from "./commands/sync.js";
import { bundledTemplateVersion } from "./core/templates.js";

const program = new Command();

program
  .name("spec-power")
  .description("Adopt SpecPower SDD workflow files in any project.")
  .version(bundledTemplateVersion);

program.addCommand(initCommand());
program.addCommand(newCommand());
program.addCommand(checkCommand());
program.addCommand(doctorCommand());
program.addCommand(syncCommand());

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`error    ${message}`);
  process.exitCode = 1;
});


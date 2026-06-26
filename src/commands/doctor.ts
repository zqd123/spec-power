import { Command } from "commander";
import {
  commandAvailable,
  findSensitiveLocalFiles,
  gitAvailable,
  gitStatus,
  isGitRepository,
  pathExists
} from "../core/project.js";
import path from "node:path";

export function doctorCommand(): Command {
  return new Command("doctor")
    .description("Diagnose local SpecPower-related project environment.")
    .action(async () => {
      const cwd = process.cwd();
      const hasGit = await gitAvailable();
      console.log(`${hasGit ? "info" : "warning"}  git ${hasGit ? "is available" : "was not found"}`);

      const inRepo = hasGit ? await isGitRepository(cwd) : false;
      console.log(`${inRepo ? "info" : "warning"}  current directory ${inRepo ? "is" : "is not"} a Git repository`);

      if (inRepo) {
        const status = await gitStatus(cwd);
        console.log(`${status ? "warning" : "info"}  working tree ${status ? "has uncommitted changes" : "looks clean"}`);
      }

      const hasSpecify = await commandAvailable("specify");
      console.log(`${hasSpecify ? "info" : "warning"}  specify CLI ${hasSpecify ? "is available" : "was not found"}`);

      const hasCodexEntry = await pathExists(path.join(cwd, "AGENTS.md"));
      const hasClaudeEntry = await pathExists(path.join(cwd, "CLAUDE.md"));
      console.log(`${hasCodexEntry ? "info" : "warning"}  AGENTS.md ${hasCodexEntry ? "exists" : "is missing"}`);
      console.log(`${hasClaudeEntry ? "info" : "warning"}  CLAUDE.md ${hasClaudeEntry ? "exists" : "is missing"}`);

      const sensitiveFiles = await findSensitiveLocalFiles(cwd);
      if (sensitiveFiles.length > 0) {
        console.log(`warning  local sensitive-looking files present: ${sensitiveFiles.join(", ")}`);
      } else {
        console.log("info     no root-level .env/*.pem/*.key files detected");
      }
    });
}


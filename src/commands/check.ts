import { Command } from "commander";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { lockfilePath, readLockfile } from "../core/lockfile.js";
import { pathExists } from "../core/project.js";
import type { Agent } from "../core/options.js";

type Level = "error" | "warning" | "info";

interface CheckResult {
  level: Level;
  message: string;
}

export function checkCommand(): Command {
  return new Command("check")
    .description("Check whether the current project has a usable SpecPower setup.")
    .action(async () => {
      const results = await runChecks(process.cwd());
      for (const result of results) {
        console.log(`${result.level.padEnd(7)} ${result.message}`);
      }
      if (results.some((result) => result.level === "error")) {
        process.exitCode = 1;
      }
    });
}

export async function runChecks(cwd: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  await requireFile(cwd, "SDD_WORKFLOW.md", results);
  await requireFile(cwd, "SDD_IMPLEMENTATION_STEPS.md", results);
  await requireFile(cwd, lockfilePath, results);
  await requireFile(cwd, ".specpower/constitution.md", results);
  await requireFile(cwd, ".specpower/templates/spec-template.md", results);
  await requireFile(cwd, ".specpower/templates/plan-template.md", results);
  await requireFile(cwd, ".specpower/templates/tasks-template.md", results);
  await requireDirectory(cwd, "specs", results);

  const lockfile = await readLockfile(cwd);
  const agents = lockfile?.agents ?? (await inferAgents(cwd));
  if (!lockfile) {
    results.push({ level: "warning", message: "Missing lockfile metadata; inferred enabled agents from files." });
  }

  for (const agent of agents) {
    if (agent === "codex") {
      await requireAgentEntry(cwd, "AGENTS.md", results);
    }
    if (agent === "claude") {
      await requireAgentEntry(cwd, "CLAUDE.md", results);
    }
  }

  await checkSpecDirectories(cwd, results);

  if (!results.some((result) => result.level === "error")) {
    results.push({ level: "info", message: "SpecPower setup is usable." });
  }

  return results;
}

async function requireFile(cwd: string, relativePath: string, results: CheckResult[]): Promise<void> {
  if (!(await pathExists(path.join(cwd, relativePath)))) {
    results.push({ level: "error", message: `Missing required file: ${relativePath}` });
  }
}

async function requireDirectory(cwd: string, relativePath: string, results: CheckResult[]): Promise<void> {
  if (!(await pathExists(path.join(cwd, relativePath)))) {
    results.push({ level: "error", message: `Missing required directory: ${relativePath}` });
  }
}

async function inferAgents(cwd: string): Promise<Agent[]> {
  const agents: Agent[] = [];
  if (await pathExists(path.join(cwd, "AGENTS.md"))) {
    agents.push("codex");
  }
  if (await pathExists(path.join(cwd, "CLAUDE.md"))) {
    agents.push("claude");
  }
  return agents;
}

async function requireAgentEntry(cwd: string, relativePath: string, results: CheckResult[]): Promise<void> {
  const absolutePath = path.join(cwd, relativePath);
  if (!(await pathExists(absolutePath))) {
    results.push({ level: "error", message: `Missing enabled Agent entry: ${relativePath}` });
    return;
  }
  const content = await readFile(absolutePath, "utf8");
  if (!content.includes("SDD_WORKFLOW.md") || !content.includes("specs/")) {
    results.push({
      level: "warning",
      message: `${relativePath} exists but does not clearly reference SDD_WORKFLOW.md and specs/.`
    });
  }
}

async function checkSpecDirectories(cwd: string, results: CheckResult[]): Promise<void> {
  const specsDir = path.join(cwd, "specs");
  if (!(await pathExists(specsDir))) {
    return;
  }
  const entries = await readdir(specsDir, { withFileTypes: true });
  const featureDirs = entries.filter((entry) => entry.isDirectory() && /^\d{3}-/.test(entry.name));
  for (const entry of featureDirs) {
    for (const fileName of ["spec.md", "plan.md", "tasks.md"]) {
      const relativePath = `specs/${entry.name}/${fileName}`;
      if (!(await pathExists(path.join(cwd, relativePath)))) {
        results.push({ level: "error", message: `Missing spec artifact: ${relativePath}` });
      }
    }
  }
}

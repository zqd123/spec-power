import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Profile } from "./options.js";

const execFileAsync = promisify(execFile);

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function detectProfile(cwd: string): Promise<Profile> {
  if (await pathExists(path.join(cwd, "pom.xml"))) {
    return "backend-service";
  }
  if (await pathExists(path.join(cwd, "go.mod"))) {
    return "backend-service";
  }
  if (await pathExists(path.join(cwd, "package.json"))) {
    const pkg = await readJson(path.join(cwd, "package.json"));
    const deps = {
      ...((pkg.dependencies as Record<string, unknown> | undefined) ?? {}),
      ...((pkg.devDependencies as Record<string, unknown> | undefined) ?? {})
    };
    if (["vite", "next", "react", "vue", "svelte", "@angular/core"].some((name) => name in deps)) {
      return "frontend-app";
    }
  }
  const entries = await readdir(cwd, { withFileTypes: true });
  const projectMarkers = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .slice(0, 20)
      .map(async (entry) => {
        const dir = path.join(cwd, entry.name);
        return (
          (await pathExists(path.join(dir, "package.json"))) ||
          (await pathExists(path.join(dir, "pom.xml"))) ||
          (await pathExists(path.join(dir, "go.mod")))
        );
      })
  );
  return projectMarkers.filter(Boolean).length >= 2 ? "multi-module" : "multi-module";
}

export async function gitAvailable(): Promise<boolean> {
  try {
    await execFileAsync("git", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function isGitRepository(cwd: string): Promise<boolean> {
  try {
    await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], { cwd });
    return true;
  } catch {
    return false;
  }
}

export async function gitStatus(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--short"], { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function commandAvailable(command: string): Promise<boolean> {
  try {
    await execFileAsync(command, ["--help"]);
    return true;
  } catch {
    return false;
  }
}

export async function findSensitiveLocalFiles(cwd: string): Promise<string[]> {
  const entries = await readdir(cwd, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name === ".env" || name.startsWith(".env.") || name.endsWith(".pem") || name.endsWith(".key"))
    .sort();
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}


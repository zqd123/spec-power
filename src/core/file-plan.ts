import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "./project.js";

export type FileKind = "managed" | "override" | "local" | "merge";

export interface PlannedFile {
  path: string;
  content: string;
  kind: FileKind;
}

export interface FileAction extends PlannedFile {
  action: "create" | "overwrite" | "skip" | "unchanged";
  reason: string;
}

export async function planFiles(
  cwd: string,
  files: PlannedFile[],
  options: { force?: boolean }
): Promise<FileAction[]> {
  const actions: FileAction[] = [];
  for (const file of files) {
    const absolutePath = path.join(cwd, file.path);
    if (!(await pathExists(absolutePath))) {
      actions.push({ ...file, action: "create", reason: "file does not exist" });
      continue;
    }

    const current = await readFile(absolutePath, "utf8");
    if (current === file.content) {
      actions.push({ ...file, action: "unchanged", reason: "content already matches" });
      continue;
    }

    if (options.force && file.path !== "specs/.gitkeep") {
      actions.push({ ...file, action: "overwrite", reason: "--force was provided" });
      continue;
    }

    actions.push({ ...file, action: "skip", reason: "file already exists; use --force to overwrite" });
  }
  return actions;
}

export async function applyFileActions(cwd: string, actions: FileAction[]): Promise<void> {
  for (const action of actions) {
    if (action.action !== "create" && action.action !== "overwrite") {
      continue;
    }
    const absolutePath = path.join(cwd, action.path);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, action.content, "utf8");
  }
}

export function summarizeActions(actions: FileAction[]): string {
  return actions
    .map((action) => `${action.action.padEnd(9)} ${action.path} (${action.reason})`)
    .join("\n");
}


import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Agent, Profile } from "./options.js";
import type { PlannedFile } from "./file-plan.js";
import { sha256 } from "./hash.js";
import { pathExists } from "./project.js";

export const lockfilePath = ".specpower/upstream.lock";

export interface Lockfile {
  version: string;
  profile: Profile;
  agents: Agent[];
  templateMode: "bundled";
  managedFiles: Array<{
    path: string;
    sha256: string;
    kind: string;
  }>;
  createdAt: string;
}

export function createLockfile(input: {
  version: string;
  profile: Profile;
  agents: Agent[];
  files: PlannedFile[];
}): Lockfile {
  return {
    version: input.version,
    profile: input.profile,
    agents: input.agents,
    templateMode: "bundled",
    managedFiles: input.files
      .filter((file) => file.path !== lockfilePath)
      .map((file) => ({
        path: file.path,
        sha256: sha256(file.content),
        kind: file.kind
      })),
    createdAt: new Date().toISOString()
  };
}

export async function readLockfile(cwd: string): Promise<Lockfile | null> {
  const absolutePath = path.join(cwd, lockfilePath);
  if (!(await pathExists(absolutePath))) {
    return null;
  }
  return JSON.parse(await readFile(absolutePath, "utf8")) as Lockfile;
}

export function serializeLockfile(lockfile: Lockfile): string {
  return `${JSON.stringify(lockfile, null, 2)}\n`;
}


import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "./project.js";

export function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) {
    throw new Error("Spec slug must contain at least one letter or number.");
  }
  return slug;
}

export async function nextSpecDirectory(cwd: string, slug: string): Promise<string> {
  const specsDir = path.join(cwd, "specs");
  if (!(await pathExists(specsDir))) {
    return `001-${slug}`;
  }
  const entries = await readdir(specsDir, { withFileTypes: true });
  const max = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => /^(\d{3})-/.exec(entry.name)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number.parseInt(value, 10))
    .reduce((current, value) => Math.max(current, value), 0);
  return `${String(max + 1).padStart(3, "0")}-${slug}`;
}

export async function writeSpecFiles(
  cwd: string,
  directoryName: string,
  files: Record<string, string>,
  options: { dryRun?: boolean }
): Promise<string[]> {
  const targetDir = path.join(cwd, "specs", directoryName);
  const written: string[] = [];
  for (const [name, content] of Object.entries(files)) {
    const absolutePath = path.join(targetDir, name);
    if (await pathExists(absolutePath)) {
      throw new Error(`Refusing to overwrite existing spec file: specs/${directoryName}/${name}`);
    }
  }
  if (options.dryRun) {
    return Object.keys(files).map((name) => `specs/${directoryName}/${name}`);
  }
  await mkdir(targetDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const absolutePath = path.join(targetDir, name);
    await writeFile(absolutePath, content, "utf8");
    written.push(`specs/${directoryName}/${name}`);
  }
  return written;
}


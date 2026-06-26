export const supportedAgents = ["codex", "claude"] as const;
export type Agent = (typeof supportedAgents)[number];

export const supportedProfiles = [
  "backend-service",
  "frontend-app",
  "multi-module",
  "multi-repo-platform"
] as const;
export type Profile = (typeof supportedProfiles)[number];

export type SpecType = "feature" | "bugfix" | "chore";
export type SpecAgent = "codex" | "claude" | "both";

export function parseAgents(value: string | undefined): Agent[] {
  const raw = value?.trim() ? value : "codex,claude";
  const agents = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (agents.length === 0) {
    throw new Error("At least one agent must be provided.");
  }

  const unique = Array.from(new Set(agents));
  for (const agent of unique) {
    if (!supportedAgents.includes(agent as Agent)) {
      throw new Error(`Unsupported agent "${agent}". Supported agents: ${supportedAgents.join(", ")}.`);
    }
  }

  return unique as Agent[];
}

export function parseProfile(value: string | undefined, fallback: Profile): Profile {
  if (!value) {
    return fallback;
  }
  if (!supportedProfiles.includes(value as Profile)) {
    throw new Error(`Unsupported profile "${value}". Supported profiles: ${supportedProfiles.join(", ")}.`);
  }
  return value as Profile;
}

export function parseSpecType(value: string | undefined): SpecType {
  const candidate = value ?? "feature";
  if (!["feature", "bugfix", "chore"].includes(candidate)) {
    throw new Error('Unsupported spec type. Use "feature", "bugfix", or "chore".');
  }
  return candidate as SpecType;
}

export function parseSpecAgent(value: string | undefined): SpecAgent {
  const candidate = value ?? "both";
  if (!["codex", "claude", "both"].includes(candidate)) {
    throw new Error('Unsupported spec agent. Use "codex", "claude", or "both".');
  }
  return candidate as SpecAgent;
}


import type { Agent, Profile, SpecAgent, SpecType } from "./options.js";
import type { PlannedFile } from "./file-plan.js";
import { createLockfile, lockfilePath, serializeLockfile } from "./lockfile.js";

export const bundledTemplateVersion = "0.1.0";

export function renderInitFiles(input: { profile: Profile; agents: Agent[] }): PlannedFile[] {
  const files: PlannedFile[] = [
    {
      path: "SDD_WORKFLOW.md",
      kind: "managed",
      content: workflowTemplate(input.profile)
    },
    {
      path: "SDD_IMPLEMENTATION_STEPS.md",
      kind: "managed",
      content: implementationStepsTemplate()
    },
    {
      path: "TEAM_SDD_AGENT_WORKFLOW.md",
      kind: "managed",
      content: teamAgentWorkflowTemplate()
    },
    {
      path: ".specpower/constitution.md",
      kind: "override",
      content: constitutionTemplate(input.profile)
    },
    {
      path: ".specpower/templates/spec-template.md",
      kind: "override",
      content: specTemplate()
    },
    {
      path: ".specpower/templates/plan-template.md",
      kind: "override",
      content: planTemplate()
    },
    {
      path: ".specpower/templates/tasks-template.md",
      kind: "override",
      content: tasksTemplate()
    },
    {
      path: ".specpower/templates/review-checklist.md",
      kind: "override",
      content: reviewChecklistTemplate()
    },
    {
      path: "specs/.gitkeep",
      kind: "local",
      content: ""
    }
  ];

  if (input.agents.includes("codex")) {
    files.push(
      {
        path: ".specpower/adapters/codex.md",
        kind: "managed",
        content: codexAdapterTemplate()
      },
      {
        path: "AGENTS.md",
        kind: "merge",
        content: codexEntryTemplate()
      }
    );
  }

  if (input.agents.includes("claude")) {
    files.push(
      {
        path: ".specpower/adapters/claude.md",
        kind: "managed",
        content: claudeAdapterTemplate()
      },
      {
        path: "CLAUDE.md",
        kind: "merge",
        content: claudeEntryTemplate()
      }
    );
  }

  const lockfile = createLockfile({
    version: bundledTemplateVersion,
    profile: input.profile,
    agents: input.agents,
    files
  });
  files.push({
    path: lockfilePath,
    kind: "managed",
    content: serializeLockfile(lockfile)
  });

  return files;
}

export function renderSpecFiles(input: {
  title: string;
  type: SpecType;
  modules: string[];
  agent: SpecAgent;
}): Record<string, string> {
  const modules = input.modules.length > 0 ? input.modules.join(", ") : "TBD";
  const date = new Date().toISOString().slice(0, 10);
  return {
    "spec.md": `# ${input.title}\n\nDate: ${date}\nType: ${input.type}\nModules: ${modules}\nAgent: ${input.agent}\n\n## Goal\n\nDescribe the user goal and the outcome that must be true when this work is complete.\n\n## User Scenarios\n\n- Primary scenario:\n- Secondary scenario:\n\n## Acceptance Criteria\n\n- [ ] Criteria are observable and testable.\n- [ ] In-scope modules are listed.\n- [ ] Out-of-scope behavior is explicit.\n\n## Non-Goals\n\n- \n\n## Risks And Constraints\n\n- Permissions/security/data impact:\n- External systems:\n- Compatibility:\n`,
    "plan.md": `# Implementation Plan\n\n## Summary\n\nDescribe the implementation approach for ${input.title}.\n\n## Impacted Areas\n\n- Modules: ${modules}\n- Public APIs or schemas:\n- Data, permissions, or external systems:\n\n## Approach\n\n- \n\n## Validation\n\n- Commands to run:\n- Manual checks:\n- Known gaps:\n\n## Rollback\n\n- \n`,
    "tasks.md": `# Tasks\n\n## Preparation\n\n- [ ] Confirm spec acceptance criteria.\n- [ ] Confirm impacted modules: ${modules}.\n\n## Implementation\n\n- [ ] Add or update focused tests first where practical.\n- [ ] Implement the smallest complete change.\n- [ ] Update documentation or templates if behavior changes.\n\n## Verification\n\n- [ ] Run planned validation commands.\n- [ ] Record failures or skipped checks.\n- [ ] Review changed files for unrelated edits.\n`
  };
}

function workflowTemplate(profile: Profile): string {
  return `# SDD Workflow\n\nThis project uses SpecPower to keep Specification-Driven Development artifacts local, reviewable, and independent of any single AI Agent conversation.\n\nProfile: ${profile}\n\n## Required Artifacts\n\n- \`specs/<feature-id>/spec.md\`: user goal, scenarios, acceptance criteria, non-goals, risks.\n- \`specs/<feature-id>/plan.md\`: implementation strategy, impacted modules, interfaces, data, validation, rollback.\n- \`specs/<feature-id>/tasks.md\`: executable task breakdown and verification checklist.\n\n## Agent Flow\n\n1. Read the current user request.\n2. Read this file and the active feature files under \`specs/<feature-id>/\` when they exist.\n3. Read the closest project rules such as \`AGENTS.md\`, \`CLAUDE.md\`, README, CONTRIBUTING, or docs indexes.\n4. For complex or risky work, clarify the spec and plan before implementation.\n5. Run matching validation and report skipped checks honestly.\n\n## Tool Notes\n\nSpec Kit can be initialized manually when the team wants its generated command structure:\n\n\`\`\`bash\nspecify init --here --integration codex --integration-options=\"--skills\" --ignore-agent-tools\n\`\`\`\n\nSuperpowers should be installed in the user or Agent environment through the supported plugin or skill mechanism. This repository records usage expectations, not plugin installation artifacts.\n`;
}

function implementationStepsTemplate(): string {
  return `# SDD Implementation Steps\n\n## First-Time Setup\n\n1. Run \`spec-power init --dry-run\` and review planned files.\n2. Run \`spec-power init\` when the plan is acceptable.\n3. If \`AGENTS.md\` or \`CLAUDE.md\` already existed and was skipped, merge the suggested content from \`.specpower/adapters/\` manually.\n4. Run \`spec-power check\`.\n5. Create the first feature with \`spec-power new <slug>\`.\n\n## Daily Use\n\n1. Start non-trivial work by updating \`spec.md\`.\n2. Convert the spec into \`plan.md\` before implementation.\n3. Break execution into \`tasks.md\`.\n4. Implement within the target project or module rules.\n5. Run validation and record skipped checks or residual risk.\n\n## Safety\n\nDo not delete, reset, force-push, run irreversible migrations, write production data, or overwrite unrelated changes without explicit confirmation.\n`;
}

function teamAgentWorkflowTemplate(): string {
  return `# Team SDD Agent Workflow\n\n## Purpose\n\nAll Agents should work from the same project-local SDD artifacts instead of treating chat history as the only source of truth.\n\n## Agent Contract\n\n- Read current request, SDD workflow, active spec files, local project rules, and directly relevant code.\n- Keep project-specific engineering rules higher priority than generic team guidance.\n- Do not overwrite unrelated user or teammate changes.\n- For database, security, permissions, deployment, external systems, or batch data changes, write risks and rollback before implementation.\n- Do not claim validation passed unless commands actually ran.\n\n## Supported Entrypoints\n\n- Codex: \`AGENTS.md\`\n- Claude Code: \`CLAUDE.md\`\n- Generic templates: \`.specpower/templates/\`\n`;
}

function constitutionTemplate(profile: Profile): string {
  return `# SpecPower Constitution\n\nProfile: ${profile}\n\n## Principles\n\n- Specs are the durable source of product and engineering intent.\n- Plans must make impacted modules, APIs, data, permissions, validation, and rollback explicit.\n- Tasks must be executable without hidden product or architecture decisions.\n- Project-local rules override generic workflow guidance when they are safer or more specific.\n- Destructive or irreversible operations require explicit confirmation.\n\n## Validation Standard\n\nEvery implementation must state which checks ran, which checks were skipped, and what risk remains.\n`;
}

function specTemplate(): string {
  return `# [Feature Title]\n\nDate: YYYY-MM-DD\nType: feature\nModules: TBD\n\n## Goal\n\n## User Scenarios\n\n## Acceptance Criteria\n\n- [ ] \n\n## Non-Goals\n\n## Risks And Constraints\n\n- Permissions/security/data impact:\n- External systems:\n- Compatibility:\n`;
}

function planTemplate(): string {
  return `# Implementation Plan\n\n## Summary\n\n## Impacted Areas\n\n- Modules:\n- Public APIs or schemas:\n- Data, permissions, or external systems:\n\n## Approach\n\n## Validation\n\n- Commands to run:\n- Manual checks:\n- Known gaps:\n\n## Rollback\n`;
}

function tasksTemplate(): string {
  return `# Tasks\n\n## Preparation\n\n- [ ] Confirm spec acceptance criteria.\n- [ ] Confirm impacted modules.\n\n## Implementation\n\n- [ ] Add or update focused tests first where practical.\n- [ ] Implement the smallest complete change.\n- [ ] Update documentation or templates if behavior changes.\n\n## Verification\n\n- [ ] Run planned validation commands.\n- [ ] Record failures or skipped checks.\n- [ ] Review changed files for unrelated edits.\n`;
}

function reviewChecklistTemplate(): string {
  return `# Review Checklist\n\n- [ ] The implementation satisfies \`spec.md\` acceptance criteria.\n- [ ] The implementation stays within \`plan.md\` boundaries.\n- [ ] \`tasks.md\` reflects completed and skipped work.\n- [ ] Validation commands ran or skipped checks are explained.\n- [ ] Risks, rollback, and compatibility are clear.\n- [ ] No unrelated files or formatting churn are included.\n`;
}

function codexAdapterTemplate(): string {
  return codexEntryTemplate();
}

function claudeAdapterTemplate(): string {
  return claudeEntryTemplate();
}

function codexEntryTemplate(): string {
  return `# Codex Project Entry\n\n## SDD Workflow\n\n- For complex, multi-module, risky, or reusable work, read \`SDD_WORKFLOW.md\` before implementation.\n- If a current feature exists under \`specs/<feature-id>/\`, read \`spec.md\`, \`plan.md\`, and \`tasks.md\`.\n- When work targets a subdirectory or module, read the closest local rules such as \`AGENTS.md\`, README, CONTRIBUTING, or docs indexes.\n- Do not treat chat history as a replacement for SDD artifacts.\n\n## Safety\n\n- Protect unrelated user and teammate changes.\n- Do not perform destructive operations without explicit confirmation.\n- For database, permissions, security, production, external systems, batch data, or irreversible work, write risks and rollback before implementation.\n- Run matching validation after code changes and state any skipped checks.\n`;
}

function claudeEntryTemplate(): string {
  return `# Claude Code Project Entry\n\n## SDD Workflow\n\nBefore implementation, read:\n\n1. \`SDD_WORKFLOW.md\`\n2. Current feature files under \`specs/<feature-id>/\`\n3. Project or module local rules\n4. Directly related source code and tests\n\nFor complex or risky work, do not implement before the spec and plan are clear.\n\n## Safety\n\n- Do not overwrite unrelated changes.\n- Do not perform destructive operations without explicit confirmation.\n- Do not claim validation passed unless commands actually ran.\n`;
}


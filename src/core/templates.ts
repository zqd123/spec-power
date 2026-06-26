import type { Agent, Profile, SpecAgent, SpecType } from "./options.js";
import type { PlannedFile } from "./file-plan.js";
import { createLockfile, lockfilePath, serializeLockfile } from "./lockfile.js";
import { renderHarnessStandardFiles } from "./harness-templates.js";

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

  files.push(...renderHarnessStandardFiles());

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
    "spec.md": `# ${input.title}\n\n日期：${date}\n类型：${input.type}\n模块：${modules}\nAgent：${input.agent}\n\n## 目标\n\n描述用户目标，以及本工作完成后必须成立的结果。\n\n## 用户场景\n\n- 主场景：\n- 次场景：\n\n## 验收标准\n\n- [ ] 标准可观察、可测试。\n- [ ] 已列出范围内模块。\n- [ ] 已明确范围外行为。\n\n## 非目标\n\n- \n\n## 风险与约束\n\n- 权限、安全或数据影响：\n- 外部系统：\n- 兼容性：\n`,
    "plan.md": `# 实施计划\n\n## 摘要\n\n描述 ${input.title} 的实施方案。\n\n## 影响范围\n\n- 模块：${modules}\n- 公开 API 或 schema：\n- 数据、权限或外部系统：\n\n## 方案\n\n- \n\n## 验证\n\n- 需要执行的命令：\n- 手工检查：\n- 已知缺口：\n\n## 回滚\n\n- \n`,
    "tasks.md": `# 任务\n\n## 准备\n\n- [ ] 确认 spec 验收标准。\n- [ ] 确认影响模块：${modules}。\n\n## 实施\n\n- [ ] 条件允许时优先新增或更新聚焦测试。\n- [ ] 实施最小但完整的变更。\n- [ ] 行为变化时更新文档或模板。\n\n## 验证\n\n- [ ] 运行计划中的验证命令。\n- [ ] 记录失败或跳过的检查。\n- [ ] 检查变更文件中是否包含无关改动。\n`
  };
}

function workflowTemplate(profile: Profile): string {
  return `# SDD 工作流\n\n本项目使用 SpecPower 将 SDD（Specification-Driven Development）产物保存在项目本地，使其可审阅、可追踪，并且不依赖某一次 AI Agent 对话。\n\nProfile：${profile}\n\n## 必需产物\n\n- \`specs/<feature-id>/spec.md\`：用户目标、场景、验收标准、非目标和风险。\n- \`specs/<feature-id>/plan.md\`：实施策略、影响模块、接口、数据、验证和回滚。\n- \`specs/<feature-id>/tasks.md\`：可执行任务拆分和验证清单。\n\n## Agent 流程\n\n1. 阅读当前用户请求。\n2. 阅读本文件；如果存在当前功能目录，阅读 \`specs/<feature-id>/\` 下的文件。\n3. 阅读最近的项目规则，如 \`AGENTS.md\`、\`CLAUDE.md\`、README、CONTRIBUTING 或 docs 索引。\n4. 复杂或高风险工作必须先明确 spec 和 plan，再开始实现。\n5. 运行匹配验证，并如实说明跳过的检查。\n\n## 工具说明\n\n团队需要 Spec Kit 生成的命令结构时，可以手动初始化：\n\n\`\`\`bash\nspecify init --here --integration codex --integration-options=\"--skills\" --ignore-agent-tools\n\`\`\`\n\nSuperpowers 应通过用户或 Agent 环境支持的插件/skill 机制安装。本仓库只记录使用约定，不提交插件安装产物。\n`;
}

function implementationStepsTemplate(): string {
  return `# SDD 实施步骤\n\n## 首次设置\n\n1. 运行 \`spec-power init --dry-run\` 并审阅计划生成的文件。\n2. 计划可接受后运行 \`spec-power init\`。\n3. 如果 \`AGENTS.md\` 或 \`CLAUDE.md\` 已存在并被跳过，手工合并 \`.specpower/adapters/\` 中的建议内容。\n4. 运行 \`spec-power check\`。\n5. 使用 \`spec-power new <slug>\` 创建第一个功能规格。\n\n## 日常使用\n\n1. 非简单工作先更新 \`spec.md\`。\n2. 实施前将 spec 转换为 \`plan.md\`。\n3. 将执行过程拆分到 \`tasks.md\`。\n4. 在目标项目或模块规则范围内实施。\n5. 运行验证，并记录跳过的检查或剩余风险。\n\n## 安全规则\n\n未经明确确认，不删除、重置、force-push、执行不可逆迁移、写入生产数据或覆盖无关改动。\n`;
}

function teamAgentWorkflowTemplate(): string {
  return `# 团队 SDD Agent 工作流\n\n## 目的\n\n所有 Agent 都应基于项目本地的 SDD 产物工作，而不是把聊天历史当作唯一事实来源。\n\n## Agent 契约\n\n- 阅读当前请求、SDD 工作流、当前 spec 文件、本地项目规则和直接相关代码。\n- 项目特定工程规则优先级高于通用团队指导。\n- 不覆盖用户或协作者的无关改动。\n- 涉及数据库、安全、权限、部署、外部系统或批量数据变更时，实施前写明风险和回滚方式。\n- 命令没有实际运行时，不要声称验证已通过。\n\n## 支持入口\n\n- Codex：\`AGENTS.md\`\n- Claude Code：\`CLAUDE.md\`\n- 通用模板：\`.specpower/templates/\`\n`;
}

function constitutionTemplate(profile: Profile): string {
  return `# SpecPower 宪章\n\nProfile：${profile}\n\n## 原则\n\n- specs 是产品意图和工程意图的持久事实来源。\n- plans 必须明确影响模块、API、数据、权限、验证和回滚。\n- tasks 必须可执行，不隐藏产品或架构决策。\n- 项目本地规则在更安全或更具体时优先于通用流程指导。\n- 破坏性或不可逆操作需要明确确认。\n\n## 验证标准\n\n每次实施都必须说明运行了哪些检查、跳过了哪些检查，以及还剩余什么风险。\n`;
}

function specTemplate(): string {
  return `# [功能标题]\n\n日期：YYYY-MM-DD\n类型：feature\n模块：TBD\n\n## 目标\n\n## 用户场景\n\n## 验收标准\n\n- [ ] \n\n## 非目标\n\n## 风险与约束\n\n- 权限、安全或数据影响：\n- 外部系统：\n- 兼容性：\n`;
}

function planTemplate(): string {
  return `# 实施计划\n\n## 摘要\n\n## 影响范围\n\n- 模块：\n- 公开 API 或 schema：\n- 数据、权限或外部系统：\n\n## 方案\n\n## 验证\n\n- 需要执行的命令：\n- 手工检查：\n- 已知缺口：\n\n## 回滚\n`;
}

function tasksTemplate(): string {
  return `# 任务\n\n## 准备\n\n- [ ] 确认 spec 验收标准。\n- [ ] 确认影响模块。\n\n## 实施\n\n- [ ] 条件允许时优先新增或更新聚焦测试。\n- [ ] 实施最小但完整的变更。\n- [ ] 行为变化时更新文档或模板。\n\n## 验证\n\n- [ ] 运行计划中的验证命令。\n- [ ] 记录失败或跳过的检查。\n- [ ] 检查变更文件中是否包含无关改动。\n`;
}

function reviewChecklistTemplate(): string {
  return `# 评审清单\n\n- [ ] 实现满足 \`spec.md\` 的验收标准。\n- [ ] 实现没有超出 \`plan.md\` 的边界。\n- [ ] \`tasks.md\` 已反映完成和跳过的工作。\n- [ ] 已运行验证命令，或已说明跳过的检查。\n- [ ] 风险、回滚和兼容性说明清楚。\n- [ ] 不包含无关文件或格式噪音。\n`;
}

function codexAdapterTemplate(): string {
  return codexEntryTemplate();
}

function claudeAdapterTemplate(): string {
  return claudeEntryTemplate();
}

function codexEntryTemplate(): string {
  return agentEntryTemplate("Codex");
}

function claudeEntryTemplate(): string {
  return agentEntryTemplate("Claude Code");
}

function agentEntryTemplate(agentName: string): string {
  return `# ${agentName} 项目入口\n\n## SDD 工作流\n\n- 复杂、多模块、高风险或长期复用任务，实施前先读 \`SDD_WORKFLOW.md\`。\n- 如果当前功能存在 \`specs/<feature-id>/\`，读取其中的 \`spec.md\`、\`plan.md\` 和 \`tasks.md\`。\n- 代码变更前先读共享工程规则：\`.specpower/standards/AGENTS.md\`。\n- 前端工作读取 \`.specpower/standards/frontend.md\`。\n- 后端工作读取 \`.specpower/standards/backend.md\`。\n- API 契约工作读取 \`.specpower/standards/api-contract.md\`。\n- 测试或验证相关变更读取 \`.specpower/standards/testing.md\`。\n- 命中具体子目录或模块时，继续读取最近的本地规则，如 \`AGENTS.md\`、README、CONTRIBUTING 或 docs 索引。\n- 不要把聊天历史当作 SDD 产物的替代品。\n\n## 安全规则\n\n- 保护用户和协作者的无关改动。\n- 未经明确确认，不执行破坏性操作。\n- 涉及数据库、权限、安全、生产环境、外部系统、批量数据或不可逆工作时，先写明风险和回滚方式再实施。\n- 代码变更后运行匹配验证，并说明任何跳过的检查。\n`;
}

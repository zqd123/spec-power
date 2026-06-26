# SpecPower CLI 接入方案（Codex + Claude）

## 1. 目标

本方案设计一个轻量 CLI，用于把 `SpecPower` 优雅接入任意项目，第一阶段优先支持 Codex 和 Claude Code。CLI 的职责是把团队 SDD 基线同步到项目内，生成对应 Agent 入口文件，并提供结构校验和升级检查。

核心目标：

- 用一条命令完成项目初始化。
- 项目本地保留覆盖能力，不被团队基线强制覆盖。
- 同一套 SDD 产物同时服务 Codex 和 Claude。
- 后续可扩展 Cursor、Copilot 或其他 Agent。
- CLI 默认非破坏性，任何覆盖或删除都需要显式确认。

## 2. 命令设计

推荐 CLI 名称为 `spec-power`，保留短别名 `power`。

### 2.1 `spec-power init`

用于在项目中首次接入团队 SDD。

```bash
spec-power init \
  --source git@github.com:your-org/SpecPower.git \
  --agents codex,claude \
  --profile multi-module \
  --mode copy
```

参数说明：

- `--source`: SpecPower 来源，可是 Git URL、本地路径或压缩包。
- `--agents`: 要生成的 Agent 入口，第一阶段支持 `codex`、`claude`。
- `--profile`: 项目类型，例如 `backend-service`、`frontend-app`、`multi-module`、`multi-repo-platform`。
- `--mode`: 接入方式，第一阶段推荐 `copy`。
- `--force`: 允许覆盖已存在的 CLI 管理文件，默认关闭。
- `--dry-run`: 只展示将要创建或修改的文件，不落盘。

默认行为：

- 创建 `.specpower/`、`specs/` 等 SDD 目录。
- 同步团队基线文档和模板。
- 生成 Codex 的 `AGENTS.md`。
- 生成 Claude 的 `CLAUDE.md`。
- 生成 `.specpower/upstream.lock`，记录来源版本和同步清单。
- 不覆盖已有 README、业务文档、代码、配置或 CI。

### 2.2 `spec-power sync`

用于从 SpecPower 同步新版本模板和基线规则。

```bash
spec-power sync --check
spec-power sync --apply
```

参数说明：

- `--check`: 只检查本地与上游差异。
- `--apply`: 应用可安全合并的更新。
- `--agents codex,claude`: 只同步指定 Agent 入口。
- `--dry-run`: 展示 diff，不写文件。
- `--force`: 强制覆盖 CLI 管理文件，默认关闭。

同步原则：

- 团队基线文件可同步。
- 项目 override 文件只提示差异，不自动覆盖。
- 用户手改过的受管文件进入冲突状态，需要人工确认。
- 不删除项目本地新增规格、任务、代码或业务文档。

### 2.3 `spec-power check`

用于校验项目是否正确接入 SDD。

```bash
spec-power check
```

检查项：

- `SDD_WORKFLOW.md` 是否存在。
- `.specpower/constitution.md` 是否存在。
- `.specpower/templates/` 是否存在。
- `specs/` 是否存在。
- 启用 Codex 时 `AGENTS.md` 是否存在并引用 SDD 入口。
- 启用 Claude 时 `CLAUDE.md` 是否存在并引用 SDD 入口。
- `specs/<feature-id>/` 下的 `spec.md`、`plan.md`、`tasks.md` 是否结构完整。

### 2.4 `spec-power doctor`

用于诊断环境和工具链。

```bash
spec-power doctor
```

检查项：

- Git 是否可用。
- 当前目录是否是 Git 仓库。
- 是否存在未提交变更。
- 是否安装 Spec Kit CLI。
- Codex 或 Claude 入口文件是否可被 Agent 识别。
- 是否存在不应提交的本地缓存或密钥文件。

### 2.5 `spec-power new`

用于创建一个新需求规格目录。

```bash
spec-power new smart-table-import --type feature --modules ai-integration-platform
```

默认生成：

```text
specs/001-smart-table-import/
├── spec.md
├── plan.md
└── tasks.md
```

生成规则：

- 自动编号，避免目录冲突。
- 使用项目本地模板优先，其次使用团队基线模板。
- 在 `spec.md` 中预填项目、模块、Agent 和验证字段。

## 3. 项目接入目录

CLI 初始化后推荐生成以下结构：

```text
.
├── SDD_WORKFLOW.md
├── SDD_IMPLEMENTATION_STEPS.md
├── TEAM_SDD_AGENT_WORKFLOW.md
├── .specpower/
│   ├── upstream.lock
│   ├── constitution.md
│   ├── templates/
│   │   ├── spec-template.md
│   │   ├── plan-template.md
│   │   ├── tasks-template.md
│   │   └── review-checklist.md
│   └── adapters/
│       ├── codex.md
│       └── claude.md
├── specs/
│   └── <feature-id>/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
├── AGENTS.md
└── CLAUDE.md
```

说明：

- `SDD_WORKFLOW.md`: 项目内可读的 SDD 流程说明。
- `SDD_IMPLEMENTATION_STEPS.md`: 项目落地步骤。
- `TEAM_SDD_AGENT_WORKFLOW.md`: 跨项目、跨 Agent 的团队方案。
- `.specpower/upstream.lock`: 记录 SpecPower 来源、版本、文件哈希和启用 Agent。
- `.specpower/constitution.md`: 团队基线原则加项目本地覆盖。
- `.specpower/templates/`: 项目本地模板，允许按项目覆盖。
- `.specpower/adapters/`: CLI 生成 Agent 入口时使用的片段。
- `AGENTS.md`: Codex 入口。
- `CLAUDE.md`: Claude Code 入口。

## 4. Codex 适配

CLI 生成或更新根目录 `AGENTS.md`。如果项目已经有 `AGENTS.md`，默认不覆盖，而是在 dry-run 中提示需要合并；用户可选择 `--merge` 或手动合并。

推荐内容结构：

```md
# Codex 项目入口

## SDD 工作流

- 复杂、多模块、高风险或长期复用任务必须先读取 `SDD_WORKFLOW.md`。
- 当前需求如已有 `specs/<feature-id>/`，必须读取 `spec.md`、`plan.md`、`tasks.md`。
- 命中具体模块时，继续读取该模块最近的 `AGENTS.md`、README、docs 索引和验证命令。
- 不把聊天记录替代 SDD 产物。

## 工作底线

- 保护用户和并行改动，不回滚、不覆盖无关变化。
- 涉及数据库、权限、安全、生产、外部系统、批量数据或不可逆操作时，先写计划和风险说明。
- 代码改动后运行匹配验证；未验证必须说明原因。
```

Codex 适配规则：

- 根目录 `AGENTS.md` 只做统一入口，不复制所有团队模板正文。
- 子目录可继续拥有自己的 `AGENTS.md`，用于本地覆盖。
- Codex 执行任务时按“用户当前要求 > 最近项目规则 > SDD 当前 feature > 团队基线”顺序读取。

## 5. Claude 适配

CLI 生成或更新根目录 `CLAUDE.md`。如果项目已有 `CLAUDE.md`，默认不覆盖，只提示合并。

推荐内容结构：

```md
# Claude Code 项目入口

## SDD 工作流

Before implementation, read:

1. `SDD_WORKFLOW.md`
2. Current feature files under `specs/<feature-id>/`
3. Project or module local rules
4. Directly related source code and tests

For complex or risky work, do not implement before the spec and plan are clear.

## Safety

- Do not overwrite unrelated changes.
- Do not perform destructive operations without explicit confirmation.
- Do not claim validation passed unless commands actually ran.
```

Claude 适配规则：

- `CLAUDE.md` 使用简洁英文或中英混合均可，视团队 Claude 使用习惯决定。
- 对 Claude Code，应强调 planning、todo、test 和 review 步骤。
- 与 Codex 一样，Claude 入口只引用 SDD 文件，不复制全部流程正文。

## 6. Playbook 来源和升级策略

### 6.1 推荐来源

团队内部维护一个 `SpecPower` 仓库，CLI 从该仓库同步文件。

推荐版本方式：

- 使用 Git tag，例如 `v0.1.0`、`v0.2.0`。
- `upstream.lock` 记录 tag、commit、文件哈希和 profile。
- 项目升级时先 `sync --check`，再人工确认 `sync --apply`。

### 6.2 `upstream.lock` 示例

```yaml
source: git@github.com:your-org/SpecPower.git
version: v0.1.0
commit: abcdef123456
profile: multi-module
agents:
  - codex
  - claude
managed_files:
  - SDD_WORKFLOW.md
  - SDD_IMPLEMENTATION_STEPS.md
  - TEAM_SDD_AGENT_WORKFLOW.md
  - .specpower/templates/spec-template.md
  - .specpower/templates/plan-template.md
  - .specpower/templates/tasks-template.md
  - .specpower/adapters/codex.md
  - .specpower/adapters/claude.md
```

### 6.3 冲突处理

CLI 对文件分三类处理：

- managed: CLI 可同步，但用户改动后需要三方合并。
- override: 项目本地覆盖，CLI 不自动改。
- local: 项目私有文件，CLI 只读检查，不修改。

推荐分类：

| 文件 | 类型 | 行为 |
| --- | --- | --- |
| `SDD_WORKFLOW.md` | managed | 可同步，冲突需确认 |
| `SDD_IMPLEMENTATION_STEPS.md` | managed | 可同步，冲突需确认 |
| `TEAM_SDD_AGENT_WORKFLOW.md` | managed | 可同步，冲突需确认 |
| `.specpower/templates/*` | override | 初始化后项目可改，后续只提示差异 |
| `.specpower/constitution.md` | override | 项目本地维护 |
| `AGENTS.md` | local/merge | 默认不覆盖，只生成建议片段 |
| `CLAUDE.md` | local/merge | 默认不覆盖，只生成建议片段 |
| `specs/**` | local | 永不覆盖 |

## 7. CLI 实现建议

第一阶段建议用 Node.js 或 Python 实现，优先选择团队更熟悉的运行时。功能保持小而稳。

### 7.1 MVP 功能

- `init`
- `sync --check`
- `check`
- `doctor`
- `new`

暂不做复杂功能：

- 不自动创建 PR。
- 不自动安装 Codex 或 Claude。
- 不自动执行 Spec Kit 初始化的破坏性覆盖。
- 不自动修改 CI。
- 不自动提交 Git。

### 7.2 核心实现模块

```text
cli/
├── commands/
│   ├── init.*
│   ├── sync.*
│   ├── check.*
│   ├── doctor.*
│   └── new.*
├── core/
│   ├── source-resolver.*
│   ├── file-sync.*
│   ├── lockfile.*
│   ├── template-renderer.*
│   └── project-detector.*
└── adapters/
    ├── codex.*
    └── claude.*
```

模块职责：

- `source-resolver`: 拉取 Git、本地路径或压缩包来源。
- `file-sync`: 计算新增、更新、冲突、跳过。
- `lockfile`: 读写 `.specpower/upstream.lock`。
- `template-renderer`: 根据 profile 和 agents 渲染模板。
- `project-detector`: 识别项目类型和已有 Agent 入口。
- `codex` / `claude`: 生成入口文件或合并片段。

## 8. 初始化流程细节

`spec-power init` 建议按以下顺序执行：

1. 检查当前目录是否为 Git 仓库。
2. 读取 `git status --short`，若有改动则提示但不阻塞。
3. 解析 `--source`，获取 SpecPower 文件。
4. 识别项目类型或使用 `--profile`。
5. 生成待写入文件清单。
6. 检查冲突：

   - 文件不存在：可创建。
   - 文件存在且非 CLI 管理：默认跳过并提示。
   - 文件存在且由 CLI 管理：可更新。

7. 如果是 `--dry-run`，只输出计划。
8. 写入 SDD 文件、模板和 adapter 片段。
9. 生成或提示合并 `AGENTS.md`、`CLAUDE.md`。
10. 写入 `.specpower/upstream.lock`。
11. 运行内置 `check`。
12. 输出下一步建议，例如创建 smoke spec。

## 9. 校验规则

`spec-power check` 第一阶段可做静态检查：

- 根目录有 `SDD_WORKFLOW.md`。
- 根目录有 `SDD_IMPLEMENTATION_STEPS.md`。
- 存在 `.specpower/upstream.lock`。
- 存在 `.specpower/constitution.md`。
- 存在 `.specpower/templates/spec-template.md`、`plan-template.md`、`tasks-template.md`。
- 启用 Codex 时存在 `AGENTS.md`，且包含 `SDD_WORKFLOW.md` 和 `specs/`。
- 启用 Claude 时存在 `CLAUDE.md`，且包含 `SDD_WORKFLOW.md` 和 `specs/`。
- 存在 `specs/`。
- 如果存在 `specs/<feature-id>/`，检查 `spec.md`、`plan.md`、`tasks.md` 是否完整。

检查结果分级：

- error: 缺少必需文件，流程不可用。
- warning: 建议补充，但不阻塞。
- info: 当前状态说明。

## 10. 安全策略

CLI 默认遵守以下安全策略：

- 默认不覆盖已有文件。
- 默认不删除文件。
- 默认不执行 Git add、commit、push。
- 默认不执行数据库、构建、测试或外部系统命令。
- 默认不安装 Codex、Claude 或 Spec Kit。
- 写入前支持 `--dry-run`。
- 所有覆盖必须通过 `--force` 或交互确认。
- 对密钥、token、`.env`、本地缓存目录做提交前提示。

## 11. 团队推广路径

1. 先在 1 个后端项目和 1 个前端项目试点。
2. MVP CLI 只提供 `init`、`check`、`new`。
3. 试点稳定后加入 `sync --check` 和 `sync --apply`。
4. 再逐步接入 PR 模板和轻量 CI。
5. 最后扩展 Cursor、Copilot 和通用 Agent 适配。

## 12. 示例命令

新项目首次接入：

```bash
spec-power init \
  --source git@github.com:your-org/SpecPower.git \
  --agents codex,claude \
  --profile backend-service \
  --dry-run
```

确认无风险后应用：

```bash
spec-power init \
  --source git@github.com:your-org/SpecPower.git \
  --agents codex,claude \
  --profile backend-service
```

创建新需求：

```bash
spec-power new smart-table-import --type feature --modules ai-integration-platform
```

升级团队基线：

```bash
spec-power sync --check
spec-power sync --apply
```

检查项目接入状态：

```bash
spec-power check
spec-power doctor
```

## 13. 完成标准

第一阶段完成后应满足：

- CLI 能从 `SpecPower` 初始化项目。
- CLI 能生成 Codex 的 `AGENTS.md` 建议入口。
- CLI 能生成 Claude 的 `CLAUDE.md` 建议入口。
- CLI 能创建 `specs/<feature-id>/spec.md`、`plan.md`、`tasks.md`。
- CLI 能检查 SDD 接入完整性。
- CLI 默认不覆盖、不删除、不提交、不执行外部副作用命令。


# SpecPower CLI 实施计划

## 1. 目标

本项目实现一个轻量 CLI，用于在任意项目中快速接入团队 SDD 流程，并生成 Codex 与 Claude Code 的项目入口文件。

首版定位为“初始化优先”：

- 完整实现 `init`、`new`、`check`。
- 提供只读诊断型 `doctor`。
- 保留 `sync` 命令入口，但内置模板模式下不做复杂上游同步。
- 默认不覆盖、不删除、不提交、不安装外部工具。

CLI 命令名为 `spec-power`，同时提供短别名 `power`。

## 2. 技术方案

- 运行时：Node.js。
- 语言：TypeScript。
- CLI 框架：Commander。
- 测试：Vitest。
- 模板策略：首版只使用内置模板，不支持 `--source` 外部模板仓库。
- 文件策略：写入前先规划，默认跳过已有文件；`--force` 才允许覆盖 CLI 生成文件。

## 3. 首版命令

### `spec-power init`

用于在当前目录初始化 SDD 接入结构。

支持参数：

- `--agents codex,claude`：默认同时生成 Codex 和 Claude 入口。
- `--profile <name>`：支持 `backend-service`、`frontend-app`、`multi-module`、`multi-repo-platform`。
- `--dry-run`：只展示将要写入、跳过或覆盖的文件。
- `--force`：允许覆盖已有目标文件。

生成内容：

- `SDD_WORKFLOW.md`
- `SDD_IMPLEMENTATION_STEPS.md`
- `TEAM_SDD_AGENT_WORKFLOW.md`
- `.specpower/upstream.lock`
- `.specpower/constitution.md`
- `.specpower/templates/spec-template.md`
- `.specpower/templates/plan-template.md`
- `.specpower/templates/tasks-template.md`
- `.specpower/templates/review-checklist.md`
- `.specpower/adapters/codex.md`
- `.specpower/adapters/claude.md`
- `specs/.gitkeep`
- `AGENTS.md` 或 `CLAUDE.md`

### `spec-power new <slug>`

用于创建一个新的需求规格目录。

支持参数：

- `--type feature|bugfix|chore`：默认 `feature`。
- `--modules <csv>`：预填影响模块。
- `--agent codex|claude|both`：默认 `both`。

生成内容：

```text
specs/NNN-<slug>/
├── spec.md
├── plan.md
└── tasks.md
```

### `spec-power check`

用于静态检查项目接入状态。

检查项：

- SDD 文档是否存在。
- `.specpower`、模板和 lockfile 是否存在。
- `specs/` 是否存在。
- 启用 Codex 时 `AGENTS.md` 是否引用 `SDD_WORKFLOW.md` 和 `specs/`。
- 启用 Claude 时 `CLAUDE.md` 是否引用 `SDD_WORKFLOW.md` 和 `specs/`。
- 已存在的 `specs/NNN-*` 是否包含 `spec.md`、`plan.md`、`tasks.md`。

### `spec-power doctor`

用于环境诊断，只读检查：

- Git 是否可用。
- 当前目录是否 Git 仓库。
- 是否有未提交变更。
- `specify` 是否可用。
- 是否存在 Agent 入口文件。
- 是否存在 `.env` 等需要谨慎提交的文件。

### `spec-power sync`

首版只支持内置模板版本检查。

- `sync --check`：比较 lockfile 中记录的模板版本和当前 CLI 内置模板版本。
- `sync --apply`：提示首版不支持自动同步外部模板。

## 4. 安全约束

- 默认不覆盖已有文件。
- 默认不删除文件。
- 默认不运行 `git add`、`git commit`、`git push`。
- 默认不安装 Spec Kit、Superpowers、Codex 或 Claude。
- 默认不运行数据库、构建、测试或外部系统命令。
- `--dry-run` 必须不产生任何文件写入。
- `specs/**` 属于项目本地事实源，CLI 不覆盖已有规格。

## 5. 验证计划

实现完成后运行：

```bash
npm run typecheck
npm test
npm run build
node dist/cli.js init --dry-run
```

关键测试场景：

- 空目录执行 `init` 生成完整结构。
- 已存在 `AGENTS.md` 时默认跳过，不覆盖。
- `init --dry-run` 不写任何文件。
- `new smart-table-import` 创建 `specs/001-smart-table-import`。
- 已有编号目录时，新需求自动使用下一个编号。
- `check` 对完整项目返回成功，对缺失关键文件返回失败。


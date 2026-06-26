# SpecPower CLI

`spec-power` 是一个轻量 CLI，用于在任意项目中接入面向 Spec Kit 和 Superpowers 工作方式的 SDD（Specification-Driven Development，规范驱动开发）流程。

它会生成项目本地的 SDD 文档、模板，以及 Codex 和 Claude Code 的 Agent 入口文件。CLI 默认保持保守：不删除文件、不自动提交、不自动安装外部工具。

## 安装与构建

```bash
npm install
npm run build
```

本地开发时，可以直接运行构建后的 CLI：

```bash
node dist/cli.js --help
```

## 常用命令

```bash
spec-power init codex
spec-power init claude
spec-power init --agents codex,claude --profile multi-module
spec-power new smart-table-import --type feature --modules api,web
spec-power check
spec-power doctor
spec-power sync --check
```

作为 npm 包安装后，也可以使用短别名 `power`。

## 命令说明

- `init [agents...]`：在当前项目生成 SDD 工作流文档、模板、`.specpower/upstream.lock` 和指定 Agent 入口；例如 `spec-power init codex` 只生成 Codex 入口，`spec-power init claude` 只生成 Claude 入口。
- `new <slug>`：创建 `specs/NNN-<slug>/spec.md`、`plan.md`、`tasks.md`。
- `check`：检查项目是否已正确接入 SpecPower。
- `doctor`：只读诊断 Git、Spec Kit CLI、Agent 入口和本地敏感文件提示。
- `sync --check`：检查当前 lockfile 记录的内置模板版本。

## 安全默认值

- 已存在文件默认跳过，除非显式传入 `--force`。
- `--dry-run` 只展示写入计划，不改动文件系统。
- `specs/**` 下已有规格不会被覆盖。
- 不自动安装 Spec Kit、Superpowers、Codex 或 Claude；生成的文档只说明推荐接入方式。
- 不执行 `git add`、`git commit`、`git push`。

## 设计文档

原始 SDD 和 CLI 接入方案已归档在 [`docs/`](./docs/)。

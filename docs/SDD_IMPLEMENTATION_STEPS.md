# SDD 集成详细实施步骤

本文档基于 `SDD_WORKFLOW.md`，用于指导在根仓库落地 Spec Kit + Superpowers 的统一研发流程。执行目标是先建立根级 SDD 工作入口，再用一个 smoke spec 验证流程可用；不在子模块内重复初始化完整 Spec Kit。

## 1. 前置确认

1. 确认当前位于根仓库：

   ```bash
   pwd
   git status --short --branch
   git submodule status
   ```

2. 识别并记录已有未提交改动：

   ```bash
   git status --short
   git submodule foreach 'git status --short --branch'
   ```

   要求：

   - 不覆盖、不回滚、不清理用户或其他 agent 的无关改动。
   - 如果某个子模块已有无关改动，只记录状态；不要把它混入本次 SDD 流程提交。
   - 如需更新子模块基线，先确认目标分支、影响范围和是否会移动根仓库子模块指针。

3. 确认根目录已有流程文档：

   ```bash
   test -f SDD_WORKFLOW.md
   rg "Spec Kit|Superpowers|SDD|子模块|AGENTS|验证|提交" SDD_WORKFLOW.md
   ```

## 2. 安装或确认工具

1. 确认 Spec Kit CLI 是否可用：

   ```bash
   specify --help
   ```

2. 如果命令不存在，按 Spec Kit 官方仓库说明安装：

   ```bash
   uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
   ```

   如果本机没有 `uv`，先安装 `uv` 或采用团队认可的 Python 工具安装方式。安装工具属于本机环境动作，不应提交任何本地缓存或工具目录。

3. 确认 Codex 中可使用 Superpowers：

   - 在 Codex App 或 Codex CLI 的插件市场安装 Superpowers。
   - 仓库只记录 Superpowers 使用约定，不提交插件安装产物。
   - 如果团队暂未统一安装 Superpowers，仍可先落地 Spec Kit；Superpowers 作为开发节奏补充，不阻塞根级 SDD 目录建立。

## 3. 初始化根级 Spec Kit

1. 在根目录执行初始化：

   ```bash
   specify init --here --integration codex --integration-options="--skills" --ignore-agent-tools
   ```

2. 初始化完成后检查新增结构：

   ```bash
   find .specify specs -maxdepth 3 -type f | sort
   git status --short
   ```

3. 如果初始化命令因为非空目录或已有文件失败：

   - 先查看失败信息和已存在文件。
   - 不直接覆盖现有文件。
   - 若确需使用 `--force`，先确认会覆盖的精确路径、备份方式和回滚方式。

4. 初始化后不得在子模块内再执行同样的完整初始化，除非后续有明确的子项目独立 SDD 治理需求。

## 4. 编写根级 Constitution

1. 打开并维护根级宪法文件：

   ```bash
   ${EDITOR:-vi} .specify/memory/constitution.md
   ```

2. Constitution 必须至少包含以下原则：

   - 根仓库是统一研发流程入口，子模块是具体实现和验证边界。
   - 需求必须先形成可评审、可验收的规格，再进入实现。
   - 命中子模块时必须读取最近的 `AGENTS.md`、README、docs 索引和验证命令。
   - 禁止删除、清空、重置、强制 Git、生产操作、不可逆迁移、批量改数据等破坏性操作，除非获得明确确认。
   - 数据库、权限、安全、部署、外部系统、MCP、Dify 等高风险变更必须先完成计划和风险说明。
   - 提交前分别检查根仓库和相关子模块 `git status`，只暂存当前任务相关文件。
   - 未运行的验证必须说明原因和剩余风险。

3. 写完后检查关键词覆盖：

   ```bash
   rg "子模块|AGENTS|破坏性|数据库|权限|安全|MCP|Dify|git status|验证" .specify/memory/constitution.md
   ```

## 5. 定制根级模板

1. 检查 Spec Kit 默认模板位置：

   ```bash
   find .specify -maxdepth 4 -type f | sort
   ```

2. 在 `.specify/templates/overrides/` 中维护根级模板覆盖。推荐至少覆盖：

   - `spec-template.md`
   - `plan-template.md`
   - `tasks-template.md`

3. `spec-template.md` 必须要求填写：

   - 需求背景和用户目标。
   - 涉及子模块。
   - 用户场景和验收标准。
   - 非目标和不做范围。
   - 权限、租户、数据安全、外部系统影响。
   - 关联既有文档或决策记录。

4. `plan-template.md` 必须要求填写：

   - 按子模块拆分的实现策略。
   - API、DTO、数据库、前端、MCP、Dify、配置或脚本影响。
   - 兼容性、回滚和迁移策略。
   - 验证命令和不可验证路径。
   - 提交边界：子模块提交、根仓库指针提交、文档提交。

5. `tasks-template.md` 必须要求填写：

   - 每项任务的目标仓库或子模块。
   - 测试优先或验收优先任务。
   - 实现任务。
   - 文档和索引更新任务。
   - 代码审查、验证和交付任务。

6. 模板完成后运行：

   ```bash
   rg "子模块|验收|权限|租户|MCP|Dify|验证|提交边界" .specify/templates
   ```

## 6. 建立 Smoke Spec

1. 创建一个只验证流程、不修改业务代码的试点规格：

   ```bash
   mkdir -p specs/001-root-sdd-smoke
   ```

2. 生成或编写 `specs/001-root-sdd-smoke/spec.md`，内容聚焦：

   - 根目录作为统一 SDD 入口。
   - 子模块规则继承。
   - 单子项目需求和跨子项目需求如何流转。
   - 不修改业务代码、不执行数据库操作、不触发外部系统写入。

3. 生成或编写 `specs/001-root-sdd-smoke/plan.md`，内容聚焦：

   - 只检查目录结构、模板字段和关键规则。
   - 不涉及 Java、前端、数据库或部署实现。
   - 验证命令为 `find`、`rg`、`git status`。

4. 生成或编写 `specs/001-root-sdd-smoke/tasks.md`，至少包含：

   - 检查 `.specify/`、`specs/` 文件结构。
   - 检查 constitution 和模板关键字。
   - 检查 smoke spec 能区分根仓库和子模块边界。
   - 检查提交前状态，确认不混入无关子模块改动。

## 7. 试运行 SDD 流程

1. 如果 Spec Kit 提供对应命令或 Codex skills，按顺序试运行：

   ```bash
   specify check
   ```

   若当前版本没有 `check` 命令，则用以下轻量检查替代：

   ```bash
   find .specify specs -maxdepth 4 -type f | sort
   rg "子模块|AGENTS|破坏性|验证|提交" .specify specs SDD_WORKFLOW.md SDD_IMPLEMENTATION_STEPS.md
   ```

2. 如果使用 Codex skills，按以下顺序试跑 smoke spec：

   - `$speckit-specify`
   - `$speckit-clarify`
   - `$speckit-plan`
   - `$speckit-tasks`
   - `$speckit-analyze`

3. 试运行只允许修改根级 SDD 文件，不允许修改业务代码、数据库脚本或子模块文件。

## 8. 首个真实需求落地

1. 新需求进入时，先判断类型：

   - 只影响一个子模块：创建根级 `specs/<feature-id>/`，标明目标子模块。
   - 影响多个子模块：创建一个根级跨模块 spec，plan/tasks 按子模块拆分。
   - 涉及数据库、安全、权限、部署、MCP、Dify 或外部系统：标记为高风险需求。

2. 写规格前读取：

   - 根目录 `README.md`
   - `SDD_WORKFLOW.md`
   - `SDD_IMPLEMENTATION_STEPS.md`
   - 命中子模块最近的 `AGENTS.md`
   - 命中子模块 README、docs 索引或相关需求文档

3. 规格评审通过后再进入计划和任务拆分。

4. 实现时进入对应子模块，按子模块规则执行：

   - 后端 Java 模块按 Maven 命令验证。
   - 前端模块按 npm/yarn 命令验证。
   - 数据库脚本默认只归档和静态检查。
   - MCP/Dify 相关改动必须保持业务服务边界，不绕过平台服务 API 直接写库。

## 9. 验证清单

根级流程文件验证：

```bash
test -f SDD_WORKFLOW.md
test -f SDD_IMPLEMENTATION_STEPS.md
find .specify specs -maxdepth 4 -type f | sort
rg "Spec Kit|Superpowers|SDD|子模块|AGENTS|验证|提交" SDD_WORKFLOW.md SDD_IMPLEMENTATION_STEPS.md
```

子模块状态验证：

```bash
git status --short --branch
git submodule status
git submodule foreach 'git status --short --branch'
```

业务实现验证按命中的子模块执行。示例：

```bash
cd ai-integration-platform
mvn -s ./settings.xml -pl ai-modeling-service -am test
```

```bash
cd data-mid-platform-ds-ui
npm run lint
npm run build
```

## 10. 提交步骤

1. 提交前检查根仓库状态：

   ```bash
   git status --short --branch
   ```

2. 只暂存根级 SDD 文件：

   ```bash
   git add SDD_WORKFLOW.md SDD_IMPLEMENTATION_STEPS.md .specify specs
   ```

   如果 `.specify` 或 `specs` 尚未初始化，不要暂存不存在的路径。

3. 再次检查暂存内容：

   ```bash
   git status --short
   git diff --cached --stat
   git diff --cached -- SDD_WORKFLOW.md SDD_IMPLEMENTATION_STEPS.md
   ```

4. 提交根级流程变更：

   ```bash
   git commit -m "docs: add SDD workflow implementation steps"
   ```

5. 只有在本次确实需要固定子模块新提交时，才提交子模块指针变化。否则不要把子模块状态变更混入根级流程提交。

## 11. 完成标准

落地完成应满足：

- 根目录存在 `SDD_WORKFLOW.md` 和 `SDD_IMPLEMENTATION_STEPS.md`。
- 根目录存在一套 `.specify/` 和 `specs/`，子模块没有重复初始化完整 Spec Kit。
- 根级 constitution 明确子模块规则继承、高风险操作、提交边界和验证要求。
- 根级模板要求声明涉及子模块、验收标准、风险、验证命令和提交边界。
- smoke spec 能通过轻量检查。
- 本次提交不包含无关子模块改动。


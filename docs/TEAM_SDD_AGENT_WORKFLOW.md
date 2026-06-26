# 跨项目跨 Agent 的团队 SDD 研发流程方案

## 1. 目标

本方案用于把单项目的 SDD（Specification-Driven Development，规范驱动开发）实践升级为团队级研发流程，使不同项目、不同技术栈、不同 AI Agent 工具都能遵循同一套需求、计划、任务、验证和交付标准。

核心目标：

- 让复杂需求先形成可评审、可验收、可追踪的规格，再进入实现。
- 让跨项目需求有统一入口，避免规格散落在多个仓库或多个 Agent 会话中。
- 让 Codex、Claude Code、Cursor、GitHub Copilot 和其他 AI Agent 都能读取同一套中立流程。
- 让项目保留自身工程规则，不被团队流程强行覆盖技术细节。
- 通过 PR 模板、检查清单和轻量 CI，把流程从文档约定变成团队习惯。

## 2. 设计原则

### 2.1 规范产物中立

团队统一沉淀的是产物，而不是绑定某个工具：

- `spec.md`: 描述要解决什么问题、用户场景、验收标准和非目标。
- `plan.md`: 描述如何实现、影响哪些模块、接口/数据/权限/兼容性风险是什么。
- `tasks.md`: 描述任务拆分、执行顺序、验证命令和交付边界。
- `review-checklist.md`: 描述评审时必须检查的风险、测试和上线条件。

任何 Agent 工具都必须围绕这些产物工作，而不是把工具自己的聊天记录当作唯一需求来源。

### 2.2 工具适配分层

团队标准分为两层：

- 核心流程层：SDD 产物、模板、宪法、评审清单，保持工具无关。
- Agent 适配层：把同一套核心流程翻译成不同工具的入口文件或规则文件。

推荐适配关系：

| 工具 | 推荐入口 |
| --- | --- |
| Codex | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursor/rules/*.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| 通用 Agent | `AI_AGENT.md` 或 `agent-contract.md` |

### 2.3 根流程统一，项目规则覆盖

团队流程负责统一研发顺序、产物格式、风险约束和交付标准。项目规则负责技术栈、代码风格、验证命令、目录结构、模块边界和发布方式。

当团队流程和项目规则冲突时，默认选择更安全、影响面更小、可验证、可回滚的方案；如果冲突会改变业务边界，必须先更新 `plan.md` 或记录决策。

## 3. 推荐团队流程仓库

建议建立独立团队流程仓库，例如 `SpecPower`：

```text
SpecPower/
├── README.md
├── SDD_WORKFLOW.md
├── SDD_IMPLEMENTATION_STEPS.md
├── constitution-template.md
├── templates/
│   ├── spec-template.md
│   ├── plan-template.md
│   ├── tasks-template.md
│   └── review-checklist.md
├── adapters/
│   ├── codex/
│   │   └── AGENTS.md
│   ├── claude/
│   │   └── CLAUDE.md
│   ├── cursor/
│   │   └── rules.md
│   ├── copilot/
│   │   └── copilot-instructions.md
│   └── generic-ai/
│       └── agent-contract.md
└── examples/
    ├── backend-service/
    ├── frontend-app/
    └── multi-repo-platform/
```

职责划分：

- `constitution-template.md`: 团队不可违反的研发原则。
- `templates/`: 工具无关的 SDD 产物模板。
- `adapters/`: 面向不同 Agent 工具的规则入口。
- `examples/`: 不同项目类型的落地样例。

## 4. 单项目接入结构

每个项目接入团队流程时，推荐在项目根目录保留最小结构：

```text
.
├── SDD_WORKFLOW.md
├── SDD_IMPLEMENTATION_STEPS.md
├── .specpower/
│   ├── constitution.md
│   ├── templates/
│   └── upstream.lock
├── specs/
│   └── <feature-id>/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
├── AGENTS.md
├── CLAUDE.md
├── .cursor/
│   └── rules/
└── .github/
    └── copilot-instructions.md
```

接入原则：

- 项目可以只选择实际使用的 Agent 入口文件，不必一次性接入所有工具。
- `specs/` 是项目需求事实源，不依赖某个 Agent 的上下文。
- 项目已有 README、CONTRIBUTING、docs、CI 和测试规则继续生效。
- 多模块或多子项目仓库可在根目录维护统一 `specs/`，各子项目保留自身规则。

## 5. AI Agent 通用契约

所有 Agent 工具都应遵守以下契约。

### 5.1 开始前必须读取

1. 用户当前需求。
2. 团队或项目根目录的 `SDD_WORKFLOW.md`。
3. 当前 feature 的 `spec.md`、`plan.md`、`tasks.md`。
4. 命中模块最近的项目规则文件，例如 `AGENTS.md`、`CLAUDE.md`、README、CONTRIBUTING 或 docs 索引。
5. 直接相关代码、测试、接口、数据库脚本或配置。

### 5.2 必须遵守

- 复杂需求先补齐规格和计划，再实现。
- 保护用户和并行开发者的无关改动。
- 只修改当前任务相关文件。
- 涉及数据库、权限、安全、外部系统、生产环境、批量数据或不可逆操作时，先写清风险和回滚。
- 验证失败要说明失败原因，不把未验证说成已验证。
- 提交前检查工作区状态和暂存内容。

### 5.3 默认禁止

- 跳过规格直接实现复杂或高风险需求。
- 删除、清空、重置、覆盖、强制 Git、改写历史。
- 执行生产操作、不可逆迁移、批量修改真实数据。
- 将密钥、token、敏感日志、未脱敏业务数据写入文档或提交。
- 把 Agent 聊天记录替代 `spec.md`、`plan.md`、`tasks.md`。

## 6. 标准研发流程

### 6.1 需求进入

1. 判断需求类型：

   - 简单局部修复：可直接记录简要验收标准后实现。
   - 中等功能或多文件变更：必须有 `spec.md` 和 `tasks.md`。
   - 跨模块、高风险或长期复用需求：必须有完整 `spec.md`、`plan.md`、`tasks.md`。

2. 明确需求所属范围：

   - 单项目需求。
   - 多模块需求。
   - 多仓库或跨团队需求。
   - 平台级流程、规范或基础设施需求。

3. 创建或更新 `specs/<feature-id>/spec.md`。

### 6.2 规格阶段

`spec.md` 必须说明：

- 背景和用户目标。
- 用户场景和主要流程。
- 可测试的验收标准。
- 非目标和不做范围。
- 涉及项目、模块、角色和外部系统。
- 权限、数据安全、租户隔离、兼容性或合规要求。

### 6.3 计划阶段

`plan.md` 必须说明：

- 总体实现策略。
- 影响的项目、模块、接口、数据库、配置、前端页面或任务调度。
- 新增或调整的公共 API、数据结构、事件、脚本或配置项。
- 失败模式、降级策略、回滚方式和兼容性处理。
- 验证命令、测试范围和不可验证风险。

### 6.4 任务阶段

`tasks.md` 必须说明：

- 每个任务的目标项目或模块。
- 测试优先或验收优先任务。
- 实现任务。
- 文档、迁移、配置和监控任务。
- Review、验证、提交和发布任务。

任务应能被单个工程师或 Agent 独立执行，不需要再做关键产品或技术决策。

### 6.5 实现阶段

实现时遵守项目本地规则：

- 后端项目按本地构建、测试、代码风格和数据库规则执行。
- 前端项目按本地 lint、test、build 和交互验证规则执行。
- 多仓库需求按仓库拆分提交，不混合无关改动。
- 高风险操作保持只读或 dry-run，除非已有明确确认。

### 6.6 Review 和收尾

合并前检查：

- 实现是否满足 `spec.md` 的验收标准。
- 改动是否符合 `plan.md` 的边界。
- `tasks.md` 是否标记完成并记录验证结果。
- 测试和构建是否运行。
- 是否有未说明的剩余风险。
- 是否混入无关文件、无关格式化或无关子模块指针。

## 7. 跨项目和跨仓库协作

跨项目需求推荐使用一个根级或团队级 spec 作为唯一需求源。

推荐结构：

```text
specs/<feature-id>/
├── spec.md
├── plan.md
├── tasks.md
├── decisions.md
└── validation.md
```

协作规则：

- `spec.md` 统一描述业务目标和验收标准。
- `plan.md` 按项目或仓库拆分实现边界。
- `tasks.md` 标注每项任务属于哪个仓库、哪个模块、由谁或哪个 Agent 执行。
- `decisions.md` 记录跨团队裁决，避免关键口径只存在聊天记录中。
- `validation.md` 汇总各项目的验证命令和结果。

如果一个需求需要多个仓库同时发版，计划中必须写清兼容窗口、灰度顺序、回滚顺序和旧版本兼容策略。

## 8. PR 和 CI 约束

为了让流程真正落地，建议加入轻量工程约束。

### 8.1 PR 模板

PR 模板至少包含：

```md
## Spec
- 关联规格: specs/<feature-id>/spec.md
- 关联计划: specs/<feature-id>/plan.md
- 关联任务: specs/<feature-id>/tasks.md

## 验收
- [ ] 验收标准已覆盖
- [ ] 风险和回滚已说明
- [ ] 验证命令已运行或说明未运行原因

## 影响范围
- [ ] API
- [ ] 数据库
- [ ] 权限/安全
- [ ] 前端
- [ ] 外部系统
- [ ] 文档/配置
```

### 8.2 CI 检查

可逐步增加轻量检查：

- 新增复杂功能 PR 必须引用 `specs/<feature-id>/`。
- `spec.md`、`plan.md`、`tasks.md` 必须存在。
- 文档中必须包含验收、验证、风险、回滚等关键词。
- 禁止提交密钥、token、私密日志和本地环境文件。

CI 不应一开始过度复杂。先检查结构和关键字段，再逐步增加项目级规则。

## 9. 推广路径

### 阶段一：试点

选择 2 到 3 类项目试点：

- 一个后端服务。
- 一个前端应用。
- 一个跨模块或多仓库需求。

目标是验证模板是否能覆盖真实研发过程，而不是追求一次性完美。

### 阶段二：模板化

把试点中稳定的内容抽到团队流程仓库：

- constitution 模板。
- spec、plan、tasks 模板。
- Agent 适配入口。
- PR 模板和 review checklist。
- 示例项目。

### 阶段三：项目接入

新项目默认从团队模板初始化；老项目按需增量接入：

- 先接入 `SDD_WORKFLOW.md` 和 `specs/`。
- 再接入项目本地 Agent 入口。
- 最后接入 PR 和 CI 约束。

### 阶段四：治理和迭代

每个迭代周期回顾：

- 哪些规格写得过重或过轻。
- 哪些任务仍需要二次决策。
- 哪些验证项经常遗漏。
- 哪些 Agent 入口规则需要统一。
- 哪些项目需要本地规则覆盖。

## 10. 落地检查清单

团队流程仓库：

- [ ] 有统一 `SDD_WORKFLOW.md`。
- [ ] 有统一 `SDD_IMPLEMENTATION_STEPS.md`。
- [ ] 有 constitution 模板。
- [ ] 有 spec、plan、tasks、review 模板。
- [ ] 有 Codex、Claude、Cursor、Copilot、通用 Agent 适配入口。
- [ ] 有至少一个后端、前端、跨项目示例。

单项目接入：

- [ ] 根目录有 SDD 流程说明。
- [ ] 根目录有 `specs/`。
- [ ] 项目规则文件说明如何继承团队 SDD。
- [ ] PR 模板要求关联 spec。
- [ ] 验证命令和提交边界清晰。

真实需求执行：

- [ ] 需求有 `spec.md`。
- [ ] 实现前有 `plan.md`。
- [ ] 执行前有 `tasks.md`。
- [ ] 高风险变更有风险、回滚和确认记录。
- [ ] 合并前有验证结果和剩余风险说明。

## 11. 参考

- Spec Kit: <https://github.com/github/spec-kit>
- Superpowers: <https://github.com/obra/superpowers>
- 项目内方案: `SDD_WORKFLOW.md`
- 项目内实施步骤: `SDD_IMPLEMENTATION_STEPS.md`


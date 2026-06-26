import type { PlannedFile } from "./file-plan.js";

export function renderHarnessStandardFiles(): PlannedFile[] {
  return [
    {
      path: ".specpower/standards/AGENTS.md",
      kind: "override",
      content: sharedAgentRulesTemplate()
    },
    {
      path: ".specpower/standards/api-contract.md",
      kind: "override",
      content: apiContractStandardTemplate()
    },
    {
      path: ".specpower/standards/backend.md",
      kind: "override",
      content: backendStandardTemplate()
    },
    {
      path: ".specpower/standards/frontend.md",
      kind: "override",
      content: frontendStandardTemplate()
    },
    {
      path: ".specpower/standards/testing.md",
      kind: "override",
      content: testingStandardTemplate()
    }
  ];
}

function sharedAgentRulesTemplate(): string {
  return `# SpecPower 共享 Agent 规则

## 适用范围

- 本文件是 SpecPower 初始化到业务仓库的共享规则入口。
- 本文件刻意保持精简，只保留 Spec Kit 和 Superpowers 工作方式会用到的规则。
- 详细工程标准位于同目录下的 \`.specpower/standards/*.md\`。
- 项目特有例外应写在仓库根目录 \`AGENTS.md\` 或距离任务最近的本地规则文件中。

## 必读内容

- 阅读 \`SDD_WORKFLOW.md\` 了解 SDD 流程。
- 如果存在当前任务对应的 \`specs/<feature-id>/\`，阅读其中的规格、计划和任务文件。
- 涉及前端、后端、API 契约或测试变更前，阅读对应的标准文件。

## 执行规则

- 复杂或高风险工作必须先明确 spec 和 plan，再开始实现。
- 不覆盖用户或其他协作者的无关改动。
- 每次实现都应限定在当前 spec 和 task 范围内。
- 代码变更后运行匹配验证；未运行或跳过的检查必须如实说明。
- 破坏性或不可逆操作必须先获得明确确认。

## 例外说明格式

- 原因
- 范围
- 过期条件
`;
}

function apiContractStandardTemplate(): string {
  return `# API 契约标准

## 适用范围

适用于前后端之间的 HTTP/RPC API 请求和响应契约。

## 强制规则

- 新增接口必须先定义契约，再开始实现。
- 请求和响应 schema 必须明确，并具备版本演进空间。
- 字段名应保持稳定，默认避免破坏性变更。
- 错误模型保持统一：\`code\`、\`message\`、\`details\`、\`traceId\`。
- 涉及鉴权、校验规则、兼容性约束或限流时，必须写清楚。
- 时间戳和时区字段必须表达明确。

## 变更策略

- 非破坏性变更应以新增字段为主，并保持向后兼容。
- 破坏性变更需要版本升级或迁移计划。
- 废弃字段或接口必须说明时间线和替代路径。

## 验证要求

- 契约示例必须包含成功和失败场景。
- 条件允许时添加自动化契约测试。
- 前端和后端验收标准应引用同一份契约。
`;
}

function backendStandardTemplate(): string {
  return `# 后端标准

## 适用范围

适用于服务逻辑、数据访问、后台任务和后端测试。

## 强制规则

- 业务逻辑不得堆在 transport/controller 层。
- 在边界处校验输入，并返回明确的错误语义。
- 模块职责保持聚焦，不混入无关职责。
- 多步骤关键写操作应使用事务。
- schema 或迁移变更必须说明回滚方式。
- 外部依赖应按风险补充 timeout、retry 或失败处理。
- 日志中避免输出敏感数据。
- 行为变更需要补充测试。

## Java/Spring 基线

- 优先采用分层结构：\`controller -> service -> repository\`。
- API 边界使用 DTO，避免直接暴露持久化实体。
- 事务边界应在 service 层保持明确。
- 优先使用构造器注入。
`;
}

function frontendStandardTemplate(): string {
  return `# 前端标准

## 适用范围

适用于 UI、交互逻辑、状态管理和前端测试。

## 强制规则

- 优先遵循项目现有设计系统和组件模式。
- 未经明确批准，不新增 UI 库。
- 组件职责保持聚焦，避免巨型页面组件。
- 视图逻辑和数据请求副作用应分离。
- 明确处理 loading、empty、error、success 状态。
- 保持可访问性基线：语义化 HTML、键盘可达控件、有标签的输入项。
- 保持常见桌面端和移动端断点下的响应式表现。
- 条件允许时，行为变更需要补充测试。

## Vue 基线

- 优先使用 Vue 3 Composition API 和 \`script setup\`。
- 页面级组件放在 \`views/\`，可复用 UI 放在 \`components/\`。
- 项目使用 Pinia 时，业务状态应放入 Pinia store。
- API 调用应隔离在 service 层，不混入基础 UI 组件。
`;
}

function testingStandardTemplate(): string {
  return `# 测试标准

## 适用范围

适用于行为变更相关的单元测试、集成测试、API 测试和端到端验证。

## 强制规则

- 行为变更需要更新测试；如果不适合补测试，必须说明原因。
- 修复 bug 时，条件允许应至少补充一个回归测试。
- 测试应可重复、相互隔离。
- 鉴权、权限、计费、数据迁移或共享核心逻辑等高风险变更需要更强验证。
- 如果测试无法运行，必须说明阻塞原因、手工验证步骤、预期结果和剩余风险。

## 验证输出

- 已执行命令
- 必要的环境或上下文
- 通过/失败摘要
- 失败细节和下一步动作
`;
}

# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-005 — Project Progress Summary**

## 2. Background

TICKET-004 实现了项目问答。到目前为止，项目详情页展示了会议列表和聚合的 todos/risks/changes/decisions，但没有一个整体的项目进度概述。

本任务在项目详情页顶部加入 AI 生成的项目进度摘要：汇总项目下所有会议的关键决策、主要风险、待确认需求变更和开放问题，生成一段结构化的进度报告文本，供 PM/客户快速了解项目状态。

摘要按需生成（点击按钮触发），结果持久化，不会每次进入页面都重新生成。

## 3. Objective

- 后端：`POST /api/projects/{project_id}/summary` 触发生成进度摘要，`GET /api/projects/{project_id}/summary` 获取已有摘要
- 前端：在项目详情页项目信息卡片下方新增"项目进度摘要"区块

## 4. Scope

### 后端

- [ ] `backend/app/models/project_summary.py` — `ProjectSummary` SQLModel（`project_id` unique FK + `summary_text` + `generated_at`）
- [ ] Alembic migration `20260505_0003_create_project_summary_table.py` — 创建 `project_summary` 表
- [ ] `backend/app/ai/summarizer.py` — 构建项目上下文，调用 OpenAI，返回摘要字符串
- [ ] `backend/app/services/summary_service.py` — 业务逻辑：拉取项目数据，调用 summarizer，upsert `ProjectSummary`
- [ ] `backend/app/routers/summary.py` — 两个端点（见 API Requirements）
- [ ] 注册 `summary_router` 到 `backend/app/main.py`
- [ ] `backend/tests/test_summary.py` — 测试生成成功、幂等覆盖、无会议项目、项目不存在 404

### 前端

- [ ] `frontend/lib/types.ts` — 新增 `ProjectSummary` 类型
- [ ] `frontend/lib/api.ts` — 新增 `generateProjectSummary` 和 `getProjectSummary` 方法
- [ ] `frontend/components/project/project-summary.tsx` — 摘要区块组件
- [ ] `frontend/components/project/project-detail-client.tsx` — 在项目信息卡片和会议列表之间插入 `<ProjectSummary projectId={projectId} />`

## 5. Out of Scope

本任务**不实现**：
- 自动触发（每次进入页面自动生成）——保持手动触发
- 定时任务 / cron job
- 摘要版本历史（只保留最新一条）
- 摘要导出
- 邮件推送

## 6. Existing Context to Read

执行前请读取：
- `CLAUDE.md`
- `AGENTS.md`
- `.ai/context/architecture.md`
- `backend/app/models/analysis.py`（参考 upsert 模式）
- `backend/app/ai/chat.py`（参考 OpenAI 调用风格）
- `backend/app/services/chat_service.py`（参考 context 组装）
- `backend/app/services/analysis_service.py`（参考 upsert 逻辑）
- `backend/alembic/versions/20260505_0002_create_meeting_analysis_table.py`（参考 migration 格式）
- `backend/app/main.py`
- `frontend/lib/types.ts`
- `frontend/lib/api.ts`
- `frontend/components/project/project-detail-client.tsx`

## 7. Data Model

### ProjectSummary

```python
class ProjectSummary(SQLModel, table=True):
    __tablename__ = "project_summary"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="project.id", unique=True, index=True, nullable=False)
    summary_text: str
    generated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

## 8. API Requirements

### POST /api/projects/{project_id}/summary

触发生成/重新生成项目进度摘要。

- 项目不存在 → 404
- 无已完成分析的会议 → 返回 `{ "data": null, "message": "该项目暂无可用的会议分析数据" }` （200）
- 调用 `summarizer.summarize(context)` 生成摘要文本
- Upsert `ProjectSummary`（已有则覆盖 `summary_text` + `generated_at`）
- 响应：`{ "data": <ProjectSummary>, "message": "ok" }`

### GET /api/projects/{project_id}/summary

获取已有摘要。

- 项目不存在 → 404
- 尚未生成 → 404（detail: "Project summary not found."）
- 响应：`{ "data": <ProjectSummary>, "message": "ok" }`

**路由前缀**：`/api/projects`，在 `main.py` 中注册。

### ProjectSummary 响应 schema

```python
class ProjectSummaryRead(BaseModel):
    id: UUID
    project_id: UUID
    summary_text: str
    generated_at: datetime
```

## 9. Backend Implementation Guide

### summarizer.py

构建上下文（可复用 `chat_service.build_project_context` 思路，但只包含有分析结果的会议）：

```python
def summarize(project_name: str, context: str) -> str:
    """Calls OpenAI and returns a structured progress summary as plain text."""
```

System prompt：
```
你是一个专业的项目管理助手，擅长生成项目进度报告。
请根据以下会议记录和分析结果，生成一份简洁的项目进度摘要（300-500字）。
摘要应包含：
1. 项目当前阶段和整体进展
2. 已确定的关键决策（最多3条）
3. 当前主要风险（最多3条）
4. 待解决的需求变更（如有）
5. 下一步行动建议

用中文输出，保持客观、专业的风格，避免重复罗列原始内容。
```

User prompt：
```
项目名称：{project_name}

{context}

请生成项目进度摘要：
```

`temperature=0.3`，不限制 `response_format`（自由文本）。

### summary_service.py

核心逻辑参考 `analysis_service.py` 的 upsert 模式：
- 拉取 `meeting + meeting_analysis` join，只取 `analysis_status = "done"` 的会议
- 组装 context 字符串（可参考 `chat_service.build_project_context`，但只含已分析会议）
- 若无可用数据，返回 `None`（让 router 返回 200 + 友好文案）
- 调用 `summarizer.summarize(project.name, context)`
- Upsert `ProjectSummary`

## 10. UI Requirements

### ProjectSummary 组件

位置：项目详情页，插在项目信息卡片（`Card` 包含 `project.name`, `project.goal` 等）之后、会议列表之前。

**状态机**：
- 组件 mount 时先 `GET /api/projects/{id}/summary`
  - 若 200 → 直接展示已有摘要
  - 若 404 → 显示"尚未生成"状态
  - 若 loading → `<Spinner />`
- 点击"生成摘要"按钮 → 调用 `POST /api/projects/{id}/summary`
  - loading 期间按钮变为"生成中..."并禁用
  - 成功后展示新摘要
  - 失败后展示错误信息

**展示**：
```
[卡片标题] 项目进度摘要   [按钮：重新生成 / 生成摘要]

{summary_text 段落文本，leading-7 text-gray-700}

生成时间：2026-05-05 14:30
```

**卡片样式**：普通 Card（与其他区块一致）

## 11. Acceptance Criteria

### 后端
- [ ] `alembic upgrade head` 创建 `project_summary` 表无报错
- [ ] `POST /api/projects/{id}/summary` 生成并保存摘要
- [ ] 重复调用 POST → 覆盖已有摘要（幂等）
- [ ] 无已分析会议时返回 200 + 友好文案（data 为 null）
- [ ] 项目不存在 → 404
- [ ] `GET /api/projects/{id}/summary` 返回已有摘要
- [ ] 尚未生成时 GET → 404
- [ ] `pytest` 全部通过（mock OpenAI）

### 前端
- [ ] 项目详情页有"项目进度摘要"区块
- [ ] 有已有摘要时自动展示
- [ ] 无摘要时显示引导按钮
- [ ] 生成中有 loading 状态
- [ ] 生成成功后展示摘要文本 + 生成时间
- [ ] 可重新生成（按钮始终可见）
- [ ] `npm run build` 通过

## 12. Deliverables

完成后创建：

**`.ai/reports/TICKET-005-codex-report.md`**

报告必须包含：
1. 使用的任务文件
2. 已完成工作
3. 所有新增/修改文件路径
4. 新增 API（method + path + 描述）
5. 新增前端组件和页面改动
6. 如何本地运行
7. 如何测试（pytest 输出 + curl 示例）
8. 已知问题
9. 需要 Claude Review 的问题

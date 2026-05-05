# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-003 — Project Aggregation View**

## 2. Background

TICKET-002 建立了单次会议级 AI 分析。项目详情页（`ProjectDetailClient`）目前有 4 个占位区块（"任务清单" / "风险台账" / "需求变更" / "决策记录"），均显示"完成会议 AI 分析后自动汇总"。

本任务将这 4 个占位区块替换为真实数据：从项目下所有已完成分析的会议中，汇总所有 `action_items` / `risks` / `requirement_changes` / `key_decisions`，展示到项目详情页。

这是 Phase 1 的最后一张票，完成后用户可以在一个页面看到整个项目的所有任务、风险和决策。

## 3. Objective

- 后端：为项目新增 4 个聚合查询接口，从 `meeting_analysis` 跨会议拍平
- 前端：将项目详情页占位区块替换为真实渲染的聚合组件

## 4. Scope

### 后端

- [ ] `backend/app/services/aggregation_service.py` — 4 个查询函数，跨会议 JOIN + 拍平 JSON 列
- [ ] `backend/app/routers/aggregation.py` — 4 个 GET 接口（见 API Requirements）
- [ ] 注册 `aggregation_router` 到 `backend/app/main.py`
- [ ] `backend/tests/test_aggregation.py` — 测试聚合正确性、跨会议合并、空项目返回空列表

### 前端

- [ ] `frontend/lib/types.ts` — 新增 4 个聚合条目类型（含 meeting 归属字段）
- [ ] `frontend/lib/api.ts` — 新增 4 个 API 方法
- [ ] `frontend/components/project/aggregated-todos.tsx`
- [ ] `frontend/components/project/aggregated-risks.tsx`
- [ ] `frontend/components/project/aggregated-changes.tsx`
- [ ] `frontend/components/project/aggregated-decisions.tsx`
- [ ] `frontend/components/project/project-detail-client.tsx` — 替换 4 个 PlaceholderSection

## 5. Out of Scope

本任务**不实现**：
- 项目问答 / Chat——这是 TICKET-004
- AI 生成项目进度摘要——这是 TICKET-005
- 任务状态修改（勾选完成）
- 任务排序/筛选
- 分页（MVP 阶段全量返回，会议数量有限）

## 6. Existing Context to Read

执行前请读取：
- `CLAUDE.md`
- `AGENTS.md`
- `.ai/context/architecture.md`
- `backend/app/models/meeting.py`
- `backend/app/models/analysis.py`
- `backend/app/ai/schemas.py`
- `backend/app/services/analysis_service.py`
- `backend/app/routers/analysis.py`
- `backend/app/main.py`
- `frontend/lib/types.ts`
- `frontend/lib/api.ts`
- `frontend/components/project/project-detail-client.tsx`
- `frontend/components/analysis/todo-table.tsx`
- `frontend/components/analysis/risk-table.tsx`
- `frontend/components/analysis/change-table.tsx`
- `frontend/components/analysis/decision-list.tsx`

## 7. API Requirements

### GET /api/projects/{project_id}/todos

返回该项目下所有已完成分析的会议中，所有 `action_items` 拍平后的列表，每条附加来源会议信息。

**Response**：
```json
{
  "data": [
    {
      "meeting_id": "uuid",
      "meeting_title": "string",
      "meeting_time": "ISO datetime string",
      "task": "string",
      "owner": "string",
      "deadline": "string",
      "priority": "high|medium|low",
      "status": "string",
      "evidence": "string"
    }
  ],
  "message": "ok"
}
```

### GET /api/projects/{project_id}/risks

返回所有 `risks`，每条附加来源会议信息。

```json
{
  "data": [
    {
      "meeting_id": "uuid",
      "meeting_title": "string",
      "meeting_time": "ISO datetime string",
      "risk": "string",
      "level": "high|medium|low",
      "suggestion": "string",
      "evidence": "string"
    }
  ],
  "message": "ok"
}
```

### GET /api/projects/{project_id}/changes

返回所有 `requirement_changes`，每条附加来源会议信息。

```json
{
  "data": [
    {
      "meeting_id": "uuid",
      "meeting_title": "string",
      "meeting_time": "ISO datetime string",
      "change": "string",
      "type": "new|modified|removed|unclear",
      "impact_on_scope": "string",
      "need_confirmation": true,
      "evidence": "string"
    }
  ],
  "message": "ok"
}
```

### GET /api/projects/{project_id}/decisions

返回所有 `key_decisions`，每条附加来源会议信息。

```json
{
  "data": [
    {
      "meeting_id": "uuid",
      "meeting_title": "string",
      "meeting_time": "ISO datetime string",
      "decision": "string",
      "owner": "string",
      "impact": "string",
      "evidence": "string"
    }
  ],
  "message": "ok"
}
```

**路由前缀**：`/api/projects`，在 `main.py` 中注册。

**空项目处理**：若项目不存在返回 404；若无已完成分析的会议，返回空列表 `[]`（200，不是 404）。

**排序**：按 `meeting_time` 降序（最新会议的条目在前）。

## 8. Backend Implementation Guide

### aggregation_service.py

核心逻辑：
1. 用 `meeting.project_id = project_id` 找出所有会议
2. JOIN `meeting_analysis` where `meeting.id = meeting_analysis.meeting_id`
3. 对每条分析记录，拍平对应的 JSON 列表，每条 dict 附加 `meeting_id`、`meeting_title`、`meeting_time`
4. 按 `meeting_time` 降序排列后返回

使用 SQLModel `select(Meeting, MeetingAnalysis).join(MeetingAnalysis)` 方式实现，避免 N+1。

参考 `analysis_service.py` 中的 session 用法和 import 风格。

### 4 个 Pydantic 响应 schema

在 `aggregation_service.py` 中定义（或单独放 `app/models/aggregation.py`）：

```python
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class MeetingRef:
    meeting_id: UUID
    meeting_title: str
    meeting_time: datetime

class AggregatedTodo(BaseModel):
    meeting_id: UUID
    meeting_title: str
    meeting_time: datetime
    task: str
    owner: str = ""
    deadline: str = ""
    priority: str = "medium"
    status: str = "pending"
    evidence: str = ""

# 类似定义 AggregatedRisk, AggregatedChange, AggregatedDecision
```

## 9. UI Requirements

### 替换项目详情页占位区块

`frontend/components/project/project-detail-client.tsx` 中现有的：

```tsx
<div className="grid gap-6 md:grid-cols-2">
  <PlaceholderSection title="任务清单" />
  <PlaceholderSection title="风险台账" />
  <PlaceholderSection title="需求变更" />
  <PlaceholderSection title="决策记录" />
</div>
```

替换为 4 个真实聚合组件，每个独立用 `useSWR` 加载（key = `/api/projects/${projectId}/todos` 等）。

### AggregatedTodos 组件规范

- 卡片标题："任务清单"
- 若列表为空：显示 "暂无任务，完成会议 AI 分析后自动汇总"
- 若加载中：显示 `<Spinner />`
- 若出错：显示 `<ErrorState />`
- 表格列：任务 / 负责人 / 截止日期 / 优先级 / 来源会议
- 优先级 badge 颜色：与 `todo-table.tsx` 一致（high=danger / medium=warning / low=default）
- 来源会议：显示 `meeting_title`，链接到 `/projects/${projectId}/meetings/${meeting_id}`
- 负责人/截止日期为空时显示"待确认"

### AggregatedRisks 组件规范

- 卡片标题："风险台账"
- 若列表为空："暂无风险记录"
- 表格列：风险描述 / 等级 / 建议措施 / 来源会议
- 等级 badge：与 `risk-table.tsx` 一致（high=danger / medium=warning / low=success）
- 来源会议链接同上

### AggregatedChanges 组件规范

- 卡片标题："需求变更"
- 若列表为空："暂无需求变更"
- 表格列：变更内容 / 类型 / 影响 / 是否需确认 / 来源会议
- badge 颜色：与 `change-table.tsx` 一致
- 来源会议链接同上

### AggregatedDecisions 组件规范

- 卡片标题："决策记录"
- 若列表为空："暂无正式决策"
- 以卡片列表形式展示（参考 `decision-list.tsx`）
- 每条额外显示来源会议（链接）

## 10. Acceptance Criteria

### 后端
- [ ] `GET /api/projects/{id}/todos` 返回 project 下所有会议 `action_items` 拍平列表，每条含 meeting 归属
- [ ] `GET /api/projects/{id}/risks` 同上，`risks`
- [ ] `GET /api/projects/{id}/changes` 同上，`requirement_changes`
- [ ] `GET /api/projects/{id}/decisions` 同上，`key_decisions`
- [ ] 多会议时按 `meeting_time` 降序返回
- [ ] 无已分析会议时返回空列表（非 404）
- [ ] 项目不存在时返回 404
- [ ] `pytest` 全部通过

### 前端
- [ ] 项目详情页 4 个 PlaceholderSection 均被替换为真实组件
- [ ] 各组件独立加载，某个接口失败不影响其他区块
- [ ] 数据为空时展示友好提示，不崩溃
- [ ] 来源会议列可点击跳转到对应会议详情页
- [ ] `npm run build` 通过

## 11. Deliverables

完成后创建：

**`.ai/reports/TICKET-003-codex-report.md`**

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

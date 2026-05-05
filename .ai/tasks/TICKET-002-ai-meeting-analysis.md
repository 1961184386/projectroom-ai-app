# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-002 — AI Meeting Analysis**

## 2. Background

TICKET-001 建立了项目空间与会议基础模型。会议转写内容已可保存，但 AI 分析尚未实现。

本任务完成核心价值闭环：用户保存会议转写后，点击"开始 AI 分析"，系统调用 OpenAI API，将会议内容结构化为摘要、任务清单、风险点、需求变更、关键决策、待确认问题和下次会议建议，并持久化到数据库，再以结构化卡片/表格展示给用户。

这是 ProjectRoom AI 区别于普通会议工具的核心功能。

## 3. Objective

实现完整的 AI 会议分析流程：
- 后端：`MeetingAnalysis` 数据模型 + Alembic migration + 分析触发 API + OpenAI 调用 + JSON schema 校验
- 前端：激活"开始 AI 分析"按钮 + 分析结果结构化展示页（摘要、Todo 表、风险表、需求变更表、决策记录、待确认问题）

## 4. Scope

### 后端
- [ ] `MeetingAnalysis` SQLModel（字段见 Data Model 章节）
- [ ] Alembic migration 新增 `meeting_analysis` 表
- [ ] `backend/app/ai/schemas.py` — AI 输出的 Pydantic schema（见 AI Schema 章节）
- [ ] `backend/app/ai/analyzer.py` — 调用 OpenAI，返回校验后的 `AnalysisResult`
- [ ] `POST /api/meetings/{meeting_id}/analyze` — 触发分析，幂等（已有结果则覆盖），更新 `meeting.analysis_status`
- [ ] `GET /api/meetings/{meeting_id}/analysis` — 获取分析结果
- [ ] `backend/app/routers/analysis.py` — 挂载上述两个路由
- [ ] `backend/app/services/analysis_service.py` — 保存/查询分析结果
- [ ] `main.py` 中注册 `analysis_router`
- [ ] `tests/test_analysis.py` — mock OpenAI，测试分析触发、结果保存、幂等覆盖、404 场景

### 前端
- [ ] `frontend/app/projects/[projectId]/meetings/[meetingId]/page.tsx` — 激活"开始 AI 分析"按钮，点击后调用 `POST /api/meetings/{id}/analyze`，展示 loading 状态
- [ ] `frontend/components/analysis/` — 以下组件：
  - `analysis-result.tsx` — 整体容器，条件渲染各区块
  - `summary-card.tsx` — 会议摘要文本卡片
  - `todo-table.tsx` — 任务清单表格（任务、负责人、截止日、优先级、状态）
  - `risk-table.tsx` — 风险点表格（风险描述、等级、建议）
  - `change-table.tsx` — 需求变更表格（变更内容、类型、影响、是否需确认）
  - `decision-list.tsx` — 关键决策列表（决策、负责人、影响）
  - `open-questions-list.tsx` — 待确认问题列表
  - `next-topics-card.tsx` — 下次会议建议
- [ ] `frontend/lib/api.ts` 新增两个方法：`analyzeMeeting` 和 `getAnalysis`
- [ ] `frontend/lib/types.ts` 新增 `MeetingAnalysis` interface

## 5. Out of Scope

本任务**不实现**：
- 项目级聚合（所有会议的 Todo/风险/变更汇总到项目详情页）——这是 TICKET-003
- 项目问答 / Chat——这是 TICKET-004
- 流式输出（streaming）
- 重试机制
- 分析结果导出（Word/PDF）
- 任务状态修改（勾选完成）
- 任务负责人编辑
- 腾讯会议 / 钉钉 / 飞书 API 接入
- 多语言支持

## 6. Existing Context to Read

执行前请读取：
- `CLAUDE.md`
- `AGENTS.md`
- `.ai/context/product-brief.md`
- `.ai/context/architecture.md`
- `backend/app/models/meeting.py`
- `backend/app/models/project.py`
- `backend/app/routers/meetings.py`
- `backend/app/services/meeting_service.py`
- `backend/app/main.py`
- `frontend/lib/types.ts`
- `frontend/lib/api.ts`
- `frontend/components/meeting/meeting-detail-client.tsx`

## 7. Data Model Requirements

### MeetingAnalysis

```python
class MeetingAnalysis(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    meeting_id: uuid.UUID = Field(foreign_key="meeting.id", unique=True, index=True, nullable=False)
    meeting_summary: str                     # 会议摘要文本
    key_decisions: list = Field(sa_column=Column(JSON), default=[])
    action_items: list = Field(sa_column=Column(JSON), default=[])
    requirement_changes: list = Field(sa_column=Column(JSON), default=[])
    risks: list = Field(sa_column=Column(JSON), default=[])
    open_questions: list = Field(sa_column=Column(JSON), default=[])
    next_meeting_topics: list = Field(sa_column=Column(JSON), default=[])
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

JSON 字段使用 `sqlalchemy.Column(sqlalchemy.JSON)`，兼容 SQLite 和 PostgreSQL。

## 8. API Requirements

### POST /api/meetings/{meeting_id}/analyze

触发 AI 分析。

- 从数据库取 `Meeting`，404 若不存在
- 将 `meeting.analysis_status` 设为 `"processing"`，立即 commit
- 调用 `analyzer.analyze(transcript_text, meeting_title, participants)`
- 将结果 upsert 到 `MeetingAnalysis`（已存在则覆盖）
- 将 `meeting.analysis_status` 设为 `"done"`
- 若 OpenAI 调用抛异常，将 `analysis_status` 设为 `"failed"`，返回 HTTP 500
- 响应：`{ "data": <MeetingAnalysis>, "message": "ok" }`，status 200

### GET /api/meetings/{meeting_id}/analysis

- 取 `MeetingAnalysis`，404 若不存在（说明尚未分析）
- 响应：`{ "data": <MeetingAnalysis>, "message": "ok" }`

路由前缀：`/api/meetings`，在 `main.py` 中注册。

**注意**：这两个路由的路径中只有 `meeting_id`，不含 `project_id`。Meeting 已通过 FK 关联 project，分析操作不需要 project 上下文。

## 9. UI Requirements

### 会议详情页（meeting-detail-client.tsx）改造

**分析前状态**（`analysis_status == "pending"`）：
- "开始 AI 分析" 按钮可点击
- 点击后按钮变为 loading 状态，文案改为"分析中..."，禁用
- 调用 `api.analyzeMeeting(meetingId)` → 成功后刷新页面数据（`mutate`）

**分析中状态**（`analysis_status == "processing"`）：
- 显示 spinner + "AI 分析中，请稍候..."

**分析完成状态**（`analysis_status == "done"`）：
- 隐藏分析按钮
- 渲染 `<AnalysisResult analysis={analysis} />` 组件

**分析失败状态**（`analysis_status == "failed"`）：
- 显示错误提示卡片："AI 分析失败，请重试"
- 重新显示"重新分析"按钮

### 分析结果组件展示规范

#### SummaryCard
- 卡片标题：会议摘要
- 内容：`meeting_summary` 文本，p 标签，`leading-7 text-gray-700`

#### TodoTable
- 标题：任务清单
- 表格列：任务 / 负责人 / 截止日期 / 优先级 / 状态
- 优先级颜色：high=红色 badge / medium=橙色 / low=灰色
- 状态显示：pending → "待处理"
- 负责人/截止日期若为空显示"待确认"
- 若 `action_items` 为空：显示 "本次会议无待办任务"

#### RiskTable
- 标题：风险点
- 表格列：风险描述 / 等级 / 建议措施
- 等级颜色：high=红色 / medium=橙色 / low=绿色
- 若为空：显示 "未发现明显风险"

#### ChangeTable
- 标题：需求变更
- 表格列：变更内容 / 类型 / 影响 / 是否需确认
- 类型标签：new=新增（蓝色）/ modified=修改（橙色）/ removed=删除（红色）/ unclear=待明确（灰色）
- 是否需确认：true="需确认"（红色 badge）/ false="已明确"（绿色 badge）
- 若为空：显示 "本次会议无需求变更"

#### DecisionList
- 标题：关键决策
- 每条：决策文本（粗体）+ 负责人 + 影响（浅色小字）+ 引用原文折叠展示
- 若为空：显示 "本次会议无正式决策"

#### OpenQuestionsList
- 标题：待确认问题
- 每条：问题文本 + 负责人 + 原因
- 若为空：显示 "无待确认问题"

#### NextTopicsCard
- 标题：下次会议建议议题
- 每条以 bullet 展示
- 若为空：不渲染此卡片

## 10. AI Analysis Requirements

### analyzer.py 实现规范

```python
# backend/app/ai/analyzer.py

import json
from openai import OpenAI
from app.config import get_settings
from app.ai.schemas import AnalysisResult

def analyze(transcript_text: str, meeting_title: str, participants: str = "") -> AnalysisResult:
    settings = get_settings()
    client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)

    system_prompt = """你是一个专业的项目管理助手。
请分析以下会议转写内容，提取结构化信息，用 JSON 格式输出。
输出必须是合法的 JSON，不要包含任何额外文字。"""

    user_prompt = f"""会议主题：{meeting_title}
参会人：{participants or "未知"}

会议转写内容：
{transcript_text}

请按照以下 JSON schema 输出分析结果：
{{
  "meeting_summary": "会议摘要，100-200字，说明本次会议讨论了什么、形成了哪些主要结论",
  "key_decisions": [
    {{"decision": "决策内容", "owner": "负责人或空字符串", "impact": "影响描述", "evidence": "原文引用"}}
  ],
  "action_items": [
    {{"task": "任务名称", "owner": "负责人或空字符串", "deadline": "截止时间或空字符串", "priority": "high|medium|low", "status": "pending", "evidence": "原文引用"}}
  ],
  "requirement_changes": [
    {{"change": "变更内容", "type": "new|modified|removed|unclear", "impact_on_scope": "对范围的影响", "need_confirmation": true, "evidence": "原文引用"}}
  ],
  "risks": [
    {{"risk": "风险描述", "level": "high|medium|low", "suggestion": "建议措施", "evidence": "原文引用"}}
  ],
  "open_questions": [
    {{"question": "问题内容", "owner": "负责人或空字符串", "reason": "为什么需要确认"}}
  ],
  "next_meeting_topics": ["议题1", "议题2"]
}}"""

    response = client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)
    return AnalysisResult.model_validate(data)
```

### schemas.py Pydantic schema

```python
# backend/app/ai/schemas.py
from typing import Literal, Optional
from pydantic import BaseModel, Field

class KeyDecision(BaseModel):
    decision: str
    owner: str = ""
    impact: str = ""
    evidence: str = ""

class ActionItem(BaseModel):
    task: str
    owner: str = ""
    deadline: str = ""
    priority: Literal["high", "medium", "low"] = "medium"
    status: str = "pending"
    evidence: str = ""

class RequirementChange(BaseModel):
    change: str
    type: Literal["new", "modified", "removed", "unclear"] = "unclear"
    impact_on_scope: str = ""
    need_confirmation: bool = True
    evidence: str = ""

class Risk(BaseModel):
    risk: str
    level: Literal["high", "medium", "low"] = "medium"
    suggestion: str = ""
    evidence: str = ""

class OpenQuestion(BaseModel):
    question: str
    owner: str = ""
    reason: str = ""

class AnalysisResult(BaseModel):
    meeting_summary: str
    key_decisions: list[KeyDecision] = Field(default_factory=list)
    action_items: list[ActionItem] = Field(default_factory=list)
    requirement_changes: list[RequirementChange] = Field(default_factory=list)
    risks: list[Risk] = Field(default_factory=list)
    open_questions: list[OpenQuestion] = Field(default_factory=list)
    next_meeting_topics: list[str] = Field(default_factory=list)
```

## 11. Acceptance Criteria

### 后端
- [ ] `alembic upgrade head` 创建 `meeting_analysis` 表无报错
- [ ] `POST /api/meetings/{id}/analyze` 调用 OpenAI，返回结构化分析结果
- [ ] 分析完成后 `meeting.analysis_status` 变为 `"done"`
- [ ] 对同一 meeting 重复调用 analyze，结果被覆盖（幂等）
- [ ] OpenAI 调用失败时，`analysis_status` 变为 `"failed"`，返回 HTTP 500
- [ ] `GET /api/meetings/{id}/analysis` 返回已保存的分析结果
- [ ] 未分析的 meeting 调用 GET analysis 返回 404
- [ ] `pytest` 全部通过（mock OpenAI，不发真实请求）

### 前端
- [ ] 会议详情页"开始 AI 分析"按钮可点击
- [ ] 点击后按钮变 loading，调用分析 API
- [ ] 分析成功后，页面自动展示结构化分析结果，按钮消失
- [ ] 六个分析区块均渲染（摘要 / Todo / 风险 / 需求变更 / 决策 / 待确认问题）
- [ ] 各区块数据为空时展示友好提示，不崩溃
- [ ] 分析失败时展示错误提示和"重新分析"按钮
- [ ] `analysis_status == "processing"` 时展示 spinner

## 12. Deliverables

完成后创建：

**`.ai/reports/TICKET-002-codex-report.md`**

报告必须包含：
1. 使用的任务文件
2. 已完成工作
3. 所有新增/修改文件路径
4. 新增 API（method + path + 描述）
5. 新增前端组件和页面改动
6. 如何本地运行（需设置 OPENAI_API_KEY）
7. 如何测试（pytest 输出 + curl 示例）
8. 已知问题
9. 需要 Claude Review 的问题

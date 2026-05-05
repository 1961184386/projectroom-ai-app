# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-004 — Project Q&A**

## 2. Background

TICKET-003 完成了项目聚合视图。项目详情页右上角有一个已禁用的"项目问答"按钮，指向 `/projects/{projectId}/chat`，该页面尚未实现。

本任务实现上下文窗口内的项目问答（非 RAG）：将项目下所有会议的转写内容和分析结果拼接为上下文，交给 LLM 回答用户问题。回答带来源引用（来自哪次会议）。

## 3. Objective

- 后端：`POST /api/projects/{project_id}/chat` 接口，拼接项目上下文，调用 AI 生成答案
- 前端：激活"项目问答"按钮，实现 Chat 对话页面

## 4. Scope

### 后端

- [ ] `backend/app/ai/chat.py` — 构建项目上下文 prompt，调用 OpenAI，返回 answer + sources
- [ ] `backend/app/routers/chat.py` — `POST /api/projects/{project_id}/chat`
- [ ] `backend/app/services/chat_service.py` — 收集项目所有会议数据，组装 context，调用 `chat.py`
- [ ] 注册 `chat_router` 到 `backend/app/main.py`
- [ ] `backend/tests/test_chat.py` — 测试正常回答、无会议项目、项目不存在 404

### 前端

- [ ] `frontend/app/projects/[projectId]/chat/page.tsx` — 问答页面（Server Component 外壳）
- [ ] `frontend/components/chat/chat-client.tsx` — 对话 UI（Client Component）
- [ ] `frontend/lib/types.ts` — 新增 `ChatMessage`, `ChatResponse` 类型
- [ ] `frontend/lib/api.ts` — 新增 `askProject` 方法
- [ ] `frontend/components/project/project-detail-client.tsx` — 激活"项目问答"按钮（去掉 `disabled`，改为真实链接）

## 5. Out of Scope

本任务**不实现**：
- 向量数据库 / RAG / embedding
- 流式输出（streaming）
- 对话历史持久化到数据库
- 多轮对话上下文管理（每次请求独立，不记忆前一轮）
- 项目进度摘要——这是 TICKET-005

## 6. Existing Context to Read

执行前请读取：
- `CLAUDE.md`
- `AGENTS.md`
- `.ai/context/architecture.md`
- `backend/app/models/meeting.py`
- `backend/app/models/analysis.py`
- `backend/app/ai/analyzer.py`
- `backend/app/ai/schemas.py`
- `backend/app/services/aggregation_service.py`
- `backend/app/main.py`
- `frontend/lib/types.ts`
- `frontend/lib/api.ts`
- `frontend/components/project/project-detail-client.tsx`

## 7. API Requirements

### POST /api/projects/{project_id}/chat

**Request body**:
```json
{ "question": "string" }
```

**Response**:
```json
{
  "data": {
    "answer": "string",
    "sources": [
      { "meeting_id": "uuid", "meeting_title": "string", "meeting_time": "ISO datetime" }
    ]
  },
  "message": "ok"
}
```

**行为规则**：
- 项目不存在 → 404
- 项目下无会议转写 → 返回 `{"answer": "该项目暂无会议记录，无法回答问题。", "sources": []}`（200，不是 404）
- 拼接上下文超过限制时截断最老的会议（保持最近 N 条）；MVP 阶段保留所有，不做截断
- AI 调用失败 → HTTP 500

**Pydantic 请求 schema**（在 `routers/chat.py` 中定义）：
```python
class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
```

**Pydantic 响应 schema**：
```python
class ChatSource(BaseModel):
    meeting_id: UUID
    meeting_title: str
    meeting_time: datetime

class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
```

## 8. Backend Implementation Guide

### chat_service.py

```python
def build_project_context(session: Session, project_id: UUID) -> tuple[str, list[Meeting]]:
    """
    Returns (context_text, meetings_used).
    context_text is the assembled prompt context block.
    meetings_used is the list of Meeting objects included (for source attribution).
    """
```

上下文格式：

```
项目下共有 {N} 次会议记录，以下是各次会议的转写内容和分析摘要：

---
会议 1：{meeting.title}（{meeting.meeting_time}）
参会人：{meeting.participants or "未知"}
会议转写：
{meeting.transcript_text}

AI 分析摘要：
{analysis.meeting_summary if analysis else "（尚未分析）"}
---
会议 2：...
```

### chat.py

```python
def ask(context: str, question: str) -> str:
    """Calls OpenAI with project context and user question. Returns answer string."""
```

System prompt（中文）：
```
你是一个专业的项目管理助手，帮助项目团队回顾会议内容、追踪任务进展。
你只根据以下提供的会议记录回答问题，不要编造没有出现在记录中的内容。
如果记录中找不到答案，请直接说"根据现有会议记录，无法回答这个问题"。
```

User prompt：
```
{context}

用户问题：{question}
```

`response_format` 不限制为 JSON（自由文本回答）。`temperature=0.3`。

## 9. UI Requirements

### Chat 页面（`/projects/{projectId}/chat`）

整体布局：
- 顶部：返回项目详情的链接（与 meeting-detail-client.tsx 一致的风格）
- 标题："项目问答 — {project.name}"（用 SWR 拉取项目名）
- 对话区：消息气泡列表（用户问题右对齐，AI 回答左对齐）
- 来源引用：每条 AI 回答下方展示 `sources`（来源会议标题，可点击跳转）
- 底部：输入框 + 发送按钮，按 Enter 也可发送

### ChatClient 组件规范

**状态**：
- `messages: Array<{role: "user"|"assistant", content: string, sources?: Source[]}>`
- `input: string`
- `isLoading: boolean`（发送中禁用输入框和按钮）

**用户气泡**：右侧，蓝色背景，白色文字，圆角

**AI 气泡**：左侧，灰色背景，深色文字，圆角

**来源引用**（AI 回答下方，若 sources 非空）：
```
来源：[会议标题1]  [会议标题2]
```
每个标题是可点击链接，跳转到 `/projects/{projectId}/meetings/{meeting_id}`

**空状态**（无对话记录时）：
```
提示你可以问的问题类型：
• 上次会议确定了哪些任务？
• 当前有哪些未解决风险？
• 最近的需求变更有哪些？
```

**错误处理**：发送失败时在 AI 气泡位置显示错误信息（不清空用户输入）

### 激活"项目问答"按钮

`project-detail-client.tsx` 中：

```tsx
// 当前
<Button disabled variant="secondary">
  项目问答
</Button>

// 改为
<Link href={`/projects/${projectId}/chat`}>
  <Button variant="secondary">项目问答</Button>
</Link>
```

## 10. Acceptance Criteria

### 后端
- [ ] `POST /api/projects/{id}/chat` 接收 `{"question": "..."}` 返回 answer + sources
- [ ] sources 正确包含被引用的会议信息
- [ ] 无会议项目返回友好文案（200）
- [ ] 项目不存在返回 404
- [ ] AI 调用通过 `backend/app/ai/chat.py` 走，不在 service 里直接调 OpenAI
- [ ] `pytest` 全部通过（mock OpenAI）

### 前端
- [ ] 项目详情页"项目问答"按钮可点击，跳转到 `/projects/{id}/chat`
- [ ] Chat 页面可发送问题、展示 AI 回答
- [ ] 发送中有 loading 状态，输入框禁用
- [ ] AI 回答下方展示来源会议，可点击
- [ ] 空状态有引导提示
- [ ] 发送失败有错误提示
- [ ] `npm run build` 通过

## 11. Deliverables

完成后创建：

**`.ai/reports/TICKET-004-codex-report.md`**

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

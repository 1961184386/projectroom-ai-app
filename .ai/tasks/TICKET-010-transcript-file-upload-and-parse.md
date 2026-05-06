# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-010 — Transcript File Upload & Smart Parse + DingTalk OAuth Reservation**

## 2. Background

当前会议导入仅支持手动粘贴转写文本，用户需从腾讯会议客户端导出 `.txt` 后手动复制粘贴。本任务实现拖拽/选择文件上传，浏览器端自动解析腾讯会议转写格式，提取元信息并自动填入表单。同时预留钉钉 OAuth 扫码登录的工程骨架。

## 3. Objective

1. **文件上传+智能解析**：用户拖拽/选择腾讯会议导出的 `.txt` 文件，浏览器端自动识别格式、提取会议标题/时间/参会人/转写内容，自动填入表单
2. **钉钉 OAuth 登录预留**：后端新增钉钉 OAuth 路由骨架、前端预留"钉钉扫码登录"按钮，标记为即将开放

## 4. Scope

### 4.1 前端：转写文件解析器（纯浏览器端，无后端依赖）

**新建文件：`frontend/lib/parse-transcript.ts`**

解析器需支持三种腾讯会议导出格式：

**格式A：带时间戳（腾讯会议标准导出）**
```
00:03:25 张三
我觉得这个方案可以，但是有一些风险需要评估。

00:04:10 李四
对，主要是第三方的接口稳定性，我建议做一个降级方案。
```
→ 去掉时间戳行，保留"说话人 + 内容"

**格式B：纯对话（说话人: 格式）**
```
张三：我觉得这个方案可以。
李四：对，主要是接口稳定性。
```
→ 保持原样，提取所有唯一说话人作为参会人

**格式C：混合元信息头 + 对话**
```
会议主题：项目周例会的快速会议
会议时间：2026-05-05 14:03-14:56
参会人：张三(PM)、李四(开发)
录制文件：录制1.mp4

张三：我觉得这个方案可以。
李四：对，需要评估风险。
```
→ 提取开头元信息行，后续对话按格式B处理

导出函数：
```typescript
export interface ParsedTranscript {
  title: string | null;          // 从元信息或文件名提取
  meetingTime: string | null;    // ISO datetime string
  participants: string[];         // 唯一说话人列表
  transcriptText: string;         // 清洗后的对话文本
  detectedFormat: "timestamp" | "dialogue" | "metadata_header" | "unknown";
  warning?: string;               // 解析警告（如格式无法识别）
}
export function parseTranscript(rawText: string, fileName?: string): ParsedTranscript
```

### 4.2 前端：文件上传UI改造

**修改文件：`frontend/components/meeting/create-meeting-form.tsx`**

改动点：
- 在 textarea 上方新增文件拖拽上传区域
- 支持拖拽 `.txt` 文件或点击选择文件
- 拖拽区域有视觉反馈（hover 高亮）
- 读到的文件内容自动传给 `parseTranscript()` 解析
- 解析结果自动填入：title、meeting_time、participants、transcript_text
- 用户可在自动填充后手动修改任意字段
- 已上传文件名显示在旁边，可清除重新上传
- 上传区域不替换 textarea——用户仍可手动粘贴（两者共存）

### 4.3 后端：钉钉 OAuth 路由预留

**新建文件：**
- `backend/app/routers/auth.py` — OAuth 路由骨架
- `backend/app/services/auth_service.py` — OAuth service 骨架

**auth.py 需包含（仅骨架，不真实调用钉钉API）：**
```
GET  /api/auth/dingtalk/login-url    → 返回模拟的钉钉授权URL（带注释说明真实实现方式）
GET  /api/auth/dingtalk/callback     → OAuth 回调接收，返回占位成功信息
GET  /api/auth/dingtalk/status       → 返回 { configured: false, message: "钉钉扫码登录即将开放" }
```

所有端点必须通过 `raise HTTPException(501, "即将开放")` 或返回友好提示，不能 500 崩溃。

**auth_service.py 骨架函数：**
```python
def build_dingtalk_oauth_url(redirect_uri: str) -> str:
    """Reserved: build actual DingTalk OAuth URL when credentials are configured."""

def exchange_code_for_token(code: str) -> dict:
    """Reserved: exchange OAuth code for access_token."""
```

### 4.4 前端：钉钉扫码登录按钮预留

**修改文件：`frontend/app/layout.tsx`**

在 Header 右侧（"新建项目"按钮旁边）新增：
```tsx
<Button variant="outline" disabled className="gap-2">
  <svg>钉钉图标</svg>
  钉钉登录
  <span className="text-xs text-gray-400 ml-1">即将开放</span>
</Button>
```

点击时弹出 toast：`钉钉扫码登录功能即将开放，当前请使用手动导入或文件上传`

### 4.5 环境变量预留

**修改文件：`.env.example`**

新增（已有 DINGTALK_*，检查是否完整）：
```
# DingTalk OAuth Login (reserved)
DINGTALK_OAUTH_CLIENT_ID=
DINGTALK_OAUTH_CLIENT_SECRET=
DINGTALK_OAUTH_REDIRECT_URI=
```

### 4.6 后端注册

**修改文件：`backend/app/main.py`**

注册 `auth_router`：
```python
from app.routers.auth import router as auth_router
app.include_router(auth_router)
```

## 5. Out of Scope

Do NOT implement:
- 真实钉钉 API 调用（仅骨架占位）
- .docx / .pdf 文件解析
- 后端的文件存储（当前仅浏览器端读取）
- OAuth token 存储/会话管理
- 用户系统/数据库表
- 钉钉扫码的真实前端交互

## 6. Data Model

No new database models needed for this ticket.

## 7. API Contract

### New (OAuth reservation only)
```
GET  /api/auth/dingtalk/login-url    → { data: { url: "https://...", configured: false }, message: "即将开放" }
GET  /api/auth/dingtalk/callback     → { data: { status: "not_configured" }, message: "钉钉登录即将开放" }
GET  /api/auth/dingtalk/status       → { data: { configured: false }, message: "钉钉扫码登录即将开放" }
```

### No modifications to existing APIs

## 8. Frontend Pages

### Modified
- `frontend/components/meeting/create-meeting-form.tsx` — 文件拖拽上传 + 自动解析填充
- `frontend/app/layout.tsx` — "钉钉登录"按钮（disabled + 即将开放）

### New
- `frontend/lib/parse-transcript.ts` — 转写文件解析器

## 9. Backend Files

### New
- `backend/app/routers/auth.py`
- `backend/app/services/auth_service.py`

### Modified
- `backend/app/main.py`
- `.env.example`

## 10. Test Plan

### parse-transcript.ts 验证（手动或单元测试）
- [ ] 格式A（带时间戳）：正确去掉时间戳行，保留说话人+内容
- [ ] 格式B（纯对话）：正确提取说话人和对话
- [ ] 格式C（元信息头）：正确提取标题/时间/参会人
- [ ] 空文件/非转写内容：graceful fallback，不崩溃
- [ ] 文件名推测：`项目启动会_20260410.txt` → title="项目启动会"

### Backend
- [ ] pytest 全部通过（现有33个test不破坏）
- [ ] 新增 auth 路由返回 200 而非 500

### Frontend
- [ ] npm run build 通过
- [ ] 手动验证：拖拽 .txt 文件 → 表单自动填充 → 可手动修改 → 提交成功

## 11. Acceptance Criteria

- [ ] 支持拖拽 .txt 文件到会议导入页面
- [ ] 浏览器端自动解析三种转写格式（时间戳/纯对话/元信息头）
- [ ] 解析结果自动填入表单字段
- [ ] 用户可手动修正自动填充的内容
- [ ] 手动粘贴 textarea 功能保持不变
- [ ] Header 有"钉钉登录"按钮（disabled + 即将开放标签）
- [ ] `/api/auth/dingtalk/*` 路由存在且不崩溃
- [ ] 所有已有功能不被破坏
- [ ] `pytest` 33 tests 全部通过
- [ ] `npm run build` 通过

## 12. Deliverables

完成后创建 `.ai/reports/TICKET-010-codex-report.md`，包含：
1. Task file used
2. Completed work summary
3. All files created/modified
4. All APIs implemented
5. All UI changes
6. How to run
7. How to test
8. Known issues
9. Questions for Claude review

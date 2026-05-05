# Task Handoff for Codex CLI

## 1. Task Name

**TICKET-007 — UI Polish & Responsive Layout**

## 2. Background

Phase 3 目标是让产品 demo-ready。当前 UI 功能完整但缺少视觉一致性与细节打磨：Header 缺少品牌标识感、页面导航面包屑样式简陋、表格在移动端溢出、Loading 状态缺乏骨架屏、部分按钮/Badge 颜色不统一。本任务在不改变任何功能逻辑和 API 的前提下，提升整体视觉质量，使其可向客户/投资人 Demo。

## 3. Objective

纯前端改动，不触碰任何后端代码。改动范围：

1. **全局 Layout** — Header 优化，加入左侧 Logo 图标（SVG inline），右侧"新建项目"按钮样式微调
2. **Breadcrumb 导航** — 统一"返回XX"链接为带箭头图标的面包屑组件，复用于 meeting detail + chat 页面
3. **项目列表页** — 页面 hero 区域增加副标题、项目卡片 hover 视觉效果增强
4. **项目详情页** — 顶部 meta 信息 3 栏布局改善，Summary 卡片段落渲染支持 Markdown 粗体（`**text**`）
5. **会议详情页** — 转写内容区域增加字数统计 badge，AI 分析结果区域入场动画（fade-in）
6. **聚合表格移动适配** — todos / risks / changes / decisions 四个表格在 sm 屏幕下改为卡片列表（隐藏 `<table>`，展示 `<div>` 卡片）
7. **全局 Skeleton loading** — 提取 `SkeletonCard` UI 组件，替换 `ProjectListClient`、`ProjectDetailClient`、`MeetingDetailClient` 中的裸 `<Spinner />` 为更丰富的骨架屏
8. **Chat 页面** — 空状态提示文案改为可点击卡片（点击自动填入输入框），消息流底部自动滚动

## 4. Scope

### 前端组件

- [ ] `frontend/components/ui/skeleton.tsx` — 新建 Skeleton 原子组件
- [ ] `frontend/components/ui/skeleton-card.tsx` — 新建 SkeletonCard 组合组件（1~3 行文本骨架 + 可选按钮骨架）
- [ ] `frontend/components/ui/breadcrumb.tsx` — 新建 Breadcrumb 组件（`<span>‹</span> <Link>XXX</Link>` 样式）
- [ ] `frontend/app/layout.tsx` — Header 优化（Logo SVG + 文字）
- [ ] `frontend/app/projects/page.tsx` — 页面副标题 + ProjectListClient loading 骨架屏
- [ ] `frontend/components/project/project-list-client.tsx` — 用 SkeletonCard 替换 Spinner
- [ ] `frontend/components/project/project-card.tsx` — hover ring/shadow 视觉增强
- [ ] `frontend/components/project/project-detail-client.tsx` — 用 SkeletonCard 替换 Spinner
- [ ] `frontend/components/project/project-summary.tsx` — Summary 文本支持 `**bold**` 渲染（正则替换为 `<strong>`）
- [ ] `frontend/components/meeting/meeting-detail-client.tsx` — 用 Breadcrumb 替换返回链接，转写区增加字数 badge，分析结果 fade-in，用 SkeletonCard 替换 Spinner
- [ ] `frontend/components/chat/chat-client.tsx` — 用 Breadcrumb 替换返回链接，空状态提示改为可点击卡片，消息流自动滚动到底部
- [ ] `frontend/components/project/aggregated-todos.tsx` — 移动端卡片列表适配
- [ ] `frontend/components/project/aggregated-risks.tsx` — 移动端卡片列表适配
- [ ] `frontend/components/project/aggregated-changes.tsx` — 移动端卡片列表适配
- [ ] `frontend/components/project/aggregated-decisions.tsx` — 移动端卡片列表适配

### 不改动

- 所有后端代码
- `frontend/lib/api.ts`、`frontend/lib/types.ts`、`frontend/lib/utils.ts`
- 任何路由结构和 API 调用逻辑
- 现有测试文件

## 5. Out of Scope

- 新功能开发
- 路由改动
- 多语言/i18n
- 深色模式
- 动画库引入（仅用 Tailwind `animate-` 类）

## 6. Existing Context to Read

执行前请读取：
- `CLAUDE.md`
- `AGENTS.md`
- `frontend/app/layout.tsx`
- `frontend/app/projects/page.tsx`
- `frontend/components/project/project-list-client.tsx`
- `frontend/components/project/project-card.tsx`
- `frontend/components/project/project-detail-client.tsx`
- `frontend/components/project/project-summary.tsx`
- `frontend/components/project/aggregated-todos.tsx`
- `frontend/components/project/aggregated-risks.tsx`
- `frontend/components/project/aggregated-changes.tsx`
- `frontend/components/project/aggregated-decisions.tsx`
- `frontend/components/meeting/meeting-detail-client.tsx`
- `frontend/components/chat/chat-client.tsx`
- `frontend/components/ui/empty-state.tsx`
- `frontend/components/ui/error-state.tsx`
- `frontend/components/ui/spinner.tsx`

## 7. Implementation Details

### 7.1 Skeleton 组件

`frontend/components/ui/skeleton.tsx`:

```tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}
```

`frontend/components/ui/skeleton-card.tsx`:

```tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard({ lines = 3, hasButton = false }: { lines?: number; hasButton?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-3/5" : "w-full"}`} />
        ))}
        {hasButton ? <Skeleton className="mt-4 h-9 w-24" /> : null}
      </CardContent>
    </Card>
  );
}
```

### 7.2 Breadcrumb 组件

`frontend/components/ui/breadcrumb.tsx`:

```tsx
import Link from "next/link";

export function Breadcrumb({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      <span aria-hidden="true">‹</span>
      {label}
    </Link>
  );
}
```

使用方式（替换 meeting detail 和 chat 中的纯文本返回链接）：
```tsx
<Breadcrumb href={`/projects/${projectId}`} label="返回项目详情" />
```

### 7.3 聚合表格移动端适配

对于每个聚合组件（todos / risks / changes / decisions），在 `<table>` 外侧包裹 `hidden sm:block`，同时在其上方添加 `block sm:hidden` 的卡片列表版本。示例（todos）：

```tsx
{/* 桌面表格 */}
<div className="hidden sm:block overflow-x-auto">
  <table ...>...</table>
</div>

{/* 移动端卡片列表 */}
<div className="sm:hidden space-y-3">
  {items.map((item, index) => (
    <div key={...} className="rounded-lg border border-gray-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">{item.task}</p>
        <Badge variant={priorityVariantMap[item.priority]}>{priorityLabelMap[item.priority]}</Badge>
      </div>
      <p className="text-xs text-gray-500">负责人：{item.owner || "待确认"} · 截止：{item.deadline || "待确认"}</p>
      <Link href={...} className="text-xs text-gray-700 underline-offset-2 hover:underline">
        {item.meeting_title}
      </Link>
    </div>
  ))}
</div>
```

对 risks / changes / decisions 采用同样模式，展示各自的关键字段。

### 7.4 Summary 粗体渲染

在 `project-summary.tsx` 中，将段落内容的 `**text**` 替换为 `<strong>text</strong>`：

```tsx
function renderParagraph(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}
```

然后在段落渲染处：
```tsx
<p key={...} className="text-sm leading-7 text-gray-700">
  {renderParagraph(paragraph)}
</p>
```

### 7.5 Chat 自动滚动

使用 `useRef` + `useEffect` 自动滚动到消息列表底部：

```tsx
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// 在消息列表最后添加：
<div ref={messagesEndRef} />
```

### 7.6 Chat 空状态可点击卡片

将静态文字列表改为可点击的卡片，点击后把该 prompt 填入 `input`：

```tsx
{EMPTY_PROMPTS.map((prompt) => (
  <button
    key={prompt}
    onClick={() => setInput(prompt)}
    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
  >
    {prompt}
  </button>
))}
```

### 7.7 Header Logo

在 `layout.tsx` 的 Logo 文字旁边加入简单 SVG 图标（无外部依赖）：

```tsx
<Link href="/projects" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="22" height="22" rx="6" fill="#2563EB"/>
    <rect x="5" y="6" width="12" height="1.8" rx="0.9" fill="white"/>
    <rect x="5" y="10.1" width="8" height="1.8" rx="0.9" fill="white"/>
    <rect x="5" y="14.2" width="10" height="1.8" rx="0.9" fill="white"/>
  </svg>
  ProjectRoom AI
</Link>
```

### 7.8 转写字数 badge

在 `meeting-detail-client.tsx` 的转写内容 CardHeader 中加入字数 badge：

```tsx
<CardHeader className="flex-row items-center justify-between">
  <CardTitle>会议转写内容</CardTitle>
  <span className="text-xs text-gray-400">{meeting.transcript_text.length} 字</span>
</CardHeader>
```

### 7.9 ProjectCard hover 增强

```tsx
<Card className="h-full transition-shadow hover:shadow-md">
```

### 7.10 SkeletonCard 替换位置

- `ProjectListClient` isLoading → 渲染 3 个 `<SkeletonCard lines={3} hasButton />`（网格布局）
- `ProjectDetailClient` isLoading → 渲染 `<SkeletonCard lines={4} />` + `<SkeletonCard lines={3} />`（stack 布局）
- `MeetingDetailClient` isLoading → 渲染 `<SkeletonCard lines={4} />`

## 8. Acceptance Criteria

- [ ] `npm run build` 通过，无 TypeScript 错误
- [ ] Header 左侧显示蓝色方形 Logo + "ProjectRoom AI" 文字
- [ ] 移动端（375px 宽）打开项目详情页，聚合表格显示为卡片列表而非溢出表格
- [ ] 项目列表、项目详情、会议详情加载时显示骨架屏（Skeleton 动画）
- [ ] Chat 空状态提示可点击，点击后自动填入输入框
- [ ] Chat 发送消息后自动滚动到最新消息
- [ ] MeetingDetail 和 ChatClient 的"返回"链接替换为带 ‹ 箭头的 Breadcrumb 组件

## 9. Deliverables

完成后创建：

**`.ai/reports/TICKET-007-codex-report.md`**

报告必须包含：
1. 使用的任务文件
2. 已完成工作清单
3. 所有新增/修改文件路径
4. `npm run build` 输出结果（粘贴实际输出）
5. 已知问题
6. 需要 Claude Review 的问题

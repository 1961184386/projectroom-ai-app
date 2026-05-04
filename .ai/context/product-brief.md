# Product Brief — ProjectRoom AI

## One-Line Definition

ProjectRoom AI is an AI-powered project meeting workspace that converts meeting transcripts into persistent, structured project assets for delivery teams.

## The Problem

In project delivery work (software outsourcing, consulting, enterprise digitization), critical information lives scattered across meeting recordings, chat threads, personal notes, and project managers' memory.

The result:
- Requirement changes go unrecorded → scope disputes at handoff
- Action items get lost → missed deadlines with no traceability
- Risks are mentioned verbally but never escalated → delivery surprises
- Project status requires manual meeting-replay to reconstruct

## The Solution

ProjectRoom AI processes meeting transcripts through an AI analysis pipeline and extracts:

| Asset | What it captures |
|---|---|
| Meeting Summary | What was discussed, what was concluded |
| Action Items | Tasks with owner, deadline, priority, status |
| Requirement Changes | New / modified / removed scope items, impact flags |
| Risks | Severity-ranked blockers with suggested actions |
| Key Decisions | Formal conclusions with evidence traceability |
| Open Questions | Unresolved items requiring follow-up |

These assets are archived into a **Project Space** — so multiple meetings accumulate a living project record, not one-off summaries.

## Target Users (MVP)

Primary: Project managers at software/AI delivery teams, outsourcing companies, consulting firms
Secondary: Client-side project stakeholders who want visibility

## Core User Journey (MVP)

```
Create Project → Import Meeting Transcript → AI Analysis
    → Review Structured Output → Saved to Project Space
    → Project Detail Aggregates All Meetings
    → Ask Questions About Project Status
```

## MVP Scope (V1)

### Must Have (P0)
1. Project Space (create, list, detail)
2. Meeting import (paste transcript text)
3. AI meeting analysis (summary, todos, risks, changes, decisions)
4. Meeting analysis result page (structured display)
5. Project detail aggregation (all todos, risks, changes across meetings)
6. Project Q&A (basic, context-window, no RAG)

### Not in V1 (P1+)
- Tencent Meeting / DingTalk / Feishu API integration
- Real-time transcription
- File upload / Word/PDF export
- Multi-user collaboration and permissions
- Enterprise org structure
- Mobile app / mini-program
- Advanced RAG / vector search
- Task status editing
- Weekly report generation

## Key Differentiator

Other meeting AI tools answer: *"What happened in this meeting?"*

ProjectRoom AI answers: *"What has changed in this project across all meetings, and what needs to happen next?"*

## Success Metrics for MVP Demo

- Can create a project in < 30 seconds
- Can paste a meeting transcript and get structured analysis in < 30 seconds
- Project detail page shows aggregated todos, risks, and changes from multiple meetings
- Project Q&A returns relevant answers grounded in meeting history

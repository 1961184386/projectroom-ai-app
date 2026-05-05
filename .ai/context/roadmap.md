# Roadmap — ProjectRoom AI

## Development Philosophy

Ship a working demo as fast as possible. Each ticket is independently deployable.
Claude designs and reviews. Codex implements. No ticket spans more than 2 days of work.

## Ticket Sequence

### Phase 1 — Foundation (TICKET-001 → 003)

| Ticket | Name | Goal |
|---|---|---|
| TICKET-001 | Project & Meeting Foundation | DB models, CRUD APIs, Project list + detail + meeting import UI |
| TICKET-002 | AI Meeting Analysis | OpenAI integration, analysis endpoint, structured result page |
| TICKET-003 | Project Aggregation View | Aggregate todos/risks/changes/decisions from all meetings into project detail |

**Exit criteria for Phase 1**: A user can create a project, paste a meeting transcript, receive structured AI analysis, and see all meeting assets aggregated on the project detail page.

---

### Phase 2 — Intelligence (TICKET-004 → 005)

| Ticket | Name | Goal |
|---|---|---|
| TICKET-004 | Project Q&A | Context-window based Q&A using all project meeting content |
| TICKET-005 | Project Progress Summary | AI-generated project status report from all meetings |

**Exit criteria for Phase 2**: A user can ask natural language questions about a project and receive grounded answers. The project detail page shows an AI-written progress summary.

---

### Phase 3 — Demo Polish (TICKET-006 → 007)

| Ticket | Name | Goal |
|---|---|---|
| TICKET-006 | Demo Data & Onboarding | Seed realistic demo project + meetings so reviewers see value immediately |
| TICKET-007 | UI Polish & Responsive Layout | Consistent visual design, mobile-readable, loading/error states everywhere |

**Exit criteria for Phase 3**: Product is demo-ready. Can be shown to clients and investors without embarrassment.

---

### Phase 4 — P1 Features (Post-MVP, backlog)

These are not scheduled. Claude will create tickets when Phase 3 is complete.

- Task status editing (mark todo as done)
- Meeting transcript file upload (txt, docx)
- Meeting notes export (Word / PDF)
- Weekly project report generation
- Multi-meeting requirement change diff view
- Cross-meeting decision conflict detection

---

### Phase 5 — Platform Integration (P2, future)

- Tencent Meeting API (pull transcripts)
- DingTalk Meeting API
- Feishu Miaoji import
- Webhook for real-time transcript sync

---

### Phase 6 — Enterprise (P3, future)

- Multi-user workspaces with role-based permissions
- Client-facing read-only project portal
- Private deployment packaging
- Jira / Feishu task sync
- Audit log

---

## Current Status (as of 2026-05-05)

| Ticket | Status |
|---|---|
| TICKET-001 | ✅ PASS |
| TICKET-001-fix-001 | ✅ PASS |
| TICKET-002 | ✅ PASS |
| TICKET-003 | ✅ PASS |
| TICKET-004 | ✅ PASS |
| TICKET-005 | ✅ PASS |
| TICKET-006 | ✅ PASS |
| TICKET-007 | ✅ PASS |

## Review Cadence

After each Codex implementation:
1. Codex writes report → `.ai/reports/TICKET-XXX-codex-report.md`
2. Claude reads task + report + git diff
3. Claude issues PASS / PARTIAL PASS / FAIL
4. On PASS: Claude creates next ticket
5. On FAIL: Claude creates fix task (TICKET-XXX-fix-YYY.md)

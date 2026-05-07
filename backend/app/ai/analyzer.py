import json
import logging
import re

from openai import OpenAI

from app.ai.schemas import (
    ActionItem,
    AnalysisResult,
    KeyDecision,
    OpenQuestion,
    RequirementChange,
    Risk,
)
from app.config import get_settings

logger = logging.getLogger(__name__)


# ── Keyword-driven mock analyzer ────────────────────────────────────

_ACTION_PATTERNS = [
    re.compile(r"(?:需要|必须|应该|尽快|本周|下[周月]|明天|后天|负责|由|安排|TODO).{0,40}"),
    re.compile(r"(\S+)\s*(?:负责|来做|去[做搞弄]|完成|跟进|推进|落实|处理).{0,30}"),
]

_RISK_PATTERNS = [
    re.compile(r"(?:风险|问题|担心|隐患|瓶颈|延迟|延期|超过了|不够|不足|困难|压力|紧张|过期).{0,50}"),
]

_CHANGE_PATTERNS = [
    re.compile(r"(?:变更|调整|修改|改成|改为|换成|新需求|新增|额外|增加|不希望).{0,50}"),
]

_DECISION_PATTERNS = [
    re.compile(r"(?:确认|决定|定下来|就这么|可以|没问题|同意|通过|采纳).{0,50}"),
]

_QUESTION_PATTERNS = [
    re.compile(r".*[？?]$"),
]

_OWNER_PATTERN = re.compile(r"(\S+)\s*(?:负责|来做|去[做搞弄]|完成|跟进|推进|落实|处理|确认|评估|提交|出|给)")

_DEADLINE_PATTERN = re.compile(
    r"(\d+月\d+[日号]|(?:本周|下周|明天|后天|周[一二三四五六日]|月底|月初|Q[1-4]))"
)

_PARTICIPANT_PATTERN = re.compile(r"^(\S{1,6})(?:[：:]|（|\(|\s+–)")

_PRIORITY_KEYWORDS_HIGH = {"必须", "紧急", "尽快", "关键", "重要", "优先", "风险", "block", "SLA", "P0"}
_PRIORITY_KEYWORDS_MEDIUM = {"需要", "计划", "安排", "建议", "优化", "改进"}
_EXCLUDE_FILLER = {"好的", "收到", "谢谢", "明白", "了解", "嗯", "对", "行", "可", "那", "会议主题", "会议时间", "参会人", "录制文件"}


def _estimate_priority(text: str) -> str:
    lowered = text.lower()
    if any(kw in lowered for kw in _PRIORITY_KEYWORDS_HIGH):
        return "high"
    if any(kw in lowered for kw in _PRIORITY_KEYWORDS_MEDIUM):
        return "medium"
    return "low"


def _extract_owner(line: str) -> str:
    m = _OWNER_PATTERN.search(line)
    return m.group(1).strip() if m else ""


def _extract_deadline(line: str) -> str:
    m = _DEADLINE_PATTERN.search(line)
    return m.group(1) if m else ""


def _extract_evidence(lines: list[str], snippet: str) -> str:
    for l in lines:
        if snippet[:6] in l or (len(snippet) > 6 and snippet[2:10] in l):
            return l.strip()[:200]
    return snippet[:200]


def _score_line(line: str) -> float:
    """Higher score = more likely to be substantive content."""
    line = line.strip()
    score = len(line) * 0.1
    score += len(re.findall(r"[一-鿿]", line)) * 0.3
    for kw in ["风险", "必须", "需要", "确认", "决定", "变更", "问题"]:
        if kw in line:
            score += 5.0
            break
    return score


def _parse_participants(text: str) -> list[str]:
    seen: set[str] = set()
    people: list[str] = []
    for line in text.split("\n"):
        m = _PARTICIPANT_PATTERN.match(line.strip())
        if m:
            name = m.group(1)
            if name not in seen and name not in _EXCLUDE_FILLER:
                seen.add(name)
                people.append(name)
    return people


def mock_analyze(transcript_text: str, meeting_title: str, participants: str = "") -> AnalysisResult:
    """Rule-based fallback when the AI model endpoint is unavailable."""
    lines = [l.strip() for l in transcript_text.split("\n") if l.strip()]
    if not lines:
        return AnalysisResult(meeting_summary=f"会议「{meeting_title}」暂无转写内容可供分析。")

    full_text = "\n".join(lines)
    parsed_people = _parse_participants(transcript_text)
    all_participants = list(dict.fromkeys(parsed_people + [p.strip() for p in participants.split(",") if p.strip()]))

    # Scoring lines
    scored = sorted([(i, _score_line(l), l) for i, l in enumerate(lines)], key=lambda x: -x[1])
    top_indices = sorted([s[0] for s in scored[:6]])
    summary_candidates = [lines[i] for i in top_indices]
    meeting_summary = (
        f"「{meeting_title}」讨论了{'、'.join(t[:30] for t in summary_candidates[:3])}。"
        f"参会人 {'、'.join(all_participants) if all_participants else '未知'}。"
    )[:300]

    def _deduplicate_items(item_list: list[dict], key_field: str) -> list[dict]:
        seen: set[str] = set()
        result: list[dict] = []
        for item in item_list:
            norm = item[key_field].strip()
            if norm and norm not in seen:
                seen.add(norm)
                result.append(item)
        return result

    # Extract action items
    action_items: list[dict] = []
    for line in lines:
        if any(p.search(line) for p in _ACTION_PATTERNS):
            task = line.strip()[:120]
            action_items.append({
                "task": task,
                "owner": _extract_owner(line) or (all_participants[0] if all_participants else ""),
                "deadline": _extract_deadline(line),
                "priority": _estimate_priority(line),
                "status": "pending",
                "evidence": line.strip()[:200],
            })

    # Extract risks
    risks: list[dict] = []
    for line in lines:
        if any(p.search(line) for p in _RISK_PATTERNS):
            risks.append({
                "risk": line.strip()[:150],
                "level": "high" if any(kw in line for kw in {"超过", "必须", "紧急", "block"}) else
                         "medium" if any(kw in line for kw in {"压力", "不够", "困难"}) else "low",
                "suggestion": "建议在后续会议中确认应对措施和责任人。",
                "evidence": line.strip()[:200],
            })

    # Extract requirement changes
    changes: list[dict] = []
    for line in lines:
        if any(p.search(line) for p in _CHANGE_PATTERNS):
            is_new = any(kw in line for kw in {"新增", "新需求", "额外"})
            changes.append({
                "change": line.strip()[:150],
                "type": "new" if is_new else "modified",
                "impact_on_scope": "可能影响项目排期和资源分配，建议评估后再确认。",
                "need_confirmation": True,
                "evidence": line.strip()[:200],
            })

    # Extract key decisions
    decisions: list[dict] = []
    for line in lines:
        if any(p.search(line) for p in _DECISION_PATTERNS):
            owner = _extract_owner(line)
            decisions.append({
                "decision": line.strip()[:150],
                "owner": owner or (all_participants[0] if all_participants else ""),
                "impact": "对项目后续执行产生影响。",
                "evidence": line.strip()[:200],
            })

    # Extract open questions
    questions: list[dict] = []
    for line in lines:
        if any(p.search(line) for p in _QUESTION_PATTERNS):
            questions.append({
                "question": line.strip()[:200],
                "owner": _extract_owner(line) or (all_participants[0] if all_participants else ""),
                "reason": "需要在下次会议前确认以便推进项目。",
            })

    # Next meeting topics from pending items
    next_topics: list[str] = []
    for a in action_items[:3]:
        next_topics.append(f"跟进：{a['task'][:40]}")
    if not next_topics:
        next_topics = [f"「{meeting_title}」后续安排确认", "里程碑进度检视"]

    result = AnalysisResult(
        meeting_summary=meeting_summary,
        action_items=_deduplicate_items(action_items, "task"),
        risks=_deduplicate_items(risks, "risk"),
        requirement_changes=_deduplicate_items(changes, "change"),
        key_decisions=_deduplicate_items(decisions, "decision"),
        open_questions=_deduplicate_items(questions, "question"),
        next_meeting_topics=next_topics[:6],
    )
    return result


# ── Primary analyzer with fallback ──────────────────────────────────

def analyze(transcript_text: str, meeting_title: str, participants: str = "") -> AnalysisResult:
    settings = get_settings()
    client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )

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

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )
        raw_content = response.choices[0].message.content
        data = json.loads(raw_content or "{}")
        return AnalysisResult.model_validate(data)
    except Exception as exc:
        logger.warning("AI model call failed (%s), falling back to keyword-based mock analyzer.", exc)
        return mock_analyze(transcript_text, meeting_title, participants)

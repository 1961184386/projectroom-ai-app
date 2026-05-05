"""Demo data seed script. Run once to populate demo project, meetings, and analyses."""

import os
import sys
from datetime import datetime

from sqlmodel import SQLModel, Session, select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.database import engine
from app.models import Meeting, MeetingAnalysis, Project

PROJECT_NAME = "智慧零售数字化升级"

PROJECT_PAYLOAD = {
    "name": PROJECT_NAME,
    "client_name": "某连锁零售集团",
    "description": "将线下门店 POS、库存、会员系统与线上电商平台打通，实现统一数据中台。",
    "current_stage": "开发中",
    "owner_name": "李明",
    "goal": "2026 年 Q3 上线统一数据中台，覆盖 200 家门店，日订单处理能力达到 10 万单。",
    "acceptance_criteria": "门店 POS 数据延迟 < 30s，会员积分跨渠道实时同步，系统可用性 99.9%。",
}

MEETING_FIXTURES = [
    {
        "meeting": {
            "title": "项目启动会",
            "platform": "tencent",
            "meeting_time": "2026-04-10T09:00:00",
            "participants": "李明（PM）、张伟（技术负责人）、王芳（客户方项目经理）、陈静（UI/UX）",
            "agenda": "项目背景介绍、技术方案确认、里程碑划定",
            "transcript_text": """王芳：各位好，今天启动会的主要目的是把整个项目的范围、技术路线和里程碑过一遍。我们集团这次数字化升级预算是 500 万，希望今年 Q3 能上线。

李明：好的，我们已经完成了需求调研。核心是三块：POS 系统接入、库存中台和会员系统统一。技术上我们打算用微服务架构，数据层用 Kafka 做消息总线。

张伟：对，我补充一下技术方案。POS 接入这块，各门店的 POS 系统型号不统一，有海信的也有神码的，我们需要写适配层。这个工作量不小，预计要 6 周。

王芳：6 周？这有点长，我们 4 月底之前希望能看到至少一个门店的试点。

张伟：4 月底太紧了，我们可以争取在 5 月中做一个 POC，覆盖 2 家试点门店。

李明：这样，我们把里程碑定为：5 月 15 日 POC 完成，6 月 30 日完成所有门店适配层，8 月 31 日全部上线。

王芳：8 月底可以，但我们希望留 1 个月的 UAT，所以上线日期改到 9 月 30 日。

陈静：UI 设计这边，我需要先出门店管理后台的原型，计划本周五给大家确认。

李明：好的，那我们今天确认的主要事项：技术方案用微服务+Kafka，里程碑改为 POC 5 月 15 日、全量上线 9 月 30 日。王芳这边周一前确认接受 POC 时间节点。

王芳：收到，我内部对齐一下，周一给你回复。""",
        },
        "analysis": {
            "meeting_summary": "项目启动会确认了智慧零售数字化升级的整体技术方案和里程碑。技术路线采用微服务架构+Kafka消息总线。由于各门店POS系统型号不统一需要编写适配层，里程碑调整为：5月15日完成2家试点门店POC，9月30日全量上线（保留1个月UAT时间）。陈静本周五提交门店管理后台原型设计。",
            "key_decisions": [
                {
                    "decision": "技术架构采用微服务+Kafka消息总线",
                    "owner": "张伟",
                    "impact": "决定了整个系统的扩展性和数据流向",
                    "evidence": "技术上我们打算用微服务架构，数据层用 Kafka 做消息总线",
                },
                {
                    "decision": "里程碑调整为 POC 5月15日、全量上线9月30日",
                    "owner": "李明",
                    "impact": "延长了原计划周期，为POS适配工作预留了充足时间",
                    "evidence": "上线日期改到 9 月 30 日",
                },
            ],
            "action_items": [
                {
                    "task": "完成2家试点门店POS适配层开发",
                    "owner": "张伟",
                    "deadline": "2026-05-15",
                    "priority": "high",
                    "status": "pending",
                    "evidence": "5 月中做一个 POC，覆盖 2 家试点门店",
                },
                {
                    "task": "提交门店管理后台原型设计",
                    "owner": "陈静",
                    "deadline": "2026-04-12",
                    "priority": "medium",
                    "status": "pending",
                    "evidence": "计划本周五给大家确认",
                },
                {
                    "task": "确认接受POC时间节点（5月15日）",
                    "owner": "王芳",
                    "deadline": "2026-04-13",
                    "priority": "high",
                    "status": "pending",
                    "evidence": "周一给你回复",
                },
            ],
            "requirement_changes": [
                {
                    "change": "上线日期从8月31日调整为9月30日，增加1个月UAT",
                    "type": "modified",
                    "impact_on_scope": "项目周期延长1个月，需同步调整合同交付日期",
                    "need_confirmation": True,
                    "evidence": "上线日期改到 9 月 30 日",
                }
            ],
            "risks": [
                {
                    "risk": "各门店POS系统型号不统一（海信、神码等），适配工作量存在不确定性",
                    "level": "high",
                    "suggestion": "尽早完成所有POS型号清单梳理，提前评估适配工作量；POC阶段选择最复杂的两种型号验证",
                    "evidence": "POS 系统型号不统一，有海信的也有神码的，我们需要写适配层",
                },
                {
                    "risk": "客户方内部对齐周期可能影响POC节点",
                    "level": "medium",
                    "suggestion": "周一前跟进王芳的内部确认结果，若有变化提前预警",
                    "evidence": "我内部对齐一下，周一给你回复",
                },
            ],
            "open_questions": [
                {
                    "question": "客户方是否正式确认接受POC时间节点（5月15日）？",
                    "owner": "王芳",
                    "reason": "影响整体里程碑计划，需在周一前确认",
                },
                {
                    "question": "所有门店POS系统的型号清单是否已收集完整？",
                    "owner": "张伟",
                    "reason": "清单不完整会导致适配工作量估算不准确",
                },
            ],
            "next_meeting_topics": ["POC方案细化（门店选择、验收标准）", "POS型号清单确认", "UI原型审查"],
        },
    },
    {
        "meeting": {
            "title": "技术方案评审",
            "platform": "dingtalk",
            "meeting_time": "2026-04-22T14:00:00",
            "participants": "李明（PM）、张伟（技术负责人）、赵强（后端架构师）、刘洋（前端负责人）",
            "agenda": "微服务拆分方案确认、数据库选型、接口规范",
            "transcript_text": """张伟：今天主要评审一下微服务的拆分方案。我们计划拆成 4 个服务：POS 接入服务、库存服务、会员服务和订单服务。

赵强：我有个问题，POS 接入服务和订单服务之间的数据流怎么设计？如果 POS 直接写订单，会不会有延迟问题？

张伟：POS 数据先进 Kafka，订单服务订阅消费。延迟主要取决于 Kafka 的吞吐量，我们设计的是 SLA 30 秒以内。

赵强：30 秒可以接受。但我担心的是，如果 Kafka 消费积压了怎么办？需要有监控和告警。

李明：这个列为必须要做的，告警这块你来负责方案吗？

赵强：可以，我这周出监控方案。

刘洋：前端这边，我们用 React + Ant Design Pro，后台管理界面。有一点想确认，门店员工用的是 PC 端还是移动端？

李明：主要是 PC 端，但库存盘点的时候可能用平板，所以要做响应式。

刘洋：响应式没问题，但 Ant Design Pro 对移动端不太友好，我建议关键操作页面单独做移动端适配。

赵强：数据库选型，我们讨论过用 PostgreSQL 作为主库，Redis 做缓存。但会员数据量可能比较大，要不要考虑分库分表？

张伟：MVP 阶段先不做分库分表，用 PG 的分区表功能就够了，后续根据数据量再决定。

李明：好，今天确认的：微服务 4 个，监控告警赵强负责本周完成，前端响应式适配关键操作页面，数据库 PG+Redis，MVP 不做分库分表。""",
        },
        "analysis": {
            "meeting_summary": "技术方案评审会确认了微服务拆分为4个服务（POS接入、库存、会员、订单），数据流通过Kafka异步传递，SLA目标30秒内。确认PostgreSQL+Redis数据库方案，MVP阶段使用PG分区表而非分库分表。前端采用React+Ant Design Pro，关键操作页面需单独做移动端适配。赵强负责本周完成监控告警方案。",
            "key_decisions": [
                {
                    "decision": "微服务拆分为4个：POS接入、库存、会员、订单服务",
                    "owner": "张伟",
                    "impact": "确定了系统边界和团队分工",
                    "evidence": "我们计划拆成 4 个服务：POS 接入服务、库存服务、会员服务和订单服务",
                },
                {
                    "decision": "MVP阶段使用PG分区表，不做分库分表",
                    "owner": "张伟",
                    "impact": "降低了MVP复杂度，可根据后续数据量决定是否扩展",
                    "evidence": "MVP 阶段先不做分库分表，用 PG 的分区表功能就够了",
                },
                {
                    "decision": "前端响应式适配，关键操作页面单独做移动端适配",
                    "owner": "刘洋",
                    "impact": "保证平板端库存盘点体验",
                    "evidence": "关键操作页面单独做移动端适配",
                },
            ],
            "action_items": [
                {
                    "task": "完成Kafka监控和告警方案文档",
                    "owner": "赵强",
                    "deadline": "2026-04-27",
                    "priority": "high",
                    "status": "pending",
                    "evidence": "告警这块你来负责方案吗",
                },
                {
                    "task": "确认关键操作页面列表，制定移动端适配方案",
                    "owner": "刘洋",
                    "deadline": "2026-04-30",
                    "priority": "medium",
                    "status": "pending",
                    "evidence": "关键操作页面单独做移动端适配",
                },
            ],
            "requirement_changes": [
                {
                    "change": "关键操作页面需单独做移动端适配（非纯响应式）",
                    "type": "new",
                    "impact_on_scope": "增加前端开发工作量，需重新评估前端时间线",
                    "need_confirmation": True,
                    "evidence": "关键操作页面单独做移动端适配",
                }
            ],
            "risks": [
                {
                    "risk": "Kafka消费积压可能导致数据延迟超出30秒SLA",
                    "level": "high",
                    "suggestion": "尽快完成监控告警方案，设置积压阈值告警；同时制定消费积压应急预案",
                    "evidence": "如果 Kafka 消费积压了怎么办？需要有监控和告警",
                },
                {
                    "risk": "移动端适配工作量评估不足，可能影响前端排期",
                    "level": "medium",
                    "suggestion": "本周内确认需要适配的页面清单，重新评估前端排期",
                    "evidence": "Ant Design Pro 对移动端不太友好",
                },
            ],
            "open_questions": [
                {
                    "question": "哪些页面属于「关键操作页面」需要移动端适配？",
                    "owner": "刘洋",
                    "reason": "影响前端工作量评估和排期",
                },
                {
                    "question": "Kafka消费积压的告警阈值如何定义？",
                    "owner": "赵强",
                    "reason": "需要在监控方案中明确SLA边界",
                },
            ],
            "next_meeting_topics": ["监控告警方案评审", "前端移动端适配页面清单确认", "POC门店选择"],
        },
    },
    {
        "meeting": {
            "title": "POC阶段复盘",
            "platform": "tencent",
            "meeting_time": "2026-05-03T10:00:00",
            "participants": "李明（PM）、张伟（技术负责人）、王芳（客户方）、赵强（后端架构师）",
            "agenda": "POC结果汇报、遇到的问题、调整计划",
            "transcript_text": """李明：今天复盘一下 POC 的结果。张伟，先说说技术上的情况。

张伟：总体来说 POC 算是完成了，但遇到了几个问题。第一，海信 POS 的接口文档有误，实际数据格式跟文档不一样，我们花了额外 4 天时间反复对接。

王芳：这个是我们内部协调问题，已经投诉给海信了，后续他们会提供准确文档。

张伟：第二个问题是数据量比预期大。一家门店一天的交易流水就有 8 万条，两家店跑下来 Kafka 的消费有点压力，延迟峰值达到了 45 秒，超过了 30 秒的 SLA。

赵强：我们已经在优化消费者的批处理逻辑，另外也在评估是否需要增加 Kafka 分区数量。预计下周可以把延迟稳定在 30 秒以内。

李明：这个必须在 5 月 15 日 POC 正式验收前解决。

王芳：还有一个问题，客户提出希望能在门店看到实时库存，不光是每天同步一次，而是交易完成后 5 分钟内更新。这个是新需求，之前没有提到。

李明：5 分钟内更新？这需要评估工作量。张伟，大概多少时间？

张伟：如果是实时库存，需要改库存服务的设计，从批量更新改成事件驱动更新。工作量大概要 3 周左右。

李明：这个需求变更需要评估对整体排期的影响，我们下次开会前给出影响评估。

王芳：好的，但这个对我们很重要，希望能包含在最终交付里。

赵强：另外说一下，我发现当前的会员数据结构跟客户的 CRM 系统有字段不匹配的问题，需要做数据映射。这个之前没有识别到，是一个遗漏点。

李明：这个记录为风险，赵强这周出数据映射方案。""",
        },
        "analysis": {
            "meeting_summary": "POC阶段复盘会揭示了三个关键问题：海信POS接口文档不准确导致额外4天消耗、Kafka延迟峰值45秒超出30秒SLA目标、会员数据与CRM字段不匹配。客户提出新需求：交易后5分钟内实时更新库存（原为每天同步），需3周工作量且影响整体排期。赵强本周完成数据映射方案，Kafka优化预计下周达标。",
            "key_decisions": [
                {
                    "decision": "Kafka延迟问题必须在5月15日POC验收前解决",
                    "owner": "赵强",
                    "impact": "是POC验收的硬性条件",
                    "evidence": "这个必须在 5 月 15 日 POC 正式验收前解决",
                },
                {
                    "decision": "实时库存需求（5分钟内更新）需要评估对排期的影响再决定是否纳入范围",
                    "owner": "李明",
                    "impact": "若纳入，库存服务需要从批量更新改为事件驱动，工作量约3周",
                    "evidence": "这个需求变更需要评估对整体排期的影响",
                },
            ],
            "action_items": [
                {
                    "task": "优化Kafka批处理逻辑，将延迟稳定在30秒以内",
                    "owner": "赵强",
                    "deadline": "2026-05-10",
                    "priority": "high",
                    "status": "pending",
                    "evidence": "预计下周可以把延迟稳定在 30 秒以内",
                },
                {
                    "task": "完成会员数据与CRM字段映射方案",
                    "owner": "赵强",
                    "deadline": "2026-05-08",
                    "priority": "high",
                    "status": "pending",
                    "evidence": "赵强这周出数据映射方案",
                },
                {
                    "task": "评估实时库存需求对整体排期的影响",
                    "owner": "李明",
                    "deadline": "2026-05-08",
                    "priority": "high",
                    "status": "pending",
                    "evidence": "下次开会前给出影响评估",
                },
            ],
            "requirement_changes": [
                {
                    "change": "新增实时库存需求：交易完成后5分钟内更新库存，原为每日批量同步",
                    "type": "new",
                    "impact_on_scope": "库存服务需从批量更新改为事件驱动设计，估计增加3周工作量，影响整体交付节点",
                    "need_confirmation": True,
                    "evidence": "希望能在门店看到实时库存，交易完成后 5 分钟内更新",
                },
                {
                    "change": "会员数据结构与客户CRM系统存在字段不匹配，需要数据映射层",
                    "type": "new",
                    "impact_on_scope": "增加数据迁移和映射工作量，可能影响会员模块排期",
                    "need_confirmation": False,
                    "evidence": "会员数据结构跟客户的 CRM 系统有字段不匹配的问题，需要做数据映射",
                },
            ],
            "risks": [
                {
                    "risk": "Kafka延迟峰值45秒超出30秒SLA，POC验收存在风险",
                    "level": "high",
                    "suggestion": "赵强下周完成批处理优化并验证，若不达标需立即升级处理",
                    "evidence": "延迟峰值达到了 45 秒，超过了 30 秒的 SLA",
                },
                {
                    "risk": "实时库存新需求3周工作量可能导致9月30日上线节点延期",
                    "level": "high",
                    "suggestion": "李明5月8日前完成排期影响评估，与王芳对齐是否需要调整上线时间或砍掉其他功能",
                    "evidence": "工作量大概要 3 周左右",
                },
                {
                    "risk": "会员数据字段不匹配是之前遗漏的风险，可能还有其他类似隐患",
                    "level": "medium",
                    "suggestion": "本周对所有外部系统集成点做一次全面的接口文档核查",
                    "evidence": "这个之前没有识别到，是一个遗漏点",
                },
            ],
            "open_questions": [
                {
                    "question": "实时库存需求是否正式纳入本次交付范围？对应需要调整哪些里程碑？",
                    "owner": "李明",
                    "reason": "影响整体排期和合同交付范围",
                },
                {
                    "question": "除会员数据外，还有哪些外部系统集成存在文档不准确或字段不匹配的风险？",
                    "owner": "张伟",
                    "reason": "避免类似POC阶段的突发问题再次发生",
                },
            ],
            "next_meeting_topics": ["Kafka优化结果验证", "实时库存需求范围决策", "会员数据映射方案评审", "POC验收准备"],
        },
    },
]


def ensure_sqlite_tables() -> None:
    settings = get_settings()
    if settings.database_url.startswith("sqlite"):
        SQLModel.metadata.create_all(engine)


def project_exists(session: Session) -> bool:
    statement = select(Project).where(Project.name == PROJECT_NAME)
    return session.exec(statement).first() is not None


def create_project(session: Session) -> Project:
    now = datetime.utcnow()
    project = Project(**PROJECT_PAYLOAD, created_at=now, updated_at=now)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def create_meeting(session: Session, project_id, fixture: dict) -> Meeting:
    now = datetime.utcnow()
    meeting_payload = dict(fixture["meeting"])
    meeting_payload["meeting_time"] = datetime.fromisoformat(meeting_payload["meeting_time"])
    meeting = Meeting(
        **meeting_payload,
        project_id=project_id,
        analysis_status="done",
        created_at=now,
        updated_at=now,
    )
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    return meeting


def create_analysis(session: Session, meeting_id, fixture: dict) -> None:
    now = datetime.utcnow()
    analysis = MeetingAnalysis(
        **fixture["analysis"],
        meeting_id=meeting_id,
        created_at=now,
        updated_at=now,
    )
    session.add(analysis)
    session.commit()


def main() -> None:
    ensure_sqlite_tables()

    with Session(engine) as session:
        if project_exists(session):
            print(f"Demo project '{PROJECT_NAME}' already exists. Skipping seed.")
            return

        project = create_project(session)
        for fixture in MEETING_FIXTURES:
            meeting = create_meeting(session, project.id, fixture)
            create_analysis(session, meeting.id, fixture)

        print(f"Seeded demo project '{PROJECT_NAME}' with {len(MEETING_FIXTURES)} meetings and analyses.")


if __name__ == "__main__":
    main()

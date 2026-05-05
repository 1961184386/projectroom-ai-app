import { ChangeTable } from "@/components/analysis/change-table";
import { DecisionList } from "@/components/analysis/decision-list";
import { NextTopicsCard } from "@/components/analysis/next-topics-card";
import { OpenQuestionsList } from "@/components/analysis/open-questions-list";
import { RiskTable } from "@/components/analysis/risk-table";
import { SummaryCard } from "@/components/analysis/summary-card";
import { TodoTable } from "@/components/analysis/todo-table";
import { MeetingAnalysis } from "@/lib/types";

export function AnalysisResult({ analysis }: { analysis: MeetingAnalysis }) {
  return (
    <div className="space-y-6">
      <SummaryCard summary={analysis.meeting_summary} />
      <TodoTable items={analysis.action_items} />
      <RiskTable items={analysis.risks} />
      <ChangeTable items={analysis.requirement_changes} />
      <DecisionList items={analysis.key_decisions} />
      <OpenQuestionsList items={analysis.open_questions} />
      <NextTopicsCard topics={analysis.next_meeting_topics} />
    </div>
  );
}

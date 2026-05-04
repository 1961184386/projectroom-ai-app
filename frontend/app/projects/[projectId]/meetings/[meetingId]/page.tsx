import { MeetingDetailClient } from "@/components/meeting/meeting-detail-client";

export default function MeetingDetailPage({
  params
}: {
  params: { projectId: string; meetingId: string };
}) {
  return <MeetingDetailClient projectId={params.projectId} meetingId={params.meetingId} />;
}

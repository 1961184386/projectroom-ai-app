import { CreateMeetingForm } from "@/components/meeting/create-meeting-form";

export default function NewMeetingPage({
  params
}: {
  params: { projectId: string };
}) {
  return <CreateMeetingForm projectId={params.projectId} />;
}

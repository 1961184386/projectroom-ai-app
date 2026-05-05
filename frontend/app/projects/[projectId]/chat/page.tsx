import { ChatClient } from "@/components/chat/chat-client";

export default function ProjectChatPage({
  params,
}: {
  params: { projectId: string };
}) {
  return <ChatClient projectId={params.projectId} />;
}

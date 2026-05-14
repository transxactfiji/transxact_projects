import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import MessagesView from "./messagesView";
import { listMessagingPageData } from "@/services/message.service";

interface MessagesPageProps {
  searchParams: Promise<{ conversationId?: string }>;
}

export const dynamic = "force-dynamic";

export default async function MessagesPage(
  props: MessagesPageProps,
): Promise<ReactElement> {
  const params = await props.searchParams;
  const conversationId = Number(params.conversationId);
  const activeConversationId =
    Number.isInteger(conversationId) && conversationId > 0
      ? conversationId
      : undefined;

  let data: Awaited<ReturnType<typeof listMessagingPageData>>;
  try {
    data = await listMessagingPageData(activeConversationId);
  } catch (error) {
    if (error instanceof Error && error.message === "You must be signed in to continue.") {
      redirect("/auth");
    }

    throw error;
  }

  return (
    <MessagesView
      currentUserId={data.currentUserId}
      currentUserRole={data.currentUserRole}
      userOptions={data.userOptions}
      conversations={data.conversations}
      activeConversation={data.activeConversation}
    />
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import {
  FiArchive,
  FiCheck,
  FiFlag,
  FiMessageSquare,
  FiSend,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import AppButton from "@/app/ui/appButton";
import InlineStatus from "@/app/ui/inlineStatus";
import {
  blockUserForMessaging,
  createOrOpenConversation,
  deleteDirectMessage,
  editDirectMessage,
  markConversationRead,
  reportConversation,
  reportMessage,
  sendDirectMessage,
  setConversationArchived,
  type ConversationDetail,
  type ConversationSummary,
  type UserOption,
  unblockUserForMessaging,
} from "@/services/message.service";

interface MessagesViewProps {
  currentUserId: number;
  currentUserRole: "admin" | "member";
  userOptions: UserOption[];
  conversations: ConversationSummary[];
  activeConversation: ConversationDetail | null;
}

interface StatusState {
  tone: "success" | "error" | "info";
  message: string;
}

function formatDateTime(isoValue: string): string {
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
}

export default function MessagesView({
  currentUserRole,
  userOptions,
  conversations,
  activeConversation,
}: MessagesViewProps): ReactElement {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState<string>(
    userOptions[0] ? String(userOptions[0].id) : "",
  );
  const [messageBody, setMessageBody] = useState("");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [status, setStatus] = useState<StatusState | null>(null);

  const activeConversationId = activeConversation?.conversationId ?? null;
  const hasConversation = Boolean(activeConversation);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    void markConversationRead(activeConversationId).catch(() => {
      // Best effort for real-time unread updates.
    });
  }, [activeConversationId]);

  const canSendInConversation = useMemo(() => {
    if (!activeConversation) {
      return false;
    }

    return !activeConversation.isBlockedByCurrentUser && !activeConversation.isBlockedByOtherUser;
  }, [activeConversation]);

  const openConversation = (conversationId: number): void => {
    router.push(`/messages?conversationId=${conversationId}`);
  };

  const handleStartConversation = async (): Promise<void> => {
    const nextRecipientId = Number(recipientId);
    if (!Number.isInteger(nextRecipientId) || nextRecipientId <= 0) {
      const message = "Select a user to start a conversation.";
      setStatus({ tone: "error", message });
      toast.error(message);
      return;
    }

    setIsCreatingConversation(true);
    try {
      const conversationId = await createOrOpenConversation(nextRecipientId);
      setStatus({ tone: "success", message: "Conversation ready." });
      router.push(`/messages?conversationId=${conversationId}`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to open conversation.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!activeConversation) {
      return;
    }

    if (!canSendInConversation) {
      const message = "Messaging is unavailable because this conversation is blocked.";
      setStatus({ tone: "error", message });
      toast.error(message);
      return;
    }

    setIsSending(true);
    try {
      await sendDirectMessage(activeConversation.conversationId, messageBody);
      setMessageBody("");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send message.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const beginEditingMessage = (messageId: number, currentBody: string): void => {
    setEditingMessageId(messageId);
    setEditingBody(currentBody);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingMessageId) {
      return;
    }

    try {
      await editDirectMessage(editingMessageId, editingBody);
      setEditingMessageId(null);
      setEditingBody("");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to edit message.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleDeleteMessage = async (messageId: number): Promise<void> => {
    try {
      await deleteDirectMessage(messageId);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete message.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleArchiveConversation = async (): Promise<void> => {
    if (!activeConversation) {
      return;
    }

    try {
      await setConversationArchived(activeConversation.conversationId, true);
      setStatus({ tone: "success", message: "Conversation archived." });
      router.push("/messages");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to archive conversation.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleBlockToggle = async (): Promise<void> => {
    if (!activeConversation) {
      return;
    }

    try {
      if (activeConversation.isBlockedByCurrentUser) {
        await unblockUserForMessaging(activeConversation.participantUserId);
        setStatus({ tone: "success", message: "User unblocked." });
      } else {
        await blockUserForMessaging(activeConversation.participantUserId);
        setStatus({ tone: "success", message: "User blocked and conversation hidden." });
        router.push("/messages");
      }

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update block state.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleReportConversation = async (): Promise<void> => {
    if (!activeConversation) {
      return;
    }

    const reason = window.prompt("Describe the issue with this conversation:");
    if (!reason) {
      return;
    }

    try {
      await reportConversation(activeConversation.conversationId, reason);
      setStatus({ tone: "success", message: "Report submitted to admin review queue." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit report.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleReportMessage = async (messageId: number): Promise<void> => {
    const reason = window.prompt("Describe the issue with this message:");
    if (!reason) {
      return;
    }

    try {
      await reportMessage(messageId, reason);
      setStatus({ tone: "success", message: "Message report submitted." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit message report.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  return (
    <section className="workflow-stack">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Start or open a conversation</h2>
            <p>Direct 1:1 messaging is available for all active users.</p>
          </div>
          {currentUserRole === "admin" ? (
            <Link
              href="/admin/reports"
              className="text-link"
            >
              <span className="icon-with-label">
                <FiFlag aria-hidden="true" />
                <span>Review reports</span>
              </span>
            </Link>
          ) : null}
        </div>
        <div className="workflow-form">
          <div className="field-wrap">
            <label
              htmlFor="recipient"
              className="field-label"
            >
              Recipient
            </label>
            <select
              id="recipient"
              className="text-input"
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              disabled={isCreatingConversation || userOptions.length === 0}
            >
              {userOptions.length === 0 ? <option value="">No users available</option> : null}
              {userOptions.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <AppButton
            onClick={() => void handleStartConversation()}
            isLoading={isCreatingConversation}
            loadingLabel="Opening..."
            disabled={userOptions.length === 0}
            startIcon={<FiMessageSquare aria-hidden="true" />}
          >
            Open conversation
          </AppButton>
        </div>
        <InlineStatus
          tone={status?.tone ?? "info"}
          message={status?.message ?? null}
        />
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Conversations</h2>
            <p>Sorted by most recent activity.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Participant</th>
                <th scope="col">Last message</th>
                <th scope="col">Unread</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {conversations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="empty-row"
                  >
                    No conversations yet.
                  </td>
                </tr>
              ) : (
                conversations.map((item) => (
                  <tr
                    key={item.conversationId}
                    className={item.conversationId === activeConversationId ? "active-row" : ""}
                    onClick={() => openConversation(item.conversationId)}
                  >
                    <td>{item.participantLabel}</td>
                    <td>{item.lastMessagePreview}</td>
                    <td>{item.unreadCount}</td>
                    <td>{item.lastMessageAt ? formatDateTime(item.lastMessageAt) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>
              {hasConversation
                ? `Conversation with ${activeConversation?.participantLabel}`
                : "Select a conversation"}
            </h2>
            <p>Edit or delete your own messages. Report abusive content to admins.</p>
          </div>
          {activeConversation ? (
            <div className="button-row">
              <AppButton
                variant="secondary"
                onClick={() => void handleArchiveConversation()}
                startIcon={<FiArchive aria-hidden="true" />}
              >
                Archive
              </AppButton>
              <AppButton
                variant="secondary"
                onClick={() => void handleBlockToggle()}
                startIcon={
                  activeConversation.isBlockedByCurrentUser ? (
                    <FiUserCheck aria-hidden="true" />
                  ) : (
                    <FiUserX aria-hidden="true" />
                  )
                }
              >
                {activeConversation.isBlockedByCurrentUser ? "Unblock" : "Block user"}
              </AppButton>
              <AppButton
                variant="secondary"
                onClick={() => void handleReportConversation()}
                startIcon={<FiFlag aria-hidden="true" />}
              >
                Report conversation
              </AppButton>
            </div>
          ) : null}
        </div>

        {!activeConversation ? (
          <InlineStatus
            tone="info"
            message="Choose a conversation to view messages."
          />
        ) : (
          <>
            {(activeConversation.isBlockedByCurrentUser ||
              activeConversation.isBlockedByOtherUser) && (
              <InlineStatus
                tone="error"
                message="Messaging is blocked in this conversation."
              />
            )}
            <div className="messages-thread">
              {activeConversation.messages.length === 0 ? (
                <p className="empty-row">No messages yet.</p>
              ) : (
                activeConversation.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`message-bubble ${message.isOwn ? "is-own" : "is-peer"}`}
                  >
                    <p className="message-meta">
                      <strong>{message.senderLabel}</strong> ·{" "}
                      {formatDateTime(message.createdAt)}
                      {message.isEdited && !message.isDeleted ? " · edited" : ""}
                      {message.isOwn && message.readByOtherUser ? " · read" : ""}
                    </p>

                    {editingMessageId === message.id ? (
                      <div className="message-edit-wrap">
                        <textarea
                          className="text-input workflow-textarea"
                          value={editingBody}
                          onChange={(event) => setEditingBody(event.target.value)}
                        />
                        <div className="button-row">
                          <AppButton
                            variant="secondary"
                            onClick={() => void handleSaveEdit()}
                            startIcon={<FiCheck aria-hidden="true" />}
                          >
                            Save
                          </AppButton>
                          <AppButton
                            variant="ghost"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditingBody("");
                            }}
                            startIcon={<FiX aria-hidden="true" />}
                          >
                            Cancel
                          </AppButton>
                        </div>
                      </div>
                    ) : (
                      <p>{message.body}</p>
                    )}

                    <div className="button-row message-actions">
                      {message.isOwn && !message.isDeleted ? (
                        <>
                          <button
                            type="button"
                            className="text-link-button"
                            onClick={() => beginEditingMessage(message.id, message.body)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-link-button"
                            onClick={() => void handleDeleteMessage(message.id)}
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                      {!message.isDeleted ? (
                        <button
                          type="button"
                          className="text-link-button"
                          onClick={() => void handleReportMessage(message.id)}
                        >
                          Report
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="workflow-form">
              <div className="field-wrap workflow-span-all">
                <label
                  htmlFor="new-message"
                  className="field-label"
                >
                  New message
                </label>
                <textarea
                  id="new-message"
                  className="text-input workflow-textarea"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  disabled={!canSendInConversation || isSending}
                  placeholder="Write a message..."
                />
              </div>
              <AppButton
                onClick={() => void handleSendMessage()}
                isLoading={isSending}
                loadingLabel="Sending..."
                disabled={!canSendInConversation}
                startIcon={<FiSend aria-hidden="true" />}
              >
                Send
              </AppButton>
            </div>
          </>
        )}
      </section>
    </section>
  );
}

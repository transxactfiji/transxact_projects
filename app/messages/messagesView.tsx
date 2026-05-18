"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { useSseRefresh } from "@/app/ui/useSseRefresh";
import {
  FiArchive,
  FiCheck,
  FiEdit2,
  FiFlag,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiSend,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import AppButton from "@/app/ui/appButton";
import PageHeading from "@/app/ui/pageHeading";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import InlineStatus from "@/app/ui/inlineStatus";
import { getInitials, getAvatarColorByUserId } from "@/lib/utils";
import { MESSAGE_AVATAR_COLORS } from "@/lib/constants";
import {
  blockUserForMessaging,
  createOrOpenConversation,
  deleteDirectMessage,
  editDirectMessage,
  markConversationRead,
  searchUsers,
  sendDirectMessage,
  setConversationArchived,
  type ConversationDetail,
  type ConversationSummary,
  type UserOption,
  unblockUserForMessaging,
} from "@/services/message.service";
import { reportConversation, reportMessage } from "@/services/report.service";

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

function formatTime(isoValue: string): string {
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return parsed.toLocaleDateString([], { weekday: "short" });
  return parsed.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFullDateTime(isoValue: string): string {
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString();
}

const channelBtnClass = "inline-flex items-center justify-center w-7 h-7 border-0 rounded bg-transparent text-muted-foreground cursor-pointer transition-colors hover:bg-accent hover:text-foreground";
const channelBtnDangerClass = "inline-flex items-center justify-center w-7 h-7 border-0 rounded bg-transparent text-destructive cursor-pointer transition-colors hover:bg-accent hover:text-foreground";
const actionBtnClass = "inline-flex items-center justify-center w-6 h-6 rounded border-0 bg-transparent text-muted-foreground cursor-pointer transition-colors hover:bg-accent hover:text-foreground";
const actionBtnDangerClass = "inline-flex items-center justify-center w-6 h-6 rounded border-0 bg-transparent text-destructive cursor-pointer transition-colors hover:bg-destructive/10";

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
  const [convSearch, setConvSearch] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserOption[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const userSearchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversationId = activeConversation?.conversationId ?? null;
  const hasConversation = Boolean(activeConversation);

  const filteredConversations = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.participantLabel.toLowerCase().includes(q) ||
      (c.lastMessagePreview?.toLowerCase().includes(q) ?? false)
    );
  }, [conversations, convSearch]);

  useEffect(() => {
    if (!activeConversationId) return;
    void markConversationRead(activeConversationId).catch(() => {});
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  useEffect(() => {
    if (hasConversation) textareaRef.current?.focus();
  }, [hasConversation]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useSseRefresh();

  const canSendInConversation = useMemo(() => {
    if (!activeConversation) return false;
    return !activeConversation.isBlockedByCurrentUser && !activeConversation.isBlockedByOtherUser;
  }, [activeConversation]);

  const openConversation = (conversationId: number): void => {
    router.push(`/messages?conversationId=${conversationId}`);
  };

  const clearStatus = (): void => {
    setStatus(null);
  };

  const handleUserSearchInput = (value: string): void => {
    setUserSearchQuery(value);
    setShowUserDropdown(true);
    setHighlightedIndex(0);

    if (userSearchTimeout.current) clearTimeout(userSearchTimeout.current);

    if (!value.trim()) {
      setUserSearchResults([]);
      return;
    }

    userSearchTimeout.current = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await searchUsers(value);
        setUserSearchResults(results);
      } catch {
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 200);
  };

  const selectUser = (user: UserOption): void => {
    setRecipientId(String(user.id));
    setUserSearchQuery(user.label);
    setShowUserDropdown(false);
    setUserSearchResults([]);
  };

  const handleStartConversation = async (): Promise<void> => {
    const nextRecipientId = Number(recipientId);
    if (!Number.isInteger(nextRecipientId) || nextRecipientId <= 0) {
      setStatus({ tone: "error", message: "Select a user to start a conversation." });
      return;
    }

    setIsCreatingConversation(true);
    try {
      const conversationId = await createOrOpenConversation(nextRecipientId);
      setStatus({ tone: "success", message: "Conversation ready." });
      router.push(`/messages?conversationId=${conversationId}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open conversation.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!activeConversation || !messageBody.trim()) return;
    if (!canSendInConversation) {
      setStatus({ tone: "error", message: "Messaging is unavailable because this conversation is blocked." });
      return;
    }

    setIsSending(true);
    try {
      await sendDirectMessage(activeConversation.conversationId, messageBody);
      setMessageBody("");
      clearStatus();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send message.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const autoResizeTextarea = (e: React.FormEvent<HTMLTextAreaElement>): void => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const beginEditingMessage = (messageId: number, currentBody: string): void => {
    setEditingMessageId(messageId);
    setEditingBody(currentBody);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingMessageId) return;
    try {
      await editDirectMessage(editingMessageId, editingBody);
      setEditingMessageId(null);
      setEditingBody("");
      clearStatus();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to edit message.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleDeleteMessage = async (messageId: number): Promise<void> => {
    try {
      await deleteDirectMessage(messageId);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete message.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleArchiveConversation = async (): Promise<void> => {
    if (!activeConversation) return;
    try {
      await setConversationArchived(activeConversation.conversationId, true);
      setStatus({ tone: "success", message: "Conversation archived." });
      clearStatus();
      router.push("/messages");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to archive conversation.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleBlockToggle = async (): Promise<void> => {
    if (!activeConversation) return;
    try {
      if (activeConversation.isBlockedByCurrentUser) {
        await unblockUserForMessaging(activeConversation.participantUserId);
        setStatus({ tone: "success", message: "User unblocked." });
      } else {
        await blockUserForMessaging(activeConversation.participantUserId);
        setStatus({ tone: "success", message: "User blocked and conversation hidden." });
        router.push("/messages");
      }
      clearStatus();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update block state.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleReportConversation = async (): Promise<void> => {
    if (!activeConversation) return;
    const reason = window.prompt("Describe the issue with this conversation:");
    if (!reason) return;
    try {
      await reportConversation(activeConversation.conversationId, reason);
      setStatus({ tone: "success", message: "Report submitted to admin review queue." });
      toast.success("Report submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit report.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  const handleReportMessage = async (messageId: number): Promise<void> => {
    const reason = window.prompt("Describe the issue with this message:");
    if (!reason) return;
    try {
      await reportMessage(messageId, reason);
      setStatus({ tone: "success", message: "Message report submitted." });
      toast.success("Report submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit message report.";
      setStatus({ tone: "error", message });
      toast.error(message);
    }
  };

  return (
    <section className="flex border rounded-md overflow-hidden bg-card h-[calc(100dvh-6.5rem)]">
      <aside className="w-68 min-w-68 flex flex-col border-r bg-accent">
        <div className="p-2 border-b">
          <div className="flex gap-1">
            <div className="relative flex-1 min-w-0" ref={userSearchRef}>
              <input
                className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground w-full"
                value={userSearchQuery}
                onChange={(e) => handleUserSearchInput(e.target.value)}
                onFocus={() => {
                  if (userSearchQuery.trim()) setShowUserDropdown(true);
                }}
                placeholder="Search users..."
                disabled={isCreatingConversation}
              />
              {showUserDropdown && (
                <div className="absolute top-full left-0 right-0 z-40 max-h-48 overflow-y-auto border rounded-md bg-card shadow-elevated mt-1">
                  {isSearchingUsers ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Searching...</div>
                  ) : userSearchResults.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {userSearchQuery.trim() ? "No users found" : "Type to search users"}
                    </div>
                  ) : (
                    userSearchResults.map((user, index) => (
                      <div
                        key={user.id}
                        className={`px-2 py-1.5 text-sm cursor-pointer transition-colors hover:bg-accent flex items-center gap-1.5 ${index === highlightedIndex ? "bg-accent" : ""}`}
                        onClick={() => selectUser(user)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 leading-none"
                          style={{ backgroundColor: getAvatarColorByUserId(user.id, MESSAGE_AVATAR_COLORS) }}
                        >
                          {getInitials(user.label)}
                        </div>
                        <span>{user.label}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <AppButton
              variant="ghost"
              onClick={() => void handleStartConversation()}
              isLoading={isCreatingConversation}
              loadingLabel="..."
              startIcon={<FiPlus aria-hidden="true" />}
            >
              New
            </AppButton>
          </div>
          {currentUserRole === "admin" ? (
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80 mt-1.5 inline-flex text-sm"
            >
              <span className="inline-flex items-center gap-1">
                <FiFlag aria-hidden="true" />
                <span>Review reports</span>
              </span>
            </Link>
          ) : null}
        </div>

        <div className="px-1.5 pt-1">
          <div className="relative">
            <FiSearch
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              className="w-full border rounded-md bg-accent text-foreground text-sm pl-7 pr-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground text-xs w-full"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Search conversations..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-6 px-3 text-muted-foreground text-sm text-center">
              <FiMessageSquare size={28} aria-hidden="true" />
              <span>No conversations yet.</span>
              <span className="text-xs text-muted-foreground">
                Search for a user above to start one.
              </span>
            </div>
          ) : (
            filteredConversations.map((item) => (
              <div
                key={item.conversationId}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-muted ${item.conversationId === activeConversationId ? "bg-primary/10" : ""}`}
                onClick={() => openConversation(item.conversationId)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 leading-none"
                  style={{ backgroundColor: getAvatarColorByUserId(item.participantUserId, MESSAGE_AVATAR_COLORS) }}
                >
                  {getInitials(item.participantLabel)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{item.participantLabel}</div>
                  <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">{item.lastMessagePreview}</div>
                </div>
                {item.unreadCount > 0 ? (
                  <div className="inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold px-1 leading-none shrink-0">
                    {item.unreadCount > 99 ? "99+" : item.unreadCount}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {!activeConversation ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
            <span className="text-center max-w-80">
              <FiMessageSquare size={32} className="block mx-auto mb-2 opacity-40" aria-hidden="true" />
              Select a conversation or start a new one
            </span>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-1.5 px-2.5 py-2 border-b min-h-10">
              <PageHeading level={2} icon={<FiMessageSquare size={16} className="opacity-60" aria-hidden="true" />}>
                {activeConversation.participantLabel}
              </PageHeading>
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={channelBtnClass}
                      onClick={() => void handleArchiveConversation()}
                    >
                      <FiArchive aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Archive conversation</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={channelBtnClass}
                      onClick={() => void handleBlockToggle()}
                    >
                      {activeConversation.isBlockedByCurrentUser ? (
                        <FiUserCheck aria-hidden="true" />
                      ) : (
                        <FiUserX aria-hidden="true" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{activeConversation.isBlockedByCurrentUser ? "Unblock user" : "Block user"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={channelBtnDangerClass}
                      onClick={() => void handleReportConversation()}
                    >
                      <FiFlag aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Report conversation</TooltipContent>
                </Tooltip>
              </div>
            </header>

            <div className="px-2.5 pt-1.5">
              <InlineStatus
                tone={status?.tone ?? "info"}
                message={status?.message ?? null}
              />
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col">
              {activeConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center py-8 px-3 text-muted-foreground text-sm">
                  No messages yet. Say hello!
                </div>
              ) : (
                <div className="py-0.5 flex-1">
                  {activeConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex flex-col gap-0.5 px-3 py-1 relative transition-colors hover:bg-accent group"
                    >
                      {editingMessageId === message.id ? (
                        <div className="flex flex-col gap-1.5">
                          <textarea
                            className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground min-h-12 resize-y"
                            value={editingBody}
                            onChange={(event) => setEditingBody(event.target.value)}
                          />
                          <div className="flex items-center gap-1.5">
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
                        <div className={`bg-muted rounded-md p-2 self-start max-w-[75%] ${message.isOwn ? "bg-primary/10 self-end" : ""}`}>
                          <p>{message.body}</p>
                        </div>
                      )}

                      {editingMessageId !== message.id ? (
                        <div className={`flex items-center gap-1 self-start px-1 ${message.isOwn ? "self-end" : ""}`}>
                          <span className="text-xs text-muted-foreground" title={formatFullDateTime(message.createdAt)}>
                            {formatTime(message.createdAt)}
                          </span>
                          {message.isEdited && !message.isDeleted ? (
                            <span className="text-xs text-muted-foreground">edited</span>
                          ) : null}
                          {message.isOwn && message.readByOtherUser ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">· read</span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="flex gap-0.5 opacity-0 transition-opacity absolute -top-2 right-3 bg-card border rounded-md p-0.5 shadow-card group-hover:opacity-100">
                        {message.isOwn && !message.isDeleted ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className={actionBtnClass}
                                  onClick={() => beginEditingMessage(message.id, message.body)}
                                >
                                  <FiEdit2 size={14} aria-hidden="true" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className={actionBtnDangerClass}
                                  onClick={() => void handleDeleteMessage(message.id)}
                                >
                                  <FiTrash2 size={14} aria-hidden="true" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </>
                        ) : null}
                        {!message.isDeleted ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={actionBtnDangerClass}
                                onClick={() => void handleReportMessage(message.id)}
                              >
                                <FiFlag size={14} aria-hidden="true" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Report</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="px-2.5 py-2 border-t">
              <div className="flex items-end gap-1.5">
                <textarea
                  ref={textareaRef}
                  value={messageBody}
                  onChange={(event) => {
                    setMessageBody(event.target.value);
                  }}
                  onInput={autoResizeTextarea}
                  onKeyDown={handleKeyDown}
                  disabled={!canSendInConversation || isSending}
                  placeholder={
                    canSendInConversation
                      ? `Message @${activeConversation.participantLabel}`
                      : "Messaging is blocked"
                  }
                  rows={1}
                  className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground"
                />
                <AppButton
                  variant="primary"
                  onClick={() => void handleSendMessage()}
                  isLoading={isSending}
                  loadingLabel="..."
                  disabled={!canSendInConversation || !messageBody.trim()}
                  startIcon={<FiSend aria-hidden="true" />}
                >
                  Send
                </AppButton>
              </div>
            </div>
          </>
        )}
      </main>
    </section>
  );
}

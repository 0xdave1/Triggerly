import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmAgentPlanItem,
  confirmAgentRun,
  deleteConversation,
  getConversation,
  listConversations,
  rejectAgentPlanItem,
  rejectAgentRun,
  sendChatMessage
} from "./api";
import { actionPromptKeys } from "@/features/action-prompts/hooks";
import { liveContextKeys } from "@/features/live-context/hooks";
import { memoryKeys } from "@/features/memory/hooks";
import { reminderKeys } from "@/features/reminders/hooks";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: ["chat", "conversations"] as const,
  conversation: (id?: string) => ["chat", "conversation", id] as const
};

export function useConversations() {
  return useQuery({ queryKey: chatKeys.conversations, queryFn: listConversations });
}

export function useConversation(id?: string) {
  return useQuery({
    queryKey: chatKeys.conversation(id),
    queryFn: () => getConversation(id!),
    enabled: Boolean(id && !id.startsWith("conversation_"))
  });
}

export function useChatActions() {
  const queryClient = useQueryClient();
  const refresh = async (conversationId?: string) => {
    await queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    if (conversationId) await queryClient.invalidateQueries({ queryKey: chatKeys.conversation(conversationId) });
  };
  const refreshCreatedRecords = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: reminderKeys.all }),
      queryClient.invalidateQueries({ queryKey: memoryKeys.all }),
      queryClient.invalidateQueries({ queryKey: actionPromptKeys.all }),
      queryClient.invalidateQueries({ queryKey: liveContextKeys.triggers }),
      queryClient.invalidateQueries({ queryKey: liveContextKeys.priceLogs })
    ]);
  };

  return {
    send: useMutation({
      mutationFn: sendChatMessage,
      onSuccess: (response) => refresh(response.conversation.id)
    }),
    confirmRun: useMutation({
      mutationFn: ({ runId, itemIds }: { runId: string; itemIds?: string[] }) => confirmAgentRun(runId, itemIds),
      onSuccess: refreshCreatedRecords
    }),
    rejectRun: useMutation({ mutationFn: rejectAgentRun }),
    confirmItem: useMutation({
      mutationFn: ({ runId, itemId }: { runId: string; itemId: string }) => confirmAgentPlanItem(runId, itemId),
      onSuccess: refreshCreatedRecords
    }),
    rejectItem: useMutation({
      mutationFn: ({ runId, itemId }: { runId: string; itemId: string }) => rejectAgentPlanItem(runId, itemId)
    }),
    deleteConversation: useMutation({
      mutationFn: deleteConversation,
      onSuccess: () => refresh()
    }),
    refresh
  };
}

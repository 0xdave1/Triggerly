import { parseIntent } from "@/features/trigger-intent/api";
import { apiClient, isBackendUnavailable } from "@/lib/apiClient";
import { createId } from "@/lib/id";
import type {
  AgentPlan,
  AgentPlanItem,
  AgentRun,
  ChatConversation,
  ChatMessage,
  ConversationSummary,
  SendChatMessageResponse
} from "./types";

export async function sendChatMessage(input: { conversationId?: string; message: string }): Promise<SendChatMessageResponse> {
  try {
    const response = await apiClient<BackendSendResponse>({
      method: "POST",
      path: "/chat/messages",
      body: input
    });
    return normalizeSendResponse(response);
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return localChatFallback(input);
  }
}

export async function listConversations(): Promise<ConversationSummary[]> {
  try {
    const conversations = await apiClient<BackendConversation[]>({ method: "GET", path: "/chat/conversations" });
    return conversations.map(normalizeConversationSummary);
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return [];
  }
}

export async function getConversation(id: string): Promise<ChatConversation> {
  const conversation = await apiClient<BackendConversation>({
    method: "GET",
    path: `/chat/conversations/${id}`
  });
  return normalizeConversation(conversation);
}

export function deleteConversation(id: string): Promise<{ deleted: true }> {
  return apiClient<{ deleted: true }>({ method: "DELETE", path: `/chat/conversations/${id}` });
}

export async function confirmAgentRun(id: string, itemIds?: string[]): Promise<AgentRun> {
  const run = await apiClient<BackendAgentRun>({
    method: "POST",
    path: `/agent-runs/${id}/confirm`,
    body: itemIds ? { itemIds } : {}
  });
  return normalizeAgentRun(run);
}

export async function rejectAgentRun(id: string): Promise<AgentRun> {
  const run = await apiClient<BackendAgentRun>({ method: "POST", path: `/agent-runs/${id}/reject` });
  return normalizeAgentRun(run);
}

export async function confirmAgentPlanItem(runId: string, itemId: string): Promise<AgentRun> {
  const run = await apiClient<BackendAgentRun>({
    method: "POST",
    path: `/agent-runs/${runId}/items/${itemId}/confirm`
  });
  return normalizeAgentRun(run);
}

export async function rejectAgentPlanItem(runId: string, itemId: string): Promise<AgentRun> {
  const run = await apiClient<BackendAgentRun>({
    method: "POST",
    path: `/agent-runs/${runId}/items/${itemId}/reject`
  });
  return normalizeAgentRun(run);
}

export async function editAgentPlanItem(runId: string, itemId: string, payload: Record<string, unknown>): Promise<AgentRun> {
  const run = await apiClient<BackendAgentRun>({
    method: "POST",
    path: `/agent-runs/${runId}/items/${itemId}/edit`,
    body: { payload }
  });
  return normalizeAgentRun(run);
}

async function localChatFallback(input: { conversationId?: string; message: string }): Promise<SendChatMessageResponse> {
  const parsed = await parseIntent(input.message);
  const conversationId = input.conversationId ?? createId("conversation");
  const now = new Date().toISOString();
  const item = localPlanItem(parsed.parsed);
  const plan: AgentPlan = {
    id: createId("plan"),
    summary:
      item.type === "ask_clarification"
        ? item.description
        : "I built a local plan. Reconnect before confirming so Triggerly can sync and create it.",
    requiresConfirmation: item.type !== "ask_clarification",
    items: [item]
  };
  const runId = createId("run");
  return {
    source: "local_fallback",
    conversation: { id: conversationId, title: input.message.slice(0, 58) },
    userMessage: {
      id: createId("message"),
      conversationId,
      role: "user",
      content: input.message,
      createdAt: now
    },
    assistantMessage: {
      id: createId("message"),
      conversationId,
      role: "assistant",
      content: plan.summary,
      metadata: { agentRunId: runId, plan },
      createdAt: now
    },
    agentRun: {
      id: runId,
      conversationId,
      status: "waiting_for_confirmation",
      plan
    }
  };
}

function localPlanItem(intent: Record<string, unknown>): AgentPlanItem {
  const intentType = String(intent.intentType ?? "unknown");
  const triggerType = String(intent.triggerType ?? "");
  const actionCandidate = intent.actionCandidate as Record<string, unknown> | undefined;
  const type =
    intentType === "unknown"
      ? "ask_clarification"
      : actionCandidate || intentType === "action_prompt"
        ? "create_action_prompt"
        : ["memory", "debt_memory", "promise_memory", "price_log"].includes(intentType)
          ? "create_memory"
          : ["weather", "exchange_rate", "travel"].includes(triggerType)
            ? "create_live_context_trigger"
            : "create_trigger";
  const sensitive = type === "create_action_prompt" || triggerType.startsWith("location_");
  return {
    id: createId("item"),
    type,
    title: String(intent.taskTitle ?? "Clarify request"),
    description:
      type === "ask_clarification"
        ? String(intent.clarificationQuestion ?? "Should this be a reminder, memory, or action?")
        : "Review these details before Triggerly creates anything.",
    riskLevel: sensitive ? "sensitive" : "low",
    status: "proposed",
    payload: { intent, offline: true },
    requiresConfirmation: type !== "ask_clarification",
    sensitive
  };
}

type BackendMessage = Omit<ChatMessage, "role" | "metadata"> & {
  role: string;
  metadata?: ChatMessage["metadata"];
};

type BackendAgentRun = Omit<AgentRun, "status"> & {
  status: string;
  result?: AgentRun["result"];
};

type BackendConversation = Omit<ChatConversation, "messages" | "agentRuns"> & {
  messages?: BackendMessage[];
  agentRuns?: BackendAgentRun[];
};

type BackendSendResponse = {
  conversation: SendChatMessageResponse["conversation"];
  userMessage: BackendMessage;
  assistantMessage: BackendMessage;
  agentRun: BackendAgentRun;
};

function normalizeMessage(message: BackendMessage): ChatMessage {
  return {
    ...message,
    role: message.role.toLowerCase() as ChatMessage["role"],
    metadata: message.metadata
  };
}

function normalizeAgentRun(run: BackendAgentRun): AgentRun {
  return {
    ...run,
    status: run.status.toLowerCase() as AgentRun["status"],
    plan: run.plan,
    result: run.result
  };
}

function normalizeConversationSummary(conversation: BackendConversation): ConversationSummary {
  return {
    ...conversation,
    messages: conversation.messages?.map(normalizeMessage)
  };
}

function normalizeConversation(conversation: BackendConversation): ChatConversation {
  return {
    ...conversation,
    messages: (conversation.messages ?? []).map(normalizeMessage),
    agentRuns: (conversation.agentRuns ?? []).map(normalizeAgentRun)
  };
}

function normalizeSendResponse(response: BackendSendResponse): SendChatMessageResponse {
  return {
    conversation: response.conversation,
    userMessage: normalizeMessage(response.userMessage),
    assistantMessage: normalizeMessage(response.assistantMessage),
    agentRun: normalizeAgentRun(response.agentRun),
    source: "backend"
  };
}

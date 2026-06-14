import { parseIntent } from "@/features/trigger-intent/api";
import { apiClient, isBackendUnavailable } from "@/lib/apiClient";
import { createId } from "@/lib/id";
import type {
  AgentPlan,
  AgentPlanItem,
  AgentRun,
  ChatConversation,
  ChatMessage,
  ChatResponseMode,
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
  const conversationId = input.conversationId ?? createId("conversation");
  const now = new Date().toISOString();
  const mode = classifyLocalMessage(input.message);
  const userMessage: ChatMessage = {
    id: createId("message"),
    conversationId,
    role: "user",
    content: input.message,
    createdAt: now
  };

  if (mode !== "plan") {
    const message = localResponseMessage(mode, input.message);
    return {
      mode,
      message,
      conversationId,
      agentRunId: null,
      plan: null,
      source: "local_fallback",
      conversation: { id: conversationId, title: input.message.slice(0, 58) },
      userMessage,
      assistantMessage: {
        id: createId("message"),
        conversationId,
        role: "assistant",
        content: message,
        metadata: { mode },
        createdAt: now
      },
      agentRun: null
    };
  }

  const parsed = await parseIntent(input.message);
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
    mode: item.type === "ask_clarification" ? "clarification" : "plan",
    message: plan.summary,
    conversationId,
    agentRunId: item.type === "ask_clarification" ? null : runId,
    plan: item.type === "ask_clarification" ? null : plan,
    source: "local_fallback",
    conversation: { id: conversationId, title: input.message.slice(0, 58) },
    userMessage,
    assistantMessage: {
      id: createId("message"),
      conversationId,
      role: "assistant",
      content: plan.summary,
      metadata:
        item.type === "ask_clarification"
          ? { mode: "clarification" }
          : { mode: "plan", agentRunId: runId, plan },
      createdAt: now
    },
    agentRun:
      item.type === "ask_clarification"
        ? null
        : {
            id: runId,
            conversationId,
            status: "waiting_for_confirmation",
            plan
          }
  };
}

function classifyLocalMessage(input: string): ChatResponseMode {
  const message = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (
    /\b(send|transfer|move|pay)\b.*\b(money|cash|funds?|\d[\d,.]*|₦|naira)\b.*\b(automatically|without asking|without confirmation|silently)\b/.test(
      message
    ) ||
    /\b(secretly|always[- ]?on|all day)\b.*\b(read|listen|record|track)\b/.test(message)
  ) {
    return "blocked";
  }
  if (/^(remind me( later)?|notify me|tell him tomorrow|do that thing|send it|do it|save it)[.!?]*$/.test(message)) {
    return "clarification";
  }
  if (
    [
      /\bremind me\b/,
      /\bnotify me\b/,
      /\btell me when\b/,
      /\balert me\b/,
      /\bschedule\b/,
      /\bsave this\b/,
      /\bremember that\b/,
      /\bdraft (an? )?(email|message)\b/,
      /\bsend ((an?|the) )?(email|message)\b/,
      /\bcreate (an? )?(checklist|reminder|alert|event)\b/,
      /\bwhen i (get to|arrive|arrive at|leave)\b/,
      /\bevery (day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
      /^[a-z][a-z .'-]+ owes me\b/,
      /\bi (bought|paid) .+\bfor\s+(?:₦|ngn\s*)?\d/i,
      /\bi promised\b/,
      /^(call|email|message|text)\s+[a-z]/,
      /\b(send|transfer|pay)\s+(?:₦|ngn\s*)?\d/i
    ].some((pattern) => pattern.test(message))
  ) {
    return "plan";
  }
  return "answer";
}

function localResponseMessage(mode: ChatResponseMode, input: string) {
  if (mode === "blocked") {
    return "I cannot perform that request secretly or automatically. I can help prepare a safe, approval-only alternative when you reconnect.";
  }
  if (mode === "clarification") {
    return "What should I help you remember or prepare, and when or where should it happen?";
  }
  if (/\bweather\b/i.test(input)) {
    return "I cannot check live weather while offline. Reconnect to ask for current information.";
  }
  return "I’m offline, so I can’t generate a reliable full answer right now. Reconnect and send this again.";
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
  mode: ChatResponseMode;
  message: string;
  conversationId: string;
  agentRunId: string | null;
  plan: AgentPlan | null;
  conversation: SendChatMessageResponse["conversation"];
  userMessage: BackendMessage;
  assistantMessage: BackendMessage;
  agentRun: BackendAgentRun | null;
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
    mode: response.mode,
    message: response.message,
    conversationId: response.conversationId,
    agentRunId: response.agentRunId,
    plan: response.plan,
    conversation: response.conversation,
    userMessage: normalizeMessage(response.userMessage),
    assistantMessage: normalizeMessage(response.assistantMessage),
    agentRun: response.agentRun ? normalizeAgentRun(response.agentRun) : null,
    source: "backend"
  };
}

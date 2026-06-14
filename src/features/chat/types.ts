export type AgentPlanItemType =
  | "create_trigger"
  | "create_memory"
  | "create_action_prompt"
  | "create_live_context_trigger"
  | "ask_clarification"
  | "answer_only";

export type AgentPlanItemStatus = "proposed" | "confirmed" | "rejected" | "completed" | "failed";
export type AgentRiskLevel = "low" | "medium" | "sensitive";
export type ChatResponseMode = "answer" | "plan" | "clarification" | "blocked";

export type AgentPlanItem = {
  id: string;
  type: AgentPlanItemType;
  title: string;
  description: string;
  riskLevel: AgentRiskLevel;
  status: AgentPlanItemStatus;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
  sensitive: boolean;
  result?: Record<string, unknown>;
  error?: string;
};

export type AgentPlan = {
  id: string;
  summary: string;
  requiresConfirmation: boolean;
  items: AgentPlanItem[];
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata?: {
    mode?: ChatResponseMode;
    agentRunId?: string;
    plan?: AgentPlan;
    result?: AgentRunResult;
  };
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
};

export type AgentRun = {
  id: string;
  conversationId?: string;
  status: "planning" | "waiting_for_confirmation" | "executing" | "completed" | "failed" | "cancelled";
  plan: AgentPlan;
  result?: AgentRunResult;
};

export type AgentRunResult = {
  message: string;
  completedCount: number;
  failedCount: number;
  created: Array<{ itemId: string; type: AgentPlanItemType; recordId?: string }>;
};

export type ChatConversation = ConversationSummary & {
  messages: ChatMessage[];
  agentRuns: AgentRun[];
};

export type SendChatMessageResponse = {
  mode: ChatResponseMode;
  message: string;
  conversationId: string;
  agentRunId: string | null;
  plan: AgentPlan | null;
  conversation: Pick<ConversationSummary, "id" | "title">;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  agentRun: AgentRun | null;
  source?: "backend" | "local_fallback";
};

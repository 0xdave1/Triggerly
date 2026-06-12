export type AgentPlanItemType =
  | "create_trigger"
  | "create_memory"
  | "create_action_prompt"
  | "create_live_context_trigger"
  | "ask_clarification"
  | "answer_only";

export type AgentPlanItemStatus = "proposed" | "confirmed" | "rejected" | "completed" | "failed";
export type AgentRiskLevel = "low" | "medium" | "sensitive";

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

export type AgentExecutionResult = {
  message: string;
  completedCount: number;
  failedCount: number;
  created: Array<{ itemId: string; type: AgentPlanItemType; recordId?: string }>;
};

import type { AgentPlanItemType } from "@/ai/types/agent-plan.types";

export type {
  AgentPlan,
  AgentPlanItem,
  AgentPlanItemStatus,
  AgentPlanItemType,
  AgentRiskLevel
} from "@/ai/types/agent-plan.types";

export type AgentExecutionResult = {
  message: string;
  completedCount: number;
  failedCount: number;
  created: Array<{ itemId: string; type: AgentPlanItemType; recordId?: string }>;
};

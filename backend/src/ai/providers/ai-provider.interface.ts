import type { AgentPlan, CreateAgentPlanInput } from "../types/agent-plan.types";

export interface AiProvider {
  createAgentPlan(input: CreateAgentPlanInput): Promise<AgentPlan>;
}

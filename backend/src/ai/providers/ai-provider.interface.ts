import type {
  AgentPlan,
  CreateAgentPlanInput,
  GenerateNormalAnswerInput
} from "../types/agent-plan.types";

export interface AiProvider {
  generateNormalAnswer(input: GenerateNormalAnswerInput): Promise<string>;
  generateAgentPlan(input: CreateAgentPlanInput): Promise<AgentPlan>;
}

import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { agentPlanJsonSchema, validateAgentPlan } from "../schemas/agent-plan.schema";
import {
  TRIGGERLY_AGENT_PLAN_PROMPT,
  TRIGGERLY_NORMAL_ANSWER_PROMPT
} from "../prompts/triggerly-system.prompt";
import type {
  AgentPlan,
  CreateAgentPlanInput,
  GenerateNormalAnswerInput
} from "../types/agent-plan.types";
import { parseSafeJson } from "../utils/safe-json.util";
import type { AiProvider } from "./ai-provider.interface";

@Injectable()
export class FreeModelProvider implements AiProvider {
  private client?: OpenAI;

  constructor(private readonly config: ConfigService) {}

  async generateNormalAnswer(input: GenerateNormalAnswerInput): Promise<string> {
    const response = await this.getClient().responses.create({
      ...this.baseRequest(TRIGGERLY_NORMAL_ANSWER_PROMPT, input),
      text: {
        format: {
          type: "text"
        }
      }
    } as never);
    const answer = response.output_text?.trim();
    if (!answer) {
      throw new ServiceUnavailableException("The AI provider returned an empty answer.");
    }
    return answer;
  }

  async generateAgentPlan(input: CreateAgentPlanInput): Promise<AgentPlan> {
    const client = this.getClient();
    const baseRequest = this.baseRequest(TRIGGERLY_AGENT_PLAN_PROMPT, input);

    let response: Awaited<ReturnType<OpenAI["responses"]["create"]>>;
    try {
      response = await client.responses.create({
        ...baseRequest,
        text: {
          format: {
            type: "json_schema",
            name: "triggerly_agent_plan",
            strict: true,
            schema: agentPlanJsonSchema
          }
        }
      } as never);
    } catch {
      response = await client.responses.create(baseRequest as never);
    }

    try {
      return validateAgentPlan(parseSafeJson(response.output_text));
    } catch {
      throw new ServiceUnavailableException("The AI provider returned an invalid plan.");
    }
  }

  async createAgentPlan(input: CreateAgentPlanInput): Promise<AgentPlan> {
    return this.generateAgentPlan(input);
  }

  private getClient() {
    if (this.client) return this.client;
    const apiKey = this.config.get<string>("ai.apiKey");
    if (!apiKey) throw new ServiceUnavailableException("FreeModel is not configured.");
    this.client = new OpenAI({
      apiKey,
      baseURL: this.config.get<string>("ai.baseUrl") ?? "https://api.freemodel.dev",
      timeout: 30000,
      maxRetries: 1
    });
    return this.client;
  }

  private userInput(input: CreateAgentPlanInput) {
    const context = input.context
      ? {
          timezone: input.context.timezone,
          locale: input.context.locale
        }
      : undefined;
    return JSON.stringify({
      message: input.message,
      context
    });
  }

  private baseRequest(instructions: string, input: CreateAgentPlanInput): Record<string, unknown> {
    const disableResponseStorage =
      this.config.get<boolean>("ai.disableResponseStorage") ?? true;
    return {
      model: this.config.get<string>("ai.model") ?? "gpt-5.5",
      instructions,
      input: this.userInput(input),
      store: !disableResponseStorage,
      reasoning: {
        effort: this.config.get<string>("ai.reasoningEffort") ?? "xhigh"
      }
    };
  }
}

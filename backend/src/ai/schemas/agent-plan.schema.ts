import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { AgentPlan } from "../types/agent-plan.types";

const actionableTypes = new Set([
  "create_trigger",
  "create_memory",
  "create_action_prompt",
  "create_live_context_trigger"
]);

export const agentPlanItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    type: z.enum([
      "create_trigger",
      "create_memory",
      "create_action_prompt",
      "create_live_context_trigger",
      "ask_clarification",
      "answer_only"
    ]),
    title: z.string().min(1).max(180),
    description: z.string().min(1).max(1000),
    riskLevel: z.enum(["low", "medium", "sensitive"]),
    status: z.enum(["proposed", "confirmed", "rejected", "completed", "failed"]).optional(),
    payload: z.record(z.unknown()).default({}),
    requiresConfirmation: z.boolean(),
    sensitive: z.boolean(),
    result: z.record(z.unknown()).optional(),
    error: z.string().optional()
  })
  .superRefine((item, ctx) => {
    if (actionableTypes.has(item.type) && !item.requiresConfirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiresConfirmation"],
        message: "Record-creating plan items must require confirmation."
      });
    }
    if (item.riskLevel === "sensitive" && !item.sensitive) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sensitive"],
        message: "Sensitive risk items must be marked sensitive."
      });
    }
  });

export const agentPlanSchema = z.object({
  id: z.string().min(1).optional(),
  summary: z.string().min(1).max(1000),
  requiresConfirmation: z.boolean(),
  items: z.array(agentPlanItemSchema).min(1).max(12)
});

export function validateAgentPlan(value: unknown): AgentPlan {
  const parsed = agentPlanSchema.parse(value);
  return {
    id: parsed.id ?? randomUUID(),
    summary: parsed.summary,
    requiresConfirmation: parsed.requiresConfirmation,
    items: parsed.items.map((item) => ({
      ...item,
      id: item.id ?? randomUUID(),
      status: item.status ?? "proposed"
    }))
  };
}

export const agentPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "requiresConfirmation", "items"],
  properties: {
    summary: { type: "string" },
    requiresConfirmation: { type: "boolean" },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "type",
          "title",
          "description",
          "riskLevel",
          "payload",
          "requiresConfirmation",
          "sensitive"
        ],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: [
              "create_trigger",
              "create_memory",
              "create_action_prompt",
              "create_live_context_trigger",
              "ask_clarification",
              "answer_only"
            ]
          },
          title: { type: "string" },
          description: { type: "string" },
          riskLevel: { type: "string", enum: ["low", "medium", "sensitive"] },
          status: {
            type: "string",
            enum: ["proposed", "confirmed", "rejected", "completed", "failed"]
          },
          payload: { type: "object", additionalProperties: true },
          requiresConfirmation: { type: "boolean" },
          sensitive: { type: "boolean" }
        }
      }
    }
  }
} as const;

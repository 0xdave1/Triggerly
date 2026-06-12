import { apiClient } from "@/lib/apiClient";
import type { ActionPrompt, ActionPromptFilters, ActionPromptInput } from "./types";

export async function listActionPrompts(filters: ActionPromptFilters = {}): Promise<ActionPrompt[]> {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status.toUpperCase());
  if (filters.actionType) query.set("actionType", filters.actionType.toUpperCase());
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const prompts = await apiClient<BackendActionPrompt[]>({ method: "GET", path: `/action-prompts${suffix}` });
  return prompts.map(fromBackendActionPrompt);
}

export async function createActionPrompt(input: ActionPromptInput): Promise<ActionPrompt> {
  const prompt = await apiClient<BackendActionPrompt>({ method: "POST", path: "/action-prompts", body: toBackendActionPrompt(input) });
  return fromBackendActionPrompt(prompt);
}

export async function updateActionPrompt(id: string, input: Partial<ActionPromptInput> & { generatedContent?: string }): Promise<ActionPrompt> {
  const prompt = await apiClient<BackendActionPrompt>({ method: "PATCH", path: `/action-prompts/${id}`, body: toBackendActionPrompt(input) });
  return fromBackendActionPrompt(prompt);
}

export async function confirmActionPrompt(id: string): Promise<ActionPrompt> {
  const prompt = await apiClient<BackendActionPrompt>({ method: "POST", path: `/action-prompts/${id}/confirm` });
  return fromBackendActionPrompt(prompt);
}

export async function cancelActionPrompt(id: string): Promise<ActionPrompt> {
  const prompt = await apiClient<BackendActionPrompt>({ method: "POST", path: `/action-prompts/${id}/cancel` });
  return fromBackendActionPrompt(prompt);
}

export async function completeActionPrompt(id: string): Promise<ActionPrompt> {
  const prompt = await apiClient<BackendActionPrompt>({ method: "POST", path: `/action-prompts/${id}/complete` });
  return fromBackendActionPrompt(prompt);
}

export async function generateActionPromptContent(input: { id: string; userInstruction?: string }): Promise<ActionPrompt> {
  const prompt = await apiClient<BackendActionPrompt>({
    method: "POST",
    path: `/action-prompts/${input.id}/generate-content`,
    body: { userInstruction: input.userInstruction }
  });
  return fromBackendActionPrompt(prompt);
}

type BackendActionPrompt = Omit<ActionPrompt, "actionType" | "status"> & {
  actionType: string;
  status: string;
};

function toBackendActionPrompt(input: Partial<ActionPromptInput> & { generatedContent?: string }) {
  return {
    ...input,
    actionType: input.actionType?.toUpperCase()
  };
}

function fromBackendActionPrompt(prompt: BackendActionPrompt): ActionPrompt {
  return {
    ...prompt,
    actionType: prompt.actionType.toLowerCase() as ActionPrompt["actionType"],
    status: prompt.status.toLowerCase() as ActionPrompt["status"]
  };
}

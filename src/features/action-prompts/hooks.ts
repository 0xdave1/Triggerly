import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelActionPrompt, completeActionPrompt, confirmActionPrompt, createActionPrompt, generateActionPromptContent, listActionPrompts, updateActionPrompt } from "./api";
import type { ActionPromptFilters, ActionPromptInput } from "./types";

export const actionPromptKeys = {
  all: ["action-prompts"] as const,
  list: (filters: ActionPromptFilters = {}) => [...actionPromptKeys.all, filters] as const
};

export function useActionPrompts(filters: ActionPromptFilters = {}) {
  return useQuery({ queryKey: actionPromptKeys.list(filters), queryFn: () => listActionPrompts(filters) });
}

export function useActionPromptActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: actionPromptKeys.all });

  return {
    create: useMutation({ mutationFn: createActionPrompt, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<ActionPromptInput> & { generatedContent?: string } }) => updateActionPrompt(id, input), onSuccess: invalidate }),
    generateContent: useMutation({ mutationFn: generateActionPromptContent, onSuccess: invalidate }),
    confirm: useMutation({ mutationFn: confirmActionPrompt, onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: cancelActionPrompt, onSuccess: invalidate }),
    complete: useMutation({ mutationFn: completeActionPrompt, onSuccess: invalidate })
  };
}

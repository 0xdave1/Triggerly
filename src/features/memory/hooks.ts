import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { archiveMemoryItem, confirmMemoryFromIntent, createMemoryItem, deleteMemoryItem, listMemoryItems, updateMemoryItem } from "./api";
import type { MemoryItemInput, MemoryListFilters } from "./types";

export const memoryKeys = {
  all: ["memory"] as const,
  list: (filters: MemoryListFilters = {}) => [...memoryKeys.all, filters] as const
};

export function useMemoryItems(filters: MemoryListFilters = {}) {
  return useQuery({ queryKey: memoryKeys.list(filters), queryFn: () => listMemoryItems(filters) });
}

export function useMemoryActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: memoryKeys.all });

  return {
    create: useMutation({ mutationFn: createMemoryItem, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<MemoryItemInput> }) => updateMemoryItem(id, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: archiveMemoryItem, onSuccess: invalidate }),
    confirmFromIntent: useMutation({ mutationFn: confirmMemoryFromIntent, onSuccess: invalidate }),
    delete: useMutation({ mutationFn: deleteMemoryItem, onSuccess: invalidate })
  };
}

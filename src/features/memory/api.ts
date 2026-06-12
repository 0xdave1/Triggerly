import { apiClient } from "@/lib/apiClient";
import type { MemoryItem, MemoryItemInput, MemoryListFilters } from "./types";

export async function listMemoryItems(filters: MemoryListFilters = {}): Promise<MemoryItem[]> {
  const query = new URLSearchParams();
  if (filters.type) query.set("type", filters.type.toUpperCase());
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.status) query.set("status", filters.status.toUpperCase());
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const items = await apiClient<BackendMemoryItem[]>({ method: "GET", path: `/memory${suffix}` });
  return items.map(fromBackendMemoryItem);
}

export async function createMemoryItem(input: MemoryItemInput): Promise<MemoryItem> {
  const item = await apiClient<BackendMemoryItem>({ method: "POST", path: "/memory", body: toBackendMemoryInput(input) });
  return fromBackendMemoryItem(item);
}

export async function updateMemoryItem(id: string, input: Partial<MemoryItemInput>): Promise<MemoryItem> {
  const item = await apiClient<BackendMemoryItem>({ method: "PATCH", path: `/memory/${id}`, body: toBackendMemoryInput(input) });
  return fromBackendMemoryItem(item);
}

export function deleteMemoryItem(id: string): Promise<{ deleted: true }> {
  return apiClient<{ deleted: true }>({ method: "DELETE", path: `/memory/${id}` });
}

export async function archiveMemoryItem(id: string): Promise<MemoryItem> {
  const item = await apiClient<BackendMemoryItem>({ method: "POST", path: `/memory/${id}/archive` });
  return fromBackendMemoryItem(item);
}

export async function confirmMemoryFromIntent(input: { parsedIntent: Record<string, unknown>; overrides?: Partial<MemoryItemInput> }): Promise<MemoryItem> {
  const item = await apiClient<BackendMemoryItem>({
    method: "POST",
    path: "/memory/confirm-from-intent",
    body: {
      parsedIntent: input.parsedIntent,
      overrides: input.overrides ? toBackendMemoryInput(input.overrides) : undefined
    }
  });
  return fromBackendMemoryItem(item);
}

function toBackendMemoryInput(input: Partial<MemoryItemInput>) {
  return {
    ...input,
    type: input.type?.toUpperCase(),
    source: input.source?.toUpperCase()
  };
}

type BackendMemoryItem = Omit<MemoryItem, "type" | "source" | "status"> & {
  type: string;
  source?: string;
  status?: string;
};

function fromBackendMemoryItem(item: BackendMemoryItem): MemoryItem {
  return {
    ...item,
    type: item.type.toLowerCase() as MemoryItem["type"],
    source: item.source?.toLowerCase() as MemoryItem["source"],
    status: item.status?.toLowerCase() as MemoryItem["status"]
  };
}

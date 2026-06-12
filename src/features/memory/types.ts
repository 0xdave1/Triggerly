export type MemoryType = "person" | "place" | "price" | "debt" | "promise" | "preference" | "travel" | "routine" | "document" | "general";
export type MemoryStatus = "active" | "archived" | "deleted";
export type MemorySource = "manual" | "ai_extracted" | "imported";

export type MemoryItem = {
  id: string;
  type: MemoryType;
  title: string;
  body: string;
  entities?: Record<string, unknown>;
  source?: MemorySource;
  status?: MemoryStatus;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  deletedAt?: string;
};

export type MemoryItemInput = {
  type: MemoryType;
  title: string;
  body: string;
  entities?: Record<string, unknown>;
  source?: MemorySource;
  confidence?: number;
};

export type MemoryListFilters = {
  type?: MemoryType;
  search?: string;
  status?: MemoryStatus;
};

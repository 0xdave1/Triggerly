export type ActionPromptStatus = "pending_confirmation" | "confirmed" | "cancelled" | "completed";
export type ActionPromptType =
  | "draft_email"
  | "draft_message"
  | "open_payment_app"
  | "payment_reminder"
  | "call_contact"
  | "open_maps"
  | "open_url"
  | "create_calendar_event"
  | "generate_checklist"
  | "prepare_meeting_notes";

export type ActionPrompt = {
  id: string;
  reminderId?: string;
  actionType: ActionPromptType;
  title?: string;
  payload?: Record<string, unknown>;
  generatedContent?: string;
  status: ActionPromptStatus;
  sensitive?: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
};

export type ActionPromptInput = {
  reminderId?: string;
  actionType: ActionPromptType;
  title?: string;
  payload?: Record<string, unknown>;
};

export type ActionPromptFilters = {
  status?: ActionPromptStatus;
  actionType?: ActionPromptType;
};

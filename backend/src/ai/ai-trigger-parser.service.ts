import { Injectable } from "@nestjs/common";
import { ActionType, DeliveryMode } from "@/common/enums";

export type TriggerType =
  | "time"
  | "location_arrival"
  | "location_departure"
  | "habit"
  | "contact"
  | "errand_group"
  | "action_prompt";

export type ParsedTriggerIntent = {
  taskTitle: string;
  triggerType: TriggerType;
  locationCandidate?: string;
  timeCandidate?: string;
  habitCandidate?: string;
  contactCandidate?: string;
  suggestedDeliveryMode: DeliveryMode;
  suggestedVoiceScript: string;
  actionCandidate?: {
    actionType: ActionType;
    payload: Record<string, unknown>;
  };
  confidence: number;
  requiresConfirmation: true;
};

@Injectable()
export class AiTriggerParserService {
  parse(input: string): ParsedTriggerIntent {
    const original = input.trim();
    const lower = original.toLowerCase();
    const actionType = this.detectActionType(lower);
    const locationCandidate = this.extractLocation(original);
    const timeCandidate = this.extractTime(original);
    const habitCandidate = this.extractHabit(lower);
    const contactCandidate = this.extractContact(original);
    const triggerType = this.detectTriggerType(lower, { actionType, locationCandidate, timeCandidate, habitCandidate, contactCandidate });
    const taskTitle = this.cleanTaskTitle(original, locationCandidate);
    const suggestedDeliveryMode = triggerType === "location_arrival" || triggerType === "location_departure" || triggerType === "errand_group" ? DeliveryMode.VOICE_AND_PUSH : DeliveryMode.PUSH;
    const actionCandidate = actionType ? { actionType, payload: this.actionPayload(actionType, original, contactCandidate) } : undefined;

    return {
      taskTitle,
      triggerType,
      locationCandidate,
      timeCandidate,
      habitCandidate,
      contactCandidate,
      suggestedDeliveryMode,
      suggestedVoiceScript: this.scriptFor(triggerType, taskTitle, locationCandidate, actionCandidate),
      actionCandidate,
      confidence: this.confidence({ actionType, locationCandidate, timeCandidate, habitCandidate, contactCandidate }),
      requiresConfirmation: true
    };
  }

  private detectTriggerType(lower: string, signals: Record<string, unknown>): TriggerType {
    if (signals.actionType) return "action_prompt";
    if (signals.habitCandidate) return "habit";
    if (signals.contactCandidate && lower.startsWith("call")) return "contact";
    if (lower.includes("when i leave") || lower.includes("leaving")) return "location_departure";
    if (signals.locationCandidate || lower.includes("when i get to") || lower.includes("when i arrive")) return "location_arrival";
    return "time";
  }

  private detectActionType(lower: string): ActionType | undefined {
    if (lower.includes("send money") || lower.includes("transfer") || lower.includes("pay ")) return ActionType.OPEN_PAYMENT_APP;
    if (lower.includes("email") || lower.includes("send mail") || lower.includes("draft message")) return ActionType.DRAFT_EMAIL;
    if (lower.match(/\bcall\s+[a-z]/)) return ActionType.CALL_CONTACT;
    if (lower.includes("open maps") || lower.includes("directions")) return ActionType.OPEN_MAPS;
    if (lower.includes("open url") || lower.includes("website")) return ActionType.OPEN_URL;
    return undefined;
  }

  private extractLocation(input: string): string | undefined {
    return input.match(/(?:when i get to|when i arrive at|when i leave|leaving|at)\s+([A-Za-z0-9 .'-]+?)(?:\.|,|$)/i)?.[1]?.trim();
  }

  private extractTime(input: string): string | undefined {
    return input.match(/\b(at\s+\d{1,2}(:\d{2})?\s?(am|pm)?|tomorrow|next\s+\w+|tonight|today|\d{1,2}:\d{2})\b/i)?.[0]?.trim();
  }

  private extractHabit(lower: string): string | undefined {
    return lower.match(/\b(every day|weekly|every week|every sunday|every monday|every tuesday|every wednesday|every thursday|every friday|every saturday|daily|monthly)\b/)?.[0];
  }

  private extractContact(input: string): string | undefined {
    return input.match(/\b(?:call|email|message|text)\s+([A-Z][A-Za-z .'-]+)/)?.[1]?.trim();
  }

  private cleanTaskTitle(input: string, location?: string): string {
    const cleaned = input
      .replace(/^remind me to\s+/i, "")
      .replace(/^when i leave [^,]+,\s*remind me to\s+/i, "")
      .replace(/\s+when i get to .+$/i, "")
      .replace(/\s+when i arrive at .+$/i, "")
      .replace(/\s+when i leave .+$/i, "")
      .replace(/\.$/, "")
      .trim();
    const fallback = cleaned || location || input;
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  private actionPayload(actionType: ActionType, input: string, contactCandidate?: string) {
    return {
      input,
      contactCandidate,
      safety: actionType === ActionType.OPEN_PAYMENT_APP || actionType === ActionType.DRAFT_EMAIL ? "confirmation_required_no_auto_execute" : "confirmation_required"
    };
  }

  private scriptFor(triggerType: TriggerType, task: string, place?: string, action?: ParsedTriggerIntent["actionCandidate"]): string {
    if (action?.actionType === ActionType.OPEN_PAYMENT_APP) return `You asked to send money. Please confirm before taking action.`;
    if (action?.actionType === ActionType.DRAFT_EMAIL) return `You asked to email someone. Review the draft before sending.`;
    if (triggerType === "location_departure") return `You're leaving ${place ?? "this place"}. Remember to ${task.toLowerCase()}.`;
    if (triggerType === "location_arrival") return `You're near ${place ?? "this place"}. You asked me to remind you to ${task.toLowerCase()}.`;
    if (triggerType === "habit") return `You haven't completed ${task.toLowerCase()} yet. Want to do it now?`;
    return `You asked me to remind you to ${task.toLowerCase()}.`;
  }

  private confidence(signals: Record<string, unknown>) {
    return Math.min(0.95, 0.55 + Object.values(signals).filter(Boolean).length * 0.1);
  }
}

export class InvalidAiJsonError extends Error {
  constructor(message = "The AI provider returned invalid JSON.") {
    super(message);
    this.name = "InvalidAiJsonError";
  }
}

export function parseSafeJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) throw new InvalidAiJsonError("The AI provider returned an empty response.");

  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  const candidate = start >= 0 && end >= start ? withoutFence.slice(start, end + 1) : withoutFence;

  try {
    return JSON.parse(candidate);
  } catch {
    throw new InvalidAiJsonError();
  }
}

export function safeClarificationPlan() {
  return {
    summary: "I need one more detail before setting this up.",
    requiresConfirmation: false,
    items: [
      {
        id: "clarify_1",
        type: "ask_clarification",
        title: "Clarification needed",
        description: "Please clarify what you want Triggerly to set up.",
        riskLevel: "low",
        status: "proposed",
        requiresConfirmation: false,
        sensitive: false,
        payload: {
          question: "Should this be a reminder, memory, or action?"
        }
      }
    ]
  } as const;
}

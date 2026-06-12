import { Injectable } from "@nestjs/common";
import { ActionType, DeliveryMode } from "@/common/enums";
import { IntentParserContext, IntentParserProvider, ParsedIntent, SensitiveActionCategory } from "./intent-types";

type NormalizedIntentInput = {
  original: string;
  lower: string;
  timePhrase?: string;
};

@Injectable()
export class HeuristicIntentParserProvider implements IntentParserProvider {
  async parse(input: string, _context: IntentParserContext): Promise<ParsedIntent> {
    const normalized = this.normalize(input);
    const { original, lower } = normalized;

    if (!original) return this.unknown("Should this be a reminder, memory, or action?");

    return (
      this.parseDailyBriefing(normalized) ??
      this.parseLocationDeparture(normalized) ??
      this.parseLocationArrival(normalized) ??
      this.parseTravelWeather(normalized) ??
      this.parseExchangeRate(normalized) ??
      this.parsePriceLog(normalized) ??
      this.parseDebtMemory(normalized) ??
      this.parsePromiseMemory(normalized) ??
      this.parseActionPrompt(normalized) ??
      this.parseHabit(normalized) ??
      this.parseTimeReminder(normalized) ??
      this.partialClarification(lower)
    );
  }

  private normalize(input: string): NormalizedIntentInput {
    const original = input.trim().replace(/\s+/g, " ");
    const lower = original.toLowerCase();
    return {
      original,
      lower,
      timePhrase: this.extractTimePhrase(original)
    };
  }

  private parseLocationArrival({ original, lower }: NormalizedIntentInput): ParsedIntent | undefined {
    const place = this.match(original, /(?:when i get to|when i arrive at)\s+([^,.]+)/i);
    if (!place) return undefined;
    if (/\b(checklist|shopping list|make a shopping)\b/.test(lower)) {
      return this.sensitiveAction({
        actionType: ActionType.GENERATE_CHECKLIST,
        taskTitle: `Make checklist at ${place}`,
        payload: { placeName: place, triggerCondition: "arrival", safety: "confirmation_required" },
        categories: ["location_tracking"],
        confidence: 0.84,
        extra: {
          triggerType: "location_arrival",
          locationCandidate: { placeName: place, triggerCondition: "arrival" },
          actionType: "generate_checklist",
          suggestedVoiceScript: `You're near ${place}. Review your checklist before continuing.`
        }
      });
    }
    const taskTitle = this.titleCase(this.cleanReminderTask(original)) || "Complete this task";
    return {
      intentType: "reminder",
      triggerType: "location_arrival",
      taskTitle,
      locationCandidate: { placeName: place, triggerCondition: "arrival" },
      place,
      suggestedDeliveryMode: DeliveryMode.VOICE_AND_PUSH,
      confidence: 0.93,
      requiresConfirmation: true,
      sensitive: true,
      sensitiveCategories: ["location_tracking"],
      executionAllowed: false,
      suggestedVoiceScript: `You're near ${place}. You asked me to ${taskTitle.toLowerCase()}.`
    };
  }

  private parseLocationDeparture({ original }: NormalizedIntentInput): ParsedIntent | undefined {
    const place = this.match(original, /when i leave\s+([^,.]+)/i) ?? this.match(original, /leaving\s+([^,.]+)/i);
    if (!place) return undefined;
    const taskTitle = this.titleCase(this.cleanReminderTask(original)) || "Take my charger";
    return {
      intentType: "reminder",
      triggerType: "location_departure",
      taskTitle,
      locationCandidate: { placeName: place, triggerCondition: "departure" },
      place,
      suggestedDeliveryMode: DeliveryMode.VOICE_AND_PUSH,
      confidence: 0.93,
      requiresConfirmation: true,
      sensitive: true,
      sensitiveCategories: ["location_tracking"],
      executionAllowed: false,
      suggestedVoiceScript: `You're leaving ${place}. Remember to ${taskTitle.toLowerCase()}.`
    };
  }

  private parseTravelWeather({ original, lower, timePhrase }: NormalizedIntentInput): ParsedIntent | undefined {
    if (!/\b(traveling|travelling|travel|going)\s+to\b/.test(lower) || !/\bweather\b/.test(lower)) return undefined;
    const destination = this.match(original, /(?:traveling|travelling|travel|going)\s+to\s+([^,.]+?)(?:\s+tomorrow|\s+next|\s+on|,|\.|$)/i);
    if (!destination) {
      return {
        intentType: "travel_plan",
        triggerType: "weather",
        taskTitle: "Check travel weather",
        confidence: 0.62,
        requiresConfirmation: true,
        clarificationQuestion: "What destination should I check weather for?"
      };
    }
    return {
      intentType: "travel_plan",
      triggerType: "weather",
      taskTitle: `Check ${destination} weather before travel`,
      destination,
      timeCandidate: timePhrase ? { phrase: timePhrase } : undefined,
      locationCandidate: { placeName: destination },
      weatherCandidate: { destination, timing: "before_departure" },
      suggestedDeliveryMode: DeliveryMode.PUSH,
      confidence: 0.9,
      requiresConfirmation: true,
      suggestedVoiceScript: `Before you leave for ${destination}, check the weather.`
    };
  }

  private parseExchangeRate({ original, lower }: NormalizedIntentInput): ParsedIntent | undefined {
    if (!/\b(dollar|usd|exchange rate|rate)\b/.test(lower) || !/\b(crosses|reaches|above|below|hits)\b/.test(lower)) return undefined;
    const targetRate = this.parseAmount(this.match(original, /(\d+(?:\.\d+)?\s?[km]?)/i));
    const condition = /\b(below|under)\b/.test(lower) ? "less_than_or_equal" : "greater_than_or_equal";
    return {
      intentType: "exchange_rate_trigger",
      triggerType: "exchange_rate",
      taskTitle: targetRate ? `Dollar rate reaches ${targetRate}` : "Dollar rate alert",
      baseCurrency: "USD",
      quoteCurrency: "NGN",
      targetRate,
      condition,
      exchangeRateCandidate: { baseCurrency: "USD", quoteCurrency: "NGN", targetRate, condition },
      suggestedDeliveryMode: DeliveryMode.PUSH,
      confidence: targetRate ? 0.9 : 0.68,
      requiresConfirmation: true,
      clarificationQuestion: targetRate ? undefined : "What exchange rate should trigger this?",
      suggestedVoiceScript: targetRate ? `The dollar rate has reached your target of ${targetRate}.` : undefined
    };
  }

  private parsePriceLog({ original }: NormalizedIntentInput): ParsedIntent | undefined {
    const match = original.match(/(?:i\s+)?bought\s+(.+?)\s+for\s+\p{Sc}?(\d+(?:[,.]\d+)?\s?[km]?)\s+(?:at|in)\s+([^,.]+)/iu);
    if (!match) return undefined;
    const item = match[1].trim();
    const price = this.parseAmount(match[2]) ?? Number(match[2].replace(",", ""));
    const place = match[3].trim();
    return {
      intentType: "price_log",
      triggerType: "price",
      taskTitle: `Log ${item} price`,
      item,
      price,
      currency: "NGN",
      place,
      priceCandidate: { item, price, currency: "NGN", place },
      memoryCandidate: { type: "price", item, price, currency: "NGN", place },
      confidence: 0.9,
      requiresConfirmation: true,
      suggestedVoiceScript: `I've noted ${item} at ${price} naira in ${place}.`
    };
  }

  private parseDebtMemory({ original }: NormalizedIntentInput): ParsedIntent | undefined {
    const receivable = original.match(/^([A-Z][A-Za-z .'-]+)\s+owes\s+me\s+(.+?)\.?$/);
    const payable = original.match(/^i\s+owe\s+([A-Z][A-Za-z .'-]+)\s+(.+?)\.?$/i);
    const match = receivable ?? payable;
    if (!match) return undefined;
    const receivableDirection = Boolean(receivable);
    const person = match[1].trim();
    const amount = this.parseAmount(match[2]) ?? 0;
    return {
      intentType: "debt_memory",
      taskTitle: `${person} ${receivableDirection ? "owes me" : "is owed"} ${amount}`,
      person,
      amount,
      currency: "NGN",
      direction: receivableDirection ? "receivable" : "payable",
      memoryCandidate: {
        type: "debt",
        person,
        amount,
        currency: "NGN",
        direction: receivableDirection ? "receivable" : "payable"
      },
      contactCandidate: { name: person },
      confidence: amount ? 0.91 : 0.7,
      requiresConfirmation: true,
      suggestedVoiceScript: `${person} ${receivableDirection ? "owes you" : "is owed"} ${amount} naira.`
    };
  }

  private parsePromiseMemory({ original }: NormalizedIntentInput): ParsedIntent | undefined {
    const match = original.match(/i promised\s+([A-Z][A-Za-z .'-]+)\s+i would\s+(.+?)(?:\s+(?:on|by)\s+([^,.]+)|\.|$)/i);
    if (!match) return undefined;
    const person = match[1].trim();
    const taskTitle = this.titleCase(match[2].trim());
    const deadline = match[3]?.trim() ?? this.extractTimePhrase(original);
    return {
      intentType: "promise_memory",
      triggerType: deadline ? "time" : undefined,
      taskTitle,
      person,
      deadline,
      timeCandidate: deadline ? { phrase: deadline } : undefined,
      memoryCandidate: { type: "promise", person, commitment: taskTitle.toLowerCase(), taskTitle, deadline },
      confidence: 0.88,
      requiresConfirmation: true,
      suggestedVoiceScript: `You promised ${person} you would ${taskTitle.toLowerCase()}${deadline ? ` by ${deadline}` : ""}.`
    };
  }

  private parseActionPrompt(input: NormalizedIntentInput): ParsedIntent | undefined {
    const { original, lower, timePhrase } = input;
    const paymentReminder = original.match(/remind me to send\s+\p{Sc}?(\d+(?:[,.]\d+)?\s?[km]?)\s+to\s+([^,.]+?)(?:\s+(?:on|by)\s+([^,.]+)|\.|$)/iu);
    if (paymentReminder) {
      const amount = this.parseAmount(paymentReminder[1]) ?? 0;
      const recipientName = paymentReminder[2].trim();
      const date = paymentReminder[3]?.trim() ?? timePhrase;
      return this.sensitiveAction({
        actionType: ActionType.PAYMENT_REMINDER,
        taskTitle: `Payment reminder for ${recipientName}`,
        payload: { recipientName, amount, currency: "NGN", date, safety: "confirmation_required_no_auto_payment" },
        categories: ["payment"],
        confidence: amount ? 0.9 : 0.68,
        extra: {
          triggerType: "action_confirmation",
          actionType: "payment_reminder",
          recipientCandidate: recipientName,
          timeCandidate: date ? { phrase: date } : undefined,
          suggestedVoiceScript: `You asked me to remind you to send money to ${recipientName}. No payment will be made automatically.`
        }
      });
    }

    if (/\b(draft|write|prepare).*(email|mail)\b|\bemail\s+/i.test(original)) {
      const recipient = this.match(original, /(?:email|mail)\s+(?:to\s+)?([^,.]+?)(?:\s+about|\s+tomorrow|,|\.|$)/i);
      const topic = this.match(original, /about\s+([^,.]+?)(?:\s+tomorrow|\s+next|\s+on|,|\.|$)/i);
      return this.sensitiveAction({
        actionType: ActionType.DRAFT_EMAIL,
        taskTitle: "Draft email",
        payload: { recipientCandidate: recipient, topic, timeCandidate: timePhrase, sourceText: original, safety: "confirmation_required_no_auto_send" },
        categories: ["email_sending"],
        confidence: recipient || topic ? 0.88 : 0.64,
        extra: {
          triggerType: "action_confirmation",
          actionType: "draft_email",
          recipientCandidate: recipient,
          topic,
          timeCandidate: timePhrase ? { phrase: timePhrase } : undefined,
          suggestedVoiceScript: `You asked me to draft an email${recipient ? ` to ${recipient}` : ""}. Review it before sending.`
        }
      });
    }

    if (/\b(draft|write|prepare).*(message|text|whatsapp)\b/.test(lower)) {
      return this.sensitiveAction({
        actionType: ActionType.DRAFT_MESSAGE,
        taskTitle: "Draft message",
        payload: { sourceText: original, safety: "confirmation_required_no_auto_send" },
        categories: ["message_sending"],
        confidence: 0.78,
        extra: { triggerType: "action_confirmation", actionType: "draft_message", suggestedVoiceScript: "You asked me to prepare a message. Review it before sending." }
      });
    }

    if (/\b(send money|transfer|pay)\b/.test(lower)) {
      return this.sensitiveAction({
        actionType: ActionType.OPEN_PAYMENT_APP,
        taskTitle: "Prepare payment reminder",
        payload: { sourceText: original, safety: "confirmation_required_no_auto_payment" },
        categories: ["payment"],
        confidence: 0.78,
        extra: { triggerType: "action_confirmation", actionType: "open_payment_app", suggestedVoiceScript: "You asked me to prepare a payment action. Please confirm before I continue." }
      });
    }

    if (/\bcall\s+[A-Z]?[A-Za-z .'-]+/.test(original)) {
      const name = this.match(original, /\bcall\s+([^,.]+)/i);
      return this.sensitiveAction({
        actionType: ActionType.CALL_CONTACT,
        taskTitle: `Call ${name ?? "contact"}`,
        payload: { name, safety: "confirmation_required" },
        categories: ["contact_access"],
        confidence: name ? 0.8 : 0.62,
        extra: {
          triggerType: "contact",
          contactCandidate: name ? { name } : undefined,
          suggestedVoiceScript: `You asked me to call ${name ?? "someone"}. Please confirm before I continue.`
        }
      });
    }

    return undefined;
  }

  private parseHabit({ original, lower }: NormalizedIntentInput): ParsedIntent | undefined {
    const habit = this.extractHabit(original);
    if (!habit) return undefined;
    const taskTitle = this.titleCase(this.match(original, /remind me to\s+(.+?)(?:\.|$)/i)?.replace(/\s+every.+$/i, "") ?? this.cleanReminderTask(original) ?? original);
    return {
      intentType: "habit",
      triggerType: "habit",
      taskTitle,
      habitCandidate: habit,
      frequency: String(habit.frequency),
      dayOfWeek: habit.dayOfWeek as string | undefined,
      timeOfDay: habit.timeOfDay as string | undefined,
      suggestedDeliveryMode: DeliveryMode.PUSH,
      confidence: lower.includes("every") ? 0.9 : 0.72,
      requiresConfirmation: true,
      suggestedVoiceScript: `You haven't completed ${taskTitle.toLowerCase()} yet. Want to do it now?`
    };
  }

  private parseTimeReminder({ original, timePhrase }: NormalizedIntentInput): ParsedIntent | undefined {
    if (!timePhrase) return undefined;
    const taskTitle = this.titleCase(this.cleanReminderTask(original)) || original;
    return {
      intentType: "reminder",
      triggerType: "time",
      taskTitle,
      timeCandidate: { phrase: timePhrase, timezone: "Africa/Lagos" },
      suggestedDeliveryMode: DeliveryMode.PUSH,
      confidence: 0.75,
      requiresConfirmation: true,
      suggestedVoiceScript: `You asked me to remind you to ${taskTitle.toLowerCase()}.`
    };
  }

  private parseDailyBriefing({ lower }: NormalizedIntentInput): ParsedIntent | undefined {
    if (!/\b(daily briefing|morning brief|night brief|brief me|today's brief|today brief)\b/.test(lower)) return undefined;
    return {
      intentType: "daily_briefing_request",
      taskTitle: "Generate daily briefing",
      confidence: 0.86,
      requiresConfirmation: true,
      suggestedDeliveryMode: DeliveryMode.PUSH,
      suggestedVoiceScript: "Here is your Triggerly briefing for today."
    };
  }

  private partialClarification(lower: string): ParsedIntent {
    if (/\bwhen\b/.test(lower)) return this.unknown("When should I remind you?");
    if (/\bwhere|arrive|leave|location\b/.test(lower)) return this.unknown("What location should trigger this?");
    if (/\bremember|save|note\b/.test(lower)) return this.unknown("Do you want me to save this as memory?");
    return this.unknown("Should this be a reminder, memory, or action?");
  }

  private sensitiveAction(input: {
    actionType: ActionType;
    taskTitle: string;
    payload: Record<string, unknown>;
    categories: SensitiveActionCategory[];
    confidence: number;
    extra?: Partial<ParsedIntent>;
  }): ParsedIntent {
    return {
      intentType: "action_prompt",
      taskTitle: input.taskTitle,
      actionCandidate: { actionType: input.actionType, payload: input.payload },
      suggestedDeliveryMode: DeliveryMode.PUSH,
      confidence: input.confidence,
      requiresConfirmation: true,
      sensitive: true,
      sensitiveCategories: input.categories,
      executionAllowed: false,
      ...input.extra
    };
  }

  private extractHabit(text: string): Record<string, unknown> | undefined {
    const lower = text.toLowerCase();
    const day = this.match(text, /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (day) return { frequency: "weekly", dayOfWeek: this.titleCase(day), timeOfDay: this.extractTimeOfDay(lower) };
    if (/\bevery day|daily\b/.test(lower)) return { frequency: "daily", timeOfDay: this.extractTimeOfDay(lower) };
    if (/\bevery week|weekly\b/.test(lower)) return { frequency: "weekly", timeOfDay: this.extractTimeOfDay(lower) };
    if (/\bevery month|monthly\b/.test(lower)) return { frequency: "monthly", timeOfDay: this.extractTimeOfDay(lower) };
    return undefined;
  }

  private extractTimePhrase(text: string): string | undefined {
    return text.match(/\b(tomorrow morning|tomorrow evening|tomorrow|tonight|today|next\s+\w+|on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|friday|monday|tuesday|wednesday|thursday|saturday|sunday|at\s+\d{1,2}(?::\d{2})?\s?(?:am|pm)?|\d{1,2}:\d{2}|morning|evening|afternoon|night)\b/i)?.[0]?.trim();
  }

  private extractTimeOfDay(lower: string): string | undefined {
    return lower.match(/\b(morning|afternoon|evening|night)\b/)?.[1];
  }

  private cleanReminderTask(text: string): string {
    const reminderClause = this.match(text, /remind me to\s+(.+?)(?:\s+when i get to|\s+when i arrive at|\s+when i leave|\.|$)/i);
    if (reminderClause) return reminderClause.trim();
    return text
      .replace(/^when i leave [^,]+,?\s*/i, "")
      .replace(/^remind me to\s+/i, "")
      .replace(/^every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day|week|month)\s+(morning|afternoon|evening|night)?\s*/i, "")
      .replace(/\s+when i get to .+$/i, "")
      .replace(/\s+when i arrive at .+$/i, "")
      .replace(/\s+when i leave .+$/i, "")
      .replace(/\s+at\s+\d{1,2}(?::\d{2})?\s?(?:am|pm)?/i, "")
      .replace(/\s+tomorrow( morning| evening)?/i, "")
      .replace(/\.$/, "")
      .trim();
  }

  private parseAmount(value?: string): number | undefined {
    if (!value) return undefined;
    const cleaned = value.toLowerCase().replace(/[^0-9.km]/g, "").trim();
    const match = cleaned.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
    if (!match) return undefined;
    const base = Number(match[1]);
    if (Number.isNaN(base)) return undefined;
    if (match[2] === "k") return Math.round(base * 1000);
    if (match[2] === "m") return Math.round(base * 1000000);
    return Math.round(base);
  }

  private match(text: string, pattern: RegExp): string | undefined {
    return text.match(pattern)?.[1]?.trim();
  }

  private titleCase(value: string) {
    if (!value) return value;
    const trimmed = value.trim().replace(/\.$/, "");
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  private unknown(question: string): ParsedIntent {
    return {
      intentType: "unknown",
      confidence: 0.25,
      requiresConfirmation: true,
      clarificationQuestion: question
    };
  }
}

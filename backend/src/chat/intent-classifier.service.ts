import { Injectable } from "@nestjs/common";

export type ChatResponseMode = "answer" | "plan" | "clarification" | "blocked";

export type IntentClassification = {
  mode: ChatResponseMode;
  message?: string;
};

@Injectable()
export class IntentClassifierService {
  classify(input: string): IntentClassification {
    const message = input.trim();
    const normalized = message.toLowerCase().replace(/\s+/g, " ");

    const blocked = this.blockedResponse(normalized);
    if (blocked) return { mode: "blocked", message: blocked };

    const clarification = this.clarificationResponse(normalized);
    if (clarification) return { mode: "clarification", message: clarification };

    if (this.isTask(normalized)) return { mode: "plan" };
    return { mode: "answer" };
  }

  private blockedResponse(message: string) {
    if (
      /\b(send|transfer|move|pay)\b.*\b(money|cash|funds?|\d[\d,.]*|₦|naira)\b.*\b(automatically|without asking|without confirmation|silently)\b/.test(
        message
      ) ||
      /\bautomatically\b.*\b(send|transfer|move|pay)\b.*\b(money|cash|funds?|₦|naira)\b/.test(message)
    ) {
      return "I cannot move money automatically. I can prepare a payment reminder or an approval-only payment prompt instead.";
    }
    if (/\b(secretly|without permission|without consent)\b.*\b(read|scrape|access)\b.*\b(whatsapp|messages?|email)\b/.test(message)) {
      return "I cannot secretly read private messages or email. I can help with content you explicitly choose to share.";
    }
    if (/\b(always[- ]?on|all day|secretly|covertly|in the background)\b.*\b(listen|record|microphone)\b/.test(message)) {
      return "I cannot listen or record in the background. Voice input only starts after you explicitly tap it.";
    }
    if (/\b(secretly|hidden|without permission)\b.*\b(track|location|follow)\b/.test(message)) {
      return "I cannot track location secretly. Location can only be used for reminders you explicitly create and enable.";
    }
    return undefined;
  }

  private clarificationResponse(message: string) {
    if (/^(remind me( later)?|notify me|tell him tomorrow|do that thing|send it|do it|save it)[.!?]*$/.test(message)) {
      if (message.startsWith("remind") || message.startsWith("notify")) {
        return "What should I remind you about, and when or where should it happen?";
      }
      return "What would you like me to prepare or do?";
    }
    return undefined;
  }

  private isTask(message: string) {
    const taskPatterns = [
      /\bremind me\b/,
      /\bnotify me\b/,
      /\btell me when\b/,
      /\balert me\b/,
      /\bschedule\b/,
      /\bsave this\b/,
      /\bremember that\b/,
      /\btrack (this|the|my|a)\b/,
      /\bdraft (an? )?(email|message)\b/,
      /\bsend ((an?|the) )?(email|message)\b/,
      /\bcreate (an? )?(checklist|reminder|alert|schedule|event)\b/,
      /\bmake (me )?(an? )?(checklist|reminder|alert)\b/,
      /\bwhen i (get to|arrive|arrive at|leave)\b/,
      /\bevery (day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
      /^[a-z][a-z .'-]+ owes me\b/,
      /\bi (bought|paid) .+\bfor\s+(?:₦|ngn\s*)?\d/i,
      /\bi promised\b/,
      /\bi told\b.*\bi(?: would| will|['’]ll)\b/,
      /\b(help me stay consistent|keep me accountable|accountability)\b/,
      /\bhelped me with\b/,
      /\bi need to return\b/,
      /^(call|email|message|text)\s+[a-z]/,
      /\b(send|transfer|pay)\s+(?:₦|ngn\s*)?\d/i
    ];
    return taskPatterns.some((pattern) => pattern.test(message));
  }
}

export const NIGERIA_TIME_ZONE = "Africa/Lagos";
const WAT_OFFSET_MINUTES = 60;

type NigeriaDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function parseNigeriaDateTimeInput(input: string, now = new Date()): string {
  const value = input.trim();
  if (!value) throw new Error("Enter a reminder time.");

  if (hasExplicitTimezone(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("Enter a valid reminder time.");
    return date.toISOString();
  }

  const dated = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T])(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (dated) {
    return nigeriaPartsToIso({
      year: Number(dated[1]),
      month: Number(dated[2]),
      day: Number(dated[3]),
      ...parseHourMinute(dated[4], dated[5], dated[6])
    });
  }

  const relative = value.match(/^(today|tomorrow)\s+(.+)$/i);
  if (relative) {
    const base = addNigeriaDays(getNigeriaDateParts(now), relative[1].toLowerCase() === "tomorrow" ? 1 : 0);
    return nigeriaPartsToIso({ ...base, ...parseTimePhrase(relative[2]) });
  }

  const timeOnly = tryParseTimePhrase(value);
  if (timeOnly) {
    const current = getNigeriaDateParts(now);
    const candidate = { ...current, ...timeOnly };
    const candidateMinutes = candidate.hour * 60 + candidate.minute;
    const currentMinutes = current.hour * 60 + current.minute;
    return nigeriaPartsToIso(candidateMinutes <= currentMinutes ? { ...addNigeriaDays(current, 1), ...timeOnly } : candidate);
  }

  throw new Error("Use Nigeria time like 2026-05-27 18:00, tomorrow 6pm, or 6pm.");
}

export function formatNigeriaDateTimeInput(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const parts = getNigeriaDateParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatNigeriaDateTimeDisplay(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "invalid time";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: NIGERIA_TIME_ZONE
  }).format(date);
}

function hasExplicitTimezone(value: string): boolean {
  return /z$/i.test(value) || /[+-]\d{2}:?\d{2}$/.test(value);
}

function getNigeriaDateParts(date: Date): NigeriaDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NIGERIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute")
  };
}

function addNigeriaDays(parts: NigeriaDateParts, days: number): NigeriaDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12));
  return { ...getNigeriaDateParts(date), hour: parts.hour, minute: parts.minute };
}

function parseTimePhrase(value: string): Pick<NigeriaDateParts, "hour" | "minute"> {
  const parsed = tryParseTimePhrase(value);
  if (!parsed) throw new Error("Enter a valid reminder time.");
  return parsed;
}

function tryParseTimePhrase(value: string): Pick<NigeriaDateParts, "hour" | "minute"> | undefined {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return undefined;
  return parseHourMinute(match[1], match[2], match[3]);
}

function parseHourMinute(hourValue: string, minuteValue?: string, meridiem?: string): Pick<NigeriaDateParts, "hour" | "minute"> {
  let hour = Number(hourValue);
  const minute = Number(minuteValue ?? 0);
  const marker = meridiem?.toLowerCase();

  if (marker === "pm" && hour < 12) hour += 12;
  if (marker === "am" && hour === 12) hour = 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) throw new Error("Enter a valid reminder time.");
  return { hour, minute };
}

function nigeriaPartsToIso(parts: NigeriaDateParts): string {
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - WAT_OFFSET_MINUTES * 60 * 1000;
  const date = new Date(utcMs);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid reminder time.");
  return date.toISOString();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

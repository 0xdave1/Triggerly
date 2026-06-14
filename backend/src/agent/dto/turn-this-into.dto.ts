import { IsIn, IsString } from "class-validator";

export const TURN_INTO_TYPES = [
  "reminder",
  "checklist",
  "habit",
  "memory",
  "email_draft",
  "travel_plan",
  "weather_alert",
  "price_memory"
] as const;

export class TurnThisIntoDto {
  @IsString()
  sourceMessageId!: string;

  @IsIn(TURN_INTO_TYPES)
  targetType!: (typeof TURN_INTO_TYPES)[number];
}

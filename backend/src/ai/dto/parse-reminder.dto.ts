import { IsString, MinLength } from "class-validator";

export class ParseReminderDto {
  @IsString()
  @MinLength(1)
  input!: string;
}

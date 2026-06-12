import { IsString, MinLength } from "class-validator";

export class ParseIntentDto {
  @IsString()
  @MinLength(2)
  input!: string;
}

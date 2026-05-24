import { IsString, MinLength } from "class-validator";

export class ParseTriggerDto {
  @IsString()
  @MinLength(1)
  input!: string;
}

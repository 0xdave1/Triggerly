import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { IsEnum } from "class-validator";
import { HabitFrequencyType } from "@/common/enums";

export class CreateHabitDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsEnum(HabitFrequencyType)
  frequencyType!: HabitFrequencyType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  frequencyCount!: number;
}

import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { PromiseStatus } from "@/common/enums";

export class CreatePromiseDto {
  @IsString() @MinLength(1) personName!: string;
  @IsString() @MinLength(1) taskTitle!: string;
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsString() sourceMemoryId?: string;
}

export class UpdatePromiseDto {
  @IsOptional() @IsString() personName?: string;
  @IsOptional() @IsString() taskTitle?: string;
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsEnum(PromiseStatus) status?: PromiseStatus;
}

export class PromiseReminderDto {
  @IsOptional() @IsDateString() remindAt?: string;
}

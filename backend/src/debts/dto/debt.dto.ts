import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DebtDirection, DebtStatus } from "@/common/enums";

export class CreateDebtDto {
  @IsString() personName!: string;
  @IsNumber() @Min(0) amount!: number;
  @IsOptional() @IsString() currency?: string;
  @IsEnum(DebtDirection) direction!: DebtDirection;
  @IsOptional() @IsString() sourceMemoryId?: string;
}

export class UpdateDebtDto {
  @IsOptional() @IsString() personName?: string;
  @IsOptional() @IsNumber() @Min(0) amount?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsEnum(DebtDirection) direction?: DebtDirection;
  @IsOptional() @IsEnum(DebtStatus) status?: DebtStatus;
}

export class DebtReminderDto {
  @IsOptional() @IsDateString() remindAt?: string;
}

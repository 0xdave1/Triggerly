import { IsBoolean, IsOptional } from "class-validator";

export class UpdateWidgetPreferenceDto {
  @IsOptional() @IsBoolean() nextTriggerEnabled?: boolean;
  @IsOptional() @IsBoolean() briefingEnabled?: boolean;
  @IsOptional() @IsBoolean() pendingActionsEnabled?: boolean;
  @IsOptional() @IsBoolean() weatherEnabled?: boolean;
  @IsOptional() @IsBoolean() habitsEnabled?: boolean;
}

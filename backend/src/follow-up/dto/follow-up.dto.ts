import { IsEnum, IsObject, IsString } from "class-validator";
import { FollowUpSourceType } from "@/common/enums";

export class GenerateFollowUpDto {
  @IsEnum(FollowUpSourceType) sourceType!: FollowUpSourceType;
  @IsString() sourceId!: string;
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() suggestedActionType!: string;
  @IsObject() payload!: Record<string, unknown>;
}

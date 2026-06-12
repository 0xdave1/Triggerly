import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SendChatMessageDto {
  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;
}

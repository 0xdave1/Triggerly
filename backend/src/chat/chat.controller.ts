import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ChatService } from "./chat.service";
import { SendChatMessageDto } from "./dto/chat-message.dto";

@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post("messages")
  send(@CurrentUser() user: AuthUser, @Body() dto: SendChatMessageDto) {
    return this.chat.sendMessage(user.id, dto);
  }

  @Get("conversations")
  list(@CurrentUser() user: AuthUser) {
    return this.chat.listConversations(user.id);
  }

  @Get("conversations/:id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.chat.getConversation(user.id, id);
  }

  @Delete("conversations/:id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.chat.deleteConversation(user.id, id);
  }
}

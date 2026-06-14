import { Module } from "@nestjs/common";
import { AgentModule } from "@/agent/agent.module";
import { AiModule } from "@/ai/ai.module";
import { PrivacyModule } from "@/privacy/privacy.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { IntentClassifierService } from "./intent-classifier.service";

@Module({
  imports: [AgentModule, AiModule, PrivacyModule],
  controllers: [ChatController],
  providers: [ChatService, IntentClassifierService],
  exports: [ChatService]
})
export class ChatModule {}

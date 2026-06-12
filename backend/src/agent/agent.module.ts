import { Module } from "@nestjs/common";
import { ActionPromptsModule } from "@/action-prompts/action-prompts.module";
import { AiModule } from "@/ai/ai.module";
import { LiveContextModule } from "@/live-context/live-context.module";
import { MemoryModule } from "@/memory/memory.module";
import { PrivacyModule } from "@/privacy/privacy.module";
import { RemindersModule } from "@/reminders/reminders.module";
import { TriggersModule } from "@/triggers/triggers.module";
import { VoiceModule } from "@/voice/voice.module";
import { AgentController } from "./agent.controller";
import { AgentOrchestratorService } from "./agent-orchestrator.service";

@Module({
  imports: [
    AiModule,
    PrivacyModule,
    RemindersModule,
    TriggersModule,
    MemoryModule,
    LiveContextModule,
    ActionPromptsModule,
    VoiceModule
  ],
  controllers: [AgentController],
  providers: [AgentOrchestratorService],
  exports: [AgentOrchestratorService]
})
export class AgentModule {}

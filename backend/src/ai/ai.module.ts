import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { AiIntentService } from "./ai-intent.service";
import { AiController } from "./ai.controller";
import { AiTriggerParserService } from "./ai-trigger-parser.service";
import { AiService } from "./ai.service";
import { HeuristicIntentParserProvider } from "./heuristic-intent-parser.provider";
import { OpenAiIntentParserProvider } from "./openai-intent-parser.provider";

@Module({
  imports: [PrivacyModule],
  controllers: [AiController],
  providers: [AiService, AiIntentService, AiTriggerParserService, HeuristicIntentParserProvider, OpenAiIntentParserProvider],
  exports: [AiService, AiIntentService, AiTriggerParserService]
})
export class AiModule {}

import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiTriggerParserService } from "./ai-trigger-parser.service";
import { AiService } from "./ai.service";

@Module({
  controllers: [AiController],
  providers: [AiService, AiTriggerParserService],
  exports: [AiService, AiTriggerParserService]
})
export class AiModule {}

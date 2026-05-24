import { Module } from "@nestjs/common";
import { ActionPromptsController } from "./action-prompts.controller";
import { ActionPromptsService } from "./action-prompts.service";

@Module({
  controllers: [ActionPromptsController],
  providers: [ActionPromptsService],
  exports: [ActionPromptsService]
})
export class ActionPromptsModule {}

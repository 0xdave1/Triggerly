import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { ActionPromptsController } from "./action-prompts.controller";
import { ActionPromptsService } from "./action-prompts.service";

@Module({
  imports: [PrivacyModule],
  controllers: [ActionPromptsController],
  providers: [ActionPromptsService],
  exports: [ActionPromptsService]
})
export class ActionPromptsModule {}

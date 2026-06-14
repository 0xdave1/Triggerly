import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { BriefingsController } from "./briefings.controller";
import { BriefingsService } from "./briefings.service";

@Module({
  imports: [PrivacyModule],
  controllers: [BriefingsController],
  providers: [BriefingsService],
  exports: [BriefingsService]
})
export class BriefingsModule {}

import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { TriggersController } from "./triggers.controller";
import { TriggersService } from "./triggers.service";

@Module({
  imports: [PrivacyModule],
  controllers: [TriggersController],
  providers: [TriggersService],
  exports: [TriggersService]
})
export class TriggersModule {}

import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { AccountabilityController } from "./accountability.controller";
import { AccountabilityService } from "./accountability.service";

@Module({ imports: [PrivacyModule], controllers: [AccountabilityController], providers: [AccountabilityService], exports: [AccountabilityService] })
export class AccountabilityModule {}

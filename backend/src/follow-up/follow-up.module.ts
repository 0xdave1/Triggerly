import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { FollowUpController } from "./follow-up.controller";
import { FollowUpService } from "./follow-up.service";

@Module({ imports: [PrivacyModule], controllers: [FollowUpController], providers: [FollowUpService], exports: [FollowUpService] })
export class FollowUpModule {}

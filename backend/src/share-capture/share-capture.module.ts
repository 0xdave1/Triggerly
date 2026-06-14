import { Module } from "@nestjs/common";
import { AiModule } from "@/ai/ai.module";
import { AgentModule } from "@/agent/agent.module";
import { PrivacyModule } from "@/privacy/privacy.module";
import { ShareCaptureController } from "./share-capture.controller";
import { ShareCaptureService } from "./share-capture.service";

@Module({ imports: [AiModule, AgentModule, PrivacyModule], controllers: [ShareCaptureController], providers: [ShareCaptureService], exports: [ShareCaptureService] })
export class ShareCaptureModule {}

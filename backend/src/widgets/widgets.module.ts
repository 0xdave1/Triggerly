import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { WidgetsController } from "./widgets.controller";
import { WidgetsService } from "./widgets.service";

@Module({ imports: [PrivacyModule], controllers: [WidgetsController], providers: [WidgetsService], exports: [WidgetsService] })
export class WidgetsModule {}

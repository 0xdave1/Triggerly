import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { TravelController } from "./travel.controller";
import { TravelService } from "./travel.service";

@Module({ imports: [PrivacyModule], controllers: [TravelController], providers: [TravelService], exports: [TravelService] })
export class TravelModule {}

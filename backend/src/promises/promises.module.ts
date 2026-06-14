import { Module } from "@nestjs/common";
import { MemoryModule } from "@/memory/memory.module";
import { PrivacyModule } from "@/privacy/privacy.module";
import { PromisesController } from "./promises.controller";
import { PromisesService } from "./promises.service";

@Module({ imports: [PrivacyModule, MemoryModule], controllers: [PromisesController], providers: [PromisesService], exports: [PromisesService] })
export class PromisesModule {}

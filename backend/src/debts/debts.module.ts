import { Module } from "@nestjs/common";
import { MemoryModule } from "@/memory/memory.module";
import { PrivacyModule } from "@/privacy/privacy.module";
import { DebtsController } from "./debts.controller";
import { DebtsService } from "./debts.service";

@Module({ imports: [PrivacyModule, MemoryModule], controllers: [DebtsController], providers: [DebtsService], exports: [DebtsService] })
export class DebtsModule {}

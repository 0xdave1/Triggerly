import { Module } from "@nestjs/common";
import { MemoryModule } from "@/memory/memory.module";
import { PrivacyModule } from "@/privacy/privacy.module";
import { PricesController } from "./prices.controller";
import { PricesService } from "./prices.service";

@Module({ imports: [PrivacyModule, MemoryModule], controllers: [PricesController], providers: [PricesService], exports: [PricesService] })
export class PricesModule {}

import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { MemoryController } from "./memory.controller";
import { MemorySearchProvider } from "./memory-search.provider";
import { MemoryService } from "./memory.service";

@Module({
  imports: [PrivacyModule],
  controllers: [MemoryController],
  providers: [MemoryService, MemorySearchProvider],
  exports: [MemoryService, MemorySearchProvider]
})
export class MemoryModule {}

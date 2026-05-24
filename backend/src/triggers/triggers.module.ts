import { Module } from "@nestjs/common";
import { TriggersService } from "./triggers.service";

@Module({
  providers: [TriggersService],
  exports: [TriggersService]
})
export class TriggersModule {}

import { Module } from "@nestjs/common";
import { ContactMemoriesController } from "./contact-memories.controller";
import { ContactMemoriesService } from "./contact-memories.service";

@Module({
  controllers: [ContactMemoriesController],
  providers: [ContactMemoriesService],
  exports: [ContactMemoriesService]
})
export class ContactMemoriesModule {}

import { Module } from "@nestjs/common";
import { ReminderEventsService } from "./reminder-events.service";

@Module({
  providers: [ReminderEventsService],
  exports: [ReminderEventsService]
})
export class ReminderEventsModule {}

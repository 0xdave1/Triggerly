import { Module } from "@nestjs/common";
import { ReminderEventsModule } from "@/events/reminder-events.module";
import { NotificationsModule } from "@/notifications/notifications.module";
import { TriggersModule } from "@/triggers/triggers.module";
import { RemindersController } from "./reminders.controller";
import { RemindersService } from "./reminders.service";

@Module({
  imports: [ReminderEventsModule, NotificationsModule, TriggersModule],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService]
})
export class RemindersModule {}

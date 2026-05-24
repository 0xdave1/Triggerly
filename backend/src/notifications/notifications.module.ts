import { Module } from "@nestjs/common";
import { NotificationQueueProcessor } from "./notification-queue.processor";
import { NotificationsService } from "./notifications.service";

@Module({
  providers: [NotificationsService, NotificationQueueProcessor],
  exports: [NotificationsService]
})
export class NotificationsModule {}

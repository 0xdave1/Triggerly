import { Job } from "bullmq";
import { NotificationsService, ReminderNotificationJob } from "./notifications.service";

export class NotificationQueueProcessor {
  constructor(private readonly notifications: NotificationsService) {
  }

  async process(job: Job<ReminderNotificationJob>) {
    if (job.name === "time-reminder") {
      await this.notifications.sendPushPlaceholder(job.data.userId, job.data.reminderId);
    }
  }
}

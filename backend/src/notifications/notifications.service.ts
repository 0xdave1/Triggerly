import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";

export type ReminderNotificationJob = {
  reminderId: string;
  userId: string;
  triggerDateTime: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly queue?: Queue<ReminderNotificationJob>;
  private readonly memoryJobs = new Map<string, ReminderNotificationJob>();

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>("redisUrl")?.trim();
    if (redisUrl) {
      let parsed: URL;
      try {
        parsed = new URL(redisUrl);
      } catch {
        this.logger.warn("REDIS_URL is invalid. Notification queue disabled; using in-memory scheduling placeholder.");
        return;
      }

      if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
        this.logger.warn("REDIS_URL must use redis:// or rediss://. Notification queue disabled; using in-memory scheduling placeholder.");
        return;
      }

      this.queue = new Queue<ReminderNotificationJob>("notifications", {
        connection: {
          host: parsed.hostname,
          port: Number(parsed.port || 6379),
          username: parsed.username || undefined,
          password: parsed.password || undefined,
          tls: parsed.protocol === "rediss:" ? {} : undefined
        }
      });
    }
  }

  async scheduleTimeReminderNotification(job: ReminderNotificationJob) {
    if (!this.queue) {
      this.memoryJobs.set(job.reminderId, job);
      return;
    }

    const delay = Math.max(0, new Date(job.triggerDateTime).getTime() - Date.now());
    await this.queue.add("time-reminder", job, {
      delay,
      jobId: `reminder:${job.reminderId}`,
      removeOnComplete: true,
      removeOnFail: 50
    });
  }

  async cancelReminderNotification(reminderId: string) {
    if (!this.queue) {
      this.memoryJobs.delete(reminderId);
      return;
    }

    const job = await this.queue.getJob(`reminder:${reminderId}`);
    await job?.remove();
  }

  async sendPushPlaceholder(userId: string, reminderId: string) {
    this.logger.log(`Push provider placeholder for user=${userId} reminder=${reminderId}`);
  }
}

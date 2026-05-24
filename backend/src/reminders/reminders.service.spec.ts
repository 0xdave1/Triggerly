import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ReminderEventType, ReminderStatus, ReminderType } from "@/common/enums";
import { ReminderEventsService } from "@/events/reminder-events.service";
import { NotificationsService } from "@/notifications/notifications.service";
import { TriggersService } from "@/triggers/triggers.service";
import { RemindersService } from "./reminders.service";

describe("RemindersService", () => {
  const triggers = new TriggersService();
  const events = { create: jest.fn(), createForOwnedReminder: jest.fn() } as unknown as ReminderEventsService;
  const notifications = {
    scheduleTimeReminderNotification: jest.fn(),
    cancelReminderNotification: jest.fn()
  } as unknown as NotificationsService;

  beforeEach(() => jest.clearAllMocks());

  it("rejects TIME reminders without timeTrigger", async () => {
    const service = new RemindersService({} as any, triggers, events, notifications);
    await expect(service.create("u1", { title: "Call", type: ReminderType.TIME })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates reminder, trigger, and CREATED event in a transaction", async () => {
    const created = { id: "r1", timeTrigger: { triggerDateTime: new Date(Date.now() + 60000) } };
    const prisma = {
      $transaction: jest.fn((callback) =>
        callback({
          reminder: {
            create: jest.fn().mockResolvedValue(created)
          }
        })
      )
    };
    const service = new RemindersService(prisma as any, triggers, events, notifications);

    const result = await service.create("u1", {
      title: "Call",
      type: ReminderType.TIME,
      timeTrigger: { triggerDateTime: new Date(Date.now() + 60000).toISOString(), timezone: "UTC" }
    });

    expect(result).toBe(created);
    expect(notifications.scheduleTimeReminderNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1", reminderId: "r1" }));
  });

  it("protects ownership by returning not found", async () => {
    const prisma = { reminder: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new RemindersService(prisma as any, triggers, events, notifications);
    await expect(service.get("u1", "other-reminder")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("completes reminders and records an event", async () => {
    const prisma = {
      reminder: {
        findFirst: jest.fn().mockResolvedValue({ id: "r1" }),
        update: jest.fn().mockResolvedValue({ id: "r1", status: ReminderStatus.COMPLETED })
      }
    };
    const service = new RemindersService(prisma as any, triggers, events, notifications);

    await service.complete("u1", "r1");

    expect(notifications.cancelReminderNotification).toHaveBeenCalledWith("r1");
    expect(events.create).toHaveBeenCalledWith("u1", "r1", ReminderEventType.COMPLETED);
  });

  it("snoozes reminders and upserts a time trigger", async () => {
    const prisma = {
      reminder: {
        findFirst: jest.fn().mockResolvedValue({ id: "r1" }),
        update: jest.fn().mockResolvedValue({ id: "r1", timeTrigger: { triggerDateTime: new Date("2026-05-22T10:00:00.000Z") } })
      }
    };
    const service = new RemindersService(prisma as any, triggers, events, notifications);

    await service.snooze("u1", "r1", { snoozeUntil: "2026-05-22T10:00:00.000Z" });

    expect(prisma.reminder.update.mock.calls[0][0].data.status).toBe(ReminderStatus.SNOOZED);
    expect(events.create).toHaveBeenCalledWith("u1", "r1", ReminderEventType.SNOOZED, { snoozeUntil: "2026-05-22T10:00:00.000Z" });
  });
});

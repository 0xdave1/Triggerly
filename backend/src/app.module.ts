import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { validateEnv } from "./config/env.schema";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RemindersModule } from "./reminders/reminders.module";
import { HabitsModule } from "./habits/habits.module";
import { ReminderEventsModule } from "./events/reminder-events.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AiModule } from "./ai/ai.module";
import { PrivacyModule } from "./privacy/privacy.module";
import { DevicesModule } from "./devices/devices.module";
import { TriggersModule } from "./triggers/triggers.module";
import { VoiceModule } from "./voice/voice.module";
import { ContactMemoriesModule } from "./contact-memories/contact-memories.module";
import { ActionPromptsModule } from "./action-prompts/action-prompts.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RemindersModule,
    TriggersModule,
    HabitsModule,
    ReminderEventsModule,
    NotificationsModule,
    DevicesModule,
    AiModule,
    PrivacyModule,
    VoiceModule,
    ContactMemoriesModule,
    ActionPromptsModule,
    HealthModule
  ]
})
export class AppModule {}

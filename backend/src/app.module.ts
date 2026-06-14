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
import { MemoryModule } from "./memory/memory.module";
import { LiveContextModule } from "./live-context/live-context.module";
import { AgentModule } from "./agent/agent.module";
import { ChatModule } from "./chat/chat.module";
import { BriefingsModule } from "./briefings/briefings.module";
import { PromisesModule } from "./promises/promises.module";
import { DebtsModule } from "./debts/debts.module";
import { PricesModule } from "./prices/prices.module";
import { TravelModule } from "./travel/travel.module";
import { AccountabilityModule } from "./accountability/accountability.module";
import { FollowUpModule } from "./follow-up/follow-up.module";
import { WidgetsModule } from "./widgets/widgets.module";
import { ShareCaptureModule } from "./share-capture/share-capture.module";

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
    MemoryModule,
    LiveContextModule,
    AgentModule,
    ChatModule,
    BriefingsModule,
    PromisesModule,
    DebtsModule,
    PricesModule,
    TravelModule,
    AccountabilityModule,
    FollowUpModule,
    WidgetsModule,
    ShareCaptureModule,
    HealthModule
  ]
})
export class AppModule {}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CreateReminderEventDto } from "@/events/dto/create-reminder-event.dto";
import { CreateReminderDto } from "./dto/create-reminder.dto";
import { ListRemindersDto } from "./dto/list-reminders.dto";
import { SnoozeReminderDto } from "./dto/snooze-reminder.dto";
import { UpdateReminderDto } from "./dto/update-reminder.dto";
import { RemindersService } from "./reminders.service";

@UseGuards(JwtAuthGuard)
@Controller("reminders")
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListRemindersDto) {
    return this.reminders.list(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReminderDto) {
    return this.reminders.create(user.id, dto);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reminders.get(user.id, id);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateReminderDto) {
    return this.reminders.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reminders.softDelete(user.id, id);
  }

  @Post(":id/complete")
  complete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reminders.complete(user.id, id);
  }

  @Post(":id/snooze")
  snooze(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: SnoozeReminderDto) {
    return this.reminders.snooze(user.id, id, dto);
  }

  @Post(":id/events")
  createEvent(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: CreateReminderEventDto) {
    return this.reminders.createEvent(user.id, id, dto);
  }
}

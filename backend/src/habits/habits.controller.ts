import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CreateHabitDto } from "./dto/create-habit.dto";
import { HabitsService } from "./habits.service";

@UseGuards(JwtAuthGuard)
@Controller("habits")
export class HabitsController {
  constructor(private readonly habits: HabitsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.habits.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHabitDto) {
    return this.habits.create(user.id, dto);
  }

  @Patch(":id/complete")
  complete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.habits.complete(user.id, id);
  }
}

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CreatePromiseDto, PromiseReminderDto, UpdatePromiseDto } from "./dto/promise.dto";
import { PromisesService } from "./promises.service";

@UseGuards(JwtAuthGuard)
@Controller("promises")
export class PromisesController {
  constructor(private readonly promises: PromisesService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.promises.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreatePromiseDto) { return this.promises.create(user.id, dto); }
  @Patch(":id") update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdatePromiseDto) { return this.promises.update(user.id, id, dto); }
  @Post(":id/complete") complete(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.promises.complete(user.id, id); }
  @Post(":id/create-reminder") reminder(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: PromiseReminderDto) { return this.promises.createReminder(user.id, id, dto); }
}

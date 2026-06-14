import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { DebtsService } from "./debts.service";
import { CreateDebtDto, DebtReminderDto, UpdateDebtDto } from "./dto/debt.dto";

@UseGuards(JwtAuthGuard)
@Controller("debts")
export class DebtsController {
  constructor(private readonly debts: DebtsService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.debts.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateDebtDto) { return this.debts.create(user.id, dto); }
  @Patch(":id") update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateDebtDto) { return this.debts.update(user.id, id, dto); }
  @Post(":id/settle") settle(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.debts.settle(user.id, id); }
  @Post(":id/create-reminder") reminder(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: DebtReminderDto) { return this.debts.createReminder(user.id, id, dto); }
}

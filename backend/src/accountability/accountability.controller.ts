import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { AccountabilityService } from "./accountability.service";
import { AccountabilityCheckInDto, CreateAccountabilityGoalDto, UpdateAccountabilityGoalDto } from "./dto/accountability.dto";

@UseGuards(JwtAuthGuard)
@Controller("accountability/goals")
export class AccountabilityController {
  constructor(private readonly accountability: AccountabilityService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.accountability.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateAccountabilityGoalDto) { return this.accountability.create(user.id, dto); }
  @Patch(":id") update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateAccountabilityGoalDto) { return this.accountability.update(user.id, id, dto); }
  @Post(":id/check-in") checkIn(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: AccountabilityCheckInDto) { return this.accountability.checkIn(user.id, id, dto); }
  @Post(":id/pause") pause(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.accountability.pause(user.id, id); }
}

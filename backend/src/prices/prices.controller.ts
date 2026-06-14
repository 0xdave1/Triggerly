import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CreatePriceDto, PriceReminderDto } from "./dto/price.dto";
import { PricesService } from "./prices.service";

@UseGuards(JwtAuthGuard)
@Controller("prices")
export class PricesController {
  constructor(private readonly prices: PricesService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.prices.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreatePriceDto) { return this.prices.create(user.id, dto); }
  @Get("compare") compare(@CurrentUser() user: AuthUser, @Query("itemName") itemName: string) { return this.prices.compare(user.id, itemName); }
  @Get(":itemName/history") history(@CurrentUser() user: AuthUser, @Param("itemName") itemName: string) { return this.prices.history(user.id, itemName); }
  @Post(":id/create-reminder") reminder(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: PriceReminderDto) { return this.prices.createReminder(user.id, id, dto); }
}

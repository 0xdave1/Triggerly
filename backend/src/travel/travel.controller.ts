import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CreateTravelPlanDto, UpdateTravelPlanDto } from "./dto/travel.dto";
import { TravelService } from "./travel.service";

@UseGuards(JwtAuthGuard)
@Controller("travel-plans")
export class TravelController {
  constructor(private readonly travel: TravelService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.travel.list(user.id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateTravelPlanDto) { return this.travel.create(user.id, dto); }
  @Get(":id") get(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.travel.get(user.id, id); }
  @Patch(":id") update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateTravelPlanDto) { return this.travel.update(user.id, id, dto); }
  @Post(":id/generate-checklist") checklist(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.travel.generateChecklist(user.id, id); }
  @Post(":id/enable-weather-alerts") weather(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.travel.enableWeatherAlerts(user.id, id); }
  @Post(":id/complete") complete(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.travel.complete(user.id, id); }
}

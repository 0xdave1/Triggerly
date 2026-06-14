import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { UpdateWidgetPreferenceDto } from "./dto/widget.dto";
import { WidgetsService } from "./widgets.service";

@UseGuards(JwtAuthGuard)
@Controller("widgets")
export class WidgetsController {
  constructor(private readonly widgets: WidgetsService) {}
  @Get("summary") summary(@CurrentUser() user: AuthUser) { return this.widgets.summary(user.id); }
  @Get("preferences") preferences(@CurrentUser() user: AuthUser) { return this.widgets.preferences(user.id); }
  @Patch("preferences") update(@CurrentUser() user: AuthUser, @Body() dto: UpdateWidgetPreferenceDto) { return this.widgets.update(user.id, dto); }
}

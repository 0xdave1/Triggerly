import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { BriefingsService } from "./briefings.service";
import { GenerateBriefingDto, UpdateBriefingPreferenceDto } from "./dto/briefing.dto";

@UseGuards(JwtAuthGuard)
@Controller("briefings")
export class BriefingsController {
  constructor(private readonly briefings: BriefingsService) {}

  @Get("today") today(@CurrentUser() user: AuthUser) {
    return this.briefings.today(user.id);
  }

  @Post("generate") generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateBriefingDto) {
    return this.briefings.generate(user.id, dto);
  }

  @Get("preferences") preferences(@CurrentUser() user: AuthUser) {
    return this.briefings.getPreferences(user.id);
  }

  @Patch("preferences") updatePreferences(@CurrentUser() user: AuthUser, @Body() dto: UpdateBriefingPreferenceDto) {
    return this.briefings.updatePreferences(user.id, dto);
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { GenerateFollowUpDto } from "./dto/follow-up.dto";
import { FollowUpService } from "./follow-up.service";

@UseGuards(JwtAuthGuard)
@Controller("follow-up")
export class FollowUpController {
  constructor(private readonly followUp: FollowUpService) {}
  @Post("generate") generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateFollowUpDto) { return this.followUp.generate(user.id, dto); }
  @Get("suggestions") list(@CurrentUser() user: AuthUser) { return this.followUp.list(user.id); }
  @Post("suggestions/:id/accept") accept(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.followUp.accept(user.id, id); }
  @Post("suggestions/:id/dismiss") dismiss(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.followUp.dismiss(user.id, id); }
}

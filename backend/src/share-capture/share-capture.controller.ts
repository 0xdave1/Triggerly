import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CreateShareCaptureDto } from "./dto/share-capture.dto";
import { ShareCaptureService } from "./share-capture.service";

@UseGuards(JwtAuthGuard)
@Controller("share-capture")
export class ShareCaptureController {
  constructor(private readonly captures: ShareCaptureService) {}
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateShareCaptureDto) { return this.captures.create(user.id, dto); }
  @Get() list(@CurrentUser() user: AuthUser) { return this.captures.list(user.id); }
  @Post(":id/parse") parse(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.captures.parse(user.id, id); }
  @Post(":id/confirm") confirm(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.captures.confirm(user.id, id); }
}

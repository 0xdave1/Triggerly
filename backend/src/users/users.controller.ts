import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser, AuthUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.id);
  }
}

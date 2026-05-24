import { Body, Controller, Delete, Get, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { PrivacyService } from "./privacy.service";

@UseGuards(JwtAuthGuard)
@Controller("privacy")
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get("export")
  export(@CurrentUser() user: AuthUser) {
    return this.privacy.exportUserData(user.id);
  }

  @Delete("delete-account")
  deleteAccount(@CurrentUser() user: AuthUser, @Body() _dto: DeleteAccountDto) {
    return this.privacy.deleteAccount(user.id);
  }
}

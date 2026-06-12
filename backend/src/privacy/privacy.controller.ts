import { Body, Controller, Delete, Get, Patch, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { UpdatePrivacySettingsDto } from "./dto/update-privacy-settings.dto";
import { PrivacyService } from "./privacy.service";

@UseGuards(JwtAuthGuard)
@Controller("privacy")
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get("export")
  export(@CurrentUser() user: AuthUser) {
    return this.privacy.exportUserData(user.id);
  }

  @Get("settings")
  settings(@CurrentUser() user: AuthUser) {
    return this.privacy.getSettings(user.id);
  }

  @Patch("settings")
  updateSettings(@CurrentUser() user: AuthUser, @Body() dto: UpdatePrivacySettingsDto) {
    return this.privacy.updateSettings(user.id, dto);
  }

  @Delete("delete-account")
  deleteAccount(@CurrentUser() user: AuthUser, @Body() _dto: DeleteAccountDto) {
    return this.privacy.deleteAccount(user.id);
  }
}

import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { DeviceDto } from "./dto/device.dto";
import { DevicesService } from "./devices.service";

@UseGuards(JwtAuthGuard)
@Controller("devices")
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post()
  register(@CurrentUser() user: AuthUser, @Body() dto: DeviceDto) {
    return this.devices.register(user.id, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: DeviceDto) {
    return this.devices.update(user.id, id, dto);
  }
}

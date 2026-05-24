import { IsEnum, IsString } from "class-validator";
import { DevicePlatform } from "@/common/enums";

export class DeviceDto {
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @IsString()
  pushToken!: string;
}

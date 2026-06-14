import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ConfirmMemoryFromIntentDto, CreateMemoryItemDto, ListMemoryDto, UpdateMemoryItemDto } from "./dto/memory-item.dto";
import { MemoryService } from "./memory.service";

@UseGuards(JwtAuthGuard)
@Controller("memory")
export class MemoryController {
  constructor(private readonly memory: MemoryService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() dto: ListMemoryDto) {
    return this.memory.list(user.id, dto);
  }

  @Get("timeline")
  timeline(@CurrentUser() user: AuthUser) {
    return this.memory.timeline(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMemoryItemDto) {
    return this.memory.create(user.id, dto);
  }

  @Post("confirm-from-intent")
  confirmFromIntent(@CurrentUser() user: AuthUser, @Body() dto: ConfirmMemoryFromIntentDto) {
    return this.memory.confirmFromIntent(user.id, dto);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.memory.get(user.id, id);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateMemoryItemDto) {
    return this.memory.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.memory.remove(user.id, id);
  }

  @Post(":id/archive")
  archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.memory.archive(user.id, id);
  }
}

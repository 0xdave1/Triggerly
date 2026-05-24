import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ContactMemoryDto } from "./dto/contact-memory.dto";
import { ContactMemoriesService } from "./contact-memories.service";

@UseGuards(JwtAuthGuard)
@Controller("contact-memories")
export class ContactMemoriesController {
  constructor(private readonly contacts: ContactMemoriesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.contacts.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: ContactMemoryDto) {
    return this.contacts.create(user.id, dto);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.contacts.get(user.id, id);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ContactMemoryDto) {
    return this.contacts.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.contacts.remove(user.id, id);
  }
}

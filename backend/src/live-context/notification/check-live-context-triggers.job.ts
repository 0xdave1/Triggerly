import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LiveContextService } from "../live-context.service";

@Injectable()
export class CheckLiveContextTriggersJob {
  constructor(
    private readonly config: ConfigService,
    private readonly liveContext: LiveContextService
  ) {}

  async runOnce() {
    return this.liveContext.checkLiveContextTriggers();
  }

  schedulingStatus() {
    return {
      enabled: Boolean(this.config.get("redisUrl")),
      queue: "live-context-checks",
      limitation: this.config.get("redisUrl") ? undefined : "Redis/BullMQ is not configured, so periodic checks are pending."
    };
  }
}

import { Module } from "@nestjs/common";
import { PrivacyModule } from "@/privacy/privacy.module";
import { ExchangeRateProviderService } from "./exchange-rate/exchange-rate.provider";
import { LiveContextController } from "./live-context.controller";
import { LiveContextService } from "./live-context.service";
import { CheckLiveContextTriggersJob } from "./notification/check-live-context-triggers.job";
import { PriceContextService } from "./price/price-context.service";
import { WeatherProviderService } from "./weather/weather.provider";

@Module({
  imports: [PrivacyModule],
  controllers: [LiveContextController],
  providers: [LiveContextService, WeatherProviderService, ExchangeRateProviderService, PriceContextService, CheckLiveContextTriggersJob],
  exports: [LiveContextService, WeatherProviderService, ExchangeRateProviderService, PriceContextService, CheckLiveContextTriggersJob]
})
export class LiveContextModule {}

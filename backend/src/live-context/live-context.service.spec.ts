import { ForbiddenException } from "@nestjs/common";
import { LiveContextTriggerStatus, LiveContextTriggerType, PriceLogSource, TriggerType } from "@/common/enums";
import { ExchangeRateProviderService } from "./exchange-rate/exchange-rate.provider";
import { LiveContextService } from "./live-context.service";
import { PriceContextService } from "./price/price-context.service";
import { WeatherProviderService } from "./weather/weather.provider";

describe("LiveContextService", () => {
  const config = { get: jest.fn().mockReturnValue("") };

  function prismaMock() {
    return {
      liveContextTrigger: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "lt1", ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ id: "lt1", userId: "u1" }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "lt1", ...data }))
      },
      priceLog: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "p1", ...data })),
        findMany: jest.fn().mockResolvedValue([{ id: "p1", itemName: "rice", price: 6500 }])
      }
    };
  }

  function service(overrides?: { privacy?: any; prisma?: any }) {
    const prisma = overrides?.prisma ?? prismaMock();
    return {
      prisma,
      service: new LiveContextService(
        prisma as any,
        overrides?.privacy ?? ({ assertCanCreateTrigger: jest.fn().mockResolvedValue(undefined), getSettings: jest.fn().mockResolvedValue({ priceMemoryEnabled: true }) } as any),
        new WeatherProviderService(config as any),
        new ExchangeRateProviderService(config as any),
        new PriceContextService(prisma as any)
      )
    };
  }

  it("returns provider_not_configured for weather without fetching external data", async () => {
    await expect(service().service.getWeatherContext({ location: "Lagos" })).resolves.toMatchObject({
      capability: "weather",
      status: "provider_not_configured",
      requiresUserConfirmation: true,
      input: { location: "Lagos" }
    });
  });

  it("returns provider_not_configured for exchange rates without fetching external data", async () => {
    await expect(service().service.getExchangeRateContext({ base: "usd", quote: "ngn" })).resolves.toMatchObject({
      capability: "exchange_rate",
      status: "provider_not_configured",
      requiresUserConfirmation: true,
      input: { base: "USD", quote: "NGN" }
    });
  });

  it("blocks weather triggers when disabled by privacy settings", async () => {
    const privacy = { assertCanCreateTrigger: jest.fn().mockRejectedValue(new ForbiddenException()) };
    const setup = service({ privacy });

    await expect(setup.service.createWeatherTrigger("u1", { title: "Abuja rain", location: "Abuja" })).rejects.toBeInstanceOf(ForbiddenException);
    expect(privacy.assertCanCreateTrigger).toHaveBeenCalledWith("u1", TriggerType.WEATHER);
  });

  it("blocks exchange triggers when disabled by privacy settings", async () => {
    const privacy = { assertCanCreateTrigger: jest.fn().mockRejectedValue(new ForbiddenException()) };
    const setup = service({ privacy });

    await expect(setup.service.createExchangeRateTrigger("u1", { title: "Dollar target", base: "usd", quote: "ngn", targetRate: 1600 })).rejects.toBeInstanceOf(ForbiddenException);
    expect(privacy.assertCanCreateTrigger).toHaveBeenCalledWith("u1", TriggerType.EXCHANGE_RATE);
  });

  it("creates active weather triggers with condition JSON", async () => {
    const setup = service();

    await setup.service.createWeatherTrigger("u1", { title: "Rain in Abuja", location: "Abuja", date: "tomorrow", event: "rain_probability_above", threshold: 50 });

    expect(setup.prisma.liveContextTrigger.create.mock.calls[0][0].data).toMatchObject({
      userId: "u1",
      type: LiveContextTriggerType.WEATHER,
      title: "Rain in Abuja",
      status: LiveContextTriggerStatus.ACTIVE,
      condition: { location: "Abuja", date: "tomorrow", event: "rain_probability_above", threshold: 50 }
    });
  });

  it("creates price logs when price memory is enabled", async () => {
    const setup = service();

    await setup.service.createPriceLog("u1", { itemName: "rice", price: 6500, placeName: "Bodija", source: PriceLogSource.MANUAL });

    expect(setup.prisma.priceLog.create.mock.calls[0][0].data).toMatchObject({
      userId: "u1",
      itemName: "rice",
      price: 6500,
      currency: "NGN",
      placeName: "Bodija",
      source: PriceLogSource.MANUAL
    });
  });

  it("retrieves price history by owned user and item", async () => {
    const setup = service();

    await setup.service.getPriceHistory("u1", "rice");

    expect(setup.prisma.priceLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "u1", itemName: { equals: "rice", mode: "insensitive" } },
      orderBy: { loggedAt: "asc" }
    }));
  });
});

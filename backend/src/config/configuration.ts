export default () => ({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d"
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:8081")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  redisUrl: process.env.REDIS_URL,
  enableSwagger: process.env.ENABLE_SWAGGER === "true",
  aiProvider: process.env.AI_PROVIDER ?? "heuristic",
  weatherProvider: process.env.WEATHER_PROVIDER ?? "",
  weatherApiKey: process.env.WEATHER_API_KEY ?? "",
  exchangeRateProvider: process.env.EXCHANGE_RATE_PROVIDER ?? "",
  exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY ?? "",
  pushProvider: process.env.PUSH_PROVIDER ?? "expo"
});

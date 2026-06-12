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
  ai: {
    provider: process.env.AI_PROVIDER ?? "heuristic",
    baseUrl: process.env.AI_BASE_URL ?? "https://api.freemodel.dev",
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "gpt-5.5",
    reasoningEffort: process.env.AI_REASONING_EFFORT ?? "xhigh",
    disableResponseStorage: process.env.AI_DISABLE_RESPONSE_STORAGE !== "false"
  },
  weatherProvider: process.env.WEATHER_PROVIDER ?? "",
  weatherApiKey: process.env.WEATHER_API_KEY ?? "",
  exchangeRateProvider: process.env.EXCHANGE_RATE_PROVIDER ?? "",
  exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY ?? "",
  pushProvider: process.env.PUSH_PROVIDER ?? "expo"
});

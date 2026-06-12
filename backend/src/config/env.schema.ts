import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGINS: z.string().optional(),
  REDIS_URL: z.string().optional().default(""),
  ENABLE_SWAGGER: z.string().optional().default("false"),
  AI_PROVIDER: z.enum(["heuristic", "freemodel", "openai"]).default("heuristic"),
  AI_BASE_URL: z.string().url().default("https://api.freemodel.dev"),
  OPENAI_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().min(1).default("gpt-5.5"),
  AI_REASONING_EFFORT: z.enum(["none", "minimal", "low", "medium", "high", "xhigh"]).default("xhigh"),
  AI_DISABLE_RESPONSE_STORAGE: z.enum(["true", "false"]).default("true"),
  WEATHER_PROVIDER: z.string().optional().default(""),
  WEATHER_API_KEY: z.string().optional().default(""),
  EXCHANGE_RATE_PROVIDER: z.string().optional().default(""),
  EXCHANGE_RATE_API_KEY: z.string().optional().default(""),
  EXPO_ACCESS_TOKEN: z.string().optional().default(""),
  PUSH_PROVIDER: z.string().optional().default("expo"),
  SENTRY_DSN: z.string().optional().default("")
}).superRefine((env, ctx) => {
  if (env.AI_PROVIDER === "freemodel" && !env.OPENAI_API_KEY.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["OPENAI_API_KEY"],
      message: "OPENAI_API_KEY is required when AI_PROVIDER=freemodel."
    });
  }

  if (env.NODE_ENV === "production") {
    if (!env.CORS_ORIGINS?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGINS"],
        message: "CORS_ORIGINS is required in production."
      });
    }

    if (env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).includes("*")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGINS"],
        message: "Wildcard CORS is not allowed in production."
      });
    }

    if (env.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must be at least 32 characters in production."
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

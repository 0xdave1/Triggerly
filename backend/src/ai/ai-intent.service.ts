import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { HeuristicIntentParserProvider } from "./heuristic-intent-parser.provider";
import { IntentParserProvider, ParsedIntent } from "./intent-types";
import { OpenAiIntentParserProvider } from "./openai-intent-parser.provider";

@Injectable()
export class AiIntentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService,
    private readonly config: ConfigService,
    private readonly heuristic: HeuristicIntentParserProvider,
    private readonly openAi: OpenAiIntentParserProvider
  ) {}

  async parseIntent(input: string, userId: string): Promise<ParsedIntent> {
    await this.privacy.assertCanParseAi(userId);
    const parsed = await this.provider().parse(input, { userId });
    await this.prisma.intentParseLog.create({
      data: {
        userId,
        input: this.config.get("nodeEnv") === "production" ? "[redacted_in_production]" : input,
        parsedOutput: toPrismaJson(parsed),
        confidence: parsed.confidence
      }
    });
    return parsed;
  }

  private provider(): IntentParserProvider {
    return this.config.get("aiProvider") === "openai" ? this.openAi : this.heuristic;
  }
}

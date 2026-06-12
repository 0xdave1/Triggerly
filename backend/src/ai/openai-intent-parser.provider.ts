import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { IntentParserContext, IntentParserProvider, ParsedIntent } from "./intent-types";

@Injectable()
export class OpenAiIntentParserProvider implements IntentParserProvider {
  async parse(_input: string, _context: IntentParserContext): Promise<ParsedIntent> {
    throw new ServiceUnavailableException("OpenAI intent parsing is not configured for this MVP. Use AI_PROVIDER=heuristic.");
  }
}

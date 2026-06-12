export type LiveContextCapability = "weather" | "exchange_rate" | "price" | "travel";

export type ProviderUnavailableResponse = {
  capability: LiveContextCapability;
  status: "provider_not_configured";
  requiresUserConfirmation: true;
  message: string;
  input: Record<string, unknown>;
};

export function providerNotConfigured(capability: LiveContextCapability, input: Record<string, unknown>): ProviderUnavailableResponse {
  return {
    capability,
    status: "provider_not_configured",
    requiresUserConfirmation: true,
    message: "Live provider not configured yet.",
    input
  };
}

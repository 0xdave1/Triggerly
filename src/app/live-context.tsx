import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LiveContextCard } from "@/components/reminders/LiveContextCard";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { useLiveContextActions, useLiveContextTriggers, usePriceLogs } from "@/features/live-context/hooks";
import { usePrivacySettings } from "@/features/privacy/hooks";
import { isFeatureEnabled } from "@/features/privacy/types";
import { getFriendlyApiError } from "@/lib/apiClient";
import { colors, spacing, typography } from "@/styles/theme";

export default function LiveContextScreen() {
  const [location, setLocation] = useState("Lagos");
  const [destination, setDestination] = useState("Abuja");
  const [targetRate, setTargetRate] = useState("1600");
  const [item, setItem] = useState("rice");
  const [price, setPrice] = useState("6500");
  const live = useLiveContextActions();
  const triggers = useLiveContextTriggers();
  const priceLogs = usePriceLogs();
  const privacy = usePrivacySettings();
  const settings = privacy.data;

  const weatherEnabled = isFeatureEnabled(settings, "weatherTriggersEnabled");
  const exchangeEnabled = isFeatureEnabled(settings, "exchangeRateTriggersEnabled");
  const priceEnabled = isFeatureEnabled(settings, "priceMemoryEnabled");

  return (
    <TerminalScreen>
      <TerminalHeader title="live_context.engine" subtitle="weather · exchange · price memory" status="providers: optional" />

      <TerminalCard title="weather.context" tone="cyan">
        <TerminalInput label="current_location" value={location} onChangeText={setLocation} />
        <TerminalInput label="travel_destination" value={destination} onChangeText={setDestination} />
        {!weatherEnabled ? <Text style={styles.warning}>Weather triggers are disabled in privacy settings.</Text> : null}
        <View style={styles.row}>
          <TerminalButton variant="secondary" onPress={() => live.weather.mutate({ location })}>CHECK_WEATHER</TerminalButton>
          <TerminalButton
            disabled={!weatherEnabled}
            onPress={() =>
              live.createWeatherTrigger.mutate({
                title: `Rain check for ${destination}`,
                location: destination,
                date: "tomorrow",
                event: "rain_probability_above",
                threshold: 50
              })
            }
          >
            CREATE_WEATHER_TRIGGER
          </TerminalButton>
        </View>
        <LiveContextCard title="weather_result" result={live.weather.data} />
      </TerminalCard>

      <TerminalCard title="exchange_rate.context" tone="cyan">
        <TerminalStatRow label="pair" value="USD/NGN" tone="cyan" />
        <TerminalInput label="target_rate" value={targetRate} onChangeText={setTargetRate} keyboardType="numeric" />
        {!exchangeEnabled ? <Text style={styles.warning}>Exchange rate triggers are disabled in privacy settings.</Text> : null}
        <View style={styles.row}>
          <TerminalButton variant="secondary" onPress={() => live.exchangeRate.mutate({ base: "USD", quote: "NGN" })}>CHECK_RATE</TerminalButton>
          <TerminalButton
            disabled={!exchangeEnabled}
            onPress={() =>
              live.createExchangeRateTrigger.mutate({
                title: `USD reaches ${targetRate}`,
                base: "USD",
                quote: "NGN",
                operator: ">=",
                targetRate: Number(targetRate)
              })
            }
          >
            CREATE_RATE_ALERT
          </TerminalButton>
        </View>
        <LiveContextCard title="exchange_result" result={live.exchangeRate.data} />
      </TerminalCard>

      <TerminalCard title="price_memory.log" tone="amber">
        {!priceEnabled ? <Text style={styles.warning}>Price memory is disabled in privacy settings.</Text> : null}
        <TerminalInput label="item" value={item} onChangeText={setItem} />
        <TerminalInput label="price" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TerminalButton
          disabled={!priceEnabled || !item.trim()}
          onPress={() =>
            live.createPriceLog.mutate({
              itemName: item,
              price: Number(price),
              currency: "NGN",
              placeName: location,
              source: "MANUAL"
            })
          }
        >
          LOG_PRICE
        </TerminalButton>
        <TerminalButton
          variant="secondary"
          disabled={!priceEnabled || !item.trim()}
          onPress={() =>
            live.createPriceTrigger.mutate({
              title: `${item} price increase`,
              itemName: item,
              operator: "increase_above_percent",
              thresholdPercent: 20
            })
          }
        >
          CREATE_PRICE_TRIGGER
        </TerminalButton>
        {(priceLogs.data ?? []).slice(0, 3).map((entry) => (
          <TerminalStatRow key={entry.id} label={entry.itemName} value={`${entry.currency} ${entry.price} @ ${entry.placeName ?? "unknown"}`} tone="muted" />
        ))}
      </TerminalCard>

      <TerminalCard title="active_live_triggers" active>
        {(triggers.data ?? []).map((trigger) => (
          <TerminalStatRow key={trigger.id} label={trigger.title} value={`${trigger.type}:${trigger.status}`} tone={trigger.status === "ACTIVE" ? "green" : "amber"} />
        ))}
        {!triggers.data?.length ? <Text style={styles.warning}>no_active_live_context_triggers</Text> : null}
      </TerminalCard>

      {live.weather.error || live.exchangeRate.error ? <Text style={styles.error}>{getFriendlyApiError(live.weather.error ?? live.exchangeRate.error)}</Text> : null}
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  warning: {
    color: colors.warning,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  error: {
    color: colors.danger,
    fontFamily: typography.mono,
    fontSize: typography.small
  }
});

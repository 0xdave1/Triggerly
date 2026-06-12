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
      <TerminalHeader title="Live alerts" subtitle="Weather, exchange rates, travel, and prices." status="providers optional" />

      <TerminalCard title="Weather" tone="cyan">
        <TerminalInput label="Current location" value={location} onChangeText={setLocation} />
        <TerminalInput label="Travel destination" value={destination} onChangeText={setDestination} />
        {!weatherEnabled ? <Text style={styles.warning}>Weather triggers are disabled in privacy settings.</Text> : null}
        <View style={styles.row}>
          <TerminalButton variant="secondary" onPress={() => live.weather.mutate({ location })}>Check weather</TerminalButton>
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
            Create weather alert
          </TerminalButton>
        </View>
        <LiveContextCard title="Weather result" result={live.weather.data} />
      </TerminalCard>

      <TerminalCard title="Exchange rate" tone="cyan">
        <TerminalStatRow label="Currency pair" value="USD/NGN" tone="cyan" />
        <TerminalInput label="Target rate" value={targetRate} onChangeText={setTargetRate} keyboardType="numeric" />
        {!exchangeEnabled ? <Text style={styles.warning}>Exchange rate triggers are disabled in privacy settings.</Text> : null}
        <View style={styles.row}>
          <TerminalButton variant="secondary" onPress={() => live.exchangeRate.mutate({ base: "USD", quote: "NGN" })}>Check rate</TerminalButton>
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
            Create rate alert
          </TerminalButton>
        </View>
        <LiveContextCard title="Exchange result" result={live.exchangeRate.data} />
      </TerminalCard>

      <TerminalCard title="Price memory" tone="amber">
        {!priceEnabled ? <Text style={styles.warning}>Price memory is disabled in privacy settings.</Text> : null}
        <TerminalInput label="Item" value={item} onChangeText={setItem} />
        <TerminalInput label="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
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
          Save price
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
          Create price alert
        </TerminalButton>
        {(priceLogs.data ?? []).slice(0, 3).map((entry) => (
          <TerminalStatRow key={entry.id} label={entry.itemName} value={`${entry.currency} ${entry.price} @ ${entry.placeName ?? "unknown"}`} tone="muted" />
        ))}
      </TerminalCard>

      <TerminalCard title="Active live alerts" active>
        {(triggers.data ?? []).map((trigger) => (
          <TerminalStatRow key={trigger.id} label={trigger.title} value={`${trigger.type}:${trigger.status}`} tone={trigger.status === "ACTIVE" ? "green" : "amber"} />
        ))}
        {!triggers.data?.length ? <Text style={styles.warning}>No live alerts yet.</Text> : null}
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

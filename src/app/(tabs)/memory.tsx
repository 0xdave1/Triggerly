import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { DebtFavourCard, PriceMemoryCard, PromiseCard } from "@/components/assistant/LedgerCards";
import { MemoryTimelineCard } from "@/components/assistant/MemoryTimelineCard";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useMemoryActions, useMemoryItems } from "@/features/memory/hooks";
import type { MemoryItem, MemoryType } from "@/features/memory/types";
import { colors, spacing, typography } from "@/styles/theme";
import { useAssistantActions, useDebts, usePrices, usePromises } from "@/features/assistant/hooks";

const memoryTypes: MemoryType[] = ["person", "place", "price", "promise", "debt", "favour", "travel", "routine", "preference", "document", "general"];
const filterTypes: Array<MemoryType | "all"> = ["all", "person", "place", "debt", "favour", "promise", "price", "routine", "travel"];

export default function MemoryScreen() {
  const params = useLocalSearchParams<{ type?: MemoryType; title?: string; body?: string }>();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemoryType | "all">("all");
  const [type, setType] = useState<MemoryType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string>();
  const memory = useMemoryItems({ status: "active" });
  const actions = useMemoryActions();
  const promises = usePromises();
  const debts = useDebts();
  const prices = usePrices();
  const assistantActions = useAssistantActions();

  useEffect(() => {
    if (params.type && memoryTypes.includes(params.type)) setType(params.type);
    if (params.title) setTitle(params.title);
    if (params.body) setBody(params.body);
  }, [params.body, params.title, params.type]);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return (memory.data ?? []).filter((item) => {
      const matchesSearch = `${item.title} ${item.body} ${item.type}`.toLowerCase().includes(needle);
      const matchesType = filter === "all" || item.type === filter;
      return matchesSearch && matchesType;
    });
  }, [filter, memory.data, query]);

  const resetForm = () => {
    setEditingId(undefined);
    setType("general");
    setTitle("");
    setBody("");
  };

  const editMemory = (item: MemoryItem) => {
    setEditingId(item.id);
    setType(item.type);
    setTitle(item.title);
    setBody(item.body);
  };

  const saveMemory = async () => {
    if (editingId) {
      await actions.update.mutateAsync({ id: editingId, input: { type, title, body } });
    } else {
      await actions.create.mutateAsync({ type, title, body, source: "manual", confidence: 1 });
    }
    resetForm();
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="Memory" subtitle="Facts and commitments you explicitly asked Triggerly to keep." status="user approved" />
      <TerminalCard title="Add a memory" active>
        <Text style={styles.help}>Triggerly only saves memory after you confirm it or enter it here.</Text>
        <Select label="Memory type" value={type} onChange={setType} options={memoryTypes.map((value) => ({ label: value, value }))} />
        <TerminalInput label="Title" value={title} onChangeText={setTitle} placeholder="David owes me 8k" />
        <TerminalInput label="Details" value={body} onChangeText={setBody} placeholder="Anything useful to remember" multiline />
        <View style={styles.actions}>
          <TerminalButton disabled={!title.trim() || !body.trim()} loading={actions.create.isPending || actions.update.isPending} onPress={saveMemory}>
            {editingId ? "Update memory" : "Save memory"}
          </TerminalButton>
          {editingId ? (
            <TerminalButton variant="secondary" onPress={resetForm}>
              Cancel edit
            </TerminalButton>
          ) : null}
        </View>
      </TerminalCard>

      <TerminalInput label="Search" value={query} onChangeText={setQuery} placeholder="Search your saved memory..." />

      <View style={styles.filters}>
        {filterTypes.map((value) => (
          <TerminalButton key={value} variant={filter === value ? "primary" : "secondary"} onPress={() => setFilter(value)} style={styles.filterButton}>
            {value}
          </TerminalButton>
        ))}
      </View>

      <TerminalCard title={filter === "all" ? "Memory timeline" : `${filter} memories`}>
        {memory.isPending ? <Text style={styles.empty}>Loading memory...</Text> : null}
        {filtered.map((item) => (
          <View key={item.id} style={styles.item}>
            <MemoryTimelineCard item={item} />
            <View style={styles.actions}>
              <TerminalButton variant="secondary" onPress={() => editMemory(item)}>
                Edit
              </TerminalButton>
              <TerminalButton variant="ghost" loading={actions.archive.isPending} onPress={() => actions.archive.mutate(item.id)}>
                Archive
              </TerminalButton>
              <TerminalButton variant="danger" loading={actions.delete.isPending} onPress={() => actions.delete.mutate(item.id)}>
                Delete
              </TerminalButton>
            </View>
          </View>
        ))}
        {!filtered.length && !memory.isPending ? <Text style={styles.empty}>No memories found.</Text> : null}
      </TerminalCard>

      <TerminalCard title="Promise tracker">
        {(promises.data ?? []).map((item) => <PromiseCard key={item.id} item={item} onComplete={() => assistantActions.completePromise.mutate(item.id)} />)}
        {!promises.data?.length ? <Text style={styles.empty}>No promises tracked yet.</Text> : null}
      </TerminalCard>

      <TerminalCard title="Debts and favours">
        {(debts.data ?? []).map((item) => <DebtFavourCard key={item.id} item={item} onSettle={() => assistantActions.settleDebt.mutate(item.id)} />)}
        {!debts.data?.length ? <Text style={styles.empty}>No unsettled debt or favour records.</Text> : null}
      </TerminalCard>

      <TerminalCard title="Market price memory">
        {(prices.data ?? []).slice(0, 8).map((item) => <PriceMemoryCard key={item.id} item={item} />)}
        {!prices.data?.length ? <Text style={styles.empty}>Enable price memory, then confirm a price in chat to start comparing.</Text> : null}
      </TerminalCard>
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: spacing.sm
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  filterButton: {
    minWidth: 92
  },
  help: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  empty: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small
  }
});

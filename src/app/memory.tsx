import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MemoryCard } from "@/components/reminders/MemoryCard";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useMemoryActions, useMemoryItems } from "@/features/memory/hooks";
import type { MemoryItem, MemoryType } from "@/features/memory/types";
import { colors, spacing, typography } from "@/styles/theme";

const memoryTypes: MemoryType[] = ["person", "place", "price", "promise", "debt", "travel", "routine", "preference", "document", "general"];
const filterTypes: Array<MemoryType | "all"> = ["all", "person", "place", "debt", "promise", "price", "routine", "travel"];

export default function MemoryScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemoryType | "all">("all");
  const [type, setType] = useState<MemoryType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string>();
  const memory = useMemoryItems({ status: "active" });
  const actions = useMemoryActions();

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
      <TerminalHeader title="memory.vault" subtitle="user-approved memory only" status="context_lock: on" />
      <TerminalCard title="memory.create" active>
        <Text style={styles.help}>Triggerly only saves memory after you confirm it or enter it here.</Text>
        <Select label="memory_type" value={type} onChange={setType} options={memoryTypes.map((value) => ({ label: value, value }))} />
        <TerminalInput label="title" value={title} onChangeText={setTitle} placeholder="David owes me 8k" />
        <TerminalInput label="body" value={body} onChangeText={setBody} placeholder="Confirmed by user" multiline />
        <View style={styles.actions}>
          <TerminalButton disabled={!title.trim() || !body.trim()} loading={actions.create.isPending || actions.update.isPending} onPress={saveMemory}>
            {editingId ? "UPDATE_MEMORY" : "SAVE_MEMORY"}
          </TerminalButton>
          {editingId ? (
            <TerminalButton variant="secondary" onPress={resetForm}>
              CANCEL_EDIT
            </TerminalButton>
          ) : null}
        </View>
      </TerminalCard>

      <TerminalInput label="search_memory" value={query} onChangeText={setQuery} command placeholder="Search user-approved memory..." />

      <View style={styles.filters}>
        {filterTypes.map((value) => (
          <TerminalButton key={value} variant={filter === value ? "primary" : "secondary"} onPress={() => setFilter(value)} style={styles.filterButton}>
            {value}
          </TerminalButton>
        ))}
      </View>

      <TerminalCard title={filter === "all" ? "memory_index" : `${filter}_memory`}>
        {memory.isPending ? <Text style={styles.empty}>loading_memory...</Text> : null}
        {filtered.map((item) => (
          <View key={item.id} style={styles.item}>
            <MemoryCard item={item} />
            <View style={styles.actions}>
              <TerminalButton variant="secondary" onPress={() => editMemory(item)}>
                EDIT
              </TerminalButton>
              <TerminalButton variant="ghost" loading={actions.archive.isPending} onPress={() => actions.archive.mutate(item.id)}>
                ARCHIVE
              </TerminalButton>
              <TerminalButton variant="danger" loading={actions.delete.isPending} onPress={() => actions.delete.mutate(item.id)}>
                DELETE
              </TerminalButton>
            </View>
          </View>
        ))}
        {!filtered.length && !memory.isPending ? <Text style={styles.empty}>no_memory_found</Text> : null}
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

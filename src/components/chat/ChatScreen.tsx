import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useChatActions, useConversation, useConversations } from "@/features/chat/hooks";
import { useChatStore } from "@/features/chat/store";
import type { AgentPlan, AgentPlanItem, ChatMessage } from "@/features/chat/types";
import { usePrivacySettings } from "@/features/privacy/hooks";
import { loadVoiceSettings } from "@/features/voice/settings";
import { speakText } from "@/features/voice/speech";
import { getFriendlyApiError } from "@/lib/apiClient";
import { createId } from "@/lib/id";
import { colors, radii, spacing, typography } from "@/styles/theme";
import { AgentPlanCard } from "./AgentPlanCard";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

const examples = [
  "Remind me to buy fuel when I get to Total.",
  "David owes me 8k.",
  "Tell me when dollar reaches 1600.",
  "Every Sunday remind me to review my spending."
];

export function ChatScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notice, setNotice] = useState<string>();
  const conversationId = useChatStore((state) => state.conversationId);
  const setConversationId = useChatStore((state) => state.setConversationId);
  const conversations = useConversations();
  const conversation = useConversation(conversationId);
  const actions = useChatActions();
  const privacy = usePrivacySettings();

  useEffect(() => {
    if (!conversationId && conversations.data?.[0]) {
      setConversationId(conversations.data[0].id);
    }
  }, [conversationId, conversations.data, setConversationId]);

  useEffect(() => {
    if (conversation.data?.messages) setMessages(conversation.data.messages);
  }, [conversation.data?.messages]);

  const plansByRun = useMemo(() => {
    const plans = new Map<string, AgentPlan>();
    for (const message of messages) {
      const runId = message.metadata?.agentRunId;
      const plan = message.metadata?.plan;
      if (runId && plan) plans.set(runId, plan);
    }
    return plans;
  }, [messages]);

  const send = async () => {
    const message = input.trim();
    if (!message) return;
    setInput("");
    setNotice(undefined);
    try {
      const response = await actions.send.mutateAsync({ conversationId, message });
      setConversationId(response.conversation.id);
      setMessages((current) => [...current, response.userMessage, response.assistantMessage]);
      if (response.source === "local_fallback" && response.mode === "plan") {
        setNotice("Working locally. Reconnect before confirming so the plan can sync.");
      }
      const voice = await loadVoiceSettings();
      if (voice.voiceNotificationsEnabled) {
        await speakText(response.assistantMessage.content, voice);
      }
    } catch (error) {
      setInput(message);
      setNotice(getFriendlyApiError(error));
    }
  };

  const confirmRun = async (runId: string, itemIds?: string[]) => {
    if (runId.startsWith("run_")) {
      setNotice("Reconnect before confirming this local plan.");
      return;
    }
    setNotice(undefined);
    try {
      const run = await actions.confirmRun.mutateAsync({ runId, itemIds });
      updatePlan(runId, run.plan);
      if (run.result?.message) appendAssistant(run.result.message);
      await actions.refresh(conversationId);
    } catch (error) {
      setNotice(getFriendlyApiError(error));
    }
  };

  const rejectRun = async (runId: string) => {
    if (runId.startsWith("run_")) {
      setMessages((current) =>
        current.map((message) =>
          message.metadata?.agentRunId === runId && message.metadata.plan
            ? {
                ...message,
                metadata: {
                  ...message.metadata,
                  plan: {
                    ...message.metadata.plan,
                    items: message.metadata.plan.items.map((item) => ({ ...item, status: "rejected" }))
                  }
                }
              }
            : message
        )
      );
      return;
    }
    try {
      const run = await actions.rejectRun.mutateAsync(runId);
      updatePlan(runId, run.plan);
    } catch (error) {
      setNotice(getFriendlyApiError(error));
    }
  };

  const rejectItem = async (runId: string, itemId: string) => {
    if (runId.startsWith("run_")) {
      updateSingleItem(runId, itemId, "rejected");
      return;
    }
    try {
      const run = await actions.rejectItem.mutateAsync({ runId, itemId });
      updatePlan(runId, run.plan);
    } catch (error) {
      setNotice(getFriendlyApiError(error));
    }
  };

  const updatePlan = (runId: string, plan: AgentPlan) => {
    setMessages((current) =>
      current.map((message) =>
        message.metadata?.agentRunId === runId
          ? { ...message, metadata: { ...message.metadata, plan } }
          : message
      )
    );
  };

  const updateSingleItem = (runId: string, itemId: string, status: AgentPlanItem["status"]) => {
    const plan = plansByRun.get(runId);
    if (!plan) return;
    updatePlan(runId, {
      ...plan,
      items: plan.items.map((item) => (item.id === itemId ? { ...item, status } : item))
    });
  };

  const appendAssistant = (content: string) => {
    setMessages((current) => [
      ...current,
      {
        id: createId("message"),
        conversationId: conversationId ?? "current",
        role: "assistant",
        content,
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const openManualEdit = (item: AgentPlanItem) => {
    const intent = (item.payload.intent ?? {}) as Record<string, unknown>;
    if (item.type === "create_trigger") {
      router.push({ pathname: "/reminders/new", params: { quick: item.title } });
      return;
    }
    if (item.type === "create_memory") {
      router.push({
        pathname: "/memory",
        params: {
          type: String(intent.intentType ?? "general").replace("_memory", ""),
          title: item.title,
          body: item.description
        }
      });
      return;
    }
    if (item.type === "create_action_prompt") {
      router.push({
        pathname: "/actions",
        params: {
          actionType: String(item.payload.actionType ?? "generate_checklist").toLowerCase(),
          title: item.title,
          payload: item.description
        }
      });
      return;
    }
    router.push("/live-context");
  };

  const voiceInput = () => {
    if (!privacy.data?.microphoneInputEnabled) {
      setNotice("Voice input is disabled. Enable microphone input in Control first.");
      return;
    }
    setNotice("Tap-to-speak transcription needs a native speech-to-text provider. No recording has started.");
  };

  const startNewConversation = () => {
    setConversationId(undefined);
    setMessages([]);
    setNotice(undefined);
  };

  return (
    <TerminalScreen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 74 : 0}
        style={styles.screen}
      >
        <TerminalHeader
          title="What can I take off your mind?"
          subtitle="Ask a question, or tell Triggerly what you want to remember, track, or prepare."
          status="ready"
        />

        <View style={styles.conversationBar}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.conversationContent}
            showsHorizontalScrollIndicator={false}
          >
            <Pressable accessibilityLabel="New conversation" onPress={startNewConversation} style={styles.newConversation}>
              <Ionicons color={colors.primary} name="add-outline" size={20} />
            </Pressable>
            {(conversations.data ?? []).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setConversationId(item.id)}
                style={[styles.conversationChip, conversationId === item.id && styles.activeConversation]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.conversationText, conversationId === item.id && styles.activeConversationText]}
                >
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          style={styles.timeline}
        >
          {!messages.length && !conversation.isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Start with a normal sentence.</Text>
              <Text style={styles.emptyBody}>
                Questions get a direct answer. Tasks become a reviewable plan, and nothing is created until you confirm.
              </Text>
              <View style={styles.examples}>
                {examples.map((example) => (
                  <Pressable key={example} onPress={() => setInput(example)} style={styles.example}>
                    <Text style={styles.exampleText}>{example}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {messages.map((message) => {
            const runId = message.metadata?.agentRunId;
            const plan = message.metadata?.plan;
            return (
              <View key={message.id} style={styles.messageBlock}>
                <MessageBubble message={message} />
                {runId && plan ? (
                  <AgentPlanCard
                    busy={actions.confirmRun.isPending || actions.confirmItem.isPending}
                    plan={plan}
                    onConfirmAll={() => confirmRun(runId)}
                    onRejectAll={() => rejectRun(runId)}
                    onConfirmItem={(itemId) => confirmRun(runId, [itemId])}
                    onRejectItem={(itemId) => rejectItem(runId, itemId)}
                    onEditDetails={(itemId) => {
                      const item = plan.items.find((candidate) => candidate.id === itemId);
                      if (item) openManualEdit(item);
                    }}
                    onEnableFeature={() => router.push("/(tabs)/control")}
                  />
                ) : null}
              </View>
            );
          })}
          {actions.send.isPending ? <TypingIndicator /> : null}
        </ScrollView>

        {notice ? (
          <Pressable onPress={() => setNotice(undefined)} style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </Pressable>
        ) : null}

        <ChatInput
          sending={actions.send.isPending}
          value={input}
          onChangeText={setInput}
          onSend={send}
          onVoice={voiceInput}
        />
      </KeyboardAvoidingView>
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.md
  },
  conversationBar: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.md
  },
  conversationContent: {
    alignItems: "center",
    gap: spacing.sm
  },
  newConversation: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  conversationChip: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    maxWidth: 190,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeConversation: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong
  },
  conversationText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small
  },
  activeConversationText: {
    color: colors.text
  },
  timeline: {
    flex: 1
  },
  messages: {
    gap: spacing.lg,
    paddingBottom: spacing.lg
  },
  messageBlock: {
    gap: spacing.md
  },
  empty: {
    gap: spacing.md,
    paddingVertical: spacing.xl
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 24,
    fontWeight: "800"
  },
  emptyBody: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.body,
    lineHeight: 24
  },
  examples: {
    gap: spacing.sm
  },
  example: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingVertical: spacing.sm
  },
  exampleText: {
    color: colors.primary,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 19
  },
  notice: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.warning,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md
  },
  noticeText: {
    color: colors.warning,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 19
  }
});

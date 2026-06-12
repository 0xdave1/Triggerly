import { create } from "zustand";

type ChatState = {
  conversationId?: string;
  setConversationId: (conversationId?: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  conversationId: undefined,
  setConversationId: (conversationId) => set({ conversationId })
}));

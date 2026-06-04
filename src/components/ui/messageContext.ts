import { createContext, useContext } from "react";

export type MessageTone = "success" | "error";

export type MessageInput = {
  tone: MessageTone;
  title: string;
  description?: string;
};

export const MessageContext = createContext<{ pushMessage: (message: MessageInput) => void } | null>(null);

export function useMessage() {
  const context = useContext(MessageContext);
  if (!context) throw new Error("useMessage must be used within MessageProvider");
  return context;
}

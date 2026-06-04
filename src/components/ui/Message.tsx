import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { MessageContext, type MessageInput, type MessageTone } from "./messageContext";

type Message = {
  id: number;
  tone: MessageTone;
  title: string;
  description?: string;
};

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const removeMessage = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const pushMessage = useCallback((message: MessageInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1_000);
    setMessages((current) => [{ ...message, id }, ...current].slice(0, 4));
    window.setTimeout(() => removeMessage(id), 5_000);
  }, [removeMessage]);

  const value = useMemo(() => ({ pushMessage }), [pushMessage]);

  return (
    <MessageContext.Provider value={value}>
      {children}
      <div className="message-stack" role="status" aria-live="polite">
        {messages.map((message) => (
          <article key={message.id} className={cn("message-toast", `is-${message.tone}`)}>
            <span className="message-icon">
              {message.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </span>
            <div className="message-copy">
              <strong>{message.title}</strong>
              {message.description ? <p>{message.description}</p> : null}
            </div>
            <button className="message-close" aria-label="Dismiss message" onClick={() => removeMessage(message.id)}>
              <X className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>
    </MessageContext.Provider>
  );
}

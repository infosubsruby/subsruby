import { useState } from "react";
import { Bot, SendHorizonal, UserRound } from "lucide-react";
import type { RubyAIContext, RubyAIMessage, RubyAISuggestion } from "@/lib/rubyAI";
import { buildRubyAIResponse } from "@/lib/rubyAI";

type RubyAIConversationProps = {
  context: RubyAIContext;
  messages: RubyAIMessage[];
  onMessagesChange: (messages: RubyAIMessage[]) => void;
  suggestedPrompts: RubyAISuggestion[];
  onPromptSelect: (prompt: string) => void;
};

const messageBubble = (role: RubyAIMessage["role"]) =>
  role === "assistant"
    ? "border-red-500/25 bg-red-500/10 text-zinc-100"
    : "border-white/10 bg-black/25 text-zinc-300";

export const RubyAIConversation = ({
  context,
  messages,
  onMessagesChange,
  suggestedPrompts,
  onPromptSelect,
}: RubyAIConversationProps) => {
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = (raw: string) => {
    const prompt = raw.trim();
    if (!prompt || isThinking) return;

    const userMessage: RubyAIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    };
    onMessagesChange([...messages, userMessage]);
    setDraft("");
    setIsThinking(true);

    window.setTimeout(() => {
      const assistantMessage: RubyAIMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: buildRubyAIResponse(prompt, context),
        createdAt: new Date().toISOString(),
      };
      onMessagesChange([...messages, userMessage, assistantMessage]);
      setIsThinking(false);
    }, 900);
  };

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -left-10 top-[-26px] h-36 w-36 rounded-full bg-red-500/15 blur-3xl" />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Ruby AI Conversation</h2>
          <p className="text-xs text-zinc-500">Personal AI CFO mode. Context-aware financial advisory responses.</p>
        </div>
      </div>

      <div className="mb-4 h-[430px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-3">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`flex gap-2 rounded-xl border px-3 py-2 ${messageBubble(message.role)}`}
          >
            <div className="mt-0.5">
              {message.role === "assistant" ? (
                <Bot className="h-4 w-4 text-red-300" />
              ) : (
                <UserRound className="h-4 w-4 text-zinc-400" />
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] opacity-70">
                {message.role === "assistant" ? "Ruby AI CFO" : "You"}
              </p>
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </article>
        ))}

        {isThinking ? (
          <article className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-zinc-200">
            <p className="text-[10px] uppercase tracking-[0.14em] text-red-200">Ruby AI is analyzing...</p>
            <div className="mt-2 flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-300 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-300 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-300" />
            </div>
          </article>
        ) : null}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {suggestedPrompts.slice(0, 4).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onPromptSelect(item.prompt);
              sendMessage(item.prompt);
            }}
            className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-100"
          >
            {item.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(draft);
        }}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask Ruby AI about spending, subscriptions, budget, goals, or financial health..."
          className="h-9 flex-1 bg-transparent px-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/20 px-3 text-xs font-medium text-red-100 transition hover:bg-red-500/30"
        >
          <SendHorizonal className="h-3.5 w-3.5" />
          Send
        </button>
      </form>
    </section>
  );
};


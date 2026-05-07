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
  contextSnippets?: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
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
  contextSnippets = [],
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
    <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-[30px] sm:p-5">
      <div className="pointer-events-none absolute -left-10 top-[-26px] h-36 w-36 rounded-full bg-red-500/15 blur-3xl" />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100 sm:text-xl">Ruby AI Conversation</h2>
          <p className="text-[11px] text-zinc-500 sm:text-xs">Personal AI CFO mode. Context-aware financial advisory responses.</p>
        </div>
      </div>

      <div className="mb-3 h-[46vh] min-h-[280px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-2.5 sm:mb-4 sm:h-[430px] sm:p-3">
        {messages.map((message, index) => (
          <article
            key={message.id}
            className={`motion-row-enter flex gap-2 rounded-xl border px-3 py-2 ${messageBubble(message.role)}`}
            style={{ animationDelay: `${Math.min(index * 38, 260)}ms` }}
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
              {message.role === "assistant" && index === messages.length - 1 && contextSnippets.length > 0 ? (
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {contextSnippets.slice(0, 2).map((snippet) => (
                    <div key={snippet.label} className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{snippet.label}</p>
                      <p className="text-xs font-medium text-zinc-100">{snippet.value}</p>
                      <p className="text-[11px] text-zinc-400">{snippet.detail}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {isThinking ? (
          <article className="motion-row-enter rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-zinc-200">
            <p className="text-[10px] uppercase tracking-[0.14em] text-red-200">Ruby AI is analyzing...</p>
            <div className="mt-2 flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" />
            </div>
          </article>
        ) : null}
      </div>

      <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:mb-3 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {suggestedPrompts.slice(0, 4).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onPromptSelect(item.prompt);
              sendMessage(item.prompt);
            }}
            className="whitespace-nowrap rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-100"
          >
            {item.label}
          </button>
        ))}
      </div>
      {!isThinking ? (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0">
          {suggestedPrompts.slice(4, 7).map((item) => (
            <button
              key={`follow-${item.id}`}
              type="button"
              onClick={() => {
                onPromptSelect(item.prompt);
                sendMessage(item.prompt);
              }}
              className="whitespace-nowrap rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-100 transition hover:bg-red-500/20"
            >
              Follow-up: {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(draft);
        }}
        className="sticky bottom-0 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-black/70 p-2 backdrop-blur"
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

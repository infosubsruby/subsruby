import { useMemo, useState } from "react";
import { Bot, BrainCircuit, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFinance } from "@/hooks/useFinance";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSettings } from "@/hooks/useSettings";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import {
  buildRubyAIContext,
  buildRubyAIInsightCards,
  buildRubyAIMemoryLine,
  buildRubyAISuggestions,
  type RubyAIMessage,
} from "@/lib/rubyAI";
import { RubyAIConversation } from "@/components/ruby-ai/RubyAIConversation";
import { RubyAIInsightPanel } from "@/components/ruby-ai/RubyAIInsightPanel";
import { RubyAIMemoryPanel } from "@/components/ruby-ai/RubyAIMemoryPanel";
import { RubyAISuggestedPrompts } from "@/components/ruby-ai/RubyAISuggestedPrompts";

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const safeNumber = (value: number) => (Number.isFinite(value) ? value : 0);

const RubyAI = () => {
  const { profile, user } = useAuth();
  const { transactions, budgets, isLoading } = useFinance();
  const { subscriptions, isLoading: isLoadingSubs } = useSubscriptions();
  const { defaultCurrency } = useSettings();

  const now = new Date();
  const currentKey = monthKey(now);

  const { monthlyIncomeSeries, monthlyExpenseSeries, expenseCurrent, incomeCurrent, goalProgress } = useMemo(() => {
    const monthStarts = [5, 4, 3, 2, 1, 0].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return monthKey(d);
    });
    const incomeByMonth: Record<string, number> = {};
    const expenseByMonth: Record<string, number> = {};

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (Number.isNaN(txDate.getTime())) continue;
      const key = monthKey(txDate);
      if (!monthStarts.includes(key)) continue;
      const amount = safeNumber(Number(tx.amount));
      if (tx.type === "income") incomeByMonth[key] = safeNumber(incomeByMonth[key] || 0) + amount;
      else expenseByMonth[key] = safeNumber(expenseByMonth[key] || 0) + amount;
    }

    const expensesNow = transactions
      .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === currentKey)
      .reduce((sum, tx) => sum + safeNumber(Number(tx.amount)), 0);
    const incomeNow = transactions
      .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === currentKey)
      .reduce((sum, tx) => sum + safeNumber(Number(tx.amount)), 0);
    const totalBudget = budgets.reduce((sum, budget) => sum + safeNumber(Number(budget.limit_amount)), 0);
    const goalProgressPct = totalBudget > 0 ? clamp((expensesNow / totalBudget) * 100, 0, 100) : 0;

    return {
      monthlyIncomeSeries: monthStarts.map((key) => safeNumber(incomeByMonth[key] || 0)),
      monthlyExpenseSeries: monthStarts.map((key) => safeNumber(expenseByMonth[key] || 0)),
      expenseCurrent: safeNumber(expensesNow),
      incomeCurrent: safeNumber(incomeNow),
      goalProgress: safeNumber(goalProgressPct),
    };
  }, [transactions, budgets, now, currentKey]);

  const monthlySubscriptionCost = useMemo(
    () =>
      subscriptions.reduce((sum, sub) => {
        const amount = safeNumber(Number(sub.price));
        return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
      }, 0),
    [subscriptions]
  );

  const expensePerDay = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const txDate = new Date(tx.date);
      if (monthKey(txDate) !== currentKey) continue;
      const day = tx.date.slice(0, 10);
      byDay[day] = safeNumber(byDay[day] || 0) + safeNumber(Number(tx.amount));
    }
    return byDay;
  }, [transactions, currentKey]);
  const dailyValues = Object.values(expensePerDay);
  const avgDaily = dailyValues.length ? dailyValues.reduce((acc, value) => acc + value, 0) / dailyValues.length : 0;
  const overspendingDaysRatio = dailyValues.length ? dailyValues.filter((value) => value > avgDaily * 1.25).length / dailyValues.length : 0;

  const subscriptionLoad = incomeCurrent > 0 ? (monthlySubscriptionCost / incomeCurrent) * 100 : 0;
  const savingsRate = incomeCurrent > 0 ? ((incomeCurrent - expenseCurrent) / incomeCurrent) * 100 : 0;
  const expenseRatio = incomeCurrent > 0 ? (expenseCurrent / incomeCurrent) * 100 : 100;
  const emergencyFundMonths = expenseCurrent > 0 ? Math.max(incomeCurrent - expenseCurrent, 0) / expenseCurrent : 0;
  const debtRatioPct = incomeCurrent > 0 ? (monthlySubscriptionCost / incomeCurrent) * 100 : 25;

  const trackedBudgetLimit = budgets.reduce((sum, budget) => sum + safeNumber(Number(budget.limit_amount)), 0);
  const trackedBudgetSpent = transactions
    .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === currentKey)
    .filter((tx) => budgets.some((budget) => budget.category === tx.category))
    .reduce((sum, tx) => sum + safeNumber(Number(tx.amount)), 0);
  const budgetDisciplineRatio =
    trackedBudgetLimit > 0 ? clamp(Math.min(trackedBudgetLimit / Math.max(trackedBudgetSpent, 1), 1), 0, 1) : 0.65;

  const health = useMemo(
    () =>
      calculateFinancialHealthScore({
        savingsRatePct: savingsRate,
        monthlyExpenseSeries,
        monthlyIncomeSeries,
        subscriptionBurdenPct: subscriptionLoad,
        expenseRatioPct: expenseRatio,
        goalProgressPct: goalProgress,
        emergencyFundMonths,
        overspendingDaysRatio,
        debtRatioPct,
        budgetDisciplineRatio,
      }),
    [
      savingsRate,
      monthlyExpenseSeries,
      monthlyIncomeSeries,
      subscriptionLoad,
      expenseRatio,
      goalProgress,
      emergencyFundMonths,
      overspendingDaysRatio,
      debtRatioPct,
      budgetDisciplineRatio,
    ]
  );

  const context = useMemo(
    () =>
      buildRubyAIContext({
        transactions,
        budgets,
        subscriptions,
        currency: defaultCurrency,
        financialHealthScore: health.score,
      }),
    [transactions, budgets, subscriptions, defaultCurrency, health.score]
  );

  const suggestions = useMemo(() => buildRubyAISuggestions(context), [context]);
  const insightCards = useMemo(() => buildRubyAIInsightCards(context), [context]);
  const memory = useMemo(() => buildRubyAIMemoryLine(context), [context]);

  const userName = profile?.first_name || user?.email?.split("@")[0] || "there";
  const [messages, setMessages] = useState<RubyAIMessage[]>([
    {
      id: "assistant-init",
      role: "assistant",
      createdAt: new Date().toISOString(),
      content: `Ruby AI CFO is online. Hi ${userName}, I have loaded your spending, subscriptions, and financial health context. Ask me anything about optimization, risk, affordability, or goal strategy.`,
    },
  ]);
  const [lastPrompt, setLastPrompt] = useState<string>("");

  if (isLoading || isLoadingSubs) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
        Initializing Ruby AI financial advisor systems...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
        <div className="pointer-events-none absolute -left-16 top-[-50px] h-52 w-52 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-[-50px] top-8 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200">
              <Bot className="h-3.5 w-3.5" />
              Ruby AI CFO
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Intelligent Financial Advisory Console
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Ruby AI acts as your personal financial advisor: analyzing behavior, predicting risk, and guiding optimized decisions with memory-like context.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Weekly Financial Summary</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-300">{context.weeklySummary}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RubyAIConversation
            context={context}
            messages={messages}
            onMessagesChange={setMessages}
            suggestedPrompts={suggestions}
            onPromptSelect={setLastPrompt}
          />
        </div>
        <div className="space-y-5 xl:col-span-4">
          <RubyAIInsightPanel cards={insightCards} />
          <RubyAIMemoryPanel memory={memory} />
        </div>
      </div>

      <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Smart Prompt Suggestions</h2>
        </div>
        <RubyAISuggestedPrompts prompts={suggestions} onSelect={setLastPrompt} />
        {lastPrompt ? (
          <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-400">
            Selected prompt: <span className="text-zinc-200">{lastPrompt}</span>
          </p>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Recommendation Widgets</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-300">
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">Budget Optimization</p>
            Cap your highest category by 10% and convert the difference to automated savings.
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-300">
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">Subscription Strategy</p>
            Keep recurring burden under 15-18% of income to protect monthly liquidity.
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-300">
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">Health Score Upgrade</p>
            Improve spending consistency and reduce volatility spikes for faster score growth.
          </article>
        </div>
      </section>
    </div>
  );
};

export default RubyAI;

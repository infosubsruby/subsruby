import { useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  Wallet2,
  ArrowDownRight,
  ArrowUpRight,
  Goal,
  CalendarClock,
  PiggyBank,
  WandSparkles,
  BadgeDollarSign,
  BarChart3,
  GraduationCap,
  FileBarChart2,
  CircleAlert,
  CheckCircle2,
} from "lucide-react";
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
import { RubyAIPromptCards, type RubyPromptCard } from "@/components/ruby-ai/RubyAIPromptCards";
import { RubyAISmartActionCards, type RubySmartActionCard } from "@/components/ruby-ai/RubyAISmartActionCards";
import { RubyAIAssistantModes, type RubyAssistantMode } from "@/components/ruby-ai/RubyAIAssistantModes";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_CATEGORIES, DEMO_USER_NAME } from "@/data/demoFinanceData";
import { formatCurrency } from "@/i18n/currency";
import { formatDate } from "@/i18n/date";

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
  const daysRemaining = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1);
  const safeToSpend = Math.max(0, (context.monthlyIncome - context.monthlySpending - context.subscriptionMonthlyCost) / daysRemaining);
  const activeGoals = budgets.length;
  const upcomingPayments = subscriptions.filter((sub) => {
    if (!sub.next_payment_date) return false;
    const date = new Date(sub.next_payment_date);
    const in14 = new Date(now);
    in14.setDate(in14.getDate() + 14);
    return date >= now && date <= in14;
  }).length;
  const potentialSavings = context.subscriptionMonthlyCost * 0.2 + context.topSpendingCategoryAmount * 0.08;

  const promptCards = useMemo<RubyPromptCard[]>(
    () => [
      {
        id: "p-why",
        title: "Why did I spend more this month?",
        prompt: "Why did I spend more this month?",
        description: "Break down growth drivers and category variance against recent baseline.",
        categoryTag: "Spending Analysis",
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        id: "p-afford",
        title: "Can I afford a $500 purchase?",
        prompt: "Can I afford a $500 purchase?",
        description: "Checks cash-flow buffer and discretionary headroom.",
        categoryTag: "Affordability",
        icon: <Wallet2 className="h-4 w-4" />,
      },
      {
        id: "p-student",
        title: "Create a student budget for me",
        prompt: "Create a student budget for me.",
        description: "Builds a practical split for essentials, learning, and savings.",
        categoryTag: "Budget Coach",
        icon: <GraduationCap className="h-4 w-4" />,
      },
      {
        id: "p-subs",
        title: "Analyze my subscriptions",
        prompt: "Analyze my subscriptions.",
        description: "Detect overlap, low value plans, and recurring-cost pressure.",
        categoryTag: "Optimizer",
        icon: <BadgeDollarSign className="h-4 w-4" />,
      },
      {
        id: "p-health",
        title: "How can I improve my Financial Health Score?",
        prompt: "How can I improve my Financial Health Score?",
        description: "Prioritizes the fastest levers to increase resilience.",
        categoryTag: "Health",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        id: "p-reduce",
        title: "Which category should I reduce first?",
        prompt: "Which category should I reduce first?",
        description: "Finds top waste risk category and reduction strategy.",
        categoryTag: "Waste Reduction",
        icon: <ArrowDownRight className="h-4 w-4" />,
      },
      {
        id: "p-safe",
        title: "What can I safely spend today?",
        prompt: "What can I safely spend today?",
        description: "Daily spend threshold based on remaining cycle runway.",
        categoryTag: "Safe-to-Spend",
        icon: <PiggyBank className="h-4 w-4" />,
      },
      {
        id: "p-emergency",
        title: "Help me reach my emergency fund faster",
        prompt: "Help me reach my emergency fund faster.",
        description: "Creates an acceleration plan for reserve growth.",
        categoryTag: "Goal Planner",
        icon: <Goal className="h-4 w-4" />,
      },
    ],
    []
  );

  const smartActions = useMemo<RubySmartActionCard[]>(
    () => [
      { id: "a-subs", title: "Review subscriptions", description: "Reduce overlap and recurring burden this cycle.", to: "/dashboard#subscriptions", icon: <BadgeDollarSign className="h-4 w-4" /> },
      { id: "a-budget", title: "Create budget", description: "Protect high-risk categories with adaptive limits.", to: "/finance", icon: <ShieldCheck className="h-4 w-4" /> },
      { id: "a-goal", title: "Add savings goal", description: "Route surplus cash to emergency or priority goals.", to: "/goals", icon: <Goal className="h-4 w-4" /> },
      { id: "a-transactions", title: "Analyze transactions", description: "Run detailed activity intelligence and anomaly checks.", to: "/transactions", icon: <BarChart3 className="h-4 w-4" /> },
      { id: "a-food", title: "Reduce food spending", description: "Set a 10-day micro-limit and monitor trend response.", to: "/transactions", icon: <ArrowDownRight className="h-4 w-4" /> },
      { id: "a-safe", title: "Check safe-to-spend", description: "Validate daily threshold before discretionary purchases.", to: "/overview", icon: <PiggyBank className="h-4 w-4" /> },
      { id: "a-report", title: "Generate monthly report", description: "Summarize progress, risks, and opportunities.", to: "/analytics", icon: <FileBarChart2 className="h-4 w-4" /> },
      { id: "a-health", title: "Improve health score", description: "Focus on factors with highest scoring impact.", to: "/overview", icon: <ArrowUpRight className="h-4 w-4" /> },
    ],
    []
  );

  const assistantModes = useMemo<RubyAssistantMode[]>(
    () => [
      { id: "m-budget", title: "Budget Coach", description: "Creates adaptive spending limits by behavior and risk.", useCase: "When monthly variance increases.", icon: <ShieldCheck className="h-4 w-4" /> },
      { id: "m-subs", title: "Subscription Optimizer", description: "Flags overlap and recurring-cost optimization paths.", useCase: "When recurring load exceeds target.", icon: <BadgeDollarSign className="h-4 w-4" /> },
      { id: "m-goals", title: "Goal Planner", description: "Forecasts completion and contribution strategies.", useCase: "When goal timeline needs acceleration.", icon: <Goal className="h-4 w-4" /> },
      { id: "m-spend", title: "Spending Analyst", description: "Explains where money goes and why behavior shifted.", useCase: "When spending feels unpredictable.", icon: <BarChart3 className="h-4 w-4" /> },
      { id: "m-savings", title: "Savings Strategist", description: "Improves monthly savings rate with low-friction moves.", useCase: "When savings momentum is slow.", icon: <PiggyBank className="h-4 w-4" /> },
      { id: "m-student", title: "Student Finance Mode", description: "Balances essentials, education, and lifestyle spending.", useCase: "For students and early-career budgeting.", icon: <GraduationCap className="h-4 w-4" /> },
      { id: "m-report", title: "Monthly Report Mode", description: "Produces CFO-style monthly summary and action plan.", useCase: "At month-end review sessions.", icon: <FileBarChart2 className="h-4 w-4" /> },
    ],
    []
  );

  const recentAnalyses = useMemo(
    () => [
      {
        id: "r-weekly",
        title: "Weekly spending review",
        date: new Date(now.getTime() - 1000 * 60 * 60 * 8),
        summary: `Spending trend in ${context.topSpendingCategory} remains the key driver this cycle.`,
        impact: context.riskySpendingSignal > 30 ? "High impact on volatility" : "Stable impact",
      },
      {
        id: "r-subs",
        title: "Subscription savings scan",
        date: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        summary: `Estimated savings opportunity of ${formatCurrency(potentialSavings, defaultCurrency)} across recurring spend.`,
        impact: "Potential monthly savings",
      },
      {
        id: "r-goal",
        title: "Goal progress analysis",
        date: new Date(now.getTime() - 1000 * 60 * 60 * 52),
        summary: `Active goals: ${activeGoals}. Suggested extra allocation from discretionary surplus.`,
        impact: "Goal completion acceleration",
      },
      {
        id: "r-budget",
        title: "Budget risk check",
        date: new Date(now.getTime() - 1000 * 60 * 60 * 78),
        summary: `Budget coverage is ${context.budgetCoveragePct.toFixed(1)}% with category-level variance pressure.`,
        impact: context.budgetCoveragePct > 90 ? "Needs correction" : "In control",
      },
      {
        id: "r-health",
        title: "Financial health review",
        date: new Date(now.getTime() - 1000 * 60 * 60 * 126),
        summary: `Financial health score is ${Math.round(context.financialHealthScore)}/100 with focus on savings consistency.`,
        impact: "Score optimization path available",
      },
    ],
    [now, context, potentialSavings, defaultCurrency, activeGoals]
  );

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
  const isRubyAIEmpty = transactions.length === 0 && subscriptions.length === 0 && budgets.length === 0;

  if (isLoading || isLoadingSubs) {
    return (
      <div className="motion-card-enter rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
        Initializing Ruby AI financial advisor systems...
      </div>
    );
  }

  return (
    <div className="premium-page">
      <section className="premium-section relative overflow-hidden rounded-[30px] p-6 sm:p-7">
        <div className="pointer-events-none absolute -left-16 top-[-50px] h-52 w-52 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-[-50px] top-8 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200">
              <Bot className="h-3.5 w-3.5" />
              Ruby AI CFO
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Personal AI CFO Experience
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Ruby AI is your finance-native assistant that analyzes spending behavior, predicts risk, and recommends concrete next actions.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3 max-w-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Ruby AI Status</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300">Active. Last analysis {formatDate(now, { dateStyle: "medium", timeStyle: "short" })}.</p>
            <p className="mt-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[11px] text-zinc-200">
              Focus: Reduce {context.topSpendingCategory.toLowerCase()} variance and optimize recurring costs.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">AI Financial Context Summary</p>
            <p className="mt-1 text-sm text-zinc-200">{context.weeklySummary}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Current Financial Focus</p>
            <p className="mt-1 text-sm text-zinc-200">Primary optimization target: {context.topSpendingCategory}</p>
          </article>
          <article className="rounded-xl border border-red-500/35 bg-red-500/10 p-3">
            <p className="text-xs text-red-200">Key Recommendation</p>
            <p className="mt-1 text-sm text-zinc-100">
              Reduce food and subscription spending by {formatCurrency(Math.max(24, potentialSavings * 0.35), defaultCurrency)} this week to improve score momentum.
            </p>
          </article>
        </div>
      </section>

      {isRubyAIEmpty ? (
        <PremiumEmptyState
          icon={<Bot className="h-5 w-5" />}
          headline="Ask Ruby AI about your finances"
          description={`Ruby can analyze your spending, subscriptions, goals, and financial health once your workspace has data. Demo advisor profile: ${DEMO_USER_NAME}.`}
          primaryAction={{ label: "Start Conversation", to: "/finance" }}
          secondaryAction={{ label: "Open Overview", to: "/overview" }}
          badges={DEMO_CATEGORIES.slice(0, 6)}
        />
      ) : null}

      <section className="premium-section rounded-[24px]">
        <div className="mb-3 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">AI Financial Summary</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Financial Health Score</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{Math.round(context.financialHealthScore)}/100</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Monthly Income</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(context.monthlyIncome, defaultCurrency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Monthly Expenses</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(context.monthlySpending, defaultCurrency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Savings Rate</p>
            <p className={`mt-1 text-lg font-semibold ${context.savingsRatePct >= 15 ? "text-emerald-300" : "text-amber-200"}`}>
              {context.savingsRatePct.toFixed(1)}%
            </p>
          </article>
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
            contextSnippets={[
              {
                label: "Safe To Spend Today",
                value: formatCurrency(safeToSpend, defaultCurrency),
                detail: `${daysRemaining} days remaining in this cycle`,
              },
              {
                label: "Subscription Load",
                value: `${context.subscriptionLoadPct.toFixed(1)}%`,
                detail: `${formatCurrency(context.subscriptionMonthlyCost, defaultCurrency)} monthly recurring`,
              },
            ]}
          />
        </div>
        <div className="space-y-5 xl:col-span-4">
          <RubyAIInsightPanel cards={insightCards} />
          <RubyAIMemoryPanel memory={memory} />
        </div>
      </div>

      <section className="premium-section rounded-[24px]">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Smart Prompt Suggestions</h2>
        </div>
        <RubyAISuggestedPrompts prompts={suggestions} onSelect={setLastPrompt} />
        <div className="mt-3">
          <RubyAIPromptCards prompts={promptCards} onSelect={setLastPrompt} />
        </div>
        {lastPrompt ? (
          <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-400">
            Selected prompt: <span className="text-zinc-200">{lastPrompt}</span>
          </p>
        ) : null}
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-2 flex items-center gap-2">
          <WandSparkles className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Smart Action Cards</h2>
        </div>
        <RubyAISmartActionCards actions={smartActions} />
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-2 flex items-center gap-2">
          <Wallet2 className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Context Panels</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Current Financial Health Score</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{Math.round(context.financialHealthScore)}/100</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Monthly Income / Expenses</p>
            <p className="mt-1 text-sm text-zinc-100">
              {formatCurrency(context.monthlyIncome, defaultCurrency)} / {formatCurrency(context.monthlySpending, defaultCurrency)}
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Active Goals / Upcoming Payments</p>
            <p className="mt-1 text-sm text-zinc-100">
              {activeGoals} goals • {upcomingPayments} payments
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Top Category / Potential Savings</p>
            <p className="mt-1 text-sm text-zinc-100">
              {context.topSpendingCategory} • {formatCurrency(potentialSavings, defaultCurrency)}
            </p>
          </article>
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-2 flex items-center gap-2">
          <FileBarChart2 className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Recent AI Analyses</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recentAnalyses.map((analysis) => (
            <article key={analysis.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-medium text-zinc-100">{analysis.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{formatDate(analysis.date, { dateStyle: "medium", timeStyle: "short" })}</p>
              <p className="mt-1 text-xs text-zinc-300">{analysis.summary}</p>
              <p className="mt-1 text-xs text-zinc-500">Impact: {analysis.impact}</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-2.5 py-1 text-[11px] text-red-100 transition hover:bg-red-500/25"
              >
                {analysis.impact.toLowerCase().includes("high") || analysis.impact.toLowerCase().includes("needs") ? (
                  <CircleAlert className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Open analysis
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Financial Assistant Modes</h2>
        </div>
        <RubyAIAssistantModes modes={assistantModes} />
      </section>
    </div>
  );
};

export default RubyAI;

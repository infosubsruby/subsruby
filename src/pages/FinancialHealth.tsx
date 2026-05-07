import { useMemo } from "react";
import { HeartPulse } from "lucide-react";
import { useFinance } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import { buildPredictiveFinanceEngine } from "@/lib/predictiveFinanceEngine";
import { FinancialHealthSection } from "@/components/overview/FinancialHealthSection";
import { formatCurrency } from "@/i18n/currency";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_CATEGORIES } from "@/data/demoFinanceData";

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const FinancialHealth = () => {
  const { transactions, budgets, isLoading } = useFinance();
  const { subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const { defaultCurrency } = useSettings();

  const now = new Date();
  const currentKey = monthKey(now);

  const healthContext = useMemo(() => {
    const monthKeys = [5, 4, 3, 2, 1, 0].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return monthKey(d);
    });
    const monthlyIncomeSeries = monthKeys.map((key) =>
      transactions
        .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0)
    );
    const monthlyExpenseSeries = monthKeys.map((key) =>
      transactions
        .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0)
    );

    const monthlyIncome = transactions
      .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === currentKey)
      .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
    const monthlyExpense = transactions
      .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === currentKey)
      .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
    const monthlySubscription = subscriptions.reduce((sum, sub) => {
      const amount = safe(Number(sub.price));
      return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
    }, 0);

    const budgetLimit = budgets.reduce((sum, budget) => sum + safe(Number(budget.limit_amount)), 0);
    const savingsRatePct = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense - monthlySubscription) / monthlyIncome) * 100 : 0;
    const goalProgressPct = budgetLimit > 0 ? clamp((monthlyExpense / budgetLimit) * 100, 0, 100) : 0;
    const subscriptionBurdenPct = monthlyIncome > 0 ? (monthlySubscription / monthlyIncome) * 100 : 0;
    const expenseRatioPct = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 100;
    const emergencyFundMonths = monthlyExpense > 0 ? Math.max(monthlyIncome - monthlyExpense, 0) / monthlyExpense : 0;
    const budgetDisciplineRatio = budgetLimit > 0 ? clamp(Math.min(budgetLimit / Math.max(monthlyExpense, 1), 1), 0, 1) : 0.62;
    const debtRatioPct = monthlyIncome > 0 ? (monthlySubscription / monthlyIncome) * 100 : 24;

    const result = calculateFinancialHealthScore({
      savingsRatePct,
      monthlyExpenseSeries,
      monthlyIncomeSeries,
      subscriptionBurdenPct,
      expenseRatioPct,
      goalProgressPct,
      emergencyFundMonths,
      overspendingDaysRatio: 0.24,
      debtRatioPct,
      budgetDisciplineRatio,
    });

    const prediction = buildPredictiveFinanceEngine({ transactions, budgets, subscriptions });
    return { result, prediction };
  }, [transactions, budgets, subscriptions, currentKey, now]);

  if (isLoading || subscriptionsLoading) {
    return (
      <div className="motion-card-enter rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
        Loading financial health intelligence...
      </div>
    );
  }

  const isEmpty = transactions.length === 0 && budgets.length === 0 && subscriptions.length === 0;
  if (isEmpty) {
    return (
      <div className="premium-page">
        <PremiumEmptyState
          icon={<HeartPulse className="h-5 w-5" />}
          headline="Financial Health tracker is ready"
          description="Add transactions, subscriptions, and budgets to activate your Financial Health Score system."
          primaryAction={{ label: "Add Financial Data", to: "/finance" }}
          secondaryAction={{ label: "Open Planning Hub", to: "/planning" }}
          badges={DEMO_CATEGORIES.slice(0, 4)}
        />
      </div>
    );
  }

  return (
    <div className="premium-page">
      <FinancialHealthSection
        result={healthContext.result}
        rubyWidgetSummary={`Current score is ${healthContext.result.score}/100. Ruby AI suggests improving ${healthContext.result.topNegativeFactor.toLowerCase()} this week to strengthen your plan.`}
        predictiveWidgetSummary={`Projected month-end balance: ${formatCurrency(
          healthContext.prediction.monthlyProjection.projectedEndBalance,
          defaultCurrency
        )}. Risk confidence: ${healthContext.prediction.monthlyProjection.negativeRiskPct.toFixed(1)}%.`}
      />
    </div>
  );
};

export default FinancialHealth;

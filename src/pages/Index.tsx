import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CreditCard,
  Gauge,
  Goal,
  Loader2,
  Lock,
  PiggyBank,
  ReceiptText,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { LandingCard, LandingFeatureBlock, LandingSection } from "@/components/landing/LandingPrimitives";
import { LandingMiniStack, LandingMockPreview } from "@/components/landing/LandingMockPreview";

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/overview" replace />;
  }

  return (
    <div className="min-h-screen bg-[#07090d]">
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-14 pt-28 sm:pb-20 sm:pt-32">
        <div className="pointer-events-none absolute left-[-120px] top-20 h-80 w-80 rounded-full bg-red-600/18 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-100px] top-40 h-72 w-72 rounded-full bg-rose-500/14 blur-[120px]" />
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-red-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Personal Finance OS
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl md:text-6xl">
              Your AI Financial Operating System
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-zinc-300 sm:text-lg">
              Ruby AI helps you track spending, optimize subscriptions, build smarter budgets, and reach your financial goals.
            </p>
            <p className="mx-auto mt-2 max-w-3xl text-sm text-zinc-400">
              Understand, plan, and optimize your money with Ruby AI.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  View demo
                </Button>
              </Link>
            </div>
          </div>
          <LandingMockPreview />
        </div>
      </section>

      <LandingSection
        eyebrow="Product Preview"
        title="A finance command center, not just a subscription tracker"
        subtitle="Track spending, manage subscriptions, plan budgets, forecast future balance, and ask Ruby AI for daily money decisions in one operating system."
      >
        <LandingMiniStack />
      </LandingSection>

      <LandingSection
        eyebrow="Core Benefits"
        title="Why people choose Ruby AI"
        subtitle="Clear financial understanding, intelligent planning, and practical AI guidance without unnecessary complexity."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <LandingCard title="Understand your money" description="See where your money goes with AI-powered insights." icon={<ReceiptText className="h-4 w-4" />} />
          <LandingCard title="Stop wasting on subscriptions" description="Detect recurring payments, yearly costs, and savings opportunities." icon={<CreditCard className="h-4 w-4" />} />
          <LandingCard title="Plan smarter budgets" description="Ruby AI helps you create budgets based on your income, goals, and spending behavior." icon={<PiggyBank className="h-4 w-4" />} />
          <LandingCard title="Reach financial goals" description="Track savings goals and get predictions on when you’ll complete them." icon={<Goal className="h-4 w-4" />} />
          <LandingCard title="Predict your future balance" description="Know what you can safely spend before the month ends." icon={<Gauge className="h-4 w-4" />} />
        </div>
      </LandingSection>

      <LandingSection
        eyebrow="Ruby AI"
        title="Meet Ruby AI, your personal finance brain."
        subtitle="Your personal AI CFO for everyday money decisions."
      >
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-5">
            {[
              "Why did I spend more this month?",
              "Can I afford this purchase?",
              "How can I save $200 this month?",
              "Analyze my subscriptions.",
              "Improve my Financial Health Score.",
            ].map((prompt) => (
              <div key={prompt} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                {prompt}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 lg:col-span-7">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-red-200">Example AI answer</p>
            <p className="text-sm text-red-50">
              Ruby AI found that your food spending is 18% above your weekly average. Reducing it by $12/day for the next 10 days keeps you on track.
            </p>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-300">
              Ruby AI focus: spending control, subscription optimization, and goal acceleration.
            </div>
          </div>
        </div>
      </LandingSection>

      <LandingSection
        eyebrow="Feature Platform"
        title="Built for complete personal finance management"
        subtitle="Track, plan, predict, and optimize with connected modules across your full money lifecycle."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <LandingFeatureBlock title="AI Overview Dashboard" description="See financial status, trends, and recommendations in one command center." insight="Your savings momentum improved 7% this month." />
          <LandingFeatureBlock title="Financial Health Score" description="Understand your score drivers and get practical improvement actions." insight="Score can improve 4 points by boosting savings target consistency." />
          <LandingFeatureBlock title="Smart Transactions" description="Monitor spending behavior and identify high-impact categories." insight="Weekend transactions are 24% above weekday baseline." />
          <LandingFeatureBlock title="Subscription Optimizer" description="Control recurring costs and detect yearly savings opportunities." insight="Two services are underused and add up to $36/year waste." />
          <LandingFeatureBlock title="Goals & Savings" description="Track progress and estimate completion timing with predictive guidance." insight="Reducing entertainment by $40 can finish travel goal one month earlier." />
          <LandingFeatureBlock title="Smart Budget Planner" description="Set adaptive category budgets with risk labels and safe-to-spend controls." insight="Food category is pacing 18% above your monthly plan." />
          <LandingFeatureBlock title="Predictive Finance" description="Forecast your month-end position before problems happen." insight="Projected end balance remains positive with moderate risk." />
          <LandingFeatureBlock title="Monthly Reports" description="Review earnings, spending, savings, and action plan in a premium report." insight="Net savings improved compared to last month." />
          <LandingFeatureBlock title="Wallets & Accounts" description="Manage manual wallets now, with sync-ready architecture for later." insight="Cash and card flows are now separated for clearer planning." />
          <LandingFeatureBlock title="Ruby AI Chat" description="Ask practical money questions and receive context-aware suggestions." insight="Suggested next action: reduce food spend by $12/day for 10 days." />
        </div>
      </LandingSection>

      <LandingSection eyebrow="How It Works" title="Three steps to smarter money decisions">
        <div className="grid gap-3 md:grid-cols-3">
          <LandingCard title="1. Add your financial data" description="Start manually with wallets, transactions, subscriptions, and goals." icon={<Wallet className="h-4 w-4" />} />
          <LandingCard title="2. Ruby AI analyzes patterns" description="Ruby detects risks, waste, trends, and opportunities." icon={<BrainCircuit className="h-4 w-4" />} />
          <LandingCard title="3. Make smarter decisions" description="Follow personalized recommendations to save more and spend better." icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>
      </LandingSection>

      <LandingSection eyebrow="Use Cases" title="Who Ruby AI is built for">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <LandingCard title="Students" description="Build a budget, control spending, and avoid running out of money before the month ends." icon={<Users className="h-4 w-4" />} />
          <LandingCard title="Freelancers" description="Handle variable income with safer spending guidance and monthly forecasts." />
          <LandingCard title="Young professionals" description="Balance lifestyle spending with long-term savings goals." />
          <LandingCard title="Subscription-heavy users" description="Track recurring charges, renewal risk, and optimization opportunities." />
          <LandingCard title="Budget-conscious families" description="Coordinate categories and priorities with practical goal planning." />
          <LandingCard title="People trying to save money" description="Use clear daily actions to increase savings consistency." />
        </div>
      </LandingSection>

      <LandingSection eyebrow="Pricing Preview" title="Simple plans for growing financial intelligence">
        <div className="grid gap-4 md:grid-cols-2">
          <LandingCard
            title="Free"
            description="Get started with manual tracking and core planning."
            className="border-white/12"
          >
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>- Manual tracking</li>
              <li>- Basic subscriptions</li>
              <li>- Basic goals</li>
              <li>- Limited insights</li>
            </ul>
          </LandingCard>
          <LandingCard
            title="Pro"
            description="Unlock full Ruby AI and advanced planning intelligence."
            className="border-red-500/35 bg-red-500/10"
          >
            <ul className="space-y-1 text-sm text-red-50">
              <li>- Ruby AI</li>
              <li>- Advanced analytics</li>
              <li>- Predictive finance</li>
              <li>- Monthly reports</li>
              <li>- Budget planner</li>
              <li>- Subscription optimizer</li>
            </ul>
          </LandingCard>
        </div>
      </LandingSection>

      <LandingSection eyebrow="Trust & Privacy" title="Built with a privacy-first product approach">
        <div className="grid gap-3 md:grid-cols-2">
          <LandingCard title="You control your data" description="Ruby supports manual tracking from day one and keeps data controls explicit." icon={<Lock className="h-4 w-4" />} />
          <LandingCard title="No false complexity" description="Bank sync is coming later. Today, you can still run a complete finance workflow manually." icon={<Shield className="h-4 w-4" />} />
        </div>
      </LandingSection>

      <section className="px-4 pb-20 pt-10">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-10">
            <div className="pointer-events-none absolute -right-20 top-[-40px] h-44 w-44 rounded-full bg-red-600/20 blur-3xl" />
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">Start managing your money with Ruby AI.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400">
              Track spending, manage subscriptions, optimize budgets, and improve financial decisions with your AI finance brain.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Create your free account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Explore demo dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

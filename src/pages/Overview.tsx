import { BrainCircuit, Goal, LineChart, WalletCards } from "lucide-react";

const Overview = () => {
  const overviewSections = [
    "AI Financial Health",
    "AI Insights Feed",
    "Balance Cards",
    "Goal Progress",
    "Spending Analytics",
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_30px_rgba(239,68,68,0.10)] backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Overview</h1>
            <p className="text-sm text-zinc-400">AI-powered command center for your financial operating system.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
        {overviewSections.map((section, index) => (
          <section
            key={section}
            className="rounded-2xl border border-white/10 bg-black/25 p-5 transition duration-200 hover:border-red-500/35 hover:bg-red-500/10 md:min-h-[170px] xl:col-span-6"
          >
            <div className="mb-3 flex items-center gap-2">
              {index === 0 ? <BrainCircuit className="h-4 w-4 text-red-300" /> : null}
              {index === 2 ? <WalletCards className="h-4 w-4 text-red-300" /> : null}
              {index === 3 ? <Goal className="h-4 w-4 text-red-300" /> : null}
              {index === 4 ? <LineChart className="h-4 w-4 text-red-300" /> : null}
              <h2 className="text-sm font-semibold text-zinc-100">{section}</h2>
            </div>
            <p className="text-xs text-zinc-500">Placeholder module created. Existing charts and finance/subscription/transaction logic remain untouched.</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Overview;

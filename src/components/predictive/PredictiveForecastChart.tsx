import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { PredictivePoint } from "@/lib/predictiveFinanceEngine";

const config = {
  balance: { label: "Balance", color: "#f87171" },
  spending: { label: "Spending", color: "#fb7185" },
  savings: { label: "Savings", color: "#34d399" },
} satisfies ChartConfig;

const axisStyle = { fontSize: 11, fill: "#a1a1aa" };

export const PredictiveForecastChart = ({ data }: { data: PredictivePoint[] }) => {
  return (
    <ChartContainer config={config} className="h-[230px] w-full">
      <AreaChart data={data} margin={{ left: 10, right: 12, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="predBalanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f87171" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0.06} />
          </linearGradient>
          <linearGradient id="predSpendingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fb7185" stopOpacity={0.34} />
            <stop offset="95%" stopColor="#fb7185" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={42} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area type="monotone" dataKey="balance" stroke="var(--color-balance)" fill="url(#predBalanceFill)" strokeWidth={2} />
        <Area type="monotone" dataKey="spending" stroke="var(--color-spending)" fill="url(#predSpendingFill)" strokeDasharray="5 4" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  );
};


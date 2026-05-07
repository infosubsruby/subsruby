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
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  return (
    <ChartContainer config={config} className="motion-card-enter h-[210px] w-full sm:h-[230px]">
      <AreaChart data={data} margin={{ left: isMobile ? -8 : 10, right: isMobile ? 6 : 12, top: 10, bottom: 0 }}>
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
        <XAxis
          dataKey="label"
          tick={{ ...axisStyle, fontSize: isMobile ? 10 : axisStyle.fontSize }}
          interval={isMobile ? "preserveStartEnd" : 0}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ ...axisStyle, fontSize: isMobile ? 10 : axisStyle.fontSize }}
          axisLine={false}
          tickLine={false}
          width={isMobile ? 34 : 42}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area type="monotone" dataKey="balance" stroke="var(--color-balance)" fill="url(#predBalanceFill)" strokeWidth={2} />
        <Area type="monotone" dataKey="spending" stroke="var(--color-spending)" fill="url(#predSpendingFill)" strokeDasharray="5 4" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  );
};

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

interface CashFlowChartProps {
  data: { month: string; income: number; expenses: number }[];
  currency: string;
}

export const CashFlowChart = ({ data, currency }: CashFlowChartProps) => {
  const tFinance = useTranslations("Finance");
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  return (
    <div className="glass-card flex h-[250px] max-h-[300px] w-full flex-col rounded-xl p-3.5 sm:h-[280px] sm:p-5">
      <h3 className="mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
        {tFinance("monthly_cash_flow")}
      </h3>
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: isMobile ? 4 : 20, left: isMobile ? -14 : 0, bottom: isMobile ? 0 : 5 }}>
            <CartesianGrid horizontal strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              stroke="hsl(220, 10%, 55%)"
              fontSize={isMobile ? 10 : 12}
              angle={isMobile ? 0 : -45}
              dx={isMobile ? 0 : -10}
              dy={isMobile ? 4 : 10}
              tickFormatter={(value) => String(value).split(" ")[0]}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              stroke="hsl(220, 10%, 55%)"
              fontSize={isMobile ? 10 : 12}
              width={isMobile ? 34 : 52}
              tickFormatter={(value) => (isMobile ? formatCurrency(Number(value), currency, { maximumFractionDigits: 0 }) : formatCurrency(Number(value), currency))}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 12%)",
                border: "1px solid hsl(220, 15%, 20%)",
                borderRadius: "8px",
                color: "hsl(0, 0%, 95%)",
              }}
              formatter={(value: number) => [formatCurrency(value, currency), ""]}
            />
            <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={isMobile ? 14 : 24} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={isMobile ? 14 : 24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

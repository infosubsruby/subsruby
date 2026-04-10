import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";
import { useMemo } from "react";

interface CashFlowChartProps {
  data: { month: string; income: number; expenses: number }[];
  currency: string;
}

export const CashFlowChart = ({ data, currency }: CashFlowChartProps) => {
  const tFinance = useTranslations("Finance");
  const tModals = useTranslations("Modals");
  const chartData = useMemo(
    () =>
      (data || []).map((d) => {
        const net = (Number(d.income) || 0) - (Number(d.expenses) || 0);
        return {
          month: d.month,
          pos: Math.max(net, 0),
          neg: Math.min(net, 0),
          net,
        };
      }),
    [data]
  );
  return (
    <div className="glass-card rounded-xl p-4 md:p-5">
      <h3 className="font-display font-semibold text-lg mb-4">
        {tFinance("monthly_cash_flow")}
      </h3>
      <div className="h-64 md:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDeficit" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              stroke="hsl(220, 10%, 55%)"
              fontSize={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              stroke="hsl(220, 10%, 55%)"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(Number(value), currency)}
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
            <Bar dataKey="pos" stackId="net" radius={[10, 10, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={`pos-${idx}`} fill="url(#colorIncome)" />
              ))}
            </Bar>
            <Bar dataKey="neg" stackId="net" radius={[0, 0, 10, 10]}>
              {chartData.map((entry, idx) => (
                <Cell key={`neg-${idx}`} fill="url(#colorDeficit)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

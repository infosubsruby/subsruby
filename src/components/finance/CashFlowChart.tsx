import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

interface CashFlowChartProps {
  data: { month: string; income: number; expenses: number }[];
  currency: string;
}

export const CashFlowChart = ({ data, currency }: CashFlowChartProps) => {
  const tFinance = useTranslations("Finance");
  const tModals = useTranslations("Modals");
  return (
    <div className="glass-card rounded-xl p-4 md:p-5">
      <h3 className="font-display font-semibold text-lg mb-4">
        {tFinance("monthly_cash_flow")}
      </h3>
      <div className="h-64 md:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
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
            <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

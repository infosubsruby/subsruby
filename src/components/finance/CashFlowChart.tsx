import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-display font-semibold text-lg mb-4">
        {tFinance("monthly_cash_flow")}
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
            <XAxis
              dataKey="month"
              stroke="hsl(220, 10%, 55%)"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(220, 10%, 55%)"
              fontSize={12}
              tickLine={false}
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
            <Legend />
            <Bar
              dataKey="income"
              name={tModals("income")}
              fill="hsl(142, 70%, 45%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name={tFinance("expenses_subs")}
              fill="hsl(358, 82%, 55%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

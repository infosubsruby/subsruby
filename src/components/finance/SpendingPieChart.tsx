import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

interface SpendingPieChartProps {
  data: { name: string; value: number }[];
  currency: string;
}

const COLORS = [
  "hsl(358, 82%, 55%)",
  "hsl(142, 70%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(220, 70%, 55%)",
  "hsl(280, 70%, 55%)",
  "hsl(180, 70%, 45%)",
  "hsl(320, 70%, 55%)",
  "hsl(60, 70%, 45%)",
  "hsl(200, 70%, 55%)",
  "hsl(100, 70%, 45%)",
];

export const SpendingPieChart = ({ data, currency }: SpendingPieChartProps) => {
  const tFinance = useTranslations("Finance");
  const tCategories = useTranslations("Categories");
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const getCategoryLabel = (name: string) => {
    switch (name) {
      case "Entertainment":
        return tCategories("entertainment");
      case "Food & Dining":
        return tCategories("food_dining");
      case "Shopping":
        return tCategories("shopping");
      case "Transportation":
        return tCategories("transportation");
      case "Utilities":
        return tCategories("utilities");
      case "Health":
        return tCategories("health");
      case "Education":
        return tCategories("education");
      case "Travel":
        return tCategories("travel");
      case "Subscriptions":
        return tCategories("subscriptions");
      case "Other":
        return tCategories("other");
      default:
        return name;
    }
  };

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-lg mb-4">
          {tFinance("spending_dist")}
        </h3>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          —
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-display font-semibold text-lg mb-4">
        {tFinance("spending_dist")}
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                `${getCategoryLabel(String(name))} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(220, 20%, 6%)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 12%)",
                border: "1px solid hsl(220, 15%, 20%)",
                borderRadius: "8px",
                color: "hsl(0, 0%, 95%)",
              }}
              formatter={(value: number) => [
                `${formatCurrency(value, currency)} (${((value / total) * 100).toFixed(1)}%)`,
                "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-muted-foreground truncate">{getCategoryLabel(item.name)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

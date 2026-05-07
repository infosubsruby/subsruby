import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

interface SpendingPieChartProps {
  data: { name: string; value: number }[];
  currency: string;
}

const COLORS = [
  "hsl(358, 82%, 55%)",
  "hsl(24, 95%, 53%)",
  "hsl(38, 92%, 50%)",
  "hsl(220, 70%, 55%)",
  "hsl(240, 70%, 60%)",
  "hsl(270, 70%, 60%)",
  "hsl(290, 70%, 60%)",
  "hsl(320, 70%, 60%)",
  "hsl(200, 90%, 55%)",
  "hsl(45, 95%, 55%)",
];

export const SpendingPieChart = ({ data, currency }: SpendingPieChartProps) => {
  const tFinance = useTranslations("Finance");
  const tCategories = useTranslations("Categories");
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

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
      <div className="glass-card flex h-[250px] flex-col rounded-xl p-3.5 sm:h-[280px] sm:p-5">
        <h3 className="mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
          {tFinance("spending_dist")}
        </h3>
        <div className="flex-1 min-h-0 w-full flex items-center justify-center text-muted-foreground">
          No data
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card flex h-[250px] flex-col rounded-xl p-3.5 sm:h-[280px] sm:p-5">
      <h3 className="mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
        {tFinance("spending_dist")}
      </h3>
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <div className="flex h-[62%] w-full items-center justify-center sm:h-full sm:w-[52%]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 26 : 34}
                outerRadius={isMobile ? 46 : 56}
                paddingAngle={2}
                dataKey="value"
                label={false}
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

        <div className="grid w-full grid-cols-2 gap-x-2 gap-y-1.5 sm:w-[48%] sm:flex sm:flex-col sm:justify-center sm:gap-2">
          {data.slice(0, 6).map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-400">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate">{getCategoryLabel(item.name)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

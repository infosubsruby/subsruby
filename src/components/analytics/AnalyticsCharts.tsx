import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type TrendPoint = { label: string; value: number };
type ForecastPoint = { label: string; actual: number; forecast: number };

const lineConfig = {
  actual: { label: "Actual", color: "#f87171" },
  forecast: { label: "Forecast", color: "#fca5a5" },
  value: { label: "Value", color: "#f87171" },
} satisfies ChartConfig;

const axisStyle = { fontSize: 11, fill: "#a1a1aa" };

export const TrendLineChart = ({ data }: { data: TrendPoint[] }) => {
  return (
    <ChartContainer config={lineConfig} className="h-[210px] w-full">
      <LineChart data={data} margin={{ left: 8, right: 12, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={38} />
        <Tooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#f87171", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#fca5a5" }}
        />
      </LineChart>
    </ChartContainer>
  );
};

export const ForecastCurveChart = ({ data }: { data: ForecastPoint[] }) => {
  return (
    <ChartContainer config={lineConfig} className="h-[220px] w-full">
      <AreaChart data={data} margin={{ left: 8, right: 10, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fb7185" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#fb7185" stopOpacity={0.06} />
          </linearGradient>
          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fca5a5" stopOpacity={0.32} />
            <stop offset="95%" stopColor="#fca5a5" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
        <Tooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="var(--color-actual)"
          fill="url(#actualFill)"
          strokeWidth={2}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="forecast"
          stroke="var(--color-forecast)"
          fill="url(#forecastFill)"
          strokeWidth={2}
          strokeDasharray="5 4"
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ChartContainer>
  );
};

export const RadialMetricChart = ({ value, label }: { value: number; label: string }) => {
  const bounded = Math.max(0, Math.min(100, value));
  const data = [{ name: label, value: bounded }];

  return (
    <div className="h-[160px] w-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          barSize={12}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={10} fill="#f87171" />
          <text x="50%" y="47%" textAnchor="middle" className="fill-zinc-100 text-2xl font-semibold">
            {Math.round(bounded)}
          </text>
          <text x="50%" y="61%" textAnchor="middle" className="fill-zinc-500 text-[10px] uppercase tracking-[0.18em]">
            {label}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const HeatmapGrid = ({
  cells,
}: {
  cells: { day: string; week: number; intensity: number; amount: number }[];
}) => {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {cells.slice(-35).map((cell, idx) => (
        <div
          key={`${cell.day}-${cell.week}-${idx}`}
          className="group relative h-7 rounded-md border border-white/5 transition"
          style={{
            backgroundColor: `rgba(248, 113, 113, ${0.08 + cell.intensity * 0.72})`,
          }}
        >
          <div className="pointer-events-none absolute left-1/2 top-[-28px] z-20 hidden -translate-x-1/2 rounded-md border border-white/10 bg-[#090b11] px-2 py-1 text-[10px] text-zinc-300 shadow-xl group-hover:block">
            {cell.day}: {cell.amount.toFixed(0)}
          </div>
        </div>
      ))}
    </div>
  );
};

export const CategoryBars = ({
  data,
}: {
  data: { category: string; value: number; growthPct: number }[];
}) => {
  const max = Math.max(1, ...data.map((item) => item.value));
  const limited = data.slice(0, 6);

  return (
    <div className="space-y-3">
      {limited.map((item) => (
        <div key={item.category}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="text-zinc-300">{item.category}</span>
            <span className={item.growthPct >= 0 ? "text-red-300" : "text-emerald-300"}>
              {item.growthPct >= 0 ? "+" : ""}
              {item.growthPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800/90">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-red-500/80 to-rose-300/90 transition-all duration-500"
              style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ComparisonMiniBars = ({
  items,
}: {
  items: { label: string; value: number }[];
}) => {
  const max = Math.max(1, ...items.map((item) => item.value));
  const colors = ["#fb7185", "#f87171", "#fca5a5", "#fecdd3"];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item, idx) => (
        <div key={item.label} className="rounded-lg border border-white/10 bg-black/20 p-2">
          <div className="mb-2 h-16 rounded-md bg-zinc-900/80 p-1">
            <div
              className="h-full w-full rounded-sm transition-all duration-500"
              style={{
                height: `${Math.max(10, (item.value / max) * 100)}%`,
                backgroundColor: colors[idx % colors.length],
              }}
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{item.label}</p>
          <p className="text-sm font-semibold text-zinc-100">{item.value.toFixed(0)}%</p>
        </div>
      ))}
    </div>
  );
};

export const BehaviorRadials = ({
  items,
}: {
  items: { label: string; value: number }[];
}) => {
  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-white/10 bg-black/25 p-3">
          <RadialMetricChart value={item.value} label={item.label} />
        </div>
      ))}
    </div>
  );
};

export const SparkBars = ({ data }: { data: TrendPoint[] }) => {
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <div className="flex h-20 items-end gap-1.5">
      {data.map((point, idx) => (
        <div key={`${point.label}-${idx}`} className="group relative flex-1">
          <div
            className="w-full rounded-md bg-gradient-to-t from-red-600/90 to-rose-300/80 transition-all duration-500"
            style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }}
          />
          <div className="pointer-events-none absolute bottom-[110%] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/80 px-1.5 py-0.5 text-[10px] text-zinc-300 group-hover:block">
            {point.label}: {point.value.toFixed(0)}
          </div>
        </div>
      ))}
    </div>
  );
};

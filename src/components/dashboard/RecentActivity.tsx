import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

export const RecentActivity = () => {
  const t = useTranslations("Dashboard");
  const items = [
    { id: 1, name: "Spotify", date: "Dün", amount: 1.35 },
    { id: 2, name: "Netflix", date: "3 Gün Önce", amount: 15.99 },
  ];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 w-full h-full">
      <h3 className="font-display text-lg font-semibold">{t("recent_activity")}</h3>
      <div className="mt-4 relative">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-800" />
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="relative pl-6">
              <div className="absolute left-1 top-3 w-2.5 h-2.5 rounded-full bg-gray-400/30 border border-gray-800" />
              <div className="flex items-start justify-between gap-3 text-gray-400">
                <div className="min-w-0">
                  <div className="text-sm truncate">{it.name}</div>
                  <div className="text-xs">{it.date}</div>
                </div>
                <div className="text-sm font-semibold text-gray-400">
                  {formatCurrency(it.amount, "USD")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { useTranslations } from "@/i18n/useTranslations";

export const SmartInsights = () => {
  const t = useTranslations("Dashboard");
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 w-full h-full">
      <h3 className="font-display text-lg font-semibold">{t("smart_insights")}</h3>
      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3 rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20">
          <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/20 text-gray-200">
            💡
          </div>
          <p className="text-sm text-gray-200">
            Netflix planınızı yıllık yaparsanız yılda $15 tasarruf edebilirsiniz.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20">
          <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-yellow-500/20 text-gray-200">
            ⚠️
          </div>
          <p className="text-sm text-gray-200">
            Spotify aboneliğinizin fiyatı bu ay güncellendi.
          </p>
        </div>
      </div>
    </div>
  );
};

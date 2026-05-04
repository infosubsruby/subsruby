import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

export const AIFinancialInsights = () => {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="w-full flex items-center gap-3 rounded-xl px-4 py-2 bg-emerald-500/10 border border-emerald-500/20">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-sm text-gray-300 leading-tight">
          Gelir-gider oranınız çok sağlıklı. Geçen aya göre %15 daha fazla tasarruf ettiniz.
        </p>
      </div>

      <div className="w-full flex items-center gap-3 rounded-xl px-4 py-2 bg-amber-500/10 border border-amber-500/20">
        <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-sm text-gray-300 leading-tight">
          Abonelik harcamalarınızın bütçenize oranı ideal seviyede (%3).
        </p>
      </div>

      <div className="w-full flex items-center gap-3 rounded-xl px-4 py-2 bg-blue-500/10 border border-blue-500/20">
        <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-sm text-gray-300 leading-tight">
          Acil durum fonunuz için bu ay fazladan $200 ayırabilirsiniz.
        </p>
      </div>
    </div>
  );
};

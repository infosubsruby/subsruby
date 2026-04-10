import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

export const AIFinancialInsights = () => {
  return (
    <div className="glass-card rounded-2xl p-3 md:p-6 h-full">
      <h3 className="font-display font-semibold text-lg">AI Financial Summary</h3>
      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Gelir-gider oranınız çok sağlıklı. Geçen aya göre %15 daha fazla tasarruf ettiniz.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Abonelik harcamalarınızın bütçenize oranı ideal seviyede (%3).
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Acil durum fonunuz için bu ay fazladan $200 ayırabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};


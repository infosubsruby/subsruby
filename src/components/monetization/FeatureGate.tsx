import type { ReactNode } from "react";
import { Lock } from "lucide-react";

type FeatureGateProps = {
  enabled: boolean;
  title: string;
  description: string;
  onUpgradeClick: () => void;
  children: ReactNode;
};

export const FeatureGate = ({ enabled, title, description, onUpgradeClick, children }: FeatureGateProps) => {
  if (enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="pointer-events-none opacity-35 blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/45 p-4">
        <div className="max-w-sm rounded-xl border border-red-500/30 bg-[#111114]/95 p-4 text-center">
          <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
            <Lock className="h-4 w-4 text-red-200" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <p className="mt-1 text-xs text-zinc-400">{description}</p>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="mt-3 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-100 transition hover:bg-red-500/25"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
};

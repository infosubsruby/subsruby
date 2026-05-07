import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";

export const SettingsToggleRow = ({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  icon?: ReactNode;
}) => {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-black/20 p-3">
      <div className="flex items-start gap-2">
        {icon ? <div className="mt-0.5 text-zinc-400">{icon}</div> : null}
        <div>
          <p className="text-sm font-medium text-zinc-200">{label}</p>
          {description ? <p className="mt-0.5 text-xs text-zinc-500">{description}</p> : null}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
};

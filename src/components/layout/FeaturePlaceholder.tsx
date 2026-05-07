import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";

type FeaturePlaceholderProps = {
  title: string;
  subtitle: string;
  sections: string[];
  icon?: ReactNode;
};

export const FeaturePlaceholder = ({ title, subtitle, sections, icon }: FeaturePlaceholderProps) => {
  return (
    <div className="premium-page">
      <PremiumEmptyState
        icon={icon ?? <Sparkles className="h-5 w-5" />}
        headline={`${title} workspace is ready`}
        description={subtitle}
        primaryAction={{ label: "Open Dashboard", to: "/dashboard" }}
        secondaryAction={{ label: "Open Finance", to: "/finance" }}
        badges={sections.slice(0, 5)}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <section
            key={section}
            className="premium-card premium-card-hover"
          >
            <p className="text-sm font-medium text-zinc-100">{section}</p>
            <p className="mt-2 text-xs text-zinc-500">This module is ready for integration with existing platform logic.</p>
          </section>
        ))}
      </div>
    </div>
  );
};

import {
  BarChart3,
  Bot,
  BrainCircuit,
  CircleDollarSign,
  CreditCard,
  Goal,
  HeartPulse,
  Home,
  Landmark,
  List,
  Settings,
  Wallet,
} from "lucide-react";

export type SidebarLeafItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  aliases?: string[];
};

export type SidebarGroupItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: SidebarLeafItem[];
};

export const PLANNING_CHILDREN: SidebarLeafItem[] = [
  { label: "Goals", to: "/goals", icon: Goal, aliases: ["/planning/goals"] },
  {
    label: "Budget Planner",
    to: "/smart-budget-planner",
    icon: CircleDollarSign,
    aliases: ["/planning/budget-planner"],
  },
  {
    label: "Monthly Reports",
    to: "/monthly-report",
    icon: BrainCircuit,
    aliases: ["/planning/monthly-reports"],
  },
  {
    label: "Financial Health",
    to: "/financial-health",
    icon: HeartPulse,
    aliases: ["/planning/financial-health"],
  },
];

export const SIDEBAR_TOP_ITEMS: SidebarLeafItem[] = [
  { label: "Overview", to: "/overview", icon: Home },
  { label: "Transactions", to: "/transactions", icon: List },
  { label: "Subscriptions", to: "/subscriptions", icon: CreditCard },
];

export const PLANNING_GROUP: SidebarGroupItem = {
  label: "Planning",
  to: "/planning",
  icon: Goal,
  children: PLANNING_CHILDREN,
};

export const SIDEBAR_BOTTOM_ITEMS: SidebarLeafItem[] = [
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "AI Insights", to: "/ai-insights", icon: BrainCircuit },
  { label: "Wallets", to: "/wallets", icon: Wallet },
  { label: "Ruby AI", to: "/ruby-ai", icon: Bot },
  { label: "Classic Finance", to: "/classic-finance", icon: Landmark },
  { label: "Settings", to: "/settings", icon: Settings },
];

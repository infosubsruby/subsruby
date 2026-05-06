import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  CreditCard,
  FolderKanban,
  Gauge,
  Goal,
  Home,
  Landmark,
  List,
  LogOut,
  Settings,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const sidebarItems: SidebarItem[] = [
  { label: "Overview", to: "/overview", icon: Home },
  { label: "Transactions", to: "/transactions", icon: List },
  { label: "Subscriptions", to: "/subscriptions", icon: CreditCard },
  { label: "AI Insights", to: "/ai-insights", icon: BrainCircuit },
  { label: "Goals", to: "/goals", icon: Goal },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Wallets", to: "/wallets", icon: Wallet },
  { label: "Ruby AI", to: "/ruby-ai", icon: Bot },
  { label: "Classic Finance", to: "/classic-finance", icon: Landmark },
  { label: "Settings", to: "/settings", icon: Settings },
];

export const AppShell = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeLabel = useMemo(() => {
    const current = sidebarItems.find((item) => location.pathname === item.to);
    return current?.label ?? "Workspace";
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const goTo = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-140px] top-[-120px] h-[360px] w-[360px] rounded-full bg-red-600/15 blur-[120px]" />
        <div className="absolute right-[-120px] top-[180px] h-[320px] w-[320px] rounded-full bg-rose-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto flex w-full max-w-[1800px]">
        <aside className="hidden lg:flex lg:w-[290px] lg:shrink-0">
          <div className="sticky top-0 flex h-screen w-full flex-col border-r border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => goTo("/overview")}
              className="group mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:border-red-500/40 hover:bg-red-500/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-zinc-100">SubsRuby OS</p>
                <p className="text-xs text-zinc-400">AI Financial Operating System</p>
              </div>
            </button>

            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;

                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => goTo(item.to)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
                      isActive
                        ? "border-red-500/50 bg-red-500/15 text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.18)]"
                        : "border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/5 hover:text-zinc-100"
                    )}
                  >
                    {isActive ? <span className="absolute left-0 top-2 h-6 w-1 rounded-r-full bg-red-400" /> : null}
                    <Icon className={cn("h-4 w-4", isActive ? "text-red-300" : "text-zinc-400 group-hover:text-zinc-200")} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-zinc-500">Current Workspace</p>
              <p className="mt-1 text-sm font-medium text-zinc-200">{activeLabel}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0b10]/75 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-red-500/40 bg-red-500/15 px-2 py-1 text-xs font-semibold tracking-wide text-red-200 lg:hidden">
                  AI OS
                </div>
                <div className="hidden items-center gap-2 text-sm text-zinc-400 lg:flex">
                  <FolderKanban className="h-4 w-4 text-zinc-500" />
                  <span>{activeLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="h-10 w-10 rounded-full object-cover object-center"
                        />
                      ) : (
                        <User className="h-5 w-5 text-zinc-300" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 border-white/10 bg-[#12141a]/95 text-zinc-100 backdrop-blur-xl">
                    <DropdownMenuItem className="gap-2 focus:bg-white/10" onClick={() => goTo("/profile")}>
                      <User className="h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 focus:bg-white/10" onClick={() => goTo("/admin")}>
                      <Gauge className="h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="gap-2 text-red-300 focus:bg-red-500/15 focus:text-red-200"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="px-4 pb-8 pt-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

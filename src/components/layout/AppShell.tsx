import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  FolderKanban,
  Gauge,
  Menu,
  LogOut,
  PanelLeftClose,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLANNING_CHILDREN,
  PLANNING_GROUP,
  SIDEBAR_BOTTOM_ITEMS,
  SIDEBAR_TOP_ITEMS,
  type SidebarLeafItem,
} from "@/config/sidebarNavigation";

const isActivePath = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);
const matchesLeaf = (pathname: string, item: SidebarLeafItem) =>
  isActivePath(pathname, item.to) || (item.aliases?.some((alias) => isActivePath(pathname, alias)) ?? false);

export const AppShell = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [planningOpen, setPlanningOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isPlanningActive = useMemo(
    () => isActivePath(location.pathname, PLANNING_GROUP.to) || PLANNING_CHILDREN.some((item) => matchesLeaf(location.pathname, item)),
    [location.pathname]
  );

  useEffect(() => {
    if (isPlanningActive) setPlanningOpen(true);
  }, [isPlanningActive]);

  const activeLabel = useMemo(() => {
    const planningChild = PLANNING_CHILDREN.find((item) => matchesLeaf(location.pathname, item));
    if (planningChild) return `${PLANNING_GROUP.label} / ${planningChild.label}`;
    const topMatch = SIDEBAR_TOP_ITEMS.find((item) => matchesLeaf(location.pathname, item));
    if (topMatch) return topMatch.label;
    const bottomMatch = SIDEBAR_BOTTOM_ITEMS.find((item) => matchesLeaf(location.pathname, item));
    if (bottomMatch) return bottomMatch.label;
    if (isActivePath(location.pathname, PLANNING_GROUP.to)) return PLANNING_GROUP.label;
    return "Workspace";
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const goTo = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  const mobilePrimaryItems = [...SIDEBAR_TOP_ITEMS, PLANNING_GROUP, ...SIDEBAR_BOTTOM_ITEMS];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#08090c] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-140px] top-[-120px] h-[360px] w-[360px] rounded-full bg-red-600/15 blur-[120px]" />
        <div className="absolute right-[-120px] top-[180px] h-[320px] w-[320px] rounded-full bg-rose-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto flex w-full max-w-[1820px]">
        <aside className="hidden lg:flex lg:w-[290px] lg:shrink-0">
          <div className="sticky top-0 flex h-screen w-full flex-col border-r border-white/10 bg-white/[0.045] px-5 py-6 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => goTo("/overview")}
              className="group mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left transition-all duration-200 hover:border-red-500/35 hover:bg-red-500/[0.12]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-zinc-100">SubsRuby OS</p>
                <p className="text-xs text-zinc-400">AI Financial Operating System</p>
              </div>
            </button>

            <nav className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto pr-1">
              {SIDEBAR_TOP_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = matchesLeaf(location.pathname, item);
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => goTo(item.to)}
                    className={cn(
                      "interactive-nav group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
                      isActive
                        ? "border-red-500/45 bg-red-500/[0.14] text-red-100 shadow-[0_0_22px_rgba(239,68,68,0.16)]"
                        : "border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100"
                    )}
                  >
                    {isActive ? <span className="absolute left-0 top-2 h-6 w-1 rounded-r-full bg-red-400 transition-all duration-300" /> : null}
                    <Icon className={cn("h-4 w-4", isActive ? "text-red-300" : "text-zinc-400 group-hover:text-zinc-200")} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setPlanningOpen((prev) => !prev);
                    if (!isPlanningActive) goTo(PLANNING_GROUP.to);
                  }}
                  className={cn(
                    "interactive-nav group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
                    isPlanningActive
                      ? "border-red-500/45 bg-red-500/[0.14] text-red-100 shadow-[0_0_22px_rgba(239,68,68,0.16)]"
                      : "border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100"
                  )}
                >
                  {isPlanningActive ? <span className="absolute left-0 top-2 h-6 w-1 rounded-r-full bg-red-400 transition-all duration-300" /> : null}
                  <PLANNING_GROUP.icon className={cn("h-4 w-4", isPlanningActive ? "text-red-300" : "text-zinc-400 group-hover:text-zinc-200")} />
                  <span className="font-medium">{PLANNING_GROUP.label}</span>
                  <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200", planningOpen ? "rotate-180 text-red-300" : "text-zinc-500")} />
                </button>
                {planningOpen ? (
                  <div className="space-y-1 pl-3">
                    {PLANNING_CHILDREN.map((item) => {
                      const Icon = item.icon;
                      const isActive = matchesLeaf(location.pathname, item);
                      return (
                        <button
                          key={item.to}
                          type="button"
                          onClick={() => goTo(item.to)}
                          className={cn(
                            "group relative flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition-all duration-200",
                            isActive
                              ? "border-red-500/40 bg-red-500/[0.12] text-red-100"
                              : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-zinc-100"
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5", isActive ? "text-red-300" : "text-zinc-500 group-hover:text-zinc-200")} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {SIDEBAR_BOTTOM_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = matchesLeaf(location.pathname, item);
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => goTo(item.to)}
                    className={cn(
                      "interactive-nav group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
                      isActive
                        ? "border-red-500/45 bg-red-500/[0.14] text-red-100 shadow-[0_0_22px_rgba(239,68,68,0.16)]"
                        : "border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100"
                    )}
                  >
                    {isActive ? <span className="absolute left-0 top-2 h-6 w-1 rounded-r-full bg-red-400 transition-all duration-300" /> : null}
                    <Icon className={cn("h-4 w-4", isActive ? "text-red-300" : "text-zinc-400 group-hover:text-zinc-200")} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3.5">
              <p className="text-xs text-zinc-500">Current Workspace</p>
              <p className="mt-1 text-sm font-medium text-zinc-200">{activeLabel}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0b10]/75 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-zinc-100 lg:hidden"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[86vw] max-w-[340px] overflow-y-auto border-r border-white/10 bg-[#0d0f14]/95 px-4 pb-20 pt-4 text-zinc-100"
                  >
                    <SheetHeader className="mb-3 text-left">
                      <SheetTitle className="flex items-center gap-2 text-base text-zinc-100">
                        <Sparkles className="h-4 w-4 text-red-300" />
                        SubsRuby OS
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Current Workspace</p>
                      <p className="mt-1 text-sm text-zinc-200">{activeLabel}</p>
                    </div>
                    <nav className="space-y-1.5">
                      {mobilePrimaryItems.map((item) => {
                        const isPlanning = "children" in item;
                        const itemActive = isPlanning
                          ? isPlanningActive || isActivePath(location.pathname, item.to)
                          : matchesLeaf(location.pathname, item);
                        const Icon = item.icon;

                        if (isPlanning) {
                          return (
                            <div key={item.to} className="space-y-1">
                              <button
                                type="button"
                                onClick={() => setPlanningOpen((prev) => !prev)}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                                  itemActive
                                    ? "border-red-500/40 bg-red-500/12 text-red-100"
                                    : "border-white/10 bg-black/20 text-zinc-300"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                                <ChevronDown className={cn("ml-auto h-4 w-4 transition", planningOpen ? "rotate-180 text-red-300" : "text-zinc-500")} />
                              </button>
                              {planningOpen ? (
                                <div className="space-y-1 pl-2">
                                  {item.children.map((child) => {
                                    const ChildIcon = child.icon;
                                    const childActive = matchesLeaf(location.pathname, child);
                                    return (
                                      <button
                                        key={child.to}
                                        type="button"
                                        onClick={() => goTo(child.to)}
                                        className={cn(
                                          "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-[13px]",
                                          childActive
                                            ? "border-red-500/35 bg-red-500/10 text-red-100"
                                            : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.03]"
                                        )}
                                      >
                                        <ChildIcon className="h-3.5 w-3.5" />
                                        {child.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={item.to}
                            type="button"
                            onClick={() => goTo(item.to)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                              itemActive
                                ? "border-red-500/40 bg-red-500/12 text-red-100"
                                : "border-white/10 bg-black/20 text-zinc-300"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </SheetContent>
                </Sheet>
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
                  <DropdownMenuContent align="end" className="w-52 rounded-xl border-white/10 bg-[#12141a]/95 text-zinc-100 backdrop-blur-xl">
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

          <main className="motion-page-enter px-4 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0b10]/95 px-2 py-1 backdrop-blur-xl sm:hidden">
        <div className="grid grid-cols-5 gap-1">
          {[
            { label: "Home", to: "/overview", icon: SIDEBAR_TOP_ITEMS[0].icon },
            { label: "Plan", to: "/planning", icon: PLANNING_GROUP.icon },
            { label: "Ruby", to: "/ruby-ai", icon: SIDEBAR_BOTTOM_ITEMS.find((item) => item.to === "/ruby-ai")?.icon ?? Sparkles },
            { label: "Insights", to: "/ai-insights", icon: SIDEBAR_BOTTOM_ITEMS.find((item) => item.to === "/ai-insights")?.icon ?? FolderKanban },
            { label: "More", to: "/settings", icon: PanelLeftClose },
          ].map((item) => {
            const active = isActivePath(location.pathname, item.to) || (item.to === "/planning" && isPlanningActive);
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => goTo(item.to)}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px]",
                  active ? "bg-red-500/12 text-red-100" : "text-zinc-400"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

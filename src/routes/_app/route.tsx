import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CalendarX2,
  Ellipsis,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  RotateCcw,
  ScrollText,
  Sun,
  Users,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { can, useStore } from "@/lib/store";
import { ToothLogo } from "@/components/ToothLogo";
import { Avatar } from "@/components/kit";
import { LiveDate, LiveTime } from "@/components/LiveClock";

export const Route = createFileRoute("/_app")({ component: Shell });

function Shell() {
  const s = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!s.user) nav({ to: "/" });
  }, [s.user, nav]);
  useEffect(() => setMoreOpen(false), [loc.pathname]);

  if (!s.user) return null;
  const user = s.user;

  const locale = s.lang === "ar" ? "ar-JO" : "en-GB";

  const primary = [
    { to: "/dashboard", label: s.t("dashboard"), icon: LayoutDashboard, match: "/dashboard" },
    { to: "/today", label: s.t("todayAppts"), icon: CalendarClock, match: "/today" },
    { to: "/appointments", label: s.t("appointments"), icon: CalendarDays, match: "/appointments" },
    { to: "/patients", label: s.t("patients"), icon: Users, match: "/patients" },
  ] as const;

  const secondary = [
    { to: "/cancelled", label: s.t("cancelledAppts"), icon: CalendarX2 },
    ...(can.manageUsers(user.role)
      ? [
          { to: "/users", label: s.t("users"), icon: UserCog },
          { to: "/logs", label: s.t("activityLogs"), icon: ScrollText },
        ]
      : []),
  ] as const;

  const moreActive =
    secondary.some((l) => loc.pathname === l.to || loc.pathname.startsWith(`${l.to}/`)) ||
    moreOpen;

  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="mb-8 flex items-center gap-3 px-1">
        <ToothLogo className="h-10 w-10" />
        <div className="min-w-0">
          <div className="truncate text-base font-bold">{s.t("appName")}</div>
          <div className="truncate text-xs text-muted-foreground">{s.t("tagline")}</div>
        </div>
      </div>

      <p className="mb-2 px-3 text-[11px] font-semibold text-muted-foreground">
        {s.lang === "ar" ? "التنقل" : "Navigate"}
      </p>
      <nav className="space-y-1">
        {[...primary, ...secondary].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            preload="intent"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground",
            }}
            activeOptions={{ exact: false }}
          >
            <l.icon className="h-[18px] w-[18px]" />
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t pt-4">
        {can.manageUsers(user.role) && (
          <button
            type="button"
            onClick={() => {
              if (!confirm(s.t("resetDemoConfirm"))) return;
              s.resetDemo();
              toast.success(s.t("resetDone"));
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {s.t("resetDemo")}
          </button>
        )}
        <div className="rounded-xl bg-muted/70 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{s.t(user.role)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              s.logout();
              nav({ to: "/", replace: true });
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border bg-card py-2 text-sm font-medium hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4" />
            {s.t("logout")}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-e bg-card p-4 md:flex">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b bg-card/95 safe-pt backdrop-blur supports-[backdrop-filter]:bg-card/85">
          <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 md:h-auto md:px-6 md:py-3">
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <ToothLogo className="h-8 w-8 shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold leading-tight">{s.t("appName")}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  <LiveDate locale={locale} />
                </div>
              </div>
            </div>
            <div className="hidden sm:block md:block">
              <span className="hidden md:inline">
                <LiveDate locale={locale} />
              </span>
            </div>
            <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
              <LiveTime />
              <button
                type="button"
                onClick={() => s.setLang(s.lang === "ar" ? "en" : "ar")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background hover:bg-muted sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
                aria-label={s.t("lang")}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-semibold">{s.t("lang")}</span>
              </button>
              <button
                type="button"
                onClick={s.toggleDark}
                className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background hover:bg-muted sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                aria-label={s.t("theme")}
              >
                {s.dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        <main className="app-main flex-1 px-3 py-4 sm:px-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 safe-pb backdrop-blur supports-[backdrop-filter]:bg-card/90 md:hidden"
        aria-label={s.t("menu")}
      >
        <div className="grid grid-cols-5 gap-0.5 px-1 pt-1.5 pb-1">
          {primary.map((l) => {
            const active =
              loc.pathname === l.match || loc.pathname.startsWith(`${l.match}/`);
            return (
              <Link
                key={l.to}
                to={l.to}
                preload="intent"
                className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground active:bg-muted"
                }`}
              >
                <l.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} strokeWidth={active ? 2.4 : 2} />
                <span className="max-w-full truncate">{l.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold transition ${
              moreActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground active:bg-muted"
            }`}
          >
            <Ellipsis className={`h-5 w-5 ${moreActive ? "text-primary" : ""}`} strokeWidth={moreActive ? 2.4 : 2} />
            <span>{s.t("more")}</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 animate-rise rounded-t-3xl border bg-card shadow-soft safe-pb">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/25" />
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <h2 className="text-base font-bold">{s.t("more")}</h2>
              <div className="flex items-center gap-2">
                <Avatar name={user.name} size="h-9 w-9" />
                <div className="min-w-0 text-end">
                  <div className="truncate text-sm font-semibold">{user.name}</div>
                  <div className="text-[11px] text-muted-foreground">{s.t(user.role)}</div>
                </div>
              </div>
            </div>
            <div className="space-y-1 px-3 pb-3">
              {secondary.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  preload="intent"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-semibold hover:bg-muted active:bg-muted"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-2xl bg-accent px-3 py-3.5 text-sm font-semibold text-accent-foreground",
                  }}
                >
                  <l.icon className="h-5 w-5 text-primary" />
                  {l.label}
                </Link>
              ))}
              {can.manageUsers(user.role) && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(s.t("resetDemoConfirm"))) return;
                    s.resetDemo();
                    toast.success(s.t("resetDone"));
                    setMoreOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  <RotateCcw className="h-5 w-5" />
                  {s.t("resetDemo")}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  s.logout();
                  nav({ to: "/", replace: true });
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                {s.t("logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Users,
  Wallet,
} from "lucide-react";
import { can, useStore, ymd } from "@/lib/store";
import { Avatar, money, StatusBadge } from "@/components/kit";
import type { TKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmileCare" },
      { name: "description", content: "Daily overview of clinic appointments and patients." },
      { property: "og:title", content: "Dashboard — SmileCare" },
      { property: "og:description", content: "Daily clinic overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = useStore();
  const today = ymd(new Date());
  const todays = s.appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = todays.filter(
    (a) =>
      a.status === "scheduled" ||
      a.status === "confirmed" ||
      a.status === "waiting" ||
      a.status === "inProgress",
  ).length;
  const done = todays.filter((a) => a.status === "done").length;
  const todayRev = s.patients
    .flatMap((p) => p.treatments)
    .filter((t) => t.date === today)
    .reduce((n, t) => n + t.cost, 0);
  const totalRev = s.patients.flatMap((p) => p.treatments).reduce((n, t) => n + t.cost, 0);
  const nowHM = new Date().toTimeString().slice(0, 5);
  const sep = s.lang === "ar" ? "، " : ", ";
  const Arrow = s.lang === "ar" ? ArrowLeft : ArrowRight;

  const stats = [
    { label: s.t("todayAppts"), value: String(todays.length), icon: CalendarCheck },
    { label: s.t("completed"), value: String(done), icon: CheckCircle2 },
    { label: s.t("upcoming"), value: String(upcoming), icon: Users },
    { label: s.t("todayRevenue"), value: money(todayRev, s.t("currency")), icon: Wallet },
  ];

  return (
    <div className="animate-rise space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{s.t("today")}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            {s.t("hello")}
            {sep}
            {s.user!.name}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link to="/patients" className="btn btn-ghost min-h-11 justify-center">
            {s.t("patients")}
          </Link>
          <Link
            to="/appointments"
            search={can.manageAppointments(s.user?.role) ? { new: true } : {}}
            className="btn btn-primary min-h-11 justify-center"
          >
            {can.manageAppointments(s.user?.role) ? s.t("addAppt") : s.t("appointments")}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className="card p-3.5 sm:p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:mb-3 sm:h-9 sm:w-9">
              <st.icon className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold tracking-tight sm:text-2xl">{st.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{st.label}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <Clock3 className="h-4 w-4 text-primary" />
              {s.t("schedule")}
            </h2>
            <Link to="/appointments" className="text-sm font-medium text-primary hover:underline">
              {s.t("all")}
            </Link>
          </div>
          <div className="p-3 md:p-4">
            {todays.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">{s.t("noAppts")}</p>
            ) : (
              <div className="space-y-2">
                {todays.map((a) => {
                  const p = s.patients.find((x) => x.id === a.patientId);
                  const isNow = a.status === "inProgress";
                  const isWaiting = a.status === "waiting";
                  const past = a.time < nowHM && !isNow && !isWaiting;
                  return (
                    <Link
                      key={a.id}
                      to="/patients/$id"
                      params={{ id: a.patientId }}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition hover:border-primary/40 ${
                        isNow
                          ? "border-warning/40 bg-warning/5"
                          : isWaiting
                            ? "border-primary/35 bg-primary/5"
                            : past
                              ? "opacity-60"
                              : "bg-card"
                      }`}
                    >
                      <div className="w-14 text-center">
                        <div className="text-sm font-bold tabular-nums" dir="ltr">
                          {a.time}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {a.duration}
                          {s.t("minutes")}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      {p && <Avatar name={p.name} size="h-9 w-9" />}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p?.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {s.t(a.type as TKey)}
                        </div>
                      </div>
                      <StatusBadge s={a.status} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="text-sm text-muted-foreground">{s.t("clinicHours")}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight" dir="ltr">
              09:00 – 17:00
            </div>
            <div className="mt-4 rounded-xl bg-muted px-4 py-3">
              <div className="text-xs text-muted-foreground">{s.t("revenue")}</div>
              <div className="mt-1 text-lg font-bold">{money(totalRev, s.t("currency"))}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {(["waiting", "inProgress", "done"] as const).map((k) => (
                <div key={k} className="rounded-xl border px-2 py-3">
                  <div className="text-lg font-bold">
                    {todays.filter((a) => a.status === k).length}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{s.t(k)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="font-semibold">{s.t("patients")}</h3>
              <Link to="/patients" className="text-xs font-medium text-primary hover:underline">
                {s.t("view")}
              </Link>
            </div>
            <div className="space-y-1">
              {s.patients
                .slice(-5)
                .reverse()
                .map((p) => (
                  <Link
                    key={p.id}
                    to="/patients/$id"
                    params={{ id: p.id }}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted"
                  >
                    <Avatar name={p.name} size="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {p.phone}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

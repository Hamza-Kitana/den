import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { can, useStore, ymd, type Appointment, type ApptStatus } from "@/lib/store";
import { Avatar, PageHeader, StatusSelect } from "@/components/kit";
import type { TKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/today")({
  head: () => ({
    meta: [
      { title: "Today — SmileCare" },
      { name: "description", content: "Today's clinic appointments timeline." },
      { property: "og:title", content: "Today — SmileCare" },
      { property: "og:description", content: "Today's schedule." },
    ],
  }),
  component: TodayPage,
});

function hmNow() {
  return new Date().toTimeString().slice(0, 5);
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function TodayPage() {
  const s = useStore();
  const [now, setNow] = useState(hmNow);
  const today = ymd(new Date());
  const locale = s.lang === "ar" ? "ar-JO" : "en-GB";
  const statusOk = can.editApptStatus(s.user?.role);

  useEffect(() => {
    const id = window.setInterval(() => setNow(hmNow()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const list = useMemo(
    () =>
      s.appointments
        .filter((a) => a.date === today)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [s.appointments, today],
  );

  const active = list.filter((a) => a.status !== "cancelled");
  const inProgress = active.find((a) => a.status === "inProgress");
  const waiting = active.filter((a) => a.status === "waiting");
  const nextUp =
    inProgress ??
    waiting[0] ??
    active.find(
      (a) =>
        (a.status === "scheduled" || a.status === "confirmed") &&
        toMin(a.time) + a.duration >= toMin(now),
    ) ??
    active.find((a) => a.status === "scheduled" || a.status === "confirmed");

  const stats = [
    { label: s.t("todayAppts"), value: list.length },
    { label: s.t("waitingRoom"), value: waiting.length },
    { label: s.t("inProgress"), value: list.filter((a) => a.status === "inProgress").length },
    { label: s.t("done"), value: list.filter((a) => a.status === "done").length },
  ];

  const dateLabel = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const setStatus = (a: Appointment, status: ApptStatus) => {
    if (!statusOk) return;
    s.setAppointments((all) => all.map((x) => (x.id === a.id ? { ...x, status } : x)));
    toast.success(s.t("saved"));
  };

  const nowPatient = inProgress
    ? s.patients.find((p) => p.id === inProgress.patientId)
    : null;
  const nextPatient = nextUp ? s.patients.find((p) => p.id === nextUp.patientId) : null;

  return (
    <div className="animate-rise space-y-5">
      <PageHeader title={s.t("todayAppts")} sub={dateLabel} />

      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className="card p-3.5 sm:p-4">
            <div className="text-[11px] text-muted-foreground sm:text-xs">{st.label}</div>
            <div className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{st.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.6fr]">
        <div className="space-y-4">
          <div
            className={`card overflow-hidden ${
              inProgress
                ? "border-warning/40 ring-1 ring-warning/20"
                : waiting.length
                  ? "border-primary/30 ring-1 ring-primary/10"
                  : "border-primary/20"
            }`}
          >
            <div
              className={`px-5 py-3 text-sm font-semibold ${
                inProgress ? "bg-warning/10 text-warning" : "bg-accent text-accent-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {inProgress
                  ? s.t("nowServing")
                  : nextUp?.status === "waiting"
                    ? s.t("waitingRoom")
                    : s.t("nextUp")}
              </span>
            </div>
            {nextUp && nextPatient ? (
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={nextPatient.name} size="h-14 w-14 text-lg" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/patients/$id"
                      params={{ id: nextPatient.id }}
                      className="text-lg font-bold hover:text-primary"
                    >
                      {nextPatient.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1" dir="ltr">
                        <Phone className="h-3.5 w-3.5" />
                        {nextPatient.phone}
                      </span>
                      <span>·</span>
                      <span>{s.t(nextUp.type as TKey)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-xl bg-foreground px-3 py-1.5 font-mono text-sm font-bold text-background"
                        dir="ltr"
                      >
                        {nextUp.time}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {nextUp.duration} {s.t("minutes")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  <span className="text-xs font-semibold text-muted-foreground">{s.t("clinicFlow")}</span>
                  <StatusSelect
                    value={nextUp.status}
                    disabled={!statusOk}
                    size="md"
                    onChange={(status) => setStatus(nextUp, status)}
                  />
                </div>
              </div>
            ) : (
              <p className="p-10 text-center text-sm text-muted-foreground">{s.t("noApptsToday")}</p>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              {s.t("now")}
            </div>
            <div className="mt-2 font-mono text-3xl font-bold tabular-nums" dir="ltr">
              {now}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{s.t("clinicHours")}: 09:00 – 17:00</div>
            {nowPatient && (
              <p className="mt-4 rounded-xl bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
                {s.t("nowServing")}: {nowPatient.name}
              </p>
            )}
            {waiting.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="text-xs font-semibold text-muted-foreground">{s.t("waitingRoom")}</div>
                {waiting.map((a) => {
                  const p = s.patients.find((x) => x.id === a.patientId);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium">{p?.name ?? "—"}</span>
                      <StatusSelect
                        value={a.status}
                        disabled={!statusOk}
                        onChange={(status) => setStatus(a, status)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">{s.t("todayTimeline")}</h2>
            <Link to="/appointments" className="text-sm font-medium text-primary hover:underline">
              {s.t("all")}
            </Link>
          </div>

          {list.length === 0 ? (
            <p className="p-14 text-center text-sm text-muted-foreground">{s.t("noApptsToday")}</p>
          ) : (
            <div className="relative p-4 md:p-5">
              <div className="absolute start-[2.15rem] top-6 bottom-6 w-px bg-border md:start-[2.4rem]" />
              <div className="space-y-3">
                {list.map((a) => {
                  const p = s.patients.find((x) => x.id === a.patientId);
                  const isNow = a.status === "inProgress";
                  const isWaiting = a.status === "waiting";
                  const past =
                    a.status === "done" ||
                    a.status === "cancelled" ||
                    (toMin(a.time) + a.duration < toMin(now) && !isNow && !isWaiting);
                  return (
                    <div
                      key={a.id}
                      className={`relative flex gap-3 rounded-2xl border p-3 transition md:gap-4 md:p-4 ${
                        isNow
                          ? "border-warning/50 bg-warning/5 shadow-soft"
                          : isWaiting
                            ? "border-primary/35 bg-primary/5"
                            : past
                              ? "border-transparent bg-muted/40 opacity-70"
                              : "bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="relative z-10 flex w-[4.25rem] shrink-0 flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card text-[11px] font-bold tabular-nums ${
                            isNow
                              ? "border-warning text-warning"
                              : isWaiting
                                ? "border-primary text-primary"
                                : past
                                  ? "border-border text-muted-foreground"
                                  : "border-primary text-primary"
                          }`}
                          dir="ltr"
                        >
                          {a.time.slice(0, 5)}
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {a.duration}
                          {s.t("minutes")}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-3">
                            {p && <Avatar name={p.name} />}
                            <div className="min-w-0">
                              {p ? (
                                <Link
                                  to="/patients/$id"
                                  params={{ id: p.id }}
                                  className="truncate font-semibold hover:text-primary"
                                >
                                  {p.name}
                                </Link>
                              ) : (
                                <span className="font-semibold">—</span>
                              )}
                              <div className="text-sm text-muted-foreground">
                                {s.t(a.type as TKey)}
                                {a.notes ? ` · ${a.notes}` : ""}
                              </div>
                            </div>
                          </div>
                          <StatusSelect
                            value={a.status}
                            disabled={!statusOk}
                            onChange={(status) => setStatus(a, status)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { can, useStore } from "@/lib/store";
import { Avatar, PageHeader, StatusBadge } from "@/components/kit";
import type { TKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/cancelled")({
  head: () => ({
    meta: [
      { title: "Cancelled appointments — SmileCare" },
      { name: "description", content: "Cancelled clinic appointments." },
      { property: "og:title", content: "Cancelled appointments — SmileCare" },
      { property: "og:description", content: "Cancelled appointments list." },
    ],
  }),
  component: CancelledAppointments,
});

function CancelledAppointments() {
  const s = useStore();
  const manage = can.manageAppointments(s.user?.role);
  const statusOk = can.editApptStatus(s.user?.role);
  const locale = s.lang === "ar" ? "ar-JO" : "en-GB";

  const list = s.appointments
    .filter((a) => a.status === "cancelled")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title={s.t("cancelledAppts")}
        sub={`${list.length} ${s.t("cancelled")}`}
      />

      <div className="card overflow-hidden">
        {list.length === 0 ? (
          <p className="p-14 text-center text-sm text-muted-foreground">{s.t("noCancelled")}</p>
        ) : (
          <div className="divide-y">
            {list.map((a) => {
              const p = s.patients.find((x) => x.id === a.patientId);
              const when = new Date(`${a.date}T12:00:00`).toLocaleDateString(locale, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 hover:bg-muted/40 md:gap-4"
                >
                  <div className="w-[4.5rem] rounded-xl bg-destructive/10 px-2 py-2 text-center text-destructive">
                    <div className="text-sm font-bold tabular-nums" dir="ltr">
                      {a.time}
                    </div>
                    <div className="text-[10px] opacity-70">
                      {a.duration} {s.t("minutes")}
                    </div>
                  </div>
                  {p && <Avatar name={p.name} />}
                  <div className="min-w-0 flex-1">
                    {p ? (
                      <Link
                        to="/patients/$id"
                        params={{ id: p.id }}
                        className="font-semibold hover:text-primary"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">—</span>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <span dir="ltr">{when}</span>
                      {" · "}
                      {s.t(a.type as TKey)}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </div>
                  </div>
                  <StatusBadge s={a.status} />
                  <div className="flex gap-1">
                    {statusOk && (
                      <button
                        type="button"
                        title={s.t("restoreAppt")}
                        onClick={() => {
                          s.setAppointments((all) =>
                            all.map((x) =>
                              x.id === a.id ? { ...x, status: "scheduled" } : x,
                            ),
                          );
                          toast.success(s.t("saved"));
                        }}
                        className="rounded-lg p-2 hover:bg-accent"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    {manage && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(s.t("confirmDelete"))) return;
                          s.setAppointments((all) => all.filter((x) => x.id !== a.id));
                          toast.success(s.t("deleted"));
                        }}
                        className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

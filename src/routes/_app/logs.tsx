import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eraser, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { can, useStore, type ActivityLog } from "@/lib/store";
import type { LogAction, LogEntity } from "@/lib/activity";
import { PageHeader } from "@/components/kit";
import type { TKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/logs")({
  head: () => ({
    meta: [
      { title: "Activity log — SmileCare" },
      { name: "description", content: "Full clinic activity audit log." },
      { property: "og:title", content: "Activity log — SmileCare" },
      { property: "og:description", content: "Admin activity log." },
    ],
  }),
  component: LogsPage,
});

const ENTITIES: Array<LogEntity | "all"> = [
  "all",
  "auth",
  "patient",
  "appointment",
  "user",
  "system",
  "settings",
];

const actionTone: Record<LogAction, string> = {
  create: "bg-success/10 text-success",
  update: "bg-info/10 text-info",
  delete: "bg-destructive/10 text-destructive",
  login: "bg-primary/10 text-primary",
  logout: "bg-muted text-muted-foreground",
  login_fail: "bg-destructive/10 text-destructive",
  reset: "bg-warning/15 text-warning",
  settings: "bg-muted text-foreground",
};

function LogsPage() {
  const s = useStore();
  const [entity, setEntity] = useState<LogEntity | "all">("all");
  const [q, setQ] = useState("");
  const allowed = can.manageUsers(s.user?.role);

  const locale = s.lang === "ar" ? "ar-JO" : "en-GB";
  const logs = useMemo(() => {
    const list = [...(s.logs ?? [])].reverse();
    return list.filter((l) => {
      if (entity !== "all" && l.entity !== entity) return false;
      if (!q.trim()) return true;
      const hay = `${l.userName} ${l.summary} ${l.action} ${l.entity}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [s.logs, entity, q]);

  if (!allowed) return <Navigate to="/dashboard" />;

  const entityLabel = (e: LogEntity | "all") =>
    e === "all" ? s.t("filterAll") : s.t(`entity_${e}` as TKey);
  const actionLabel = (a: LogAction) => s.t(`action_${a}` as TKey);

  const formatWhen = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title={s.t("activityLogs")}
        sub={s.t("activityLogsSub")}
        action={
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (!confirm(s.t("clearLogsConfirm"))) return;
              s.clearLogs();
              toast.success(s.t("deleted"));
            }}
          >
            <Eraser className="h-4 w-4" />
            {s.t("clearLogs")}
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field max-w-sm flex-1"
          placeholder={s.t("search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {ENTITIES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEntity(e)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                entity === e
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {entityLabel(e)}
            </button>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-14 text-center text-muted-foreground">
          <ScrollText className="h-8 w-8 opacity-50" />
          <p>{s.t("noLogs")}</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-start">{s.t("logTime")}</th>
                <th className="p-3 text-start">{s.t("logActor")}</th>
                <th className="p-3 text-start">{s.t("logAction")}</th>
                <th className="p-3 text-start">{s.t("logEntity")}</th>
                <th className="p-3 text-start">{s.t("logDetail")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((l: ActivityLog) => (
                <tr key={l.id} className="hover:bg-muted/40">
                  <td className="whitespace-nowrap p-3 text-xs text-muted-foreground" dir="ltr">
                    {formatWhen(l.at)}
                  </td>
                  <td className="p-3 font-medium">{l.userName}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${actionTone[l.action]}`}
                    >
                      {actionLabel(l.action)}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{entityLabel(l.entity)}</td>
                  <td className="p-3">{l.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

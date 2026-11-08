import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  appointmentsOverlap,
  can,
  uid,
  useStore,
  ymd,
  type Appointment,
  type ApptStatus,
} from "@/lib/store";
import { APPT_STATUSES, Avatar, Field, Modal, PageHeader, StatusSelect } from "@/components/kit";
import { PROCEDURES, type TKey } from "@/lib/i18n";

const searchSchema = z.object({
  new: z.boolean().optional().catch(undefined),
  patientId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_app/appointments")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Appointments — SmileCare" },
      { name: "description", content: "Manage daily clinic appointments." },
      { property: "og:title", content: "Appointments — SmileCare" },
      { property: "og:description", content: "Daily appointment schedule." },
    ],
  }),
  component: Appointments,
});

function Appointments() {
  const s = useStore();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [date, setDate] = useState(ymd(new Date()));
  const [filter, setFilter] = useState<ApptStatus | "all">("all");
  const [edit, setEdit] = useState<Appointment | null>(null);
  const [conflict, setConflict] = useState(false);
  const locale = s.lang === "ar" ? "ar-JO" : "en-GB";
  const manage = can.manageAppointments(s.user?.role);
  const statusOk = can.editApptStatus(s.user?.role);
  const today = ymd(new Date());

  useEffect(() => {
    if (!search.new || !manage) return;
    setEdit({
      id: "",
      patientId: search.patientId ?? s.patients[0]?.id ?? "",
      date,
      time: "10:00",
      duration: 30,
      type: "checkup",
      status: "scheduled",
      notes: "",
    });
    void navigate({ search: {}, replace: true });
  }, [search.new, search.patientId, manage, date, s.patients, navigate]);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date);
    d.setDate(d.getDate() - 3 + i);
    return d;
  });
  const move = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(ymd(d));
  };
  const list = s.appointments
    .filter((a) => a.date === date && (filter === "all" || a.status === filter))
    .sort((a, b) => a.time.localeCompare(b.time));

  const blank = (): Appointment => ({
    id: "",
    patientId: s.patients[0]?.id ?? "",
    date,
    time: "10:00",
    duration: 30,
    type: "checkup",
    status: "scheduled",
    notes: "",
  });

  const save = () => {
    if (!edit || !manage) return;
    if (!edit.patientId) {
      toast.error(s.t("noPatientsYet"));
      return;
    }
    if (s.appointments.some((a) => appointmentsOverlap(edit, a))) {
      setConflict(true);
      toast.error(s.t("conflictWarn"));
      return;
    }
    s.setAppointments((all) =>
      edit.id ? all.map((a) => (a.id === edit.id ? edit : a)) : [...all, { ...edit, id: uid() }],
    );
    toast.success(s.t("saved"));
    setEdit(null);
    setConflict(false);
  };

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title={s.t("appointments")}
        sub={new Date(date + "T12:00:00").toLocaleDateString(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        action={
          manage ? (
            <button
              type="button"
              onClick={() => {
                if (!s.patients.length) {
                  toast.error(s.t("noPatientsYet"));
                  return;
                }
                setEdit(blank());
                setConflict(false);
              }}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
              {s.t("addAppt")}
            </button>
          ) : undefined
        }
      />

      <div className="card p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            className="rounded-lg border bg-background p-2 hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
          <div className="grid flex-1 grid-cols-7 gap-1.5">
            {week.map((d) => {
              const k = ymd(d);
              const active = k === date;
              const isToday = k === today;
              const count = s.appointments.filter(
                (a) => a.date === k && a.status !== "cancelled",
              ).length;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDate(k)}
                  className={`min-h-14 rounded-xl px-0.5 py-2 text-center transition active:scale-[0.97] sm:px-1 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                  }`}
                >
                  <div
                    className={`text-[9px] font-medium sm:text-[10px] ${active ? "opacity-80" : "text-muted-foreground"}`}
                  >
                    {d.toLocaleDateString(locale, { weekday: "short" })}
                  </div>
                  <div className="mt-0.5 text-sm font-bold sm:text-base">{d.getDate()}</div>
                  <div
                    className={`mx-auto mt-1 h-1 w-1 rounded-full ${count ? (active ? "bg-primary-foreground" : "bg-primary") : "bg-transparent"}`}
                  />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => move(1)}
            className="rounded-lg border bg-background p-2 hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="mt-4 space-y-3 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field min-w-0 flex-1 sm:w-auto sm:flex-none"
            />
            <button type="button" onClick={() => setDate(today)} className="btn btn-ghost shrink-0">
              {s.t("today")}
            </button>
          </div>
          <div className="scroll-x-touch -mx-1 flex gap-1.5 px-1 pb-0.5">
            {(["all", ...APPT_STATUSES] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  filter === f
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.t(f)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {list.length === 0 ? (
          <p className="p-14 text-center text-sm text-muted-foreground">{s.t("noAppts")}</p>
        ) : (
          <div className="divide-y">
            {list.map((a) => {
              const p = s.patients.find((x) => x.id === a.patientId);
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 hover:bg-muted/40 md:gap-4"
                >
                  <div className="w-[4.25rem] rounded-xl bg-accent px-2 py-2 text-center text-accent-foreground">
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
                      {s.t(a.type as TKey)}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </div>
                  </div>
                  <StatusSelect
                    value={a.status}
                    disabled={!statusOk}
                    onChange={(status) =>
                      s.setAppointments((all) =>
                        all.map((x) => (x.id === a.id ? { ...x, status } : x)),
                      )
                    }
                  />
                  {manage && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEdit(a);
                          setConflict(false);
                        }}
                        className="rounded-lg p-2 hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? s.t("edit") : s.t("addAppt")}
      >
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            {!s.patients.length && (
              <p className="text-sm text-destructive sm:col-span-2">{s.t("noPatientsYet")}</p>
            )}
            {conflict && (
              <p className="text-sm font-medium text-destructive sm:col-span-2">
                {s.t("conflictWarn")}
              </p>
            )}
            <Field label={s.t("patient")} full>
              <select
                className="field"
                value={edit.patientId}
                onChange={(e) => {
                  setEdit({ ...edit, patientId: e.target.value });
                  setConflict(false);
                }}
              >
                {s.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.phone}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={s.t("date")}>
              <input
                type="date"
                className="field"
                value={edit.date}
                onChange={(e) => {
                  setEdit({ ...edit, date: e.target.value });
                  setConflict(false);
                }}
              />
            </Field>
            <Field label={s.t("time")}>
              <input
                type="time"
                className="field"
                value={edit.time}
                onChange={(e) => {
                  setEdit({ ...edit, time: e.target.value });
                  setConflict(false);
                }}
              />
            </Field>
            <Field label={s.t("type")}>
              <select
                className="field"
                value={edit.type}
                onChange={(e) => setEdit({ ...edit, type: e.target.value })}
              >
                {PROCEDURES.map((t) => (
                  <option key={t} value={t}>
                    {s.t(t)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={s.t("duration")}>
              <input
                type="number"
                min={10}
                step={5}
                className="field"
                value={edit.duration}
                onChange={(e) => {
                  setEdit({ ...edit, duration: +e.target.value });
                  setConflict(false);
                }}
              />
            </Field>
            <Field label={s.t("status")} full>
              <StatusSelect
                value={edit.status}
                size="md"
                onChange={(status) => setEdit({ ...edit, status })}
              />
            </Field>
            <Field label={s.t("notes")} full>
              <textarea
                rows={3}
                className="field"
                value={edit.notes}
                onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setEdit(null)} className="btn btn-ghost">
                {s.t("cancel")}
              </button>
              <button
                type="button"
                onClick={save}
                className="btn btn-primary"
                disabled={!edit.patientId}
              >
                {s.t("save")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

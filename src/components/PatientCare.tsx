import { useMemo, useState } from "react";
import { CheckSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  uid,
  useStore,
  ymd,
  type ClinicSession,
  type Patient,
  type PatientProcedure,
} from "@/lib/store";
import { Field, Modal, money } from "@/components/kit";

export function PatientCare({ patient }: { patient: Patient }) {
  const s = useStore();
  const [procEdit, setProcEdit] = useState<PatientProcedure | null>(null);
  const [sessionEdit, setSessionEdit] = useState<ClinicSession | null>(null);
  const [sessionView, setSessionView] = useState<ClinicSession | null>(null);
  const canEdit = !!s.user;

  const procedures = patient.procedures ?? [];
  const sessions = useMemo(
    () =>
      [...(patient.sessions ?? [])].sort((a, b) =>
        (b.date + b.time).localeCompare(a.date + a.time),
      ),
    [patient.sessions],
  );

  const doneIds = useMemo(() => {
    const set = new Set<string>();
    for (const sess of patient.sessions ?? []) {
      for (const id of sess.procedureIds ?? []) set.add(id);
    }
    return set;
  }, [patient.sessions]);

  const doneCount = procedures.filter((p) => doneIds.has(p.id)).length;

  const sessionCharge = (sess: ClinicSession) => {
    if (sess.cost > 0) return sess.cost;
    return procedures
      .filter((pr) => sess.procedureIds.includes(pr.id))
      .reduce((n, pr) => n + (pr.cost || 0), 0);
  };

  const totalCost =
    (patient.sessions ?? []).reduce((n, sess) => n + sessionCharge(sess), 0) +
    procedures
      .filter((p) => !doneIds.has(p.id))
      .reduce((n, p) => n + (p.cost || 0), 0);
  const totalPaid = (patient.sessions ?? []).reduce((n, sess) => n + (sess.paid || 0), 0);
  const totalDue = Math.max(0, totalCost - totalPaid);

  const blankProc = (): PatientProcedure => ({
    id: "",
    title: "",
    tooth: "",
    cost: 0,
    notes: "",
    createdAt: ymd(new Date()),
  });

  const blankSession = (): ClinicSession => ({
    id: "",
    date: ymd(new Date()),
    time: new Date().toTimeString().slice(0, 5),
    duration: 30,
    doctor: s.users.find((u) => u.role === "doctor")?.name ?? s.user?.name ?? "",
    notes: "",
    cost: 0,
    paid: 0,
    procedureIds: [],
  });

  const saveProc = () => {
    if (!procEdit || !procEdit.title.trim()) return;
    const next: PatientProcedure = {
      ...procEdit,
      id: procEdit.id || uid(),
      title: procEdit.title.trim(),
      tooth: procEdit.tooth.trim(),
      notes: procEdit.notes.trim(),
      cost: Math.max(0, Number(procEdit.cost) || 0), // 0 = not set
      createdAt: procEdit.createdAt || ymd(new Date()),
    };
    s.setPatients((all) =>
      all.map((x) => {
        if (x.id !== patient.id) return x;
        const list = x.procedures ?? [];
        return {
          ...x,
          procedures: procEdit.id
            ? list.map((p) => (p.id === procEdit.id ? next : p))
            : [...list, next],
        };
      }),
    );
    toast.success(s.t("saved"));
    setProcEdit(null);
  };

  const saveSession = () => {
    if (!sessionEdit || !sessionEdit.date) return;
    const next: ClinicSession = {
      ...sessionEdit,
      id: sessionEdit.id || uid(),
      doctor: sessionEdit.doctor.trim(),
      notes: sessionEdit.notes.trim(),
      duration: Math.max(0, Number(sessionEdit.duration) || 0),
      cost: Math.max(0, Number(sessionEdit.cost) || 0),
      paid: Math.max(0, Number(sessionEdit.paid) || 0),
      procedureIds: [...(sessionEdit.procedureIds ?? [])],
    };
    s.setPatients((all) =>
      all.map((x) => {
        if (x.id !== patient.id) return x;
        const list = x.sessions ?? [];
        return {
          ...x,
          sessions: sessionEdit.id
            ? list.map((sess) => (sess.id === sessionEdit.id ? next : sess))
            : [...list, next],
        };
      }),
    );
    toast.success(s.t("saved"));
    setSessionEdit(null);
  };

  const toggleProcInSession = (procId: string) => {
    if (!sessionEdit) return;
    const has = sessionEdit.procedureIds.includes(procId);
    setSessionEdit({
      ...sessionEdit,
      procedureIds: has
        ? sessionEdit.procedureIds.filter((id) => id !== procId)
        : [...sessionEdit.procedureIds, procId],
    });
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-muted-foreground">{s.t("patientProcedures")}</div>
          <div className="mt-1 text-xl font-bold">{procedures.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground">{s.t("proceduresDone")}</div>
          <div className="mt-1 text-xl font-bold text-success">
            {doneCount}/{procedures.length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground">{s.t("totalPaid")}</div>
          <div className="mt-1 text-xl font-bold">{money(totalPaid, s.t("currency"))}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted-foreground">{s.t("totalDue")}</div>
          <div
            className={`mt-1 text-xl font-bold ${totalDue > 0 ? "text-destructive" : "text-success"}`}
          >
            {money(totalDue, s.t("currency"))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{s.t("patientProcedures")}</h2>
            <p className="text-sm text-muted-foreground">{s.t("noProcedures").split("—")[0]}</p>
          </div>
          {canEdit && (
            <button type="button" onClick={() => setProcEdit(blankProc())} className="btn btn-primary">
              <Plus className="h-4 w-4" />
              {s.t("addProcedure")}
            </button>
          )}
        </div>

        {procedures.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {s.t("noProcedures")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">#</th>
                  <th className="p-3 text-start">{s.t("procedureTitle")}</th>
                  <th className="p-3 text-start">{s.t("tooth")}</th>
                  <th className="p-3 text-end">{s.t("cost")}</th>
                  <th className="p-3 text-start">{s.t("status")}</th>
                  {canEdit && <th className="p-3 text-end">{s.t("actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {procedures.map((pr, i) => {
                  const done = doneIds.has(pr.id);
                  return (
                    <tr key={pr.id} className={done ? "bg-success/5" : undefined}>
                      <td className="p-3 text-muted-foreground">{i + 1}</td>
                      <td className="p-3 font-medium">
                        <div>{pr.title}</div>
                        {pr.notes && (
                          <div className="text-xs text-muted-foreground">{pr.notes}</div>
                        )}
                      </td>
                      <td className="p-3" dir="ltr">
                        {pr.tooth || s.t("generalProcedure")}
                      </td>
                      <td className="p-3 text-end">{money(pr.cost, s.t("currency"))}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                            done
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {done ? s.t("proceduresDone") : s.t("proceduresPending")}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setProcEdit(pr)}
                              className="rounded-lg p-2 hover:bg-muted"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm(s.t("confirmDelete"))) return;
                                s.setPatients((all) =>
                                  all.map((x) =>
                                    x.id === patient.id
                                      ? {
                                          ...x,
                                          procedures: (x.procedures ?? []).filter(
                                            (z) => z.id !== pr.id,
                                          ),
                                          sessions: (x.sessions ?? []).map((sess) => ({
                                            ...sess,
                                            procedureIds: sess.procedureIds.filter(
                                              (id) => id !== pr.id,
                                            ),
                                          })),
                                        }
                                      : x,
                                  ),
                                );
                                toast.success(s.t("deleted"));
                              }}
                              className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <CheckSquare className="h-4 w-4 text-primary" />
              {s.t("patientSessions")}
            </h2>
            <p className="text-sm text-muted-foreground">{s.t("selectSessionProcs")}</p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setSessionEdit(blankSession())}
              className="btn btn-primary"
              disabled={!procedures.length}
            >
              <Plus className="h-4 w-4" />
              {s.t("addSession")}
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {s.t("noSessions")}
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess, idx) => {
              const doneProcs = procedures.filter((pr) => sess.procedureIds.includes(pr.id));
              const sessionCost = sessionCharge(sess);
              return (
                <div
                  key={sess.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSessionView(sess)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSessionView(sess);
                    }
                  }}
                  className="cursor-pointer rounded-xl border bg-background p-4 transition hover:border-primary/40 hover:bg-muted/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        {s.t("patientSessions")} #{sessions.length - idx}
                      </div>
                      <div className="mt-1 font-mono text-sm font-bold" dir="ltr">
                        {sess.date} · {sess.time}
                        {sess.duration ? ` · ${sess.duration} ${s.t("minutes")}` : ""}
                      </div>
                      {sess.doctor && (
                        <div className="mt-1 text-sm text-muted-foreground">{sess.doctor}</div>
                      )}
                      <div className="mt-2 text-xs font-medium text-primary">{s.t("openSession")}</div>
                    </div>
                    <div className="text-end text-sm">
                      <div>
                        {s.t("sessionProcedures")}:{" "}
                        <span className="font-semibold">{doneProcs.length}</span>
                      </div>
                      <div>
                        {s.t("cost")}:{" "}
                        <span className="font-semibold">
                          {money(sessionCost, s.t("currency"))}
                        </span>
                      </div>
                      <div>
                        {s.t("paid")}:{" "}
                        <span className="font-semibold text-success">
                          {money(sess.paid, s.t("currency"))}
                        </span>
                      </div>
                      {canEdit && (
                        <div className="mt-2 flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionEdit(sess);
                            }}
                            className="rounded-lg p-2 hover:bg-muted"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!confirm(s.t("confirmDelete"))) return;
                              s.setPatients((all) =>
                                all.map((x) =>
                                  x.id === patient.id
                                    ? {
                                        ...x,
                                        sessions: (x.sessions ?? []).filter(
                                          (z) => z.id !== sess.id,
                                        ),
                                      }
                                    : x,
                                ),
                              );
                              toast.success(s.t("deleted"));
                            }}
                            className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {doneProcs.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {doneProcs.slice(0, 4).map((pr) => (
                        <li
                          key={pr.id}
                          className="rounded-lg bg-success/10 px-2.5 py-1 text-xs font-medium"
                        >
                          {pr.title}
                          {pr.tooth ? ` (#${pr.tooth})` : ""}
                        </li>
                      ))}
                      {doneProcs.length > 4 && (
                        <li className="rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          +{doneProcs.length - 4}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={!!sessionView}
        onClose={() => setSessionView(null)}
        title={s.t("sessionDetails")}
        size="xl"
      >
        {sessionView &&
          (() => {
            const doneProcs = procedures.filter((pr) =>
              sessionView.procedureIds.includes(pr.id),
            );
            const sessionCost = sessionCharge(sessionView);
            const due = Math.max(0, sessionCost - (sessionView.paid || 0));
            return (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-muted/60 p-3">
                    <div className="text-[11px] text-muted-foreground">{s.t("date")}</div>
                    <div className="mt-1 font-mono font-semibold" dir="ltr">
                      {sessionView.date}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-3">
                    <div className="text-[11px] text-muted-foreground">{s.t("time")}</div>
                    <div className="mt-1 font-mono font-semibold" dir="ltr">
                      {sessionView.time}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-3">
                    <div className="text-[11px] text-muted-foreground">{s.t("visitDuration")}</div>
                    <div className="mt-1 font-semibold">
                      {sessionView.duration} {s.t("minutes")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-3">
                    <div className="text-[11px] text-muted-foreground">{s.t("visitDoctor")}</div>
                    <div className="mt-1 font-semibold">
                      {sessionView.doctor || s.t("none")}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border p-3">
                    <div className="text-[11px] text-muted-foreground">{s.t("cost")}</div>
                    <div className="mt-1 text-lg font-bold">
                      {money(sessionCost, s.t("currency"))}
                    </div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-[11px] text-muted-foreground">{s.t("paid")}</div>
                    <div className="mt-1 text-lg font-bold text-success">
                      {money(sessionView.paid, s.t("currency"))}
                    </div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-[11px] text-muted-foreground">{s.t("balanceDue")}</div>
                    <div
                      className={`mt-1 text-lg font-bold ${due > 0 ? "text-destructive" : "text-success"}`}
                    >
                      {money(due, s.t("currency"))}
                    </div>
                  </div>
                </div>

                {sessionView.notes && (
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="text-xs font-semibold text-muted-foreground">
                      {s.t("notes")}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                      {sessionView.notes}
                    </p>
                  </div>
                )}

                <div>
                  <div className="mb-3 text-sm font-semibold">
                    {s.t("sessionProcedures")} ({doneProcs.length})
                  </div>
                  {doneProcs.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {s.t("noProcedures")}
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full min-w-[480px] text-sm">
                        <thead className="bg-muted text-xs text-muted-foreground">
                          <tr>
                            <th className="p-3 text-start">#</th>
                            <th className="p-3 text-start">{s.t("procedureTitle")}</th>
                            <th className="p-3 text-start">{s.t("tooth")}</th>
                            <th className="p-3 text-end">{s.t("cost")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {doneProcs.map((pr, i) => (
                            <tr key={pr.id}>
                              <td className="p-3 text-muted-foreground">{i + 1}</td>
                              <td className="p-3">
                                <div className="font-medium">{pr.title}</div>
                                {pr.notes && (
                                  <div className="text-xs text-muted-foreground">{pr.notes}</div>
                                )}
                              </td>
                              <td className="p-3" dir="ltr">
                                {pr.tooth || s.t("generalProcedure")}
                              </td>
                              <td className="p-3 text-end font-semibold">
                                {money(pr.cost, s.t("currency"))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setSessionView(null)}
                    className="btn btn-ghost"
                  >
                    {s.t("cancel")}
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setSessionEdit(sessionView);
                        setSessionView(null);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      {s.t("edit")}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
      </Modal>

      <Modal
        open={!!procEdit}
        onClose={() => setProcEdit(null)}
        title={procEdit?.id ? s.t("editProcedure") : s.t("addProcedure")}
        size="lg"
      >
        {procEdit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={s.t("procedureTitle")} full>
              <input
                className="field"
                value={procEdit.title}
                onChange={(e) => setProcEdit({ ...procEdit, title: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label={s.t("toothOptional")}>
              <input
                className="field"
                dir="ltr"
                placeholder="16"
                value={procEdit.tooth}
                onChange={(e) => setProcEdit({ ...procEdit, tooth: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{s.t("toothOptionalHint")}</p>
            </Field>
            <Field label={s.t("costOptional")}>
              <input
                className="field"
                type="number"
                min={0}
                placeholder="—"
                value={procEdit.cost || ""}
                onChange={(e) =>
                  setProcEdit({
                    ...procEdit,
                    cost: e.target.value === "" ? 0 : Math.max(0, +e.target.value || 0),
                  })
                }
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{s.t("costOptionalHint")}</p>
            </Field>
            <Field label={s.t("notes")} full>
              <textarea
                className="field resize-none"
                rows={2}
                value={procEdit.notes}
                onChange={(e) => setProcEdit({ ...procEdit, notes: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setProcEdit(null)} className="btn btn-ghost">
                {s.t("cancel")}
              </button>
              <button
                type="button"
                onClick={saveProc}
                disabled={!procEdit.title.trim()}
                className="btn btn-primary"
              >
                {s.t("save")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!sessionEdit}
        onClose={() => setSessionEdit(null)}
        title={sessionEdit?.id ? s.t("editSession") : s.t("addSession")}
        size="xl"
      >
        {sessionEdit && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={s.t("date")}>
                <input
                  className="field"
                  type="date"
                  value={sessionEdit.date}
                  onChange={(e) => setSessionEdit({ ...sessionEdit, date: e.target.value })}
                />
              </Field>
              <Field label={s.t("time")}>
                <input
                  className="field"
                  type="time"
                  value={sessionEdit.time}
                  onChange={(e) => setSessionEdit({ ...sessionEdit, time: e.target.value })}
                />
              </Field>
              <Field label={s.t("visitDuration")}>
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={sessionEdit.duration}
                  onChange={(e) =>
                    setSessionEdit({ ...sessionEdit, duration: +e.target.value || 0 })
                  }
                />
              </Field>
              <Field label={s.t("visitDoctor")}>
                <input
                  className="field"
                  value={sessionEdit.doctor}
                  onChange={(e) => setSessionEdit({ ...sessionEdit, doctor: e.target.value })}
                />
              </Field>
            </div>

            <Field label={s.t("notes")}>
              <textarea
                className="field resize-none"
                rows={2}
                value={sessionEdit.notes}
                onChange={(e) => setSessionEdit({ ...sessionEdit, notes: e.target.value })}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={s.t("costOptional")}>
                <input
                  className="field"
                  type="number"
                  min={0}
                  placeholder="—"
                  value={sessionEdit.cost || ""}
                  onChange={(e) =>
                    setSessionEdit({
                      ...sessionEdit,
                      cost: e.target.value === "" ? 0 : Math.max(0, +e.target.value || 0),
                    })
                  }
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{s.t("sessionCostHint")}</p>
              </Field>
              <Field label={s.t("paidOptional")}>
                <input
                  className="field"
                  type="number"
                  min={0}
                  placeholder="—"
                  value={sessionEdit.paid || ""}
                  onChange={(e) =>
                    setSessionEdit({
                      ...sessionEdit,
                      paid: e.target.value === "" ? 0 : Math.max(0, +e.target.value || 0),
                    })
                  }
                />
              </Field>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">{s.t("selectSessionProcs")}</div>
              {procedures.length === 0 ? (
                <p className="text-sm text-muted-foreground">{s.t("noProcedures")}</p>
              ) : (
                <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border p-2">
                  {procedures.map((pr) => {
                    const checked = sessionEdit.procedureIds.includes(pr.id);
                    const inOther = (patient.sessions ?? []).some(
                      (sess) =>
                        sess.id !== sessionEdit.id && sess.procedureIds.includes(pr.id),
                    );
                    return (
                      <label
                        key={pr.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted/70 ${
                          checked ? "bg-accent/60" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--color-primary)]"
                          checked={checked}
                          onChange={() => toggleProcInSession(pr.id)}
                        />
                        <span className="min-w-0 flex-1 text-sm font-medium">{pr.title}</span>
                        {pr.tooth && (
                          <span className="text-xs text-muted-foreground" dir="ltr">
                            #{pr.tooth}
                          </span>
                        )}
                        {pr.cost > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {money(pr.cost, s.t("currency"))}
                          </span>
                        )}
                        {inOther && !checked && (
                          <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                            {s.t("proceduresDone")}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {s.t("sessionProcedures")}: {sessionEdit.procedureIds.length}
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button type="button" onClick={() => setSessionEdit(null)} className="btn btn-ghost">
                {s.t("cancel")}
              </button>
              <button type="button" onClick={saveSession} className="btn btn-primary min-w-28">
                {s.t("save")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

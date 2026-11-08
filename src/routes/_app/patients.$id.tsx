import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ImagePlus,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ageOf,
  can,
  fileToPhotoDataUrl,
  uid,
  useStore,
  ymd,
  type PatientPhoto,
  type Treatment,
} from "@/lib/store";
import { Avatar, Field, Modal, money, StatusBadge } from "@/components/kit";
import { PatientForm } from "@/components/PatientForm";
import { PatientCare } from "@/components/PatientCare";
import { ToothChart } from "@/components/ToothChart";
import { PROCEDURES, type ProcedureKey, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/_app/patients/$id")({
  head: () => ({
    meta: [
      { title: "Patient file — SmileCare" },
      { name: "description", content: "Full patient record with dental chart." },
      { property: "og:title", content: "Patient file — SmileCare" },
      { property: "og:description", content: "Patient record and dental chart." },
    ],
  }),
  component: PatientPage,
});

function PatientPage() {
  const { id } = Route.useParams();
  const s = useStore();
  const nav = useNavigate();
  const p = s.patients.find((x) => x.id === id);
  const [tab, setTab] = useState<"info" | "chart" | "treatments" | "visits" | "photos">("info");
  const [editing, setEditing] = useState(false);
  const [trEdit, setTrEdit] = useState<Treatment | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PatientPhoto | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const blankTr = (): Treatment => ({
    id: "",
    procedure: "cleaning",
    tooth: undefined,
    cost: 0,
    paid: 0,
    date: ymd(new Date()),
  });

  if (!p) {
    return (
      <div className="card p-12 text-center">
        {s.t("patientNotFound")} —{" "}
        <Link to="/patients" className="text-primary">
          {s.t("back")}
        </Link>
      </div>
    );
  }

  const appts = s.appointments
    .filter((a) => a.patientId === p.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const photos = [...(p.photos ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const trCost = p.treatments.reduce((n, t) => n + (t.cost || 0), 0);
  const trPaid = p.treatments.reduce((n, t) => n + (t.paid || 0), 0);

  const tabs = [
    ["info", s.t("info")],
    ["visits", s.t("visits")],
    ["photos", s.t("photos")],
    ["chart", s.t("chart")],
    ["treatments", s.t("treatments")],
  ] as const;
  const med = can.editMedical(s.user?.role);
  const canPhotos = !!s.user;

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || !canPhotos) return;
    setUploading(true);
    try {
      const added: PatientPhoto[] = [];
      for (const file of Array.from(files)) {
        try {
          const dataUrl = await fileToPhotoDataUrl(file);
          added.push({
            id: uid(),
            dataUrl,
            caption: photoCaption.trim(),
            createdAt: ymd(new Date()),
          });
        } catch {
          toast.error(s.t("photoInvalid"));
        }
      }
      if (!added.length) return;
      try {
        s.setPatients((a) =>
          a.map((x) => (x.id === p.id ? { ...x, photos: [...(x.photos ?? []), ...added] } : x)),
        );
        setPhotoCaption("");
        toast.success(s.t("saved"));
      } catch {
        toast.error(s.t("photoTooLarge"));
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveTreatment = () => {
    if (!trEdit || !med || !trEdit.procedure) return;
    const nextTr: Treatment = {
      ...trEdit,
      id: trEdit.id || uid(),
      cost: Math.max(0, Number(trEdit.cost) || 0),
      paid: Math.max(0, Number(trEdit.paid) || 0),
    };
    s.setPatients((a) =>
      a.map((x) => {
        if (x.id !== p.id) return x;
        const next = trEdit.id
          ? x.treatments.map((t) => (t.id === trEdit.id ? nextTr : t))
          : [...x.treatments, nextTr];
        return { ...x, treatments: next };
      }),
    );
    toast.success(s.t("saved"));
    setTrEdit(null);
  };

  const procedureLabel = (proc: string) =>
    PROCEDURES.includes(proc as ProcedureKey) ? s.t(proc as TKey) : proc;

  const personal = [
    [s.t("age"), `${ageOf(p.dob)}`],
    [s.t("dob"), p.dob],
    [s.t("gender"), s.t(p.gender)],
    [s.t("blood"), p.blood],
    [s.t("phone"), p.phone],
    [s.t("email"), p.email || s.t("none")],
    [s.t("address"), p.address || s.t("none")],
  ];

  return (
    <div className="animate-rise">
      <Link
        to="/patients"
        className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-primary sm:mb-4"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {s.t("back")}
      </Link>

      <div className="card mb-5 overflow-hidden sm:mb-6">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 sm:p-5 md:p-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <Avatar name={p.name} size="h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{p.name}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1" dir="ltr">
                  <Phone className="h-4 w-4 shrink-0" />
                  {p.phone}
                </span>
                {p.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-4 w-4 shrink-0" />
                    {p.email}
                  </span>
                )}
                {p.address && (
                  <span className="hidden items-center gap-1 sm:flex">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {p.address}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:ms-auto sm:flex sm:flex-wrap">
            {can.manageAppointments(s.user?.role) && (
              <Link
                to="/appointments"
                search={{ new: true, patientId: p.id }}
                className="btn btn-primary col-span-2 justify-center sm:col-span-1"
              >
                <Plus className="h-4 w-4" />
                {s.t("bookVisit")}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn btn-ghost justify-center"
            >
              <Pencil className="h-4 w-4" />
              {s.t("edit")}
            </button>
            {can.deletePatient(s.user?.role) && (
              <button
                type="button"
                onClick={() => {
                  if (!confirm(s.t("confirmDelete"))) return;
                  s.setPatients((a) => a.filter((x) => x.id !== p.id));
                  s.setAppointments((a) => a.filter((x) => x.patientId !== p.id));
                  toast.success(s.t("deleted"));
                  nav({ to: "/patients" });
                }}
                className="btn btn-ghost justify-center text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {p.allergies && (
          <div className="flex items-center gap-2 border-t bg-destructive/10 px-6 py-3 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {s.t("allergyAlert")}: {p.allergies}
          </div>
        )}
      </div>

      <div className="scroll-x-touch mb-5 flex gap-1 rounded-xl border bg-card p-1 sm:mb-6">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-semibold transition sm:flex-1 sm:px-4 ${tab === k ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="space-y-5">
          <section className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">{s.t("personalInfo")}</h2>
              <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost">
                <Pencil className="h-4 w-4" />
                {s.t("edit")}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {personal.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-muted/70 p-3">
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div
                    className="mt-1 break-words font-semibold"
                    dir={k === s.t("phone") ? "ltr" : undefined}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              [s.t("history"), p.history],
              [s.t("allergies"), p.allergies],
              [s.t("notes"), p.notes],
            ].map(([k, v]) => (
              <div key={k} className="card p-5">
                <div className="text-xs font-semibold text-muted-foreground">{k}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {v || s.t("none")}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === "visits" && (
        <div className="space-y-5">
          <PatientCare patient={p} />
          <section className="card divide-y">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <h2 className="font-semibold">{s.t("scheduledAppts")}</h2>
              {can.manageAppointments(s.user?.role) && (
                <Link
                  to="/appointments"
                  search={{ new: true, patientId: p.id }}
                  className="btn btn-ghost"
                >
                  <Plus className="h-4 w-4" />
                  {s.t("bookVisit")}
                </Link>
              )}
            </div>
            {appts.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">{s.t("noAppts")}</p>
            )}
            {appts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <div className="font-mono text-sm font-bold" dir="ltr">
                  {a.date} · {a.time}
                </div>
                <div className="flex-1 text-sm">{s.t(a.type as TKey)}</div>
                <StatusBadge s={a.status} />
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === "photos" && (
        <div className="card p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">{s.t("photos")}</h2>
              <p className="text-sm text-muted-foreground">
                {photos.length} · {s.t("addPhoto")}
              </p>
            </div>
            {canPhotos && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="field w-44 sm:w-56"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder={s.t("photoCaption")}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void addPhotos(e.target.files)}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="btn btn-primary"
                >
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? "…" : s.t("addPhoto")}
                </button>
              </div>
            )}
          </div>

          {photos.length === 0 ? (
            <p className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              {s.t("noPhotos")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((ph) => (
                <div key={ph.id} className="group overflow-hidden rounded-xl border bg-background">
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => setPreview(ph)}
                    aria-label={s.t("viewPhoto")}
                  >
                    <img
                      src={ph.dataUrl}
                      alt={ph.caption || s.t("photos")}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </button>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {ph.caption || s.t("photos")}
                      </div>
                      <div className="text-[11px] text-muted-foreground" dir="ltr">
                        {ph.createdAt}
                      </div>
                    </div>
                    {canPhotos && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(s.t("confirmDelete"))) return;
                          s.setPatients((a) =>
                            a.map((x) =>
                              x.id === p.id
                                ? { ...x, photos: (x.photos ?? []).filter((z) => z.id !== ph.id) }
                                : x,
                            ),
                          );
                          toast.success(s.t("deleted"));
                        }}
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "chart" && <ToothChart p={p} />}

      {tab === "treatments" && (
        <div className="card overflow-hidden">
          {med && (
            <div className="flex justify-end border-b p-4">
              <button
                type="button"
                onClick={() => setTrEdit(blankTr())}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                {s.t("addTreatment")}
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">{s.t("date")}</th>
                  <th className="p-3 text-start">{s.t("procedure")}</th>
                  <th className="p-3 text-start">{s.t("tooth")}</th>
                  <th className="p-3 text-end">{s.t("cost")}</th>
                  <th className="p-3 text-end">{s.t("paid")}</th>
                  <th className="p-3 text-end">{s.t("balanceDue")}</th>
                  {med && <th className="p-3 text-end">{s.t("actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...p.treatments]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((t) => {
                    const due = Math.max(0, (t.cost || 0) - (t.paid || 0));
                    return (
                      <tr key={t.id}>
                        <td className="p-3" dir="ltr">
                          {t.date}
                        </td>
                        <td className="p-3 font-medium">{procedureLabel(t.procedure)}</td>
                        <td className="p-3">{t.tooth ?? "—"}</td>
                        <td className="p-3 text-end font-semibold">
                          {money(t.cost, s.t("currency"))}
                        </td>
                        <td className="p-3 text-end text-success">
                          {money(t.paid || 0, s.t("currency"))}
                        </td>
                        <td
                          className={`p-3 text-end font-semibold ${due > 0 ? "text-destructive" : "text-success"}`}
                        >
                          {money(due, s.t("currency"))}
                        </td>
                        {med && (
                          <td className="p-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setTrEdit({ ...t, paid: t.paid ?? 0 })}
                                className="rounded-lg p-2 hover:bg-accent"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!confirm(s.t("confirmDelete"))) return;
                                  s.setPatients((a) =>
                                    a.map((x) =>
                                      x.id === p.id
                                        ? {
                                            ...x,
                                            treatments: x.treatments.filter((tr) => tr.id !== t.id),
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
              <tfoot>
                <tr className="bg-accent font-bold text-accent-foreground">
                  <td className="p-3" colSpan={3}>
                    {s.t("total")}
                  </td>
                  <td className="p-3 text-end">{money(trCost, s.t("currency"))}</td>
                  <td className="p-3 text-end">{money(trPaid, s.t("currency"))}</td>
                  <td className="p-3 text-end">
                    {money(Math.max(0, trCost - trPaid), s.t("currency"))}
                  </td>
                  {med && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute end-3 top-3 z-10 rounded-lg bg-card/90 p-2 hover:bg-muted"
              aria-label={s.t("cancel")}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={preview.dataUrl}
              alt={preview.caption || s.t("photos")}
              className="max-h-[75vh] w-full object-contain bg-muted"
            />
            <div className="border-t p-4">
              <div className="font-semibold">{preview.caption || s.t("photos")}</div>
              <div className="text-xs text-muted-foreground" dir="ltr">
                {preview.createdAt}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title={s.t("edit")} size="xl">
        <PatientForm
          initial={p}
          onCancel={() => setEditing(false)}
          onSave={(info) => {
            s.setPatients((a) =>
              a.map((x) =>
                x.id === p.id
                  ? {
                      ...x,
                      ...info,
                      blood: can.editMedical(s.user?.role) ? info.blood : x.blood,
                      allergies: can.editMedical(s.user?.role) ? info.allergies : x.allergies,
                      history: can.editMedical(s.user?.role) ? info.history : x.history,
                    }
                  : x,
              ),
            );
            setEditing(false);
            toast.success(s.t("saved"));
          }}
        />
      </Modal>

      <Modal
        open={!!trEdit}
        onClose={() => setTrEdit(null)}
        title={trEdit?.id ? s.t("editTreatment") : s.t("addTreatment")}
      >
        {trEdit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={s.t("procedure")} full>
              <select
                className="field"
                value={trEdit.procedure}
                onChange={(e) => setTrEdit({ ...trEdit, procedure: e.target.value })}
              >
                {PROCEDURES.map((proc) => (
                  <option key={proc} value={proc}>
                    {s.t(proc)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={s.t("tooth")}>
              <input
                className="field"
                type="number"
                min={11}
                max={48}
                value={trEdit.tooth ?? ""}
                onChange={(e) =>
                  setTrEdit({ ...trEdit, tooth: e.target.value ? +e.target.value : undefined })
                }
              />
            </Field>
            <Field label={s.t("costOptional")}>
              <input
                className="field"
                type="number"
                min={0}
                placeholder="—"
                value={trEdit.cost || ""}
                onChange={(e) =>
                  setTrEdit({
                    ...trEdit,
                    cost: e.target.value === "" ? 0 : Math.max(0, +e.target.value || 0),
                  })
                }
              />
            </Field>
            <Field label={s.t("paidOptional")}>
              <input
                className="field"
                type="number"
                min={0}
                placeholder="—"
                value={trEdit.paid || ""}
                onChange={(e) =>
                  setTrEdit({
                    ...trEdit,
                    paid: e.target.value === "" ? 0 : Math.max(0, +e.target.value || 0),
                  })
                }
              />
            </Field>
            <Field label={s.t("date")} full>
              <input
                className="field"
                type="date"
                value={trEdit.date}
                onChange={(e) => setTrEdit({ ...trEdit, date: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setTrEdit(null)} className="btn btn-ghost">
                {s.t("cancel")}
              </button>
              <button type="button" onClick={saveTreatment} className="btn btn-primary">
                {s.t("save")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

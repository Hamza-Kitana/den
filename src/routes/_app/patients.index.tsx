import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, LayoutGrid, Plus, Search, Table2 } from "lucide-react";
import { toast } from "sonner";
import { ageOf, uid, useStore, ymd, type Patient, type PatientInfo } from "@/lib/store";
import { Avatar, Modal, PageHeader } from "@/components/kit";
import { PatientForm } from "@/components/PatientForm";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/_app/patients/")({
  head: () => ({
    meta: [
      { title: "Patients — SmileCare" },
      { name: "description", content: "Patient records of the dental clinic." },
      { property: "og:title", content: "Patients — SmileCare" },
      { property: "og:description", content: "Patient records." },
    ],
  }),
  component: Patients,
});

type ViewMode = "cards" | "table";
const VIEW_KEY = "smilecare-patients-view-v2";

function Patients() {
  const s = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewMode>("table");
  const list = s.patients.filter(
    (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q),
  );
  const today = ymd(new Date());
  const effectiveView: ViewMode = isMobile ? "cards" : view;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "cards" || saved === "table") setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const changeView = (mode: ViewMode) => {
    setView(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const blank: PatientInfo = {
    name: "",
    phone: "",
    email: "",
    gender: "male",
    dob: "1990-01-01",
    blood: "O+",
    address: "",
    allergies: "",
    history: "",
    notes: "",
  };

  const meta = (p: Patient) => {
    const next = s.appointments
      .filter(
        (a) =>
          a.patientId === p.id &&
          a.date >= today &&
          a.status !== "cancelled" &&
          a.status !== "done",
      )
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    const last = s.appointments
      .filter((a) => a.patientId === p.id && (a.status === "done" || a.date < today))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
    const issues = Object.values(p.teeth ?? {}).filter((t) => t.status !== "healthy").length;
    return { next, last, issues };
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title={s.t("patients")}
        sub={`${s.patients.length} ${s.t("totalPatients")}`}
        action={
          <button type="button" onClick={() => setAdding(true)} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            {s.t("addPatient")}
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 sm:mb-6">
        <div className="relative min-w-0 flex-1 sm:min-w-[14rem] sm:max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="field ps-10"
            placeholder={s.t("search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            inputMode="search"
          />
        </div>
        <div className="hidden rounded-xl border bg-card p-1 md:inline-flex">
          <button
            type="button"
            onClick={() => changeView("table")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              view === "table"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table2 className="h-4 w-4" />
            {s.t("viewTable")}
          </button>
          <button
            type="button"
            onClick={() => changeView("cards")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              view === "cards"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            {s.t("viewCards")}
          </button>
        </div>
      </div>

      {list.length === 0 && (
        <p className="card p-12 text-center text-muted-foreground">{s.t("noPatients")}</p>
      )}

      {list.length > 0 && effectiveView === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const { next, last, issues } = meta(p);
            return (
              <Link
                key={p.id}
                to="/patients/$id"
                params={{ id: p.id }}
                className="card group p-5 transition hover:border-primary/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold group-hover:text-primary">{p.name}</div>
                    <div className="text-sm text-muted-foreground" dir="ltr">
                      {p.phone}
                    </div>
                  </div>
                  {p.allergies && (
                    <span
                      title={s.t("allergyAlert")}
                      className="rounded-full bg-destructive/10 p-1.5 text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted p-2">
                    <div className="font-bold">{ageOf(p.dob)}</div>
                    <div className="text-muted-foreground">{s.t("age")}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="font-bold">{p.blood}</div>
                    <div className="text-muted-foreground">{s.t("blood")}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="font-bold">{issues}</div>
                    <div className="text-muted-foreground">{s.t("chart")}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div>
                    {s.t("nextVisit")}:{" "}
                    <span className="font-semibold text-foreground" dir="ltr">
                      {next ? `${next.date} ${next.time}` : s.t("none")}
                    </span>
                  </div>
                  <div>
                    {s.t("lastVisit")}:{" "}
                    <span className="font-semibold text-foreground" dir="ltr">
                      {last ? last.date : s.t("none")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {list.length > 0 && effectiveView === "table" && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-start">{s.t("name")}</th>
                <th className="p-3 text-start">{s.t("phone")}</th>
                <th className="p-3 text-start">{s.t("age")}</th>
                <th className="p-3 text-start">{s.t("blood")}</th>
                <th className="p-3 text-start">{s.t("nextVisit")}</th>
                <th className="p-3 text-start">{s.t("lastVisit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((p) => {
                const { next, last } = meta(p);
                return (
                  <tr
                    key={p.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => nav({ to: "/patients/$id", params: { id: p.id } })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        nav({ to: "/patients/$id", params: { id: p.id } });
                      }
                    }}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} size="h-9 w-9 text-xs" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <span className="truncate">{p.name}</span>
                            {p.allergies && (
                              <span title={s.t("allergyAlert")}>
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3" dir="ltr">
                      {p.phone}
                    </td>
                    <td className="p-3">{ageOf(p.dob)}</td>
                    <td className="p-3">{p.blood}</td>
                    <td className="p-3" dir="ltr">
                      {next ? `${next.date} ${next.time}` : s.t("none")}
                    </td>
                    <td className="p-3" dir="ltr">
                      {last ? last.date : s.t("none")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title={s.t("addPatient")}
        size="xl"
      >
        <PatientForm
          initial={blank}
          onCancel={() => setAdding(false)}
          onSave={(info) => {
            const id = uid();
            s.setPatients((all) => [
              ...all,
              {
                ...info,
                id,
                createdAt: today,
                teeth: {},
                treatments: [],
                sections: [],
                procedures: [],
                sessions: [],
                photos: [],
              },
            ]);
            setAdding(false);
            toast.success(s.t("saved"));
            nav({ to: "/patients/$id", params: { id } });
          }}
        />
      </Modal>
    </div>
  );
}

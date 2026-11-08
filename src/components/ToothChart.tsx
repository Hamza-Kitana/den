import { memo, useCallback, useId, useMemo, useState } from "react";
import { Check, CheckSquare, Lock, Plus, Smile } from "lucide-react";
import { toast } from "sonner";
import {
  can,
  uid as newId,
  useStore,
  ymd,
  type ClinicSession,
  type Patient,
  type PatientProcedure,
  type ToothStatus,
} from "@/lib/store";
import { Field, Modal, money } from "@/components/kit";

function toothMatches(field: string, n: number) {
  return field
    .split(/[,/|\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .includes(String(n));
}

export const STATUS: { k: ToothStatus; fill: string; accent: string }[] = [
  { k: "healthy", fill: "#f7f1e6", accent: "#b7a78f" },
  { k: "cavity", fill: "#f3e2d8", accent: "#b84a32" },
  { k: "filled", fill: "#e8eef6", accent: "#4d78b8" },
  { k: "crown", fill: "#f3e9c8", accent: "#c29a22" },
  { k: "rootCanal", fill: "#ece4f4", accent: "#8d56d6" },
  { k: "implant", fill: "#e3f1e8", accent: "#2f9e6c" },
  { k: "missing", fill: "#eef1f4", accent: "#9aa3ad" },
];

type Kind = "central" | "lateral" | "canine" | "premolar" | "molar";

function kindOf(n: number): Kind {
  const d = n % 10;
  if (d === 1) return "central";
  if (d === 2) return "lateral";
  if (d === 3) return "canine";
  if (d <= 5) return "premolar";
  return "molar";
}

function dims(kind: Kind) {
  switch (kind) {
    case "molar":
      return { w: 46, h: 62 };
    case "premolar":
      return { w: 34, h: 58 };
    case "canine":
      return { w: 30, h: 66 };
    case "lateral":
      return { w: 26, h: 56 };
    default:
      return { w: 30, h: 58 };
  }
}

const ToothGlyph = memo(function ToothGlyph({
  n,
  status,
  active,
  hasNote,
  uid,
}: {
  n: number;
  status?: ToothStatus;
  active: boolean;
  hasNote: boolean;
  uid: string;
}) {
  const kind = kindOf(n);
  const { w, h } = dims(kind);
  const st = STATUS.find((x) => x.k === (status ?? "healthy"))!;
  const missing = status === "missing";
  const enamelId = `enamel-${uid}-${n}`;
  const rootId = `root-${uid}-${n}`;
  const glossId = `gloss-${uid}-${n}`;
  const cx = w / 2;
  const crownBottom = h * 0.58;

  const crown =
    kind === "molar"
      ? `M${w * 0.08} ${h * 0.2}
         C${w * 0.08} ${h * 0.08} ${w * 0.2} ${h * 0.03} ${w * 0.3} ${h * 0.08}
         C${w * 0.38} ${h * 0.02} ${w * 0.48} ${h * 0.02} ${w * 0.5} ${h * 0.07}
         C${w * 0.52} ${h * 0.02} ${w * 0.62} ${h * 0.02} ${w * 0.7} ${h * 0.08}
         C${w * 0.8} ${h * 0.03} ${w * 0.92} ${h * 0.08} ${w * 0.92} ${h * 0.2}
         C${w * 0.96} ${h * 0.34} ${w * 0.93} ${h * 0.48} ${w * 0.84} ${h * 0.54}
         C${w * 0.7} ${h * 0.6} ${w * 0.3} ${h * 0.6} ${w * 0.16} ${h * 0.54}
         C${w * 0.07} ${h * 0.48} ${w * 0.04} ${h * 0.34} ${w * 0.08} ${h * 0.2}Z`
      : kind === "premolar"
        ? `M${w * 0.14} ${h * 0.2}
           C${w * 0.14} ${h * 0.08} ${w * 0.28} ${h * 0.03} ${w * 0.4} ${h * 0.08}
           C${w * 0.5} ${h * 0.02} ${w * 0.62} ${h * 0.02} ${w * 0.72} ${h * 0.09}
           C${w * 0.84} ${h * 0.04} ${w * 0.9} ${h * 0.12} ${w * 0.88} ${h * 0.22}
           C${w * 0.92} ${h * 0.36} ${w * 0.86} ${h * 0.5} ${w * 0.74} ${h * 0.55}
           C${w * 0.58} ${h * 0.61} ${w * 0.36} ${h * 0.61} ${w * 0.22} ${h * 0.54}
           C${w * 0.12} ${h * 0.48} ${w * 0.1} ${h * 0.34} ${w * 0.14} ${h * 0.2}Z`
        : kind === "canine"
          ? `M${cx} ${h * 0.02}
             C${w * 0.68} ${h * 0.1} ${w * 0.84} ${h * 0.24} ${w * 0.82} ${h * 0.4}
             C${w * 0.8} ${h * 0.52} ${w * 0.66} ${h * 0.58} ${cx} ${h * 0.58}
             C${w * 0.34} ${h * 0.58} ${w * 0.2} ${h * 0.52} ${w * 0.18} ${h * 0.4}
             C${w * 0.16} ${h * 0.24} ${w * 0.32} ${h * 0.1} ${cx} ${h * 0.02}Z`
          : kind === "lateral"
            ? `M${w * 0.18} ${h * 0.12}
               C${w * 0.26} ${h * 0.04} ${w * 0.74} ${h * 0.04} ${w * 0.82} ${h * 0.12}
               C${w * 0.9} ${h * 0.26} ${w * 0.86} ${h * 0.46} ${w * 0.76} ${h * 0.54}
               C${w * 0.64} ${h * 0.6} ${w * 0.36} ${h * 0.6} ${w * 0.24} ${h * 0.54}
               C${w * 0.14} ${h * 0.46} ${w * 0.1} ${h * 0.26} ${w * 0.18} ${h * 0.12}Z`
            : `M${w * 0.14} ${h * 0.12}
               C${w * 0.22} ${h * 0.03} ${w * 0.78} ${h * 0.03} ${w * 0.86} ${h * 0.12}
               C${w * 0.94} ${h * 0.28} ${w * 0.9} ${h * 0.48} ${w * 0.78} ${h * 0.56}
               C${w * 0.64} ${h * 0.62} ${w * 0.36} ${h * 0.62} ${w * 0.22} ${h * 0.56}
               C${w * 0.1} ${h * 0.48} ${w * 0.06} ${h * 0.28} ${w * 0.14} ${h * 0.12}Z`;

  return (
    <g opacity={missing ? 0.35 : 1}>
      <defs>
        <linearGradient id={enamelId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="28%" stopColor={st.fill} />
          <stop offset="100%" stopColor="#e6d8c4" />
        </linearGradient>
        <linearGradient id={rootId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d3b0" />
          <stop offset="100%" stopColor="#c9a978" />
        </linearGradient>
        <linearGradient id={glossId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`shadow-${uid}-${n}`} x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodColor="#6b5a45" floodOpacity="0.22" />
        </filter>
      </defs>

      {!missing && kind === "molar" && (
        <>
          <path
            d={`M${w * 0.26} ${crownBottom}
                C${w * 0.18} ${h * 0.72} ${w * 0.16} ${h * 0.88} ${w * 0.28} ${h}
                C${w * 0.34} ${h * 0.9} ${w * 0.36} ${h * 0.74} ${w * 0.34} ${crownBottom}Z`}
            fill={`url(#${rootId})`}
          />
          <path
            d={`M${w * 0.66} ${crownBottom}
                C${w * 0.64} ${h * 0.74} ${w * 0.66} ${h * 0.9} ${w * 0.72} ${h}
                C${w * 0.84} ${h * 0.88} ${w * 0.82} ${h * 0.72} ${w * 0.74} ${crownBottom}Z`}
            fill={`url(#${rootId})`}
          />
          <path
            d={`M${cx - 2} ${crownBottom}
                C${cx - 4} ${h * 0.72} ${cx - 3} ${h * 0.86} ${cx} ${h * 0.94}
                C${cx + 3} ${h * 0.86} ${cx + 4} ${h * 0.72} ${cx + 2} ${crownBottom}Z`}
            fill={`url(#${rootId})`}
            opacity="0.85"
          />
        </>
      )}
      {!missing && kind === "premolar" && (
        <>
          <path
            d={`M${w * 0.34} ${crownBottom}
                C${w * 0.26} ${h * 0.74} ${w * 0.24} ${h * 0.9} ${w * 0.34} ${h}
                C${w * 0.42} ${h * 0.9} ${w * 0.44} ${h * 0.74} ${w * 0.42} ${crownBottom}Z`}
            fill={`url(#${rootId})`}
          />
          <path
            d={`M${w * 0.58} ${crownBottom}
                C${w * 0.56} ${h * 0.74} ${w * 0.58} ${h * 0.9} ${w * 0.66} ${h}
                C${w * 0.76} ${h * 0.9} ${w * 0.74} ${h * 0.74} ${w * 0.66} ${crownBottom}Z`}
            fill={`url(#${rootId})`}
          />
        </>
      )}
      {!missing && kind !== "molar" && kind !== "premolar" && (
        <path
          d={`M${cx - w * 0.08} ${crownBottom}
              C${cx - w * 0.16} ${h * 0.74} ${cx - w * 0.14} ${h * 0.9} ${cx} ${h}
              C${cx + w * 0.14} ${h * 0.9} ${cx + w * 0.16} ${h * 0.74} ${cx + w * 0.08} ${crownBottom}Z`}
          fill={`url(#${rootId})`}
        />
      )}

      {!missing && (
        <path
          d={crown}
          fill={`url(#${enamelId})`}
          stroke={active ? "var(--color-primary)" : st.accent}
          strokeWidth={active ? 2.2 : 1.05}
          filter={`url(#shadow-${uid}-${n})`}
        />
      )}
      {!missing && <path d={crown} fill={`url(#${glossId})`} />}

      {!missing && (kind === "molar" || kind === "premolar") && (
        <>
          <path
            d={`M${w * 0.28} ${h * 0.22} Q${cx} ${h * 0.3} ${w * 0.72} ${h * 0.22}`}
            fill="none"
            stroke="#cbb79a"
            strokeWidth="1"
            opacity="0.55"
          />
          <path
            d={`M${cx} ${h * 0.16} Q${cx} ${h * 0.34} ${cx} ${h * 0.46}`}
            fill="none"
            stroke="#cbb79a"
            strokeWidth="1"
            opacity="0.45"
          />
        </>
      )}

      {status === "cavity" && (
        <ellipse cx={w * 0.62} cy={h * 0.3} rx={w * 0.11} ry={h * 0.07} fill="#6d2418" />
      )}
      {status === "filled" && (
        <ellipse cx={w * 0.54} cy={h * 0.3} rx={w * 0.16} ry={h * 0.07} fill="#7f97b8" opacity="0.9" />
      )}
      {status === "crown" && (
        <path
          d={`M${w * 0.16} ${h * 0.16} H${w * 0.84}
              Q${w * 0.9} ${h * 0.32} ${w * 0.76} ${h * 0.38}
              H${w * 0.24}
              Q${w * 0.1} ${h * 0.32} ${w * 0.16} ${h * 0.16}Z`}
          fill="#d4af37"
          opacity="0.45"
        />
      )}
      {status === "rootCanal" && (
        <circle cx={cx} cy={h * 0.32} r={w * 0.1} fill="#8d56d6" opacity="0.85" />
      )}
      {status === "implant" && (
        <g>
          <rect
            x={cx - w * 0.07}
            y={h * 0.5}
            width={w * 0.14}
            height={h * 0.34}
            rx="1.5"
            fill="#8a939e"
          />
          <path
            d={`M${cx - w * 0.09} ${h * 0.56} H${cx + w * 0.09}
                M${cx - w * 0.09} ${h * 0.64} H${cx + w * 0.09}
                M${cx - w * 0.09} ${h * 0.72} H${cx + w * 0.09}`}
            stroke="#5f6872"
            strokeWidth="1"
          />
        </g>
      )}
      {missing && (
        <g>
          <ellipse
            cx={cx}
            cy={h * 0.34}
            rx={w * 0.28}
            ry={h * 0.16}
            fill="none"
            stroke={st.accent}
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <path
            d={`M${w * 0.28} ${h * 0.22} L${w * 0.72} ${h * 0.46}
                M${w * 0.72} ${h * 0.22} L${w * 0.28} ${h * 0.46}`}
            stroke={st.accent}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      )}
      {hasNote && (
        <circle
          cx={w - 3}
          cy={7}
          r={4.2}
          fill="var(--color-primary)"
          stroke="#fff"
          strokeWidth="1.5"
        />
      )}
    </g>
  );
});

const Arch = memo(function Arch({
  teeth,
  upper,
  statuses,
  notes,
  sel,
  onPick,
  uid,
}: {
  teeth: number[];
  upper: boolean;
  statuses: Record<number, ToothStatus | undefined>;
  notes: Record<number, boolean>;
  sel: number | null;
  onPick: (n: number) => void;
  uid: string;
}) {
  const W = 860;
  const H = 210;
  const gumId = `gum-${uid}-${upper ? "u" : "l"}`;
  const pad = 48;
  const span = W - pad * 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto w-full max-w-4xl"
      style={{ contain: "layout paint" }}
    >
      <defs>
        <linearGradient id={gumId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={upper ? "#f3c4be" : "#ebb5af"} />
          <stop offset="100%" stopColor={upper ? "#d98c86" : "#cf7f79"} />
        </linearGradient>
      </defs>

      <path
        d={
          upper
            ? `M${pad - 8} ${H - 46}
               C${W * 0.22} ${H - 92} ${W * 0.78} ${H - 92} ${W - pad + 8} ${H - 46}
               C${W * 0.78} ${H - 28} ${W * 0.22} ${H - 28} ${pad - 8} ${H - 46}Z`
            : `M${pad - 8} 46
               C${W * 0.22} 92 ${W * 0.78} 92 ${W - pad + 8} 46
               C${W * 0.78} 28 ${W * 0.22} 28 ${pad - 8} 46Z`
        }
        fill={`url(#${gumId})`}
        opacity="0.55"
      />

      {teeth.map((n, i) => {
        const kind = kindOf(n);
        const { w, h } = dims(kind);
        const t = teeth.length === 1 ? 0.5 : i / (teeth.length - 1);
        const archLift = Math.sin(t * Math.PI) * 34;
        const x = pad + t * span;
        const y = upper ? H - 52 - archLift : 52 + archLift;
        const tilt = (t - 0.5) * (upper ? 14 : -14);
        const active = sel === n;
        const labelY = upper ? y - h * 0.48 - 8 : y + h * 0.48 + 12;
        const flip = upper ? 180 : 0;

        return (
          <g key={n} className="cursor-pointer" onClick={() => onPick(n)}>
            <g transform={`translate(${x} ${y}) rotate(${tilt + flip})`}>
              <g transform={`translate(${-w / 2} ${-h / 2}) scale(${active ? 1.05 : 1})`}>
                <ToothGlyph
                  n={n}
                  {...(statuses[n] ? { status: statuses[n] } : {})}
                  active={active}
                  hasNote={!!notes[n]}
                  uid={uid}
                />
              </g>
            </g>
            <g transform={`translate(${x} ${labelY})`}>
              <rect
                x={-12}
                y={-8}
                width={24}
                height={16}
                rx={5}
                fill={active ? "var(--color-primary)" : "var(--color-card)"}
                stroke={active ? "var(--color-primary)" : "var(--color-border)"}
                strokeWidth="1"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className={`text-[10px] font-bold ${active ? "fill-primary-foreground" : "fill-foreground/75"}`}
              >
                {n}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
});

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export function ToothChart({ p }: { p: Patient }) {
  const s = useStore();
  const uid = useId().replace(/:/g, "");
  const [sel, setSel] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [addingProc, setAddingProc] = useState(false);
  const [procTitle, setProcTitle] = useState("");
  const [procCost, setProcCost] = useState("");
  const [procNotes, setProcNotes] = useState("");
  const editable = can.editChart(s.user?.role);
  const canAddProc = !!s.user;
  const cur = sel ? (p.teeth[sel] ?? { status: "healthy" as ToothStatus, note: "" }) : null;
  const [draft, setDraft] = useState("");

  const statuses: Record<number, ToothStatus | undefined> = {};
  const notes: Record<number, boolean> = {};
  for (const [k, v] of Object.entries(p.teeth)) {
    const n = Number(k);
    statuses[n] = v?.status;
    notes[n] = !!v?.note;
  }

  // Mark teeth that have linked procedures
  for (const pr of p.procedures ?? []) {
    for (const part of pr.tooth.split(/[,/|\s]+/).map((x) => x.trim()).filter(Boolean)) {
      const n = Number(part);
      if (n) notes[n] = true;
    }
  }

  const toothProcedures = useMemo((): PatientProcedure[] => {
    if (!sel) return [];
    return (p.procedures ?? []).filter((pr) => toothMatches(pr.tooth, sel));
  }, [p.procedures, sel]);

  const toothSessions = useMemo((): Array<ClinicSession & { procs: PatientProcedure[] }> => {
    if (!sel) return [];
    const procIds = new Set(toothProcedures.map((pr) => pr.id));
    return [...(p.sessions ?? [])]
      .filter((sess) => sess.procedureIds.some((id) => procIds.has(id)))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .map((sess) => ({
        ...sess,
        procs: toothProcedures.filter((pr) => sess.procedureIds.includes(pr.id)),
      }));
  }, [p.sessions, sel, toothProcedures]);

  const pick = useCallback(
    (n: number) => {
      setSel(n);
      setDraft(p.teeth[n]?.note ?? "");
      setSaved(false);
      setAddingProc(false);
    },
    [p.teeth],
  );

  const addProcedureForTooth = () => {
    if (!sel || !procTitle.trim()) return;
    const next: PatientProcedure = {
      id: newId(),
      title: procTitle.trim(),
      tooth: String(sel),
      cost: Math.max(0, Number(procCost) || 0),
      notes: procNotes.trim(),
      createdAt: ymd(new Date()),
    };
    s.setPatients((all) =>
      all.map((x) =>
        x.id === p.id ? { ...x, procedures: [...(x.procedures ?? []), next] } : x,
      ),
    );
    setProcTitle("");
    setProcCost("");
    setProcNotes("");
    setAddingProc(false);
    toast.success(s.t("saved"));
  };

  const update = (patch: Partial<{ status: ToothStatus; note: string }>) => {
    if (!sel || !editable) return;
    s.setPatients((all) =>
      all.map((x) =>
        x.id === p.id
          ? {
              ...x,
              teeth: {
                ...x.teeth,
                [sel]: {
                  ...(x.teeth[sel] ?? { status: "healthy", note: "" }),
                  ...patch,
                  updatedAt: new Date().toISOString().slice(0, 10),
                },
              },
            }
          : x,
      ),
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="card overflow-hidden">
        <div className="border-b px-5 py-3">
          <p className="text-sm font-semibold">{s.t("chart")}</p>
          <p className="text-xs text-muted-foreground">{s.t("selectTooth")}</p>
        </div>
        <div className="bg-[linear-gradient(180deg,#f8fafb_0%,#ffffff_40%,#ffffff_60%,#f8fafb_100%)] p-3 md:p-5 dark:bg-none">
          <p className="mb-1 text-center text-[11px] font-semibold tracking-wide text-muted-foreground">
            {s.t("upper")}
          </p>
          <Arch
            teeth={UPPER}
            upper
            statuses={statuses}
            notes={notes}
            sel={sel}
            onPick={pick}
            uid={uid}
          />
          <div className="mx-auto my-1 flex w-40 items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <div className="h-1.5 w-1.5 rounded-full bg-border" />
            <div className="h-px flex-1 bg-border" />
          </div>
          <Arch
            teeth={LOWER}
            upper={false}
            statuses={statuses}
            notes={notes}
            sel={sel}
            onPick={pick}
            uid={uid}
          />
          <p className="mt-1 text-center text-[11px] font-semibold tracking-wide text-muted-foreground">
            {s.t("lower")}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 border-t bg-muted/30 px-4 py-3">
          {STATUS.map((st) => (
            <span
              key={st.k}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-[11px] font-medium"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: st.accent }} />
              {s.t(st.k)}
            </span>
          ))}
        </div>
      </div>

      <div className="card max-h-[80vh] overflow-y-auto p-5 xl:sticky xl:top-24 xl:self-start">
        {!sel || !cur ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center text-center text-muted-foreground">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <Smile className="h-7 w-7 text-primary" />
            </div>
            <p className="max-w-[14rem] text-sm leading-relaxed">{s.t("selectTooth")}</p>
          </div>
        ) : (
          <div key={sel} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                {sel}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{s.t("tooth")}</div>
                <div className="font-semibold">{s.t(cur.status)}</div>
              </div>
            </div>

            {!editable && (
              <p className="flex items-center gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                <Lock className="h-4 w-4" />
                {s.t("readOnly")}
              </p>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{s.t("status")}</p>
              <select
                className="field"
                disabled={!editable}
                value={cur.status}
                onChange={(e) => {
                  const status = e.target.value as ToothStatus;
                  update({ status, note: draft });
                  setSaved(true);
                  toast.success(s.t("noteSaved"));
                }}
              >
                {STATUS.map((st) => (
                  <option key={st.k} value={st.k}>
                    {s.t(st.k)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{s.t("toothNote")}</p>
              <textarea
                rows={3}
                className="field resize-none"
                value={draft}
                disabled={!editable}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setSaved(false);
                }}
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => {
                    update({ note: draft });
                    setSaved(true);
                    toast.success(s.t("noteSaved"));
                  }}
                  className="btn btn-primary mt-3 w-full"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      {s.t("noteSaved")}
                    </>
                  ) : (
                    s.t("save")
                  )}
                </button>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {s.t("toothProcedures")}
                </p>
                {canAddProc && (
                  <button
                    type="button"
                    onClick={() => setAddingProc(true)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-accent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {s.t("addProcedure")}
                  </button>
                )}
              </div>
              {toothProcedures.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                  {s.t("noToothProcedures")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {toothProcedures.map((pr) => {
                    const done = (p.sessions ?? []).some((sess) =>
                      sess.procedureIds.includes(pr.id),
                    );
                    return (
                      <li
                        key={pr.id}
                        className={`rounded-xl border px-3 py-2.5 text-sm ${done ? "bg-success/5" : "bg-background"}`}
                      >
                        <div className="font-medium">{pr.title}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {pr.cost > 0 && <span>{money(pr.cost, s.t("currency"))}</span>}
                          <span
                            className={
                              done ? "font-semibold text-success" : "text-muted-foreground"
                            }
                          >
                            {done ? s.t("proceduresDone") : s.t("proceduresPending")}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CheckSquare className="h-3.5 w-3.5" />
                {s.t("toothSessions")}
              </p>
              {toothSessions.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                  {s.t("noToothSessions")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {toothSessions.map((sess) => (
                    <li key={sess.id} className="rounded-xl border bg-background px-3 py-2.5 text-sm">
                      <div className="font-mono text-xs font-bold" dir="ltr">
                        {sess.date} · {sess.time}
                      </div>
                      {sess.doctor && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{sess.doctor}</div>
                      )}
                      <ul className="mt-2 space-y-1">
                        {sess.procs.map((pr) => (
                          <li key={pr.id} className="flex items-center gap-1.5 text-xs">
                            <CheckSquare className="h-3 w-3 text-success" />
                            {pr.title}
                          </li>
                        ))}
                      </ul>
                      {sess.notes && (
                        <p className="mt-2 text-xs text-muted-foreground">{sess.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={addingProc && sel != null}
        onClose={() => setAddingProc(false)}
        title={`${s.t("addProcedure")} · #${sel ?? ""}`}
        size="lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={s.t("procedureTitle")} full>
            <input
              className="field"
              value={procTitle}
              onChange={(e) => setProcTitle(e.target.value)}
              placeholder={s.t("procedureTitle")}
              autoFocus
            />
          </Field>
          <Field label={s.t("tooth")}>
            <input className="field bg-muted" value={sel ?? ""} readOnly dir="ltr" />
          </Field>
          <Field label={s.t("costOptional")}>
            <input
              className="field"
              type="number"
              min={0}
              placeholder="—"
              value={procCost}
              onChange={(e) => setProcCost(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{s.t("costOptionalHint")}</p>
          </Field>
          <Field label={s.t("notes")} full>
            <textarea
              className="field resize-none"
              rows={2}
              value={procNotes}
              onChange={(e) => setProcNotes(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setAddingProc(false)} className="btn btn-ghost">
              {s.t("cancel")}
            </button>
            <button
              type="button"
              onClick={addProcedureForTooth}
              disabled={!procTitle.trim()}
              className="btn btn-primary"
            >
              {s.t("save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

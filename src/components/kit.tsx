import type { ReactNode } from "react";
import { useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { useStore, type ApptStatus } from "@/lib/store";

export const APPT_STATUSES: ApptStatus[] = [
  "scheduled",
  "confirmed",
  "waiting",
  "inProgress",
  "done",
  "cancelled",
];

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const width =
    size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-3xl" : "max-w-xl";
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-rise flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-t-3xl border bg-card shadow-soft safe-pb sm:max-h-[92vh] sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25 sm:hidden" />
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-5">
          <h3 className="truncate text-base font-bold sm:text-lg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const statusCls: Record<ApptStatus, string> = {
  scheduled: "bg-info/10 text-info",
  confirmed: "bg-primary/10 text-primary",
  waiting: "bg-accent text-accent-foreground",
  inProgress: "bg-warning/15 text-warning",
  done: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ s }: { s: ApptStatus }) {
  const { t } = useStore();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusCls[s]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(s)}
    </span>
  );
}

export function StatusSelect({
  value,
  onChange,
  disabled,
  size = "sm",
}: {
  value: ApptStatus;
  onChange: (status: ApptStatus) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const { t } = useStore();
  if (disabled) return <StatusBadge s={value} />;
  const pad = size === "md" ? "py-2 pe-9 ps-3 text-sm" : "py-1.5 pe-7 ps-2.5 text-xs";
  return (
    <div className="relative inline-flex max-w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ApptStatus)}
        aria-label={t("status")}
        className={`cursor-pointer appearance-none rounded-xl border-0 font-semibold outline-none ring-1 ring-black/5 transition hover:brightness-95 focus:ring-2 focus:ring-primary/30 ${pad} ${statusCls[value]}`}
      >
        {APPT_STATUSES.map((st) => (
          <option key={st} value={st}>
            {t(st)}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 opacity-60 ${
          size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
        }`}
      />
    </div>
  );
}

export function Avatar({ name, size = "h-10 w-10" }: { name: string; size?: string }) {
  const init = name
    .replace("Dr. ", "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground`}
    >
      {init}
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-[1.75rem]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{action}</div>}
    </div>
  );
}

export function money(amount: number | undefined | null, currency: string) {
  if (amount == null || Number(amount) === 0) return "—";
  return `${amount} ${currency}`;
}
